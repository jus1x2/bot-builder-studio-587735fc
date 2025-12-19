import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { BotProject, BotMenu, BotButton, BotAction, BotActionNode, ActionType, MAX_MENUS_PER_PROJECT, MAX_BUTTONS_PER_MENU, MAX_BUTTONS_PER_ROW, MAX_ACTION_NODES_PER_PROJECT } from '@/types/bot';
import { createTemplateProject } from '@/lib/bot-templates';

interface ProjectStore {
  projects: BotProject[];
  currentProjectId: string | null;
  currentMenuId: string | null;
  selectedButtonId: string | null;
  selectedActionNodeId: string | null;
  justMovedButtonId: string | null;

  createProject: (name: string, description?: string, templateId?: string) => BotProject;
  deleteProject: (projectId: string) => void;
  duplicateProject: (projectId: string) => BotProject | null;
  setCurrentProject: (projectId: string | null) => void;
  getCurrentProject: () => BotProject | null;
  restoreProject: (project: BotProject) => void;

  addMenu: (parentId?: string) => BotMenu | null;
  updateMenu: (menuId: string, updates: Partial<BotMenu>) => void;
  deleteMenu: (menuId: string) => void;
  duplicateMenu: (menuId: string) => BotMenu | null;
  setCurrentMenu: (menuId: string | null) => void;
  getCurrentMenu: () => BotMenu | null;

  addButton: (menuId: string, row?: number) => BotButton | null;
  updateButton: (menuId: string, buttonId: string, updates: Partial<BotButton>) => void;
  deleteButton: (menuId: string, buttonId: string) => void;
  setSelectedButton: (buttonId: string | null) => void;
  moveButton: (menuId: string, buttonId: string, direction: 'up' | 'down' | 'left' | 'right') => void;
  compactButtonRows: (menuId: string) => void;

  addAction: (menuId: string, buttonId: string, actionType: ActionType) => BotAction | null;
  updateAction: (menuId: string, buttonId: string, actionId: string, updates: Partial<BotAction>) => void;
  deleteAction: (menuId: string, buttonId: string, actionId: string) => void;

  addActionNode: (type: ActionType, position?: { x: number; y: number }) => BotActionNode | null;
  updateActionNode: (nodeId: string, updates: Partial<BotActionNode>) => void;
  deleteActionNode: (nodeId: string) => void;
  duplicateActionNode: (nodeId: string) => BotActionNode | null;
  setSelectedActionNode: (nodeId: string | null) => void;
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

const createDefaultAction = (type: ActionType, order: number): BotAction => ({
  id: uuidv4(),
  type,
  order,
  config: {},
});

const createDefaultActionNode = (type: ActionType, position: { x: number; y: number }): BotActionNode => ({
  id: uuidv4(),
  type,
  config: {},
  position,
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

      createProject: (name, description, templateId = 'blank') => {
        const project = createTemplateProject(templateId, name, description);
        set((state) => ({
          projects: [...state.projects, project],
          currentProjectId: project.id,
          currentMenuId: project.rootMenuId,
        }));
        return project;
      },

      deleteProject: (projectId) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
          currentProjectId: state.currentProjectId === projectId ? null : state.currentProjectId,
        }));
      },

      duplicateProject: (projectId) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (!project) return null;

        const menuIdMap = new Map<string, string>();
        project.menus.forEach((m) => menuIdMap.set(m.id, uuidv4()));

        const newMenus = project.menus.map((m) => ({
          ...m,
          id: menuIdMap.get(m.id)!,
          parentId: m.parentId ? menuIdMap.get(m.parentId) : undefined,
          buttons: m.buttons.map((b) => ({
            ...b,
            id: uuidv4(),
            targetMenuId: b.targetMenuId ? menuIdMap.get(b.targetMenuId) : undefined,
          })),
        }));

        const newProject: BotProject = {
          ...project,
          id: uuidv4(),
          name: `${project.name} (копия)`,
          menus: newMenus,
          rootMenuId: menuIdMap.get(project.rootMenuId)!,
          actionNodes: project.actionNodes?.map((an) => ({ ...an, id: uuidv4() })),
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'draft',
        };

        set((state) => ({ projects: [...state.projects, newProject] }));
        return newProject;
      },

      setCurrentProject: (projectId) => {
        const project = get().projects.find((p) => p.id === projectId);
        set({
          currentProjectId: projectId,
          currentMenuId: project?.rootMenuId || null,
          selectedButtonId: null,
          selectedActionNodeId: null,
        });
      },

      getCurrentProject: () => {
        const { projects, currentProjectId } = get();
        return projects.find((p) => p.id === currentProjectId) || null;
      },

      restoreProject: (project) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === project.id ? project : p
          ),
        }));
      },

      addMenu: (parentId) => {
        const project = get().getCurrentProject();
        if (!project || project.menus.length >= MAX_MENUS_PER_PROJECT) return null;

        const lastMenu = project.menus[project.menus.length - 1];
        const menu = createDefaultMenu('Новое меню', parentId);
        menu.position = {
          x: (lastMenu?.position?.x || 0) + 350,
          y: lastMenu?.position?.y || 100,
        };

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
            const updatedMenus = p.menus
              .filter((m) => m.id !== menuId)
              .map((m) => ({
                ...m,
                buttons: m.buttons.map((b) =>
                  b.targetMenuId === menuId ? { ...b, targetMenuId: undefined } : b
                ),
              }));
            return { ...p, menus: updatedMenus, updatedAt: new Date() };
          }),
          currentMenuId: state.currentMenuId === menuId ? project.rootMenuId : state.currentMenuId,
        }));
      },

      duplicateMenu: (menuId) => {
        const project = get().getCurrentProject();
        if (!project) return null;

        const menuToDuplicate = project.menus.find((m) => m.id === menuId);
        if (!menuToDuplicate) return null;

        const newMenu: BotMenu = {
          ...menuToDuplicate,
          id: uuidv4(),
          name: `${menuToDuplicate.name} (копия)`,
          buttons: menuToDuplicate.buttons.map((b) => ({
            ...b,
            id: uuidv4(),
            actions: b.actions.map((a) => ({ ...a, id: uuidv4() })),
          })),
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

      setCurrentMenu: (menuId) => set({ currentMenuId: menuId, selectedButtonId: null }),

      getCurrentMenu: () => {
        const project = get().getCurrentProject();
        if (!project) return null;
        return project.menus.find((m) => m.id === get().currentMenuId) || null;
      },

      addButton: (menuId, row = 0) => {
        const project = get().getCurrentProject();
        if (!project) return null;

        const menu = project.menus.find((m) => m.id === menuId);
        if (!menu || menu.buttons.length >= MAX_BUTTONS_PER_MENU) return null;

        const buttonsInRow = menu.buttons.filter((b) => b.row === row);
        if (buttonsInRow.length >= MAX_BUTTONS_PER_ROW) return null;

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

      setSelectedButton: (buttonId) => set({ selectedButtonId: buttonId }),

      moveButton: (menuId, buttonId, direction) => {
        const project = get().getCurrentProject();
        if (!project) return;

        const menu = project.menus.find((m) => m.id === menuId);
        if (!menu) return;

        const button = menu.buttons.find((b) => b.id === buttonId);
        if (!button) return;

        let newRow = button.row;
        let newOrder = button.order;

        const buttonsInCurrentRow = menu.buttons.filter((b) => b.row === button.row).sort((a, b) => a.order - b.order);

        switch (direction) {
          case 'up':
            if (button.row > 0) newRow = button.row - 1;
            break;
          case 'down':
            newRow = button.row + 1;
            break;
          case 'left':
            if (button.order > 0) {
              const prevButton = buttonsInCurrentRow.find((b) => b.order === button.order - 1);
              if (prevButton) {
                newOrder = prevButton.order;
                get().updateButton(menuId, prevButton.id, { order: button.order });
              }
            }
            break;
          case 'right':
            if (button.order < buttonsInCurrentRow.length - 1) {
              const nextButton = buttonsInCurrentRow.find((b) => b.order === button.order + 1);
              if (nextButton) {
                newOrder = nextButton.order;
                get().updateButton(menuId, nextButton.id, { order: button.order });
              }
            }
            break;
        }

        if (direction === 'up' || direction === 'down') {
          const buttonsInNewRow = menu.buttons.filter((b) => b.row === newRow);
          if (buttonsInNewRow.length >= MAX_BUTTONS_PER_ROW) return;
          newOrder = buttonsInNewRow.length;
        }

        get().updateButton(menuId, buttonId, { row: newRow, order: newOrder });
        set({ justMovedButtonId: buttonId });
        setTimeout(() => set({ justMovedButtonId: null }), 500);
      },

      compactButtonRows: (menuId) => {
        const project = get().getCurrentProject();
        if (!project) return;

        const menu = project.menus.find((m) => m.id === menuId);
        if (!menu) return;

        const rows = new Map<number, BotButton[]>();
        menu.buttons.forEach((b) => {
          if (!rows.has(b.row)) rows.set(b.row, []);
          rows.get(b.row)!.push(b);
        });

        const sortedRowKeys = Array.from(rows.keys()).sort((a, b) => a - b);
        const updatedButtons: BotButton[] = [];

        sortedRowKeys.forEach((oldRow, newRow) => {
          const buttonsInRow = rows.get(oldRow)!.sort((a, b) => a.order - b.order);
          buttonsInRow.forEach((b, order) => {
            updatedButtons.push({ ...b, row: newRow, order });
          });
        });

        get().updateMenu(menuId, { buttons: updatedButtons });
      },

      addAction: (menuId, buttonId, actionType) => {
        const project = get().getCurrentProject();
        if (!project) return null;

        const menu = project.menus.find((m) => m.id === menuId);
        if (!menu) return null;

        const button = menu.buttons.find((b) => b.id === buttonId);
        if (!button) return null;

        const action = createDefaultAction(actionType, button.actions.length);

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

        return action;
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
                              ? { ...b, actions: b.actions.filter((a) => a.id !== actionId) }
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

      addActionNode: (type, position = { x: 100, y: 100 }) => {
        const project = get().getCurrentProject();
        if (!project) return null;
        if ((project.actionNodes || []).length >= MAX_ACTION_NODES_PER_PROJECT) return null;

        const actionNode = createDefaultActionNode(type, position);

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

      updateActionNode: (nodeId, updates) => {
        const project = get().getCurrentProject();
        if (!project) return;

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === project.id
              ? {
                  ...p,
                  actionNodes: (p.actionNodes || []).map((an) =>
                    an.id === nodeId ? { ...an, ...updates } : an
                  ),
                  updatedAt: new Date(),
                }
              : p
          ),
        }));
      },

      deleteActionNode: (nodeId) => {
        const project = get().getCurrentProject();
        if (!project) return;

        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== project.id) return p;
            const updatedMenus = p.menus.map((m) => ({
              ...m,
              buttons: m.buttons.map((b) =>
                b.targetActionId === nodeId ? { ...b, targetActionId: undefined } : b
              ),
            }));
            const updatedActionNodes = (p.actionNodes || [])
              .filter((an) => an.id !== nodeId)
              .map((an) =>
                an.nextNodeId === nodeId ? { ...an, nextNodeId: undefined, nextNodeType: undefined } : an
              );
            return { ...p, menus: updatedMenus, actionNodes: updatedActionNodes, updatedAt: new Date() };
          }),
          selectedActionNodeId:
            state.selectedActionNodeId === nodeId ? null : state.selectedActionNodeId,
        }));
      },

      duplicateActionNode: (nodeId) => {
        const project = get().getCurrentProject();
        if (!project) return null;

        const nodeToDuplicate = project.actionNodes?.find((an) => an.id === nodeId);
        if (!nodeToDuplicate) return null;

        const newNode: BotActionNode = {
          ...nodeToDuplicate,
          id: uuidv4(),
          position: {
            x: nodeToDuplicate.position.x + 50,
            y: nodeToDuplicate.position.y + 50,
          },
          nextNodeId: undefined,
          nextNodeType: undefined,
        };

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === project.id
              ? {
                  ...p,
                  actionNodes: [...(p.actionNodes || []), newNode],
                  updatedAt: new Date(),
                }
              : p
          ),
          selectedActionNodeId: newNode.id,
        }));

        return newNode;
      },

      setSelectedActionNode: (nodeId) => set({ selectedActionNodeId: nodeId, selectedButtonId: null }),
    }),
    {
      name: 'bot-builder-projects',
    }
  )
);
