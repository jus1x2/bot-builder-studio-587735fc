import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, Zap, Database, GitBranch, ShoppingCart, Trophy, MessageCircle, Bell, Send,
  MessageSquare, ArrowRight, ExternalLink, Clock, MoreHorizontal, Edit3, Plus, List, Trash2,
  Tag, UserCheck, Shield, CheckCircle, XCircle, Hash, Package, Archive, Percent, ShoppingBag,
  Trash, CreditCard, Gift, Star, Edit, HelpCircle, UserPlus, Timer, Target, Calendar
} from 'lucide-react';
import { ACTION_CATEGORIES, ACTION_INFO, ActionType } from '@/types/bot';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { v4 as uuidv4 } from 'uuid';

const categoryIcons: Record<string, React.ElementType> = {
  basic: Zap,
  data: Database,
  logic: GitBranch,
  shop: ShoppingCart,
  gamification: Trophy,
  interactive: MessageCircle,
  events: Bell,
  automation: Send,
};

const actionIcons: Record<string, React.ElementType> = {
  MessageSquare, ArrowRight, ExternalLink, Clock, MoreHorizontal, Edit3, Plus, List, Trash2,
  Tag, TagOff: Tag, UserCheck, Shield, CheckCircle, XCircle, Search, Hash, Package, X,
  Archive, Percent, ShoppingBag, Trash, CreditCard, Dice1: Gift, Dice3: Gift, Gift, Trophy,
  Star, Edit, HelpCircle, UserPlus, Timer, Target, Bell, Calendar, Send, MessageCircle,
  GitBranch, ShoppingCart, Database, Zap,
};

interface ActionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (action: { id: string; type: ActionType; order: number; config: Record<string, any> }) => void;
  currentOrder: number;
}

export function ActionPanel({ isOpen, onClose, onSelect, currentOrder }: ActionPanelProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredActions = useMemo(() => {
    return Object.entries(ACTION_INFO).filter(([type, info]) => {
      const matchesSearch = search === '' ||
        info.name.toLowerCase().includes(search.toLowerCase()) ||
        info.description.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedCategory) {
        const category = ACTION_CATEGORIES[selectedCategory as keyof typeof ACTION_CATEGORIES];
        const actions = category?.actions as readonly string[];
        return actions?.includes(type);
      }

      return true;
    });
  }, [search, selectedCategory]);

  const handleSelectAction = (type: ActionType) => {
    onSelect({
      id: uuidv4(),
      type,
      order: currentOrder,
      config: getDefaultConfig(type),
    });
    onClose();
    setSearch('');
    setSelectedCategory(null);
  };

  const getActionIcon = (iconName: string) => {
    return actionIcons[iconName] || Zap;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
              <h2 className="text-lg font-semibold text-foreground">Добавить действие</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск действий..."
                  className="pl-10 bg-background"
                />
              </div>
            </div>

            {/* Categories - Horizontal scroll with proper visibility */}
            <div className="px-6 py-3 border-b border-border bg-muted/20">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === null
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-background text-muted-foreground hover:text-foreground hover:bg-muted border border-border'
                  }`}
                >
                  Все
                </button>
                {Object.entries(ACTION_CATEGORIES).map(([key, category]) => {
                  const Icon = categoryIcons[key] || Zap;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(key)}
                      className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                        selectedCategory === key
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-background text-muted-foreground hover:text-foreground hover:bg-muted border border-border'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions list */}
            <ScrollArea className="h-[400px]">
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredActions.map(([type, info]) => {
                    const Icon = getActionIcon(info.icon);
                    return (
                      <motion.button
                        key={type}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => handleSelectAction(type as ActionType)}
                        className="flex items-center gap-3 p-4 rounded-xl border border-border bg-background hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-foreground">
                            {info.name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {info.description}
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}

                  {filteredActions.length === 0 && (
                    <div className="col-span-2 text-center py-12">
                      <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">Ничего не найдено</p>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function getDefaultConfig(type: ActionType): Record<string, any> {
  switch (type) {
    case 'show_text':
      return { text: '', parseMode: 'plain' };
    case 'navigate_menu':
      return { targetMenuId: '' };
    case 'open_url':
      return { url: '', openInBrowser: false };
    case 'delay':
      return { seconds: 1, showTyping: false };
    case 'typing_indicator':
      return { duration: 2 };
    case 'set_field':
      return { field: '', value: '', valueType: 'text', createIfNotExists: true };
    case 'change_field':
      return { field: '', operation: 'add', value: 0 };
    case 'add_tag':
    case 'remove_tag':
      return { tag: '' };
    case 'add_to_cart':
      return { productId: '', productName: '', price: 0, currency: '₽', quantity: 1 };
    case 'if_else':
      return { condition: null, thenActions: [], elseActions: [] };
    case 'check_subscription':
      return { channelUsername: '', requirePublicAccess: false };
    case 'request_input':
      return { field: '', prompt: '', validationType: 'text' };
    case 'quiz':
      return { question: '', options: [], correctAnswer: 0 };
    case 'wait_response':
      return { timeout: 60, timeoutAction: 'none', saveToField: '' };
    case 'keyword_trigger':
      return { keywords: [], matchType: 'contains', caseSensitive: false };
    case 'no_response':
      return { timeout: 300, action: 'send_reminder' };
    case 'wrong_response':
      return { maxAttempts: 3, action: 'show_hint' };
    case 'schedule_message':
      return { delay: 3600, message: '' };
    case 'broadcast':
      return { segment: 'all', message: '' };
    case 'send_notification':
      return { message: '', silent: false };
    default:
      return {};
  }
}
