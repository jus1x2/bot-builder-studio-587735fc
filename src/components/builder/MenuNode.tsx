import { memo, useMemo } from 'react';
import { Handle, Position, type Node } from '@xyflow/react';
import { motion } from 'framer-motion';
import { MessageSquare, Trash2, Edit2, Copy, Play, Image as ImageIcon, Video } from 'lucide-react';
import { BotMenu, MAX_BUTTONS_PER_ROW } from '@/types/bot';

export interface MenuNodeData extends Record<string, unknown> {
  menu: BotMenu;
  isSelected: boolean;
  isRoot: boolean;
  isOrphan?: boolean;
  isDragging?: boolean;
  connectedButtonIds?: string[];
  justMovedButtonId?: string | null;
  incomingConnections?: number;
  outgoingConnections?: number;
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
  const { menu, isRoot, isOrphan, onEdit, onDelete, onDuplicate, justMovedButtonId, incomingConnections = 0, outgoingConnections = 0 } = data;
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
  // Show first 6 rows in preview, rest collapsed
  const visibleRows = sortedRows.slice(0, 6);
  const hiddenRowsCount = sortedRows.length - visibleRows.length;

  return (
    <>
      {/* Target handle for incoming connections - positioned at the node level */}
      <Handle
        type="target"
        position={Position.Left}
        className={`!w-4 !h-4 !border-[3px] !border-card !rounded-full !shadow-md ${
          isRoot ? '!bg-telegram-green' : '!bg-primary'
        }`}
        style={{ left: 4, top: '50%' }}
      />

      <div className="relative" style={{ marginTop: 12, marginLeft: 12 }}>
        {/* Start badge - positioned outside the node to avoid clipping */}
        {isRoot && (
          <div 
            className="absolute bg-telegram-green text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 z-10"
            style={{ top: -12, left: -12 }}
          >
            <Play className="w-3 h-3" />
            Старт
          </div>
        )}

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 1,
            boxShadow: isOrphan 
              ? '0 0 20px 4px hsl(var(--telegram-orange) / 0.4)' 
              : undefined
          }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={`builder-node node-optimized ${isSelected ? 'selected' : ''} ${isOrphan ? 'orphan-node' : ''} relative`}
          style={{ minWidth: 220, maxWidth: 280 }}
        >
          {/* Connection count badges */}
          {incomingConnections > 0 && !isRoot && (
            <div className="node-connection-badge incoming" title={`${incomingConnections} входящих`}>
              ←{incomingConnections}
            </div>
          )}
          {outgoingConnections > 0 && (
            <div className="node-connection-badge outgoing" title={`${outgoingConnections} исходящих`}>
              {outgoingConnections}→
            </div>
          )}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isRoot ? 'bg-telegram-green/20 text-telegram-green' : 'bg-primary/10 text-primary'
              }`}>
                {isRoot ? <Play className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground truncate max-w-[140px]">{menu.name}</h4>
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

          {/* Media preview */}
          {menu.mediaUrl && (
            <div className="relative mb-3 rounded-lg overflow-hidden bg-muted/50">
              {menu.mediaUrl.includes('.mp4') || menu.mediaUrl.includes('.webm') ? (
                <div className="relative h-20 flex items-center justify-center bg-black/10">
                  <Video className="w-6 h-6 text-muted-foreground" />
                  <span className="absolute bottom-1 right-1 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                    Видео
                  </span>
                </div>
              ) : (
                <img 
                  src={menu.mediaUrl} 
                  alt="" 
                  className="w-full h-20 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="h-20 flex items-center justify-center"><span class="text-xs text-muted-foreground">Ошибка загрузки</span></div>';
                  }}
                />
              )}
              <div className="absolute top-1 left-1">
                <div className="bg-black/50 rounded p-0.5">
                  <ImageIcon className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-2.5 mb-3">
            <p className="text-xs text-foreground line-clamp-2">
              {menu.messageText || 'Нет текста сообщения'}
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
                        : !!button.targetMenuId || !!button.targetActionId;
                      const isJustMoved = justMovedButtonId === button.id;

                        return (
                          <div
                            key={button.id}
                            className={`flex-1 relative transition-all duration-300 ease-out pr-3 ${
                              isJustMoved ? 'scale-105 z-10' : 'scale-100'
                            }`}
                            style={{ minWidth: 0 }}
                          >
                            <div
                              className={`text-[10px] font-semibold px-2 py-1.5 rounded-md text-center truncate border transition-all duration-300 ease-out ${
                                isJustMoved
                                  ? 'ring-2 ring-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.5)] animate-pulse'
                                  : 'shadow-sm'
                              } ${
                                hasConnection
                                  ? 'bg-telegram-green/90 text-white border-telegram-green'
                                  : 'bg-primary/90 text-primary-foreground border-primary'
                              }`}
                            >
                              {button.text}
                            </div>
                            {/* Source handle on each button - visible outside the button */}
                            <Handle
                              type="source"
                              position={Position.Right}
                              id={button.id}
                              className={`!w-3 !h-3 !border-[2px] !border-card !rounded-full !shadow-md transition-all ${
                                hasConnection
                                  ? '!bg-telegram-green'
                                  : '!bg-primary hover:!bg-primary hover:!scale-125'
                              }`}
                              style={{
                                right: 0,
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

          {/* No buttons placeholder - clickable */}
          {menu.buttons.length === 0 && (
            <div 
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="text-center text-xs text-muted-foreground py-3 bg-muted/30 rounded-lg border-2 border-dashed border-muted hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-colors"
            >
              Нажмите для редактирования
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}

export const MenuNode = memo(MenuNodeComponent);
