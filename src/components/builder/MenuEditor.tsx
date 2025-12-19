import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, ChevronRight, Zap, Settings, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Link2, AlertCircle } from 'lucide-react';
import { BotMenu, BotButton, ACTION_INFO, BotAction, MAX_BUTTONS_PER_ROW } from '@/types/bot';
import { useProjectStore } from '@/stores/projectStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ActionConfigurator } from './ActionConfigurator';
import { toast } from 'sonner';

interface MenuEditorProps {
  menu: BotMenu;
  allMenus: BotMenu[];
  onClose: () => void;
}

export function MenuEditor({ menu, allMenus, onClose }: MenuEditorProps) {
  const { updateMenu, addButton, updateButton, deleteButton, selectedButtonId, setSelectedButton, updateAction, deleteAction, moveButton, compactButtonRows, justMovedButtonId } = useProjectStore();
  const [activeTab, setActiveTab] = useState<'menu' | 'buttons'>('menu');
  const [editingAction, setEditingAction] = useState<{ buttonId: string; action: BotAction } | null>(null);

  useEffect(() => {
    compactButtonRows(menu.id);
  }, [menu.id, compactButtonRows]);

  const handleMoveButton = (buttonId: string, direction: 'up' | 'down' | 'left' | 'right') => {
    moveButton(menu.id, buttonId, direction);
    setSelectedButton(buttonId);
  };

  const buttonRows: { [key: number]: BotButton[] } = {};
  menu.buttons.forEach((button) => {
    if (!buttonRows[button.row]) {
      buttonRows[button.row] = [];
    }
    buttonRows[button.row].push(button);
  });
  const sortedRows = Object.keys(buttonRows).map(Number).sort((a, b) => a - b);
  const maxRow = sortedRows.length > 0 ? Math.max(...sortedRows) : -1;

  const handleAddButton = (row: number) => {
    const buttonsInRow = buttonRows[row]?.length || 0;
    if (buttonsInRow >= MAX_BUTTONS_PER_ROW) {
      toast.error(`Максимум ${MAX_BUTTONS_PER_ROW} кнопок в ряду`);
      return;
    }
    addButton(menu.id, row);
  };

  const handleAddRow = () => {
    addButton(menu.id, maxRow + 1);
  };

  const handleSaveAction = () => {
    if (editingAction) {
      updateAction(menu.id, editingAction.buttonId, editingAction.action.id, editingAction.action);
    }
    setEditingAction(null);
  };

  const handleDeleteAction = (buttonId: string, actionId: string) => {
    deleteAction(menu.id, buttonId, actionId);
  };

  const otherMenus = allMenus.filter(m => m.id !== menu.id);

  return (
    <>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-y-0 right-0 w-full max-w-md bg-card border-l border-border z-50 flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Редактор меню</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'menu'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Меню
          </button>
          <button
            onClick={() => setActiveTab('buttons')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'buttons'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Кнопки ({menu.buttons.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 pr-6">
          <AnimatePresence mode="wait">
            {activeTab === 'menu' ? (
              <motion.div
                key="menu"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Название меню
                  </label>
                  <Input
                    value={menu.name}
                    onChange={(e) => updateMenu(menu.id, { name: e.target.value })}
                    placeholder="Главное меню"
                    className="telegram-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Текст сообщения
                  </label>
                  <Textarea
                    value={menu.messageText}
                    onChange={(e) => updateMenu(menu.id, { messageText: e.target.value })}
                    placeholder="Введите текст, который увидит пользователь..."
                    rows={5}
                    className="telegram-input resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Поддерживается Markdown: *жирный*, _курсив_, `код`
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Описание (для себя)
                  </label>
                  <Input
                    value={menu.description || ''}
                    onChange={(e) => updateMenu(menu.id, { description: e.target.value })}
                    placeholder="Заметка о назначении меню"
                    className="telegram-input"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="buttons"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm">
                  <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">
                    Макс. {MAX_BUTTONS_PER_ROW} кнопок в ряду
                  </span>
                </div>

                {sortedRows.map((rowIndex) => {
                  const buttonsInRow = buttonRows[rowIndex].length;
                  const canAddToRow = buttonsInRow < MAX_BUTTONS_PER_ROW;

                  return (
                    <div key={rowIndex} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          Ряд {rowIndex + 1} ({buttonsInRow}/{MAX_BUTTONS_PER_ROW})
                        </span>
                        {canAddToRow && (
                          <button
                            onClick={() => handleAddButton(rowIndex)}
                            className="text-xs text-primary hover:underline"
                          >
                            + Добавить
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {buttonRows[rowIndex]
                          .sort((a, b) => a.order - b.order)
                          .map((button, btnIdx) => (
                          <ButtonItem
                              key={button.id}
                              button={button}
                              menuId={menu.id}
                              isSelected={selectedButtonId === button.id}
                              isJustMoved={justMovedButtonId === button.id}
                              onSelect={() => setSelectedButton(button.id)}
                              onEditAction={(action) => setEditingAction({ buttonId: button.id, action })}
                              onDeleteAction={(actionId) => handleDeleteAction(button.id, actionId)}
                              otherMenus={otherMenus}
                              canMoveUp={rowIndex > 0}
                              canMoveDown={button.row < menu.buttons.length - 1}
                              canMoveLeft={btnIdx > 0}
                              canMoveRight={btnIdx < buttonRows[rowIndex].length - 1}
                              onMove={(dir) => handleMoveButton(button.id, dir)}
                            />
                          ))}
                      </div>
                    </div>
                  );
                })}

                <Button
                  variant="outline"
                  onClick={handleAddRow}
                  className="w-full mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить ряд
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence>
        {editingAction && (
          <ActionConfigurator
            action={editingAction.action}
            menus={allMenus}
            onChange={(config) => setEditingAction({
              ...editingAction,
              action: { ...editingAction.action, config }
            })}
            onClose={() => setEditingAction(null)}
            onSave={handleSaveAction}
          />
        )}
      </AnimatePresence>
    </>
  );
}

interface ButtonItemProps {
  button: BotButton;
  menuId: string;
  isSelected: boolean;
  isJustMoved: boolean;
  onSelect: () => void;
  onEditAction: (action: BotAction) => void;
  onDeleteAction: (actionId: string) => void;
  otherMenus: BotMenu[];
  canMoveUp: boolean;
  canMoveDown: boolean;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onMove: (direction: 'up' | 'down' | 'left' | 'right') => void;
}

function ButtonItem({
  button,
  menuId,
  isSelected,
  isJustMoved,
  onSelect,
  onEditAction,
  onDeleteAction,
  otherMenus,
  canMoveUp,
  canMoveDown,
  canMoveLeft,
  canMoveRight,
  onMove
}: ButtonItemProps) {
  const { updateButton, deleteButton } = useProjectStore();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`rounded-xl border transition-all duration-300 ease-out ${
        isJustMoved
          ? 'border-primary ring-2 ring-primary/50 bg-primary/10 scale-[1.01] shadow-[0_0_16px_rgba(var(--primary),0.25)]'
          : isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card hover:border-primary/30'
      }`}
    >
      <div
        className="flex items-center gap-2 p-3 cursor-pointer"
        onClick={() => {
          onSelect();
          setIsExpanded(!isExpanded);
        }}
      >
        <div className="flex flex-col gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onMove('up'); }}
            disabled={!canMoveUp}
            className={`p-0.5 rounded transition-colors ${canMoveUp ? 'hover:bg-muted text-muted-foreground hover:text-foreground' : 'text-muted-foreground/30 cursor-not-allowed'}`}
          >
            <ArrowUp className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMove('down'); }}
            disabled={!canMoveDown}
            className={`p-0.5 rounded transition-colors ${canMoveDown ? 'hover:bg-muted text-muted-foreground hover:text-foreground' : 'text-muted-foreground/30 cursor-not-allowed'}`}
          >
            <ArrowDown className="w-3 h-3" />
          </button>
        </div>
        <div className="flex gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onMove('left'); }}
            disabled={!canMoveLeft}
            className={`p-0.5 rounded transition-colors ${canMoveLeft ? 'hover:bg-muted text-muted-foreground hover:text-foreground' : 'text-muted-foreground/30 cursor-not-allowed'}`}
          >
            <ArrowLeft className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMove('right'); }}
            disabled={!canMoveRight}
            className={`p-0.5 rounded transition-colors ${canMoveRight ? 'hover:bg-muted text-muted-foreground hover:text-foreground' : 'text-muted-foreground/30 cursor-not-allowed'}`}
          >
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <Input
            value={button.text}
            onChange={(e) => {
              e.stopPropagation();
              updateButton(menuId, button.id, { text: e.target.value });
            }}
            onClick={(e) => e.stopPropagation()}
            className="h-8 text-sm border-none bg-transparent p-0 focus-visible:ring-0"
            placeholder="Текст кнопки"
          />
        </div>
        <div className="flex items-center gap-2">
          {button.targetMenuId && (
            <span className="action-chip bg-telegram-green/20 text-telegram-green">
              <Link2 className="w-3 h-3" />
            </span>
          )}
          {button.actions.length > 0 && (
            <span className="action-chip">
              <Zap className="w-3 h-3" />
              {button.actions.length}
            </span>
          )}
          <ChevronRight
            className={`w-4 h-4 text-muted-foreground transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`}
          />
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-0 space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Link2 className="w-3 h-3" />
                  Переход в меню (по клику)
                </label>
                <Select
                  value={button.targetMenuId || 'none'}
                  onValueChange={(value) => updateButton(menuId, button.id, {
                    targetMenuId: value === 'none' ? undefined : value
                  })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Выберите меню" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без перехода</SelectItem>
                    {otherMenus.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {button.actions.length > 0 ? (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Дополнительные действия</label>
                  {button.actions.map((action) => (
                    <div
                      key={action.id}
                      className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-xs group"
                    >
                      <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-foreground flex-1 truncate">
                        {ACTION_INFO[action.type]?.name || action.type}
                      </span>
                      <button
                        onClick={() => onEditAction(action)}
                        className="p-1 rounded hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Settings className="w-3.5 h-3.5 text-primary" />
                      </button>
                      <button
                        onClick={() => onDeleteAction(action.id)}
                        className="p-1 rounded hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Нет дополнительных действий
                </p>
              )}

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteButton(menuId, button.id)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
