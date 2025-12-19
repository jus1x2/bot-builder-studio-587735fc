import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, ArrowRight, FileText, ShoppingCart, HelpCircle, Headphones, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProjectStore } from '@/stores/projectStore';
import { TEMPLATES } from '@/lib/bot-templates';

const templateIcons: Record<string, React.ElementType> = {
  FileText,
  ShoppingCart,
  HelpCircle,
  Headphones,
  TrendingUp,
};

export function WelcomeScreen() {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
  const { createProject, projects } = useProjectStore();

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleCreateProject = () => {
    const project = createProject('Новый бот', 'Мой телеграм бот', selectedTemplate);
    navigate(`/builder/${project.id}`);
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden safe-area-top safe-area-bottom">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute bottom-1/4 -right-32 w-96 h-96 bg-telegram-blue/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <AnimatePresence>
          {showContent && (
            <>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', duration: 0.8 }}
                className="relative mb-6"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-telegram-blue flex items-center justify-center shadow-lg">
                  <Bot className="w-10 h-10 text-primary-foreground" />
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-telegram-green flex items-center justify-center"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-8"
              >
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                  Bot Builder Studio
                </h1>
                <p className="text-muted-foreground text-lg max-w-md">
                  Создавайте Telegram-ботов визуально, без программирования
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="w-full max-w-sm space-y-4"
              >
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground text-center mb-3">Выберите шаблон</p>
                  <div className="grid grid-cols-2 gap-2">
                    {TEMPLATES.map((template) => {
                      const IconComponent = templateIcons[template.icon] || FileText;
                      return (
                        <button
                          key={template.id}
                          onClick={() => setSelectedTemplate(template.id)}
                          className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                            selectedTemplate === template.id
                              ? 'border-primary bg-primary/5 shadow-md'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                              selectedTemplate === template.id
                                ? 'bg-primary/15 text-primary'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              <IconComponent className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-sm font-medium text-foreground">{template.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground pl-8">{template.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button
                  onClick={handleCreateProject}
                  className="w-full h-12 telegram-button text-base"
                >
                  Создать бота
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>

                {projects.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => navigate('/projects')}
                    className="w-full h-10"
                  >
                    Мои проекты ({projects.length})
                  </Button>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
