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
  | 'broadcast';

export interface BotAction {
  id: string;
  type: ActionType;
  order: number;
  config: Record<string, any>;
}

export interface BotActionNode {
  id: string;
  type: ActionType;
  config: Record<string, any>;
  position: { x: number; y: number };
  nextNodeId?: string;
  nextNodeType?: 'action' | 'menu';
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
    actions: ['show_text', 'navigate_menu', 'open_url', 'delay', 'typing_indicator'],
  },
  data: {
    name: 'Данные',
    icon: 'Database',
    actions: ['set_field', 'change_field', 'append_to_list', 'clear_field', 'add_tag', 'remove_tag'],
  },
  logic: {
    name: 'Логика',
    icon: 'GitBranch',
    actions: ['if_else', 'check_subscription', 'check_role', 'check_value', 'wait_response', 'keyword_trigger', 'no_response', 'wrong_response'],
  },
  shop: {
    name: 'Магазин',
    icon: 'ShoppingCart',
    actions: ['add_to_cart', 'update_quantity', 'show_product', 'remove_from_cart', 'check_stock', 'apply_promo', 'show_cart', 'clear_cart', 'process_payment'],
  },
  gamification: {
    name: 'Геймификация',
    icon: 'Trophy',
    actions: ['random_result', 'weighted_random', 'lottery', 'leaderboard', 'modify_points', 'spam_protection'],
  },
  interactive: {
    name: 'Интерактив',
    icon: 'MessageCircle',
    actions: ['request_input', 'quiz'],
  },
  events: {
    name: 'События',
    icon: 'Bell',
    actions: ['on_payment_success', 'on_first_visit', 'on_timer', 'on_threshold'],
  },
  automation: {
    name: 'Автоматизация',
    icon: 'Send',
    actions: ['send_notification', 'schedule_message', 'broadcast'],
  },
} as const;

export const ACTION_INFO: Record<ActionType, { name: string; description: string; icon: string }> = {
  show_text: { name: 'Показать текст', description: 'Отправить сообщение', icon: 'MessageSquare' },
  navigate_menu: { name: 'Перейти в меню', description: 'Навигация по боту', icon: 'ArrowRight' },
  open_url: { name: 'Открыть ссылку', description: 'Внешняя ссылка', icon: 'ExternalLink' },
  delay: { name: 'Задержка', description: 'Пауза между сообщениями', icon: 'Clock' },
  typing_indicator: { name: 'Печатает...', description: 'Показать индикатор набора', icon: 'MoreHorizontal' },
  set_field: { name: 'Установить значение', description: 'Сохранить данные', icon: 'Edit3' },
  change_field: { name: 'Изменить значение', description: '+/- к числу', icon: 'Plus' },
  append_to_list: { name: 'Добавить в список', description: 'Расширить массив', icon: 'List' },
  clear_field: { name: 'Очистить поле', description: 'Удалить значение', icon: 'Trash2' },
  add_tag: { name: 'Добавить тег', description: 'Пометить пользователя', icon: 'Tag' },
  remove_tag: { name: 'Удалить тег', description: 'Убрать метку', icon: 'Tag' },
  if_else: { name: 'Условие', description: 'Ветвление логики', icon: 'GitBranch' },
  check_subscription: { name: 'Проверка подписки', description: 'На канал/чат', icon: 'UserCheck' },
  check_role: { name: 'Проверка роли', description: 'Права пользователя', icon: 'Shield' },
  check_value: { name: 'Проверка значения', description: 'Сравнить данные', icon: 'CheckCircle' },
  wait_response: { name: 'Ждать ответ', description: 'Ожидание ввода', icon: 'MessageCircle' },
  keyword_trigger: { name: 'Ключевые слова', description: 'Триггер по словам', icon: 'Search' },
  no_response: { name: 'Нет ответа', description: 'Если молчит', icon: 'Clock' },
  wrong_response: { name: 'Неверный ответ', description: 'Если ошибся', icon: 'XCircle' },
  add_to_cart: { name: 'В корзину', description: 'Добавить товар', icon: 'ShoppingCart' },
  update_quantity: { name: 'Изменить кол-во', description: 'Товар в корзине', icon: 'Hash' },
  show_product: { name: 'Показать товар', description: 'Карточка товара', icon: 'Package' },
  remove_from_cart: { name: 'Удалить из корзины', description: 'Убрать товар', icon: 'X' },
  check_stock: { name: 'Проверить остатки', description: 'Наличие товара', icon: 'Archive' },
  apply_promo: { name: 'Применить промокод', description: 'Скидка', icon: 'Percent' },
  show_cart: { name: 'Показать корзину', description: 'Текущий заказ', icon: 'ShoppingBag' },
  clear_cart: { name: 'Очистить корзину', description: 'Сбросить заказ', icon: 'Trash' },
  process_payment: { name: 'Оплата', description: 'Провести платёж', icon: 'CreditCard' },
  random_result: { name: 'Случайный результат', description: 'Рандом', icon: 'Dice1' },
  weighted_random: { name: 'Взвешенный рандом', description: 'С весами', icon: 'Dice3' },
  lottery: { name: 'Лотерея', description: 'Розыгрыш', icon: 'Gift' },
  leaderboard: { name: 'Таблица лидеров', description: 'Рейтинг', icon: 'Trophy' },
  modify_points: { name: 'Изменить баллы', description: 'Очки пользователя', icon: 'Star' },
  spam_protection: { name: 'Антиспам', description: 'Защита от спама', icon: 'Shield' },
  request_input: { name: 'Запросить ввод', description: 'Получить данные', icon: 'Edit' },
  quiz: { name: 'Квиз', description: 'Вопросы с ответами', icon: 'HelpCircle' },
  on_payment_success: { name: 'После оплаты', description: 'Событие платежа', icon: 'CheckCircle' },
  on_first_visit: { name: 'Первый визит', description: 'Новый пользователь', icon: 'UserPlus' },
  on_timer: { name: 'По таймеру', description: 'Отложенное', icon: 'Timer' },
  on_threshold: { name: 'По порогу', description: 'При достижении', icon: 'Target' },
  send_notification: { name: 'Уведомление', description: 'Push в Telegram', icon: 'Bell' },
  schedule_message: { name: 'Запланировать', description: 'Отложенная отправка', icon: 'Calendar' },
  broadcast: { name: 'Рассылка', description: 'Массовая отправка', icon: 'Send' },
};
