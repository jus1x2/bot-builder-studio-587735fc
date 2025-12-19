import { BotProject, BotMenu, BotButton, BotAction } from '@/types/bot';
import { v4 as uuidv4 } from 'uuid';

// Export project to JSON
export function exportProjectToJSON(project: BotProject): string {
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    project: {
      ...project,
      id: undefined, // Remove ID for clean export
    },
  };
  return JSON.stringify(exportData, null, 2);
}

// Import project from JSON
export function importProjectFromJSON(jsonString: string): BotProject | null {
  try {
    const data = JSON.parse(jsonString);

    if (!data.project || !data.project.menus) {
      throw new Error('Invalid project format');
    }

    // Generate new IDs for all entities
    const menuIdMap = new Map<string, string>();

    const newMenus: BotMenu[] = data.project.menus.map((menu: BotMenu) => {
      const newId = uuidv4();
      menuIdMap.set(menu.id, newId);
      return {
        ...menu,
        id: newId,
        buttons: menu.buttons.map((button: BotButton) => ({
          ...button,
          id: uuidv4(),
          actions: button.actions.map((action: BotAction) => ({
            ...action,
            id: uuidv4(),
          })),
        })),
      };
    });

    // Update menu references
    newMenus.forEach((menu) => {
      if (menu.parentId) {
        menu.parentId = menuIdMap.get(menu.parentId);
      }
      menu.buttons.forEach((button) => {
        button.actions.forEach((action) => {
          if (action.type === 'navigate_menu' && action.config.targetMenuId) {
            action.config.targetMenuId = menuIdMap.get(action.config.targetMenuId) || action.config.targetMenuId;
          }
        });
      });
    });

    const newProject: BotProject = {
      id: uuidv4(),
      name: data.project.name || 'Импортированный проект',
      description: data.project.description,
      menus: newMenus,
      rootMenuId: menuIdMap.get(data.project.rootMenuId) || newMenus[0]?.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'draft',
    };

    return newProject;
  } catch (error) {
    console.error('Import error:', error);
    return null;
  }
}

// Download JSON file
export function downloadJSON(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Read file as text
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
