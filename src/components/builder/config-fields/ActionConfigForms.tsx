import { ReactNode } from 'react';
import { 
  MessageSquare, Clock, ArrowRight, Link, Edit3, Tag, GitBranch, 
  ShoppingCart, Trophy, Bell, Send, HelpCircle, Star, Package,
  Users, Search, Timer, Target, Gift, Shield, CheckCircle, Hash, Trash2
} from 'lucide-react';
import { ActionType, BotMenu } from '@/types/bot';
import { 
  ConfigField, 
  ConfigSelect, 
  ConfigTextInput, 
  ConfigToggle, 
  ConfigNumber, 
  ConfigInfo, 
  ConfigGroup,
  SelectOption 
} from './ConfigField';

// Метаданные для каждого типа действия - понятные для новичков
export interface ActionFormMeta {
  title: string;
  description: string;
  icon: ReactNode;
  category: 'basic' | 'data' | 'logic' | 'shop' | 'gamification' | 'interactive' | 'events' | 'automation';
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
            label="Тип ответа"
            description="Какой формат ожидается"
          >
            <ConfigSelect
              value={config.validationType || 'text'}
              onChange={(v) => updateConfig('validationType', v)}
              options={VALIDATION_TYPE_OPTIONS}
            />
          </ConfigField>

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

          <ConfigField
            label="Если не ответил вовремя"
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

          <ConfigInfo type="tip">
            Ждать ответ полезно для опросов, сбора контактов и обратной связи.
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

    default:
      return (
        <ConfigInfo type="info">
          Настройки для этого действия пока в разработке. Скоро будут доступны!
        </ConfigInfo>
      );
  }
}
