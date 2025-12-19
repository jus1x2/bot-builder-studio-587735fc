import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
    date: number;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    message: {
      message_id: number;
      chat: {
        id: number;
      };
    };
    data: string;
  };
}

interface UserContext {
  first_name: string;
  last_name: string;
  username: string;
  user_id: string;
  date: string;
  time: string;
  [key: string]: string | number;
}

interface BotMenu {
  id: string;
  name: string;
  message_text: string;
  buttons: Array<{
    id: string;
    text: string;
    target_menu_id?: string;
    target_action_id?: string;
    actions?: any[];
  }>;
}

interface ActionNode {
  id: string;
  action_type: string;
  config: any;
  next_action_id?: string;
}

interface UserSession {
  current_menu_id?: string;
  variables: Record<string, any>;
  points: number;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const projectId = pathParts[pathParts.length - 1];

    if (!projectId || projectId === 'telegram-webhook') {
      return new Response(JSON.stringify({ error: 'Project ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const update: TelegramUpdate = await req.json();
    console.log('Received Telegram update for project:', projectId, JSON.stringify(update, null, 2));

    // Load bot configuration from database
    const { data: projectData, error: projectError } = await supabase
      .from('bot_projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();

    if (projectError || !projectData) {
      console.error('Project not found:', projectId);
      return new Response(JSON.stringify({ error: 'Bot not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const botToken = projectData.telegram_bot_token;
    if (!botToken) {
      console.error('No bot token for project:', projectId);
      return new Response(JSON.stringify({ error: 'Bot token not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load menus and action nodes
    const { data: menusData } = await supabase
      .from('bot_menus')
      .select('*')
      .eq('project_id', projectId);

    const menuIds = menusData?.map(m => m.id) || [];
    const { data: buttonsData } = await supabase
      .from('bot_buttons')
      .select('*')
      .in('menu_id', menuIds.length > 0 ? menuIds : ['']);

    const { data: actionNodesData } = await supabase
      .from('bot_action_nodes')
      .select('*')
      .eq('project_id', projectId);

    // Build menus map
    const menus: Map<string, BotMenu> = new Map();
    for (const menu of menusData || []) {
      const menuButtons = (buttonsData || [])
        .filter(b => b.menu_id === menu.id)
        .map(b => ({
          id: b.id,
          text: b.text,
          target_menu_id: b.target_menu_id,
          target_action_id: b.target_action_id,
          actions: b.actions || [],
        }));

      menus.set(menu.id, {
        id: menu.id,
        name: menu.name,
        message_text: menu.message_text,
        buttons: menuButtons,
      });
    }

    // Build action nodes map
    const actionNodes: Map<string, ActionNode> = new Map();
    for (const an of actionNodesData || []) {
      actionNodes.set(an.id, {
        id: an.id,
        action_type: an.action_type,
        config: an.config,
        next_action_id: an.next_action_id,
      });
    }

    // Process message or callback query
    let chatId: number;
    let userId: number;
    let userFirstName: string;
    let userLastName: string | undefined;
    let username: string | undefined;
    let messageText: string | undefined;
    let callbackData: string | undefined;

    if (update.message) {
      chatId = update.message.chat.id;
      userId = update.message.from.id;
      userFirstName = update.message.from.first_name;
      userLastName = update.message.from.last_name;
      username = update.message.from.username;
      messageText = update.message.text;
    } else if (update.callback_query) {
      chatId = update.callback_query.message.chat.id;
      userId = update.callback_query.from.id;
      userFirstName = update.callback_query.from.first_name;
      userLastName = update.callback_query.from.last_name;
      username = update.callback_query.from.username;
      callbackData = update.callback_query.data;

      await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: update.callback_query.id }),
      });
    } else {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get or create user session
    const { data: sessionData } = await supabase
      .from('bot_user_sessions')
      .select('*')
      .eq('project_id', projectId)
      .eq('telegram_user_id', userId.toString())
      .maybeSingle();

    let session: UserSession = sessionData || {
      current_menu_id: undefined,
      variables: {},
      points: 0,
    };

    const isFirstVisit = !sessionData;

    // Build user context
    const userContext: UserContext = {
      first_name: userFirstName,
      last_name: userLastName || '',
      username: username || '',
      user_id: userId.toString(),
      date: new Date().toLocaleDateString('ru-RU'),
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      ...session.variables,
    };

    const interpolate = (text: string) => {
      return text.replace(/\{(\w+)\}/g, (match, key) => {
        return (userContext as any)[key]?.toString() ?? match;
      });
    };

    const settings = projectData.settings as { welcomeMessage: string; defaultMenuId: string };
    const defaultMenuId = settings?.defaultMenuId;
    const defaultMenu = defaultMenuId ? menus.get(defaultMenuId) : menus.values().next().value;

    // Handle /start command
    if (messageText === '/start') {
      const welcomeText = settings?.welcomeMessage 
        ? interpolate(settings.welcomeMessage)
        : interpolate(`Привет, {first_name}! 👋`);

      if (defaultMenu) {
        const menuText = interpolate(defaultMenu.message_text || welcomeText);
        const keyboard = buildInlineKeyboard(defaultMenu.buttons);
        await sendMessage(botToken, chatId, menuText, keyboard);
        session.current_menu_id = defaultMenu.id;
      } else {
        await sendMessage(botToken, chatId, welcomeText);
      }
    } else if (callbackData) {
      // Handle button clicks
      if (callbackData.startsWith('menu_')) {
        const menuId = callbackData.replace('menu_', '');
        const menu = menus.get(menuId);
        if (menu) {
          const menuText = interpolate(menu.message_text || menu.name);
          const keyboard = buildInlineKeyboard(menu.buttons);
          await sendMessage(botToken, chatId, menuText, keyboard);
          session.current_menu_id = menu.id;
        }
      } else if (callbackData.startsWith('action_')) {
        const actionId = callbackData.replace('action_', '');
        session = await executeActionChain(botToken, chatId, actionId, actionNodes, menus, session, userContext, interpolate);
      } else if (callbackData.startsWith('btn_')) {
        // Button click - find button and execute its actions
        const buttonId = callbackData.replace('btn_', '');
        const button = findButton(buttonsData || [], buttonId);
        if (button) {
          if (button.target_menu_id) {
            const menu = menus.get(button.target_menu_id);
            if (menu) {
              const menuText = interpolate(menu.message_text || menu.name);
              const keyboard = buildInlineKeyboard(menu.buttons);
              await sendMessage(botToken, chatId, menuText, keyboard);
              session.current_menu_id = menu.id;
            }
          } else if (button.target_action_id) {
            session = await executeActionChain(botToken, chatId, button.target_action_id, actionNodes, menus, session, userContext, interpolate);
          } else if (button.actions && button.actions.length > 0) {
            // Execute inline actions
            for (const action of button.actions) {
              await executeAction(botToken, chatId, action, session, userContext, interpolate);
            }
          }
        }
      }
    } else if (messageText) {
      // Echo or handle text input
      const responseText = interpolate(`Вы написали: ${messageText}`);
      await sendMessage(botToken, chatId, responseText);
    }

    // Save/update session
    await supabase.from('bot_user_sessions').upsert({
      project_id: projectId,
      telegram_user_id: userId.toString(),
      current_menu_id: session.current_menu_id,
      variables: session.variables,
      points: session.points,
      last_activity_at: new Date().toISOString(),
      ...(isFirstVisit ? { first_visit_at: new Date().toISOString() } : {}),
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function findButton(buttons: any[], buttonId: string) {
  return buttons.find(b => b.id === buttonId);
}

function buildInlineKeyboard(buttons: any[]) {
  if (!buttons || buttons.length === 0) return undefined;

  // Group buttons by row
  const rows: Map<number, any[]> = new Map();
  for (const btn of buttons) {
    const row = btn.row_index || 0;
    if (!rows.has(row)) rows.set(row, []);
    rows.get(row)!.push(btn);
  }

  const keyboard: any[][] = [];
  for (const [, rowButtons] of [...rows.entries()].sort((a, b) => a[0] - b[0])) {
    const row = rowButtons
      .sort((a: any, b: any) => (a.button_order || 0) - (b.button_order || 0))
      .map((btn: any) => ({
        text: btn.text,
        callback_data: btn.target_menu_id 
          ? `menu_${btn.target_menu_id}`
          : btn.target_action_id 
            ? `action_${btn.target_action_id}`
            : `btn_${btn.id}`,
      }));
    keyboard.push(row);
  }

  return { inline_keyboard: keyboard };
}

async function executeActionChain(
  botToken: string,
  chatId: number,
  startActionId: string,
  actionNodes: Map<string, ActionNode>,
  menus: Map<string, BotMenu>,
  session: UserSession,
  userContext: UserContext,
  interpolate: (text: string) => string
): Promise<UserSession> {
  let currentActionId: string | undefined = startActionId;
  let iterations = 0;
  const maxIterations = 50;

  while (currentActionId && iterations < maxIterations) {
    const action = actionNodes.get(currentActionId);
    if (!action) break;

    const result = await executeAction(botToken, chatId, action, session, userContext, interpolate);
    
    if (result.navigateToMenu) {
      const menu = menus.get(result.navigateToMenu);
      if (menu) {
        const menuText = interpolate(menu.message_text || menu.name);
        const keyboard = buildInlineKeyboard(menu.buttons);
        await sendMessage(botToken, chatId, menuText, keyboard);
        session.current_menu_id = menu.id;
      }
      break;
    }

    if (result.nextActionId) {
      currentActionId = result.nextActionId;
    } else {
      currentActionId = action.next_action_id;
    }

    session = result.session;
    iterations++;
  }

  return session;
}

async function executeAction(
  botToken: string,
  chatId: number,
  action: any,
  session: UserSession,
  userContext: UserContext,
  interpolate: (text: string) => string
): Promise<{ session: UserSession; navigateToMenu?: string; nextActionId?: string }> {
  const config = action.config || {};
  const actionType = action.action_type || action.type;

  switch (actionType) {
    case 'show_text': {
      const text = interpolate(config.text || '');
      if (text) await sendMessage(botToken, chatId, text);
      return { session };
    }

    case 'delay': {
      const ms = (config.seconds || 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, Math.min(ms, 5000)));
      return { session };
    }

    case 'typing_indicator': {
      await fetch(`https://api.telegram.org/bot${botToken}/sendChatAction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
      });
      const ms = (config.seconds || 2) * 1000;
      await new Promise(resolve => setTimeout(resolve, Math.min(ms, 5000)));
      return { session };
    }

    case 'navigate_menu': {
      return { session, navigateToMenu: config.menuId };
    }

    case 'set_field': {
      if (config.fieldName) {
        session.variables[config.fieldName] = config.fieldValue || '';
        userContext[config.fieldName] = config.fieldValue || '';
      }
      return { session };
    }

    case 'if_else': {
      const fieldValue = session.variables[config.conditionField || ''];
      let conditionMet = false;

      switch (config.conditionOperator) {
        case 'equals': conditionMet = fieldValue == config.conditionValue; break;
        case 'not_equals': conditionMet = fieldValue != config.conditionValue; break;
        case 'contains': conditionMet = String(fieldValue).includes(config.conditionValue || ''); break;
        case 'greater': conditionMet = Number(fieldValue) > Number(config.conditionValue); break;
        case 'less': conditionMet = Number(fieldValue) < Number(config.conditionValue); break;
        case 'exists': conditionMet = fieldValue !== undefined && fieldValue !== null && fieldValue !== ''; break;
      }

      return { 
        session, 
        nextActionId: conditionMet ? config.trueBranch : config.falseBranch 
      };
    }

    case 'random_result': {
      const outcomes = config.outcomes || [];
      if (outcomes.length > 0) {
        const randomIndex = Math.floor(Math.random() * outcomes.length);
        const result = outcomes[randomIndex];
        if (result.text) await sendMessage(botToken, chatId, interpolate(result.text));
        return { session, nextActionId: result.nextAction };
      }
      return { session };
    }

    case 'lottery': {
      const won = Math.random() * 100 < (config.winChance || 10);
      if (won) {
        await sendMessage(botToken, chatId, `🎉 ${interpolate(config.lotteryPrize || 'Вы выиграли!')}`);
        return { session, nextActionId: config.winAction };
      } else {
        await sendMessage(botToken, chatId, '😔 К сожалению, вы не выиграли. Попробуйте еще раз!');
        return { session, nextActionId: config.loseAction };
      }
    }

    case 'modify_points': {
      const amount = Number(config.pointsAmount) || 0;
      switch (config.pointsOperation) {
        case 'add': session.points += amount; break;
        case 'subtract': session.points -= amount; break;
        case 'set': session.points = amount; break;
        default: session.points += amount;
      }
      session.points = Math.max(0, session.points);
      return { session };
    }

    case 'show_product': {
      const text = `🛒 *${config.productName || 'Товар'}*\n💰 Цена: ${config.productPrice || '0'} ₽\n${config.productDescription || ''}`;
      await sendMessage(botToken, chatId, text);
      return { session };
    }

    default:
      console.log('Unknown action type:', actionType);
      return { session };
  }
}

async function sendMessage(
  botToken: string,
  chatId: number,
  text: string,
  replyMarkup?: any
) {
  const body: any = {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
  };

  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const result = await response.json();
  if (!result.ok) {
    console.error('Send message error:', result);
  }
  return result;
}
