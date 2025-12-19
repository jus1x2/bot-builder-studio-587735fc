import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Plus, Eye, Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { useProjectStore } from '@/stores/projectStore';
import { Button } from '@/components/ui/button';

export default function Builder() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { projects, setCurrentProject, getCurrentProject, addMenu } = useProjectStore();

  useEffect(() => {
    if (projectId) setCurrentProject(projectId);
  }, [projectId, setCurrentProject]);

  const project = useMemo(() => {
    if (projectId) return projects.find((p) => p.id === projectId) || null;
    return getCurrentProject();
  }, [projectId, projects, getCurrentProject]);

  useEffect(() => {
    if (projectId && !project) {
      navigate('/projects');
    }
  }, [projectId, project, navigate]);

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка проекта...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-foreground">{project.name}</h1>
              <p className="text-xs text-muted-foreground">{project.menus.length} меню</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Превью
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative bg-muted/30">
        <div className="absolute inset-0 overflow-auto p-8">
          <div className="min-h-full flex flex-wrap gap-4 items-start content-start">
            {project.menus.map((menu, index) => (
              <motion.div
                key={menu.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="builder-node w-64"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${menu.id === project.rootMenuId ? 'bg-telegram-green' : 'bg-primary/50'}`} />
                  <span className="font-medium text-sm text-foreground truncate">{menu.name}</span>
                  {menu.id === project.rootMenuId && (
                    <span className="text-[10px] bg-telegram-green/20 text-telegram-green px-1.5 py-0.5 rounded-full">
                      Главное
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {menu.messageText}
                </p>

                <div className="space-y-1">
                  {menu.buttons.map((button) => (
                    <div
                      key={button.id}
                      className="bot-preview-button text-xs py-1.5"
                    >
                      {button.text}
                    </div>
                  ))}
                  {menu.buttons.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Нет кнопок
                    </p>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Add menu button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => addMenu()}
              className="w-64 h-40 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 transition-colors group"
            >
              <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                Добавить меню
              </span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
