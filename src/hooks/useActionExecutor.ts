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
        // Используем ключи из формы: field, operation, amount
        const { field, operation, amount } = action.config;
        if (field) {
          setState(prev => {
            const currentValue = Number(prev.variables[field]) || 0;
            const changeAmount = Number(amount) || 0;
            let newValue: number;
            
            switch (operation) {
              case 'add': newValue = currentValue + changeAmount; break;
              case 'subtract': newValue = currentValue - changeAmount; break;
              case 'multiply': newValue = currentValue * changeAmount; break;
              case 'divide': newValue = changeAmount !== 0 ? currentValue / changeAmount : currentValue; break;
              default: newValue = currentValue + changeAmount;
            }
            
            return {
              ...prev,
              variables: { ...prev.variables, [field]: newValue },
            };
          });
          const opSymbol = operation === 'subtract' ? '-' : operation === 'multiply' ? '×' : operation === 'divide' ? '÷' : '+';
          addMessage(`🔢 ${field} ${opSymbol} ${amount}`);
        }
        return null;
      }

      case 'add_tag': {
        // Используем ключ из формы: tag
        const { tag } = action.config;
        if (tag) {
          setState(prev => {
            if (!prev.tags.includes(tag)) {
              return { ...prev, tags: [...prev.tags, tag] };
            }
            return prev;
          });
          addMessage(`🏷️ Тег добавлен: ${tag}`);
        }
        return null;
      }

      case 'remove_tag': {
        // Используем ключ из формы: tag
        const { tag } = action.config;
        if (tag) {
          setState(prev => ({
            ...prev,
            tags: prev.tags.filter(t => t !== tag),
          }));
          addMessage(`🏷️ Тег удалён: ${tag}`);
        }
        return null;
      }

      case 'check_subscription': {
        // Используем ключи из формы: channel, subscribedMenuId, notSubscribedMenuId
        const { channel, subscribedMenuId, notSubscribedMenuId } = action.config;
        // В превью симулируем случайный результат
        const isSubscribed = Math.random() > 0.5;
        addMessage(`📢 Проверка подписки на ${channel || '@channel'}: ${isSubscribed ? '✅ подписан' : '❌ не подписан'}`);
        return isSubscribed ? (subscribedMenuId || null) : (notSubscribedMenuId || null);
      }

      case 'wait_response': {
        // Расширенные ключи: timeout, saveToField, timeoutAction, timeoutMenuId, validationType
        // successMessage, successMenuId, errorMessage, errorMenuId, maxRetries
        const { 
          timeout, 
          saveToField, 
          timeoutAction, 
          timeoutMenuId,
          validationType,
          successMessage,
          successMenuId,
          errorMessage,
          errorMenuId,
          maxRetries
        } = action.config;
        
        setState(prev => ({
          ...prev,
          isWaitingForInput: true,
          inputConfig: {
            fieldName: saveToField || 'response',
            inputType: validationType || 'text',
            errorMessage: errorMessage || 'Неверный формат ввода',
            successAction: successMenuId,
            timeoutSeconds: timeout,
            timeoutAction: timeoutAction,
          },
        }));
        
        const inputTypeLabel = validationType === 'phone' ? 'телефона' : 
                               validationType === 'email' ? 'email' : 
                               validationType === 'number' ? 'числа' : 'ответа';
        addMessage(`⏳ Ожидание ${inputTypeLabel}...`);
        
        // В превью симулируем ввод и проверку валидации
        await delay(2000);
        
        // Симулируем ввод с проверкой валидации
        const isValidInput = Math.random() > 0.3; // 70% шанс правильного ввода для демо
        
        if (isValidInput) {
          // Правильный ввод
          const simulatedInput = validationType === 'phone' ? '+7 999 123 45 67' : 
                                 validationType === 'email' ? 'user@example.com' : 
                                 validationType === 'number' ? '42' : 'Да';
          
          setVariable(saveToField || 'response', simulatedInput);
          addMessage(simulatedInput, 'user');
          
          if (successMessage) {
            addMessage(successMessage);
          }
          
          setState(prev => ({ ...prev, isWaitingForInput: false, inputConfig: undefined }));
          
          // Переход к экрану успеха
          if (successMenuId) {
            return successMenuId;
          }
        } else {
          // Неправильный ввод - симуляция
          const badInput = validationType === 'phone' ? 'abc123' : 
                           validationType === 'email' ? 'not-email' : 
                           validationType === 'number' ? 'текст' : '';
          
          addMessage(badInput || '(пустой ответ)', 'user');
          addMessage(errorMessage || '❌ Неверный формат. Попробуйте ещё раз');
          
          // В реальном боте здесь будет цикл повторов
          // Для превью просто переходим к меню ошибки если установлено
          setState(prev => ({ ...prev, isWaitingForInput: false, inputConfig: undefined }));
          
          if (errorMenuId) {
            addMessage(`⚠️ Исчерпаны попытки (макс: ${maxRetries || 3})`);
            return errorMenuId;
          }
        }
        
        // Если есть timeoutAction === 'menu', вернуть timeoutMenuId
        if (timeoutAction === 'menu' && timeoutMenuId) {
          return timeoutMenuId;
        }
        return null;
      }

      case 'keyword_trigger': {
        // Используем ключи из формы: keywords (массив), matchType, caseSensitive, targetMenuId
        const { keywords, matchType, targetMenuId } = action.config;
        const keywordList = Array.isArray(keywords) ? keywords : [];
        addMessage(`🔍 Триггер по ключевым словам: ${keywordList.join(', ') || 'не указаны'}`);
        addMessage(`Режим поиска: ${matchType || 'contains'}`);
        // Симуляция совпадения
        const matched = keywordList.length > 0 && Math.random() > 0.3;
        if (matched) {
          addMessage(`✅ Найдено совпадение с "${keywordList[0]}"`);
          return targetMenuId || null;
        } else {
          addMessage(`❌ Совпадений не найдено`);
          return null;
        }
      }

      case 'no_response': {
        // Используем ключи из формы: timeout, action, reminderText, targetMenuId, tag
        const { timeout, action: responseAction, reminderText, targetMenuId, tag } = action.config;
        addMessage(`⏰ Обработчик "нет ответа" через ${timeout || 300} сек.`);
        addMessage(`Действие: ${responseAction || 'send_reminder'}`);
        // В превью симулируем быстро
        setTimeout(() => {
          if (!abortRef.current) {
            if (responseAction === 'send_reminder') {
              addMessage(`📨 Напоминание: ${reminderText || 'Вы ещё здесь?'}`);
            } else if (responseAction === 'add_tag' && tag) {
              addMessage(`🏷️ Добавлен тег: ${tag}`);
            } else {
              addMessage(`⏰ Пользователь не ответил вовремя`);
            }
          }
        }, Math.min((timeout || 300) * 1000, 3000));
        return null;
      }

      case 'wrong_response': {
        // Используем ключи из формы: message, maxRetries, retryAction, targetMenuId
        const { message, maxRetries, retryAction } = action.config;
        addMessage(`❌ Обработчик неверного ответа настроен (макс. попыток: ${maxRetries || 3})`);
        addMessage(`Сообщение при ошибке: "${message || 'Неверный ответ, попробуйте ещё раз'}"`);
        addMessage(`Действие: ${retryAction || 'retry'}`);
        return null;
      }

      case 'add_to_cart': {
        // Используем ключи из формы: productId, name, price, currency, quantity
        const { productId, name, price, quantity } = action.config;
        const productName = name || 'Товар';
        const productPrice = Number(price) || 0;
        const productQuantity = Number(quantity) || 1;
        
        setState(prev => {
          const existingIndex = prev.cart.findIndex(item => item.productId === productId);
          if (existingIndex >= 0) {
            const newCart = [...prev.cart];
            newCart[existingIndex].quantity += productQuantity;
            return { ...prev, cart: newCart };
          } else {
            return {
              ...prev,
              cart: [...prev.cart, { 
                productId: productId || crypto.randomUUID(), 
                name: productName, 
                price: productPrice, 
                quantity: productQuantity 
              }],
            };
          }
        });
        addMessage(`🛒 Добавлено в корзину: ${productName} x${productQuantity} (${productPrice * productQuantity} ₽)`);
        return null;
      }

      case 'process_payment': {
        // Используем ключи из формы: provider, successMenuId, failMenuId
        const { provider, successMenuId, failMenuId } = action.config;
        const amount = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        
        const providerName = provider === 'yookassa' ? 'ЮKassa' : 
                            provider === 'stripe' ? 'Stripe' : 'Telegram Stars';
        
        addMessage(`💳 Обработка платежа: ${amount} ₽`);
        addMessage(`Способ оплаты: ${providerName}`);
        
        // Симуляция оплаты
        setTyping(true);
        await delay(2000);
        setTyping(false);
        
        const success = Math.random() > 0.2;
        if (success) {
          addMessage(`✅ Оплата успешна! Чек #${Math.floor(Math.random() * 100000)}`);
          setState(prev => ({ ...prev, cart: [] })); // Очищаем корзину
          return successMenuId || null;
        } else {
          addMessage(`❌ Ошибка оплаты. Попробуйте позже.`);
          return failMenuId || null;
        }
      }

      case 'request_input': {
        // Используем ключи из формы: prompt, validationType, field
        const { prompt, validationType, field } = action.config;
        
        if (prompt) {
          addMessage(prompt);
        }
        
        setState(prev => ({
          ...prev,
          isWaitingForInput: true,
          inputConfig: {
            fieldName: field || 'input',
            inputType: validationType || 'text',
            errorMessage: 'Неверный формат',
          },
        }));
        
        // Симуляция ввода
        await delay(1500);
        const simulatedValue = validationType === 'phone' ? '+7 999 000 00 00' : 
                              validationType === 'email' ? 'test@test.com' : 
                              validationType === 'number' ? '123' : 'Ответ пользователя';
        
        setVariable(field || 'input', simulatedValue);
        addMessage(simulatedValue, 'user');
        setState(prev => ({ ...prev, isWaitingForInput: false, inputConfig: undefined }));
        
        return null;
      }

      case 'send_notification': {
        // Используем ключи из формы: message, silent
        const { message, silent } = action.config;
        addMessage(`🔔 Уведомление${silent ? ' (тихо)' : ''}: "${message || 'Уведомление'}"`);
        return null;
      }

      case 'schedule_message': {
        // Используем ключи из формы: delayMinutes, message
        const { delayMinutes, message } = action.config;
        
        const scheduledId = crypto.randomUUID();
        setState(prev => ({
          ...prev,
          scheduledMessages: [
            ...prev.scheduledMessages,
            {
              id: scheduledId,
              text: message || 'Запланированное сообщение',
              scheduledAt: new Date(Date.now() + (delayMinutes || 60) * 60000),
              executed: false,
            },
          ],
        }));
        
        addMessage(`📅 Запланировано сообщение через ${delayMinutes || 60} мин.: "${message || 'Сообщение'}"`);
        
        // В превью показываем через 3 сек
        setTimeout(() => {
          if (!abortRef.current) {
            addMessage(`📬 [Запланированное]: ${message || 'Сообщение'}`);
          }
        }, 3000);
        
        return null;
      }

      case 'broadcast': {
        // Используем ключи из формы: segment, tag, message
        const { segment, tag, message } = action.config;
        const filterText = segment === 'tag' ? `с тегом "${tag}"` : 
                          segment === 'all' ? 'всем' : 
                          segment === 'active' ? 'активным' : 
                          segment === 'inactive' ? 'неактивным' : 'всем';
        
        addMessage(`📢 Рассылка ${filterText}:`);
        addMessage(`"${message || 'Сообщение рассылки'}"`);
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
