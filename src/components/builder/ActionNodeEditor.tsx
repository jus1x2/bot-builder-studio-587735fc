import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, HelpCircle, Package, Loader2 } from 'lucide-react';
import { BotActionNode, BotMenu, ACTION_INFO, ActionType } from '@/types/bot';
import { useProjectStore } from '@/stores/projectStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ActionHelpPanel } from './ActionHelpPanel';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  old_price: number | null;
  image_url: string | null;
  sku: string | null;
  stock: number | null;
  max_quantity: number | null;
  variants: string[] | null;
}

interface ActionNodeEditorProps {
  actionNode: BotActionNode;
  menus: BotMenu[];
  onClose: () => void;
  onDelete: () => void;
}

export function ActionNodeEditor({ actionNode, menus, onClose, onDelete }: ActionNodeEditorProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const { updateActionNode, getCurrentProject } = useProjectStore();
  const currentProject = getCurrentProject();
  const info = ACTION_INFO[actionNode.type];

  // Load products for shop actions
  useEffect(() => {
    if (['show_product', 'add_to_cart'].includes(actionNode.type) && currentProject?.id) {
      loadProducts();
    }
  }, [actionNode.type, currentProject?.id]);

  const loadProducts = async () => {
    if (!currentProject?.id) return;
    setLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from('bot_products')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const selectProduct = (product: Product) => {
    updateActionNode(actionNode.id, {
      config: {
        ...actionNode.config,
        productId: product.id,
        productName: product.name,
        productDescription: product.description || '',
        price: Number(product.price),
        oldPrice: product.old_price ? Number(product.old_price) : undefined,
        imageUrl: product.image_url || '',
        sku: product.sku || '',
        stock: product.stock ?? undefined,
        maxQuantity: product.max_quantity || 10,
        variants: product.variants || [],
      }
    });
  };

  const updateConfig = (key: string, value: any) => {
    updateActionNode(actionNode.id, {
      config: { ...actionNode.config, [key]: value }
    });
  };

  const renderConfig = () => {
    switch (actionNode.type) {
      case 'show_text':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Текст сообщения
              </label>
              <Textarea
                value={actionNode.config.text || ''}
                onChange={(e) => updateConfig('text', e.target.value)}
                placeholder="Привет, {first_name}! Как дела?"
                rows={4}
                className="telegram-input resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Переменные: <code className="bg-muted px-1 rounded">{'{first_name}'}</code>, <code className="bg-muted px-1 rounded">{'{last_name}'}</code>, <code className="bg-muted px-1 rounded">{'{username}'}</code>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Форматирование
              </label>
              <Select
                value={actionNode.config.parseMode || 'plain'}
                onValueChange={(value) => updateConfig('parseMode', value)}
              >
                <SelectTrigger className="telegram-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plain">Обычный текст</SelectItem>
                  <SelectItem value="markdown">Markdown</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'delay':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Задержка (секунды)
              </label>
              <Input
                type="number"
                min={0}
                max={300}
                value={actionNode.config.seconds || 1}
                onChange={(e) => updateConfig('seconds', Number(e.target.value))}
                className="telegram-input"
              />
              <p className="text-xs text-muted-foreground mt-1">От 0 до 300 секунд</p>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">
                Показывать "печатает..."
              </label>
              <Switch
                checked={actionNode.config.showTyping || false}
                onCheckedChange={(checked) => updateConfig('showTyping', checked)}
              />
            </div>
          </div>
        );

      case 'typing_indicator':
        return (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Длительность (секунды)
            </label>
            <Input
              type="number"
              min={1}
              max={10}
              value={actionNode.config.seconds || 2}
              onChange={(e) => updateConfig('seconds', Number(e.target.value))}
              className="telegram-input"
            />
            <p className="text-xs text-muted-foreground mt-1">Показывает индикатор "печатает..." от 1 до 10 секунд</p>
          </div>
        );

      case 'navigate_menu':
        return (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Целевое меню
            </label>
            <Select
              value={actionNode.config.menuId || ''}
              onValueChange={(value) => updateConfig('menuId', value)}
            >
              <SelectTrigger className="telegram-input">
                <SelectValue placeholder="Выберите меню" />
              </SelectTrigger>
              <SelectContent>
                {menus.map((menu) => (
                  <SelectItem key={menu.id} value={menu.id}>
                    {menu.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'open_url':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                URL
              </label>
              <Input
                type="url"
                value={actionNode.config.url || ''}
                onChange={(e) => updateConfig('url', e.target.value)}
                placeholder="https://example.com"
                className="telegram-input"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">
                Открыть внутри Telegram
              </label>
              <Switch
                checked={actionNode.config.openInTelegram || false}
                onCheckedChange={(checked) => updateConfig('openInTelegram', checked)}
              />
            </div>
          </div>
        );

      case 'set_field':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Поле
              </label>
              <Input
                value={actionNode.config.field || ''}
                onChange={(e) => updateConfig('field', e.target.value)}
                placeholder="user.name"
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Значение
              </label>
              <Input
                value={actionNode.config.value || ''}
                onChange={(e) => updateConfig('value', e.target.value)}
                placeholder="Новое значение"
                className="telegram-input"
              />
            </div>
          </div>
        );

      case 'change_field':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Поле
              </label>
              <Input
                value={actionNode.config.field || ''}
                onChange={(e) => updateConfig('field', e.target.value)}
                placeholder="user.points"
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Изменение (+/-)
              </label>
              <Input
                type="number"
                value={actionNode.config.delta || 0}
                onChange={(e) => updateConfig('delta', Number(e.target.value))}
                className="telegram-input"
              />
            </div>
          </div>
        );

      case 'add_tag':
      case 'remove_tag':
        return (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Тег
            </label>
            <Input
              value={actionNode.config.tag || ''}
              onChange={(e) => updateConfig('tag', e.target.value)}
              placeholder="vip"
              className="telegram-input"
            />
          </div>
        );

      case 'wait_response':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Таймаут (секунды)
              </label>
              <Input
                type="number"
                min={0}
                value={actionNode.config.timeout || 60}
                onChange={(e) => updateConfig('timeout', Number(e.target.value))}
                className="telegram-input"
              />
              <p className="text-xs text-muted-foreground mt-1">0 = без ограничения</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Сохранить ответ в поле
              </label>
              <Input
                value={actionNode.config.saveToField || ''}
                onChange={(e) => updateConfig('saveToField', e.target.value)}
                placeholder="user.response"
                className="telegram-input"
              />
            </div>
          </div>
        );

      case 'if_else':
        return (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/30">
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Условное ветвление
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                Проверяет условие и направляет по одному из двух путей
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Тип проверки
              </label>
              <Select
                value={actionNode.config.checkType || 'field'}
                onValueChange={(value) => updateConfig('checkType', value)}
              >
                <SelectTrigger className="telegram-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="field">Значение поля</SelectItem>
                  <SelectItem value="tag">Наличие тега</SelectItem>
                  <SelectItem value="points">Количество баллов</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {actionNode.config.checkType === 'tag' ? (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Тег для проверки
                </label>
                <Input
                  value={actionNode.config.tag || ''}
                  onChange={(e) => updateConfig('tag', e.target.value)}
                  placeholder="vip"
                  className="telegram-input"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {actionNode.config.checkType === 'points' ? 'Сравнить баллы' : 'Поле для проверки'}
                  </label>
                  <Input
                    value={actionNode.config.field || ''}
                    onChange={(e) => updateConfig('field', e.target.value)}
                    placeholder={actionNode.config.checkType === 'points' ? 'points' : 'user.age'}
                    className="telegram-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Оператор
                  </label>
                  <Select
                    value={actionNode.config.operator || 'equals'}
                    onValueChange={(value) => updateConfig('operator', value)}
                  >
                    <SelectTrigger className="telegram-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Равно</SelectItem>
                      <SelectItem value="not_equals">Не равно</SelectItem>
                      <SelectItem value="greater">Больше</SelectItem>
                      <SelectItem value="greater_eq">Больше или равно</SelectItem>
                      <SelectItem value="less">Меньше</SelectItem>
                      <SelectItem value="less_eq">Меньше или равно</SelectItem>
                      <SelectItem value="contains">Содержит</SelectItem>
                      <SelectItem value="exists">Существует</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {actionNode.config.operator !== 'exists' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Значение
                    </label>
                    <Input
                      value={actionNode.config.value || ''}
                      onChange={(e) => updateConfig('value', e.target.value)}
                      placeholder="18"
                      className="telegram-input"
                    />
                  </div>
                )}
              </>
            )}

            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground mb-2">
                💡 На канвасе соедините выходы:
              </p>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-green-600 dark:text-green-400 font-medium">Да</span>
                  <span className="text-muted-foreground">— условие выполнено</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-red-600 dark:text-red-400 font-medium">Нет</span>
                  <span className="text-muted-foreground">— условие не выполнено</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'check_subscription':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Канал/Чат ID
              </label>
              <Input
                value={actionNode.config.channelId || ''}
                onChange={(e) => updateConfig('channelId', e.target.value)}
                placeholder="@channel или -100123456789"
                className="telegram-input"
              />
            </div>
          </div>
        );

      case 'modify_points':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Количество баллов
              </label>
              <Input
                type="number"
                value={actionNode.config.points || 0}
                onChange={(e) => updateConfig('points', Number(e.target.value))}
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Операция
              </label>
              <Select
                value={actionNode.config.operation || 'add'}
                onValueChange={(value) => updateConfig('operation', value)}
              >
                <SelectTrigger className="telegram-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Добавить</SelectItem>
                  <SelectItem value="subtract">Вычесть</SelectItem>
                  <SelectItem value="set">Установить</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'random_result':
        const randomOutcomeCount = actionNode.config.outcomeCount || 2;
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Количество исходов
              </label>
              <Input
                type="number"
                min={2}
                max={10}
                value={actionNode.config.outcomeCount ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    updateConfig('outcomeCount', '');
                  } else {
                    const num = parseInt(val, 10);
                    if (!isNaN(num)) {
                      updateConfig('outcomeCount', Math.max(2, Math.min(10, num)));
                    }
                  }
                }}
                onBlur={() => {
                  const current = actionNode.config.outcomeCount;
                  if (current === '' || current === undefined || isNaN(Number(current))) {
                    updateConfig('outcomeCount', 2);
                  }
                }}
                className="telegram-input"
              />
              <p className="text-xs text-muted-foreground mt-1">
                От 2 до 10 исходов. Каждый исход получает {Math.round(100 / randomOutcomeCount)}% шанс
              </p>
            </div>
            
            <div className="p-3 rounded-lg bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800/30">
              <p className="text-sm font-medium text-pink-700 dark:text-pink-300 mb-2">
                Вероятности исходов:
              </p>
              <div className="space-y-1">
                {Array.from({ length: randomOutcomeCount }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-pink-600 dark:text-pink-400">Исход {i + 1}</span>
                    <span className="font-medium text-pink-700 dark:text-pink-300">
                      {Math.round(100 / randomOutcomeCount)}%
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-pink-500 dark:text-pink-400 mt-2">
                💡 Соедините каждый выход с нужным меню на канвасе
              </p>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">
                Показывать сообщение в чате
              </label>
              <Switch
                checked={actionNode.config.showNotification === true}
                onCheckedChange={(checked) => updateConfig('showNotification', checked)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Сохранить индекс результата в поле
              </label>
              <Input
                value={actionNode.config.saveToField || ''}
                onChange={(e) => updateConfig('saveToField', e.target.value)}
                placeholder="user.random_outcome"
                className="telegram-input"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Сохраняет номер выбранного исхода (0, 1, 2...)
              </p>
            </div>
          </div>
        );

      case 'weighted_random':
        const weightedOutcomes = actionNode.config.outcomes || [
          { id: 'outcome-0', weight: 50, label: '' },
          { id: 'outcome-1', weight: 50, label: '' },
        ];
        const weightedOutcomeCount = weightedOutcomes.length;
        
        const distributeEqually = () => {
          const count = weightedOutcomes.length;
          const equalWeight = Math.floor(100 / count);
          const updated = weightedOutcomes.map((o: any, i: number) => ({
            ...o,
            weight: i === count - 1 ? 100 - equalWeight * (count - 1) : equalWeight
          }));
          updateConfig('outcomes', updated);
        };

        const updateWeight = (index: number, newWeight: number) => {
          const clampedWeight = Math.max(1, Math.min(99, newWeight));
          const oldWeight = weightedOutcomes[index].weight || 50;
          const diff = clampedWeight - oldWeight;
          
          const updated = [...weightedOutcomes];
          updated[index] = { ...updated[index], weight: clampedWeight };
          
          // Get unlocked indices (excluding current and locked ones)
          const unlockedIndices = updated
            .map((_: any, i: number) => i)
            .filter((i: number) => i !== index && !updated[i].locked);
          
          const unlockedTotal = unlockedIndices.reduce((sum: number, i: number) => sum + (updated[i].weight || 1), 0);
          
          if (unlockedTotal > 0 && diff !== 0) {
            let remaining = -diff;
            unlockedIndices.forEach((i: number, idx: number) => {
              const proportion = (updated[i].weight || 1) / unlockedTotal;
              let change = Math.round(remaining * proportion);
              
              if (idx === unlockedIndices.length - 1) {
                const usedChange = unlockedIndices.slice(0, -1).reduce((sum: number, j: number) => {
                  const prop = (weightedOutcomes[j].weight || 1) / unlockedTotal;
                  return sum + Math.round(-diff * prop);
                }, 0);
                change = remaining - usedChange;
              }
              
              const newVal = Math.max(1, Math.min(99, (updated[i].weight || 1) + change));
              updated[i] = { ...updated[i], weight: newVal };
            });
          }
          
          // Normalize to 100%
          const total = updated.reduce((s: number, o: any) => s + o.weight, 0);
          if (total !== 100 && unlockedIndices.length > 0) {
            const lockedSum = updated.reduce((s: number, o: any, i: number) => 
              o.locked || i === index ? s + o.weight : s, 0);
            const remainder = 100 - lockedSum;
            
            if (remainder > 0) {
              const scale = remainder / unlockedIndices.reduce((s: number, i: number) => s + updated[i].weight, 0);
              let sum = 0;
              unlockedIndices.forEach((i: number, idx: number) => {
                if (idx < unlockedIndices.length - 1) {
                  updated[i].weight = Math.max(1, Math.round(updated[i].weight * scale));
                  sum += updated[i].weight;
                } else {
                  updated[i].weight = Math.max(1, remainder - sum);
                }
              });
            }
          }
          
          updateConfig('outcomes', updated);
        };

        const toggleLock = (index: number) => {
          const updated = [...weightedOutcomes];
          updated[index] = { ...updated[index], locked: !updated[index].locked };
          updateConfig('outcomes', updated);
        };
        
        return (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/30">
              <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">
                Взвешенный случайный выбор
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400">
                Укажите процент для каждого исхода.
              </p>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Количество исходов
                </label>
                <Input
                  type="number"
                  min={2}
                  max={10}
                  value={weightedOutcomeCount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') return;
                    const newCount = Math.max(2, Math.min(10, parseInt(val, 10) || 2));
                    const equalWeight = Math.floor(100 / newCount);
                    const updated: any[] = [];
                    
                    for (let i = 0; i < newCount; i++) {
                      if (i < weightedOutcomes.length) {
                        updated.push({ ...weightedOutcomes[i] });
                      } else {
                        updated.push({ id: `outcome-${i}`, weight: equalWeight, label: '' });
                      }
                    }
                    
                    let sum = 0;
                    updated.forEach((o, i) => {
                      if (i < updated.length - 1) {
                        o.weight = equalWeight;
                        sum += equalWeight;
                      } else {
                        o.weight = 100 - sum;
                      }
                    });
                    
                    updateConfig('outcomes', updated);
                  }}
                  className="telegram-input"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={distributeEqually}
                  className="whitespace-nowrap"
                >
                  Поровну
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {weightedOutcomes.map((outcome: any, index: number) => {
                const colors = ['bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500', 'bg-blue-500'];
                const isLocked = outcome.locked;
                return (
                  <div key={outcome.id || index} className={`p-2 rounded-lg border ${isLocked ? 'bg-muted/60 border-primary/30' : 'bg-muted/30 border-border'}`}>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleLock(index)}
                        className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                          isLocked 
                            ? 'bg-primary/20 text-primary' 
                            : 'bg-transparent text-muted-foreground hover:text-foreground'
                        }`}
                        title={isLocked ? 'Разблокировать' : 'Закрепить значение'}
                      >
                        {isLocked ? '🔒' : '🔓'}
                      </button>
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colors[index % colors.length]}`} />
                      <Input
                        value={outcome.label || ''}
                        onChange={(e) => {
                          const updated = [...weightedOutcomes];
                          updated[index] = { ...updated[index], label: e.target.value };
                          updateConfig('outcomes', updated);
                        }}
                        placeholder={`Исход ${index + 1}`}
                        className="telegram-input flex-1 h-7 text-sm px-2"
                      />
                      <Input
                        type="number"
                        min={1}
                        max={99}
                        value={outcome.weight || 50}
                        onChange={(e) => updateWeight(index, Number(e.target.value) || 1)}
                        disabled={isLocked}
                        className={`telegram-input w-16 h-7 text-sm text-center px-1 ${isLocked ? 'opacity-60' : ''}`}
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                      <input
                        type="range"
                        min={1}
                        max={99}
                        value={outcome.weight || 50}
                        onChange={(e) => updateWeight(index, Number(e.target.value))}
                        disabled={isLocked}
                        className={`w-16 h-1.5 rounded-full appearance-none cursor-pointer ${isLocked ? 'opacity-40' : ''}`}
                        style={{ 
                          background: `linear-gradient(to right, hsl(24 95% 53%) ${outcome.weight}%, hsl(var(--muted)) ${outcome.weight}%)`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Visual distribution bar */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Распределение
              </label>
              <div className="h-4 rounded-md overflow-hidden flex">
                {weightedOutcomes.map((outcome: any, index: number) => {
                  const colors = ['bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500', 'bg-blue-500'];
                  return (
                    <div
                      key={outcome.id || index}
                      className={`${colors[index % colors.length]} flex items-center justify-center text-[9px] font-medium text-white transition-all`}
                      style={{ width: `${outcome.weight}%` }}
                    >
                      {outcome.weight >= 15 && `${outcome.weight}%`}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">
                Показывать сообщение в чате
              </label>
              <Switch
                checked={actionNode.config.showNotification === true}
                onCheckedChange={(checked) => updateConfig('showNotification', checked)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Сохранить индекс результата в поле
              </label>
              <Input
                value={actionNode.config.saveToField || ''}
                onChange={(e) => updateConfig('saveToField', e.target.value)}
                placeholder="user.weighted_outcome"
                className="telegram-input"
              />
            </div>
          </div>
        );

      case 'send_notification':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Текст уведомления
              </label>
              <Textarea
                value={actionNode.config.message || ''}
                onChange={(e) => updateConfig('message', e.target.value)}
                placeholder="Текст уведомления..."
                rows={2}
                className="telegram-input resize-none"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">
                Без звука
              </label>
              <Switch
                checked={actionNode.config.silent || false}
                onCheckedChange={(checked) => updateConfig('silent', checked)}
              />
            </div>
          </div>
        );

      case 'schedule_message':
        const delaySeconds = actionNode.config.delay || 5;
        const formatTime = (seconds: number) => {
          if (seconds < 60) return `${seconds} сек`;
          if (seconds < 3600) return `${Math.floor(seconds / 60)} мин ${seconds % 60} сек`;
          return `${Math.floor(seconds / 3600)} ч ${Math.floor((seconds % 3600) / 60)} мин`;
        };
        
        return (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/30">
              <p className="text-sm font-medium text-violet-700 dark:text-violet-300 mb-1">
                ⏱️ Таймер
              </p>
              <p className="text-xs text-violet-600 dark:text-violet-400">
                Через указанное время выполнит следующий подключённый узел (меню или действие)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Задержка
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  value={delaySeconds}
                  onChange={(e) => updateConfig('delay', Math.max(1, Number(e.target.value)))}
                  className="telegram-input flex-1"
                />
                <Select
                  value={actionNode.config.delayUnit || 'seconds'}
                  onValueChange={(value) => updateConfig('delayUnit', value)}
                >
                  <SelectTrigger className="telegram-input w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seconds">секунд</SelectItem>
                    <SelectItem value="minutes">минут</SelectItem>
                    <SelectItem value="hours">часов</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Итого: <span className="font-medium">{formatTime(
                  actionNode.config.delayUnit === 'minutes' ? delaySeconds * 60 :
                  actionNode.config.delayUnit === 'hours' ? delaySeconds * 3600 :
                  delaySeconds
                )}</span>
              </p>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">
                Показывать "печатает..." во время ожидания
              </label>
              <Switch
                checked={actionNode.config.showTyping || false}
                onCheckedChange={(checked) => updateConfig('showTyping', checked)}
              />
            </div>

            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground">
                💡 Подключите к следующему узлу на канвасе — меню или действие, которое выполнится после таймера
              </p>
            </div>
          </div>
        );

      // Shop actions
      case 'show_product':
        return (
          <div className="space-y-4">
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">🛒 Карточка товара</p>
              <p className="text-xs text-muted-foreground mt-1">Создаёт сообщение с информацией о товаре и кнопками действий</p>
            </div>
            
            {/* Product catalog selection */}
            {products.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Выбрать из каталога
                </label>
                <Select
                  value={actionNode.config.productId || ''}
                  onValueChange={(value) => {
                    const product = products.find(p => p.id === value);
                    if (product) selectProduct(product);
                  }}
                >
                  <SelectTrigger className="telegram-input">
                    <SelectValue placeholder="Выберите товар из каталога" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex items-center gap-2">
                          {product.image_url ? (
                            <img src={product.image_url} alt="" className="w-6 h-6 rounded object-cover" />
                          ) : (
                            <Package className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span>{product.name}</span>
                          <span className="text-muted-foreground ml-auto">
                            {Number(product.price).toLocaleString('ru-RU')} ₽
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {loadingProducts && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Загрузка каталога...
              </div>
            )}
            
            {products.length === 0 && !loadingProducts && (
              <div className="p-3 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-xs text-muted-foreground text-center">
                  Каталог пуст. Заполните данные товара вручную или добавьте товары в каталог.
                </p>
              </div>
            )}
            
            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground mb-3">Или заполните вручную:</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Название товара
              </label>
              <Input
                value={actionNode.config.productName || ''}
                onChange={(e) => updateConfig('productName', e.target.value)}
                placeholder="Футболка Premium"
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Описание
              </label>
              <Textarea
                value={actionNode.config.productDescription || ''}
                onChange={(e) => updateConfig('productDescription', e.target.value)}
                placeholder="Высококачественная футболка из 100% хлопка..."
                rows={3}
                className="telegram-input resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Цена (₽)
                </label>
                <Input
                  type="number"
                  min={0}
                  value={actionNode.config.price || 0}
                  onChange={(e) => updateConfig('price', Number(e.target.value))}
                  className="telegram-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Старая цена
                </label>
                <Input
                  type="number"
                  min={0}
                  value={actionNode.config.oldPrice || ''}
                  onChange={(e) => updateConfig('oldPrice', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Необязательно"
                  className="telegram-input"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Фото товара (URL)
              </label>
              <Input
                type="url"
                value={actionNode.config.imageUrl || ''}
                onChange={(e) => updateConfig('imageUrl', e.target.value)}
                placeholder="https://example.com/product.jpg"
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Артикул / SKU
              </label>
              <Input
                value={actionNode.config.sku || ''}
                onChange={(e) => updateConfig('sku', e.target.value)}
                placeholder="SKU-001"
                className="telegram-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Остаток
                </label>
                <Input
                  type="number"
                  min={0}
                  value={actionNode.config.stock ?? ''}
                  onChange={(e) => updateConfig('stock', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="∞"
                  className="telegram-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Макс. в корзину
                </label>
                <Input
                  type="number"
                  min={1}
                  value={actionNode.config.maxQuantity || 10}
                  onChange={(e) => updateConfig('maxQuantity', Number(e.target.value))}
                  className="telegram-input"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">Показать кнопку "В корзину"</label>
              <Switch
                checked={actionNode.config.showAddToCart !== false}
                onCheckedChange={(checked) => updateConfig('showAddToCart', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">Показать варианты (размер и т.д.)</label>
              <Switch
                checked={actionNode.config.showVariants || false}
                onCheckedChange={(checked) => updateConfig('showVariants', checked)}
              />
            </div>
            {actionNode.config.showVariants && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Варианты (через запятую)
                </label>
                <Input
                  value={(actionNode.config.variants || []).join(', ')}
                  onChange={(e) => updateConfig('variants', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="S, M, L, XL"
                  className="telegram-input"
                />
              </div>
            )}
          </div>
        );

      case 'add_to_cart':
        return (
          <div className="space-y-4">
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">🛒 Добавить в корзину</p>
              <p className="text-xs text-muted-foreground mt-1">Добавляет товар в корзину пользователя</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                ID товара (или переменная)
              </label>
              <Input
                value={actionNode.config.productId || ''}
                onChange={(e) => updateConfig('productId', e.target.value)}
                placeholder="{current_product_id} или product_123"
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Количество
              </label>
              <Input
                type="number"
                min={1}
                value={actionNode.config.quantity || 1}
                onChange={(e) => updateConfig('quantity', Number(e.target.value))}
                className="telegram-input"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">Показать уведомление</label>
              <Switch
                checked={actionNode.config.showNotification !== false}
                onCheckedChange={(checked) => updateConfig('showNotification', checked)}
              />
            </div>
          </div>
        );

      case 'show_cart':
        return (
          <div className="space-y-4">
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">🛒 Показать корзину</p>
              <p className="text-xs text-muted-foreground mt-1">Отображает содержимое корзины пользователя</p>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">Показать итоговую сумму</label>
              <Switch
                checked={actionNode.config.showTotal !== false}
                onCheckedChange={(checked) => updateConfig('showTotal', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">Кнопка "Оформить заказ"</label>
              <Switch
                checked={actionNode.config.showCheckout !== false}
                onCheckedChange={(checked) => updateConfig('showCheckout', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">Кнопка "Очистить"</label>
              <Switch
                checked={actionNode.config.showClear || false}
                onCheckedChange={(checked) => updateConfig('showClear', checked)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Сообщение при пустой корзине
              </label>
              <Input
                value={actionNode.config.emptyMessage || 'Ваша корзина пуста'}
                onChange={(e) => updateConfig('emptyMessage', e.target.value)}
                className="telegram-input"
              />
            </div>
          </div>
        );

      case 'process_payment':
        return (
          <div className="space-y-4">
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">💳 Оплата</p>
              <p className="text-xs text-muted-foreground mt-1">Создаёт счёт для оплаты через Telegram Payments</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Провайдер
              </label>
              <Select
                value={actionNode.config.provider || 'stars'}
                onValueChange={(value) => updateConfig('provider', value)}
              >
                <SelectTrigger className="telegram-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stars">Telegram Stars ⭐</SelectItem>
                  <SelectItem value="yookassa">ЮKassa</SelectItem>
                  <SelectItem value="sber">Сбербанк</SelectItem>
                  <SelectItem value="tinkoff">Тинькофф</SelectItem>
                  <SelectItem value="custom">Другой</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Название платежа
              </label>
              <Input
                value={actionNode.config.title || ''}
                onChange={(e) => updateConfig('title', e.target.value)}
                placeholder="Оплата заказа"
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Описание
              </label>
              <Textarea
                value={actionNode.config.description || ''}
                onChange={(e) => updateConfig('description', e.target.value)}
                placeholder="Заказ №{order_id}"
                rows={2}
                className="telegram-input resize-none"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">Использовать сумму корзины</label>
              <Switch
                checked={actionNode.config.useCartTotal !== false}
                onCheckedChange={(checked) => updateConfig('useCartTotal', checked)}
              />
            </div>
            {!actionNode.config.useCartTotal && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Сумма (₽)
                </label>
                <Input
                  type="number"
                  min={1}
                  value={actionNode.config.amount || ''}
                  onChange={(e) => updateConfig('amount', Number(e.target.value))}
                  className="telegram-input"
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">Запросить имя</label>
              <Switch
                checked={actionNode.config.needName || false}
                onCheckedChange={(checked) => updateConfig('needName', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">Запросить телефон</label>
              <Switch
                checked={actionNode.config.needPhone || false}
                onCheckedChange={(checked) => updateConfig('needPhone', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">Запросить email</label>
              <Switch
                checked={actionNode.config.needEmail || false}
                onCheckedChange={(checked) => updateConfig('needEmail', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">Запросить адрес доставки</label>
              <Switch
                checked={actionNode.config.needShippingAddress || false}
                onCheckedChange={(checked) => updateConfig('needShippingAddress', checked)}
              />
            </div>
          </div>
        );

      case 'apply_promo':
        return (
          <div className="space-y-4">
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">🏷️ Промокод</p>
              <p className="text-xs text-muted-foreground mt-1">Применяет скидку по промокоду</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Код (или переменная)
              </label>
              <Input
                value={actionNode.config.code || ''}
                onChange={(e) => updateConfig('code', e.target.value)}
                placeholder="{user_input} или SALE20"
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Тип скидки
              </label>
              <Select
                value={actionNode.config.discountType || 'percent'}
                onValueChange={(value) => updateConfig('discountType', value)}
              >
                <SelectTrigger className="telegram-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Процент (%)</SelectItem>
                  <SelectItem value="fixed">Фиксированная сумма (₽)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Размер скидки
              </label>
              <Input
                type="number"
                min={0}
                value={actionNode.config.discountValue || 10}
                onChange={(e) => updateConfig('discountValue', Number(e.target.value))}
                className="telegram-input"
              />
            </div>
          </div>
        );

      case 'clear_cart':
        return (
          <div className="space-y-4">
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">🗑️ Очистить корзину</p>
              <p className="text-xs text-muted-foreground mt-1">Удаляет все товары из корзины</p>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">Показать подтверждение</label>
              <Switch
                checked={actionNode.config.confirm || false}
                onCheckedChange={(checked) => updateConfig('confirm', checked)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Сообщение после очистки
              </label>
              <Input
                value={actionNode.config.message || 'Корзина очищена'}
                onChange={(e) => updateConfig('message', e.target.value)}
                className="telegram-input"
              />
            </div>
          </div>
        );

      case 'check_stock':
        return (
          <div className="space-y-4">
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">📦 Проверка остатков</p>
              <p className="text-xs text-muted-foreground mt-1">Проверяет наличие товара на складе</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                ID товара
              </label>
              <Input
                value={actionNode.config.productId || ''}
                onChange={(e) => updateConfig('productId', e.target.value)}
                placeholder="{current_product_id}"
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Сохранить результат в поле
              </label>
              <Input
                value={actionNode.config.saveToField || 'stock_available'}
                onChange={(e) => updateConfig('saveToField', e.target.value)}
                className="telegram-input"
              />
            </div>
          </div>
        );

      case 'update_quantity':
        return (
          <div className="space-y-4">
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">🔢 Изменить количество</p>
              <p className="text-xs text-muted-foreground mt-1">Изменяет количество товара в корзине</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                ID товара
              </label>
              <Input
                value={actionNode.config.productId || ''}
                onChange={(e) => updateConfig('productId', e.target.value)}
                placeholder="{current_product_id}"
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Операция
              </label>
              <Select
                value={actionNode.config.operation || 'set'}
                onValueChange={(value) => updateConfig('operation', value)}
              >
                <SelectTrigger className="telegram-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="set">Установить</SelectItem>
                  <SelectItem value="add">Добавить</SelectItem>
                  <SelectItem value="subtract">Вычесть</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Количество
              </label>
              <Input
                type="number"
                min={0}
                value={actionNode.config.quantity || 1}
                onChange={(e) => updateConfig('quantity', Number(e.target.value))}
                className="telegram-input"
              />
            </div>
          </div>
        );

      case 'remove_from_cart':
        return (
          <div className="space-y-4">
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">❌ Удалить из корзины</p>
              <p className="text-xs text-muted-foreground mt-1">Удаляет товар из корзины</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                ID товара
              </label>
              <Input
                value={actionNode.config.productId || ''}
                onChange={(e) => updateConfig('productId', e.target.value)}
                placeholder="{current_product_id}"
                className="telegram-input"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">Показать уведомление</label>
              <Switch
                checked={actionNode.config.showNotification !== false}
                onCheckedChange={(checked) => updateConfig('showNotification', checked)}
              />
            </div>
          </div>
        );

      case 'request_input':
        return (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                Запрос данных
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Запрашивает ввод от пользователя и сохраняет в переменную
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Текст запроса
              </label>
              <Textarea
                value={actionNode.config.promptText || ''}
                onChange={(e) => updateConfig('promptText', e.target.value)}
                placeholder="Введите ваш email:"
                rows={2}
                className="telegram-input resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Тип ввода
              </label>
              <Select
                value={actionNode.config.inputType || 'text'}
                onValueChange={(value) => updateConfig('inputType', value)}
              >
                <SelectTrigger className="telegram-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Текст</SelectItem>
                  <SelectItem value="number">Число</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Телефон</SelectItem>
                  <SelectItem value="date">Дата</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Сохранить в переменную
              </label>
              <Input
                value={actionNode.config.variableName || ''}
                onChange={(e) => updateConfig('variableName', e.target.value)}
                placeholder="user_email"
                className="telegram-input"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">
                Валидация ввода
              </label>
              <Switch
                checked={actionNode.config.validate || false}
                onCheckedChange={(checked) => updateConfig('validate', checked)}
              />
            </div>

            {actionNode.config.validate && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Сообщение об ошибке
                </label>
                <Input
                  value={actionNode.config.errorMessage || ''}
                  onChange={(e) => updateConfig('errorMessage', e.target.value)}
                  placeholder="Пожалуйста, введите корректный email"
                  className="telegram-input"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Таймаут ожидания (сек)
              </label>
              <Input
                type="number"
                min={0}
                max={3600}
                value={actionNode.config.timeout || 60}
                onChange={(e) => updateConfig('timeout', Number(e.target.value))}
                className="telegram-input"
              />
              <p className="text-xs text-muted-foreground mt-1">0 = без ограничения</p>
            </div>
          </div>
        );

      case 'quiz':
        const quizQuestions = actionNode.config.questions || [
          { id: 'q1', text: '', answers: [{ id: 'a1', text: '', correct: true }, { id: 'a2', text: '', correct: false }] }
        ];

        const addQuestion = () => {
          const newQ = {
            id: `q${Date.now()}`,
            text: '',
            answers: [
              { id: `a${Date.now()}-1`, text: '', correct: true },
              { id: `a${Date.now()}-2`, text: '', correct: false }
            ]
          };
          updateConfig('questions', [...quizQuestions, newQ]);
        };

        const updateQuestion = (qIndex: number, field: string, value: any) => {
          const updated = [...quizQuestions];
          updated[qIndex] = { ...updated[qIndex], [field]: value };
          updateConfig('questions', updated);
        };

        const addAnswer = (qIndex: number) => {
          const updated = [...quizQuestions];
          updated[qIndex].answers.push({ id: `a${Date.now()}`, text: '', correct: false });
          updateConfig('questions', updated);
        };

        const updateAnswer = (qIndex: number, aIndex: number, field: string, value: any) => {
          const updated = [...quizQuestions];
          if (field === 'correct' && value === true) {
            // Only one correct answer per question
            updated[qIndex].answers = updated[qIndex].answers.map((a: any, i: number) => ({
              ...a,
              correct: i === aIndex
            }));
          } else {
            updated[qIndex].answers[aIndex] = { ...updated[qIndex].answers[aIndex], [field]: value };
          }
          updateConfig('questions', updated);
        };

        const removeQuestion = (qIndex: number) => {
          if (quizQuestions.length <= 1) return;
          const updated = quizQuestions.filter((_: any, i: number) => i !== qIndex);
          updateConfig('questions', updated);
        };

        const removeAnswer = (qIndex: number, aIndex: number) => {
          const updated = [...quizQuestions];
          if (updated[qIndex].answers.length <= 2) return;
          updated[qIndex].answers = updated[qIndex].answers.filter((_: any, i: number) => i !== aIndex);
          updateConfig('questions', updated);
        };

        return (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/30">
              <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1">
                Квиз с вопросами
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400">
                Создайте викторину с подсчётом баллов
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Баллов за правильный ответ
              </label>
              <Input
                type="number"
                min={1}
                value={actionNode.config.pointsPerCorrect || 1}
                onChange={(e) => updateConfig('pointsPerCorrect', Number(e.target.value))}
                className="telegram-input"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Вопросы ({quizQuestions.length})
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addQuestion}
                >
                  + Вопрос
                </Button>
              </div>

              {quizQuestions.map((question: any, qIndex: number) => (
                <div key={question.id} className="p-3 rounded-lg bg-muted/30 border border-border space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-5">{qIndex + 1}.</span>
                    <Input
                      value={question.text || ''}
                      onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                      placeholder="Текст вопроса"
                      className="telegram-input flex-1 h-8 text-sm"
                    />
                    {quizQuestions.length > 1 && (
                      <button
                        onClick={() => removeQuestion(qIndex)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="pl-5 space-y-1.5">
                    {question.answers.map((answer: any, aIndex: number) => (
                      <div key={answer.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateAnswer(qIndex, aIndex, 'correct', true)}
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                            answer.correct 
                              ? 'border-green-500 bg-green-500' 
                              : 'border-muted-foreground/40 hover:border-green-400'
                          }`}
                        >
                          {answer.correct && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </button>
                        <Input
                          value={answer.text || ''}
                          onChange={(e) => updateAnswer(qIndex, aIndex, 'text', e.target.value)}
                          placeholder={`Ответ ${aIndex + 1}`}
                          className="telegram-input flex-1 h-7 text-sm"
                        />
                        {question.answers.length > 2 && (
                          <button
                            onClick={() => removeAnswer(qIndex, aIndex)}
                            className="p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => addAnswer(qIndex)}
                      className="text-xs text-primary hover:underline"
                    >
                      + Добавить ответ
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Сохранить результат в
              </label>
              <Input
                value={actionNode.config.saveToField || 'quiz_score'}
                onChange={(e) => updateConfig('saveToField', e.target.value)}
                className="telegram-input"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">
                Показать результат после квиза
              </label>
              <Switch
                checked={actionNode.config.showResult !== false}
                onCheckedChange={(checked) => updateConfig('showResult', checked)}
              />
            </div>

            {actionNode.config.showResult !== false && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Текст результата
                </label>
                <Textarea
                  value={actionNode.config.resultText || 'Вы набрали {score} из {total} баллов!'}
                  onChange={(e) => updateConfig('resultText', e.target.value)}
                  placeholder="Вы набрали {score} из {total} баллов!"
                  rows={2}
                  className="telegram-input resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Переменные: <code className="bg-muted px-1 rounded">{'{score}'}</code>, <code className="bg-muted px-1 rounded">{'{total}'}</code>, <code className="bg-muted px-1 rounded">{'{percent}'}</code>
                </p>
              </div>
            )}
          </div>
        );

      case 'lottery':
        return (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">
                🎰 Лотерея
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Случайный розыгрыш с настраиваемым шансом выигрыша
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Шанс выигрыша (%)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={actionNode.config.winChance || 10}
                onChange={(e) => updateConfig('winChance', Number(e.target.value))}
                className="telegram-input"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Вероятность выигрыша: {actionNode.config.winChance || 10}%
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Приз
              </label>
              <Input
                value={actionNode.config.prize || ''}
                onChange={(e) => updateConfig('prize', e.target.value)}
                placeholder="100 баллов"
                className="telegram-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Баллы за выигрыш
              </label>
              <Input
                type="number"
                min={0}
                value={actionNode.config.prizePoints || 0}
                onChange={(e) => updateConfig('prizePoints', Number(e.target.value))}
                className="telegram-input"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Сколько баллов начислить при выигрыше
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Сообщение при выигрыше
              </label>
              <Textarea
                value={actionNode.config.winMessage || '🎉 Поздравляем! Вы выиграли {prize}!'}
                onChange={(e) => updateConfig('winMessage', e.target.value)}
                placeholder="🎉 Поздравляем! Вы выиграли {prize}!"
                rows={2}
                className="telegram-input resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Сообщение при проигрыше
              </label>
              <Textarea
                value={actionNode.config.loseMessage || '😔 К сожалению, не повезло. Попробуйте ещё!'}
                onChange={(e) => updateConfig('loseMessage', e.target.value)}
                placeholder="😔 К сожалению, не повезло. Попробуйте ещё!"
                rows={2}
                className="telegram-input resize-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">
                Ограничить попытки в день
              </label>
              <Switch
                checked={actionNode.config.limitPerDay || false}
                onCheckedChange={(checked) => updateConfig('limitPerDay', checked)}
              />
            </div>

            {actionNode.config.limitPerDay && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Макс. попыток в день
                </label>
                <Input
                  type="number"
                  min={1}
                  value={actionNode.config.maxAttemptsPerDay || 1}
                  onChange={(e) => updateConfig('maxAttemptsPerDay', Number(e.target.value))}
                  className="telegram-input"
                />
              </div>
            )}

            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground">
                💡 Подключите выходы "Выигрыш" и "Проигрыш" к разным меню на канвасе
              </p>
            </div>
          </div>
        );

      case 'leaderboard':
        return (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30">
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-1">
                🏆 Таблица лидеров
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                Показывает рейтинг пользователей по баллам
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Заголовок
              </label>
              <Input
                value={actionNode.config.title || '🏆 Топ игроков'}
                onChange={(e) => updateConfig('title', e.target.value)}
                placeholder="🏆 Топ игроков"
                className="telegram-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Количество позиций
              </label>
              <Input
                type="number"
                min={3}
                max={50}
                value={actionNode.config.limit || 10}
                onChange={(e) => updateConfig('limit', Number(e.target.value))}
                className="telegram-input"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Показать топ-{actionNode.config.limit || 10} участников
              </p>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">
                Показать позицию пользователя
              </label>
              <Switch
                checked={actionNode.config.showUserPosition !== false}
                onCheckedChange={(checked) => updateConfig('showUserPosition', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">
                Показать изменение позиции
              </label>
              <Switch
                checked={actionNode.config.showPositionChange || false}
                onCheckedChange={(checked) => updateConfig('showPositionChange', checked)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Формат отображения
              </label>
              <Select
                value={actionNode.config.displayFormat || 'list'}
                onValueChange={(value) => updateConfig('displayFormat', value)}
              >
                <SelectTrigger className="telegram-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">Список</SelectItem>
                  <SelectItem value="compact">Компактный</SelectItem>
                  <SelectItem value="detailed">Детальный</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground">
                📊 Рейтинг формируется на основе баллов пользователей
              </p>
            </div>
          </div>
        );

      case 'spam_protection':
        return (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30">
              <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                🛡️ Антиспам
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">
                Защита от слишком частых нажатий
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Минимальный интервал (секунды)
              </label>
              <Input
                type="number"
                min={1}
                max={3600}
                value={actionNode.config.cooldownSeconds || 5}
                onChange={(e) => updateConfig('cooldownSeconds', Number(e.target.value))}
                className="telegram-input"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Через сколько секунд можно повторить действие
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Сообщение при блокировке
              </label>
              <Textarea
                value={actionNode.config.blockedMessage || '⏳ Подождите {remaining} секунд перед следующим действием'}
                onChange={(e) => updateConfig('blockedMessage', e.target.value)}
                placeholder="⏳ Подождите {remaining} секунд"
                rows={2}
                className="telegram-input resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Переменная: <code className="bg-muted px-1 rounded">{'{remaining}'}</code> — оставшееся время
              </p>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">
                Показывать уведомление при блокировке
              </label>
              <Switch
                checked={actionNode.config.showBlockMessage !== false}
                onCheckedChange={(checked) => updateConfig('showBlockMessage', checked)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Максимум действий за период
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  min={1}
                  value={actionNode.config.maxActions || 10}
                  onChange={(e) => updateConfig('maxActions', Number(e.target.value))}
                  placeholder="Кол-во"
                  className="telegram-input"
                />
                <Select
                  value={actionNode.config.periodType || 'hour'}
                  onValueChange={(value) => updateConfig('periodType', value)}
                >
                  <SelectTrigger className="telegram-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minute">в минуту</SelectItem>
                    <SelectItem value="hour">в час</SelectItem>
                    <SelectItem value="day">в день</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground">
                ⚡ Если лимит превышен, пользователь не сможет выполнить действие до истечения периода
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-6 text-muted-foreground">
            <p>Настройки для этого действия скоро появятся</p>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 w-full max-w-md bg-card border-l border-border z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{info?.name || 'Действие'}</h2>
          <p className="text-sm text-muted-foreground">{info?.description}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowHelp(true)}
            className="p-2 rounded-lg hover:bg-primary/10 transition-colors group"
            title="Справка"
          >
            <HelpCircle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-5 pr-6">
          {renderConfig()}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Удалить
        </Button>
        <Button size="sm" onClick={onClose}>
          <Save className="w-4 h-4 mr-2" />
          Готово
        </Button>
      </div>

      <AnimatePresence>
        {showHelp && (
          <ActionHelpPanel 
            actionType={actionNode.type} 
            onClose={() => setShowHelp(false)} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
