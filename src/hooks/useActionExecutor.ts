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

export interface ExecutionState {
  messages: Array<{
    id: string;
    text: string;
    type: 'bot' | 'user';
    timestamp: Date;
  }>;
  isTyping: boolean;
  isExecuting: boolean;
  variables: Record<string, any>;
  points: number;
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
    variables: {},
    points: 0,
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
        const { cartItem, quantityChange } = action.config;
        addMessage(`🛒 Количество "${cartItem || 'товар'}" изменено на ${quantityChange || 1}`);
        return null;
      }

      case 'remove_from_cart': {
        const { removeItem } = action.config;
        addMessage(`🗑️ "${removeItem || 'товар'}" удален из корзины`);
        return null;
      }

      case 'show_cart': {
        addMessage(`🛒 **Ваша корзина:**\n• Товар 1 x2 - 200₽\n• Товар 2 x1 - 150₽\n\n**Итого: 550₽**`);
        return null;
      }

      case 'clear_cart': {
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
      variables: {},
      points: 0,
    });
  }, []);

  const abort = useCallback(() => {
    abortRef.current = true;
    setState(prev => ({ ...prev, isExecuting: false, isTyping: false }));
  }, []);

  return {
    state,
    userContext,
    executeActions,
    addMessage,
    reset,
    abort,
    setVariable,
    modifyPoints,
    interpolateVariables: (text: string) => interpolateVariables(text, userContext),
  };
}
