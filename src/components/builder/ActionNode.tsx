import { memo, useMemo } from 'react';
import { Handle, Position, type Node } from '@xyflow/react';
import { motion } from 'framer-motion';
import { 
  Trash2, Settings, Copy, icons, Package, ShoppingCart, CreditCard, Wallet, Plus, 
  Sparkles, Zap, GitBranch, Database, Trophy, MessageCircle, Bell, Send
} from 'lucide-react';
import { BotActionNode, ACTION_INFO, CATEGORY_COLORS } from '@/types/bot';

export interface ActionNodeData extends Record<string, unknown> {
  actionNode: BotActionNode;
  isSelected: boolean;
  isDragging?: boolean;
  isOrphan?: boolean;
  incomingConnections?: number;
  outgoingConnections?: number;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export type ActionNodeType = Node<ActionNodeData, 'actionNode'>;

interface ActionNodeProps {
  data: ActionNodeData;
  selected?: boolean;
}

// Fallback icons for categories
const categoryIconMap: Record<string, React.ElementType> = {
  basic: Zap,
  data: Database,
  logic: GitBranch,
  shop: ShoppingCart,
  gamification: Trophy,
  interactive: MessageCircle,
  events: Bell,
  automation: Send,
  ai: Sparkles,
};

function ActionNodeComponent({ data, selected }: ActionNodeProps) {
  const { actionNode, isOrphan, onEdit, onDelete, onDuplicate, incomingConnections = 0, outgoingConnections = 0 } = data;
  const isSelected = selected || data.isSelected;

  const actionInfo = ACTION_INFO[actionNode.type];
  const IconComponent = (icons as any)[actionInfo?.icon] || icons.Zap;
  const category = actionInfo?.category || 'basic';
  const categoryColors = CATEGORY_COLORS[category] || CATEGORY_COLORS.basic;

  // Check if this is a multi-output action
  const isMultiOutput = actionNode.type === 'random_result' || actionNode.type === 'weighted_random' || actionNode.type === 'split_test';
  const isWeighted = actionNode.type === 'weighted_random';
  const isSplitTest = actionNode.type === 'split_test';
  const isIfElse = actionNode.type === 'if_else';
  const isLottery = actionNode.type === 'lottery';
  
  // For random_result use outcomeCount, for weighted_random/split_test use outcomes array
  const weightedOutcomes = actionNode.config?.outcomes || [];
  const outcomeCount = isWeighted || isSplitTest
    ? weightedOutcomes.length || 2 
    : (actionNode.config?.outcomeCount || 2);
  const outcomes = actionNode.outcomes || [];

  // Calculate total weight for percentage display
  const totalWeight = isWeighted || isSplitTest
    ? weightedOutcomes.reduce((sum: number, o: any) => sum + (o.weight || 1), 0) 
    : outcomeCount;

  // Calculate positions for multiple handles
  const handlePositions = useMemo(() => {
    if (!isMultiOutput) return [];
    const positions: { id: string; percent: number; label?: string }[] = [];
    
    for (let i = 0; i < outcomeCount; i++) {
      const id = (isWeighted || isSplitTest)
        ? (weightedOutcomes[i]?.id || `outcome-${i}`)
        : (outcomes[i]?.id || `outcome-${i}`);
      const weight = (isWeighted || isSplitTest) ? (weightedOutcomes[i]?.weight || 1) : 1;
      const percent = (isWeighted || isSplitTest)
        ? Math.round((weight / totalWeight) * 100)
        : Math.round(100 / outcomeCount);
      const label = (isWeighted || isSplitTest) ? weightedOutcomes[i]?.label : undefined;
      
      positions.push({ id, percent, label });
    }
    return positions;
  }, [isMultiOutput, isWeighted, isSplitTest, outcomeCount, outcomes, weightedOutcomes, totalWeight]);

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
      case 'random_result':
        return `${outcomeCount} исходов`;
      case 'weighted_random':
        return `${outcomeCount} взвеш. исходов`;
      case 'split_test':
        return `A/B: ${outcomeCount} вариантов`;
      case 'ai_response':
        return actionNode.config.prompt ? 'AI настроен' : 'Настройте AI';
      case 'http_request':
        return actionNode.config.url ? `${actionNode.config.method || 'GET'} ...` : 'URL не задан';
      case 'show_product':
      case 'show_cart':
      case 'process_payment':
      case 'add_to_cart':
        return null; // Will use custom preview
      default:
        return actionInfo?.description || '';
    }
  };

  const configPreview = getConfigPreview();
  const isShowProduct = actionNode.type === 'show_product';
  const isShowCart = actionNode.type === 'show_cart';
  const isProcessPayment = actionNode.type === 'process_payment';
  const isAddToCart = actionNode.type === 'add_to_cart';
  const hasCustomPreview = isShowProduct || isShowCart || isProcessPayment || isAddToCart;

  // Product preview component for show_product action
  const renderProductPreview = () => {
    if (!isShowProduct) return null;
    
    const { productName, price, oldPrice, imageUrl } = actionNode.config;
    const hasContent = productName || (price !== undefined && price !== null && price !== '');
    
    if (!hasContent) {
      return (
        <div className="mt-2 p-2 bg-white/50 dark:bg-black/20 rounded-lg border border-dashed border-current/30 text-center">
          <Package className="w-5 h-5 mx-auto mb-1 opacity-50" />
          <p className="text-[9px] opacity-60">Нажмите для настройки товара</p>
        </div>
      );
    }
    
    return (
      <div className="mt-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        {imageUrl ? (
          <div className="w-full h-16 bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <img 
              src={imageUrl} 
              alt={productName || 'Product'} 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div className="w-full h-12 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 flex items-center justify-center">
            <Package className="w-5 h-5 text-emerald-500/60" />
          </div>
        )}
        
        <div className="p-2">
          <p className="text-[10px] font-medium text-gray-900 dark:text-gray-100 truncate">
            {productName || 'Название товара'}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            {price !== undefined && price !== null && (
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                {price.toLocaleString('ru-RU')} ₽
              </span>
            )}
            {oldPrice !== undefined && oldPrice !== null && oldPrice > 0 && (
              <span className="text-[9px] text-gray-400 line-through">
                {oldPrice.toLocaleString('ru-RU')} ₽
              </span>
            )}
          </div>
          
          {actionNode.config.showAddToCart !== false && (
            <div className="mt-1.5 flex items-center justify-center gap-1 px-2 py-1 bg-emerald-500 text-white rounded text-[8px] font-medium">
              <ShoppingCart className="w-2.5 h-2.5" />
              В корзину
            </div>
          )}
        </div>
      </div>
    );
  };

  // Cart preview component for show_cart action
  const renderCartPreview = () => {
    if (!isShowCart) return null;
    
    const { emptyCartMessage, showTotal } = actionNode.config;
    
    return (
      <div className="mt-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="p-2 border-b border-gray-100 dark:border-gray-800 flex items-center gap-1.5">
          <ShoppingCart className="w-3 h-3 text-emerald-500" />
          <span className="text-[10px] font-medium text-gray-900 dark:text-gray-100">Корзина</span>
        </div>
        
        <div className="p-1.5 space-y-1">
          <div className="flex items-center gap-1.5 p-1 bg-gray-50 dark:bg-gray-800 rounded">
            <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 rounded flex items-center justify-center">
              <Package className="w-3 h-3 text-emerald-500/60" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] text-gray-600 dark:text-gray-400 truncate">Товар 1</p>
              <p className="text-[9px] font-medium text-gray-900 dark:text-gray-100">1 × 990 ₽</p>
            </div>
          </div>
        </div>
        
        {showTotal !== false && (
          <div className="p-1.5 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <span className="text-[9px] text-gray-500">Итого:</span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">990 ₽</span>
          </div>
        )}
        
        {emptyCartMessage && (
          <p className="text-[8px] text-gray-400 px-1.5 pb-1 truncate">
            Пусто: {emptyCartMessage.slice(0, 20)}...
          </p>
        )}
      </div>
    );
  };

  // Payment preview component for process_payment action
  const renderPaymentPreview = () => {
    if (!isProcessPayment) return null;
    
    const { provider, amount, currency, successMessage } = actionNode.config;
    
    const providerLabels: Record<string, { name: string; color: string }> = {
      yookassa: { name: 'ЮKassa', color: 'bg-blue-500' },
      tinkoff: { name: 'Тинькофф', color: 'bg-yellow-500' },
      sberbank: { name: 'СберПэй', color: 'bg-green-500' },
      robokassa: { name: 'Robokassa', color: 'bg-orange-500' },
      telegram_stars: { name: 'Telegram Stars', color: 'bg-indigo-500' },
    };
    
    const providerInfo = providerLabels[provider] || { name: 'Оплата', color: 'bg-gray-500' };
    
    return (
      <div className="mt-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className={`p-2 ${providerInfo.color} text-white flex items-center gap-1.5`}>
          <CreditCard className="w-3.5 h-3.5" />
          <span className="text-[10px] font-medium">{providerInfo.name}</span>
        </div>
        
        <div className="p-2 space-y-1.5">
          {amount !== undefined && amount !== null && (
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-gray-500">К оплате:</span>
              <span className="text-[12px] font-bold text-gray-900 dark:text-gray-100">
                {Number(amount).toLocaleString('ru-RU')} {currency || '₽'}
              </span>
            </div>
          )}
          
          {!amount && (
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-gray-500">К оплате:</span>
              <span className="text-[10px] text-gray-400">Сумма корзины</span>
            </div>
          )}
          
          <button className={`w-full py-1.5 ${providerInfo.color} text-white rounded text-[9px] font-medium flex items-center justify-center gap-1`}>
            <Wallet className="w-3 h-3" />
            Оплатить
          </button>
          
          {successMessage && (
            <p className="text-[8px] text-green-600 dark:text-green-400 truncate">
              ✓ {successMessage.slice(0, 25)}...
            </p>
          )}
        </div>
      </div>
    );
  };

  // Add to cart preview component
  const renderAddToCartPreview = () => {
    if (!isAddToCart) return null;
    
    const { productId, productName, quantity, price } = actionNode.config;
    const hasContent = productId || productName;
    
    if (!hasContent) {
      return (
        <div className="mt-2 p-2 bg-white/50 dark:bg-black/20 rounded-lg border border-dashed border-current/30 text-center">
          <Plus className="w-5 h-5 mx-auto mb-1 opacity-50" />
          <p className="text-[9px] opacity-60">Настройте товар</p>
        </div>
      );
    }
    
    return (
      <div className="mt-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-800/30 flex items-center gap-1.5">
          <Plus className="w-3 h-3 text-emerald-600" />
          <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">Добавление в корзину</span>
        </div>
        
        <div className="p-2 flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4 text-emerald-500/60" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-gray-900 dark:text-gray-100 truncate">
              {productName || productId || 'Товар'}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] text-gray-500">
                Кол-во: <span className="font-medium text-gray-700 dark:text-gray-300">{quantity || 1}</span>
              </span>
              {price !== undefined && price !== null && (
                <span className="text-[9px] font-medium text-emerald-600">
                  {Number(price).toLocaleString('ru-RU')} ₽
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Random/Weighted/Split test result preview for multi-output
  const renderRandomResultPreview = () => {
    if (!isMultiOutput) return null;
    
    const bgColor = isSplitTest 
      ? 'bg-fuchsia-50 dark:bg-fuchsia-900/20 border-fuchsia-200 dark:border-fuchsia-800/30'
      : isWeighted 
        ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/30'
        : 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800/30';
    const textColor = isSplitTest
      ? 'text-fuchsia-700 dark:text-fuchsia-300'
      : isWeighted
        ? 'text-orange-700 dark:text-orange-300'
        : 'text-pink-700 dark:text-pink-300';
    const subTextColor = isSplitTest
      ? 'text-fuchsia-600 dark:text-fuchsia-400'
      : isWeighted
        ? 'text-orange-600 dark:text-orange-400'
        : 'text-pink-600 dark:text-pink-400';
    const NodeIcon = isSplitTest ? icons.FlaskConical : icons.Dices;
    const iconColor = isSplitTest ? 'text-fuchsia-500' : isWeighted ? 'text-orange-500' : 'text-pink-500';
    
    return (
      <div className={`mt-2 p-2 rounded-lg border ${bgColor}`}>
        <div className="flex items-center gap-1.5 mb-2">
          <NodeIcon className={`w-3.5 h-3.5 ${iconColor}`} />
          <span className={`text-[10px] font-medium ${textColor}`}>
            {isSplitTest ? 'A/B Тест' : isWeighted ? 'Взвешенный выбор' : 'Случайный выбор'}
          </span>
        </div>
        <div className="space-y-1">
          {handlePositions.map((pos, i) => (
            <div 
              key={pos.id} 
              className="flex items-center justify-between text-[9px] p-1 bg-white/50 dark:bg-black/20 rounded"
            >
              <span className={subTextColor}>
                {pos.label || (isSplitTest ? `Вариант ${String.fromCharCode(65 + i)}` : `Исход ${i + 1}`)}
              </span>
              <span className={`font-medium ${textColor}`}>{pos.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // If/else preview with two outputs
  const renderIfElsePreview = () => {
    if (!isIfElse) return null;
    
    const { checkType, field, tag, operator, value } = actionNode.config;
    let conditionText = '';
    
    if (checkType === 'tag') {
      conditionText = `Тег "${tag || '?'}"`;
    } else if (checkType === 'points') {
      const opSymbol = { equals: '=', not_equals: '≠', greater: '>', greater_eq: '≥', less: '<', less_eq: '≤' }[operator as string] || '=';
      conditionText = `Баллы ${opSymbol} ${value || '?'}`;
    } else {
      const opSymbol = { equals: '=', not_equals: '≠', greater: '>', greater_eq: '≥', less: '<', less_eq: '≤', contains: '∋', exists: '∃' }[operator as string] || '=';
      conditionText = `${field || '?'} ${opSymbol} ${value || '?'}`;
    }
    
    return (
      <div className="mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
        <div className="flex items-center gap-1.5 mb-2">
          <GitBranch className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300 truncate">
            {conditionText}
          </span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[9px] p-1 bg-white/50 dark:bg-black/20 rounded">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-green-600 dark:text-green-400 font-medium">Да</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] p-1 bg-white/50 dark:bg-black/20 rounded">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-red-600 dark:text-red-400 font-medium">Нет</span>
          </div>
        </div>
      </div>
    );
  };

  // Lottery preview
  const renderLotteryPreview = () => {
    if (!isLottery) return null;
    
    const { winChance, prize } = actionNode.config;
    
    return (
      <div className="mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
        <div className="flex items-center gap-1.5 mb-2">
          <icons.Ticket className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300">
            Шанс: {winChance || 10}%
          </span>
        </div>
        {prize && (
          <p className="text-[9px] text-amber-600 dark:text-amber-400 mb-2 truncate">
            Приз: {prize}
          </p>
        )}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[9px] p-1 bg-white/50 dark:bg-black/20 rounded">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-green-600 dark:text-green-400 font-medium">Выигрыш</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] p-1 bg-white/50 dark:bg-black/20 rounded">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-red-600 dark:text-red-400 font-medium">Проигрыш</span>
          </div>
        </div>
      </div>
    );
  };

  // AI preview
  const renderAIPreview = () => {
    if (actionNode.type !== 'ai_response') return null;
    
    return (
      <div className="mt-2 p-2 rounded-lg bg-gradient-to-br from-fuchsia-50 to-purple-50 dark:from-fuchsia-900/20 dark:to-purple-900/20 border border-fuchsia-200 dark:border-fuchsia-800/30">
        <div className="flex items-center gap-1.5 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-fuchsia-500" />
          <span className="text-[10px] font-medium text-fuchsia-700 dark:text-fuchsia-300">
            AI Генерация
          </span>
        </div>
        <p className="text-[9px] text-fuchsia-600 dark:text-fuchsia-400 truncate">
          {actionNode.config.prompt ? actionNode.config.prompt.slice(0, 40) + '...' : 'Настройте промпт'}
        </p>
      </div>
    );
  };

  // Calculate dynamic height for multi-output nodes
  const nodeMinHeight = isMultiOutput ? Math.max(120, outcomeCount * 35 + 80) : (isIfElse || isLottery ? 140 : undefined);

  return (
    <div className="relative" style={{ marginTop: 12, marginLeft: 12 }}>
      {/* Connection count badges */}
      {incomingConnections > 0 && (
        <div className="node-connection-badge incoming" title={`${incomingConnections} входящих`}>
          ←{incomingConnections}
        </div>
      )}
      {outgoingConnections > 0 && (
        <div className="node-connection-badge outgoing" title={`${outgoingConnections} исходящих`}>
          {outgoingConnections}→
        </div>
      )}
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          boxShadow: isOrphan
            ? '0 0 20px 4px rgba(251, 146, 60, 0.5), 0 0 40px 8px rgba(251, 146, 60, 0.25)'
            : undefined
        }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className={`action-node builder-node rounded-xl border-2 p-3 shadow-lg backdrop-blur-sm transition-all ${categoryColors.bg} ${categoryColors.border} ${categoryColors.text} ${
          isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
        } ${isOrphan ? '!border-orange-400' : ''}`}
        style={{ 
          minWidth: hasCustomPreview || isMultiOutput ? 200 : 180, 
          maxWidth: hasCustomPreview || isMultiOutput ? 240 : 220,
          minHeight: nodeMinHeight,
        }}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-current !border-2 !border-background !rounded-full transition-transform hover:!scale-125"
          style={{ left: -6 }}
        />

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br ${categoryColors.gradient} text-white shadow-sm`}>
              <IconComponent className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold">{actionInfo?.name || actionNode.type}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              title="Редактировать"
            >
              <Settings className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
              className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
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

        {configPreview && !isMultiOutput && !isIfElse && !isLottery && actionNode.type !== 'ai_response' && (
          <div className="text-[10px] opacity-80 truncate">
            {configPreview}
          </div>
        )}

        {renderProductPreview()}
        {renderCartPreview()}
        {renderPaymentPreview()}
        {renderAddToCartPreview()}
        {renderRandomResultPreview()}
        {renderIfElsePreview()}
        {renderLotteryPreview()}
        {renderAIPreview()}

        {/* Single output handle for non-multi-output nodes */}
        {!isMultiOutput && !isIfElse && !isLottery && (
          <Handle
            type="source"
            position={Position.Right}
            className="!w-3 !h-3 !bg-current !border-2 !border-background !rounded-full transition-transform hover:!scale-125"
            style={{ right: -6 }}
          />
        )}

        {/* If/else two output handles */}
        {isIfElse && (
          <>
            <Handle
              type="source"
              position={Position.Right}
              id="yes"
              className="!w-3 !h-3 !bg-green-500 !border-2 !border-background !rounded-full transition-transform hover:!scale-125"
              style={{ right: -6, top: '40%' }}
            />
            <Handle
              type="source"
              position={Position.Right}
              id="no"
              className="!w-3 !h-3 !bg-red-500 !border-2 !border-background !rounded-full transition-transform hover:!scale-125"
              style={{ right: -6, top: '70%' }}
            />
          </>
        )}

        {/* Lottery two output handles */}
        {isLottery && (
          <>
            <Handle
              type="source"
              position={Position.Right}
              id={actionNode.outcomes?.[0]?.id || 'win'}
              className="!w-3 !h-3 !bg-green-500 !border-2 !border-background !rounded-full transition-transform hover:!scale-125"
              style={{ right: -6, top: '40%' }}
            />
            <Handle
              type="source"
              position={Position.Right}
              id={actionNode.outcomes?.[1]?.id || 'lose'}
              className="!w-3 !h-3 !bg-red-500 !border-2 !border-background !rounded-full transition-transform hover:!scale-125"
              style={{ right: -6, top: '70%' }}
            />
          </>
        )}

        {/* Multiple output handles for random_result / weighted_random / split_test */}
        {isMultiOutput && handlePositions.map((pos, i) => (
          <Handle
            key={pos.id}
            type="source"
            position={Position.Right}
            id={pos.id}
            className={`!w-3 !h-3 !border-2 !border-background !rounded-full transition-transform hover:!scale-125 ${
              isSplitTest ? '!bg-fuchsia-500' : isWeighted ? '!bg-orange-500' : '!bg-pink-500'
            }`}
            style={{ 
              right: -6, 
              top: `${((i + 1) / (outcomeCount + 1)) * 100}%`,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}

export const ActionNode = memo(ActionNodeComponent);