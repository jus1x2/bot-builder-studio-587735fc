import { BotProject } from '@/types/bot';

export interface PurchaseRequest {
  project_id?: string;
  name: string;
  email: string;
  telegram?: string;
  comment?: string;
}

// Mock service - работает с localStorage, можно заменить на реальный Supabase
export const supabaseService = {
  async getProjects(): Promise<BotProject[]> {
    // Возвращаем пустой массив - проекты хранятся в zustand store
    return [];
  },

  async getProject(id: string): Promise<BotProject | null> {
    // Проект получается из zustand store
    return null;
  },

  async createProject(project: BotProject): Promise<BotProject | null> {
    return project;
  },

  async updateProject(id: string, updates: Partial<BotProject>): Promise<boolean> {
    return true;
  },

  async deleteProject(id: string): Promise<boolean> {
    return true;
  },

  async createPurchaseRequest(request: PurchaseRequest): Promise<boolean> {
    console.log('Purchase request:', request);
    return true;
  },
};
