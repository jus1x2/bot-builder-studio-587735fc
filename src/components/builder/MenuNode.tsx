import { memo, useMemo } from 'react';
import { Handle, Position, type Node } from '@xyflow/react';
import { motion } from 'framer-motion';
import { MessageSquare, Trash2, Edit2, Copy } from 'lucide-react';
import { BotMenu, MAX_BUTTONS_PER_ROW } from '@/types/bot';

export interface MenuNodeData extends Record<string, unknown> {
  menu: BotMenu;
  isSelected: boolean;
  isRoot: boolean;
  connectedButtonIds?: string[];
  justMovedButtonId?: string | null;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export type MenuNodeType = Node<MenuNodeData, 'menuNode'>;

interface MenuNodeProps {
  data: MenuNodeData;
  selected?: boolean;
}

function MenuNodeComponent({ data, selected }: MenuNodeProps) {
  const { menu, isRoot, onEdit, onDelete, onDuplicate, justMovedButtonId } = data;
  const isSelected = selected || data.isSelected;

  const buttonRows = useMemo(() => {
    const rows: { [key: number]: typeof menu.buttons } = {};
    menu.buttons.forEach((button) => {
      if (!rows[button.row]) {
        rows[button.row] = [];
      }
      if (rows[button.row].length < MAX_BUTTONS_PER_ROW) {
        rows[button.row].push(button);
      }
    });
    return rows;
  }, [menu.buttons]);

  const sortedRows = Object.keys(buttonRows).map(Number).sort((a, b) => a - b);
  const visibleRows = sortedRows.slice(0, 4);
  const hiddenRowsCount = sortedRows.length - visibleRows.length;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`builder-node node-optimized ${isSelected ? 'selected' : ''}`}
      style={{ minWidth: 220, maxWidth: 280, position: 'relative' }}
    >
      {!isRoot && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-4 !h-4 !bg-primary !border-[3px] !border-card !rounded-full !shadow-md"
          style={{ left: -8 }}
        />
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isRoot ? 'bg-telegram-green/20 text-telegram-green' : 'bg-primary/10 text-primary'
          }`}>
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground truncate max-w-[160px]">{menu.name}</h4>
            <p className="text-xs text-muted-foreground">
              {menu.buttons.length} кнопок
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            title="Редактировать"
          >
            <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            title="Дублировать"
          >
            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          {!isRoot && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
              title="Удалить"
            >
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </button>
          )}
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-2.5 mb-3">
        <p className="text-xs text-foreground line-clamp-2">
          {menu.messageText}
        </p>
      </div>

      {visibleRows.length > 0 && (
        <div className="space-y-1.5 bg-muted/30 rounded-lg p-2">
          {visibleRows.map((rowIndex) => {
            const rowButtons = buttonRows[rowIndex]
              .sort((a, b) => a.order - b.order)
              .slice(0, MAX_BUTTONS_PER_ROW);

            return (
              <div key={rowIndex} className="flex gap-1.5 items-center">
                {rowButtons.map((button) => {
                  const hasConnection = data.connectedButtonIds
                    ? data.connectedButtonIds.includes(button.id)
                    : !!button.targetMenuId;
                  const isJustMoved = justMovedButtonId === button.id;

                    return (
                      <div
                        key={button.id}
                        className={`flex-1 relative transition-all duration-300 ease-out ${
                          isJustMoved ? 'scale-110 z-10' : 'scale-100'
                        }`}
                      >
                        <div
                          className={`text-[10px] font-semibold px-2 py-1.5 rounded-md text-center truncate border transition-all duration-300 ease-out ${
                            isJustMoved
                              ? 'ring-2 ring-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.5)] animate-pulse'
                              : 'shadow-sm'
                          } ${
                            hasConnection
                              ? 'bg-telegram-green/90 text-primary-foreground border-telegram-green'
                              : 'bg-primary/90 text-primary-foreground border-primary'
                          }`}
                        >
                          {button.text}
                        </div>
                        <Handle
                          type="source"
                          position={Position.Right}
                          id={button.id}
                          className={`!w-3.5 !h-3.5 !border-[2px] !border-card !rounded-full !shadow-md transition-all ${
                            hasConnection
                              ? '!bg-telegram-green'
                              : '!bg-primary hover:!bg-primary hover:!scale-125'
                          }`}
                          style={{
                            right: -7,
                            top: '50%',
                            transform: 'translateY(-50%)',
                          }}
                        />
                      </div>
                    );
                })}
              </div>
            );
          })}

          {hiddenRowsCount > 0 && (
            <div className="text-center text-[10px] text-muted-foreground py-1 bg-background/50 rounded">
              + ещё {hiddenRowsCount} {hiddenRowsCount === 1 ? 'ряд' : hiddenRowsCount < 5 ? 'ряда' : 'рядов'}
            </div>
          )}
        </div>
      )}

      {isRoot && (
        <div className="absolute -top-2 -left-2 bg-telegram-green text-primary-foreground text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm">
          Старт
        </div>
      )}
    </motion.div>
  );
}

export const MenuNode = memo(MenuNodeComponent);
