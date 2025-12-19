import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Upload, X, FileJson, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProjectStore } from '@/stores/projectStore';
import { exportProjectToJSON, importProjectFromJSON, downloadJSON, readFileAsText } from '@/lib/export-utils';
import { useToast } from '@/hooks/use-toast';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportImportModal({ isOpen, onClose }: ExportImportModalProps) {
  const { toast } = useToast();
  const { getCurrentProject, projects } = useProjectStore();
  const [mode, setMode] = useState<'export' | 'import'>('export');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const project = getCurrentProject();

  const handleExport = () => {
    if (!project) {
      toast({
        title: 'Ошибка',
        description: 'Нет активного проекта для экспорта',
        variant: 'destructive',
      });
      return;
    }

    const json = exportProjectToJSON(project);
    const filename = `${project.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    downloadJSON(json, filename);

    toast({
      title: 'Экспорт завершён',
      description: `Файл ${filename} скачан`,
    });
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await readFileAsText(file);
      const importedProject = importProjectFromJSON(content);

      if (importedProject) {
        // Add to store
        useProjectStore.setState((state) => ({
          projects: [...state.projects, importedProject],
          currentProjectId: importedProject.id,
          currentMenuId: importedProject.rootMenuId,
        }));

        setImportStatus('success');
        toast({
          title: 'Импорт успешен',
          description: `Проект "${importedProject.name}" добавлен`,
        });

        setTimeout(() => {
          onClose();
          setImportStatus('idle');
        }, 1500);
      } else {
        setImportStatus('error');
        toast({
          title: 'Ошибка импорта',
          description: 'Неверный формат файла',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setImportStatus('error');
      toast({
        title: 'Ошибка',
        description: 'Не удалось прочитать файл',
        variant: 'destructive',
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card rounded-2xl border border-border p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                Экспорт / Импорт
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setMode('export')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                  mode === 'export'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <Download className="w-4 h-4" />
                Экспорт
              </button>
              <button
                onClick={() => setMode('import')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                  mode === 'import'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <Upload className="w-4 h-4" />
                Импорт
              </button>
            </div>

            {/* Content */}
            {mode === 'export' ? (
              <div className="space-y-4">
                {project ? (
                  <>
                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <FileJson className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">{project.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {project.menus.length} меню • {project.menus.reduce((acc, m) => acc + m.buttons.length, 0)} кнопок
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button onClick={handleExport} className="w-full telegram-button">
                      <Download className="w-4 h-4 mr-2" />
                      Скачать JSON
                    </Button>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Откройте проект для экспорта
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-8 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center gap-3"
                >
                  {importStatus === 'idle' && (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-foreground">Выберите файл</p>
                        <p className="text-sm text-muted-foreground">JSON файл проекта</p>
                      </div>
                    </>
                  )}
                  {importStatus === 'success' && (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-telegram-green/10 flex items-center justify-center">
                        <Check className="w-8 h-8 text-telegram-green" />
                      </div>
                      <p className="font-medium text-telegram-green">Импорт успешен!</p>
                    </>
                  )}
                  {importStatus === 'error' && (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-destructive" />
                      </div>
                      <p className="font-medium text-destructive">Ошибка импорта</p>
                    </>
                  )}
                </button>

                <p className="text-xs text-muted-foreground text-center">
                  Поддерживается формат экспорта Bot Architect
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
