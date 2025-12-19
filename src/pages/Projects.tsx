import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Trash2, Copy, ChevronLeft, Bot, Calendar, Loader2 } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { Button } from '@/components/ui/button';
import { useTelegram } from '@/contexts/TelegramContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Projects() {
  const navigate = useNavigate();
  const { projects, deleteProject, duplicateProject, setCurrentProject } = useProjectStore();
  const { isLoading: isTgLoading, isTelegramWebApp, telegramUser, profile } = useTelegram();

  const handleOpenProject = (projectId: string) => {
    setCurrentProject(projectId);
    navigate(`/builder/${projectId}`);
  };

  const handleDuplicate = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    duplicateProject(projectId);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isTgLoading && isTelegramWebApp) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background safe-area-top safe-area-bottom" style={{ minHeight: 'var(--tg-viewport-stable-height, 100vh)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-semibold text-foreground">Мои проекты</h1>
            </div>
            <div className="flex items-center gap-3">
              {telegramUser && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground hidden sm:block">
                    {telegramUser.first_name}
                  </span>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={profile?.photo_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {telegramUser.first_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              <Button onClick={() => navigate('/')} className="telegram-button">
                <Plus className="w-4 h-4 mr-2" />
                Новый проект
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Projects list */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-lg font-medium text-foreground mb-2">Нет проектов</h2>
            <p className="text-muted-foreground mb-6">Создайте свой первый Telegram-бот</p>
            <Button onClick={() => navigate('/')} className="telegram-button">
              <Plus className="w-4 h-4 mr-2" />
              Создать проект
            </Button>
          </motion.div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
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
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {project.menus.length} меню
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => handleDuplicate(e, project.id)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Удалить проект?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Вы уверены, что хотите удалить проект "{project.name}"? Это действие нельзя отменить.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteProject(project.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Удалить
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {project.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(project.updatedAt)}
                  </div>
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    project.status === 'draft' ? 'bg-muted text-muted-foreground' :
                    project.status === 'testing' ? 'bg-telegram-orange/20 text-telegram-orange' :
                    project.status === 'completed' ? 'bg-telegram-green/20 text-telegram-green' :
                    'bg-primary/20 text-primary'
                  }`}>
                    {project.status === 'draft' ? 'Черновик' :
                     project.status === 'testing' ? 'Тестирование' :
                     project.status === 'completed' ? 'Готов' : 'Экспортирован'}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
