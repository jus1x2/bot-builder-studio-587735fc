import { memo } from 'react';
import { Handle, Position, type Node } from '@xyflow/react';
import { motion } from 'framer-motion';
import { Trash2, Settings, Copy, icons } from 'lucide-react';
import { BotActionNode, ACTION_INFO } from '@/types/bot';

export interface ActionNodeData extends Record<string, unknown> {
  actionNode: BotActionNode;
  isSelected: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export type ActionNodeType = Node<ActionNodeData, 'actionNode'>;

interface ActionNodeProps {
  data: ActionNodeData;
  selected?: boolean;
}

function ActionNodeComponent({ data, selected }: ActionNodeProps) {
  const { actionNode, onEdit, onDelete, onDuplicate } = data;
  const isSelected = selected || data.isSelected;

  const actionInfo = ACTION_INFO[actionNode.type];
  const IconComponent = (icons as any)[actionInfo?.icon] || icons.Zap;

  const getConfigPreview = () => {
    switch (actionNode.type) {
      case 'show_text':
        const text = actionNode.config.text;
        if (!text) return 'Текст не задан';
        return text.slice(0, 50) + (text.length > 50 ? '...' : '');
      case 'delay':
        return `${actionNode.config.seconds || 1} сек`;
      case 'typing_indicator':
        return `${actionNode.config.seconds || actionNode.config.duration || 2} сек`;
      case 'open_url':
        const url = actionNode.config.url;
        if (!url) return 'URL не задан';
        return url.slice(0, 30) + (url.length > 30 ? '...' : '');
      case 'set_field':
        const field = actionNode.config.field;
        const value = actionNode.config.value;
        if (!field) return 'Поле не задано';
        return `${field} = ${value || ''}`;
      case 'navigate_menu':
        return 'Переход в меню';
      default:
        return actionInfo?.description || '';
    }
  };

  const getNodeColor = () => {
    const type = actionNode.type;
    if (['show_text', 'navigate_menu', 'open_url', 'delay', 'typing_indicator'].includes(type)) {
      return 'bg-blue-500/10 border-blue-500/30 text-blue-500';
    }
    if (['set_field', 'change_field', 'add_tag', 'remove_tag', 'append_to_list', 'clear_field'].includes(type)) {
      return 'bg-purple-500/10 border-purple-500/30 text-purple-500';
    }
    if (['if_else', 'check_subscription', 'check_role', 'check_value', 'wait_response'].includes(type)) {
      return 'bg-amber-500/10 border-amber-500/30 text-amber-500';
    }
    if (type.includes('cart') || type.includes('product') || type.includes('payment') || type.includes('promo')) {
      return 'bg-green-500/10 border-green-500/30 text-green-500';
    }
    return 'bg-muted border-border text-muted-foreground';
  };

  const colorClasses = getNodeColor();

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`action-node rounded-xl border-2 p-3 shadow-lg backdrop-blur-sm transition-all ${colorClasses} ${
        isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
      }`}
      style={{ minWidth: 180, maxWidth: 220 }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-current !border-2 !border-background !rounded-full"
        style={{ left: -6 }}
      />

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-current/20">
            <IconComponent className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold">{actionInfo?.name || actionNode.type}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1 rounded hover:bg-black/10 transition-colors"
            title="Редактировать"
          >
            <Settings className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            className="p-1 rounded hover:bg-black/10 transition-colors"
            title="Дублировать"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 rounded hover:bg-destructive/20 transition-colors"
            title="Удалить"
          >
            <Trash2 className="w-3 h-3 text-destructive" />
          </button>
        </div>
      </div>

      <div className="text-[10px] opacity-80 truncate">
        {getConfigPreview()}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-current !border-2 !border-background !rounded-full"
        style={{ right: -6 }}
      />
    </motion.div>
  );
}

export const ActionNode = memo(ActionNodeComponent);
