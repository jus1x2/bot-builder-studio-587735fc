import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, HelpCircle } from 'lucide-react';
import { BotActionNode, BotMenu, ACTION_INFO, ActionType } from '@/types/bot';
import { useProjectStore } from '@/stores/projectStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ActionHelpPanel } from './ActionHelpPanel';

interface ActionNodeEditorProps {
  actionNode: BotActionNode;
  menus: BotMenu[];
  onClose: () => void;
  onDelete: () => void;
}

export function ActionNodeEditor({ actionNode, menus, onClose, onDelete }: ActionNodeEditorProps) {
  const [showHelp, setShowHelp] = useState(false);
  const { updateActionNode } = useProjectStore();
  const info = ACTION_INFO[actionNode.type];

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
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Поле для проверки
              </label>
              <Input
                value={actionNode.config.field || ''}
                onChange={(e) => updateConfig('field', e.target.value)}
                placeholder="user.age"
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
                  <SelectItem value="less">Меньше</SelectItem>
                  <SelectItem value="contains">Содержит</SelectItem>
                  <SelectItem value="exists">Существует</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Варианты (через запятую)
              </label>
              <Textarea
                value={(actionNode.config.options || []).join(', ')}
                onChange={(e) => updateConfig('options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="Да, Нет, Может быть"
                rows={3}
                className="telegram-input resize-none"
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
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Отправить через (секунды)
              </label>
              <Input
                type="number"
                min={60}
                value={actionNode.config.delay || 3600}
                onChange={(e) => updateConfig('delay', Number(e.target.value))}
                className="telegram-input"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.floor((actionNode.config.delay || 3600) / 3600)} ч {Math.floor(((actionNode.config.delay || 3600) % 3600) / 60)} мин
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Сообщение
              </label>
              <Textarea
                value={actionNode.config.message || ''}
                onChange={(e) => updateConfig('message', e.target.value)}
                placeholder="Текст отложенного сообщения..."
                rows={3}
                className="telegram-input resize-none"
              />
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
