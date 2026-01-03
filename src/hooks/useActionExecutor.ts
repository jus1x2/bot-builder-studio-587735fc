import { useState, useCallback, useRef } from 'react';
import { BotAction, BotMenu } from '@/types/bot';

export interface UserContext {
  first_name: string;
  last_name: string;
  username: string;
  user_id: string;
  date: string;
  time: string;
  [key: string]: string | number;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface ExecutionState {
  messages: Array<{
    id: string;
    text: string;
    type: 'bot' | 'user';
    timestamp: Date;
  }>;
  isTyping: boolean;
  isExecuting: boolean;
  isWaitingForInput: boolean;
  inputConfig?: {
    fieldName: string;
    inputType: string;
    validationRegex?: string;
    errorMessage?: string;
    successAction?: string;
    timeoutSeconds?: number;
    timeoutAction?: string;
  };
  variables: Record<string, any>;
  tags: string[];
  points: number;
  cart: CartItem[];
  scheduledMessages: Array<{
    id: string;
    text: string;
    scheduledAt: Date;
    executed: boolean;
  }>;
}

const DEFAULT_USER_CONTEXT: UserContext = {
  first_name: 'Иван',
  last_name: 'Петров',
  username: 'ivan_petrov',
  user_id: '123456789',
  date: new Date().toLocaleDateString('ru-RU'),
  time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
};

// Replace variables like {first_name} with actual values
export function interpolateVariables(text: string, context: UserContext): string {
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return context[key]?.toString() ?? match;
  });
}

export function useActionExecutor(menus: BotMenu[]) {
  const [state, setState] = useState<ExecutionState>({
    messages: [],
    isTyping: false,
    isExecuting: false,
    isWaitingForInput: false,
    variables: {},
    tags: [],
    points: 0,
    cart: [],
    scheduledMessages: [],
  });

  const [userContext, setUserContext] = useState<UserContext>(DEFAULT_USER_CONTEXT);
  const abortRef = useRef(false);

  const addMessage = useCallback((text: string, type: 'bot' | 'user' = 'bot') => {
    const interpolatedText = interpolateVariables(text, userContext);
    setState(prev => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          id: crypto.randomUUID(),
          text: interpolatedText,
          type,
          timestamp: new Date(),
        },
      ],
    }));
  }, [userContext]);

  const setTyping = useCallback((isTyping: boolean) => {
    setState(prev => ({ ...prev, isTyping }));
  }, []);

  const delay = useCallback((ms: number) => {
    return new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        if (!abortRef.current) resolve();
      }, ms);
      return () => clearTimeout(timeout);
    });
  }, []);

  const setVariable = useCallback((key: string, value: any) => {
    setState(prev => ({
      ...prev,
      variables: { ...prev.variables, [key]: value },
    }));
    setUserContext(prev => ({ ...prev, [key]: value }));
  }, []);

  const modifyPoints = useCallback((amount: number, operation: 'add' | 'subtract' | 'set' = 'add') => {
    setState(prev => {
      let newPoints = prev.points;
      switch (operation) {
        case 'add': newPoints = prev.points + amount; break;
        case 'subtract': newPoints = prev.points - amount; break;
        case 'set': newPoints = amount; break;
      }
      return { ...prev, points: Math.max(0, newPoints) };
    });
  }, []);

  const executeAction = useCallback(async (action: BotAction): Promise<string | null> => {
    if (abortRef.current) return null;

    switch (action.type) {
      case 'show_text': {
        const text = action.config.text || '';
        addMessage(text);
        return null;
      }

      case 'delay': {
        const delayMs = (action.config.seconds || 1) * 1000;
        await delay(delayMs);
        return null;
      }

      case 'typing_indicator': {
        const duration = (action.config.seconds || 2) * 1000;
        setTyping(true);
        await delay(duration);
        setTyping(false);
        return null;
      }

      case 'navigate_menu': {
        return action.config.menuId || null;
      }

      case 'open_url': {
        const url = action.config.url;
        if (url) {
          addMessage(`🔗 Открыть ссылку: ${url}`);
        }
        return null;
      }

      case 'set_field': {
        const { fieldName, fieldValue } = action.config;
        if (fieldName) {
          setVariable(fieldName, fieldValue || '');
          addMessage(`📝 Установлено: ${fieldName} = ${fieldValue || ''}`);
        }
        return null;
      }

      case 'append_to_list': {
        const { listName, appendValue } = action.config;
        if (listName) {
          setState(prev => {
            const list = Array.isArray(prev.variables[listName]) ? prev.variables[listName] : [];
            return {
              ...prev,
              variables: { ...prev.variables, [listName]: [...list, appendValue] },
            };
          });
          addMessage(`📋 Добавлено в ${listName}: ${appendValue}`);
        }
        return null;
      }

      case 'clear_field': {
        const { clearFieldName, clearType } = action.config;
        if (clearFieldName) {
          if (clearType === 'list') {
            setVariable(clearFieldName, []);
          } else {
            setVariable(clearFieldName, '');
          }
          addMessage(`🗑️ Очищено: ${clearFieldName}`);
        }
        return null;
      }

      case 'if_else': {
        const { conditionField, conditionOperator, conditionValue, trueBranch, falseBranch } = action.config;
        const fieldValue = state.variables[conditionField || ''];
        let conditionMet = false;

        switch (conditionOperator) {
          case 'equals': conditionMet = fieldValue == conditionValue; break;
          case 'not_equals': conditionMet = fieldValue != conditionValue; break;
          case 'contains': conditionMet = String(fieldValue).includes(conditionValue || ''); break;
          case 'greater': conditionMet = Number(fieldValue) > Number(conditionValue); break;
          case 'less': conditionMet = Number(fieldValue) < Number(conditionValue); break;
          case 'exists': conditionMet = fieldValue !== undefined && fieldValue !== null && fieldValue !== ''; break;
        }

        addMessage(`🔀 Условие ${conditionField} ${conditionOperator} ${conditionValue}: ${conditionMet ? '✅' : '❌'}`);
        return conditionMet ? (trueBranch || null) : (falseBranch || null);
      }

      case 'check_role': {
        const { roleName, hasRoleAction, noRoleAction } = action.config;
        const userRoles = state.variables['roles'] || [];
        const hasRole = Array.isArray(userRoles) && userRoles.includes(roleName);
        addMessage(`👤 Проверка роли "${roleName}": ${hasRole ? '✅ есть' : '❌ нет'}`);
        return hasRole ? (hasRoleAction || null) : (noRoleAction || null);
      }

      case 'check_value': {
        const { checkField, minValue, maxValue, inRangeAction, outRangeAction } = action.config;
        const value = Number(state.variables[checkField || '']) || 0;
        const min = Number(minValue) || 0;
        const max = Number(maxValue) || 100;
        const inRange = value >= min && value <= max;
        addMessage(`📊 Проверка ${checkField}=${value} в диапазоне [${min}, ${max}]: ${inRange ? '✅' : '❌'}`);
        return inRange ? (inRangeAction || null) : (outRangeAction || null);
      }

      case 'random_result': {
        const outcomes = action.config.outcomes || [];
        if (outcomes.length > 0) {
          const randomIndex = Math.floor(Math.random() * outcomes.length);
          const result = outcomes[randomIndex];
          addMessage(`🎲 Случайный результат: ${result.text || result}`);
          return result.nextAction || null;
        }
        return null;
      }

      case 'weighted_random': {
        const weightedOutcomes = action.config.weightedOutcomes || [];
        if (weightedOutcomes.length > 0) {
          const totalWeight = weightedOutcomes.reduce((sum: number, o: any) => sum + (o.weight || 1), 0);
          let random = Math.random() * totalWeight;
          for (const outcome of weightedOutcomes) {
            random -= outcome.weight || 1;
            if (random <= 0) {
              addMessage(`🎯 Взвешенный результат: ${outcome.text}`);
              return outcome.nextAction || null;
            }
          }
        }
        return null;
      }

      case 'lottery': {
        const { winChance, winAction, loseAction, lotteryPrize } = action.config;
        const won = Math.random() * 100 < (winChance || 10);
        if (won) {
          addMessage(`🎉 Поздравляем! Вы выиграли${lotteryPrize ? `: ${lotteryPrize}` : ''}!`);
          return winAction || null;
        } else {
          addMessage(`😔 К сожалению, вы не выиграли. Попробуйте еще раз!`);
          return loseAction || null;
        }
      }

      case 'modify_points': {
        const { pointsAmount, pointsOperation } = action.config;
        const amount = Number(pointsAmount) || 0;
        modifyPoints(amount, pointsOperation || 'add');
        const opText = pointsOperation === 'subtract' ? 'вычтено' : pointsOperation === 'set' ? 'установлено' : 'добавлено';
        addMessage(`⭐ Очки ${opText}: ${amount}. Текущий баланс: ${state.points + (pointsOperation === 'add' ? amount : pointsOperation === 'subtract' ? -amount : amount - state.points)}`);
        return null;
      }

      case 'leaderboard': {
        addMessage(`🏆 Таблица лидеров:\n1. Игрок1 - 1000 очков\n2. Игрок2 - 850 очков\n3. ${userContext.first_name} - ${state.points} очков`);
        return null;
      }

      case 'quiz': {
        const { quizQuestion, quizOptions, correctAnswer, correctAction, wrongAction } = action.config;
        addMessage(`❓ ${quizQuestion || 'Вопрос викторины'}\n\nВарианты: ${(quizOptions || []).join(', ')}\n\n✅ Правильный ответ: ${correctAnswer}`);
        return null;
      }

      case 'spam_protection': {
        const { maxMessages, timeWindow, blockedAction } = action.config;
        addMessage(`🛡️ Защита от спама активна: макс. ${maxMessages || 5} сообщений за ${timeWindow || 60} сек.`);
        return null;
      }

      case 'show_product': {
        const { productName, productPrice, productDescription } = action.config;
        addMessage(`🛒 **${productName || 'Товар'}**\n💰 Цена: ${productPrice || '0'} ₽\n${productDescription || ''}`);
        return null;
      }

      case 'update_quantity': {
        const { cartItemId, cartItem, quantityChange, quantityOperation } = action.config;
        const itemId = cartItemId || cartItem;
        const change = Number(quantityChange) || 1;
        
        setState(prev => {
          const itemIndex = prev.cart.findIndex(item => 
            item.productId === itemId || item.name === itemId
          );
          if (itemIndex >= 0) {
            const newCart = [...prev.cart];
            const currentQty = newCart[itemIndex].quantity;
            const newQty = quantityOperation === 'set' ? change : 
                          quantityOperation === 'subtract' ? currentQty - change : 
                          currentQty + change;
            newCart[itemIndex].quantity = Math.max(0, newQty);
            return { 
              ...prev, 
              cart: newCart.filter(item => item.quantity > 0) 
            };
          }
          return prev;
        });
        addMessage(`🛒 Количество "${cartItem || 'товар'}" изменено на ${quantityChange || 1}`);
        return null;
      }

      case 'remove_from_cart': {
        const { removeItemId, removeItem } = action.config;
        const itemId = removeItemId || removeItem;
        
        setState(prev => ({
          ...prev,
          cart: prev.cart.filter(item => 
            item.productId !== itemId && item.name !== itemId
          ),
        }));
        addMessage(`🗑️ "${removeItem || 'товар'}" удален из корзины`);
        return null;
      }

      case 'show_cart': {
        if (state.cart.length === 0) {
          addMessage(`🛒 Ваша корзина пуста`);
        } else {
          const cartItems = state.cart.map(item => 
            `• ${item.name} x${item.quantity} — ${item.price * item.quantity} ₽`
          ).join('\n');
          const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
          addMessage(`🛒 **Ваша корзина:**\n${cartItems}\n\n**Итого: ${total} ₽**`);
        }
        return null;
      }

      case 'clear_cart': {
        setState(prev => ({ ...prev, cart: [] }));
        addMessage(`🗑️ Корзина очищена`);
        return null;
      }

      case 'check_stock': {
        const { stockItem, inStockAction, outOfStockAction } = action.config;
        const inStock = Math.random() > 0.3;
        addMessage(`📦 "${stockItem || 'товар'}": ${inStock ? '✅ в наличии' : '❌ нет в наличии'}`);
        return inStock ? (inStockAction || null) : (outOfStockAction || null);
      }

      case 'apply_promo': {
        const { promoCode, promoDiscount, validPromoAction, invalidPromoAction } = action.config;
        const isValid = promoCode && promoCode.length > 3;
        if (isValid) {
          addMessage(`✅ Промокод "${promoCode}" применен! Скидка: ${promoDiscount || 10}%`);
          return validPromoAction || null;
        } else {
          addMessage(`❌ Промокод недействителен`);
          return invalidPromoAction || null;
        }
      }

      case 'on_payment_success': {
        addMessage(`💳 Обработчик успешной оплаты настроен`);
        return null;
      }

      case 'on_first_visit': {
        addMessage(`👋 Обработчик первого визита настроен`);
        return null;
      }

      case 'on_timer': {
        const { timerDelay, timerAction } = action.config;
        addMessage(`⏰ Таймер настроен: ${timerDelay || 60} сек.`);
        if (timerDelay) {
          setTimeout(() => {
            addMessage(`⏰ Таймер сработал!`);
          }, Math.min((timerDelay || 60) * 1000, 5000)); // Max 5 sec for preview
        }
        return null;
      }

      case 'on_threshold': {
        const { thresholdField, thresholdValue, thresholdAction } = action.config;
        addMessage(`📈 Триггер порога: ${thresholdField} >= ${thresholdValue}`);
        return null;
      }

      // ============= MISSING ACTIONS IMPLEMENTATION =============

      case 'change_field': {
        const { changeFieldName, changeAmount, changeOperation } = action.config;
        if (changeFieldName) {
          setState(prev => {
            const currentValue = Number(prev.variables[changeFieldName]) || 0;
            const amount = Number(changeAmount) || 0;
            let newValue: number;
            
            switch (changeOperation) {
              case 'add': newValue = currentValue + amount; break;
              case 'subtract': newValue = currentValue - amount; break;
              case 'multiply': newValue = currentValue * amount; break;
              case 'divide': newValue = amount !== 0 ? currentValue / amount : currentValue; break;
              default: newValue = currentValue + amount;
            }
            
            return {
              ...prev,
              variables: { ...prev.variables, [changeFieldName]: newValue },
            };
          });
          const opSymbol = changeOperation === 'subtract' ? '-' : changeOperation === 'multiply' ? '×' : changeOperation === 'divide' ? '÷' : '+';
          addMessage(`🔢 ${changeFieldName} ${opSymbol} ${changeAmount}`);
        }
        return null;
      }

      case 'add_tag': {
        const { tagName } = action.config;
        if (tagName) {
          setState(prev => {
            if (!prev.tags.includes(tagName)) {
              return { ...prev, tags: [...prev.tags, tagName] };
            }
            return prev;
          });
          addMessage(`🏷️ Тег добавлен: ${tagName}`);
        }
        return null;
      }

      case 'remove_tag': {
        const { tagName } = action.config;
        if (tagName) {
          setState(prev => ({
            ...prev,
            tags: prev.tags.filter(t => t !== tagName),
          }));
          addMessage(`🏷️ Тег удалён: ${tagName}`);
        }
        return null;
      }

      case 'check_subscription': {
        const { channelId, subscribedAction, notSubscribedAction } = action.config;
        // В превью симулируем случайный результат
        const isSubscribed = Math.random() > 0.5;
        addMessage(`📢 Проверка подписки на ${channelId || '@channel'}: ${isSubscribed ? '✅ подписан' : '❌ не подписан'}`);
        return isSubscribed ? (subscribedAction || null) : (notSubscribedAction || null);
      }

      case 'wait_response': {
        const { 
          waitFieldName, 
          waitInputType, 
          waitValidation, 
          waitErrorMessage, 
          waitSuccessAction,
          waitTimeoutSeconds,
          waitTimeoutAction 
        } = action.config;
        
        setState(prev => ({
          ...prev,
          isWaitingForInput: true,
          inputConfig: {
            fieldName: waitFieldName || 'response',
            inputType: waitInputType || 'text',
            validationRegex: waitValidation,
            errorMessage: waitErrorMessage || 'Неверный формат ввода',
            successAction: waitSuccessAction,
            timeoutSeconds: waitTimeoutSeconds,
            timeoutAction: waitTimeoutAction,
          },
        }));
        
        addMessage(`⏳ Ожидание ${waitInputType === 'phone' ? 'телефона' : waitInputType === 'email' ? 'email' : waitInputType === 'number' ? 'числа' : 'ответа'}...`);
        
        // В превью симулируем ввод через 2 секунды
        await delay(2000);
        const simulatedInput = waitInputType === 'phone' ? '+7 999 123 45 67' : 
                               waitInputType === 'email' ? 'user@example.com' : 
                               waitInputType === 'number' ? '42' : 'Да';
        
        setVariable(waitFieldName || 'response', simulatedInput);
        addMessage(simulatedInput, 'user');
        setState(prev => ({ ...prev, isWaitingForInput: false, inputConfig: undefined }));
        
        return waitSuccessAction || null;
      }

      case 'keyword_trigger': {
        const { keywords, keywordMatchAction, keywordNoMatchAction } = action.config;
        const keywordList = (keywords || '').split(',').map((k: string) => k.trim()).filter(Boolean);
        addMessage(`🔍 Триггер по ключевым словам: ${keywordList.join(', ') || 'не указаны'}`);
        // Симуляция совпадения
        const matched = keywordList.length > 0 && Math.random() > 0.3;
        if (matched) {
          addMessage(`✅ Найдено совпадение с "${keywordList[0]}"`);
          return keywordMatchAction || null;
        } else {
          addMessage(`❌ Совпадений не найдено`);
          return keywordNoMatchAction || null;
        }
      }

      case 'no_response': {
        const { noResponseTimeout, noResponseAction } = action.config;
        addMessage(`⏰ Обработчик "нет ответа" через ${noResponseTimeout || 60} сек.`);
        // В превью симулируем быстро
        setTimeout(() => {
          if (!abortRef.current) {
            addMessage(`⏰ Пользователь не ответил вовремя`);
          }
        }, Math.min((noResponseTimeout || 60) * 1000, 3000));
        return null;
      }

      case 'wrong_response': {
        const { wrongResponseMessage, wrongResponseAction, maxAttempts } = action.config;
        addMessage(`❌ Обработчик неверного ответа настроен (макс. попыток: ${maxAttempts || 3})`);
        addMessage(`Сообщение при ошибке: "${wrongResponseMessage || 'Неверный ответ, попробуйте ещё раз'}"`);
        return null;
      }

      case 'add_to_cart': {
        const { productId, productName, productPrice, productQuantity } = action.config;
        const name = productName || 'Товар';
        const price = Number(productPrice) || 0;
        const quantity = Number(productQuantity) || 1;
        
        setState(prev => {
          const existingIndex = prev.cart.findIndex(item => item.productId === productId);
          if (existingIndex >= 0) {
            const newCart = [...prev.cart];
            newCart[existingIndex].quantity += quantity;
            return { ...prev, cart: newCart };
          } else {
            return {
              ...prev,
              cart: [...prev.cart, { productId: productId || crypto.randomUUID(), name, price, quantity }],
            };
          }
        });
        addMessage(`🛒 Добавлено в корзину: ${name} x${quantity} (${price * quantity} ₽)`);
        return null;
      }

      case 'process_payment': {
        const { paymentAmount, paymentMethod, paymentSuccessAction, paymentFailAction } = action.config;
        const amount = paymentAmount || state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        
        addMessage(`💳 Обработка платежа: ${amount} ₽`);
        addMessage(`Способ оплаты: ${paymentMethod || 'Telegram Payments'}`);
        
        // Симуляция оплаты
        setTyping(true);
        await delay(2000);
        setTyping(false);
        
        const success = Math.random() > 0.2;
        if (success) {
          addMessage(`✅ Оплата успешна! Чек #${Math.floor(Math.random() * 100000)}`);
          setState(prev => ({ ...prev, cart: [] })); // Очищаем корзину
          return paymentSuccessAction || null;
        } else {
          addMessage(`❌ Ошибка оплаты. Попробуйте позже.`);
          return paymentFailAction || null;
        }
      }

      case 'request_input': {
        const { 
          inputFieldName, 
          inputPrompt, 
          inputType, 
          inputValidation, 
          inputErrorMessage, 
          inputSuccessAction 
        } = action.config;
        
        if (inputPrompt) {
          addMessage(inputPrompt);
        }
        
        setState(prev => ({
          ...prev,
          isWaitingForInput: true,
          inputConfig: {
            fieldName: inputFieldName || 'input',
            inputType: inputType || 'text',
            validationRegex: inputValidation,
            errorMessage: inputErrorMessage || 'Неверный формат',
            successAction: inputSuccessAction,
          },
        }));
        
        // Симуляция ввода
        await delay(1500);
        const simulatedValue = inputType === 'phone' ? '+7 999 000 00 00' : 
                              inputType === 'email' ? 'test@test.com' : 
                              inputType === 'number' ? '123' : 'Ответ пользователя';
        
        setVariable(inputFieldName || 'input', simulatedValue);
        addMessage(simulatedValue, 'user');
        setState(prev => ({ ...prev, isWaitingForInput: false, inputConfig: undefined }));
        
        return inputSuccessAction || null;
      }

      case 'send_notification': {
        const { notificationMessage, notificationRecipient } = action.config;
        addMessage(`🔔 Уведомление отправлено${notificationRecipient ? ` для ${notificationRecipient}` : ''}: "${notificationMessage || 'Уведомление'}"`);
        return null;
      }

      case 'schedule_message': {
        const { scheduleMessage, scheduleDelayMinutes, scheduleDateTime } = action.config;
        const delayText = scheduleDateTime || `через ${scheduleDelayMinutes || 60} мин.`;
        
        const scheduledId = crypto.randomUUID();
        setState(prev => ({
          ...prev,
          scheduledMessages: [
            ...prev.scheduledMessages,
            {
              id: scheduledId,
              text: scheduleMessage || 'Запланированное сообщение',
              scheduledAt: new Date(Date.now() + (scheduleDelayMinutes || 60) * 60000),
              executed: false,
            },
          ],
        }));
        
        addMessage(`📅 Запланировано сообщение ${delayText}: "${scheduleMessage || 'Сообщение'}"`);
        
        // В превью показываем через 3 сек
        setTimeout(() => {
          if (!abortRef.current) {
            addMessage(`📬 [Запланированное]: ${scheduleMessage || 'Сообщение'}`);
          }
        }, 3000);
        
        return null;
      }

      case 'broadcast': {
        const { broadcastMessage, broadcastFilter, broadcastTag } = action.config;
        const filterText = broadcastFilter === 'tag' ? `с тегом "${broadcastTag}"` : 
                          broadcastFilter === 'all' ? 'всем' : 
                          broadcastFilter === 'active' ? 'активным' : 'всем';
        
        addMessage(`📢 Рассылка ${filterText}:`);
        addMessage(`"${broadcastMessage || 'Сообщение рассылки'}"`);
        addMessage(`📊 Отправлено: ~1,234 пользователям`);
        
        return null;
      }

      default:
        addMessage(`⚙️ Действие: ${action.type}`);
        return null;
    }
  }, [addMessage, delay, setTyping, setVariable, modifyPoints, state.variables, state.points, userContext]);

  const executeActions = useCallback(async (actions: BotAction[]): Promise<string | null> => {
    abortRef.current = false;
    setState(prev => ({ ...prev, isExecuting: true }));

    const sortedActions = [...actions].sort((a, b) => a.order - b.order);
    let navigateToMenuId: string | null = null;

    for (const action of sortedActions) {
      if (abortRef.current) break;

      const result = await executeAction(action);
      if (result) {
        navigateToMenuId = result;
        break; // Stop execution on navigation
      }
    }

    setState(prev => ({ ...prev, isExecuting: false }));
    return navigateToMenuId;
  }, [executeAction]);

  const reset = useCallback(() => {
    abortRef.current = true;
    setState({
      messages: [],
      isTyping: false,
      isExecuting: false,
      isWaitingForInput: false,
      variables: {},
      tags: [],
      points: 0,
      cart: [],
      scheduledMessages: [],
    });
  }, []);

  const abort = useCallback(() => {
    abortRef.current = true;
    setState(prev => ({ ...prev, isExecuting: false, isTyping: false, isWaitingForInput: false }));
  }, []);

  const addTag = useCallback((tagName: string) => {
    setState(prev => {
      if (!prev.tags.includes(tagName)) {
        return { ...prev, tags: [...prev.tags, tagName] };
      }
      return prev;
    });
  }, []);

  const removeTag = useCallback((tagName: string) => {
    setState(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagName),
    }));
  }, []);

  const addToCart = useCallback((item: CartItem) => {
    setState(prev => {
      const existingIndex = prev.cart.findIndex(i => i.productId === item.productId);
      if (existingIndex >= 0) {
        const newCart = [...prev.cart];
        newCart[existingIndex].quantity += item.quantity;
        return { ...prev, cart: newCart };
      }
      return { ...prev, cart: [...prev.cart, item] };
    });
  }, []);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    setState(prev => ({
      ...prev,
      cart: prev.cart.map(item =>
        item.productId === productId ? { ...item, quantity: Math.max(0, quantity) } : item
      ).filter(item => item.quantity > 0),
    }));
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setState(prev => ({
      ...prev,
      cart: prev.cart.filter(item => item.productId !== productId),
    }));
  }, []);

  const clearCart = useCallback(() => {
    setState(prev => ({ ...prev, cart: [] }));
  }, []);

  const getCartTotal = useCallback(() => {
    return state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [state.cart]);

  return {
    state,
    userContext,
    executeActions,
    addMessage,
    reset,
    abort,
    setVariable,
    modifyPoints,
    addTag,
    removeTag,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    interpolateVariables: (text: string) => interpolateVariables(text, userContext),
  };
}
