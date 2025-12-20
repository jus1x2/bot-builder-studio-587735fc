import { ReactNode } from 'react';
import { 
  MessageSquare, Clock, ArrowRight, Link, Edit3, Tag, GitBranch, 
  ShoppingCart, Trophy, Bell, Send, HelpCircle, Star, Package,
  Users, Search, Timer, Target, Gift, Shield, CheckCircle, Hash
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

    default:
      return (
        <ConfigInfo type="info">
          Настройки для этого действия пока в разработке. Скоро будут доступны!
        </ConfigInfo>
      );
  }
}
