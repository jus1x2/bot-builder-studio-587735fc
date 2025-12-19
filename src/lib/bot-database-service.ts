import { supabase } from '@/integrations/supabase/client';
import { BotProject, BotMenu, BotButton, BotActionNode } from '@/types/bot';

export interface DbBotProject {
  id: string;
  name: string;
  telegram_bot_token: string | null;
  telegram_bot_username: string | null;
  user_id: string | null;
  settings: {
    welcomeMessage: string;
    defaultMenuId: string;
  };
  created_at: string;
  updated_at: string;
}

// Save project to database
export async function saveProjectToDatabase(project: BotProject, userId?: string): Promise<boolean> {
  try {
    // Upsert project
    const { error: projectError } = await supabase
      .from('bot_projects')
      .upsert({
        id: project.id,
        name: project.name,
        telegram_bot_token: project.telegramBotToken || null,
        telegram_bot_username: project.telegramBotUsername || null,
        user_id: userId || null,
        settings: {
          welcomeMessage: project.globalSettings?.welcomeMessage || '',
          defaultMenuId: project.rootMenuId || '',
        },
      });

    if (projectError) {
      console.error('Error saving project:', projectError);
      return false;
    }

    // Delete existing menus, buttons will cascade
    await supabase.from('bot_menus').delete().eq('project_id', project.id);

    // Delete existing action nodes
    await supabase.from('bot_action_nodes').delete().eq('project_id', project.id);

    // Save menus
    for (const menu of project.menus) {
      const { error: menuError } = await supabase.from('bot_menus').insert({
        id: menu.id,
        project_id: project.id,
        name: menu.name,
        message_text: menu.messageText,
        position_x: menu.position?.x || 0,
        position_y: menu.position?.y || 0,
        settings: menu.settings || {},
      });

      if (menuError) {
        console.error('Error saving menu:', menuError);
        continue;
      }

      // Save buttons for this menu
      for (const button of menu.buttons) {
        const buttonData = {
          id: button.id,
          menu_id: menu.id,
          text: button.text,
          row_index: button.row,
          button_order: button.order,
          target_menu_id: button.targetMenuId || null,
          target_action_id: button.targetActionId || null,
          label_position: button.labelPosition || null,
          actions: button.actions || [],
        };
        await supabase.from('bot_buttons').insert(buttonData as any);
      }
    }

    // Save action nodes (first pass - without next_action_id to avoid FK issues)
    const actionNodes = project.actionNodes || [];
    for (const actionNode of actionNodes) {
      await supabase.from('bot_action_nodes').insert({
        id: actionNode.id,
        project_id: project.id,
        action_type: actionNode.type,
        action_order: 0,
        config: actionNode.config || {},
        position_x: actionNode.position?.x || 0,
        position_y: actionNode.position?.y || 0,
        next_action_id: null,
      });
    }

    // Second pass - update next_action_id
    for (const actionNode of actionNodes) {
      if (actionNode.nextNodeId && actionNode.nextNodeType === 'action') {
        await supabase
          .from('bot_action_nodes')
          .update({ next_action_id: actionNode.nextNodeId })
          .eq('id', actionNode.id);
      }
    }

    console.log('Project saved to database:', project.id);
    return true;
  } catch (error) {
    console.error('Error saving project to database:', error);
    return false;
  }
}

// Load project from database
export async function loadProjectFromDatabase(projectId: string): Promise<BotProject | null> {
  try {
    // Load project
    const { data: projectData, error: projectError } = await supabase
      .from('bot_projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();

    if (projectError || !projectData) {
      console.error('Error loading project:', projectError);
      return null;
    }

    // Load menus
    const { data: menusData, error: menusError } = await supabase
      .from('bot_menus')
      .select('*')
      .eq('project_id', projectId);

    if (menusError) {
      console.error('Error loading menus:', menusError);
      return null;
    }

    // Load all buttons for all menus
    const menuIds = menusData?.map(m => m.id) || [];
    const { data: buttonsData } = await supabase
      .from('bot_buttons')
      .select('*')
      .in('menu_id', menuIds.length > 0 ? menuIds : ['']);

    // Load action nodes
    const { data: actionNodesData } = await supabase
      .from('bot_action_nodes')
      .select('*')
      .eq('project_id', projectId);

    // Build menus with buttons
    const menus: BotMenu[] = (menusData || []).map((menu, index) => {
      const menuButtons: BotButton[] = (buttonsData || [])
        .filter(b => b.menu_id === menu.id)
        .map(b => ({
          id: b.id,
          text: b.text,
          row: b.row_index || 0,
          order: b.button_order || 0,
          targetMenuId: b.target_menu_id || undefined,
          targetActionId: b.target_action_id || undefined,
          labelPosition: b.label_position as number | undefined,
          actions: (b.actions as any[]) || [],
        }));

      return {
        id: menu.id,
        name: menu.name,
        messageText: menu.message_text || '',
        buttons: menuButtons,
        order: index,
        position: { x: menu.position_x || 0, y: menu.position_y || 0 },
        settings: menu.settings as any,
      };
    });

    // Build action nodes
    const actionNodes: BotActionNode[] = (actionNodesData || []).map(an => ({
      id: an.id,
      type: an.action_type as any,
      config: (an.config as Record<string, any>) || {},
      position: { x: an.position_x || 0, y: an.position_y || 0 },
      nextNodeId: an.next_action_id || undefined,
      nextNodeType: an.next_action_id ? 'action' as const : undefined,
    }));

    const settings = projectData.settings as { welcomeMessage: string; defaultMenuId: string } | null;

    return {
      id: projectData.id,
      name: projectData.name,
      menus,
      actionNodes,
      rootMenuId: settings?.defaultMenuId || menus[0]?.id || '',
      telegramBotToken: projectData.telegram_bot_token || undefined,
      telegramBotUsername: projectData.telegram_bot_username || undefined,
      globalSettings: {
        welcomeMessage: settings?.welcomeMessage || '',
      },
      createdAt: new Date(projectData.created_at),
      updatedAt: new Date(projectData.updated_at),
      status: 'draft',
    };
  } catch (error) {
    console.error('Error loading project from database:', error);
    return null;
  }
}

// Delete project from database
export async function deleteProjectFromDatabase(projectId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('bot_projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('Error deleting project:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting project from database:', error);
    return false;
  }
}

// List all projects from database (optionally filtered by user)
export async function listProjectsFromDatabase(userId?: string): Promise<DbBotProject[]> {
  try {
    let query = supabase
      .from('bot_projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error listing projects:', error);
      return [];
    }

    return (data || []).map(p => ({
      ...p,
      settings: (p.settings as { welcomeMessage: string; defaultMenuId: string }) || { welcomeMessage: '', defaultMenuId: '' },
    }));
  } catch (error) {
    console.error('Error listing projects from database:', error);
    return [];
  }
}