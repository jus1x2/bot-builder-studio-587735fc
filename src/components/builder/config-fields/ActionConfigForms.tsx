import { ReactNode, useState } from 'react';
import { 
  MessageSquare, Clock, ArrowRight, Link, Edit3, Tag, GitBranch, 
  ShoppingCart, Trophy, Bell, Send, HelpCircle, Star, Package,
  Users, Search, Timer, Target, Gift, Shield, CheckCircle, Hash, Trash2,
  Play, Loader2, CheckCircle2, XCircle, Copy, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { ActionType, BotMenu } from '@/types/bot';
import { 
  ConfigField, 
  ConfigSelect, 
  ConfigTextInput, 
  ConfigToggle, 
  ConfigNumber, 
  ConfigInfo, 
  ConfigGroup,
  ConfigRegexInput,
  SelectOption 
} from './ConfigField';

// Метаданные для каждого типа действия - понятные для новичков
export interface ActionFormMeta {
  title: string;
  description: string;
  icon: ReactNode;
  category: 'basic' | 'data' | 'logic' | 'shop' | 'gamification' | 'interactive' | 'events' | 'automation' | 'ai';
  difficulty: 'easy' | 'medium' | 'advanced';
  previewLabel?: string;
}

export const getActionFormMeta = (type: ActionType): ActionFormMeta => {
  const meta: Record<ActionType, ActionFormMeta> = {
    // Базовые
    show_text: {
      title: 'Отправить сообщение',
      description: 'Бот напишет это сообщение пользователю',
      icon: <MessageSquare className="w-5 h-5" />,
      category: 'basic',
      difficulty: 'easy',
      previewLabel: 'Сообщение появится в чате',
    },
    delay: {
      title: 'Сделать паузу',
      description: 'Бот подождёт перед следующим действием',
      icon: <Clock className="w-5 h-5" />,
      category: 'basic',
      difficulty: 'easy',
    },
    typing_indicator: {
      title: 'Показать "печатает..."',
      description: 'Создаёт эффект живого общения',
      icon: <MessageSquare className="w-5 h-5" />,
      category: 'basic',
      difficulty: 'easy',
    },
    navigate_menu: {
      title: 'Перейти к экрану',
      description: 'Показать другой экран с кнопками',
      icon: <ArrowRight className="w-5 h-5" />,
      category: 'basic',
      difficulty: 'easy',
    },
    open_url: {
      title: 'Открыть ссылку',
      description: 'Откроет сайт или страницу',
      icon: <Link className="w-5 h-5" />,
      category: 'basic',
      difficulty: 'easy',
    },
    // Данные
    set_field: {
      title: 'Запомнить значение',
      description: 'Сохранить информацию о пользователе',
      icon: <Edit3 className="w-5 h-5" />,
      category: 'data',
      difficulty: 'medium',
    },
    change_field: {
      title: 'Изменить число',
      description: 'Добавить или отнять от значения',
      icon: <Hash className="w-5 h-5" />,
      category: 'data',
      difficulty: 'medium',
    },
    append_to_list: {
      title: 'Добавить в список',
      description: 'Дополнить список новым элементом',
      icon: <Edit3 className="w-5 h-5" />,
      category: 'data',
      difficulty: 'advanced',
    },
    clear_field: {
      title: 'Очистить данные',
      description: 'Удалить сохранённое значение',
      icon: <Edit3 className="w-5 h-5" />,
      category: 'data',
      difficulty: 'medium',
    },
    add_tag: {
      title: 'Добавить метку',
      description: 'Пометить пользователя для группировки',
      icon: <Tag className="w-5 h-5" />,
      category: 'data',
      difficulty: 'easy',
    },
    remove_tag: {
      title: 'Убрать метку',
      description: 'Удалить метку с пользователя',
      icon: <Tag className="w-5 h-5" />,
      category: 'data',
      difficulty: 'easy',
    },
    // Логика
    if_else: {
      title: 'Проверить условие',
      description: 'Разные действия в зависимости от ситуации',
      icon: <GitBranch className="w-5 h-5" />,
      category: 'logic',
      difficulty: 'medium',
    },
    check_subscription: {
      title: 'Проверить подписку',
      description: 'Подписан ли пользователь на канал',
      icon: <Users className="w-5 h-5" />,
      category: 'logic',
      difficulty: 'medium',
    },
    check_role: {
      title: 'Проверить права',
      description: 'Есть ли у пользователя нужная роль',
      icon: <Shield className="w-5 h-5" />,
      category: 'logic',
      difficulty: 'medium',
    },
    check_value: {
      title: 'Сравнить значение',
      description: 'Проверить данные пользователя',
      icon: <CheckCircle className="w-5 h-5" />,
      category: 'logic',
      difficulty: 'advanced',
    },
    wait_response: {
      title: 'Ждать ответ',
      description: 'Дождаться сообщения от пользователя',
      icon: <MessageSquare className="w-5 h-5" />,
      category: 'logic',
      difficulty: 'medium',
    },
    keyword_trigger: {
      title: 'Реагировать на слова',
      description: 'Сработать при определённых словах',
      icon: <Search className="w-5 h-5" />,
      category: 'logic',
      difficulty: 'medium',
    },
    no_response: {
      title: 'Если молчит',
      description: 'Что делать, если нет ответа',
      icon: <Clock className="w-5 h-5" />,
      category: 'logic',
      difficulty: 'medium',
    },
    wrong_response: {
      title: 'Если ошибся',
      description: 'Что делать при неправильном ответе',
      icon: <HelpCircle className="w-5 h-5" />,
      category: 'logic',
      difficulty: 'medium',
    },
    // Магазин
    add_to_cart: {
      title: 'Добавить в корзину',
      description: 'Положить товар в корзину покупателя',
      icon: <ShoppingCart className="w-5 h-5" />,
      category: 'shop',
      difficulty: 'medium',
    },
    update_quantity: {
      title: 'Изменить количество',
      description: 'Сколько штук товара в корзине',
      icon: <Hash className="w-5 h-5" />,
      category: 'shop',
      difficulty: 'medium',
    },
    show_product: {
      title: 'Показать товар',
      description: 'Карточка товара с фото и ценой',
      icon: <Package className="w-5 h-5" />,
      category: 'shop',
      difficulty: 'medium',
    },
    remove_from_cart: {
      title: 'Убрать из корзины',
      description: 'Удалить товар из корзины',
      icon: <ShoppingCart className="w-5 h-5" />,
      category: 'shop',
      difficulty: 'easy',
    },
    check_stock: {
      title: 'Проверить наличие',
      description: 'Есть ли товар на складе',
      icon: <Package className="w-5 h-5" />,
      category: 'shop',
      difficulty: 'medium',
    },
    apply_promo: {
      title: 'Применить скидку',
      description: 'Добавить промокод к заказу',
      icon: <Tag className="w-5 h-5" />,
      category: 'shop',
      difficulty: 'medium',
    },
    show_cart: {
      title: 'Показать корзину',
      description: 'Список товаров и сумма заказа',
      icon: <ShoppingCart className="w-5 h-5" />,
      category: 'shop',
      difficulty: 'easy',
    },
    clear_cart: {
      title: 'Очистить корзину',
      description: 'Удалить все товары из корзины',
      icon: <ShoppingCart className="w-5 h-5" />,
      category: 'shop',
      difficulty: 'easy',
    },
    process_payment: {
      title: 'Принять оплату',
      description: 'Провести платёж за заказ',
      icon: <ShoppingCart className="w-5 h-5" />,
      category: 'shop',
      difficulty: 'advanced',
    },
    // Геймификация
    random_result: {
      title: 'Случайный выбор',
      description: 'Выбрать один вариант наугад',
      icon: <Gift className="w-5 h-5" />,
      category: 'gamification',
      difficulty: 'medium',
    },
    weighted_random: {
      title: 'Выбор с шансами',
      description: 'Случайный выбор с разной вероятностью',
      icon: <Gift className="w-5 h-5" />,
      category: 'gamification',
      difficulty: 'advanced',
    },
    lottery: {
      title: 'Розыгрыш',
      description: 'Провести лотерею среди участников',
      icon: <Gift className="w-5 h-5" />,
      category: 'gamification',
      difficulty: 'advanced',
    },
    leaderboard: {
      title: 'Таблица лидеров',
      description: 'Показать рейтинг пользователей',
      icon: <Trophy className="w-5 h-5" />,
      category: 'gamification',
      difficulty: 'medium',
    },
    modify_points: {
      title: 'Начислить баллы',
      description: 'Добавить или снять баллы',
      icon: <Star className="w-5 h-5" />,
      category: 'gamification',
      difficulty: 'easy',
    },
    spam_protection: {
      title: 'Защита от спама',
      description: 'Ограничить частоту сообщений',
      icon: <Shield className="w-5 h-5" />,
      category: 'gamification',
      difficulty: 'advanced',
    },
    // Интерактив
    request_input: {
      title: 'Спросить данные',
      description: 'Попросить пользователя ввести информацию',
      icon: <Edit3 className="w-5 h-5" />,
      category: 'interactive',
      difficulty: 'medium',
    },
    quiz: {
      title: 'Задать вопрос',
      description: 'Вопрос с вариантами ответов',
      icon: <HelpCircle className="w-5 h-5" />,
      category: 'interactive',
      difficulty: 'medium',
    },
    // События
    on_payment_success: {
      title: 'После оплаты',
      description: 'Что делать когда пришла оплата',
      icon: <CheckCircle className="w-5 h-5" />,
      category: 'events',
      difficulty: 'medium',
    },
    on_first_visit: {
      title: 'Первый визит',
      description: 'Действия для новых пользователей',
      icon: <Users className="w-5 h-5" />,
      category: 'events',
      difficulty: 'easy',
    },
    on_timer: {
      title: 'По расписанию',
      description: 'Запустить через время',
      icon: <Timer className="w-5 h-5" />,
      category: 'events',
      difficulty: 'medium',
    },
    on_threshold: {
      title: 'При достижении',
      description: 'Когда значение достигнет порога',
      icon: <Target className="w-5 h-5" />,
      category: 'events',
      difficulty: 'advanced',
    },
    // Автоматизация
    send_notification: {
      title: 'Уведомление',
      description: 'Отправить push-уведомление',
      icon: <Bell className="w-5 h-5" />,
      category: 'automation',
      difficulty: 'easy',
    },
    schedule_message: {
      title: 'Отложенное сообщение',
      description: 'Отправить сообщение позже',
      icon: <Timer className="w-5 h-5" />,
      category: 'automation',
      difficulty: 'medium',
    },
    broadcast: {
      title: 'Рассылка',
      description: 'Отправить всем или группе',
      icon: <Send className="w-5 h-5" />,
      category: 'automation',
      difficulty: 'medium',
    },
    // AI & Интеграции
    ai_response: {
      title: 'AI Ответ',
      description: 'Генерация текста с помощью ИИ',
      icon: <Star className="w-5 h-5" />,
      category: 'ai',
      difficulty: 'medium',
    },
    http_request: {
      title: 'HTTP Запрос',
      description: 'Вызов внешнего API',
      icon: <Link className="w-5 h-5" />,
      category: 'ai',
      difficulty: 'advanced',
    },
    json_parse: {
      title: 'Парсинг JSON',
      description: 'Извлечь данные из ответа',
      icon: <Edit3 className="w-5 h-5" />,
      category: 'ai',
      difficulty: 'advanced',
    },
    format_text: {
      title: 'Форматирование',
      description: 'Создать текст по шаблону',
      icon: <MessageSquare className="w-5 h-5" />,
      category: 'ai',
      difficulty: 'easy',
    },
    split_test: {
      title: 'A/B Тест',
      description: 'Сплит-тестирование вариантов',
      icon: <GitBranch className="w-5 h-5" />,
      category: 'ai',
      difficulty: 'medium',
    },
  };

  return meta[type];
};

// Предустановленные опции для полей
export const PARSE_MODE_OPTIONS: SelectOption[] = [
  { value: 'plain', label: 'Обычный текст', description: 'Без форматирования' },
  { value: 'markdown', label: 'Markdown', description: '*жирный*, _курсив_' },
  { value: 'html', label: 'HTML', description: '<b>жирный</b>, <i>курсив</i>' },
];

export const TIMEOUT_ACTION_OPTIONS: SelectOption[] = [
  { value: 'none', label: 'Ничего не делать', description: 'Просто продолжить' },
  { value: 'repeat', label: 'Повторить вопрос', description: 'Спросить ещё раз' },
  { value: 'next', label: 'Пропустить', description: 'Перейти дальше' },
  { value: 'menu', label: 'Перейти к экрану', description: 'Открыть другой экран' },
];

export const MATCH_TYPE_OPTIONS: SelectOption[] = [
  { value: 'contains', label: 'Содержит слово', description: 'Слово есть в сообщении' },
  { value: 'exact', label: 'Точное совпадение', description: 'Сообщение равно слову' },
  { value: 'starts', label: 'Начинается с', description: 'Сообщение начинается со слова' },
  { value: 'ends', label: 'Заканчивается на', description: 'Сообщение заканчивается словом' },
];

export const CONDITION_TYPE_OPTIONS: SelectOption[] = [
  { value: 'field', label: 'Проверить данные', description: 'Сравнить сохранённое значение' },
  { value: 'tag', label: 'Проверить метку', description: 'Есть ли у пользователя метка' },
  { value: 'subscription', label: 'Проверить подписку', description: 'Подписан ли на канал' },
  { value: 'time', label: 'Проверить время', description: 'В какое время суток' },
];

export const OPERATOR_OPTIONS: SelectOption[] = [
  { value: 'equals', label: 'Равно', description: 'Значение точно такое' },
  { value: 'not_equals', label: 'Не равно', description: 'Значение другое' },
  { value: 'greater', label: 'Больше', description: 'Число больше чем' },
  { value: 'less', label: 'Меньше', description: 'Число меньше чем' },
  { value: 'contains', label: 'Содержит', description: 'Текст содержит часть' },
  { value: 'exists', label: 'Есть значение', description: 'Поле не пустое' },
];

export const ROLE_OPTIONS: SelectOption[] = [
  { value: 'admin', label: 'Администратор', description: 'Полный доступ' },
  { value: 'moderator', label: 'Модератор', description: 'Может управлять' },
  { value: 'vip', label: 'VIP', description: 'Особые привилегии' },
  { value: 'subscriber', label: 'Подписчик', description: 'Обычный пользователь' },
];

export const CURRENCY_OPTIONS: SelectOption[] = [
  { value: '₽', label: '₽ Рубли' },
  { value: '$', label: '$ Доллары' },
  { value: '€', label: '€ Евро' },
];

export const SEGMENT_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Все пользователи', description: 'Отправить всем' },
  { value: 'active', label: 'Активные', description: 'Писали за последние 7 дней' },
  { value: 'inactive', label: 'Неактивные', description: 'Давно не писали' },
  { value: 'tag', label: 'По метке', description: 'Только с определённой меткой' },
];

export const PAYMENT_PROVIDER_OPTIONS: SelectOption[] = [
  { value: 'stars', label: 'Telegram Stars ⭐', description: 'Встроенная валюта Telegram' },
  { value: 'yookassa', label: 'ЮKassa', description: 'Для России' },
  { value: 'stripe', label: 'Stripe', description: 'Международные платежи' },
];

export const VALIDATION_TYPE_OPTIONS: SelectOption[] = [
  { value: 'text', label: 'Любой текст', description: 'Принять что угодно' },
  { value: 'number', label: 'Только числа', description: '123, 45.67' },
  { value: 'email', label: 'Email', description: 'example@mail.com' },
  { value: 'phone', label: 'Телефон', description: '+7 999 123-45-67' },
  { value: 'custom', label: 'Регулярное выражение', description: 'Своё правило проверки' },
];

// Валидаторы
export const validators = {
  url: (value: string) => {
    if (!value) return { valid: true };
    try {
      new URL(value);
      return { valid: true, message: 'Ссылка корректна ✓' };
    } catch {
      return { valid: false, message: 'Введите полную ссылку (https://...)' };
    }
  },
  email: (value: string) => {
    if (!value) return { valid: true };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) 
      ? { valid: true, message: 'Email корректен ✓' }
      : { valid: false, message: 'Неправильный формат email' };
  },
  required: (value: string) => {
    return value?.trim() 
      ? { valid: true }
      : { valid: false, message: 'Это поле обязательно' };
  },
  channel: (value: string) => {
    if (!value) return { valid: true };
    return value.startsWith('@')
      ? { valid: true, message: 'Формат канала корректен ✓' }
      : { valid: false, message: 'Канал должен начинаться с @' };
  },
  tag: (value: string) => {
    if (!value) return { valid: true };
    const noSpaces = !/\s/.test(value);
    return noSpaces
      ? { valid: true }
      : { valid: false, message: 'Метка не должна содержать пробелов' };
  },
};

// Компонент для рендера форм действий
interface ActionConfigFormsProps {
  actionType: ActionType;
  config: Record<string, any>;
  menus: BotMenu[];
  updateConfig: (key: string, value: any) => void;
}

export function ActionConfigForms({ actionType, config, menus, updateConfig }: ActionConfigFormsProps) {
  const menuOptions: SelectOption[] = menus.map(m => ({
    value: m.id,
    label: m.name,
    description: m.description || 'Экран бота',
  }));

  switch (actionType) {
    case 'show_text':
      return (
        <div className="space-y-4">
          <ConfigField
            label="Текст сообщения"
            description="Что напишет бот пользователю"
            tip="Используйте {first_name} чтобы обратиться по имени — это повышает вовлечённость!"
            required
          >
            <ConfigTextInput
              value={config.text || ''}
              onChange={(v) => updateConfig('text', v)}
              placeholder="Привет! Рад тебя видеть 👋"
              multiline
              rows={4}
              showVariables
            />
          </ConfigField>

          <ConfigField
            label="Стиль текста"
            description="Как оформить сообщение"
          >
            <ConfigSelect
              value={config.parseMode || 'plain'}
              onChange={(v) => updateConfig('parseMode', v)}
              options={PARSE_MODE_OPTIONS}
            />
          </ConfigField>

          <ConfigInfo type="tip">
            Короткие сообщения читают чаще. Разбивайте длинный текст на несколько блоков.
          </ConfigInfo>
        </div>
      );

    case 'delay':
      return (
        <div className="space-y-4">
          <ConfigField
            label="Длительность паузы"
            description="Сколько секунд подождать перед следующим действием"
            tip="Небольшие паузы 1-3 секунды делают общение естественнее"
          >
            <ConfigNumber
              value={config.seconds || 1}
              onChange={(v) => updateConfig('seconds', v)}
              min={0}
              max={300}
              unit="сек"
              presets={[
                { value: 1, label: '1 сек' },
                { value: 3, label: '3 сек' },
                { value: 5, label: '5 сек' },
                { value: 10, label: '10 сек' },
              ]}
            />
          </ConfigField>

          <ConfigToggle
            checked={config.showTyping || false}
            onChange={(v) => updateConfig('showTyping', v)}
            label="Показывать «печатает...»"
            description="Пользователь увидит, что бот набирает текст"
            icon={<MessageSquare className="w-4 h-4" />}
          />
        </div>
      );

    case 'typing_indicator':
      return (
        <div className="space-y-4">
          <ConfigField
            label="Длительность"
            description="Сколько секунд показывать индикатор"
          >
            <ConfigNumber
              value={config.seconds || 2}
              onChange={(v) => updateConfig('seconds', v)}
              min={1}
              max={10}
              unit="сек"
              presets={[
                { value: 1, label: '1 сек' },
                { value: 2, label: '2 сек' },
                { value: 3, label: '3 сек' },
              ]}
            />
          </ConfigField>

          <ConfigInfo type="info">
            Пользователь увидит «печатает...» как при обычной переписке. Это создаёт ощущение живого общения.
          </ConfigInfo>
        </div>
      );

    case 'navigate_menu':
      return (
        <div className="space-y-4">
          <ConfigField
            label="Куда перейти"
            description="Выберите экран, который увидит пользователь"
            required
          >
            <ConfigSelect
              value={config.targetMenuId || ''}
              onChange={(v) => updateConfig('targetMenuId', v)}
              options={menuOptions}
              placeholder="Выберите экран..."
            />
          </ConfigField>

          {!config.targetMenuId && (
            <ConfigInfo type="warning">
              Выберите экран для перехода. Без этого действие не сработает.
            </ConfigInfo>
          )}
        </div>
      );

    case 'open_url':
      return (
        <div className="space-y-4">
          <ConfigField
            label="Адрес ссылки"
            description="Куда перейдёт пользователь"
            example="https://example.com"
            required
          >
            <ConfigTextInput
              value={config.url || ''}
              onChange={(v) => updateConfig('url', v)}
              placeholder="https://..."
              validate={validators.url}
            />
          </ConfigField>

          <ConfigToggle
            checked={config.openInBrowser || false}
            onChange={(v) => updateConfig('openInBrowser', v)}
            label="Открыть во внешнем браузере"
            description="Иначе откроется внутри Telegram"
            icon={<Link className="w-4 h-4" />}
          />
        </div>
      );

    case 'add_tag':
    case 'remove_tag':
      return (
        <div className="space-y-4">
          <ConfigField
            label="Название метки"
            description={actionType === 'add_tag' 
              ? "Эта метка добавится к пользователю" 
              : "Эта метка будет удалена у пользователя"
            }
            tip="Используйте метки для группировки: VIP, interested, completed"
            example="VIP"
            required
          >
            <ConfigTextInput
              value={config.tag || ''}
              onChange={(v) => updateConfig('tag', v)}
              placeholder="Введите метку без пробелов"
              validate={validators.tag}
            />
          </ConfigField>

          <ConfigInfo type="tip">
            Метки помогают делать рассылки по группам и персонализировать общение.
          </ConfigInfo>
        </div>
      );

    case 'modify_points':
      return (
        <div className="space-y-4">
          <ConfigField
            label="Действие с баллами"
            description="Добавить или снять баллы"
          >
            <ConfigSelect
              value={config.operation || 'add'}
              onChange={(v) => updateConfig('operation', v)}
              options={[
                { value: 'add', label: 'Начислить баллы', description: '+' },
                { value: 'subtract', label: 'Списать баллы', description: '−' },
              ]}
            />
          </ConfigField>

          <ConfigField
            label="Количество баллов"
            description="Сколько баллов начислить или списать"
          >
            <ConfigNumber
              value={config.amount || 10}
              onChange={(v) => updateConfig('amount', v)}
              min={1}
              max={10000}
              presets={[
                { value: 5, label: '+5' },
                { value: 10, label: '+10' },
                { value: 50, label: '+50' },
                { value: 100, label: '+100' },
              ]}
            />
          </ConfigField>

          <ConfigToggle
            checked={config.showMessage !== false}
            onChange={(v) => updateConfig('showMessage', v)}
            label="Показать уведомление"
            description="Сообщить пользователю о начислении"
            icon={<Bell className="w-4 h-4" />}
          />
        </div>
      );

    case 'send_notification':
      return (
        <div className="space-y-4">
          <ConfigField
            label="Текст уведомления"
            description="Что получит пользователь"
            required
          >
            <ConfigTextInput
              value={config.message || ''}
              onChange={(v) => updateConfig('message', v)}
              placeholder="Новое сообщение для вас!"
              multiline
              rows={2}
            />
          </ConfigField>

          <ConfigToggle
            checked={config.silent || false}
            onChange={(v) => updateConfig('silent', v)}
            label="Без звука"
            description="Уведомление придёт тихо"
            icon={<Bell className="w-4 h-4" />}
          />
        </div>
      );

    case 'broadcast':
      return (
        <div className="space-y-4">
          <ConfigField
            label="Кому отправить"
            description="Выберите группу получателей"
          >
            <ConfigSelect
              value={config.segment || 'all'}
              onChange={(v) => updateConfig('segment', v)}
              options={SEGMENT_OPTIONS}
            />
          </ConfigField>

          {config.segment === 'tag' && (
            <ConfigField
              label="Метка для отбора"
              description="Отправить только пользователям с этой меткой"
            >
              <ConfigTextInput
                value={config.tag || ''}
                onChange={(v) => updateConfig('tag', v)}
                placeholder="VIP"
                validate={validators.tag}
              />
            </ConfigField>
          )}

          <ConfigField
            label="Текст рассылки"
            description="Что получат пользователи"
            required
          >
            <ConfigTextInput
              value={config.message || ''}
              onChange={(v) => updateConfig('message', v)}
              placeholder="Привет! У нас новости..."
              multiline
              rows={3}
              showVariables
            />
          </ConfigField>

          <ConfigInfo type="warning">
            Не злоупотребляйте рассылками — пользователи могут заблокировать бота.
          </ConfigInfo>
        </div>
      );

    case 'process_payment':
      return (
        <div className="space-y-4">
          <ConfigField
            label="Способ оплаты"
            description="Через какую систему принимать платёж"
          >
            <ConfigSelect
              value={config.provider || 'stars'}
              onChange={(v) => updateConfig('provider', v)}
              options={PAYMENT_PROVIDER_OPTIONS}
            />
          </ConfigField>

          <ConfigInfo type="info">
            Сумма берётся автоматически из корзины. Убедитесь, что товары добавлены.
          </ConfigInfo>
        </div>
      );

    case 'request_input':
      return (
        <div className="space-y-4">
          <ConfigInfo type="info">
            Спросите у пользователя данные и проверьте правильность ввода. Настройте реакцию на правильный и неправильный ответ.
          </ConfigInfo>

          <ConfigField
            label="Вопрос пользователю"
            description="Что спросить у пользователя"
            tip="Чёткий вопрос = понятный ответ"
            required
          >
            <ConfigTextInput
              value={config.prompt || ''}
              onChange={(v) => updateConfig('prompt', v)}
              placeholder="Как вас зовут?"
              multiline
              rows={2}
            />
          </ConfigField>

          <ConfigField
            label="Тип валидации"
            description="Какой формат ответа ожидается"
          >
            <ConfigSelect
              value={config.validationType || 'text'}
              onChange={(v) => updateConfig('validationType', v)}
              options={VALIDATION_TYPE_OPTIONS}
            />
          </ConfigField>

          {config.validationType === 'custom' && (
            <>
              <ConfigField
                label="Пример правильного ввода"
                description="Покажите пользователю пример правильного формата"
              >
                <ConfigTextInput
                  value={config.regexExample || ''}
                  onChange={(v) => updateConfig('regexExample', v)}
                  placeholder="AB123456"
                />
              </ConfigField>

              <ConfigField
                label="Регулярное выражение"
                description="Паттерн для проверки ответа"
                tip="Используйте regex для проверки форматов: дата, номер заказа, код и т.д."
                required
              >
                <ConfigRegexInput
                  value={config.customRegex || ''}
                  onChange={(v) => updateConfig('customRegex', v)}
                  placeholder="^[A-Z]{2}\d{6}$"
                  testValue={config.regexExample}
                />
              </ConfigField>
            </>
          )}

          <ConfigField
            label="Куда сохранить ответ"
            description="Название для хранения ответа"
            example="user.name"
          >
            <ConfigTextInput
              value={config.field || ''}
              onChange={(v) => updateConfig('field', v)}
              placeholder="user.name"
            />
          </ConfigField>

          <ConfigField
            label="Таймаут ожидания (сек)"
            description="Сколько секунд ждать ответа (0 = бесконечно)"
          >
            <ConfigNumber
              value={config.timeout || 0}
              onChange={(v) => updateConfig('timeout', v)}
              min={0}
              max={3600}
              presets={[
                { value: 0, label: 'Бесконечно' },
                { value: 30, label: '30 сек' },
                { value: 60, label: '1 мин' },
                { value: 300, label: '5 мин' },
              ]}
            />
          </ConfigField>

          <ConfigGroup title="При правильном ответе" description="Что делать когда ввод прошёл валидацию">
            <ConfigField
              label="Сообщение об успехе"
              description="Подтвердить что ответ принят"
            >
              <ConfigTextInput
                value={config.successMessage || ''}
                onChange={(v) => updateConfig('successMessage', v)}
                placeholder="✅ Отлично, данные сохранены!"
              />
            </ConfigField>

            <ConfigField
              label="Перейти к экрану"
              description="Куда перенаправить после успешного ввода"
            >
              <ConfigSelect
                value={config.successMenuId || ''}
                onChange={(v) => updateConfig('successMenuId', v)}
                options={menuOptions}
                placeholder="Выберите экран..."
              />
            </ConfigField>
          </ConfigGroup>

          <ConfigGroup title="При неправильном ответе" description="Что делать когда ввод не прошёл валидацию">
            <ConfigField
              label="Сообщение об ошибке"
              description="Объяснить что пошло не так"
            >
              <ConfigTextInput
                value={config.errorMessage || ''}
                onChange={(v) => updateConfig('errorMessage', v)}
                placeholder="❌ Неверный формат. Попробуйте ещё раз"
              />
            </ConfigField>

            <ConfigField
              label="Максимум попыток"
              description="Сколько раз можно ошибиться (0 = бесконечно)"
            >
              <ConfigNumber
                value={config.maxRetries || 3}
                onChange={(v) => updateConfig('maxRetries', v)}
                min={0}
                max={10}
                presets={[
                  { value: 0, label: 'Бесконечно' },
                  { value: 3, label: '3 попытки' },
                  { value: 5, label: '5 попыток' },
                ]}
              />
            </ConfigField>

            <ConfigField
              label="После всех попыток"
              description="Куда перейти если лимит исчерпан"
            >
              <ConfigSelect
                value={config.errorMenuId || ''}
                onChange={(v) => updateConfig('errorMenuId', v)}
                options={menuOptions}
                placeholder="Выберите экран..."
              />
            </ConfigField>
          </ConfigGroup>

          <ConfigGroup title="Если не ответил" description="Что делать при истечении времени">
            <ConfigField
              label="Действие при таймауте"
              description="Что делать когда время вышло"
            >
              <ConfigSelect
                value={config.timeoutAction || 'none'}
                onChange={(v) => updateConfig('timeoutAction', v)}
                options={TIMEOUT_ACTION_OPTIONS}
              />
            </ConfigField>

            {config.timeoutAction === 'menu' && (
              <ConfigField
                label="Перейти к экрану"
                description="Какой экран показать при истечении времени"
              >
                <ConfigSelect
                  value={config.timeoutMenuId || ''}
                  onChange={(v) => updateConfig('timeoutMenuId', v)}
                  options={menuOptions}
                  placeholder="Выберите экран..."
                />
              </ConfigField>
            )}
          </ConfigGroup>

          <ConfigInfo type="tip">
            Используйте валидацию для сбора email, телефонов и чисел. Неправильные ответы будут отклоняться автоматически.
          </ConfigInfo>
        </div>
      );

    case 'if_else':
      return (
        <div className="space-y-4">
          <ConfigField
            label="Что проверить"
            description="Выберите тип проверки"
            tip="Условия позволяют показывать разный контент разным пользователям"
          >
            <ConfigSelect
              value={config.conditionType || 'field'}
              onChange={(v) => updateConfig('conditionType', v)}
              options={CONDITION_TYPE_OPTIONS}
            />
          </ConfigField>

          {config.conditionType === 'field' && (
            <>
              <ConfigField
                label="Какие данные проверить"
                description="Название сохранённого значения"
                example="user.balance"
              >
                <ConfigTextInput
                  value={config.field || ''}
                  onChange={(v) => updateConfig('field', v)}
                  placeholder="user.balance"
                />
              </ConfigField>

              <ConfigField
                label="Как сравнить"
                description="Условие сравнения"
              >
                <ConfigSelect
                  value={config.operator || 'equals'}
                  onChange={(v) => updateConfig('operator', v)}
                  options={OPERATOR_OPTIONS}
                />
              </ConfigField>

              {config.operator !== 'exists' && (
                <ConfigField
                  label="С каким значением"
                  description="Значение для сравнения"
                  example="100"
                >
                  <ConfigTextInput
                    value={config.value || ''}
                    onChange={(v) => updateConfig('value', v)}
                    placeholder="Введите значение"
                  />
                </ConfigField>
              )}
            </>
          )}

          {config.conditionType === 'tag' && (
            <ConfigField
              label="Какая метка"
              description="Проверить наличие метки у пользователя"
              example="VIP"
            >
              <ConfigTextInput
                value={config.tag || ''}
                onChange={(v) => updateConfig('tag', v)}
                placeholder="VIP"
                validate={validators.tag}
              />
            </ConfigField>
          )}

          {config.conditionType === 'subscription' && (
            <ConfigField
              label="Канал или чат"
              description="Проверить подписку на канал"
              example="@mychannel"
            >
              <ConfigTextInput
                value={config.channel || ''}
                onChange={(v) => updateConfig('channel', v)}
                placeholder="@channel"
                validate={validators.channel}
              />
            </ConfigField>
          )}

          {config.conditionType === 'time' && (
            <ConfigGroup title="Временной диапазон" description="Действие сработает в это время">
              <div className="grid grid-cols-2 gap-3">
                <ConfigField label="С">
                  <input
                    type="time"
                    value={config.timeFrom || '09:00'}
                    onChange={(e) => updateConfig('timeFrom', e.target.value)}
                    className="telegram-input w-full px-3 py-2 rounded-lg"
                  />
                </ConfigField>
                <ConfigField label="До">
                  <input
                    type="time"
                    value={config.timeTo || '18:00'}
                    onChange={(e) => updateConfig('timeTo', e.target.value)}
                    className="telegram-input w-full px-3 py-2 rounded-lg"
                  />
                </ConfigField>
              </div>
            </ConfigGroup>
          )}

          <ConfigGroup title="Что делать по результату" description="Куда перейти при разных исходах">
            <ConfigField
              label="Если ДА ✓"
              description="Куда перейти если условие выполняется"
            >
              <ConfigSelect
                value={config.trueMenuId || ''}
                onChange={(v) => updateConfig('trueMenuId', v)}
                options={[{ value: '', label: 'Продолжить дальше', description: 'Следующее действие' }, ...menuOptions]}
                placeholder="Выберите экран..."
              />
            </ConfigField>

            <ConfigField
              label="Если НЕТ ✗"
              description="Куда перейти если условие НЕ выполняется"
            >
              <ConfigSelect
                value={config.falseMenuId || ''}
                onChange={(v) => updateConfig('falseMenuId', v)}
                options={[{ value: '', label: 'Продолжить дальше', description: 'Следующее действие' }, ...menuOptions]}
                placeholder="Выберите экран..."
              />
            </ConfigField>
          </ConfigGroup>
        </div>
      );

    case 'wait_response':
      return (
        <div className="space-y-4">
          <ConfigField
            label="Тип ожидаемого ответа"
            description="Какой формат данных нужно получить"
            tip="Выберите тип для автоматической проверки правильности ввода"
          >
            <ConfigSelect
              value={config.validationType || 'text'}
              onChange={(v) => updateConfig('validationType', v)}
              options={VALIDATION_TYPE_OPTIONS}
            />
          </ConfigField>

          {config.validationType === 'custom' && (
            <>
              <ConfigField
                label="Пример правильного ввода"
                description="Покажите пользователю пример правильного формата"
              >
                <ConfigTextInput
                  value={config.regexExample || ''}
                  onChange={(v) => updateConfig('regexExample', v)}
                  placeholder="AB123456"
                />
              </ConfigField>

              <ConfigField
                label="Регулярное выражение"
                description="Паттерн для проверки ответа"
                tip="Используйте regex для проверки форматов: дата, номер заказа, код и т.д."
                required
              >
                <ConfigRegexInput
                  value={config.customRegex || ''}
                  onChange={(v) => updateConfig('customRegex', v)}
                  placeholder="^[A-Z]{2}\d{6}$"
                  testValue={config.regexExample}
                />
              </ConfigField>
            </>
          )}

          <ConfigField
            label="Сколько ждать ответ"
            description="Максимальное время ожидания"
            tip="0 = ждать бесконечно. Для опросов рекомендуем 60-300 секунд"
          >
            <ConfigNumber
              value={config.timeout || 60}
              onChange={(v) => updateConfig('timeout', v)}
              min={0}
              max={3600}
              unit="сек"
              presets={[
                { value: 0, label: 'Бесконечно' },
                { value: 60, label: '1 мин' },
                { value: 300, label: '5 мин' },
                { value: 3600, label: '1 час' },
              ]}
            />
          </ConfigField>

          <ConfigField
            label="Куда сохранить ответ"
            description="Бот запомнит ответ под этим именем"
            example="user.answer"
            tip="Потом можно использовать это значение в сообщениях через {user.answer}"
          >
            <ConfigTextInput
              value={config.saveToField || ''}
              onChange={(v) => updateConfig('saveToField', v)}
              placeholder="user.answer"
            />
          </ConfigField>

          <ConfigGroup title="При правильном ответе" description="Что делать когда ввод прошёл валидацию">
            <ConfigField
              label="Сообщение успеха"
              description="Показать это сообщение (необязательно)"
            >
              <ConfigTextInput
                value={config.successMessage || ''}
                onChange={(v) => updateConfig('successMessage', v)}
                placeholder="✅ Отлично! Данные сохранены"
              />
            </ConfigField>

            <ConfigField
              label="Перейти к экрану"
              description="Куда перенаправить пользователя"
            >
              <ConfigSelect
                value={config.successMenuId || ''}
                onChange={(v) => updateConfig('successMenuId', v)}
                options={menuOptions}
                placeholder="Выберите экран..."
              />
            </ConfigField>
          </ConfigGroup>

          <ConfigGroup title="При неправильном ответе" description="Что делать когда ввод не прошёл валидацию">
            <ConfigField
              label="Сообщение об ошибке"
              description="Объяснить что пошло не так"
            >
              <ConfigTextInput
                value={config.errorMessage || ''}
                onChange={(v) => updateConfig('errorMessage', v)}
                placeholder="❌ Неверный формат. Попробуйте ещё раз"
              />
            </ConfigField>

            <ConfigField
              label="Максимум попыток"
              description="Сколько раз можно ошибиться (0 = бесконечно)"
            >
              <ConfigNumber
                value={config.maxRetries || 3}
                onChange={(v) => updateConfig('maxRetries', v)}
                min={0}
                max={10}
                presets={[
                  { value: 0, label: 'Бесконечно' },
                  { value: 3, label: '3 попытки' },
                  { value: 5, label: '5 попыток' },
                ]}
              />
            </ConfigField>

            <ConfigField
              label="После всех попыток"
              description="Куда перейти если лимит исчерпан"
            >
              <ConfigSelect
                value={config.errorMenuId || ''}
                onChange={(v) => updateConfig('errorMenuId', v)}
                options={menuOptions}
                placeholder="Выберите экран..."
              />
            </ConfigField>
          </ConfigGroup>

          <ConfigGroup title="Если не ответил" description="Что делать при истечении времени">
            <ConfigField
              label="Действие при таймауте"
              description="Что делать когда время вышло"
            >
              <ConfigSelect
                value={config.timeoutAction || 'none'}
                onChange={(v) => updateConfig('timeoutAction', v)}
                options={TIMEOUT_ACTION_OPTIONS}
              />
            </ConfigField>

            {config.timeoutAction === 'menu' && (
              <ConfigField
                label="Перейти к экрану"
                description="Какой экран показать при истечении времени"
              >
                <ConfigSelect
                  value={config.timeoutMenuId || ''}
                  onChange={(v) => updateConfig('timeoutMenuId', v)}
                  options={menuOptions}
                  placeholder="Выберите экран..."
                />
              </ConfigField>
            )}
          </ConfigGroup>

          <ConfigInfo type="tip">
            Используйте валидацию для сбора email, телефонов и чисел. Неправильные ответы будут отклоняться автоматически.
          </ConfigInfo>
        </div>
      );

    case 'quiz':
      return (
        <div className="space-y-4">
          <ConfigField
            label="Вопрос"
            description="Что спросить у пользователя"
            required
          >
            <ConfigTextInput
              value={config.question || ''}
              onChange={(v) => updateConfig('question', v)}
              placeholder="Какой город является столицей России?"
              multiline
              rows={2}
            />
          </ConfigField>

          <ConfigGroup title="Варианты ответов" description="Добавьте 2-4 варианта">
            {[0, 1, 2, 3].map((i) => (
              <ConfigField key={i} label={`Вариант ${i + 1}`}>
                <div className="flex gap-2">
                  <ConfigTextInput
                    value={config.options?.[i] || ''}
                    onChange={(v) => {
                      const opts = [...(config.options || ['', '', '', ''])];
                      opts[i] = v;
                      updateConfig('options', opts);
                    }}
                    placeholder={i === 0 ? 'Москва' : i === 1 ? 'Санкт-Петербург' : ''}
                  />
                  <ConfigToggle
                    checked={config.correctIndex === i}
                    onChange={() => updateConfig('correctIndex', i)}
                    label="✓"
                    icon={<CheckCircle className="w-4 h-4" />}
                  />
                </div>
              </ConfigField>
            ))}
          </ConfigGroup>

          <ConfigField
            label="Сообщение при правильном ответе"
            description="Что показать когда ответ верный"
          >
            <ConfigTextInput
              value={config.correctMessage || ''}
              onChange={(v) => updateConfig('correctMessage', v)}
              placeholder="🎉 Верно! Молодец!"
            />
          </ConfigField>

          <ConfigField
            label="Сообщение при неправильном ответе"
            description="Что показать когда ответ неверный"
          >
            <ConfigTextInput
              value={config.wrongMessage || ''}
              onChange={(v) => updateConfig('wrongMessage', v)}
              placeholder="❌ Неверно. Правильный ответ: Москва"
            />
          </ConfigField>

          <ConfigToggle
            checked={config.addPoints || false}
            onChange={(v) => updateConfig('addPoints', v)}
            label="Начислять баллы за правильный ответ"
            description="Добавить баллы пользователю"
            icon={<Star className="w-4 h-4" />}
          />

          {config.addPoints && (
            <ConfigField label="Сколько баллов">
              <ConfigNumber
                value={config.pointsAmount || 10}
                onChange={(v) => updateConfig('pointsAmount', v)}
                min={1}
                max={1000}
                presets={[
                  { value: 5, label: '+5' },
                  { value: 10, label: '+10' },
                  { value: 25, label: '+25' },
                ]}
              />
            </ConfigField>
          )}
        </div>
      );

    case 'random_result':
      const outcomeCount = config.outcomeCount || 2;
      return (
        <div className="space-y-4">
          <ConfigField
            label="Сколько вариантов"
            description="Бот случайно выберет один из них"
            tip="Используйте для розыгрышей, игр, случайных рекомендаций"
          >
            <ConfigNumber
              value={outcomeCount}
              onChange={(v) => updateConfig('outcomeCount', Math.max(2, Math.min(10, v)))}
              min={2}
              max={10}
              presets={[
                { value: 2, label: '2 варианта' },
                { value: 3, label: '3 варианта' },
                { value: 4, label: '4 варианта' },
                { value: 5, label: '5 вариантов' },
              ]}
            />
          </ConfigField>

          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200/50 dark:border-purple-800/30">
            <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-3">
              🎲 Шансы выпадения:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: outcomeCount }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/50 dark:bg-black/20">
                  <span className="text-sm text-purple-600 dark:text-purple-400">
                    Исход {i + 1}
                  </span>
                  <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
                    {Math.round(100 / outcomeCount)}%
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-purple-500 dark:text-purple-400 mt-3">
              💡 Соедините каждый выход с нужным экраном на канвасе
            </p>
          </div>

          <ConfigField
            label="Сохранить результат"
            description="Куда записать номер выбранного варианта"
            example="user.luck_result"
          >
            <ConfigTextInput
              value={config.saveToField || ''}
              onChange={(v) => updateConfig('saveToField', v)}
              placeholder="user.random_result"
            />
          </ConfigField>
        </div>
      );

    // Магазин
    case 'add_to_cart':
      return (
        <div className="space-y-4">
          <ConfigInfo type="info">
            Добавит товар в корзину покупателя. Покупатель сможет посмотреть корзину и оплатить.
          </ConfigInfo>

          <ConfigField
            label="ID товара"
            description="Уникальный код товара в вашей системе"
            example="product_001"
            required
          >
            <ConfigTextInput
              value={config.productId || ''}
              onChange={(v) => updateConfig('productId', v)}
              placeholder="product_001"
            />
          </ConfigField>

          <ConfigField
            label="Название товара"
            description="Как товар будет отображаться в корзине"
            required
          >
            <ConfigTextInput
              value={config.name || ''}
              onChange={(v) => updateConfig('name', v)}
              placeholder="Футболка с логотипом"
            />
          </ConfigField>

          <div className="grid grid-cols-2 gap-3">
            <ConfigField label="Цена" required>
              <ConfigNumber
                value={config.price || 0}
                onChange={(v) => updateConfig('price', v)}
                min={0}
                max={1000000}
              />
            </ConfigField>
            <ConfigField label="Валюта">
              <ConfigSelect
                value={config.currency || '₽'}
                onChange={(v) => updateConfig('currency', v)}
                options={CURRENCY_OPTIONS}
              />
            </ConfigField>
          </div>

          <ConfigField label="Количество">
            <ConfigNumber
              value={config.quantity || 1}
              onChange={(v) => updateConfig('quantity', v)}
              min={1}
              max={100}
              presets={[
                { value: 1, label: '1 шт' },
                { value: 2, label: '2 шт' },
                { value: 5, label: '5 шт' },
              ]}
            />
          </ConfigField>
        </div>
      );

    case 'show_product':
      return (
        <div className="space-y-4">
          <ConfigInfo type="info">
            Покажет карточку товара с фото, описанием и ценой. Можно добавить кнопку «В корзину».
          </ConfigInfo>

          <ConfigField
            label="ID товара"
            description="Уникальный код товара"
            example="product_001"
            required
          >
            <ConfigTextInput
              value={config.productId || ''}
              onChange={(v) => updateConfig('productId', v)}
              placeholder="product_001"
            />
          </ConfigField>

          <ConfigField
            label="Название"
            description="Заголовок карточки товара"
            required
          >
            <ConfigTextInput
              value={config.name || ''}
              onChange={(v) => updateConfig('name', v)}
              placeholder="Стильная футболка"
            />
          </ConfigField>

          <ConfigField
            label="Описание"
            description="Подробности о товаре"
          >
            <ConfigTextInput
              value={config.description || ''}
              onChange={(v) => updateConfig('description', v)}
              placeholder="100% хлопок, размеры S-XXL"
              multiline
              rows={3}
            />
          </ConfigField>

          <div className="grid grid-cols-2 gap-3">
            <ConfigField label="Цена" required>
              <ConfigNumber
                value={config.price || 0}
                onChange={(v) => updateConfig('price', v)}
                min={0}
                max={1000000}
              />
            </ConfigField>
            <ConfigField label="Валюта">
              <ConfigSelect
                value={config.currency || '₽'}
                onChange={(v) => updateConfig('currency', v)}
                options={CURRENCY_OPTIONS}
              />
            </ConfigField>
          </div>

          <ConfigField
            label="Ссылка на фото"
            description="URL изображения товара"
          >
            <ConfigTextInput
              value={config.imageUrl || ''}
              onChange={(v) => updateConfig('imageUrl', v)}
              placeholder="https://example.com/photo.jpg"
              validate={validators.url}
            />
          </ConfigField>

          <ConfigToggle
            checked={config.showAddButton !== false}
            onChange={(v) => updateConfig('showAddButton', v)}
            label="Показать кнопку «В корзину»"
            description="Пользователь сможет добавить товар"
            icon={<ShoppingCart className="w-4 h-4" />}
          />
        </div>
      );

    case 'show_cart':
      return (
        <div className="space-y-4">
          <ConfigInfo type="info">
            Покажет содержимое корзины: список товаров, количество и общую сумму.
          </ConfigInfo>

          <ConfigField
            label="Формат отображения"
            description="Как показать содержимое корзины"
          >
            <ConfigSelect
              value={config.format || 'detailed'}
              onChange={(v) => updateConfig('format', v)}
              options={[
                { value: 'detailed', label: 'Подробный', description: 'Все товары с описанием' },
                { value: 'compact', label: 'Компактный', description: 'Только названия и цены' },
                { value: 'summary', label: 'Только итого', description: 'Количество и сумма' },
              ]}
            />
          </ConfigField>

          <ConfigToggle
            checked={config.showPayButton !== false}
            onChange={(v) => updateConfig('showPayButton', v)}
            label="Показать кнопку оплаты"
            description="Перейти к оформлению заказа"
            icon={<ShoppingCart className="w-4 h-4" />}
          />

          <ConfigToggle
            checked={config.showClearButton || false}
            onChange={(v) => updateConfig('showClearButton', v)}
            label="Показать кнопку очистки"
            description="Удалить все товары из корзины"
            icon={<Trash2 className="w-4 h-4" />}
          />
        </div>
      );

    case 'clear_cart':
      return (
        <div className="space-y-4">
          <ConfigInfo type="warning">
            Это действие удалит все товары из корзины покупателя.
          </ConfigInfo>

          <ConfigToggle
            checked={config.confirm || false}
            onChange={(v) => updateConfig('confirm', v)}
            label="Запросить подтверждение"
            description="Спросить пользователя перед очисткой"
            icon={<HelpCircle className="w-4 h-4" />}
          />

          {config.confirm && (
            <ConfigField
              label="Текст подтверждения"
              description="Что спросить перед очисткой"
            >
              <ConfigTextInput
                value={config.confirmText || ''}
                onChange={(v) => updateConfig('confirmText', v)}
                placeholder="Вы уверены, что хотите очистить корзину?"
              />
            </ConfigField>
          )}
        </div>
      );

    case 'apply_promo':
      return (
        <div className="space-y-4">
          <ConfigInfo type="info">
            Применит промокод к заказу и уменьшит сумму.
          </ConfigInfo>

          <ConfigField
            label="Промокод"
            description="Код, который вводит покупатель"
            example="SALE20"
            required
          >
            <ConfigTextInput
              value={config.code || ''}
              onChange={(v) => updateConfig('code', v.toUpperCase())}
              placeholder="SALE20"
            />
          </ConfigField>

          <ConfigField
            label="Тип скидки"
            description="Как считать скидку"
          >
            <ConfigSelect
              value={config.discountType || 'percent'}
              onChange={(v) => updateConfig('discountType', v)}
              options={[
                { value: 'percent', label: 'Процент от суммы', description: 'Например, -20%' },
                { value: 'fixed', label: 'Фиксированная сумма', description: 'Например, -500₽' },
              ]}
            />
          </ConfigField>

          <ConfigField
            label={config.discountType === 'percent' ? 'Процент скидки' : 'Сумма скидки'}
            description={config.discountType === 'percent' ? 'От 1 до 100%' : 'В рублях'}
          >
            <ConfigNumber
              value={config.discountValue || 10}
              onChange={(v) => updateConfig('discountValue', v)}
              min={1}
              max={config.discountType === 'percent' ? 100 : 100000}
              unit={config.discountType === 'percent' ? '%' : '₽'}
              presets={config.discountType === 'percent' 
                ? [{ value: 5, label: '5%' }, { value: 10, label: '10%' }, { value: 20, label: '20%' }, { value: 50, label: '50%' }]
                : [{ value: 100, label: '100₽' }, { value: 500, label: '500₽' }, { value: 1000, label: '1000₽' }]
              }
            />
          </ConfigField>

          <ConfigField
            label="Лимит использований"
            description="Сколько раз можно применить (0 = без ограничений)"
          >
            <ConfigNumber
              value={config.maxUses || 0}
              onChange={(v) => updateConfig('maxUses', v)}
              min={0}
              max={10000}
              presets={[
                { value: 0, label: 'Без лимита' },
                { value: 10, label: '10 раз' },
                { value: 100, label: '100 раз' },
              ]}
            />
          </ConfigField>
        </div>
      );

    // Проверка подписки
    case 'check_subscription':
      return (
        <div className="space-y-4">
          <ConfigInfo type="info">
            Проверит, подписан ли пользователь на канал или чат. Полезно для обязательной подписки перед использованием бота.
          </ConfigInfo>

          <ConfigField
            label="Канал или чат"
            description="@username канала или ID чата"
            example="@mychannel"
            required
          >
            <ConfigTextInput
              value={config.channel || ''}
              onChange={(v) => updateConfig('channel', v)}
              placeholder="@mychannel"
              validate={validators.channel}
            />
          </ConfigField>

          <ConfigGroup title="Действия по результату" description="Что делать после проверки">
            <ConfigField
              label="Если подписан ✓"
              description="Куда перейти"
            >
              <ConfigSelect
                value={config.subscribedMenuId || ''}
                onChange={(v) => updateConfig('subscribedMenuId', v)}
                options={[{ value: '', label: 'Продолжить дальше' }, ...menuOptions]}
                placeholder="Выберите экран..."
              />
            </ConfigField>

            <ConfigField
              label="Если не подписан ✗"
              description="Куда перейти"
            >
              <ConfigSelect
                value={config.notSubscribedMenuId || ''}
                onChange={(v) => updateConfig('notSubscribedMenuId', v)}
                options={[{ value: '', label: 'Продолжить дальше' }, ...menuOptions]}
                placeholder="Выберите экран..."
              />
            </ConfigField>
          </ConfigGroup>

          <ConfigToggle
            checked={config.showButton || false}
            onChange={(v) => updateConfig('showButton', v)}
            label="Показать кнопку подписки"
            description="Добавить кнопку для быстрой подписки"
            icon={<Users className="w-4 h-4" />}
          />
        </div>
      );

    // Проверка роли
    case 'check_role':
      return (
        <div className="space-y-4">
          <ConfigInfo type="info">
            Проверит роль пользователя для показа разного контента разным группам.
          </ConfigInfo>

          <ConfigField
            label="Какая роль"
            description="Выберите роль для проверки"
          >
            <ConfigSelect
              value={config.role || 'subscriber'}
              onChange={(v) => updateConfig('role', v)}
              options={ROLE_OPTIONS}
            />
          </ConfigField>

          <ConfigGroup title="Действия по результату" description="Куда перейти">
            <ConfigField label="Если есть роль ✓">
              <ConfigSelect
                value={config.hasRoleMenuId || ''}
                onChange={(v) => updateConfig('hasRoleMenuId', v)}
                options={[{ value: '', label: 'Продолжить дальше' }, ...menuOptions]}
              />
            </ConfigField>

            <ConfigField label="Если нет роли ✗">
              <ConfigSelect
                value={config.noRoleMenuId || ''}
                onChange={(v) => updateConfig('noRoleMenuId', v)}
                options={[{ value: '', label: 'Продолжить дальше' }, ...menuOptions]}
              />
            </ConfigField>
          </ConfigGroup>
        </div>
      );

    // Проверка значения
    case 'check_value':
      return (
        <div className="space-y-4">
          <ConfigInfo type="info">
            Сравнит сохранённое значение с заданным. Полезно для проверки баланса, уровня и т.д.
          </ConfigInfo>

          <ConfigField
            label="Какое поле проверить"
            description="Название сохранённого значения"
            example="user.balance"
            required
          >
            <ConfigTextInput
              value={config.field || ''}
              onChange={(v) => updateConfig('field', v)}
              placeholder="user.balance"
            />
          </ConfigField>

          <ConfigField
            label="Как сравнить"
            description="Условие сравнения"
          >
            <ConfigSelect
              value={config.operator || 'equals'}
              onChange={(v) => updateConfig('operator', v)}
              options={OPERATOR_OPTIONS}
            />
          </ConfigField>

          {config.operator !== 'exists' && (
            <ConfigField
              label="С каким значением"
              description="Значение для сравнения"
            >
              <ConfigTextInput
                value={config.value || ''}
                onChange={(v) => updateConfig('value', v)}
                placeholder="100"
              />
            </ConfigField>
          )}

          <ConfigGroup title="Действия по результату">
            <ConfigField label="Если условие выполняется ✓">
              <ConfigSelect
                value={config.trueMenuId || ''}
                onChange={(v) => updateConfig('trueMenuId', v)}
                options={[{ value: '', label: 'Продолжить дальше' }, ...menuOptions]}
              />
            </ConfigField>
            <ConfigField label="Если не выполняется ✗">
              <ConfigSelect
                value={config.falseMenuId || ''}
                onChange={(v) => updateConfig('falseMenuId', v)}
                options={[{ value: '', label: 'Продолжить дальше' }, ...menuOptions]}
              />
            </ConfigField>
          </ConfigGroup>
        </div>
      );

    // Ключевые слова
    case 'keyword_trigger':
      return (
        <div className="space-y-4">
          <ConfigInfo type="info">
            Бот отреагирует, когда пользователь напишет определённые слова.
          </ConfigInfo>

          <ConfigField
            label="Ключевые слова"
            description="Введите слова через запятую"
            example="привет, начать, старт, /start"
            tip="Бот сработает при любом из этих слов"
            required
          >
            <ConfigTextInput
              value={(config.keywords || []).join(', ')}
              onChange={(v) => updateConfig('keywords', v.split(',').map((s: string) => s.trim()).filter(Boolean))}
              placeholder="привет, начать, старт"
              multiline
              rows={2}
            />
          </ConfigField>

          <ConfigField
            label="Как искать"
            description="Способ поиска слова в сообщении"
          >
            <ConfigSelect
              value={config.matchType || 'contains'}
              onChange={(v) => updateConfig('matchType', v)}
              options={MATCH_TYPE_OPTIONS}
            />
          </ConfigField>

          <ConfigToggle
            checked={config.caseSensitive || false}
            onChange={(v) => updateConfig('caseSensitive', v)}
            label="Учитывать регистр"
            description="Различать заглавные и строчные буквы"
            icon={<Search className="w-4 h-4" />}
          />

          <ConfigField
            label="Куда перейти при совпадении"
            description="Какой экран показать"
          >
            <ConfigSelect
              value={config.targetMenuId || ''}
              onChange={(v) => updateConfig('targetMenuId', v)}
              options={menuOptions}
              placeholder="Выберите экран..."
            />
          </ConfigField>
        </div>
      );

    // Нет ответа
    case 'no_response':
      return (
        <div className="space-y-4">
          <ConfigInfo type="info">
            Что делать, если пользователь долго не отвечает.
          </ConfigInfo>

          <ConfigField
            label="Сколько ждать"
            description="После этого времени сработает действие"
            tip="Обычно 5-10 минут достаточно"
          >
            <ConfigNumber
              value={config.timeout || 300}
              onChange={(v) => updateConfig('timeout', v)}
              min={60}
              max={86400}
              unit="сек"
              presets={[
                { value: 300, label: '5 мин' },
                { value: 600, label: '10 мин' },
                { value: 1800, label: '30 мин' },
                { value: 3600, label: '1 час' },
              ]}
            />
          </ConfigField>

          <ConfigField
            label="Действие"
            description="Что делать если молчит"
          >
            <ConfigSelect
              value={config.action || 'send_reminder'}
              onChange={(v) => updateConfig('action', v)}
              options={[
                { value: 'send_reminder', label: 'Отправить напоминание', description: 'Написать ещё раз' },
                { value: 'go_to_menu', label: 'Перейти к экрану', description: 'Показать другой экран' },
                { value: 'add_tag', label: 'Добавить метку', description: 'Пометить как неактивного' },
              ]}
            />
          </ConfigField>

          {config.action === 'send_reminder' && (
            <ConfigField label="Текст напоминания">
              <ConfigTextInput
                value={config.reminderText || ''}
                onChange={(v) => updateConfig('reminderText', v)}
                placeholder="Привет! Вы ещё с нами?"
                multiline
                rows={2}
              />
            </ConfigField>
          )}

          {config.action === 'go_to_menu' && (
            <ConfigField label="Какой экран показать">
              <ConfigSelect
                value={config.targetMenuId || ''}
                onChange={(v) => updateConfig('targetMenuId', v)}
                options={menuOptions}
              />
            </ConfigField>
          )}

          {config.action === 'add_tag' && (
            <ConfigField label="Какую метку добавить">
              <ConfigTextInput
                value={config.tag || ''}
                onChange={(v) => updateConfig('tag', v)}
                placeholder="inactive"
              />
            </ConfigField>
          )}
        </div>
      );

    // Неверный ответ
    case 'wrong_response':
      return (
        <div className="space-y-4">
          <ConfigInfo type="info">
            Что делать, когда пользователь отвечает неправильно.
          </ConfigInfo>

          <ConfigField
            label="Максимум попыток"
            description="Сколько раз можно ошибиться"
          >
            <ConfigNumber
              value={config.maxAttempts || 3}
              onChange={(v) => updateConfig('maxAttempts', v)}
              min={1}
              max={10}
              presets={[
                { value: 1, label: '1 раз' },
                { value: 3, label: '3 раза' },
                { value: 5, label: '5 раз' },
              ]}
            />
          </ConfigField>

          <ConfigField
            label="Действие при ошибке"
            description="Что делать когда ответ неверный"
          >
            <ConfigSelect
              value={config.action || 'show_hint'}
              onChange={(v) => updateConfig('action', v)}
              options={[
                { value: 'show_hint', label: 'Показать подсказку', description: 'Помочь с ответом' },
                { value: 'repeat', label: 'Повторить вопрос', description: 'Спросить ещё раз' },
                { value: 'skip', label: 'Пропустить', description: 'Идти дальше' },
                { value: 'go_to_menu', label: 'Перейти к экрану', description: 'Показать другой экран' },
              ]}
            />
          </ConfigField>

          {config.action === 'show_hint' && (
            <ConfigField label="Текст подсказки">
              <ConfigTextInput
                value={config.hintText || ''}
                onChange={(v) => updateConfig('hintText', v)}
                placeholder="Подсказка: правильный ответ начинается на М..."
              />
            </ConfigField>
          )}

          {config.action === 'go_to_menu' && (
            <ConfigField label="Какой экран показать">
              <ConfigSelect
                value={config.targetMenuId || ''}
                onChange={(v) => updateConfig('targetMenuId', v)}
                options={menuOptions}
              />
            </ConfigField>
          )}

          <ConfigField
            label="После исчерпания попыток"
            description="Что делать когда попытки закончились"
          >
            <ConfigSelect
              value={config.exhaustedAction || 'skip'}
              onChange={(v) => updateConfig('exhaustedAction', v)}
              options={[
                { value: 'skip', label: 'Пропустить вопрос' },
                { value: 'go_to_menu', label: 'Перейти к экрану' },
              ]}
            />
          </ConfigField>
        </div>
      );

    // Взвешенный рандом
    case 'weighted_random':
      const weightedCount = config.outcomeCount || 3;
      return (
        <div className="space-y-4">
          <ConfigInfo type="info">
            Случайный выбор с разной вероятностью. Настройте шансы для каждого варианта.
          </ConfigInfo>

          <ConfigField
            label="Количество вариантов"
            description="Сколько вариантов для выбора"
          >
            <ConfigNumber
              value={weightedCount}
              onChange={(v) => updateConfig('outcomeCount', Math.max(2, Math.min(10, v)))}
              min={2}
              max={10}
              presets={[
                { value: 2, label: '2' },
                { value: 3, label: '3' },
                { value: 4, label: '4' },
                { value: 5, label: '5' },
              ]}
            />
          </ConfigField>

          <ConfigGroup title="Настройте вероятности" description="Чем больше вес, тем выше шанс">
            {Array.from({ length: weightedCount }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-20">Вариант {i + 1}</span>
                <ConfigNumber
                  value={config.weights?.[i] || 1}
                  onChange={(v) => {
                    const weights = [...(config.weights || Array(weightedCount).fill(1))];
                    weights[i] = v;
                    updateConfig('weights', weights);
                  }}
                  min={1}
                  max={100}
                />
                <span className="text-xs text-muted-foreground">
                  {Math.round(((config.weights?.[i] || 1) / ((config.weights || Array(weightedCount).fill(1)) as number[]).reduce((a: number, b: number) => a + b, 0)) * 100)}%
                </span>
              </div>
            ))}
          </ConfigGroup>

          <ConfigInfo type="tip">
            Пример: вес 1 и 3 означают шансы 25% и 75%
          </ConfigInfo>
        </div>
      );

    // Лотерея
    case 'lottery':
      return (
        <div className="space-y-4">
          <ConfigInfo type="info">
            Проведите розыгрыш среди участников. Бот случайно выберет победителей.
          </ConfigInfo>

          <ConfigField
            label="Количество победителей"
            description="Сколько человек выиграют"
          >
            <ConfigNumber
              value={config.winnersCount || 1}
              onChange={(v) => updateConfig('winnersCount', v)}
              min={1}
              max={100}
              presets={[
                { value: 1, label: '1 победитель' },
                { value: 3, label: '3 победителя' },
                { value: 5, label: '5 победителей' },
                { value: 10, label: '10 победителей' },
              ]}
            />
          </ConfigField>

          <ConfigField
            label="Обязательная метка участника"
            description="Только пользователи с этой меткой участвуют"
            example="lottery_participant"
          >
            <ConfigTextInput
              value={config.participantTag || ''}
              onChange={(v) => updateConfig('participantTag', v)}
              placeholder="lottery_participant"
              validate={validators.tag}
            />
          </ConfigField>

          <ConfigToggle
            checked={config.excludePreviousWinners || false}
            onChange={(v) => updateConfig('excludePreviousWinners', v)}
            label="Исключить прошлых победителей"
            description="Нельзя выиграть дважды"
            icon={<Gift className="w-4 h-4" />}
          />

          <ConfigField
            label="Сообщение победителю"
            description="Что получит победитель"
          >
            <ConfigTextInput
              value={config.winnerMessage || ''}
              onChange={(v) => updateConfig('winnerMessage', v)}
              placeholder="🎉 Поздравляем! Вы выиграли!"
              multiline
              rows={2}
            />
          </ConfigField>
        </div>
      );

    // Таблица лидеров
    case 'leaderboard':
      return (
        <div className="space-y-4">
          <ConfigInfo type="info">
            Покажет рейтинг пользователей по баллам или другому показателю.
          </ConfigInfo>

          <ConfigField
            label="По какому показателю"
            description="Какие данные использовать для рейтинга"
            example="points"
          >
            <ConfigTextInput
              value={config.field || 'points'}
              onChange={(v) => updateConfig('field', v)}
              placeholder="points"
            />
          </ConfigField>

          <ConfigField
            label="Сколько мест показать"
            description="Топ сколько пользователей отобразить"
          >
            <ConfigNumber
              value={config.limit || 10}
              onChange={(v) => updateConfig('limit', v)}
              min={3}
              max={100}
              presets={[
                { value: 5, label: 'Топ 5' },
                { value: 10, label: 'Топ 10' },
                { value: 20, label: 'Топ 20' },
                { value: 50, label: 'Топ 50' },
              ]}
            />
          </ConfigField>

          <ConfigField
            label="Заголовок таблицы"
            description="Как назвать рейтинг"
          >
            <ConfigTextInput
              value={config.title || ''}
              onChange={(v) => updateConfig('title', v)}
              placeholder="🏆 Таблица лидеров"
            />
          </ConfigField>

          <ConfigToggle
            checked={config.showUserPosition !== false}
            onChange={(v) => updateConfig('showUserPosition', v)}
            label="Показать позицию пользователя"
            description="Добавить строку «Ваше место: X»"
            icon={<Trophy className="w-4 h-4" />}
          />

          <ConfigField
            label="Формат строки"
            description="Как показывать каждого участника"
          >
            <ConfigSelect
              value={config.format || 'detailed'}
              onChange={(v) => updateConfig('format', v)}
              options={[
                { value: 'detailed', label: 'Подробный', description: 'Место, имя, баллы' },
                { value: 'compact', label: 'Компактный', description: 'Только имя и баллы' },
                { value: 'emoji', label: 'С эмодзи', description: '🥇🥈🥉 + имя + баллы' },
              ]}
            />
          </ConfigField>
        </div>
      );

    // Антиспам
    case 'spam_protection':
      return (
        <div className="space-y-4">
          <ConfigInfo type="warning">
            Ограничит частоту сообщений от пользователя. Защита от злоупотреблений.
          </ConfigInfo>

          <ConfigField
            label="Максимум сообщений"
            description="Сколько сообщений можно отправить"
          >
            <ConfigNumber
              value={config.maxMessages || 5}
              onChange={(v) => updateConfig('maxMessages', v)}
              min={1}
              max={100}
              presets={[
                { value: 3, label: '3 сообщения' },
                { value: 5, label: '5 сообщений' },
                { value: 10, label: '10 сообщений' },
              ]}
            />
          </ConfigField>

          <ConfigField
            label="За какой период"
            description="Временное окно для подсчёта"
          >
            <ConfigNumber
              value={config.periodSeconds || 60}
              onChange={(v) => updateConfig('periodSeconds', v)}
              min={10}
              max={3600}
              unit="сек"
              presets={[
                { value: 30, label: '30 сек' },
                { value: 60, label: '1 мин' },
                { value: 300, label: '5 мин' },
              ]}
            />
          </ConfigField>

          <ConfigField
            label="Что делать при спаме"
            description="Действие при превышении лимита"
          >
            <ConfigSelect
              value={config.action || 'ignore'}
              onChange={(v) => updateConfig('action', v)}
              options={[
                { value: 'ignore', label: 'Игнорировать', description: 'Не отвечать на сообщения' },
                { value: 'warn', label: 'Предупредить', description: 'Показать сообщение' },
                { value: 'timeout', label: 'Таймаут', description: 'Временно заблокировать' },
              ]}
            />
          </ConfigField>

          {config.action === 'warn' && (
            <ConfigField label="Текст предупреждения">
              <ConfigTextInput
                value={config.warnMessage || ''}
                onChange={(v) => updateConfig('warnMessage', v)}
                placeholder="Подождите немного перед следующим сообщением"
              />
            </ConfigField>
          )}

          {config.action === 'timeout' && (
            <ConfigField label="Длительность таймаута">
              <ConfigNumber
                value={config.timeoutSeconds || 60}
                onChange={(v) => updateConfig('timeoutSeconds', v)}
                min={10}
                max={86400}
                unit="сек"
                presets={[
                  { value: 60, label: '1 мин' },
                  { value: 300, label: '5 мин' },
                  { value: 3600, label: '1 час' },
                ]}
              />
            </ConfigField>
          )}
        </div>
      );

    // Изменить количество в корзине
    case 'update_quantity':
      return (
        <div className="space-y-4">
          <ConfigInfo type="info">
            Изменит количество товара в корзине покупателя.
          </ConfigInfo>

          <ConfigField
            label="ID товара"
            description="Какой товар изменить"
            required
          >
            <ConfigTextInput
              value={config.productId || ''}
              onChange={(v) => updateConfig('productId', v)}
              placeholder="product_001"
            />
          </ConfigField>

          <ConfigField
            label="Действие"
            description="Что сделать с количеством"
          >
            <ConfigSelect
              value={config.operation || 'set'}
              onChange={(v) => updateConfig('operation', v)}
              options={[
                { value: 'set', label: 'Установить', description: 'Задать точное количество' },
                { value: 'add', label: 'Добавить', description: '+N к текущему' },
                { value: 'subtract', label: 'Убавить', description: '-N от текущего' },
              ]}
            />
          </ConfigField>

          <ConfigField
            label="Количество"
            description="Число для операции"
          >
            <ConfigNumber
              value={config.quantity || 1}
              onChange={(v) => updateConfig('quantity', v)}
              min={0}
              max={100}
              presets={[
                { value: 1, label: '1' },
                { value: 2, label: '2' },
                { value: 5, label: '5' },
              ]}
            />
          </ConfigField>
        </div>
      );

    // Удалить из корзины
    case 'remove_from_cart':
      return (
        <div className="space-y-4">
          <ConfigInfo type="info">
            Удалит товар из корзины покупателя.
          </ConfigInfo>

          <ConfigField
            label="ID товара"
            description="Какой товар удалить"
            required
          >
            <ConfigTextInput
              value={config.productId || ''}
              onChange={(v) => updateConfig('productId', v)}
              placeholder="product_001"
            />
          </ConfigField>

          <ConfigToggle
            checked={config.showMessage !== false}
            onChange={(v) => updateConfig('showMessage', v)}
            label="Показать подтверждение"
            description="Сообщить об удалении"
            icon={<ShoppingCart className="w-4 h-4" />}
          />
        </div>
      );

    // Проверить наличие на складе
    case 'check_stock':
      return (
        <div className="space-y-4">
          <ConfigInfo type="info">
            Проверит, есть ли товар на складе в нужном количестве.
          </ConfigInfo>

          <ConfigField
            label="ID товара"
            description="Какой товар проверить"
            required
          >
            <ConfigTextInput
              value={config.productId || ''}
              onChange={(v) => updateConfig('productId', v)}
              placeholder="product_001"
            />
          </ConfigField>

          <ConfigField
            label="Минимальное количество"
            description="Сколько нужно в наличии"
          >
            <ConfigNumber
              value={config.minQuantity || 1}
              onChange={(v) => updateConfig('minQuantity', v)}
              min={1}
              max={10000}
              presets={[
                { value: 1, label: '1 шт' },
                { value: 5, label: '5 шт' },
                { value: 10, label: '10 шт' },
              ]}
            />
          </ConfigField>

          <ConfigGroup title="Действия по результату">
            <ConfigField label="Если в наличии ✓">
              <ConfigSelect
                value={config.inStockMenuId || ''}
                onChange={(v) => updateConfig('inStockMenuId', v)}
                options={[{ value: '', label: 'Продолжить дальше' }, ...menuOptions]}
              />
            </ConfigField>
            <ConfigField label="Если нет в наличии ✗">
              <ConfigSelect
                value={config.outOfStockMenuId || ''}
                onChange={(v) => updateConfig('outOfStockMenuId', v)}
                options={[{ value: '', label: 'Продолжить дальше' }, ...menuOptions]}
              />
            </ConfigField>
          </ConfigGroup>
        </div>
      );

    // После оплаты
    case 'on_payment_success':
      return (
        <div className="space-y-4">
          <ConfigInfo type="info">
            Что делать когда пользователь успешно оплатил заказ.
          </ConfigInfo>

          <ConfigField
            label="Сообщение об успехе"
            description="Что показать после оплаты"
          >
            <ConfigTextInput
              value={config.successMessage || ''}
              onChange={(v) => updateConfig('successMessage', v)}
              placeholder="🎉 Спасибо за покупку! Ваш заказ принят."
              multiline
              rows={2}
            />
          </ConfigField>

          <ConfigToggle
            checked={config.clearCart !== false}
            onChange={(v) => updateConfig('clearCart', v)}
            label="Очистить корзину"
            description="Удалить товары после оплаты"
            icon={<ShoppingCart className="w-4 h-4" />}
          />

          <ConfigToggle
            checked={config.addTag || false}
            onChange={(v) => updateConfig('addTag', v)}
            label="Добавить метку покупателя"
            description="Пометить как «customer»"
            icon={<Tag className="w-4 h-4" />}
          />

          {config.addTag && (
            <ConfigField label="Название метки">
              <ConfigTextInput
                value={config.customerTag || 'customer'}
                onChange={(v) => updateConfig('customerTag', v)}
                placeholder="customer"
              />
            </ConfigField>
          )}

          <ConfigField
            label="Перейти к экрану"
            description="Какой экран показать после оплаты"
          >
            <ConfigSelect
              value={config.targetMenuId || ''}
              onChange={(v) => updateConfig('targetMenuId', v)}
              options={[{ value: '', label: 'Остаться на месте' }, ...menuOptions]}
            />
          </ConfigField>
        </div>
      );

    // Первый визит
    case 'on_first_visit':
      return (
        <div className="space-y-4">
          <ConfigInfo type="info">
            Действия только для новых пользователей, которые запустили бота впервые.
          </ConfigInfo>

          <ConfigField
            label="Приветственное сообщение"
            description="Что показать новому пользователю"
          >
            <ConfigTextInput
              value={config.welcomeMessage || ''}
              onChange={(v) => updateConfig('welcomeMessage', v)}
              placeholder="👋 Добро пожаловать! Рады вас видеть!"
              multiline
              rows={2}
              showVariables
            />
          </ConfigField>

          <ConfigToggle
            checked={config.addTag || false}
            onChange={(v) => updateConfig('addTag', v)}
            label="Добавить метку новичка"
            description="Пометить как «new_user»"
            icon={<Users className="w-4 h-4" />}
          />

          <ConfigField
            label="Перейти к экрану"
            description="Специальный экран для новичков"
          >
            <ConfigSelect
              value={config.targetMenuId || ''}
              onChange={(v) => updateConfig('targetMenuId', v)}
              options={[{ value: '', label: 'Продолжить обычно' }, ...menuOptions]}
              placeholder="Выберите экран..."
            />
          </ConfigField>
        </div>
      );

    // По таймеру
    case 'on_timer':
      return (
        <div className="space-y-4">
          <ConfigInfo type="info">
            Запустит действие через определённое время после предыдущего события.
          </ConfigInfo>

          <ConfigField
            label="Через сколько времени"
            description="Задержка перед выполнением"
          >
            <ConfigNumber
              value={config.delaySeconds || 3600}
              onChange={(v) => updateConfig('delaySeconds', v)}
              min={60}
              max={604800}
              unit="сек"
              presets={[
                { value: 3600, label: '1 час' },
                { value: 86400, label: '1 день' },
                { value: 259200, label: '3 дня' },
                { value: 604800, label: '1 неделя' },
              ]}
            />
          </ConfigField>

          <p className="text-sm text-muted-foreground">
            ≈ {config.delaySeconds >= 86400 
              ? `${Math.floor((config.delaySeconds || 3600) / 86400)} дней` 
              : config.delaySeconds >= 3600 
                ? `${Math.floor((config.delaySeconds || 3600) / 3600)} часов`
                : `${Math.floor((config.delaySeconds || 3600) / 60)} минут`
            }
          </p>

          <ConfigField
            label="Что отправить"
            description="Сообщение через время"
          >
            <ConfigTextInput
              value={config.message || ''}
              onChange={(v) => updateConfig('message', v)}
              placeholder="Привет! Давно не заходили..."
              multiline
              rows={2}
              showVariables
            />
          </ConfigField>

          <ConfigField
            label="Перейти к экрану"
            description="Какой экран показать"
          >
            <ConfigSelect
              value={config.targetMenuId || ''}
              onChange={(v) => updateConfig('targetMenuId', v)}
              options={[{ value: '', label: 'Только сообщение' }, ...menuOptions]}
            />
          </ConfigField>
        </div>
      );

    // По порогу
    case 'on_threshold':
      return (
        <div className="space-y-4">
          <ConfigInfo type="info">
            Сработает когда значение достигнет определённого порога.
          </ConfigInfo>

          <ConfigField
            label="Какое значение отслеживать"
            description="Название поля для проверки"
            example="user.points"
            required
          >
            <ConfigTextInput
              value={config.field || ''}
              onChange={(v) => updateConfig('field', v)}
              placeholder="user.points"
            />
          </ConfigField>

          <ConfigField
            label="Пороговое значение"
            description="При достижении какого числа сработает"
          >
            <ConfigNumber
              value={config.threshold || 100}
              onChange={(v) => updateConfig('threshold', v)}
              min={1}
              max={1000000}
              presets={[
                { value: 10, label: '10' },
                { value: 50, label: '50' },
                { value: 100, label: '100' },
                { value: 1000, label: '1000' },
              ]}
            />
          </ConfigField>

          <ConfigField
            label="Условие срабатывания"
            description="Когда именно сработать"
          >
            <ConfigSelect
              value={config.condition || 'greater_or_equal'}
              onChange={(v) => updateConfig('condition', v)}
              options={[
                { value: 'greater_or_equal', label: 'Больше или равно', description: '≥ порога' },
                { value: 'greater', label: 'Строго больше', description: '> порога' },
                { value: 'equals', label: 'Равно', description: '= порогу' },
                { value: 'less', label: 'Меньше', description: '< порога' },
              ]}
            />
          </ConfigField>

          <ConfigField
            label="Что показать при достижении"
            description="Сообщение пользователю"
          >
            <ConfigTextInput
              value={config.message || ''}
              onChange={(v) => updateConfig('message', v)}
              placeholder="🎉 Поздравляем! Вы достигли 100 баллов!"
              multiline
              rows={2}
            />
          </ConfigField>
        </div>
      );

    // Отложенное сообщение
    case 'schedule_message':
      return (
        <div className="space-y-4">
          <ConfigInfo type="info">
            Отправит сообщение через указанное время.
          </ConfigInfo>

          <ConfigField
            label="Через сколько отправить"
            description="Задержка перед отправкой"
          >
            <ConfigNumber
              value={config.delaySeconds || 3600}
              onChange={(v) => updateConfig('delaySeconds', v)}
              min={60}
              max={604800}
              unit="сек"
              presets={[
                { value: 3600, label: '1 час' },
                { value: 86400, label: '1 день' },
                { value: 259200, label: '3 дня' },
              ]}
            />
          </ConfigField>

          <p className="text-sm text-muted-foreground">
            ≈ {config.delaySeconds >= 86400 
              ? `${Math.floor((config.delaySeconds || 3600) / 86400)} дней` 
              : `${Math.floor((config.delaySeconds || 3600) / 3600)} часов`
            }
          </p>

          <ConfigField
            label="Текст сообщения"
            description="Что отправить"
            required
          >
            <ConfigTextInput
              value={config.message || ''}
              onChange={(v) => updateConfig('message', v)}
              placeholder="Напоминаем о нашем предложении!"
              multiline
              rows={3}
              showVariables
            />
          </ConfigField>

          <ConfigToggle
            checked={config.cancelIfActive || false}
            onChange={(v) => updateConfig('cancelIfActive', v)}
            label="Отменить если пользователь активен"
            description="Не отправлять если был в боте недавно"
            icon={<Timer className="w-4 h-4" />}
          />
        </div>
      );

    // Установить значение
    case 'set_field':
      return (
        <div className="space-y-4">
          <ConfigInfo type="info">
            Сохранит значение для пользователя. Можно использовать в условиях и сообщениях.
          </ConfigInfo>

          <ConfigField
            label="Название поля"
            description="Как назвать это значение"
            example="user.name, user.phone, user.level"
            required
          >
            <ConfigTextInput
              value={config.field || ''}
              onChange={(v) => updateConfig('field', v)}
              placeholder="user.name"
            />
          </ConfigField>

          <ConfigField
            label="Значение"
            description="Что сохранить"
            tip="Можно использовать переменные: {first_name}, {user_id}"
          >
            <ConfigTextInput
              value={config.value || ''}
              onChange={(v) => updateConfig('value', v)}
              placeholder="Введите значение"
              showVariables
            />
          </ConfigField>

          <ConfigInfo type="tip">
            Потом используйте {'{user.name}'} в сообщениях для персонализации.
          </ConfigInfo>
        </div>
      );

    // Изменить значение
    case 'change_field':
      return (
        <div className="space-y-4">
          <ConfigInfo type="info">
            Добавит или отнимет от числового значения.
          </ConfigInfo>

          <ConfigField
            label="Название поля"
            description="Какое значение изменить"
            example="user.balance"
            required
          >
            <ConfigTextInput
              value={config.field || ''}
              onChange={(v) => updateConfig('field', v)}
              placeholder="user.balance"
            />
          </ConfigField>

          <ConfigField
            label="Операция"
            description="Что сделать с числом"
          >
            <ConfigSelect
              value={config.operation || 'add'}
              onChange={(v) => updateConfig('operation', v)}
              options={[
                { value: 'add', label: 'Добавить', description: '+' },
                { value: 'subtract', label: 'Отнять', description: '−' },
                { value: 'multiply', label: 'Умножить', description: '×' },
                { value: 'divide', label: 'Разделить', description: '÷' },
              ]}
            />
          </ConfigField>

          <ConfigField
            label="На сколько"
            description="Число для операции"
          >
            <ConfigNumber
              value={config.amount || 1}
              onChange={(v) => updateConfig('amount', v)}
              min={-10000}
              max={10000}
              presets={[
                { value: 1, label: '1' },
                { value: 5, label: '5' },
                { value: 10, label: '10' },
                { value: 100, label: '100' },
              ]}
            />
          </ConfigField>
        </div>
      );

    // Добавить в список
    case 'append_to_list':
      return (
        <div className="space-y-4">
          <ConfigInfo type="info">
            Добавит элемент в список (массив). Полезно для истории покупок, списка действий.
          </ConfigInfo>

          <ConfigField
            label="Название списка"
            description="Куда добавить элемент"
            example="user.purchases"
            required
          >
            <ConfigTextInput
              value={config.field || ''}
              onChange={(v) => updateConfig('field', v)}
              placeholder="user.purchases"
            />
          </ConfigField>

          <ConfigField
            label="Что добавить"
            description="Новый элемент списка"
          >
            <ConfigTextInput
              value={config.value || ''}
              onChange={(v) => updateConfig('value', v)}
              placeholder="Название товара"
              showVariables
            />
          </ConfigField>

          <ConfigToggle
            checked={config.unique || false}
            onChange={(v) => updateConfig('unique', v)}
            label="Только уникальные значения"
            description="Не добавлять если уже есть"
            icon={<CheckCircle className="w-4 h-4" />}
          />
        </div>
      );

    // Очистить поле
    case 'clear_field':
      return (
        <div className="space-y-4">
          <ConfigInfo type="warning">
            Удалит сохранённое значение. Это действие нельзя отменить.
          </ConfigInfo>

          <ConfigField
            label="Какое поле очистить"
            description="Название значения для удаления"
            example="user.temp_data"
            required
          >
            <ConfigTextInput
              value={config.field || ''}
              onChange={(v) => updateConfig('field', v)}
              placeholder="user.temp_data"
            />
          </ConfigField>
        </div>
      );

    // AI Response
    case 'ai_response':
      const AI_PROMPT_TEMPLATES = [
        {
          id: 'seller',
          name: '🛒 Продавец',
          description: 'Помогает с покупками и консультирует',
          prompt: `Ты — опытный консультант интернет-магазина. Твоя задача:
- Помогать клиентам с выбором товаров
- Отвечать на вопросы о характеристиках, ценах, доставке
- Быть вежливым и профессиональным
- Предлагать дополнительные товары, когда это уместно
- Убеждать, но не навязывать

Стиль: дружелюбный, профессиональный, без лишней воды.
Если не знаешь ответ — честно скажи и предложи связаться с менеджером.`
        },
        {
          id: 'support',
          name: '🎧 Поддержка',
          description: 'Решает проблемы и отвечает на вопросы',
          prompt: `Ты — специалист службы поддержки. Твоя задача:
- Помогать пользователям решать проблемы
- Объяснять сложные вещи простым языком
- Быть терпеливым и понимающим
- Давать пошаговые инструкции
- Извиняться за неудобства, когда это уместно

Стиль: спокойный, профессиональный, эмпатичный.
Всегда спрашивай, решена ли проблема, и чем ещё можешь помочь.`
        },
        {
          id: 'informer',
          name: '📚 Информатор',
          description: 'Предоставляет информацию и факты',
          prompt: `Ты — информационный ассистент. Твоя задача:
- Давать точную и полезную информацию
- Отвечать кратко и по существу
- Структурировать ответы для удобного чтения
- Использовать списки и пункты
- Указывать на важные детали

Стиль: нейтральный, информативный, без эмоций.
Если информация может быть устаревшей — предупреди об этом.`
        },
        {
          id: 'friend',
          name: '😊 Друг',
          description: 'Неформальное общение',
          prompt: `Ты — дружелюбный собеседник. Твоя задача:
- Общаться неформально и тепло
- Использовать эмодзи где уместно
- Шутить и поддерживать позитивный настрой
- Проявлять интерес к собеседнику
- Быть понимающим и поддерживающим

Стиль: дружеский, тёплый, с юмором.
Не будь навязчивым, уважай личные границы.`
        },
        {
          id: 'expert',
          name: '🎓 Эксперт',
          description: 'Глубокие знания в области',
          prompt: `Ты — эксперт в своей области. Твоя задача:
- Давать профессиональные и глубокие ответы
- Объяснять концепции и терминологию
- Приводить примеры и аналогии
- Ссылаться на best practices
- Предостерегать от типичных ошибок

Стиль: экспертный, но доступный для понимания.
Если вопрос выходит за рамки твоей экспертизы — честно скажи об этом.`
        }
      ];

      return (
        <div className="space-y-4">
          <ConfigInfo type="info">
            Бот использует ИИ для генерации ответа на основе контекста разговора.
          </ConfigInfo>

          {/* Шаблоны промптов */}
          <ConfigField
            label="Готовые шаблоны"
            description="Выберите роль для ИИ-ассистента"
          >
            <div className="grid grid-cols-2 gap-2">
              {AI_PROMPT_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => updateConfig('systemPrompt', template.prompt)}
                  className={`p-3 rounded-lg border text-left transition-all hover:scale-[1.02] ${
                    config.systemPrompt === template.prompt
                      ? 'border-primary bg-primary/10 ring-1 ring-primary'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="font-medium text-sm">{template.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{template.description}</div>
                </button>
              ))}
            </div>
          </ConfigField>

          <ConfigField
            label="Системный промпт"
            description="Инструкции для ИИ: как отвечать, какой стиль"
            example="Ты — дружелюбный ассистент магазина..."
            required
          >
            <div className="relative">
              <textarea
                value={config.systemPrompt || ''}
                onChange={(e) => updateConfig('systemPrompt', e.target.value)}
                placeholder="Ты — полезный ассистент. Отвечай кратко и по делу."
                className="w-full min-h-[120px] rounded-lg border border-border bg-background px-3 py-2 text-sm resize-y pr-10"
              />
              {config.systemPrompt && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(config.systemPrompt);
                    toast({ title: 'Скопировано!', description: 'Промпт скопирован в буфер обмена' });
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-muted transition-colors"
                  title="Скопировать промпт"
                >
                  <Copy className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </ConfigField>

          <ConfigField
            label="Модель ИИ"
            description="Какую модель использовать"
          >
            <ConfigSelect
              value={config.model || 'gemini-flash'}
              onChange={(v) => updateConfig('model', v)}
              options={[
                { value: 'gemini-flash', label: '⚡ Gemini Flash', description: 'Быстрый, для простых задач' },
                { value: 'gemini-pro', label: '🧠 Gemini Pro', description: 'Умнее, для сложных задач' },
                { value: 'gpt-4', label: '🚀 GPT-4', description: 'Самый умный' },
              ]}
            />
          </ConfigField>

          <ConfigField
            label="Максимум токенов"
            description="Ограничение длины ответа"
          >
            <ConfigNumber
              value={config.maxTokens || 500}
              onChange={(v) => updateConfig('maxTokens', v)}
              min={50}
              max={4000}
              presets={[
                { value: 150, label: 'Короткий' },
                { value: 500, label: 'Средний' },
                { value: 1500, label: 'Длинный' },
              ]}
            />
          </ConfigField>

          <ConfigToggle
            checked={config.includeHistory || false}
            onChange={(v) => updateConfig('includeHistory', v)}
            label="Учитывать историю"
            description="Передавать предыдущие сообщения для контекста"
            icon={<Sparkles className="w-4 h-4" />}
          />

          <ConfigInfo type="tip">
            Хороший промпт включает: роль ИИ, стиль общения, что можно/нельзя делать, примеры ответов.
          </ConfigInfo>
        </div>
      );

    // HTTP Request
    case 'http_request':
      // Import HttpTestPanel dynamically to avoid circular deps
      const HttpTestPanelLazy = require('./HttpTestPanel').HttpTestPanel;
      
      return (
        <div className="space-y-4">
          <ConfigInfo type="warning">
            Внешний API запрос. Убедитесь, что API доступен и настроен правильно.
          </ConfigInfo>

          <ConfigField
            label="URL адрес"
            description="Адрес API для запроса"
            example="https://api.example.com/data"
            required
          >
            <ConfigTextInput
              value={config.url || ''}
              onChange={(v) => updateConfig('url', v)}
              placeholder="https://api.example.com/endpoint"
            />
          </ConfigField>

          <ConfigField
            label="Метод запроса"
            description="Тип HTTP запроса"
          >
            <div className="flex gap-1">
              {['GET', 'POST', 'PUT', 'DELETE'].map((m) => (
                <button
                  key={m}
                  onClick={() => updateConfig('method', m)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    (config.method || 'GET') === m
                      ? m === 'GET' ? 'bg-green-500/20 text-green-500 ring-1 ring-green-500/50' :
                        m === 'POST' ? 'bg-blue-500/20 text-blue-500 ring-1 ring-blue-500/50' :
                        m === 'PUT' ? 'bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/50' :
                        'bg-red-500/20 text-red-500 ring-1 ring-red-500/50'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </ConfigField>

          <ConfigField
            label="Заголовки (JSON)"
            description="Дополнительные заголовки запроса"
            example='{"Authorization": "Bearer token"}'
          >
            <textarea
              value={config.headers || ''}
              onChange={(e) => updateConfig('headers', e.target.value)}
              placeholder='{"Content-Type": "application/json"}'
              className="w-full min-h-[60px] rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono resize-y"
            />
          </ConfigField>

          {(config.method === 'POST' || config.method === 'PUT' || config.method === 'PATCH') && (
            <ConfigField
              label="Тело запроса (JSON)"
              description="Данные для отправки"
            >
              <textarea
                value={config.body || ''}
                onChange={(e) => updateConfig('body', e.target.value)}
                placeholder='{"key": "value"}'
                className="w-full min-h-[80px] rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono resize-y"
              />
            </ConfigField>
          )}

          <ConfigField
            label="Сохранить результат в"
            description="Название переменной для ответа"
          >
            <ConfigTextInput
              value={config.responseField || ''}
              onChange={(v) => updateConfig('responseField', v)}
              placeholder="api_response"
            />
          </ConfigField>

          <ConfigField
            label="Таймаут (сек)"
            description="Максимальное время ожидания"
          >
            <ConfigNumber
              value={config.timeout || 30}
              onChange={(v) => updateConfig('timeout', v)}
              min={5}
              max={120}
              presets={[
                { value: 10, label: '10 сек' },
                { value: 30, label: '30 сек' },
                { value: 60, label: '1 мин' },
              ]}
            />
          </ConfigField>

          {/* HTTP Test Panel */}
          <HttpTestPanelLazy
            url={config.url || ''}
            method={config.method || 'GET'}
            headers={config.headers}
            body={config.body}
            timeout={config.timeout || 30}
          />

          <ConfigInfo type="tip">
            Используйте {'{переменные}'} в URL, заголовках и теле запроса для подстановки данных пользователя.
          </ConfigInfo>
        </div>
      );

    // JSON Parse
    case 'json_parse':
      return (
        <div className="space-y-4">
          <ConfigInfo type="info">
            Извлекает данные из JSON-ответа API или другого источника по заданному пути.
          </ConfigInfo>

          <ConfigField
            label="Исходные данные"
            description="Переменная с JSON для парсинга"
            example="api_response"
            required
          >
            <ConfigTextInput
              value={config.sourceField || ''}
              onChange={(v) => updateConfig('sourceField', v)}
              placeholder="api_response"
            />
          </ConfigField>

          <ConfigField
            label="Путь к данным"
            description="JSONPath или путь через точку к нужному значению"
            example="data.users[0].name"
            required
          >
            <ConfigTextInput
              value={config.jsonPath || ''}
              onChange={(v) => updateConfig('jsonPath', v)}
              placeholder="data.result.value"
            />
          </ConfigField>

          <ConfigField
            label="Сохранить в"
            description="Название переменной для результата"
            required
          >
            <ConfigTextInput
              value={config.targetField || ''}
              onChange={(v) => updateConfig('targetField', v)}
              placeholder="parsed_value"
            />
          </ConfigField>

          <ConfigField
            label="Значение по умолчанию"
            description="Если путь не найден — использовать это значение"
          >
            <ConfigTextInput
              value={config.defaultValue || ''}
              onChange={(v) => updateConfig('defaultValue', v)}
              placeholder="Не найдено"
            />
          </ConfigField>

          <ConfigToggle
            checked={config.parseNumbers || false}
            onChange={(v) => updateConfig('parseNumbers', v)}
            label="Парсить числа"
            description="Преобразовывать строки в числа если возможно"
          />

          <ConfigInfo type="tip">
            Примеры путей: <code>data.name</code>, <code>items[0]</code>, <code>user.addresses[1].city</code>
          </ConfigInfo>
        </div>
      );

    // Format Text
    case 'format_text':
      return (
        <div className="space-y-4">
          <ConfigInfo type="info">
            Создаёт текст по шаблону с подстановкой переменных и форматированием.
          </ConfigInfo>

          <ConfigField
            label="Шаблон текста"
            description="Используйте {переменная} для подстановки значений"
            example="Привет, {user.name}! Ваш баланс: {user.balance}₽"
            required
          >
            <textarea
              value={config.template || ''}
              onChange={(e) => updateConfig('template', e.target.value)}
              placeholder="Привет, {first_name}! 
              
Ваш заказ №{order_id} на сумму {total}₽ оформлен.

Спасибо за покупку!"
              className="w-full min-h-[120px] rounded-lg border border-border bg-background px-3 py-2 text-sm resize-y"
            />
          </ConfigField>

          <ConfigField
            label="Сохранить результат в"
            description="Переменная для сформированного текста"
          >
            <ConfigTextInput
              value={config.targetField || ''}
              onChange={(v) => updateConfig('targetField', v)}
              placeholder="formatted_message"
            />
          </ConfigField>

          <ConfigField
            label="Формат чисел"
            description="Как форматировать числа в шаблоне"
          >
            <ConfigSelect
              value={config.numberFormat || 'default'}
              onChange={(v) => updateConfig('numberFormat', v)}
              options={[
                { value: 'default', label: 'Как есть', description: '1234.56' },
                { value: 'spaces', label: 'С пробелами', description: '1 234.56' },
                { value: 'round', label: 'Округлить', description: '1235' },
                { value: 'currency', label: 'Валюта', description: '1 234,56 ₽' },
              ]}
            />
          </ConfigField>

          <ConfigField
            label="Формат даты"
            description="Как форматировать даты"
          >
            <ConfigSelect
              value={config.dateFormat || 'short'}
              onChange={(v) => updateConfig('dateFormat', v)}
              options={[
                { value: 'short', label: 'Короткий', description: '15.01.2024' },
                { value: 'long', label: 'Полный', description: '15 января 2024' },
                { value: 'relative', label: 'Относительный', description: 'вчера, 2 дня назад' },
                { value: 'time', label: 'Со временем', description: '15.01.2024 14:30' },
              ]}
            />
          </ConfigField>

          <ConfigToggle
            checked={config.trimEmpty || true}
            onChange={(v) => updateConfig('trimEmpty', v)}
            label="Убирать пустые строки"
            description="Удалять строки с несуществующими переменными"
          />

          <ConfigInfo type="tip">
            Доступные переменные: {'{first_name}'}, {'{last_name}'}, {'{user_id}'}, {'{username}'}, а также все сохранённые поля.
          </ConfigInfo>
        </div>
      );

    // Split Test (A/B)
    case 'split_test':
      return (
        <div className="space-y-4">
          <ConfigInfo type="info">
            Разделяет пользователей на группы для A/B тестирования разных вариантов.
          </ConfigInfo>

          <ConfigField
            label="Название теста"
            description="Уникальное имя для идентификации теста"
            example="welcome_message_v2"
            required
          >
            <ConfigTextInput
              value={config.testName || ''}
              onChange={(v) => updateConfig('testName', v)}
              placeholder="welcome_test"
            />
          </ConfigField>

          <ConfigField
            label="Количество вариантов"
            description="Сколько веток тестирования (2-5)"
          >
            <ConfigNumber
              value={config.variants || 2}
              onChange={(v) => updateConfig('variants', Math.max(2, Math.min(5, v)))}
              min={2}
              max={5}
              presets={[
                { value: 2, label: 'A/B' },
                { value: 3, label: 'A/B/C' },
                { value: 4, label: '4 варианта' },
              ]}
            />
          </ConfigField>

          <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-sm font-medium">Распределение трафика</p>
            {Array.from({ length: config.variants || 2 }).map((_, i) => {
              const variantName = String.fromCharCode(65 + i); // A, B, C...
              const weights = config.weights || [50, 50];
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                    {variantName}
                  </span>
                  <div className="flex-1">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={weights[i] || Math.floor(100 / (config.variants || 2))}
                      onChange={(e) => {
                        const newWeights = [...(config.weights || Array((config.variants || 2)).fill(Math.floor(100 / (config.variants || 2))))];
                        newWeights[i] = parseInt(e.target.value);
                        updateConfig('weights', newWeights);
                      }}
                      className="w-full accent-primary"
                    />
                  </div>
                  <span className="w-12 text-right text-sm font-mono">
                    {weights[i] || Math.floor(100 / (config.variants || 2))}%
                  </span>
                </div>
              );
            })}
            <p className="text-xs text-muted-foreground">
              Всего: {(config.weights || [50, 50]).reduce((a: number, b: number) => a + b, 0)}%
              {(config.weights || [50, 50]).reduce((a: number, b: number) => a + b, 0) !== 100 && 
                <span className="text-amber-500 ml-2">⚠ Сумма должна быть 100%</span>
              }
            </p>
          </div>

          <ConfigToggle
            checked={config.persistent || true}
            onChange={(v) => updateConfig('persistent', v)}
            label="Запомнить группу пользователя"
            description="Пользователь всегда попадает в одну и ту же группу"
          />

          <ConfigToggle
            checked={config.trackConversions || false}
            onChange={(v) => updateConfig('trackConversions', v)}
            label="Отслеживать конверсии"
            description="Считать успешные действия для каждого варианта"
          />

          <ConfigField
            label="Сохранить вариант в"
            description="Переменная с названием выбранной группы (A, B, C...)"
          >
            <ConfigTextInput
              value={config.resultField || ''}
              onChange={(v) => updateConfig('resultField', v)}
              placeholder="test_group"
            />
          </ConfigField>

          <ConfigInfo type="tip">
            После теста подключите разные действия к каждому выходу (A, B, C...) для разных сценариев.
          </ConfigInfo>
        </div>
      );

    default:
      return (
        <ConfigInfo type="info">
          Настройки для этого действия пока в разработке. Скоро будут доступны!
        </ConfigInfo>
      );
  }
}
