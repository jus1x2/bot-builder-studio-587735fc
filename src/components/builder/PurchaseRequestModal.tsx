import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, Mail, MessageSquare, Phone, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useProjectStore } from '@/stores/projectStore';

interface PurchaseRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  name: string;
  email: string;
  telegram: string;
  message: string;
}

export function PurchaseRequestModal({ isOpen, onClose }: PurchaseRequestModalProps) {
  const { toast } = useToast();
  const { getCurrentProject } = useProjectStore();
  const project = getCurrentProject();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    telegram: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.telegram) {
      toast({
        title: 'Заполните обязательные поля',
        description: 'Имя, email и Telegram обязательны',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call - in real app, connect to backend
    try {
      // Here you would send to your backend/webhook
      const requestData = {
        ...formData,
        projectId: project?.id,
        projectName: project?.name,
        menusCount: project?.menus.length,
        buttonsCount: project?.menus.reduce((acc, m) => acc + m.buttons.length, 0),
        timestamp: new Date().toISOString(),
      };

      console.log('Purchase request:', requestData);

      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setIsSuccess(true);
      toast({
        title: 'Заявка отправлена!',
        description: 'Мы свяжемся с вами в ближайшее время',
      });

      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setFormData({ name: '', email: '', telegram: '', message: '' });
      }, 2000);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить заявку. Попробуйте позже.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl border border-border"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-12 h-1 bg-muted rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-4 pb-2">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Получить код бота</h2>
                <p className="text-sm text-muted-foreground">Оставьте заявку</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            {isSuccess ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="px-6 py-12 flex flex-col items-center"
              >
                <div className="w-20 h-20 rounded-full bg-telegram-green/10 flex items-center justify-center mb-4">
                  <Check className="w-10 h-10 text-telegram-green" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Заявка отправлена!</h3>
                <p className="text-muted-foreground text-center">
                  Мы свяжемся с вами в Telegram в ближайшее время
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                {/* Project info */}
                {project && (
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="text-sm font-medium text-foreground">{project.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {project.menus.length} экранов • {project.menus.reduce((acc, m) => acc + m.buttons.length, 0)} кнопок • {(project.actionNodes || []).length} действий
                    </p>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Имя *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="Ваше имя"
                      className="pl-10 telegram-input"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="email@example.com"
                      className="pl-10 telegram-input"
                      required
                    />
                  </div>
                </div>

                {/* Telegram */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Telegram *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={formData.telegram}
                      onChange={(e) => handleChange('telegram', e.target.value)}
                      placeholder="@username"
                      className="pl-10 telegram-input"
                      required
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Комментарий
                  </label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    placeholder="Дополнительные пожелания..."
                    rows={3}
                    className="telegram-input resize-none"
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full telegram-button h-12"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Отправить заявку
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Нажимая кнопку, вы соглашаетесь на обработку данных
                </p>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
