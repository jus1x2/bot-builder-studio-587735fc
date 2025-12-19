import { useState, useEffect, forwardRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MoreVertical, Send, RotateCcw } from 'lucide-react';
import { BotMenu, BotButton, BotActionNode } from '@/types/bot';
import { interpolateVariables, UserContext } from '@/hooks/useActionExecutor';

// Simple Telegram-style markdown parser
function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');

  return lines.map((line, lineIndex) => {
    const lineElements: React.ReactNode[] = [];
    const combinedRegex = /(\*\*(.+?)\*\*|\*([^*]+)\*|__(.+?)__|_([^_]+)_|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;

    let lastIndex = 0;
    let match;

    while ((match = combinedRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        lineElements.push(line.slice(lastIndex, match.index));
      }

      const fullMatch = match[0];

      if (fullMatch.startsWith('**') && fullMatch.endsWith('**')) {
        lineElements.push(<strong key={`b-${lineIndex}-${match.index}`}>{match[2]}</strong>);
      } else if (fullMatch.startsWith('*') && fullMatch.endsWith('*')) {
        lineElements.push(<strong key={`b-${lineIndex}-${match.index}`}>{match[3]}</strong>);
      } else if (fullMatch.startsWith('__') && fullMatch.endsWith('__')) {
        lineElements.push(<em key={`i-${lineIndex}-${match.index}`}>{match[4]}</em>);
      } else if (fullMatch.startsWith('_') && fullMatch.endsWith('_')) {
        lineElements.push(<em key={`i-${lineIndex}-${match.index}`}>{match[5]}</em>);
      } else if (fullMatch.startsWith('`') && fullMatch.endsWith('`')) {
        lineElements.push(<code key={`c-${lineIndex}-${match.index}`} className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{match[6]}</code>);
      } else if (fullMatch.startsWith('[')) {
        lineElements.push(<a key={`a-${lineIndex}-${match.index}`} href={match[8]} className="text-primary underline" target="_blank" rel="noopener noreferrer">{match[7]}</a>);
      }

      lastIndex = match.index + fullMatch.length;
    }

    if (lastIndex < line.length) {
      lineElements.push(line.slice(lastIndex));
    }

    if (lineIndex < lines.length - 1) {
      lineElements.push(<br key={`br-${lineIndex}`} />);
    }

    return lineElements.length > 0 ? lineElements : line;
  }).flat();
}

// Typing animation hook
function useTypingAnimation(text: string, speed: number = 30) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);

    if (!text) return;

    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return { displayedText, isComplete };
}

// Typing indicator component
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-[85%]"
    >
      <div className="bg-card rounded-2xl rounded-tl-md px-4 py-3 shadow-sm inline-flex items-center gap-1">
        <motion.span
          className="w-2 h-2 bg-muted-foreground/50 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
        />
        <motion.span
          className="w-2 h-2 bg-muted-foreground/50 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
        />
        <motion.span
          className="w-2 h-2 bg-muted-foreground/50 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
        />
      </div>
    </motion.div>
  );
}

interface BotPreviewProps {
  menu: BotMenu | null;
  menus?: BotMenu[];
  actionNodes?: BotActionNode[];
  onButtonClick?: (buttonId: string) => void;
  onNavigateToMenu?: (menuId: string) => void;
  botName?: string;
  onBack?: () => void;
  canGoBack?: boolean;
}

const DEFAULT_USER_CONTEXT: UserContext = {
  first_name: 'Иван',
  last_name: 'Петров',
  username: 'ivan_petrov',
  user_id: '123456789',
  date: new Date().toLocaleDateString('ru-RU'),
  time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
};

export const BotPreview = forwardRef<HTMLDivElement, BotPreviewProps>(function BotPreview({
  menu,
  menus = [],
  actionNodes = [],
  onButtonClick,
  onNavigateToMenu,
  botName = 'Мой Бот',
  onBack,
  canGoBack = false
}: BotPreviewProps, ref) {
  const [direction, setDirection] = useState(1);
  const [prevMenuId, setPrevMenuId] = useState<string | null>(null);
  const [userContext] = useState<UserContext>(DEFAULT_USER_CONTEXT);
  const [actionMessages, setActionMessages] = useState<Array<{ id: string; text: string; type: 'bot' | 'user' }>>([]);
  const [isTypingIndicator, setIsTypingIndicator] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const interpolatedMessage = menu?.messageText
    ? interpolateVariables(menu.messageText, userContext)
    : '';

  const { displayedText, isComplete } = useTypingAnimation(interpolatedMessage, 25);

  // Track if we're in the middle of an action chain that will navigate
  const [pendingMessages, setPendingMessages] = useState<Array<{ id: string; text: string; type: 'bot' | 'user' }>>([]);

  useEffect(() => {
    if (menu && prevMenuId !== menu.id) {
      setPrevMenuId(menu.id);
      // Keep action messages - they're intentionally preserved during chain execution
      setIsTypingIndicator(false);
      setIsExecuting(false);
    }
  }, [menu, prevMenuId]);

  const executeActionNode = useCallback(async (actionNode: BotActionNode): Promise<{ navigateMenuId: string | null; nextActionId?: string }> => {
    // Helper to get next node info
    const getNextNode = () => {
      if (actionNode.nextNodeType === 'menu' && actionNode.nextNodeId) {
        return { navigateMenuId: actionNode.nextNodeId };
      } else if (actionNode.nextNodeType === 'action' && actionNode.nextNodeId) {
        return { navigateMenuId: null, nextActionId: actionNode.nextNodeId };
      }
      return { navigateMenuId: null };
    };

    switch (actionNode.type) {
      case 'show_text': {
        const text = actionNode.config.text || '';
        const interpolated = interpolateVariables(text, userContext);
        setActionMessages(prev => [...prev, { id: crypto.randomUUID(), text: interpolated, type: 'bot' }]);
        // Add delay so user can see the message before menu transition
        await new Promise(resolve => setTimeout(resolve, 800));
        // Return next node info to continue chain
        return getNextNode();
      }
      case 'delay': {
        const delayMs = (actionNode.config.seconds || 1) * 1000;
        if (actionNode.config.showTyping) setIsTypingIndicator(true);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        if (actionNode.config.showTyping) setIsTypingIndicator(false);
        return getNextNode();
      }
      case 'typing_indicator': {
        const duration = (actionNode.config.seconds || 2) * 1000;
        setIsTypingIndicator(true);
        await new Promise(resolve => setTimeout(resolve, duration));
        setIsTypingIndicator(false);
        return getNextNode();
      }
      case 'navigate_menu':
        return { navigateMenuId: actionNode.config.menuId || null };
      case 'open_url': {
        const url = actionNode.config.url;
        if (url) window.open(url, '_blank');
        return getNextNode();
      }
      case 'random_result': {
        const outcomeCount = actionNode.config.outcomeCount || 2;
        const randomIndex = Math.floor(Math.random() * outcomeCount);
        const outcomes = actionNode.outcomes || [];
        const selectedOutcome = outcomes[randomIndex];
        
        // Only show notification if explicitly enabled
        if (actionNode.config.showNotification === true) {
          setActionMessages(prev => [...prev, { 
            id: crypto.randomUUID(), 
            text: `🎲 Случайный результат: Исход ${randomIndex + 1} (${Math.round(100 / outcomeCount)}%)`, 
            type: 'bot' 
          }]);
        }
        
        if (selectedOutcome?.targetId && selectedOutcome.targetType === 'menu') {
          return { navigateMenuId: selectedOutcome.targetId };
        } else if (selectedOutcome?.targetId && selectedOutcome.targetType === 'action') {
          return { navigateMenuId: null, nextActionId: selectedOutcome.targetId };
        }
        break;
      }
      case 'weighted_random': {
        const outcomes = actionNode.config.outcomes || [];
        if (outcomes.length > 0) {
          const totalWeight = outcomes.reduce((sum: number, o: any) => sum + (o.weight || 1), 0);
          let random = Math.random() * totalWeight;
          for (let i = 0; i < outcomes.length; i++) {
            random -= outcomes[i].weight || 1;
            if (random <= 0) {
              const nodeOutcomes = actionNode.outcomes || [];
              const selectedOutcome = nodeOutcomes[i];
              const percent = Math.round((outcomes[i].weight / totalWeight) * 100);
              
              // Only show notification if explicitly enabled
              if (actionNode.config.showNotification === true) {
                setActionMessages(prev => [...prev, { 
                  id: crypto.randomUUID(), 
                  text: `🎯 Взвешенный результат: ${outcomes[i].label || `Исход ${i + 1}`} (${percent}%)`, 
                  type: 'bot' 
                }]);
              }
              
              if (selectedOutcome?.targetId && selectedOutcome.targetType === 'menu') {
                return { navigateMenuId: selectedOutcome.targetId };
              } else if (selectedOutcome?.targetId && selectedOutcome.targetType === 'action') {
                return { navigateMenuId: null, nextActionId: selectedOutcome.targetId };
              }
              break;
            }
          }
        }
        break;
      }
      case 'if_else': {
        // Simulate condition check
        const { checkType, operator, value } = actionNode.config;
        let conditionResult = false;
        
        // In preview, we just randomly pick yes/no or base on simple logic
        if (checkType === 'tag') {
          conditionResult = Math.random() > 0.5;
        } else if (operator === 'exists') {
          conditionResult = true;
        } else {
          conditionResult = Math.random() > 0.5;
        }
        
        setActionMessages(prev => [...prev, { 
          id: crypto.randomUUID(), 
          text: `🔀 Условие: ${conditionResult ? '✅ Да' : '❌ Нет'}`, 
          type: 'bot' 
        }]);
        
        const outcomes = actionNode.outcomes || [];
        const selectedOutcome = conditionResult 
          ? outcomes.find((o: any) => o.id === 'yes')
          : outcomes.find((o: any) => o.id === 'no');
        
        if (selectedOutcome?.targetId && selectedOutcome.targetType === 'menu') {
          return { navigateMenuId: selectedOutcome.targetId };
        } else if (selectedOutcome?.targetId && selectedOutcome.targetType === 'action') {
          return { navigateMenuId: null, nextActionId: selectedOutcome.targetId };
        }
        break;
      }
      case 'request_input': {
        const promptText = actionNode.config.promptText || 'Введите значение:';
        setActionMessages(prev => [...prev, { 
          id: crypto.randomUUID(), 
          text: interpolateVariables(promptText, userContext), 
          type: 'bot' 
        }]);
        // Simulate user response
        await new Promise(resolve => setTimeout(resolve, 500));
        setActionMessages(prev => [...prev, { 
          id: crypto.randomUUID(), 
          text: 'Пример ответа', 
          type: 'user' 
        }]);
        break;
      }
      case 'quiz': {
        const questions = actionNode.config.questions || [];
        const pointsPerCorrect = actionNode.config.pointsPerCorrect || 1;
        let score = 0;
        
        for (const question of questions) {
          setActionMessages(prev => [...prev, { 
            id: crypto.randomUUID(), 
            text: `❓ ${question.text || 'Вопрос'}`, 
            type: 'bot' 
          }]);
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Simulate user answering (randomly correct or not)
          const isCorrect = Math.random() > 0.5;
          const correctAnswer = question.answers?.find((a: any) => a.correct);
          if (isCorrect && correctAnswer) {
            score += pointsPerCorrect;
            setActionMessages(prev => [...prev, { 
              id: crypto.randomUUID(), 
              text: correctAnswer.text || 'Ответ', 
              type: 'user' 
            }]);
          } else {
            const wrongAnswer = question.answers?.find((a: any) => !a.correct);
            setActionMessages(prev => [...prev, { 
              id: crypto.randomUUID(), 
              text: wrongAnswer?.text || 'Неверный ответ', 
              type: 'user' 
            }]);
          }
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        if (actionNode.config.showResult !== false) {
          const total = questions.length * pointsPerCorrect;
          const percent = Math.round((score / total) * 100);
          let resultText = actionNode.config.resultText || 'Вы набрали {score} из {total} баллов!';
          resultText = resultText
            .replace('{score}', String(score))
            .replace('{total}', String(total))
            .replace('{percent}', `${percent}%`);
          
          setActionMessages(prev => [...prev, { 
            id: crypto.randomUUID(), 
            text: `🏆 ${resultText}`, 
            type: 'bot' 
          }]);
        }
        break;
      }
      case 'schedule_message': {
        // Timer action - wait for configured delay then continue to next node
        const delay = actionNode.config.delay || 5;
        const unit = actionNode.config.delayUnit || 'seconds';
        const delayMs = (
          unit === 'minutes' ? delay * 60 * 1000 :
          unit === 'hours' ? delay * 60 * 60 * 1000 :
          delay * 1000
        );
        
        // Limit preview delay to max 5 seconds for faster testing
        const previewDelay = Math.min(delayMs, 5000);
        
        setActionMessages(prev => [...prev, { 
          id: crypto.randomUUID(), 
          text: `⏱️ Таймер: ожидание ${delay} ${unit === 'minutes' ? 'мин' : unit === 'hours' ? 'ч' : 'сек'}...`, 
          type: 'bot' 
        }]);
        
        if (actionNode.config.showTyping) setIsTypingIndicator(true);
        await new Promise(resolve => setTimeout(resolve, previewDelay));
        if (actionNode.config.showTyping) setIsTypingIndicator(false);
        
        // Continue to next connected node
        if (actionNode.nextNodeType === 'menu' && actionNode.nextNodeId) {
          return { navigateMenuId: actionNode.nextNodeId };
        } else if (actionNode.nextNodeType === 'action' && actionNode.nextNodeId) {
          return { navigateMenuId: null, nextActionId: actionNode.nextNodeId };
        }
        break;
      }
      case 'lottery': {
        const winChance = actionNode.config.winChance || 10;
        const isWin = Math.random() * 100 < winChance;
        const prize = actionNode.config.prize || 'приз';
        
        if (isWin) {
          const winMessage = (actionNode.config.winMessage || '🎉 Поздравляем! Вы выиграли {prize}!')
            .replace('{prize}', prize);
          setActionMessages(prev => [...prev, { 
            id: crypto.randomUUID(), 
            text: winMessage, 
            type: 'bot' 
          }]);
        } else {
          const loseMessage = actionNode.config.loseMessage || '😔 К сожалению, не повезло. Попробуйте ещё!';
          setActionMessages(prev => [...prev, { 
            id: crypto.randomUUID(), 
            text: loseMessage, 
            type: 'bot' 
          }]);
        }
        
        // Navigate to win/lose outcome if connected
        const outcomes = actionNode.outcomes || [];
        const selectedOutcome = isWin ? outcomes[0] : outcomes[1];
        if (selectedOutcome?.targetId && selectedOutcome.targetType === 'menu') {
          return { navigateMenuId: selectedOutcome.targetId };
        } else if (selectedOutcome?.targetId && selectedOutcome.targetType === 'action') {
          return { navigateMenuId: null, nextActionId: selectedOutcome.targetId };
        }
        break;
      }
      case 'leaderboard': {
        const title = actionNode.config.title || '🏆 Топ игроков';
        const limit = actionNode.config.limit || 10;
        
        // Generate sample leaderboard for preview
        const samplePlayers = [
          { name: 'Александр', score: 1520 },
          { name: 'Мария', score: 1380 },
          { name: 'Дмитрий', score: 1250 },
          { name: 'Елена', score: 1100 },
          { name: 'Иван (Вы)', score: 950 },
        ].slice(0, Math.min(limit, 5));
        
        let leaderboardText = `${title}\n\n`;
        samplePlayers.forEach((player, i) => {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
          leaderboardText += `${medal} ${player.name} — ${player.score} очков\n`;
        });
        
        if (actionNode.config.showUserPosition !== false) {
          leaderboardText += `\n📍 Ваша позиция: #5`;
        }
        
        setActionMessages(prev => [...prev, { 
          id: crypto.randomUUID(), 
          text: leaderboardText.trim(), 
          type: 'bot' 
        }]);
        break;
      }
      case 'modify_points': {
        const points = actionNode.config.points || 0;
        const operation = actionNode.config.operation || 'add';
        const opText = operation === 'add' ? '+' : operation === 'subtract' ? '-' : '=';
        
        setActionMessages(prev => [...prev, { 
          id: crypto.randomUUID(), 
          text: `⭐ Баллы: ${opText}${points}`, 
          type: 'bot' 
        }]);
        return getNextNode();
      }
      case 'spam_protection': {
        // Spam protection passes through silently (successful check)
        return getNextNode();
      }
      case 'send_notification': {
        const message = actionNode.config.message || 'Уведомление';
        const silent = actionNode.config.silent === true;
        const interpolated = interpolateVariables(message, userContext);
        
        setActionMessages(prev => [...prev, { 
          id: crypto.randomUUID(), 
          text: `🔔 ${interpolated}${silent ? ' (без звука)' : ''}`, 
          type: 'bot' 
        }]);
        return getNextNode();
      }
    }
    return { navigateMenuId: null };
  }, [userContext]);

  const executeActionNodeChain = useCallback(async (startActionId: string): Promise<string | null> => {
    let currentNodeId: string | null = startActionId;
    let navigateToMenuId: string | null = null;

    while (currentNodeId) {
      const actionNode = actionNodes.find(an => an.id === currentNodeId);
      if (!actionNode) break;
      
      const result = await executeActionNode(actionNode);
      
      // If we got a menu to navigate to, stop and return it
      if (result.navigateMenuId) {
        navigateToMenuId = result.navigateMenuId;
        break;
      }
      
      // If we got a next action, continue the chain
      if (result.nextActionId) {
        currentNodeId = result.nextActionId;
        continue;
      }
      
      // No more nodes to process
      currentNodeId = null;
    }
    return navigateToMenuId;
  }, [actionNodes, executeActionNode]);

  const executeButtonActions = useCallback(async (button: BotButton) => {
    if (!button.actions.length) return null;
    const sortedActions = [...button.actions].sort((a, b) => a.order - b.order);
    let navigateToMenuId: string | null = null;

    for (const action of sortedActions) {
      switch (action.type) {
        case 'show_text': {
          const text = action.config.text || '';
          const interpolated = interpolateVariables(text, userContext);
          setActionMessages(prev => [...prev, { id: crypto.randomUUID(), text: interpolated, type: 'bot' }]);
          break;
        }
        case 'delay': {
          const delayMs = (action.config.seconds || 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delayMs));
          break;
        }
        case 'typing_indicator': {
          const duration = (action.config.seconds || 2) * 1000;
          setIsTypingIndicator(true);
          await new Promise(resolve => setTimeout(resolve, duration));
          setIsTypingIndicator(false);
          break;
        }
        case 'navigate_menu':
          navigateToMenuId = action.config.menuId || null;
          break;
        case 'open_url': {
          const url = action.config.url;
          if (url) window.open(url, '_blank');
          break;
        }
      }
      if (navigateToMenuId) break;
    }
    return navigateToMenuId;
  }, [userContext]);

  if (!menu) {
    return (
      <div ref={ref} className="h-full flex flex-col bg-surface-overlay overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
          <button className="text-muted-foreground/50"><ChevronLeft className="w-5 h-5" /></button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-semibold">{botName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{botName}</p>
            <p className="text-xs text-muted-foreground">бот</p>
          </div>
          <MoreVertical className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Выберите меню для предпросмотра</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-card border-t border-border">
          <div className="flex-1 bg-muted rounded-full px-4 py-2">
            <span className="text-sm text-muted-foreground">Сообщение...</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
            <Send className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>
      </div>
    );
  }

  const buttonRows: { [key: number]: typeof menu.buttons } = {};
  menu.buttons.forEach((button) => {
    if (!buttonRows[button.row]) buttonRows[button.row] = [];
    buttonRows[button.row].push(button);
  });
  const sortedRows = Object.keys(buttonRows).map(Number).sort((a, b) => a - b);

  const handleButtonClick = async (button: BotButton) => {
    if (isExecuting) return;
    setDirection(1);
    setIsExecuting(true);
    let navigateToMenuId: string | null = null;

    if (button.targetActionId) {
      navigateToMenuId = await executeActionNodeChain(button.targetActionId);
    } else if (button.actions.length > 0) {
      navigateToMenuId = await executeButtonActions(button);
    }
    setIsExecuting(false);

    const targetMenu = navigateToMenuId || button.targetMenuId;
    if (targetMenu) onNavigateToMenu?.(targetMenu);
    onButtonClick?.(button.id);
  };

  const handleBack = () => { 
    setDirection(-1); 
    setActionMessages([]); // Clear messages when going back
    onBack?.(); 
  };

  const handleClearChat = () => {
    setActionMessages([]);
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 100 : -100, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -100 : 100, opacity: 0 }),
  };

  return (
    <div ref={ref} className="h-full flex flex-col bg-surface-overlay overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
        <button onClick={handleBack} disabled={!canGoBack} className={`transition-colors ${canGoBack ? 'text-primary hover:text-primary/80' : 'text-muted-foreground/50'}`}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
          <span className="text-primary-foreground text-sm font-semibold">{botName.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{botName}</p>
          <p className="text-xs text-muted-foreground">бот</p>
        </div>
        {actionMessages.length > 0 && (
          <button 
            onClick={handleClearChat}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            title="Очистить чат"
          >
            <RotateCcw className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
        <MoreVertical className="w-5 h-5 text-muted-foreground" />
      </div>

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={menu.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 overflow-y-auto p-4 space-y-3"
          >
            {/* Media preview */}
            {menu.mediaUrl && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.05 }} 
                className="max-w-[85%]"
              >
                {menu.mediaUrl.includes('.mp4') || menu.mediaUrl.includes('.webm') ? (
                  <video 
                    src={menu.mediaUrl}
                    className="w-full rounded-2xl rounded-tl-md shadow-sm"
                    controls
                    playsInline
                  />
                ) : (
                  <img 
                    src={menu.mediaUrl} 
                    alt="" 
                    className="w-full rounded-2xl rounded-tl-md shadow-sm object-cover max-h-48"
                    onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                  />
                )}
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="max-w-[85%]">
              <div className="bg-card rounded-2xl rounded-tl-md px-4 py-3 shadow-sm min-h-[40px]">
                <div className="text-sm text-foreground">
                  {parseMarkdown(displayedText || interpolatedMessage || '')}
                  {displayedText && !isComplete && (
                    <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="inline-block w-0.5 h-4 bg-primary ml-0.5 align-middle" />
                  )}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 ml-2">
                {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </motion.div>

            <AnimatePresence>
              {actionMessages.map((msg, index) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: index * 0.05 }} className="max-w-[85%]">
                  <div className="bg-card rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                    <div className="text-sm text-foreground">{parseMarkdown(msg.text)}</div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 ml-2">{new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</p>
                </motion.div>
              ))}
            </AnimatePresence>

            <AnimatePresence>{isTypingIndicator && <TypingIndicator />}</AnimatePresence>

            {(isComplete || !menu.messageText) && !isExecuting && sortedRows.length > 0 && (
              <div className="space-y-1.5 max-w-full">
                {sortedRows.map((rowIndex, rowIdx) => (
                  <motion.div key={rowIndex} className="flex gap-1.5 w-full" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: rowIdx * 0.05 }}>
                    {buttonRows[rowIndex].sort((a, b) => a.order - b.order).map((button, btnIdx) => (
                      <motion.button
                        key={button.id}
                        onClick={() => handleButtonClick(button)}
                        whileTap={{ scale: 0.97 }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: rowIdx * 0.05 + btnIdx * 0.03 }}
                        className={`flex-1 min-w-0 bg-card border border-border rounded-lg text-xs py-2 px-3 text-foreground transition-all truncate ${button.targetMenuId || button.targetActionId || button.actions.length > 0 ? 'hover:bg-primary/20 hover:border-primary/50' : ''}`}
                      >
                        <span className="truncate">{button.text}</span>
                        {(button.targetMenuId || button.targetActionId) && <span className="ml-1 opacity-50 flex-shrink-0">→</span>}
                      </motion.button>
                    ))}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 bg-card border-t border-border">
        <div className="flex-1 bg-muted rounded-full px-4 py-2">
          <span className="text-sm text-muted-foreground">Сообщение...</span>
        </div>
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
          <Send className="w-4 h-4 text-primary-foreground" />
        </div>
      </div>
    </div>
  );
});
