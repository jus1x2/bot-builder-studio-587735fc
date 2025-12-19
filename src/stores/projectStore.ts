import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { BotProject, BotMenu, BotButton, BotActionNode, ActionType, MAX_MENUS_PER_PROJECT, MAX_BUTTONS_PER_MENU } from '@/types/bot';
import { createTemplateProject } from '@/lib/bot-templates';

interface ProjectStore {
  projects: BotProject[];
  currentProjectId: string | null;
  currentMenuId: string | null;
  selectedButtonId: string | null;

  createProject: (name: string, description?: string, templateId?: string) => BotProject;
  deleteProject: (projectId: string) => void;
  duplicateProject: (projectId: string) => BotProject | null;
  setCurrentProject: (projectId: string | null) => void;
  getCurrentProject: () => BotProject | null;

  addMenu: (parentId?: string) => BotMenu | null;
  updateMenu: (menuId: string, updates: Partial<BotMenu>) => void;
  deleteMenu: (menuId: string) => void;
  duplicateMenu: (menuId: string) => BotMenu | null;
  setCurrentMenu: (menuId: string | null) => void;
  getCurrentMenu: () => BotMenu | null;

  addButton: (menuId: string, row?: number) => BotButton | null;
  updateButton: (menuId: string, buttonId: string, updates: Partial<BotButton>) => void;
  deleteButton: (menuId: string, buttonId: string) => void;
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

        const newProject: BotProject = {
          ...project,
          id: uuidv4(),
          name: `${project.name} (копия)`,
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
        });
      },

      getCurrentProject: () => {
        const { projects, currentProjectId } = get();
        return projects.find((p) => p.id === currentProjectId) || null;
      },

      addMenu: (parentId) => {
        const project = get().getCurrentProject();
        if (!project || project.menus.length >= MAX_MENUS_PER_PROJECT) return null;

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
            return {
              ...p,
              menus: p.menus.filter((m) => m.id !== menuId),
              updatedAt: new Date(),
            };
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
          buttons: menuToDuplicate.buttons.map((b) => ({ ...b, id: uuidv4() })),
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

      setCurrentMenu: (menuId) => set({ currentMenuId: menuId }),

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
        }));
      },
    }),
    {
      name: 'bot-builder-projects',
    }
  )
);
