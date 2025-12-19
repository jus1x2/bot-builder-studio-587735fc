import { v4 as uuidv4 } from 'uuid';
import { BotMenu, BotButton, BotProject } from '@/types/bot';

const createButton = (text: string, row: number, order: number, targetMenuId?: string): BotButton => ({
  id: uuidv4(),
  text,
  row,
  order,
  actions: targetMenuId ? [{
    id: uuidv4(),
    type: 'navigate_menu',
    order: 0,
    config: { targetMenuId }
  }] : [],
  targetMenuId,
});

const createMenu = (
  name: string,
  messageText: string,
  buttons: Omit<BotButton, 'id' | 'actions'>[],
  parentId?: string,
  position?: { x: number; y: number }
): BotMenu => ({
  id: uuidv4(),
  name,
  messageText,
  buttons: buttons.map(b => ({
    ...b,
    id: uuidv4(),
    actions: [],
  })),
  parentId,
  order: 0,
  position: position || { x: 0, y: 0 },
});

export const createBlankTemplate = (): { menus: BotMenu[]; rootMenuId: string } => {
  const rootMenu = createMenu(
    'Главное меню',
    '👋 Привет! Я ваш бот-помощник.\n\nВыберите действие:',
    [
      { text: '🚀 Начать', row: 0, order: 0 },
      { text: '📋 О боте', row: 0, order: 1 },
      { text: '💬 Помощь', row: 1, order: 0 },
    ]
  );

  return { menus: [rootMenu], rootMenuId: rootMenu.id };
};

export const createShopTemplate = (): { menus: BotMenu[]; rootMenuId: string } => {
  const rootMenu: BotMenu = {
    id: uuidv4(),
    name: 'Главное меню',
    messageText: '🛒 Добро пожаловать в наш магазин!\n\nВыберите категорию или посмотрите специальные предложения.',
    buttons: [],
    order: 0,
    position: { x: 0, y: 0 },
  };

  const catalogMenu: BotMenu = {
    id: uuidv4(),
    name: 'Каталог',
    messageText: '📦 Наш каталог товаров\n\nВыберите категорию:',
    buttons: [],
    parentId: rootMenu.id,
    order: 1,
    position: { x: 350, y: -100 },
  };

  const cartMenu: BotMenu = {
    id: uuidv4(),
    name: 'Корзина',
    messageText: '🛒 Ваша корзина\n\nЗдесь будут отображаться добавленные товары.',
    buttons: [],
    parentId: rootMenu.id,
    order: 2,
    position: { x: 350, y: 100 },
  };

  rootMenu.buttons = [
    createButton('📦 Каталог', 0, 0, catalogMenu.id),
    createButton('🛒 Корзина', 0, 1, cartMenu.id),
    createButton('📞 Контакты', 1, 0),
    createButton('❓ FAQ', 1, 1),
  ];

  catalogMenu.buttons = [
    createButton('👕 Одежда', 0, 0),
    createButton('👟 Обувь', 0, 1),
    createButton('🎒 Аксессуары', 1, 0),
    createButton('⬅️ Назад', 2, 0, rootMenu.id),
  ];

  cartMenu.buttons = [
    createButton('💳 Оформить заказ', 0, 0),
    createButton('🗑️ Очистить', 0, 1),
    createButton('⬅️ Назад', 1, 0, rootMenu.id),
  ];

  return {
    menus: [rootMenu, catalogMenu, cartMenu],
    rootMenuId: rootMenu.id,
  };
};

export const createQuizTemplate = (): { menus: BotMenu[]; rootMenuId: string } => {
  const rootMenu: BotMenu = {
    id: uuidv4(),
    name: 'Начало квиза',
    messageText: '🎯 Добро пожаловать в квиз!\n\nПроверьте свои знания и получите приз!',
    buttons: [],
    order: 0,
    position: { x: 0, y: 0 },
  };

  const q1Menu: BotMenu = {
    id: uuidv4(),
    name: 'Вопрос 1',
    messageText: '❓ Вопрос 1 из 3\n\nКакой язык программирования самый популярный в 2024?',
    buttons: [],
    parentId: rootMenu.id,
    order: 1,
    position: { x: 350, y: 0 },
  };

  const resultMenu: BotMenu = {
    id: uuidv4(),
    name: 'Результат',
    messageText: '🎉 Поздравляем!\n\nВы прошли квиз. Ваш результат: {score} из 3',
    buttons: [],
    parentId: q1Menu.id,
    order: 2,
    position: { x: 700, y: 0 },
  };

  rootMenu.buttons = [
    createButton('🚀 Начать квиз', 0, 0, q1Menu.id),
    createButton('📊 Мои результаты', 1, 0),
    createButton('🏆 Таблица лидеров', 1, 1),
  ];

  q1Menu.buttons = [
    createButton('Python', 0, 0, resultMenu.id),
    createButton('JavaScript', 0, 1, resultMenu.id),
    createButton('Java', 1, 0, resultMenu.id),
    createButton('C++', 1, 1, resultMenu.id),
  ];

  resultMenu.buttons = [
    createButton('🔄 Пройти заново', 0, 0, rootMenu.id),
    createButton('📤 Поделиться', 0, 1),
  ];

  return {
    menus: [rootMenu, q1Menu, resultMenu],
    rootMenuId: rootMenu.id,
  };
};

export const createSupportTemplate = (): { menus: BotMenu[]; rootMenuId: string } => {
  const rootMenu: BotMenu = {
    id: uuidv4(),
    name: 'Главное меню',
    messageText: '👋 Здравствуйте!\n\nЯ бот техподдержки. Чем могу помочь?',
    buttons: [],
    order: 0,
    position: { x: 0, y: 0 },
  };

  const faqMenu: BotMenu = {
    id: uuidv4(),
    name: 'FAQ',
    messageText: '❓ Часто задаваемые вопросы\n\nВыберите тему:',
    buttons: [],
    parentId: rootMenu.id,
    order: 1,
    position: { x: 350, y: -50 },
  };

  const ticketMenu: BotMenu = {
    id: uuidv4(),
    name: 'Создать тикет',
    messageText: '📝 Создание обращения\n\nОпишите вашу проблему, и мы свяжемся с вами в ближайшее время.',
    buttons: [],
    parentId: rootMenu.id,
    order: 2,
    position: { x: 350, y: 100 },
  };

  rootMenu.buttons = [
    createButton('❓ FAQ', 0, 0, faqMenu.id),
    createButton('📝 Создать тикет', 0, 1, ticketMenu.id),
    createButton('📞 Связаться с оператором', 1, 0),
  ];

  faqMenu.buttons = [
    createButton('💳 Оплата', 0, 0),
    createButton('🚚 Доставка', 0, 1),
    createButton('↩️ Возврат', 1, 0),
    createButton('⬅️ Назад', 2, 0, rootMenu.id),
  ];

  ticketMenu.buttons = [
    createButton('⬅️ Назад', 0, 0, rootMenu.id),
  ];

  return {
    menus: [rootMenu, faqMenu, ticketMenu],
    rootMenuId: rootMenu.id,
  };
};

export const createFunnelTemplate = (): { menus: BotMenu[]; rootMenuId: string } => {
  const rootMenu: BotMenu = {
    id: uuidv4(),
    name: 'Приветствие',
    messageText: '🎁 Специальное предложение!\n\nПолучите скидку 20% на первый заказ.',
    buttons: [],
    order: 0,
    position: { x: 0, y: 0 },
  };

  const step1: BotMenu = {
    id: uuidv4(),
    name: 'Шаг 1: Интерес',
    messageText: '✨ Отлично! Расскажу подробнее.\n\nНаш продукт поможет вам...',
    buttons: [],
    parentId: rootMenu.id,
    order: 1,
    position: { x: 350, y: 0 },
  };

  const step2: BotMenu = {
    id: uuidv4(),
    name: 'Шаг 2: Оффер',
    messageText: '💰 Специальная цена только сегодня!\n\nВместо 9999₽ всего 4999₽',
    buttons: [],
    parentId: step1.id,
    order: 2,
    position: { x: 700, y: 0 },
  };

  rootMenu.buttons = [
    createButton('🎁 Хочу скидку!', 0, 0, step1.id),
    createButton('❌ Не интересно', 0, 1),
  ];

  step1.buttons = [
    createButton('💡 Узнать больше', 0, 0, step2.id),
    createButton('⬅️ Назад', 1, 0, rootMenu.id),
  ];

  step2.buttons = [
    createButton('💳 Оплатить', 0, 0),
    createButton('❓ Есть вопрос', 0, 1),
    createButton('⬅️ Назад', 1, 0, step1.id),
  ];

  return {
    menus: [rootMenu, step1, step2],
    rootMenuId: rootMenu.id,
  };
};

export const TEMPLATES = [
  {
    id: 'blank',
    name: 'Пустой проект',
    description: 'Начните с чистого листа',
    icon: 'FileText',
    category: 'basic' as const,
  },
  {
    id: 'shop',
    name: 'Интернет-магазин',
    description: 'Каталог, корзина, оплата',
    icon: 'ShoppingCart',
    category: 'shop' as const,
  },
  {
    id: 'quiz',
    name: 'Квиз-бот',
    description: 'Викторины и опросы',
    icon: 'HelpCircle',
    category: 'quiz' as const,
  },
  {
    id: 'support',
    name: 'Техподдержка',
    description: 'FAQ и тикеты',
    icon: 'Headphones',
    category: 'support' as const,
  },
  {
    id: 'funnel',
    name: 'Воронка продаж',
    description: 'Лид-магнит и конверсия',
    icon: 'TrendingUp',
    category: 'funnel' as const,
  },
];

export function createTemplateProject(
  templateId: string,
  name: string,
  description?: string
): BotProject {
  let template;

  switch (templateId) {
    case 'shop':
      template = createShopTemplate();
      break;
    case 'quiz':
      template = createQuizTemplate();
      break;
    case 'support':
      template = createSupportTemplate();
      break;
    case 'funnel':
      template = createFunnelTemplate();
      break;
    default:
      template = createBlankTemplate();
  }

  return {
    id: uuidv4(),
    name,
    description,
    template: templateId as BotProject['template'],
    menus: template.menus,
    rootMenuId: template.rootMenuId,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'draft',
  };
}
