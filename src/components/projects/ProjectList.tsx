import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Bot,
  MoreVertical,
  Copy,
  Trash2,
  Clock,
  Zap,
  ShoppingBag,
  HelpCircle,
  Users,
  Filter,
} from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const templates = [
  {
    id: 'blank',
    name: 'Пустой бот',
    description: 'Начните с чистого листа',
    icon: Bot,
    color: 'bg-primary/10 text-primary',
  },
  {
    id: 'shop',
    name: 'Магазин',
    description: 'Каталог, корзина, оплата',
    icon: ShoppingBag,
    color: 'bg-telegram-green/10 text-telegram-green',
  },
  {
    id: 'quiz',
    name: 'Квиз / Опрос',
    description: 'Вопросы с вариантами',
    icon: HelpCircle,
    color: 'bg-telegram-orange/10 text-telegram-orange',
  },
  {
    id: 'support',
    name: 'Поддержка',
    description: 'FAQ и обратная связь',
    icon: Users,
    color: 'bg-accent/10 text-accent',
  },
  {
    id: 'funnel',
    name: 'Воронка',
    description: 'Сбор лидов и конверсия',
    icon: Filter,
    color: 'bg-destructive/10 text-destructive',
  },
];

export function ProjectList() {
  const navigate = useNavigate();
  const { projects, createProject, duplicateProject, deleteProject, setCurrentProject } =
    useProjectStore();
  const [showNewProject, setShowNewProject] = useState(false);

  const handleCreateProject = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    const project = createProject(template?.name || 'Новый проект', undefined, templateId);
    setCurrentProject(project.id);
    navigate(`/builder/${project.id}`);
  };

  const handleOpenProject = (projectId: string) => {
    setCurrentProject(projectId);
    navigate(`/builder/${projectId}`);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background safe-area-top safe-area-bottom">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-telegram-blue-light flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Bot Architect</h1>
              <p className="text-xs text-muted-foreground">Мои проекты</p>
            </div>
          </div>
          <Button onClick={() => setShowNewProject(true)} className="telegram-button">
            <Plus className="w-4 h-4 mr-2" />
            Создать
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-muted flex items-center justify-center">
              <Bot className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Нет проектов
            </h2>
            <p className="text-muted-foreground mb-6">
              Создайте своего первого Telegram-бота без кода
            </p>
            <Button onClick={() => setShowNewProject(true)} className="telegram-button">
              <Plus className="w-4 h-4 mr-2" />
              Создать первый бот
            </Button>
          </motion.div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleOpenProject(project.id)}
                className="project-card group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-telegram-blue-light/20 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-primary" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
                      >
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateProject(project.id);
                        }}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Дублировать
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProject(project.id);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <h3 className="text-base font-semibold text-foreground mb-1">
                  {project.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {project.description || `${project.menus.length} экранов`}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(project.updatedAt)}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full ${
                      project.status === 'draft'
                        ? 'bg-muted text-muted-foreground'
                        : project.status === 'testing'
                        ? 'bg-telegram-orange/10 text-telegram-orange'
                        : 'bg-telegram-green/10 text-telegram-green'
                    }`}
                  >
                    {project.status === 'draft'
                      ? 'Черновик'
                      : project.status === 'testing'
                      ? 'Тестируется'
                      : 'Готов'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* New Project Modal */}
      <AnimatePresence>
        {showNewProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
            onClick={() => setShowNewProject(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-card rounded-t-3xl sm:rounded-3xl border border-border p-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-6 sm:hidden" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Новый проект
              </h2>
              <p className="text-muted-foreground mb-6">
                Выберите шаблон или начните с чистого листа
              </p>

              <div className="grid gap-3">
                {templates.map((template) => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={template.id}
                      onClick={() => handleCreateProject(template.id)}
                      className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/50 transition-all text-left"
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${template.color}`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">
                          {template.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {template.description}
                        </p>
                      </div>
                      <Zap className="w-4 h-4 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
