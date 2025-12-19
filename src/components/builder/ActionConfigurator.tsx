import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Save, MessageSquare, ArrowRight, Link, Edit3, Plus, Minus, Tag, GitBranch,
  UserCheck, Shield, CheckCircle, ShoppingCart, Hash, Package, Percent, ShoppingBag,
  Trash, CreditCard, Dice1, Gift, Trophy, Star, Clock, Target, Edit, HelpCircle,
  Bell, UserPlus, ChevronDown, Search, XCircle, Timer, Calendar, Send, MoreHorizontal
} from 'lucide-react';
import { BotAction, ActionType, ACTION_INFO, BotMenu } from '@/types/bot';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ActionHelpPanel } from './ActionHelpPanel';

const actionIcons: Record<string, React.ElementType> = {
  show_text: MessageSquare,
  navigate_menu: ArrowRight,
  open_url: Link,
  delay: Clock,
  typing_indicator: MoreHorizontal,
  set_field: Edit3,
  change_field: Plus,
  append_to_list: Plus,
  clear_field: Trash,
  add_tag: Tag,
  remove_tag: Tag,
  if_else: GitBranch,
  check_subscription: UserCheck,
  check_role: Shield,
  check_value: CheckCircle,
  wait_response: MessageSquare,
  keyword_trigger: Search,
  no_response: Clock,
  wrong_response: XCircle,
  add_to_cart: ShoppingCart,
  update_quantity: Hash,
  show_product: Package,
  remove_from_cart: X,
  check_stock: Package,
  apply_promo: Percent,
  show_cart: ShoppingBag,
  clear_cart: Trash,
  process_payment: CreditCard,
  random_result: Dice1,
  weighted_random: Dice1,
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

interface ActionConfiguratorProps {
  action: BotAction;
  menus: BotMenu[];
  onChange: (config: Record<string, any>) => void;
  onClose: () => void;
  onSave: () => void;
}

export function ActionConfigurator({ action, menus, onChange, onClose, onSave }: ActionConfiguratorProps) {
  const [showHelp, setShowHelp] = useState(false);
  const Icon = actionIcons[action.type] || MessageSquare;
  const info = ACTION_INFO[action.type];

  const updateConfig = (key: string, value: any) => {
    onChange({ ...action.config, [key]: value });
  };

  const renderConfig = () => {
    switch (action.type) {
      case 'show_text':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Текст сообщения
              </label>
              <Textarea
                value={action.config.text || ''}
                onChange={(e) => updateConfig('text', e.target.value)}
                placeholder="Привет, {first_name}! Как дела?"
                rows={4}
                className="telegram-input resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Переменные: <code className="bg-muted px-1 rounded">{'{first_name}'}</code>, <code className="bg-muted px-1 rounded">{'{last_name}'}</code>, <code className="bg-muted px-1 rounded">{'{username}'}</code>, <code className="bg-muted px-1 rounded">{'{user_id}'}</code>, <code className="bg-muted px-1 rounded">{'{date}'}</code>, <code className="bg-muted px-1 rounded">{'{time}'}</code>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Форматирование
              </label>
              <Select
                value={action.config.parseMode || 'plain'}
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
                value={action.config.seconds || 1}
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
                checked={action.config.showTyping || false}
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
              value={action.config.seconds || 2}
              onChange={(e) => updateConfig('seconds', Number(e.target.value))}
              className="telegram-input"
            />
            <p className="text-xs text-muted-foreground mt-1">Показывает индикатор "печатает..." от 1 до 10 секунд</p>
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
                value={action.config.timeout || 60}
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
                value={action.config.saveToField || ''}
                onChange={(e) => updateConfig('saveToField', e.target.value)}
                placeholder="user.response"
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                При истечении таймаута
              </label>
              <Select
                value={action.config.timeoutAction || 'none'}
                onValueChange={(value) => updateConfig('timeoutAction', value)}
              >
                <SelectTrigger className="telegram-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ничего</SelectItem>
                  <SelectItem value="repeat">Повторить вопрос</SelectItem>
                  <SelectItem value="next">Продолжить</SelectItem>
                  <SelectItem value="menu">Перейти в меню</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'keyword_trigger':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Ключевые слова (через запятую)
              </label>
              <Textarea
                value={(action.config.keywords || []).join(', ')}
                onChange={(e) => updateConfig('keywords', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="привет, начать, старт"
                rows={2}
                className="telegram-input resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Тип совпадения
              </label>
              <Select
                value={action.config.matchType || 'contains'}
                onValueChange={(value) => updateConfig('matchType', value)}
              >
                <SelectTrigger className="telegram-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contains">Содержит</SelectItem>
                  <SelectItem value="exact">Точное совпадение</SelectItem>
                  <SelectItem value="starts">Начинается с</SelectItem>
                  <SelectItem value="ends">Заканчивается на</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">
                Учитывать регистр
              </label>
              <Switch
                checked={action.config.caseSensitive || false}
                onCheckedChange={(checked) => updateConfig('caseSensitive', checked)}
              />
            </div>
          </div>
        );

      case 'no_response':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Ждать (секунды)
              </label>
              <Input
                type="number"
                min={60}
                value={action.config.timeout || 300}
                onChange={(e) => updateConfig('timeout', Number(e.target.value))}
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Действие
              </label>
              <Select
                value={action.config.action || 'send_reminder'}
                onValueChange={(value) => updateConfig('action', value)}
              >
                <SelectTrigger className="telegram-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="send_reminder">Отправить напоминание</SelectItem>
                  <SelectItem value="go_to_menu">Перейти в меню</SelectItem>
                  <SelectItem value="add_tag">Добавить тег</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'wrong_response':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Макс. попыток
              </label>
              <Input
                type="number"
                min={1}
                max={10}
                value={action.config.maxAttempts || 3}
                onChange={(e) => updateConfig('maxAttempts', Number(e.target.value))}
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Действие при неверном ответе
              </label>
              <Select
                value={action.config.action || 'show_hint'}
                onValueChange={(value) => updateConfig('action', value)}
              >
                <SelectTrigger className="telegram-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="show_hint">Показать подсказку</SelectItem>
                  <SelectItem value="repeat">Повторить вопрос</SelectItem>
                  <SelectItem value="skip">Пропустить</SelectItem>
                  <SelectItem value="go_to_menu">Перейти в меню</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Текст подсказки
              </label>
              <Input
                value={action.config.hintText || ''}
                onChange={(e) => updateConfig('hintText', e.target.value)}
                placeholder="Попробуйте ещё раз..."
                className="telegram-input"
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
                value={action.config.delay || 3600}
                onChange={(e) => updateConfig('delay', Number(e.target.value))}
                className="telegram-input"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.floor((action.config.delay || 3600) / 3600)} ч {Math.floor(((action.config.delay || 3600) % 3600) / 60)} мин
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Сообщение
              </label>
              <Textarea
                value={action.config.message || ''}
                onChange={(e) => updateConfig('message', e.target.value)}
                placeholder="Текст отложенного сообщения..."
                rows={3}
                className="telegram-input resize-none"
              />
            </div>
          </div>
        );

      case 'broadcast':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Сегмент
              </label>
              <Select
                value={action.config.segment || 'all'}
                onValueChange={(value) => updateConfig('segment', value)}
              >
                <SelectTrigger className="telegram-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все пользователи</SelectItem>
                  <SelectItem value="active">Активные (7 дней)</SelectItem>
                  <SelectItem value="inactive">Неактивные</SelectItem>
                  <SelectItem value="tag">По тегу</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {action.config.segment === 'tag' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Тег
                </label>
                <Input
                  value={action.config.tag || ''}
                  onChange={(e) => updateConfig('tag', e.target.value)}
                  placeholder="VIP"
                  className="telegram-input"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Сообщение
              </label>
              <Textarea
                value={action.config.message || ''}
                onChange={(e) => updateConfig('message', e.target.value)}
                placeholder="Текст рассылки..."
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
                value={action.config.message || ''}
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
                checked={action.config.silent || false}
                onCheckedChange={(checked) => updateConfig('silent', checked)}
              />
            </div>
          </div>
        );

      case 'navigate_menu':
        return (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Целевое меню
            </label>
            <Select
              value={action.config.targetMenuId || ''}
              onValueChange={(value) => updateConfig('targetMenuId', value)}
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
                URL адрес
              </label>
              <Input
                value={action.config.url || ''}
                onChange={(e) => updateConfig('url', e.target.value)}
                placeholder="https://example.com"
                className="telegram-input"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">
                Открыть в браузере (не в Telegram)
              </label>
              <Switch
                checked={action.config.openInBrowser || false}
                onCheckedChange={(checked) => updateConfig('openInBrowser', checked)}
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
                value={action.config.field || ''}
                onChange={(e) => updateConfig('field', e.target.value)}
                placeholder="user.name, user.balance"
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Тип значения
              </label>
              <Select
                value={action.config.valueType || 'text'}
                onValueChange={(value) => updateConfig('valueType', value)}
              >
                <SelectTrigger className="telegram-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Текст</SelectItem>
                  <SelectItem value="number">Число</SelectItem>
                  <SelectItem value="boolean">Да/Нет</SelectItem>
                  <SelectItem value="variable">Переменная</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Значение
              </label>
              <Input
                value={action.config.value || ''}
                onChange={(e) => updateConfig('value', e.target.value)}
                placeholder="Введите значение"
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
                value={action.config.field || ''}
                onChange={(e) => updateConfig('field', e.target.value)}
                placeholder="user.balance, user.points"
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Операция
              </label>
              <Select
                value={action.config.operation || 'add'}
                onValueChange={(value) => updateConfig('operation', value)}
              >
                <SelectTrigger className="telegram-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Добавить (+)</SelectItem>
                  <SelectItem value="subtract">Вычесть (−)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Значение
              </label>
              <Input
                type="number"
                value={action.config.value || 0}
                onChange={(e) => updateConfig('value', Number(e.target.value))}
                className="telegram-input"
              />
            </div>
          </div>
        );

      case 'append_to_list':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Поле (список)
              </label>
              <Input
                value={action.config.field || ''}
                onChange={(e) => updateConfig('field', e.target.value)}
                placeholder="user.purchases, user.history"
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Значение для добавления
              </label>
              <Input
                value={action.config.value || ''}
                onChange={(e) => updateConfig('value', e.target.value)}
                placeholder="Новый элемент"
                className="telegram-input"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">
                Уникальные значения
              </label>
              <Switch
                checked={action.config.unique || false}
                onCheckedChange={(checked) => updateConfig('unique', checked)}
              />
            </div>
          </div>
        );

      case 'clear_field':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Поле для очистки
              </label>
              <Input
                value={action.config.field || ''}
                onChange={(e) => updateConfig('field', e.target.value)}
                placeholder="user.temp_data"
                className="telegram-input"
              />
            </div>
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">
                ⚠️ Это действие безвозвратно удалит значение поля
              </p>
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
              value={action.config.tag || ''}
              onChange={(e) => updateConfig('tag', e.target.value)}
              placeholder="VIP, paid, admin"
              className="telegram-input"
            />
          </div>
        );

      case 'if_else':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Тип условия
              </label>
              <Select
                value={action.config.conditionType || 'field'}
                onValueChange={(value) => updateConfig('conditionType', value)}
              >
                <SelectTrigger className="telegram-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="field">Проверка поля</SelectItem>
                  <SelectItem value="tag">Наличие тега</SelectItem>
                  <SelectItem value="subscription">Подписка на канал</SelectItem>
                  <SelectItem value="time">Время суток</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {action.config.conditionType === 'field' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Поле
                  </label>
                  <Input
                    value={action.config.field || ''}
                    onChange={(e) => updateConfig('field', e.target.value)}
                    placeholder="user.balance"
                    className="telegram-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Оператор
                  </label>
                  <Select
                    value={action.config.operator || 'equals'}
                    onValueChange={(value) => updateConfig('operator', value)}
                  >
                    <SelectTrigger className="telegram-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Равно (=)</SelectItem>
                      <SelectItem value="not_equals">Не равно (≠)</SelectItem>
                      <SelectItem value="greater">Больше (&gt;)</SelectItem>
                      <SelectItem value="less">Меньше (&lt;)</SelectItem>
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
                    value={action.config.value || ''}
                    onChange={(e) => updateConfig('value', e.target.value)}
                    placeholder="100"
                    className="telegram-input"
                  />
                </div>
              </>
            )}
            {action.config.conditionType === 'tag' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Тег
                </label>
                <Input
                  value={action.config.tag || ''}
                  onChange={(e) => updateConfig('tag', e.target.value)}
                  placeholder="VIP"
                  className="telegram-input"
                />
              </div>
            )}
            {action.config.conditionType === 'subscription' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Канал/Чат
                </label>
                <Input
                  value={action.config.channel || ''}
                  onChange={(e) => updateConfig('channel', e.target.value)}
                  placeholder="@channel"
                  className="telegram-input"
                />
              </div>
            )}
            {action.config.conditionType === 'time' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    С
                  </label>
                  <Input
                    type="time"
                    value={action.config.timeFrom || '09:00'}
                    onChange={(e) => updateConfig('timeFrom', e.target.value)}
                    className="telegram-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    До
                  </label>
                  <Input
                    type="time"
                    value={action.config.timeTo || '18:00'}
                    onChange={(e) => updateConfig('timeTo', e.target.value)}
                    className="telegram-input"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Если ДА → перейти в меню
              </label>
              <Select
                value={action.config.trueMenuId || ''}
                onValueChange={(value) => updateConfig('trueMenuId', value)}
              >
                <SelectTrigger className="telegram-input">
                  <SelectValue placeholder="Выберите меню" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Продолжить</SelectItem>
                  {menus.map((menu) => (
                    <SelectItem key={menu.id} value={menu.id}>
                      {menu.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Если НЕТ → перейти в меню
              </label>
              <Select
                value={action.config.falseMenuId || ''}
                onValueChange={(value) => updateConfig('falseMenuId', value)}
              >
                <SelectTrigger className="telegram-input">
                  <SelectValue placeholder="Выберите меню" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Продолжить</SelectItem>
                  {menus.map((menu) => (
                    <SelectItem key={menu.id} value={menu.id}>
                      {menu.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'check_role':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Требуемая роль
              </label>
              <Select
                value={action.config.role || 'admin'}
                onValueChange={(value) => updateConfig('role', value)}
              >
                <SelectTrigger className="telegram-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Администратор</SelectItem>
                  <SelectItem value="moderator">Модератор</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="subscriber">Подписчик</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Если нет роли
              </label>
              <Select
                value={action.config.onFail || 'show_message'}
                onValueChange={(value) => updateConfig('onFail', value)}
              >
                <SelectTrigger className="telegram-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="show_message">Показать сообщение</SelectItem>
                  <SelectItem value="go_to_menu">Перейти в меню</SelectItem>
                  <SelectItem value="stop">Остановить</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {action.config.onFail === 'show_message' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Сообщение
                </label>
                <Input
                  value={action.config.failMessage || ''}
                  onChange={(e) => updateConfig('failMessage', e.target.value)}
                  placeholder="У вас нет доступа"
                  className="telegram-input"
                />
              </div>
            )}
          </div>
        );

      case 'check_value':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Поле
              </label>
              <Input
                value={action.config.field || ''}
                onChange={(e) => updateConfig('field', e.target.value)}
                placeholder="user.age"
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Оператор сравнения
              </label>
              <Select
                value={action.config.operator || 'equals'}
                onValueChange={(value) => updateConfig('operator', value)}
              >
                <SelectTrigger className="telegram-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Равно (=)</SelectItem>
                  <SelectItem value="not_equals">Не равно (≠)</SelectItem>
                  <SelectItem value="greater">Больше (&gt;)</SelectItem>
                  <SelectItem value="greater_or_equal">Больше или равно (≥)</SelectItem>
                  <SelectItem value="less">Меньше (&lt;)</SelectItem>
                  <SelectItem value="less_or_equal">Меньше или равно (≤)</SelectItem>
                  <SelectItem value="contains">Содержит</SelectItem>
                  <SelectItem value="is_empty">Пусто</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Сравнить с
              </label>
              <Input
                value={action.config.compareValue || ''}
                onChange={(e) => updateConfig('compareValue', e.target.value)}
                placeholder="Значение"
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
                Канал/Чат
              </label>
              <Input
                value={action.config.channelUsername || ''}
                onChange={(e) => updateConfig('channelUsername', e.target.value)}
                placeholder="@channel"
                className="telegram-input"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">
                Требовать публичный доступ
              </label>
              <Switch
                checked={action.config.requirePublicAccess || false}
                onCheckedChange={(checked) => updateConfig('requirePublicAccess', checked)}
              />
            </div>
          </div>
        );

      case 'add_to_cart':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                ID товара
              </label>
              <Input
                value={action.config.productId || ''}
                onChange={(e) => updateConfig('productId', e.target.value)}
                placeholder="product_001"
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Название
              </label>
              <Input
                value={action.config.productName || ''}
                onChange={(e) => updateConfig('productName', e.target.value)}
                placeholder="Название товара"
                className="telegram-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Цена
                </label>
                <Input
                  type="number"
                  value={action.config.price || 0}
                  onChange={(e) => updateConfig('price', Number(e.target.value))}
                  className="telegram-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Валюта
                </label>
                <Select
                  value={action.config.currency || '₽'}
                  onValueChange={(value) => updateConfig('currency', value)}
                >
                  <SelectTrigger className="telegram-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="₽">₽ (Рубль)</SelectItem>
                    <SelectItem value="$">$ (Доллар)</SelectItem>
                    <SelectItem value="€">€ (Евро)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Количество
              </label>
              <Input
                type="number"
                min={1}
                value={action.config.quantity || 1}
                onChange={(e) => updateConfig('quantity', Number(e.target.value))}
                className="telegram-input"
              />
            </div>
          </div>
        );

      case 'update_quantity':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                ID товара
              </label>
              <Input
                value={action.config.productId || ''}
                onChange={(e) => updateConfig('productId', e.target.value)}
                placeholder="product_001"
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Действие
              </label>
              <Select
                value={action.config.operation || 'set'}
                onValueChange={(value) => updateConfig('operation', value)}
              >
                <SelectTrigger className="telegram-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="set">Установить значение</SelectItem>
                  <SelectItem value="add">Добавить (+)</SelectItem>
                  <SelectItem value="subtract">Уменьшить (−)</SelectItem>
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
                value={action.config.quantity || 1}
                onChange={(e) => updateConfig('quantity', Number(e.target.value))}
                className="telegram-input"
              />
            </div>
          </div>
        );

      case 'show_product':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                ID товара
              </label>
              <Input
                value={action.config.productId || ''}
                onChange={(e) => updateConfig('productId', e.target.value)}
                placeholder="product_001"
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Название
              </label>
              <Input
                value={action.config.name || ''}
                onChange={(e) => updateConfig('name', e.target.value)}
                placeholder="Название товара"
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Описание
              </label>
              <Textarea
                value={action.config.description || ''}
                onChange={(e) => updateConfig('description', e.target.value)}
                placeholder="Описание товара..."
                rows={3}
                className="telegram-input resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Цена
                </label>
                <Input
                  type="number"
                  value={action.config.price || 0}
                  onChange={(e) => updateConfig('price', Number(e.target.value))}
                  className="telegram-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Валюта
                </label>
                <Select
                  value={action.config.currency || '₽'}
                  onValueChange={(value) => updateConfig('currency', value)}
                >
                  <SelectTrigger className="telegram-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="₽">₽ (Рубль)</SelectItem>
                    <SelectItem value="$">$ (Доллар)</SelectItem>
                    <SelectItem value="€">€ (Евро)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                URL изображения
              </label>
              <Input
                value={action.config.imageUrl || ''}
                onChange={(e) => updateConfig('imageUrl', e.target.value)}
                placeholder="https://..."
                className="telegram-input"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">
                Показать кнопку "В корзину"
              </label>
              <Switch
                checked={action.config.showAddButton !== false}
                onCheckedChange={(checked) => updateConfig('showAddButton', checked)}
              />
            </div>
          </div>
        );

      case 'remove_from_cart':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                ID товара
              </label>
              <Input
                value={action.config.productId || ''}
                onChange={(e) => updateConfig('productId', e.target.value)}
                placeholder="product_001 или оставьте пустым для всех"
                className="telegram-input"
              />
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">
                💡 Оставьте ID пустым, чтобы удалить все товары данного типа
              </p>
            </div>
          </div>
        );

      case 'check_stock':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                ID товара
              </label>
              <Input
                value={action.config.productId || ''}
                onChange={(e) => updateConfig('productId', e.target.value)}
                placeholder="product_001"
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Минимальное количество
              </label>
              <Input
                type="number"
                min={0}
                value={action.config.minQuantity || 1}
                onChange={(e) => updateConfig('minQuantity', Number(e.target.value))}
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Если нет в наличии
              </label>
              <Select
                value={action.config.onOutOfStock || 'show_message'}
                onValueChange={(value) => updateConfig('onOutOfStock', value)}
              >
                <SelectTrigger className="telegram-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="show_message">Показать сообщение</SelectItem>
                  <SelectItem value="go_to_menu">Перейти в меню</SelectItem>
                  <SelectItem value="stop">Остановить</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'apply_promo':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Промокод
              </label>
              <Input
                value={action.config.code || ''}
                onChange={(e) => updateConfig('code', e.target.value)}
                placeholder="DISCOUNT10"
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Тип скидки
              </label>
              <Select
                value={action.config.discountType || 'percent'}
                onValueChange={(value) => updateConfig('discountType', value)}
              >
                <SelectTrigger className="telegram-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Процент (%)</SelectItem>
                  <SelectItem value="fixed">Фиксированная сумма</SelectItem>
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
                value={action.config.discountValue || 10}
                onChange={(e) => updateConfig('discountValue', Number(e.target.value))}
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Макс. использований
              </label>
              <Input
                type="number"
                min={0}
                value={action.config.maxUses || 0}
                onChange={(e) => updateConfig('maxUses', Number(e.target.value))}
                className="telegram-input"
              />
              <p className="text-xs text-muted-foreground mt-1">0 = без ограничений</p>
            </div>
          </div>
        );

      case 'show_cart':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Формат отображения
              </label>
              <Select
                value={action.config.format || 'detailed'}
                onValueChange={(value) => updateConfig('format', value)}
              >
                <SelectTrigger className="telegram-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="detailed">Подробный</SelectItem>
                  <SelectItem value="compact">Компактный</SelectItem>
                  <SelectItem value="summary">Только итого</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">
                Показать кнопку оплаты
              </label>
              <Switch
                checked={action.config.showPayButton !== false}
                onCheckedChange={(checked) => updateConfig('showPayButton', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">
                Показать кнопку очистки
              </label>
              <Switch
                checked={action.config.showClearButton || false}
                onCheckedChange={(checked) => updateConfig('showClearButton', checked)}
              />
            </div>
          </div>
        );

      case 'clear_cart':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">
                Запросить подтверждение
              </label>
              <Switch
                checked={action.config.confirm || false}
                onCheckedChange={(checked) => updateConfig('confirm', checked)}
              />
            </div>
            {action.config.confirm && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Текст подтверждения
                </label>
                <Input
                  value={action.config.confirmText || ''}
                  onChange={(e) => updateConfig('confirmText', e.target.value)}
                  placeholder="Вы уверены?"
                  className="telegram-input"
                />
              </div>
            )}
          </div>
        );

      case 'random_result':
        const outcomeCount = action.config.outcomeCount || 2;
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
                value={outcomeCount}
                onChange={(e) => updateConfig('outcomeCount', Math.max(2, Math.min(10, Number(e.target.value))))}
                className="telegram-input"
              />
              <p className="text-xs text-muted-foreground mt-1">
                От 2 до 10 исходов. Каждый исход получает {Math.round(100 / outcomeCount)}% шанс
              </p>
            </div>
            
            <div className="p-3 rounded-lg bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800/30">
              <p className="text-sm font-medium text-pink-700 dark:text-pink-300 mb-2">
                Вероятности исходов:
              </p>
              <div className="space-y-1">
                {Array.from({ length: outcomeCount }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-pink-600 dark:text-pink-400">Исход {i + 1}</span>
                    <span className="font-medium text-pink-700 dark:text-pink-300">
                      {Math.round(100 / outcomeCount)}%
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-pink-500 dark:text-pink-400 mt-2">
                💡 Соедините каждый выход с нужным меню на канвасе
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Сохранить индекс результата в поле
              </label>
              <Input
                value={action.config.saveToField || ''}
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
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Укажите варианты и их веса (чем больше вес, тем выше шанс)
            </p>
            {(action.config.items || [{ text: '', weight: 1 }]).map((item: any, index: number) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={item.text || ''}
                  onChange={(e) => {
                    const items = [...(action.config.items || [{ text: '', weight: 1 }])];
                    items[index] = { ...items[index], text: e.target.value };
                    updateConfig('items', items);
                  }}
                  placeholder="Вариант"
                  className="telegram-input flex-1"
                />
                <Input
                  type="number"
                  min={1}
                  value={item.weight || 1}
                  onChange={(e) => {
                    const items = [...(action.config.items || [{ text: '', weight: 1 }])];
                    items[index] = { ...items[index], weight: Number(e.target.value) };
                    updateConfig('items', items);
                  }}
                  className="telegram-input w-20"
                  placeholder="Вес"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const items = (action.config.items || []).filter((_: any, i: number) => i !== index);
                    updateConfig('items', items.length ? items : [{ text: '', weight: 1 }]);
                  }}
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const items = [...(action.config.items || [{ text: '', weight: 1 }]), { text: '', weight: 1 }];
                updateConfig('items', items);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить вариант
            </Button>
          </div>
        );

      case 'lottery':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Шанс выигрыша (%)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={action.config.winChance || 10}
                onChange={(e) => updateConfig('winChance', Number(e.target.value))}
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Приз
              </label>
              <Input
                value={action.config.prize || ''}
                onChange={(e) => updateConfig('prize', e.target.value)}
                placeholder="100 баллов"
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Сообщение при выигрыше
              </label>
              <Input
                value={action.config.winMessage || ''}
                onChange={(e) => updateConfig('winMessage', e.target.value)}
                placeholder="🎉 Поздравляем! Вы выиграли {prize}!"
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Сообщение при проигрыше
              </label>
              <Input
                value={action.config.loseMessage || ''}
                onChange={(e) => updateConfig('loseMessage', e.target.value)}
                placeholder="😔 К сожалению, вы не выиграли. Попробуйте ещё!"
                className="telegram-input"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">
                Ограничить попытки в день
              </label>
              <Switch
                checked={action.config.limitPerDay || false}
                onCheckedChange={(checked) => updateConfig('limitPerDay', checked)}
              />
            </div>
            {action.config.limitPerDay && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Макс. попыток в день
                </label>
                <Input
                  type="number"
                  min={1}
                  value={action.config.maxAttemptsPerDay || 1}
                  onChange={(e) => updateConfig('maxAttemptsPerDay', Number(e.target.value))}
                  className="telegram-input"
                />
              </div>
            )}
          </div>
        );

      case 'leaderboard':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Поле для рейтинга
              </label>
              <Input
                value={action.config.field || ''}
                onChange={(e) => updateConfig('field', e.target.value)}
                placeholder="user.points"
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
                value={action.config.limit || 10}
                onChange={(e) => updateConfig('limit', Number(e.target.value))}
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Заголовок
              </label>
              <Input
                value={action.config.title || ''}
                onChange={(e) => updateConfig('title', e.target.value)}
                placeholder="🏆 Топ игроков"
                className="telegram-input"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">
                Показать позицию пользователя
              </label>
              <Switch
                checked={action.config.showUserPosition !== false}
                onCheckedChange={(checked) => updateConfig('showUserPosition', checked)}
              />
            </div>
          </div>
        );

      case 'modify_points':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Поле баллов
              </label>
              <Input
                value={action.config.field || ''}
                onChange={(e) => updateConfig('field', e.target.value)}
                placeholder="user.points"
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Операция
              </label>
              <Select
                value={action.config.operation || 'add'}
                onValueChange={(value) => updateConfig('operation', value)}
              >
                <SelectTrigger className="telegram-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Добавить</SelectItem>
                  <SelectItem value="subtract">Списать</SelectItem>
                  <SelectItem value="set">Установить</SelectItem>
                  <SelectItem value="multiply">Умножить</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Значение
              </label>
              <Input
                type="number"
                value={action.config.amount || 0}
                onChange={(e) => updateConfig('amount', Number(e.target.value))}
                className="telegram-input"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">
                Уведомить пользователя
              </label>
              <Switch
                checked={action.config.notify || false}
                onCheckedChange={(checked) => updateConfig('notify', checked)}
              />
            </div>
          </div>
        );

      case 'spam_protection':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Макс. сообщений
              </label>
              <Input
                type="number"
                min={1}
                value={action.config.maxMessages || 5}
                onChange={(e) => updateConfig('maxMessages', Number(e.target.value))}
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                За период (секунд)
              </label>
              <Input
                type="number"
                min={1}
                value={action.config.period || 60}
                onChange={(e) => updateConfig('period', Number(e.target.value))}
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Действие при спаме
              </label>
              <Select
                value={action.config.action || 'ignore'}
                onValueChange={(value) => updateConfig('action', value)}
              >
                <SelectTrigger className="telegram-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ignore">Игнорировать</SelectItem>
                  <SelectItem value="warn">Предупредить</SelectItem>
                  <SelectItem value="timeout">Таймаут</SelectItem>
                  <SelectItem value="ban">Заблокировать</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {action.config.action === 'timeout' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Длительность таймаута (минут)
                </label>
                <Input
                  type="number"
                  min={1}
                  value={action.config.timeoutDuration || 5}
                  onChange={(e) => updateConfig('timeoutDuration', Number(e.target.value))}
                  className="telegram-input"
                />
              </div>
            )}
          </div>
        );

      case 'quiz':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Вопрос
              </label>
              <Textarea
                value={action.config.question || ''}
                onChange={(e) => updateConfig('question', e.target.value)}
                placeholder="Какой ваш любимый цвет?"
                rows={2}
                className="telegram-input resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Варианты ответов (через запятую)
              </label>
              <Textarea
                value={(action.config.options || []).join(', ')}
                onChange={(e) => updateConfig('options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="Красный, Синий, Зелёный"
                rows={2}
                className="telegram-input resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Правильный ответ
              </label>
              <Input
                value={action.config.correctAnswer || ''}
                onChange={(e) => updateConfig('correctAnswer', e.target.value)}
                placeholder="Синий"
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Баллы за правильный ответ
              </label>
              <Input
                type="number"
                min={0}
                value={action.config.points || 10}
                onChange={(e) => updateConfig('points', Number(e.target.value))}
                className="telegram-input"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">
                Показать объяснение
              </label>
              <Switch
                checked={action.config.showExplanation || false}
                onCheckedChange={(checked) => updateConfig('showExplanation', checked)}
              />
            </div>
            {action.config.showExplanation && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Объяснение
                </label>
                <Textarea
                  value={action.config.explanation || ''}
                  onChange={(e) => updateConfig('explanation', e.target.value)}
                  placeholder="Правильный ответ: Синий, потому что..."
                  rows={2}
                  className="telegram-input resize-none"
                />
              </div>
            )}
          </div>
        );

      case 'on_payment_success':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Сообщение после оплаты
              </label>
              <Textarea
                value={action.config.message || ''}
                onChange={(e) => updateConfig('message', e.target.value)}
                placeholder="🎉 Спасибо за покупку! Ваш заказ #{order_id}"
                rows={3}
                className="telegram-input resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Добавить тег
              </label>
              <Input
                value={action.config.addTag || ''}
                onChange={(e) => updateConfig('addTag', e.target.value)}
                placeholder="paid_user"
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Перейти в меню
              </label>
              <Select
                value={action.config.navigateToMenu || ''}
                onValueChange={(value) => updateConfig('navigateToMenu', value)}
              >
                <SelectTrigger className="telegram-input">
                  <SelectValue placeholder="Не переходить" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Не переходить</SelectItem>
                  {menus.map((menu) => (
                    <SelectItem key={menu.id} value={menu.id}>
                      {menu.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'on_first_visit':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Приветственное сообщение
              </label>
              <Textarea
                value={action.config.message || ''}
                onChange={(e) => updateConfig('message', e.target.value)}
                placeholder="👋 Добро пожаловать, {first_name}!"
                rows={3}
                className="telegram-input resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Добавить тег
              </label>
              <Input
                value={action.config.addTag || ''}
                onChange={(e) => updateConfig('addTag', e.target.value)}
                placeholder="new_user"
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Начислить баллы
              </label>
              <Input
                type="number"
                min={0}
                value={action.config.bonusPoints || 0}
                onChange={(e) => updateConfig('bonusPoints', Number(e.target.value))}
                className="telegram-input"
              />
            </div>
          </div>
        );

      case 'on_timer':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Запустить через (секунды)
              </label>
              <Input
                type="number"
                min={1}
                value={action.config.delay || 3600}
                onChange={(e) => updateConfig('delay', Number(e.target.value))}
                className="telegram-input"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.floor((action.config.delay || 3600) / 3600)} ч {Math.floor(((action.config.delay || 3600) % 3600) / 60)} мин
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Сообщение
              </label>
              <Textarea
                value={action.config.message || ''}
                onChange={(e) => updateConfig('message', e.target.value)}
                placeholder="⏰ Напоминание!"
                rows={2}
                className="telegram-input resize-none"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">
                Повторять
              </label>
              <Switch
                checked={action.config.repeat || false}
                onCheckedChange={(checked) => updateConfig('repeat', checked)}
              />
            </div>
          </div>
        );

      case 'on_threshold':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Поле для отслеживания
              </label>
              <Input
                value={action.config.field || ''}
                onChange={(e) => updateConfig('field', e.target.value)}
                placeholder="user.points"
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Порог
              </label>
              <Input
                type="number"
                value={action.config.threshold || 100}
                onChange={(e) => updateConfig('threshold', Number(e.target.value))}
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Условие
              </label>
              <Select
                value={action.config.condition || 'greater_or_equal'}
                onValueChange={(value) => updateConfig('condition', value)}
              >
                <SelectTrigger className="telegram-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="greater_or_equal">≥ Больше или равно</SelectItem>
                  <SelectItem value="greater">{'>'} Больше</SelectItem>
                  <SelectItem value="equals">= Равно</SelectItem>
                  <SelectItem value="less">{'<'} Меньше</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Сообщение при достижении
              </label>
              <Textarea
                value={action.config.message || ''}
                onChange={(e) => updateConfig('message', e.target.value)}
                placeholder="🎯 Вы достигли {threshold} баллов!"
                rows={2}
                className="telegram-input resize-none"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">
                Сработать только один раз
              </label>
              <Switch
                checked={action.config.once !== false}
                onCheckedChange={(checked) => updateConfig('once', checked)}
              />
            </div>
          </div>
        );

      case 'request_input':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Поле для сохранения
              </label>
              <Input
                value={action.config.field || ''}
                onChange={(e) => updateConfig('field', e.target.value)}
                placeholder="user.name"
                className="telegram-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Текст запроса
              </label>
              <Textarea
                value={action.config.prompt || ''}
                onChange={(e) => updateConfig('prompt', e.target.value)}
                placeholder="Введите ваше имя:"
                rows={2}
                className="telegram-input resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Тип валидации
              </label>
              <Select
                value={action.config.validationType || 'text'}
                onValueChange={(value) => updateConfig('validationType', value)}
              >
                <SelectTrigger className="telegram-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Любой текст</SelectItem>
                  <SelectItem value="number">Только числа</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Телефон</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'process_payment':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Провайдер оплаты
              </label>
              <Select
                value={action.config.provider || 'stars'}
                onValueChange={(value) => updateConfig('provider', value)}
              >
                <SelectTrigger className="telegram-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stars">Telegram Stars ⭐</SelectItem>
                  <SelectItem value="yookassa">ЮKassa</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 rounded-lg bg-telegram-blue/10 border border-telegram-blue/20">
              <p className="text-sm text-foreground">
                💡 Сумма берётся автоматически из корзины
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 rounded-xl bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground">
              Конфигуратор для "{info?.name || action.type}" в разработке
            </p>
          </div>
        );
    }
  };

  return (
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
        className="w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">{info?.name || action.type}</h3>
              <p className="text-xs text-muted-foreground">{info?.description}</p>
            </div>
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
        <ScrollArea className="max-h-[60vh]">
          <div className="p-5 pr-6">
            {renderConfig()}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border bg-muted/20">
          <Button onClick={onSave} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Сохранить
          </Button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showHelp && (
          <ActionHelpPanel 
            actionType={action.type} 
            onClose={() => setShowHelp(false)} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
