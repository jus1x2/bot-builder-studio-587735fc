import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { BotProject, BotMenu, BotButton, BotAction, BotActionNode, ActionType, MAX_MENUS_PER_PROJECT, MAX_BUTTONS_PER_MENU, MAX_ACTION_NODES_PER_PROJECT } from '@/types/bot';
import { createTemplateProject } from '@/lib/bot-templates';
import { saveProjectToDatabase, loadProjectFromDatabase, loadAllProjectsFromDatabase, deleteProjectFromDatabase } from '@/lib/bot-database-service';

interface ProjectStore {
  projects: BotProject[];
  currentProjectId: string | null;
  currentMenuId: string | null;
  selectedButtonId: string | null;
  selectedActionNodeId: string | null;
  justMovedButtonId: string | null;
  profileId: string | null;
  isLoading: boolean;
  isSyncing: boolean;

  setProfileId: (profileId: string | null) => void;
  loadProjectsFromCloud: (profileId: string) => Promise<void>;
  syncProjectToCloud: (projectId: string) => Promise<boolean>;

  createProject: (name: string, description?: string, templateId?: string) => BotProject;
  duplicateProject: (projectId: string) => BotProject | null;
  deleteProject: (projectId: string) => void;
  updateProject: (projectId: string, updates: Partial<BotProject>) => void;
  restoreProject: (project: BotProject) => void;
  setCurrentProject: (projectId: string | null) => void;
  getCurrentProject: () => BotProject | null;

  addMenu: (parentId?: string) => BotMenu | null;
  duplicateMenu: (menuId: string) => BotMenu | null;
  updateMenu: (menuId: string, updates: Partial<BotMenu>) => void;
  deleteMenu: (menuId: string) => void;
  setCurrentMenu: (menuId: string | null) => void;
  getCurrentMenu: () => BotMenu | null;

  addButton: (menuId: string, row?: number) => BotButton | null;
  updateButton: (menuId: string, buttonId: string, updates: Partial<BotButton>) => void;
  deleteButton: (menuId: string, buttonId: string) => void;
  setSelectedButton: (buttonId: string | null) => void;
  moveButton: (menuId: string, buttonId: string, direction: 'up' | 'down' | 'left' | 'right') => void;

  addAction: (menuId: string, buttonId: string, action: BotAction) => void;
  updateAction: (menuId: string, buttonId: string, actionId: string, updates: Partial<BotAction>) => void;
  deleteAction: (menuId: string, buttonId: string, actionId: string) => void;
  compactButtonRows: (menuId: string) => void;

  addActionNode: (type: ActionType, position: { x: number; y: number }) => BotActionNode | null;
  updateActionNode: (actionNodeId: string, updates: Partial<BotActionNode>) => void;
  deleteActionNode: (actionNodeId: string) => void;
  duplicateActionNode: (actionNodeId: string) => BotActionNode | null;
  setSelectedActionNode: (actionNodeId: string | null) => void;
}

const createDefaultMenu = (name: string, parentId?: string): BotMenu => ({
  id: uuidv4(),
  name,
  messageText: `Добро пожаловать в ${name}!`,
  buttons: [],
  parentId,
  order: 0,
  position: { x: parentId ? 300 : 0, y: 0 },
});

const createDefaultButton = (text: string, row: number, order: number): BotButton => ({
  id: uuidv4(),
  text,
  row,
  order,
  actions: [],
});

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProjectId: null,
      currentMenuId: null,
      selectedButtonId: null,
      selectedActionNodeId: null,
      justMovedButtonId: null,
      profileId: null,
      isLoading: false,
      isSyncing: false,

      setProfileId: (profileId) => {
        set({ profileId });
      },

      loadProjectsFromCloud: async (profileId) => {
        set({ isLoading: true });
        try {
          const cloudProjects = await loadAllProjectsFromDatabase(profileId);
          if (cloudProjects.length > 0) {
            set({ projects: cloudProjects });
          }
        } catch (error) {
          console.error('Failed to load projects from cloud:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      syncProjectToCloud: async (projectId) => {
        const { profileId, projects } = get();
        if (!profileId) {
          console.warn('No profile ID set, cannot sync to cloud');
          return false;
        }

        const project = projects.find(p => p.id === projectId);
        if (!project) return false;

        set({ isSyncing: true });
        try {
          const success = await saveProjectToDatabase(project, profileId);
          return success;
        } catch (error) {
          console.error('Failed to sync project to cloud:', error);
          return false;
        } finally {
          set({ isSyncing: false });
        }
      },

      createProject: (name, description, templateId = 'blank') => {
        const project = createTemplateProject(templateId, name, description);

        set((state) => ({
          projects: [...state.projects, project],
          currentProjectId: project.id,
          currentMenuId: project.rootMenuId,
        }));

        // Sync to cloud if profile is set
        const { profileId } = get();
        if (profileId) {
          setTimeout(() => {
            get().syncProjectToCloud(project.id);
          }, 100);
        }

        return project;
      },

      duplicateProject: (projectId) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (!project) return null;

        const menuIdMap = new Map<string, string>();

        const newMenus = project.menus.map((menu) => {
          const newId = uuidv4();
          menuIdMap.set(menu.id, newId);
          return { ...menu, id: newId };
        });

        newMenus.forEach((menu) => {
          if (menu.parentId) {
            menu.parentId = menuIdMap.get(menu.parentId);
          }
        });

        const newProject: BotProject = {
          ...project,
          id: uuidv4(),
          name: `${project.name} (копия)`,
          menus: newMenus,
          rootMenuId: menuIdMap.get(project.rootMenuId) || newMenus[0].id,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'draft',
        };

        set((state) => ({ projects: [...state.projects, newProject] }));

        // Sync to cloud
        const { profileId } = get();
        if (profileId) {
          setTimeout(() => {
            get().syncProjectToCloud(newProject.id);
          }, 100);
        }

        return newProject;
      },

      deleteProject: (projectId) => {
        // Delete from cloud first
        deleteProjectFromDatabase(projectId).catch(console.error);

        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
          currentProjectId: state.currentProjectId === projectId ? null : state.currentProjectId,
        }));
      },

      updateProject: (projectId, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, ...updates, updatedAt: new Date() } : p
          ),
        }));
      },

      restoreProject: (project) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === project.id ? project : p
          ),
        }));
      },

      setCurrentProject: (projectId) => {
        const project = get().projects.find((p) => p.id === projectId);
        set({
          currentProjectId: projectId,
          currentMenuId: project?.rootMenuId || null,
          selectedButtonId: null,
        });
      },

      getCurrentProject: () => {
        const { projects, currentProjectId } = get();
        return projects.find((p) => p.id === currentProjectId) || null;
      },

      addMenu: (parentId) => {
        const project = get().getCurrentProject();
        if (!project) return null;

        if (project.menus.length >= MAX_MENUS_PER_PROJECT) {
          console.warn(`Maximum menu limit reached (${MAX_MENUS_PER_PROJECT})`);
          return null;
        }

        const menu = createDefaultMenu('Новое меню', parentId);

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === project.id
              ? { ...p, menus: [...p.menus, menu], updatedAt: new Date() }
              : p
          ),
          currentMenuId: menu.id,
        }));

        return menu;
      },

      duplicateMenu: (menuId) => {
        const project = get().getCurrentProject();
        if (!project) return null;

        const menuToDuplicate = project.menus.find((m) => m.id === menuId);
        if (!menuToDuplicate) return null;

        const newMenuId = uuidv4();
        const newButtons = menuToDuplicate.buttons.map((button) => ({
          ...button,
          id: uuidv4(),
          targetMenuId: undefined,
          targetActionId: undefined,
          labelPosition: undefined,
        }));

        const newMenu: BotMenu = {
          ...menuToDuplicate,
          id: newMenuId,
          name: `${menuToDuplicate.name} (копия)`,
          buttons: newButtons,
          position: {
            x: (menuToDuplicate.position?.x || 0) + 50,
            y: (menuToDuplicate.position?.y || 0) + 50,
          },
        };

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === project.id
              ? { ...p, menus: [...p.menus, newMenu], updatedAt: new Date() }
              : p
          ),
          currentMenuId: newMenu.id,
        }));

        return newMenu;
      },

      updateMenu: (menuId, updates) => {
        const project = get().getCurrentProject();
        if (!project) return;

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === project.id
              ? {
                  ...p,
                  menus: p.menus.map((m) => (m.id === menuId ? { ...m, ...updates } : m)),
                  updatedAt: new Date(),
                }
              : p
          ),
        }));
      },

      deleteMenu: (menuId) => {
        const project = get().getCurrentProject();
        if (!project || menuId === project.rootMenuId) return;

        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== project.id) return p;

            const remainingMenus = p.menus.filter((m) => m.id !== menuId);

            const cleanedMenus = remainingMenus.map((m) => {
              const cleanedButtons = m.buttons.map((b) => {
                const shouldClearTarget = b.targetMenuId === menuId;
                if (!shouldClearTarget) return b;

                return {
                  ...b,
                  targetMenuId: undefined,
                };
              });

              return { ...m, buttons: cleanedButtons };
            });

            return {
              ...p,
              menus: cleanedMenus,
              updatedAt: new Date(),
            };
          }),
          currentMenuId: state.currentMenuId === menuId ? project.rootMenuId : state.currentMenuId,
        }));
      },

      setCurrentMenu: (menuId) => {
        set({ currentMenuId: menuId, selectedButtonId: null });
      },

      getCurrentMenu: () => {
        const project = get().getCurrentProject();
        if (!project) return null;
        return project.menus.find((m) => m.id === get().currentMenuId) || null;
      },

      addButton: (menuId, row = 0) => {
        const project = get().getCurrentProject();
        if (!project) return null;

        const menu = project.menus.find((m) => m.id === menuId);
        if (!menu) return null;

        if (menu.buttons.length >= MAX_BUTTONS_PER_MENU) {
          console.warn(`Maximum button limit reached for menu (${MAX_BUTTONS_PER_MENU})`);
          return null;
        }

        const buttonsInRow = menu.buttons.filter((b) => b.row === row);
        const button = createDefaultButton('Кнопка', row, buttonsInRow.length);

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === project.id
              ? {
                  ...p,
                  menus: p.menus.map((m) =>
                    m.id === menuId ? { ...m, buttons: [...m.buttons, button] } : m
                  ),
                  updatedAt: new Date(),
                }
              : p
          ),
          selectedButtonId: button.id,
        }));

        return button;
      },

      updateButton: (menuId, buttonId, updates) => {
        const project = get().getCurrentProject();
        if (!project) return;

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === project.id
              ? {
                  ...p,
                  menus: p.menus.map((m) =>
                    m.id === menuId
                      ? {
                          ...m,
                          buttons: m.buttons.map((b) =>
                            b.id === buttonId ? { ...b, ...updates } : b
                          ),
                        }
                      : m
                  ),
                  updatedAt: new Date(),
                }
              : p
          ),
        }));
      },

      deleteButton: (menuId, buttonId) => {
        const project = get().getCurrentProject();
        if (!project) return;

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === project.id
              ? {
                  ...p,
                  menus: p.menus.map((m) =>
                    m.id === menuId
                      ? { ...m, buttons: m.buttons.filter((b) => b.id !== buttonId) }
                      : m
                  ),
                  updatedAt: new Date(),
                }
              : p
          ),
          selectedButtonId: state.selectedButtonId === buttonId ? null : state.selectedButtonId,
        }));
      },

      setSelectedButton: (buttonId) => {
        set({ selectedButtonId: buttonId });
      },

      moveButton: (menuId, buttonId, direction) => {
        const project = get().getCurrentProject();
        if (!project) return;

        const menu = project.menus.find((m) => m.id === menuId);
        if (!menu) return;

        const button = menu.buttons.find((b) => b.id === buttonId);
        if (!button) return;

        const buttonsInSameRow = menu.buttons.filter((b) => b.row === button.row).sort((a, b) => a.order - b.order);
        const buttonIndex = buttonsInSameRow.findIndex((b) => b.id === buttonId);

        let newRow = button.row;
        const maxAllowedRow = menu.buttons.length - 1;

        if (direction === 'up' && button.row > 0) {
          newRow = button.row - 1;
        } else if (direction === 'down' && button.row < maxAllowedRow) {
          newRow = button.row + 1;
        } else if (direction === 'left' && buttonIndex > 0) {
          const prevButton = buttonsInSameRow[buttonIndex - 1];
          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === project.id
                ? {
                    ...p,
                    menus: p.menus.map((m) =>
                      m.id === menuId
                        ? {
                            ...m,
                            buttons: m.buttons.map((b) => {
                              if (b.id === buttonId) return { ...b, order: prevButton.order };
                              if (b.id === prevButton.id) return { ...b, order: button.order };
                              return b;
                            }),
                          }
                        : m
                    ),
                    updatedAt: new Date(),
                  }
                : p
            ),
            justMovedButtonId: buttonId,
          }));
          setTimeout(() => set({ justMovedButtonId: null }), 1000);
          return;
        } else if (direction === 'right' && buttonIndex < buttonsInSameRow.length - 1) {
          const nextButton = buttonsInSameRow[buttonIndex + 1];
          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === project.id
                ? {
                    ...p,
                    menus: p.menus.map((m) =>
                      m.id === menuId
                        ? {
                            ...m,
                            buttons: m.buttons.map((b) => {
                              if (b.id === buttonId) return { ...b, order: nextButton.order };
                              if (b.id === nextButton.id) return { ...b, order: button.order };
                              return b;
                            }),
                          }
                        : m
                    ),
                    updatedAt: new Date(),
                  }
                : p
            ),
            justMovedButtonId: buttonId,
          }));
          setTimeout(() => set({ justMovedButtonId: null }), 1000);
          return;
        } else {
          return;
        }

        const buttonsInNewRow = menu.buttons.filter((b) => b.row === newRow);
        const newOrderInRow = buttonsInNewRow.length;

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === project.id
              ? {
                  ...p,
                  menus: p.menus.map((m) =>
                    m.id === menuId
                      ? {
                          ...m,
                          buttons: m.buttons.map((b) =>
                            b.id === buttonId ? { ...b, row: newRow, order: newOrderInRow } : b
                          ),
                        }
                      : m
                  ),
                  updatedAt: new Date(),
                }
              : p
          ),
          justMovedButtonId: buttonId,
        }));
        setTimeout(() => set({ justMovedButtonId: null }), 1000);
      },

      addAction: (menuId, buttonId, action) => {
        const project = get().getCurrentProject();
        if (!project) return;

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === project.id
              ? {
                  ...p,
                  menus: p.menus.map((m) =>
                    m.id === menuId
                      ? {
                          ...m,
                          buttons: m.buttons.map((b) =>
                            b.id === buttonId
                              ? { ...b, actions: [...b.actions, action] }
                              : b
                          ),
                        }
                      : m
                  ),
                  updatedAt: new Date(),
                }
              : p
          ),
        }));
      },

      updateAction: (menuId, buttonId, actionId, updates) => {
        const project = get().getCurrentProject();
        if (!project) return;

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === project.id
              ? {
                  ...p,
                  menus: p.menus.map((m) =>
                    m.id === menuId
                      ? {
                          ...m,
                          buttons: m.buttons.map((b) =>
                            b.id === buttonId
                              ? {
                                  ...b,
                                  actions: b.actions.map((a) =>
                                    a.id === actionId ? { ...a, ...updates } : a
                                  ),
                                }
                              : b
                          ),
                        }
                      : m
                  ),
                  updatedAt: new Date(),
                }
              : p
          ),
        }));
      },

      deleteAction: (menuId, buttonId, actionId) => {
        const project = get().getCurrentProject();
        if (!project) return;

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === project.id
              ? {
                  ...p,
                  menus: p.menus.map((m) =>
                    m.id === menuId
                      ? {
                          ...m,
                          buttons: m.buttons.map((b) =>
                            b.id === buttonId
                              ? {
                                  ...b,
                                  actions: b.actions.filter((a) => a.id !== actionId),
                                }
                              : b
                          ),
                        }
                      : m
                  ),
                  updatedAt: new Date(),
                }
              : p
          ),
        }));
      },

      compactButtonRows: (menuId) => {
        const project = get().getCurrentProject();
        if (!project) return;

        const menu = project.menus.find((m) => m.id === menuId);
        if (!menu) return;

        const usedRows = [...new Set(menu.buttons.map((b) => b.row))].sort((a, b) => a - b);
        const rowMapping = new Map<number, number>();
        usedRows.forEach((oldRow, index) => rowMapping.set(oldRow, index));

        const compactedButtons = menu.buttons.map((b) => ({
          ...b,
          row: rowMapping.get(b.row) ?? b.row,
        }));

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === project.id
              ? {
                  ...p,
                  menus: p.menus.map((m) =>
                    m.id === menuId ? { ...m, buttons: compactedButtons } : m
                  ),
                  updatedAt: new Date(),
                }
              : p
          ),
        }));
      },

      addActionNode: (type, position) => {
        const project = get().getCurrentProject();
        if (!project) return null;

        if ((project.actionNodes || []).length >= MAX_ACTION_NODES_PER_PROJECT) {
          console.warn(`Maximum action node limit reached (${MAX_ACTION_NODES_PER_PROJECT})`);
          return null;
        }

        // Initialize outcomes for multi-output actions
        const isMultiOutput = type === 'random_result' || type === 'weighted_random';
        const defaultOutcomeCount = 2;

        const actionNode: BotActionNode = {
          id: uuidv4(),
          type,
          config: type === 'random_result' 
            ? { outcomeCount: defaultOutcomeCount } 
            : type === 'weighted_random'
              ? { outcomes: [
                  { id: uuidv4(), weight: 50, label: '' },
                  { id: uuidv4(), weight: 50, label: '' },
                ] }
              : {},
          position,
          outcomes: isMultiOutput
            ? Array.from({ length: defaultOutcomeCount }, () => ({ id: uuidv4() }))
            : undefined,
        };

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === project.id
              ? {
                  ...p,
                  actionNodes: [...(p.actionNodes || []), actionNode],
                  updatedAt: new Date(),
                }
              : p
          ),
          selectedActionNodeId: actionNode.id,
        }));

        return actionNode;
      },

      updateActionNode: (actionNodeId, updates) => {
        const project = get().getCurrentProject();
        if (!project) return;

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === project.id
              ? {
                  ...p,
                  actionNodes: (p.actionNodes || []).map((an) => {
                    if (an.id !== actionNodeId) return an;
                    
                    const updatedNode = { ...an, ...updates };
                    
                    // Sync outcomes array when outcomeCount changes for random_result
                    if (updatedNode.type === 'random_result' && updates.config?.outcomeCount !== undefined) {
                      const newCount = updates.config.outcomeCount;
                      const currentOutcomes = updatedNode.outcomes || [];
                      
                      if (newCount > currentOutcomes.length) {
                        // Add new outcomes
                        const newOutcomes = Array.from(
                          { length: newCount - currentOutcomes.length },
                          () => ({ id: uuidv4() })
                        );
                        updatedNode.outcomes = [...currentOutcomes, ...newOutcomes];
                      } else if (newCount < currentOutcomes.length) {
                        // Remove excess outcomes
                        updatedNode.outcomes = currentOutcomes.slice(0, newCount);
                      }
                    }
                    
                    // Sync outcomes array when outcomes change for weighted_random
                    if (updatedNode.type === 'weighted_random' && updates.config?.outcomes !== undefined) {
                      const configOutcomes = updates.config.outcomes;
                      const currentOutcomes = updatedNode.outcomes || [];
                      
                      if (configOutcomes.length !== currentOutcomes.length) {
                        // Rebuild outcomes array to match config
                        updatedNode.outcomes = configOutcomes.map((o: any, i: number) => ({
                          id: o.id || currentOutcomes[i]?.id || uuidv4(),
                          targetId: currentOutcomes[i]?.targetId,
                          targetType: currentOutcomes[i]?.targetType,
                        }));
                      }
                    }
                    
                    return updatedNode;
                  }),
                  updatedAt: new Date(),
                }
              : p
          ),
        }));
      },

      deleteActionNode: (actionNodeId) => {
        const project = get().getCurrentProject();
        if (!project) return;

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === project.id
              ? {
                  ...p,
                  actionNodes: (p.actionNodes || []).filter((an) => an.id !== actionNodeId),
                  menus: p.menus.map((m) => ({
                    ...m,
                    buttons: m.buttons.map((b) =>
                      b.targetActionId === actionNodeId
                        ? { ...b, targetActionId: undefined }
                        : b
                    ),
                  })),
                  updatedAt: new Date(),
                }
              : p
          ),
          selectedActionNodeId:
            state.selectedActionNodeId === actionNodeId ? null : state.selectedActionNodeId,
        }));
      },

      duplicateActionNode: (actionNodeId) => {
        const project = get().getCurrentProject();
        if (!project) return null;

        const originalNode = (project.actionNodes || []).find((an) => an.id === actionNodeId);
        if (!originalNode) return null;

        const duplicatedNode: BotActionNode = {
          id: uuidv4(),
          type: originalNode.type,
          config: { ...originalNode.config },
          position: {
            x: originalNode.position.x + 50,
            y: originalNode.position.y + 50,
          },
        };

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === project.id
              ? {
                  ...p,
                  actionNodes: [...(p.actionNodes || []), duplicatedNode],
                  updatedAt: new Date(),
                }
              : p
          ),
          selectedActionNodeId: duplicatedNode.id,
        }));

        return duplicatedNode;
      },

      setSelectedActionNode: (actionNodeId) => {
        set({ selectedActionNodeId: actionNodeId });
      },
    }),
    {
      name: 'bot-builder-storage',
    }
  )
);
