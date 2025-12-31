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
    row_index?: number;
    button_order?: number;
    target_menu_id?: string;
    target_action_id?: string;
    actions?: any[];
  }>;
}

interface ActionNode {
  id: string;
  action_type: string;
  config: any;
  next_node_id?: string;
  next_node_type?: string;
  outcomes?: Array<{
    id: string;
    targetId?: string;
    targetType?: 'action' | 'menu';
  }>;
}

interface UserSession {
  current_menu_id?: string;
  session_data: Record<string, any>;
  user_fields: Record<string, any>;
  cart_data: Record<string, any>;
  tags: string[];
}

// Rate limiting - simple in-memory store (resets on function restart)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 60; // max requests per window

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  record.count++;
  return true;
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

    // Validate projectId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!projectId || projectId === 'telegram-webhook' || !uuidRegex.test(projectId)) {
      console.error('Invalid project ID format:', projectId);
      return new Response(JSON.stringify({ error: 'Invalid project ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse and validate incoming update
    let update: TelegramUpdate;
    try {
      const rawBody = await req.text();
      // Limit payload size (prevent DoS)
      if (rawBody.length > 100000) {
        console.error('Payload too large:', rawBody.length);
        return new Response(JSON.stringify({ error: 'Payload too large' }), {
          status: 413,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      update = JSON.parse(rawBody);
    } catch (e) {
      console.error('Invalid JSON payload');
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract user ID for rate limiting
    const userId = update.message?.from?.id || update.callback_query?.from?.id;
    if (userId) {
      const rateLimitKey = `${projectId}:${userId}`;
      if (!checkRateLimit(rateLimitKey)) {
        console.warn('Rate limit exceeded for:', rateLimitKey);
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    console.log('Received Telegram update for project:', projectId);

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
          row_index: b.row_index,
          button_order: b.button_order,
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
      const config = an.config as any || {};
      const outcomes = config._outcomes || [];
      
      actionNodes.set(an.id, {
        id: an.id,
        action_type: an.action_type,
        config: config,
        next_node_id: an.next_node_id || undefined,
        next_node_type: an.next_node_type || undefined,
        outcomes: outcomes,
      });
    }

    // Process message or callback query
    let chatId: number;
    let userIdNum: number;
    let userFirstName: string;
    let userLastName: string | undefined;
    let username: string | undefined;
    let messageText: string | undefined;
    let callbackData: string | undefined;

    if (update.message) {
      chatId = update.message.chat.id;
      userIdNum = update.message.from.id;
      userFirstName = update.message.from.first_name;
      userLastName = update.message.from.last_name;
      username = update.message.from.username;
      messageText = update.message.text;
    } else if (update.callback_query) {
      chatId = update.callback_query.message.chat.id;
      userIdNum = update.callback_query.from.id;
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
      .eq('telegram_user_id', userIdNum.toString())
      .maybeSingle();

    let session: UserSession = sessionData ? {
      current_menu_id: sessionData.current_menu_id || undefined,
      session_data: (sessionData.session_data as Record<string, any>) || {},
      user_fields: (sessionData.user_fields as Record<string, any>) || {},
      cart_data: (sessionData.cart_data as Record<string, any>) || {},
      tags: (sessionData.tags as string[]) || [],
    } : {
      current_menu_id: undefined,
      session_data: {},
      user_fields: {},
      cart_data: {},
      tags: [],
    };

    const isFirstVisit = !sessionData;

    // Sanitize user inputs to prevent injection
    const sanitize = (str: string | undefined, maxLen: number = 100): string => {
      if (!str || typeof str !== 'string') return '';
      return str.slice(0, maxLen);
    };

    // Build user context with sanitized data - use session_data for variables
    const userContext: UserContext = {
      first_name: sanitize(userFirstName, 64),
      last_name: sanitize(userLastName, 64),
      username: sanitize(username, 32),
      user_id: userIdNum.toString(),
      date: new Date().toLocaleDateString('ru-RU'),
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      ...session.session_data,
    };

    // Secure interpolation - only allow alphanumeric variable names
    const interpolate = (text: string) => {
      if (!text || typeof text !== 'string') return '';
      return text.slice(0, 4000).replace(/\{(\w+)\}/g, (match, key) => {
        const value = (userContext as any)[key];
        return value !== undefined ? String(value).slice(0, 500) : match;
      });
    };

    const globalSettings = projectData.global_settings as { welcomeMessage?: string; defaultMenuId?: string } || {};
    const defaultMenuId = globalSettings?.defaultMenuId || projectData.root_menu_id;
    const defaultMenu = defaultMenuId ? menus.get(defaultMenuId) : menus.values().next().value;

    // Handle /start command
    if (messageText === '/start') {
      const welcomeText = globalSettings?.welcomeMessage 
        ? interpolate(globalSettings.welcomeMessage)
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
      // Validate callback data format and length
      if (callbackData.length > 200) {
        console.warn('Callback data too long:', callbackData.length);
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Handle button clicks with validated UUIDs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (callbackData.startsWith('menu_')) {
        const menuId = callbackData.replace('menu_', '');
        if (uuidRegex.test(menuId)) {
          const menu = menus.get(menuId);
          if (menu) {
            const menuText = interpolate(menu.message_text || menu.name);
            const keyboard = buildInlineKeyboard(menu.buttons);
            await sendMessage(botToken, chatId, menuText, keyboard);
            session.current_menu_id = menu.id;
          }
        }
      } else if (callbackData.startsWith('action_')) {
        const actionId = callbackData.replace('action_', '');
        if (uuidRegex.test(actionId)) {
          session = await executeActionChain(botToken, chatId, actionId, actionNodes, menus, session, userContext, interpolate);
        }
      } else if (callbackData.startsWith('btn_')) {
        // Button click - find button and execute its actions
        const buttonId = callbackData.replace('btn_', '');
        if (uuidRegex.test(buttonId)) {
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
      }
    } else if (messageText) {
      // Handle text input - check for keyword triggers first
      let matchedMenu: BotMenu | undefined;
      
      for (const [, menu] of menus) {
        // Check keyword_triggers from database
        const menuData = menusData?.find(m => m.id === menu.id);
        const triggers = menuData?.keyword_triggers || [];
        
        if (triggers.some((trigger: string) => 
          messageText?.toLowerCase().includes(trigger.toLowerCase())
        )) {
          matchedMenu = menu;
          break;
        }
      }
      
      if (matchedMenu) {
        const menuText = interpolate(matchedMenu.message_text || matchedMenu.name);
        const keyboard = buildInlineKeyboard(matchedMenu.buttons);
        await sendMessage(botToken, chatId, menuText, keyboard);
        session.current_menu_id = matchedMenu.id;
      } else {
        // Echo or handle text input
        const responseText = interpolate(`Вы написали: ${sanitize(messageText, 200)}`);
        await sendMessage(botToken, chatId, responseText);
      }
    }

    // Save/update session with correct column names
    const { error: sessionError } = await supabase.from('bot_user_sessions').upsert({
      project_id: projectId,
      telegram_user_id: userIdNum.toString(),
      current_menu_id: session.current_menu_id || null,
      session_data: session.session_data,
      user_fields: session.user_fields,
      cart_data: session.cart_data,
      tags: session.tags,
    }, {
      onConflict: 'project_id,telegram_user_id',
    });

    if (sessionError) {
      console.error('Error saving session:', sessionError);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
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
    } else if (action.next_node_type === 'action' && action.next_node_id) {
      currentActionId = action.next_node_id;
    } else if (action.next_node_type === 'menu' && action.next_node_id) {
      const menu = menus.get(action.next_node_id);
      if (menu) {
        const menuText = interpolate(menu.message_text || menu.name);
        const keyboard = buildInlineKeyboard(menu.buttons);
        await sendMessage(botToken, chatId, menuText, keyboard);
        session.current_menu_id = menu.id;
      }
      break;
    } else {
      currentActionId = undefined;
    }

    session = result.session;
    iterations++;
  }

  return session;
}

async function executeAction(
  botToken: string,
  chatId: number,
  action: ActionNode & { type?: string },
  session: UserSession,
  userContext: UserContext,
  interpolate: (text: string) => string
): Promise<{ session: UserSession; navigateToMenu?: string; nextActionId?: string }> {
  const config = action.config || {};
  const actionType = action.action_type || (action as any).type;
  const outcomes = action.outcomes || config._outcomes || [];

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
        session.session_data[config.fieldName] = config.fieldValue || '';
        userContext[config.fieldName] = config.fieldValue || '';
      }
      return { session };
    }

    case 'if_else': {
      const fieldValue = session.session_data[config.conditionField || ''];
      let conditionMet = false;

      switch (config.conditionOperator) {
        case 'equals': conditionMet = fieldValue == config.conditionValue; break;
        case 'not_equals': conditionMet = fieldValue != config.conditionValue; break;
        case 'contains': conditionMet = String(fieldValue).includes(config.conditionValue || ''); break;
        case 'greater': conditionMet = Number(fieldValue) > Number(config.conditionValue); break;
        case 'less': conditionMet = Number(fieldValue) < Number(config.conditionValue); break;
        case 'exists': conditionMet = fieldValue !== undefined && fieldValue !== null && fieldValue !== ''; break;
      }

      // Use outcomes for branching
      const selectedOutcome = conditionMet 
        ? outcomes.find((o: any) => o.id === 'yes')
        : outcomes.find((o: any) => o.id === 'no');
      
      if (selectedOutcome?.targetId) {
        if (selectedOutcome.targetType === 'menu') {
          return { session, navigateToMenu: selectedOutcome.targetId };
        } else {
          return { session, nextActionId: selectedOutcome.targetId };
        }
      }
      return { session };
    }

    case 'random_result': {
      const outcomeCount = config.outcomeCount || outcomes.length || 2;
      const randomIndex = Math.floor(Math.random() * outcomeCount);
      const selectedOutcome = outcomes[randomIndex];
      
      if (selectedOutcome?.targetId) {
        if (selectedOutcome.targetType === 'menu') {
          return { session, navigateToMenu: selectedOutcome.targetId };
        } else {
          return { session, nextActionId: selectedOutcome.targetId };
        }
      }
      return { session };
    }

    case 'lottery': {
      const winChance = config.winChance || 10;
      const isWin = Math.random() * 100 < winChance;
      const prize = config.prize || 'приз';
      
      if (isWin) {
        const winMessage = interpolate(config.winMessage || '🎉 Поздравляем! Вы выиграли {prize}!').replace('{prize}', prize);
        await sendMessage(botToken, chatId, winMessage);
        
        const winOutcome = outcomes.find((o: any) => o.id === 'win');
        if (winOutcome?.targetId) {
          if (winOutcome.targetType === 'menu') {
            return { session, navigateToMenu: winOutcome.targetId };
          } else {
            return { session, nextActionId: winOutcome.targetId };
          }
        }
      } else {
        const loseMessage = interpolate(config.loseMessage || '😔 К сожалению, не повезло. Попробуйте ещё!');
        await sendMessage(botToken, chatId, loseMessage);
        
        const loseOutcome = outcomes.find((o: any) => o.id === 'lose');
        if (loseOutcome?.targetId) {
          if (loseOutcome.targetType === 'menu') {
            return { session, navigateToMenu: loseOutcome.targetId };
          } else {
            return { session, nextActionId: loseOutcome.targetId };
          }
        }
      }
      return { session };
    }

    case 'modify_points': {
      const amount = Number(config.pointsAmount) || 0;
      const currentPoints = Number(session.session_data.points) || 0;
      let newPoints = currentPoints;
      
      switch (config.pointsOperation) {
        case 'add': newPoints = currentPoints + amount; break;
        case 'subtract': newPoints = currentPoints - amount; break;
        case 'set': newPoints = amount; break;
        default: newPoints = currentPoints + amount;
      }
      
      session.session_data.points = Math.max(0, newPoints);
      return { session };
    }

    case 'show_product': {
      const text = `🛒 *${config.productName || 'Товар'}*\n💰 Цена: ${config.productPrice || '0'} ₽\n${config.productDescription || ''}`;
      await sendMessage(botToken, chatId, text);
      return { session };
    }

    case 'weighted_random': {
      const weightedOutcomes = config.outcomes || [];
      if (weightedOutcomes.length > 0) {
        const totalWeight = weightedOutcomes.reduce((sum: number, o: any) => sum + (o.weight || 1), 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < weightedOutcomes.length; i++) {
          random -= weightedOutcomes[i].weight || 1;
          if (random <= 0) {
            const selectedOutcome = outcomes[i];
            if (selectedOutcome?.targetId) {
              if (selectedOutcome.targetType === 'menu') {
                return { session, navigateToMenu: selectedOutcome.targetId };
              } else {
                return { session, nextActionId: selectedOutcome.targetId };
              }
            }
            break;
          }
        }
      }
      return { session };
    }

    case 'send_notification': {
      const message = interpolate(config.message || '');
      if (message) {
        await sendMessage(botToken, chatId, `🔔 ${message}`);
      }
      return { session };
    }

    case 'spam_protection': {
      // Spam protection passes through - actual blocking handled by rate limiting
      return { session };
    }

    case 'leaderboard': {
      const title = config.title || '🏆 Топ игроков';
      const userPoints = Number(session.session_data.points) || 0;
      await sendMessage(botToken, chatId, `${title}\n\n🥇 Место 1 - 1000 очков\n🥈 Место 2 - 800 очков\n🥉 Место 3 - 600 очков\n\n📍 Ваши очки: ${userPoints}`);
      return { session };
    }

    case 'add_tag': {
      const tag = config.tag;
      if (tag && !session.tags.includes(tag)) {
        session.tags.push(tag);
      }
      return { session };
    }

    case 'remove_tag': {
      const tag = config.tag;
      if (tag) {
        session.tags = session.tags.filter(t => t !== tag);
      }
      return { session };
    }

    case 'check_tag': {
      const tag = config.tag;
      const hasTag = session.tags.includes(tag);
      
      const selectedOutcome = hasTag 
        ? outcomes.find((o: any) => o.id === 'yes')
        : outcomes.find((o: any) => o.id === 'no');
      
      if (selectedOutcome?.targetId) {
        if (selectedOutcome.targetType === 'menu') {
          return { session, navigateToMenu: selectedOutcome.targetId };
        } else {
          return { session, nextActionId: selectedOutcome.targetId };
        }
      }
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

  try {
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
  } catch (error) {
    console.error('Failed to send message:', error);
    return { ok: false, error };
  }
}
