export type ActionType =
  // Basic
  | 'show_text'
  | 'navigate_menu'
  | 'open_url'
  | 'delay'
  | 'typing_indicator'
  // Data
  | 'set_field'
  | 'change_field'
  | 'append_to_list'
  | 'clear_field'
  | 'add_tag'
  | 'remove_tag'
  // Logic
  | 'if_else'
  | 'check_subscription'
  | 'check_role'
  | 'check_value'
  | 'wait_response'
  | 'keyword_trigger'
  | 'no_response'
  | 'wrong_response'
  // Shop
  | 'add_to_cart'
  | 'update_quantity'
  | 'show_product'
  | 'remove_from_cart'
  | 'check_stock'
  | 'apply_promo'
  | 'show_cart'
  | 'clear_cart'
  | 'process_payment'
  // Gamification
  | 'random_result'
  | 'weighted_random'
  | 'lottery'
  | 'leaderboard'
  | 'modify_points'
  | 'spam_protection'
  // Interactive
  | 'request_input'
  | 'quiz'
  // Events
  | 'on_payment_success'
  | 'on_first_visit'
  | 'on_timer'
  | 'on_threshold'
  // Automation
  | 'send_notification'
  | 'schedule_message'
  | 'broadcast'
  // AI & Advanced
  | 'ai_response'
  | 'http_request'
  | 'json_parse'
  | 'format_text'
  | 'split_test';

export interface BotAction {
  id: string;
  type: ActionType;
  order: number;
  config: Record<string, any>;
}

export interface ActionNodeOutcome {
  id: string;
  targetId?: string;
  targetType?: 'action' | 'menu';
}

export interface BotActionNode {
  id: string;
  type: ActionType;
  config: Record<string, any>;
  position: { x: number; y: number };
  nextNodeId?: string;
  nextNodeType?: 'action' | 'menu';
  // For multi-output actions like random_result
  outcomes?: ActionNodeOutcome[];
}

export interface BotButton {
  id: string;
  text: string;
  row: number;
  order: number;
  actions: BotAction[];
  targetMenuId?: string;
  targetActionId?: string;
  labelPosition?: number;
}

export interface BotMenu {
  id: string;
  name: string;
  description?: string;
  messageText: string;
  mediaUrl?: string;
  buttons: BotButton[];
  parentId?: string;
  order: number;
  position?: { x: number; y: number };
  keywordTriggers?: string[];
  settings?: {
    waitForResponse?: boolean;
    responseTimeout?: number;
    timeoutAction?: string;
    wrongResponseAction?: string;
  };
}

export interface BotProject {
  id: string;
  name: string;
  description?: string;
  template?: 'blank' | 'custom' | 'shop' | 'quiz' | 'support' | 'funnel';
  menus: BotMenu[];
  actionNodes?: BotActionNode[];
  rootMenuId: string;
  telegramBotToken?: string;
  telegramBotUsername?: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'testing' | 'exported' | 'completed' | 'active' | 'archived';
  thumbnail?: string;
  globalSettings?: {
    defaultDelay?: number;
    welcomeMessage?: string;
    fallbackMessage?: string;
  };
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'basic' | 'shop' | 'quiz' | 'support' | 'funnel';
  menus: Omit<BotMenu, 'id'>[];
}

export const MAX_BUTTONS_PER_ROW = 6;
export const MAX_ROWS = 99;
export const MAX_MENUS_PER_PROJECT = 50;
export const MAX_BUTTONS_PER_MENU = 30;
export const MAX_ACTION_NODES_PER_PROJECT = 100;

export const ACTION_CATEGORIES = {
  basic: {
    name: 'Базовые',
    icon: 'Zap',
    color: 'blue',
    actions: ['show_text', 'navigate_menu', 'open_url', 'delay', 'typing_indicator'],
  },
  data: {
    name: 'Данные',
    icon: 'Database',
    color: 'violet',
    actions: ['set_field', 'change_field', 'append_to_list', 'clear_field', 'add_tag', 'remove_tag'],
  },
  logic: {
    name: 'Логика',
    icon: 'GitBranch',
    color: 'amber',
    actions: ['if_else', 'check_subscription', 'check_role', 'check_value', 'wait_response', 'keyword_trigger', 'no_response', 'wrong_response'],
  },
  shop: {
    name: 'Магазин',
    icon: 'ShoppingCart',
    color: 'emerald',
    actions: ['add_to_cart', 'update_quantity', 'show_product', 'remove_from_cart', 'check_stock', 'apply_promo', 'show_cart', 'clear_cart', 'process_payment'],
  },
  gamification: {
    name: 'Геймификация',
    icon: 'Trophy',
    color: 'pink',
    actions: ['random_result', 'weighted_random', 'lottery', 'leaderboard', 'modify_points', 'spam_protection'],
  },
  interactive: {
    name: 'Интерактив',
    icon: 'MessageCircle',
    color: 'cyan',
    actions: ['request_input', 'quiz'],
  },
  events: {
    name: 'События',
    icon: 'Bell',
    color: 'orange',
    actions: ['on_payment_success', 'on_first_visit', 'on_timer', 'on_threshold'],
  },
  automation: {
    name: 'Автоматизация',
    icon: 'Send',
    color: 'indigo',
    actions: ['send_notification', 'schedule_message', 'broadcast'],
  },
  ai: {
    name: 'AI & Интеграции',
    icon: 'Sparkles',
    color: 'fuchsia',
    actions: ['ai_response', 'http_request', 'json_parse', 'format_text', 'split_test'],
  },
} as const;

export const ACTION_INFO: Record<ActionType, { name: string; description: string; icon: string; category: keyof typeof ACTION_CATEGORIES }> = {
  // Basic
  show_text: { name: 'Показать текст', description: 'Отправить сообщение', icon: 'MessageSquare', category: 'basic' },
  navigate_menu: { name: 'Перейти в меню', description: 'Навигация по боту', icon: 'ArrowRight', category: 'basic' },
  open_url: { name: 'Открыть ссылку', description: 'Внешняя ссылка', icon: 'ExternalLink', category: 'basic' },
  delay: { name: 'Задержка', description: 'Пауза между сообщениями', icon: 'Clock', category: 'basic' },
  typing_indicator: { name: 'Печатает...', description: 'Показать индикатор набора', icon: 'MoreHorizontal', category: 'basic' },
  // Data
  set_field: { name: 'Установить значение', description: 'Сохранить данные', icon: 'Edit3', category: 'data' },
  change_field: { name: 'Изменить значение', description: '+/- к числу', icon: 'Calculator', category: 'data' },
  append_to_list: { name: 'Добавить в список', description: 'Расширить массив', icon: 'ListPlus', category: 'data' },
  clear_field: { name: 'Очистить поле', description: 'Удалить значение', icon: 'Eraser', category: 'data' },
  add_tag: { name: 'Добавить тег', description: 'Пометить пользователя', icon: 'TagIcon', category: 'data' },
  remove_tag: { name: 'Удалить тег', description: 'Убрать метку', icon: 'TagOff', category: 'data' },
  // Logic
  if_else: { name: 'Условие', description: 'Ветвление логики', icon: 'GitBranch', category: 'logic' },
  check_subscription: { name: 'Проверка подписки', description: 'На канал/чат', icon: 'UserCheck', category: 'logic' },
  check_role: { name: 'Проверка роли', description: 'Права пользователя', icon: 'ShieldCheck', category: 'logic' },
  check_value: { name: 'Проверка значения', description: 'Сравнить данные', icon: 'CircleEqual', category: 'logic' },
  wait_response: { name: 'Ждать ответ', description: 'Ожидание ввода', icon: 'MessageCircleQuestion', category: 'logic' },
  keyword_trigger: { name: 'Ключевые слова', description: 'Триггер по словам', icon: 'TextSearch', category: 'logic' },
  no_response: { name: 'Нет ответа', description: 'Если молчит', icon: 'MessageCircleOff', category: 'logic' },
  wrong_response: { name: 'Неверный ответ', description: 'Если ошибся', icon: 'MessageCircleX', category: 'logic' },
  // Shop
  add_to_cart: { name: 'В корзину', description: 'Добавить товар', icon: 'ShoppingCart', category: 'shop' },
  update_quantity: { name: 'Изменить кол-во', description: 'Товар в корзине', icon: 'ListOrdered', category: 'shop' },
  show_product: { name: 'Показать товар', description: 'Карточка товара', icon: 'Package', category: 'shop' },
  remove_from_cart: { name: 'Удалить из корзины', description: 'Убрать товар', icon: 'PackageMinus', category: 'shop' },
  check_stock: { name: 'Проверить остатки', description: 'Наличие товара', icon: 'PackageSearch', category: 'shop' },
  apply_promo: { name: 'Применить промокод', description: 'Скидка', icon: 'TicketPercent', category: 'shop' },
  show_cart: { name: 'Показать корзину', description: 'Текущий заказ', icon: 'ShoppingBag', category: 'shop' },
  clear_cart: { name: 'Очистить корзину', description: 'Сбросить заказ', icon: 'Trash2', category: 'shop' },
  process_payment: { name: 'Оплата', description: 'Провести платёж', icon: 'CreditCard', category: 'shop' },
  // Gamification
  random_result: { name: 'Случайный результат', description: 'Рандом', icon: 'Dices', category: 'gamification' },
  weighted_random: { name: 'Взвешенный рандом', description: 'С весами', icon: 'Scale', category: 'gamification' },
  lottery: { name: 'Лотерея', description: 'Розыгрыш', icon: 'Ticket', category: 'gamification' },
  leaderboard: { name: 'Таблица лидеров', description: 'Рейтинг', icon: 'Trophy', category: 'gamification' },
  modify_points: { name: 'Изменить баллы', description: 'Очки пользователя', icon: 'Gem', category: 'gamification' },
  spam_protection: { name: 'Антиспам', description: 'Защита от спама', icon: 'ShieldAlert', category: 'gamification' },
  // Interactive
  request_input: { name: 'Запросить ввод', description: 'Получить данные', icon: 'FormInput', category: 'interactive' },
  quiz: { name: 'Квиз', description: 'Вопросы с ответами', icon: 'CircleHelp', category: 'interactive' },
  // Events
  on_payment_success: { name: 'После оплаты', description: 'Событие платежа', icon: 'BadgeCheck', category: 'events' },
  on_first_visit: { name: 'Первый визит', description: 'Новый пользователь', icon: 'UserRoundPlus', category: 'events' },
  on_timer: { name: 'По таймеру', description: 'Отложенное', icon: 'Hourglass', category: 'events' },
  on_threshold: { name: 'По порогу', description: 'При достижении', icon: 'Goal', category: 'events' },
  // Automation
  send_notification: { name: 'Уведомление', description: 'Push в Telegram', icon: 'BellRing', category: 'automation' },
  schedule_message: { name: 'Таймер', description: 'Отложенный запуск', icon: 'CalendarClock', category: 'automation' },
  broadcast: { name: 'Рассылка', description: 'Массовая отправка', icon: 'Megaphone', category: 'automation' },
  // AI & Advanced
  ai_response: { name: 'AI Ответ', description: 'Генерация текста ИИ', icon: 'Sparkles', category: 'ai' },
  http_request: { name: 'HTTP Запрос', description: 'Вызов внешнего API', icon: 'Globe', category: 'ai' },
  json_parse: { name: 'Парсинг JSON', description: 'Извлечь данные', icon: 'Braces', category: 'ai' },
  format_text: { name: 'Форматирование', description: 'Шаблон текста', icon: 'FileType', category: 'ai' },
  split_test: { name: 'A/B Тест', description: 'Сплит-тестирование', icon: 'FlaskConical', category: 'ai' },
};

// Category colors for styling
export const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
  basic: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-600 dark:text-blue-400',
    gradient: 'from-blue-500 to-cyan-500',
  },
  data: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    text: 'text-violet-600 dark:text-violet-400',
    gradient: 'from-violet-500 to-purple-500',
  },
  logic: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-600 dark:text-amber-400',
    gradient: 'from-amber-500 to-orange-500',
  },
  shop: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    gradient: 'from-emerald-500 to-green-500',
  },
  gamification: {
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30',
    text: 'text-pink-600 dark:text-pink-400',
    gradient: 'from-pink-500 to-rose-500',
  },
  interactive: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-600 dark:text-cyan-400',
    gradient: 'from-cyan-500 to-teal-500',
  },
  events: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-600 dark:text-orange-400',
    gradient: 'from-orange-500 to-red-500',
  },
  automation: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    text: 'text-indigo-600 dark:text-indigo-400',
    gradient: 'from-indigo-500 to-blue-500',
  },
  ai: {
    bg: 'bg-fuchsia-500/10',
    border: 'border-fuchsia-500/30',
    text: 'text-fuchsia-600 dark:text-fuchsia-400',
    gradient: 'from-fuchsia-500 to-purple-500',
  },
};
