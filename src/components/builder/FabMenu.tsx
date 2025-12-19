import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, MessageSquare, Zap, icons } from 'lucide-react';
import { ACTION_CATEGORIES, ActionType } from '@/types/bot';

interface FabMenuProps {
  onAddMenu: () => void;
  onAddAction: (type: ActionType) => void;
}

export function FabMenu({ onAddMenu, onAddAction }: FabMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = Object.entries(ACTION_CATEGORIES);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-16 right-0 bg-card border border-border rounded-xl shadow-xl p-3 min-w-[280px] max-h-[400px] overflow-y-auto"
          >
            <button
              onClick={() => { onAddMenu(); setIsOpen(false); }}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors mb-2"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Новое меню</p>
                <p className="text-xs text-muted-foreground">Сообщение с кнопками</p>
              </div>
            </button>

            <div className="border-t border-border pt-2">
              <p className="text-xs font-medium text-muted-foreground px-2 mb-2">Действия</p>
              {categories.map(([key, category]) => {
                const IconComp = (icons as any)[category.icon] || Zap;
                const isExpanded = activeCategory === key;

                return (
                  <div key={key}>
                    <button
                      onClick={() => setActiveCategory(isExpanded ? null : key)}
                      className="w-full flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <IconComp className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{category.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{category.actions.length}</span>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden pl-6"
                        >
                          {category.actions.map((action) => (
                            <button
                              key={action}
                              onClick={() => { onAddAction(action as ActionType); setIsOpen(false); }}
                              className="w-full text-left text-xs text-muted-foreground py-1.5 hover:text-foreground transition-colors"
                            >
                              {action.replace(/_/g, ' ')}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </motion.div>
      </motion.button>
    </div>
  );
}
