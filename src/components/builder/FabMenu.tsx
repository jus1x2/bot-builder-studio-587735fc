import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Zap, Database, GitBranch, Trophy, MessageCircle, Bell, Send,
  ShoppingCart, MessageSquare, ArrowRight, ExternalLink, Clock, MoreHorizontal,
  Edit3, List, Tag, UserCheck, Shield, CheckCircle, Search, XCircle,
  Hash, Package, X, Archive, Percent, ShoppingBag, Trash, CreditCard,
  Dice1, Dice3, Gift, Star, Edit, HelpCircle, UserPlus, Timer, Target, Calendar
} from 'lucide-react';
import { ACTION_CATEGORIES, ActionType, ACTION_INFO } from '@/types/bot';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

const FAVORITES_KEY = 'fab-favorites';

const categoryIcons: Record<string, any> = {
  basic: Zap,
  data: Database,
  logic: GitBranch,
  shop: ShoppingCart,
  gamification: Trophy,
  interactive: MessageCircle,
  events: Bell,
  automation: Send,
};

const actionIcons: Record<string, any> = {
  show_text: MessageSquare,
  navigate_menu: ArrowRight,
  open_url: ExternalLink,
  delay: Clock,
  typing_indicator: MoreHorizontal,
  set_field: Edit3,
  change_field: Plus,
  append_to_list: List,
  clear_field: Trash,
  add_tag: Tag,
  remove_tag: Tag,
  if_else: GitBranch,
  check_subscription: UserCheck,
  check_role: Shield,
  check_value: CheckCircle,
  wait_response: MessageCircle,
  keyword_trigger: Search,
  no_response: Clock,
  wrong_response: XCircle,
  add_to_cart: ShoppingCart,
  update_quantity: Hash,
  show_product: Package,
  remove_from_cart: X,
  check_stock: Archive,
  apply_promo: Percent,
  show_cart: ShoppingBag,
  clear_cart: Trash,
  process_payment: CreditCard,
  random_result: Dice1,
  weighted_random: Dice3,
  lottery: Gift,
  leaderboard: Trophy,
  modify_points: Star,
  spam_protection: Shield,
  request_input: Edit,
  quiz: HelpCircle,
  on_payment_success: CheckCircle,
  on_first_visit: UserPlus,
  on_timer: Timer,
  on_threshold: Target,
  send_notification: Bell,
  schedule_message: Calendar,
  broadcast: Send,
};

interface FabMenuProps {
  onAddMenu: () => void;
  onAddAction: (type: ActionType) => void;
}

export function FabMenu({ onAddMenu, onAddAction }: FabMenuProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(FAVORITES_KEY);
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  }, []);

  const saveFavorites = (newFavorites: string[]) => {
    setFavorites(newFavorites);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
  };

  const toggleFavorite = (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (favorites.includes(action)) {
      saveFavorites(favorites.filter(f => f !== action));
    } else {
      saveFavorites([...favorites, action]);
    }
  };

  const allActions = useMemo(() => {
    const actions: { key: string; name: string; category: string }[] = [];
    Object.entries(ACTION_CATEGORIES).forEach(([categoryKey, category]) => {
      category.actions.forEach((action) => {
        actions.push({
          key: action,
          name: ACTION_INFO[action as ActionType]?.name || action.replace(/_/g, ' '),
          category: category.name,
        });
      });
    });
    return actions;
  }, []);

  const filteredActions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allActions.filter(
      (action) =>
        action.name.toLowerCase().includes(query) ||
        action.category.toLowerCase().includes(query)
    );
  }, [searchQuery, allActions]);

  const favoriteActions = useMemo(() => {
    return allActions.filter((action) => favorites.includes(action.key));
  }, [allActions, favorites]);

  const handleActionClick = (action: string) => {
    onAddAction(action as ActionType);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="fab"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 max-h-[70vh] overflow-y-auto bg-popover">
        {/* Search */}
        <div className="p-2 sticky top-0 bg-popover z-10 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Поиск действий..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        {/* Search Results */}
        {searchQuery.trim() && (
          <>
            {filteredActions.length > 0 ? (
              filteredActions.map((action) => {
                const ActionIcon = actionIcons[action.key] || Zap;
                const isFavorite = favorites.includes(action.key);
                return (
                  <DropdownMenuItem
                    key={action.key}
                    onClick={() => handleActionClick(action.key)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <ActionIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="text-sm">{action.name}</span>
                        <span className="text-[10px] text-muted-foreground">{action.category}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => toggleFavorite(action.key, e)}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                    </button>
                  </DropdownMenuItem>
                );
              })
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Ничего не найдено
              </div>
            )}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Favorites Section */}
        {!searchQuery.trim() && favoriteActions.length > 0 && (
          <>
            <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              Избранное
            </DropdownMenuLabel>
            {favoriteActions.map((action) => {
              const ActionIcon = actionIcons[action.key] || Zap;
              return (
                <DropdownMenuItem
                  key={`fav-${action.key}`}
                  onClick={() => handleActionClick(action.key)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <ActionIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">{action.name}</span>
                  </div>
                  <button
                    onClick={(e) => toggleFavorite(action.key, e)}
                    className="p-1 hover:bg-muted rounded"
                  >
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  </button>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Default View - New Menu + Categories */}
        {!searchQuery.trim() && (
          <>
            <DropdownMenuItem onClick={() => { onAddMenu(); setIsOpen(false); }}>
              <Plus className="w-4 h-4 mr-2" />
              Новое меню
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {Object.entries(ACTION_CATEGORIES).map(([key, category]) => {
              const CategoryIcon = categoryIcons[key] || Zap;
              return (
                <DropdownMenuSub key={key}>
                  <DropdownMenuSubTrigger>
                    <CategoryIcon className="w-4 h-4 mr-2" />
                    {category.name}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="max-h-[50vh] overflow-y-auto bg-popover">
                    {category.actions.map((action) => {
                      const ActionIcon = actionIcons[action] || Zap;
                      const isFavorite = favorites.includes(action);
                      return (
                        <DropdownMenuItem
                          key={action}
                          onClick={() => handleActionClick(action)}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            <ActionIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                            <span className="text-sm">{ACTION_INFO[action as ActionType]?.name || action.replace(/_/g, ' ')}</span>
                          </div>
                          <button
                            onClick={(e) => toggleFavorite(action, e)}
                            className="p-1 hover:bg-muted rounded"
                          >
                            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                          </button>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              );
            })}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
