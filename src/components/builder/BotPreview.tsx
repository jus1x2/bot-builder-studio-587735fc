import { useState, useEffect, forwardRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MoreVertical, Send } from 'lucide-react';
import { BotMenu, BotButton, BotActionNode } from '@/types/bot';
import { interpolateVariables, UserContext } from '@/hooks/useActionExecutor';

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

  useEffect(() => {
    if (menu && prevMenuId !== menu.id) {
      setPrevMenuId(menu.id);
      setActionMessages([]);
      setIsTypingIndicator(false);
      setIsExecuting(false);
    }
  }, [menu, prevMenuId]);

  const executeActionNode = useCallback(async (actionNode: BotActionNode): Promise<string | null> => {
    switch (actionNode.type) {
      case 'show_text': {
        const text = actionNode.config.text || '';
        const interpolated = interpolateVariables(text, userContext);
        setActionMessages(prev => [...prev, { id: crypto.randomUUID(), text: interpolated, type: 'bot' }]);
        break;
      }
      case 'delay': {
        const delayMs = (actionNode.config.seconds || 1) * 1000;
        if (actionNode.config.showTyping) setIsTypingIndicator(true);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        if (actionNode.config.showTyping) setIsTypingIndicator(false);
        break;
      }
      case 'typing_indicator': {
        const duration = (actionNode.config.seconds || 2) * 1000;
        setIsTypingIndicator(true);
        await new Promise(resolve => setTimeout(resolve, duration));
        setIsTypingIndicator(false);
        break;
      }
      case 'navigate_menu':
        return actionNode.config.menuId || null;
      case 'open_url': {
        const url = actionNode.config.url;
        if (url) window.open(url, '_blank');
        break;
      }
    }
    return null;
  }, [userContext]);

  const executeActionNodeChain = useCallback(async (startActionId: string): Promise<string | null> => {
    let currentNodeId: string | null = startActionId;
    let navigateToMenuId: string | null = null;

    while (currentNodeId) {
      const actionNode = actionNodes.find(an => an.id === currentNodeId);
      if (!actionNode) break;
      navigateToMenuId = await executeActionNode(actionNode);
      if (navigateToMenuId) break;
      if (actionNode.nextNodeType === 'menu' && actionNode.nextNodeId) {
        navigateToMenuId = actionNode.nextNodeId;
        break;
      }
      currentNodeId = actionNode.nextNodeType === 'action' ? actionNode.nextNodeId || null : null;
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
      <div ref={ref} className="h-full flex flex-col bg-muted/30 overflow-hidden">
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

  const handleBack = () => { setDirection(-1); onBack?.(); };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 100 : -100, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -100 : 100, opacity: 0 }),
  };

  return (
    <div ref={ref} className="h-full flex flex-col bg-muted/30 overflow-hidden">
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
