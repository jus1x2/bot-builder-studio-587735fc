import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bot, Key, Link2, Play, CheckCircle, AlertCircle, Loader2, ExternalLink, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useProjectStore } from '@/stores/projectStore';

interface TelegramConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'token' | 'connecting' | 'success' | 'error';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ghjyaaddstjoqcnljzeb.supabase.co';

const getWebhookUrl = (projectId: string) => 
  `${SUPABASE_URL}/functions/v1/telegram-webhook/${projectId}`;

export function TelegramConnectModal({ isOpen, onClose }: TelegramConnectModalProps) {
  const { toast } = useToast();
  const { getCurrentProject, updateProject } = useProjectStore();
  const project = getCurrentProject();

  const [step, setStep] = useState<Step>('token');
  const [botToken, setBotToken] = useState('');
  const [botInfo, setBotInfo] = useState<{ username: string; name: string } | null>(null);

  // Load existing bot connection on open
  useEffect(() => {
    if (isOpen && project?.telegramBotToken && project?.telegramBotUsername) {
      setBotToken(project.telegramBotToken);
      setBotInfo({
        username: project.telegramBotUsername,
        name: project.telegramBotUsername,
      });
      setStep('success');
    }
  }, [isOpen, project?.telegramBotToken, project?.telegramBotUsername]);

  const handleConnect = async () => {
    if (!botToken.trim()) {
      toast({
        title: 'Введите токен',
        description: 'Токен бота обязателен для подключения',
        variant: 'destructive',
      });
      return;
    }

    setStep('connecting');

    try {
      // Validate token by calling Telegram API
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const data = await response.json();

      if (data.ok) {
        setBotInfo({
          username: data.result.username,
          name: data.result.first_name,
        });

        // Save bot token and username to project
        if (project) {
          updateProject(project.id, {
            telegramBotToken: botToken,
            telegramBotUsername: data.result.username,
          });

          // Set up webhook with Telegram
          const webhookUrl = getWebhookUrl(project.id);
          const webhookResponse = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: webhookUrl }),
          });
          const webhookData = await webhookResponse.json();
          
          if (!webhookData.ok) {
            console.warn('Failed to set webhook:', webhookData);
          }
        }

        setStep('success');

        toast({
          title: 'Бот подключён!',
          description: `@${data.result.username} готов к тестированию`,
        });
      } else {
        setStep('error');
        toast({
          title: 'Ошибка подключения',
          description: data.description || 'Неверный токен бота',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setStep('error');
      toast({
        title: 'Ошибка сети',
        description: 'Не удалось подключиться к Telegram API',
        variant: 'destructive',
      });
    }
  };

  const handleCopyWebhookUrl = () => {
    if (!project) return;
    const webhookUrl = getWebhookUrl(project.id);
    navigator.clipboard.writeText(webhookUrl);
    toast({
      title: 'Скопировано',
      description: 'URL webhook скопирован в буфер обмена',
    });
  };

  const handleOpenBot = () => {
    if (botInfo) {
      window.open(`https://t.me/${botInfo.username}`, '_blank');
    }
  };

  const resetModal = () => {
    setStep('token');
    setBotToken('');
    setBotInfo(null);
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
            className="w-full max-w-md bg-card rounded-2xl border border-border overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-telegram-blue-light/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Telegram Bot</h2>
                  <p className="text-xs text-muted-foreground">Подключение для тестирования</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {step === 'token' && (
                  <motion.div
                    key="token"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <h4 className="font-medium text-foreground mb-2">Как получить токен:</h4>
                      <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                        <li>Откройте @BotFather в Telegram</li>
                        <li>Создайте нового бота: /newbot</li>
                        <li>Скопируйте полученный токен</li>
                      </ol>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Bot Token
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="password"
                          value={botToken}
                          onChange={(e) => setBotToken(e.target.value)}
                          placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                          className="pl-10 telegram-input font-mono text-sm"
                        />
                      </div>
                    </div>

                    <Button onClick={handleConnect} className="w-full telegram-button">
                      <Link2 className="w-4 h-4 mr-2" />
                      Подключить бота
                    </Button>

                    <a
                      href="https://t.me/BotFather"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
                    >
                      Открыть @BotFather
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </motion.div>
                )}

                {step === 'connecting' && (
                  <motion.div
                    key="connecting"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="py-12 flex flex-col items-center"
                  >
                    <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                    <p className="text-foreground font-medium">Подключение...</p>
                    <p className="text-sm text-muted-foreground">Проверяем токен бота</p>
                  </motion.div>
                )}

                {step === 'success' && botInfo && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-4"
                  >
                    <div className="flex flex-col items-center py-6">
                      <div className="w-16 h-16 rounded-full bg-telegram-green/10 flex items-center justify-center mb-4">
                        <CheckCircle className="w-8 h-8 text-telegram-green" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">{botInfo.name}</h3>
                      <p className="text-primary">@{botInfo.username}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">Webhook URL</span>
                        <button
                          onClick={handleCopyWebhookUrl}
                          className="p-1.5 rounded hover:bg-primary/10 transition-colors"
                        >
                          <Copy className="w-4 h-4 text-primary" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono break-all">
                        {project ? getWebhookUrl(project.id) : 'Webhook URL'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" onClick={handleOpenBot}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Открыть
                      </Button>
                      <Button onClick={onClose} className="telegram-button">
                        <Play className="w-4 h-4 mr-2" />
                        Тестировать
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 'error' && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="py-8 flex flex-col items-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                      <AlertCircle className="w-8 h-8 text-destructive" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Ошибка подключения</h3>
                    <p className="text-sm text-muted-foreground text-center mb-6">
                      Проверьте токен бота и попробуйте снова
                    </p>
                    <Button onClick={resetModal} variant="outline">
                      Попробовать снова
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
