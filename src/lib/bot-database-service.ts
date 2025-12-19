import { supabase } from '@/integrations/supabase/client';
import { BotProject, BotMenu, BotButton, BotActionNode } from '@/types/bot';

// Save project to database
export async function saveProjectToDatabase(project: BotProject, profileId: string): Promise<boolean> {
  try {
    console.log('Saving project to database:', project.id, 'for profile:', profileId);

    // Safety check: don't save if project has no menus (likely corrupted state)
    if (!project.menus || project.menus.length === 0) {
      console.warn('Refusing to save project with no menus - possible corrupted state');
      return false;
    }

    // Upsert project
    const { error: projectError } = await supabase
      .from('bot_projects')
      .upsert({
        id: project.id,
        profile_id: profileId,
        name: project.name,
        description: project.description || null,
        template: project.template || 'blank',
        telegram_bot_token: project.telegramBotToken || null,
        telegram_bot_username: project.telegramBotUsername || null,
        root_menu_id: project.rootMenuId || null,
        status: project.status || 'draft',
        global_settings: project.globalSettings || {},
      });

    if (projectError) {
      console.error('Error saving project:', projectError);
      return false;
    }

    // Delete existing menus (buttons will cascade)
    await supabase.from('bot_menus').delete().eq('project_id', project.id);

    // Delete existing action nodes
    await supabase.from('bot_action_nodes').delete().eq('project_id', project.id);

    // Save menus
    for (const menu of project.menus) {
      const { error: menuError } = await supabase.from('bot_menus').insert({
        id: menu.id,
        project_id: project.id,
        name: menu.name,
        message_text: menu.messageText || '',
        description: menu.description || null,
        parent_id: menu.parentId || null,
        position_x: menu.position?.x || 0,
        position_y: menu.position?.y || 0,
        menu_order: menu.order || 0,
        keyword_triggers: menu.keywordTriggers || [],
        settings: menu.settings || {},
        media_url: menu.mediaUrl || null,
      });

      if (menuError) {
        console.error('Error saving menu:', menuError);
        continue;
      }

      // Save buttons for this menu
      for (const button of menu.buttons) {
        const { error: buttonError } = await supabase.from('bot_buttons').insert([{
          id: button.id,
          menu_id: menu.id,
          text: button.text,
          row_index: button.row || 0,
          button_order: button.order || 0,
          target_menu_id: button.targetMenuId || null,
          target_action_id: button.targetActionId || null,
          label_position: button.labelPosition || 0.5,
          actions: JSON.parse(JSON.stringify(button.actions || [])),
        }]);

        if (buttonError) {
          console.error('Error saving button:', buttonError);
        }
      }
    }

    // Save action nodes
    const actionNodes = project.actionNodes || [];
    for (const actionNode of actionNodes) {
      // Include outcomes in config for storage
      const configWithOutcomes = {
        ...actionNode.config || {},
        _outcomes: actionNode.outcomes || [],
      };
      
      const { error: actionError } = await supabase.from('bot_action_nodes').insert([{
        id: actionNode.id,
        project_id: project.id,
        action_type: actionNode.type,
        config: configWithOutcomes as any,
        position_x: actionNode.position?.x || 0,
        position_y: actionNode.position?.y || 0,
        next_node_id: actionNode.nextNodeId || null,
        next_node_type: actionNode.nextNodeType || null,
      }]);

      if (actionError) {
        console.error('Error saving action node:', actionError);
      }
    }

    console.log('Project saved successfully:', project.id);
    return true;
  } catch (error) {
    console.error('Error saving project to database:', error);
    return false;
  }
}

// Load project from database
export async function loadProjectFromDatabase(projectId: string): Promise<BotProject | null> {
  try {
    console.log('Loading project from database:', projectId);

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
      .eq('project_id', projectId)
      .order('menu_order', { ascending: true });

    if (menusError) {
      console.error('Error loading menus:', menusError);
      return null;
    }

    // Load all buttons for all menus
    const menuIds = menusData?.map(m => m.id) || [];
    let buttonsData: any[] = [];
    
    if (menuIds.length > 0) {
      const { data } = await supabase
        .from('bot_buttons')
        .select('*')
        .in('menu_id', menuIds)
        .order('row_index', { ascending: true })
        .order('button_order', { ascending: true });
      buttonsData = data || [];
    }

    // Load action nodes
    const { data: actionNodesData } = await supabase
      .from('bot_action_nodes')
      .select('*')
      .eq('project_id', projectId);

    // Build menus with buttons
    const menus: BotMenu[] = (menusData || []).map((menu, index) => {
      const menuButtons: BotButton[] = buttonsData
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
        description: menu.description || undefined,
        parentId: menu.parent_id || undefined,
        buttons: menuButtons,
        order: menu.menu_order || index,
        position: { x: menu.position_x || 0, y: menu.position_y || 0 },
        keywordTriggers: menu.keyword_triggers || [],
        settings: (menu.settings as any) || {},
        mediaUrl: menu.media_url || undefined,
      };
    });

    // Build action nodes
    const actionNodes: BotActionNode[] = (actionNodesData || []).map(an => {
      const config = (an.config as Record<string, any>) || {};
      const outcomes = config._outcomes || [];
      const { _outcomes, ...cleanConfig } = config;
      
      return {
        id: an.id,
        type: an.action_type as any,
        config: cleanConfig,
        position: { x: an.position_x || 0, y: an.position_y || 0 },
        nextNodeId: an.next_node_id || undefined,
        nextNodeType: an.next_node_type as 'menu' | 'action' | undefined,
        outcomes: outcomes.length > 0 ? outcomes : undefined,
      };
    });

    const globalSettings = projectData.global_settings as any || {};

    const validTemplates = ['blank', 'custom', 'shop', 'quiz', 'support', 'funnel'] as const;
    const template = validTemplates.includes(projectData.template as any) 
      ? projectData.template as typeof validTemplates[number]
      : 'blank';

    const validStatuses = ['draft', 'testing', 'exported', 'completed', 'active', 'archived'] as const;
    const status = validStatuses.includes(projectData.status as any)
      ? projectData.status as typeof validStatuses[number]
      : 'draft';

    return {
      id: projectData.id,
      name: projectData.name,
      description: projectData.description || undefined,
      template,
      menus,
      actionNodes,
      rootMenuId: projectData.root_menu_id || menus[0]?.id || '',
      telegramBotToken: projectData.telegram_bot_token || undefined,
      telegramBotUsername: projectData.telegram_bot_username || undefined,
      globalSettings,
      createdAt: new Date(projectData.created_at),
      updatedAt: new Date(projectData.updated_at),
      status,
    };
  } catch (error) {
    console.error('Error loading project from database:', error);
    return null;
  }
}

// Load all projects for a profile
export async function loadAllProjectsFromDatabase(profileId: string): Promise<BotProject[]> {
  try {
    console.log('Loading all projects for profile:', profileId);

    const { data: projectsData, error } = await supabase
      .from('bot_projects')
      .select('*')
      .eq('profile_id', profileId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading projects:', error);
      return [];
    }

    const projects: BotProject[] = [];

    for (const projectData of projectsData || []) {
      const project = await loadProjectFromDatabase(projectData.id);
      if (project) {
        projects.push(project);
      }
    }

    console.log('Loaded', projects.length, 'projects');
    return projects;
  } catch (error) {
    console.error('Error loading all projects:', error);
    return [];
  }
}

// Delete project from database
export async function deleteProjectFromDatabase(projectId: string): Promise<boolean> {
  try {
    console.log('Deleting project:', projectId);

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
