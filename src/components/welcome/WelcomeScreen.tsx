import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, ArrowRight, MessageSquare, Store, CreditCard, FileText, ShoppingCart, HelpCircle, Headphones, TrendingUp, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProjectStore } from '@/stores/projectStore';
import { TEMPLATES } from '@/lib/bot-templates';
import { useTelegram } from '@/contexts/TelegramContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
function BuilderPreview() {
  const [animationPhase, setAnimationPhase] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const startButtonRef = useRef<HTMLDivElement>(null);
  const catalogCardRef = useRef<HTMLDivElement>(null);
  const catalogCtaRef = useRef<HTMLDivElement>(null);
  const paymentCardRef = useRef<HTMLDivElement>(null);

  const [points, setPoints] = useState<{
    p1: { x: number; y: number };
    p2: { x: number; y: number };
    p3: { x: number; y: number };
    p4: { x: number; y: number };
  } | null>(null);

  useEffect(() => {
    const phases = [
      { delay: 300, phase: 1 },
      { delay: 600, phase: 2 },
      { delay: 1000, phase: 3 },
      { delay: 1400, phase: 4 },
      { delay: 1800, phase: 5 },
      { delay: 2200, phase: 6 },
      { delay: 4000, phase: 0 },
    ];

    let timeouts: NodeJS.Timeout[] = [];

    const runAnimation = () => {
      phases.forEach(({ delay, phase }) => {
        const timeout = setTimeout(() => setAnimationPhase(phase), delay);
        timeouts.push(timeout);
      });

      const loopTimeout = setTimeout(runAnimation, 4500);
      timeouts.push(loopTimeout);
    };

    runAnimation();

    return () => timeouts.forEach(clearTimeout);
  }, []);

  useLayoutEffect(() => {
    const compute = () => {
      const container = containerRef.current;
      const startBtn = startButtonRef.current;
      const catalogCard = catalogCardRef.current;
      const catalogCta = catalogCtaRef.current;
      const paymentCard = paymentCardRef.current;

      if (!container || !startBtn || !catalogCard || !catalogCta || !paymentCard) return;

      const c = container.getBoundingClientRect();
      const rStart = startBtn.getBoundingClientRect();
      const rCatalog = catalogCard.getBoundingClientRect();
      const rCatalogCta = catalogCta.getBoundingClientRect();
      const rPayment = paymentCard.getBoundingClientRect();

      setPoints({
        p1: {
          x: rStart.right - c.left,
          y: rStart.top - c.top + rStart.height / 2,
        },
        p2: {
          x: rCatalog.left - c.left,
          y: rCatalog.top - c.top + rCatalog.height / 2,
        },
        p3: {
          x: rCatalogCta.right - c.left,
          y: rCatalogCta.top - c.top + rCatalogCta.height / 2,
        },
        p4: {
          x: rPayment.left - c.left,
          y: rPayment.top - c.top + rPayment.height / 2,
        },
      });
    };

    const timer = setTimeout(compute, 50);

    const ro = new ResizeObserver(() => compute());
    if (containerRef.current) ro.observe(containerRef.current);

    window.addEventListener("resize", compute);
    return () => {
      clearTimeout(timer);
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, [animationPhase]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-36 rounded-2xl bg-gradient-to-br from-telegram-green/10 via-primary/5 to-telegram-blue-light/10 border border-border/50 backdrop-blur-sm overflow-visible"
    >
      <div className="absolute inset-0 opacity-20 rounded-2xl overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, hsl(var(--muted-foreground) / 0.2) 1px, transparent 0)",
            backgroundSize: "12px 12px",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: animationPhase >= 1 ? 1 : 0,
          scale: animationPhase >= 1 ? 1 : 0.9,
        }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="absolute left-3 top-4 z-10"
      >
        <div className="relative bg-card/95 backdrop-blur-sm border border-border rounded-lg p-1.5 w-[72px] shadow-md">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: animationPhase >= 1 ? 1 : 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
            className="absolute -top-1.5 left-1.5 bg-telegram-green text-primary-foreground text-[6px] font-semibold px-1 py-0.5 rounded-full"
          >
            Старт
          </motion.div>

          <div className="flex items-center gap-1 mb-1 mt-0.5">
            <div className="w-3 h-3 rounded bg-telegram-green/15 flex items-center justify-center">
              <MessageSquare className="w-1.5 h-1.5 text-telegram-green" />
            </div>
            <div className="h-0.5 bg-foreground/10 rounded flex-1" />
          </div>

          <motion.div
            ref={startButtonRef}
            animate={{
              backgroundColor:
                animationPhase >= 2 ? "hsl(145 65% 45% / 0.3)" : "hsl(var(--primary) / 0.1)",
              borderColor:
                animationPhase >= 2 ? "hsl(145 65% 45% / 0.7)" : "transparent",
            }}
            transition={{ duration: 0.2 }}
            className="h-3 rounded flex items-center justify-center border mb-0.5"
          >
            <span className="text-[6px] text-muted-foreground font-medium">Каталог</span>
          </motion.div>
          <div className="h-2 rounded bg-primary/8" />
        </div>
      </motion.div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(145 65% 45%)" />
            <stop offset="100%" stopColor="hsl(200 100% 50%)" />
          </linearGradient>
          <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(200 100% 50%)" />
            <stop offset="100%" stopColor="hsl(280 80% 60%)" />
          </linearGradient>
        </defs>

        {points && (
          <>
            <motion.path
              d={`M ${points.p1.x} ${points.p1.y} C ${points.p1.x + 25} ${points.p1.y}, ${points.p2.x - 25} ${points.p2.y}, ${points.p2.x} ${points.p2.y}`}
              fill="none"
              stroke="url(#grad1)"
              strokeWidth="2"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1}
              initial={false}
              animate={{
                strokeDashoffset: animationPhase >= 4 ? 0 : 1,
                opacity: animationPhase >= 4 ? 1 : 0,
              }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              style={{ filter: "drop-shadow(0 0 4px hsl(145 65% 45% / 0.5))" }}
            />

            <motion.path
              d={`M ${points.p1.x} ${points.p1.y} C ${points.p1.x + 25} ${points.p1.y}, ${points.p2.x - 25} ${points.p2.y}, ${points.p2.x} ${points.p2.y}`}
              fill="none"
              stroke="url(#grad1)"
              strokeWidth="4"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray="0.14 0.86"
              strokeDashoffset={1}
              initial={false}
              animate={
                animationPhase >= 4
                  ? { opacity: 1, strokeDashoffset: [1, 0] }
                  : { opacity: 0, strokeDashoffset: 1 }
              }
              transition={
                animationPhase >= 4
                  ? { duration: 1.15, ease: "linear", repeat: Infinity }
                  : { duration: 0.2 }
              }
              style={{ filter: "drop-shadow(0 0 10px hsl(180 80% 50% / 0.8))" }}
            />

            <motion.circle
              cx={points.p1.x}
              cy={points.p1.y}
              r="4"
              fill="hsl(145 65% 45%)"
              initial={false}
              animate={{
                scale: animationPhase >= 4 ? 1 : 0,
                opacity: animationPhase >= 4 ? 1 : 0,
              }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              style={{ filter: "drop-shadow(0 0 6px hsl(145 65% 45%))" }}
            />
            <motion.circle
              cx={points.p2.x}
              cy={points.p2.y}
              r="4"
              fill="hsl(200 100% 50%)"
              initial={false}
              animate={{
                scale: animationPhase >= 4 ? 1 : 0,
                opacity: animationPhase >= 4 ? 1 : 0,
              }}
              transition={{ duration: 0.25, ease: "easeOut", delay: 0.2 }}
              style={{ filter: "drop-shadow(0 0 6px hsl(200 100% 50%))" }}
            />
          </>
        )}

        {points && (
          <>
            <motion.path
              d={`M ${points.p3.x} ${points.p3.y} C ${points.p3.x + 25} ${points.p3.y}, ${points.p4.x - 25} ${points.p4.y}, ${points.p4.x} ${points.p4.y}`}
              fill="none"
              stroke="url(#grad2)"
              strokeWidth="2"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1}
              initial={false}
              animate={{
                strokeDashoffset: animationPhase >= 6 ? 0 : 1,
                opacity: animationPhase >= 6 ? 1 : 0,
              }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              style={{ filter: "drop-shadow(0 0 4px hsl(200 100% 50% / 0.5))" }}
            />

            <motion.path
              d={`M ${points.p3.x} ${points.p3.y} C ${points.p3.x + 25} ${points.p3.y}, ${points.p4.x - 25} ${points.p4.y}, ${points.p4.x} ${points.p4.y}`}
              fill="none"
              stroke="url(#grad2)"
              strokeWidth="4"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray="0.14 0.86"
              strokeDashoffset={1}
              initial={false}
              animate={
                animationPhase >= 6
                  ? { opacity: 1, strokeDashoffset: [1, 0] }
                  : { opacity: 0, strokeDashoffset: 1 }
              }
              transition={
                animationPhase >= 6
                  ? { duration: 1.15, ease: "linear", repeat: Infinity }
                  : { duration: 0.2 }
              }
              style={{ filter: "drop-shadow(0 0 10px hsl(240 80% 50% / 0.8))" }}
            />

            <motion.circle
              cx={points.p3.x}
              cy={points.p3.y}
              r="4"
              fill="hsl(200 100% 50%)"
              initial={false}
              animate={{
                scale: animationPhase >= 6 ? 1 : 0,
                opacity: animationPhase >= 6 ? 1 : 0,
              }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              style={{ filter: "drop-shadow(0 0 6px hsl(200 100% 50%))" }}
            />
            <motion.circle
              cx={points.p4.x}
              cy={points.p4.y}
              r="4"
              fill="hsl(280 80% 60%)"
              initial={false}
              animate={{
                scale: animationPhase >= 6 ? 1 : 0,
                opacity: animationPhase >= 6 ? 1 : 0,
              }}
              transition={{ duration: 0.25, ease: "easeOut", delay: 0.2 }}
              style={{ filter: "drop-shadow(0 0 6px hsl(280 80% 60%))" }}
            />
          </>
        )}
      </svg>

      <motion.div
        ref={catalogCardRef}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: animationPhase >= 3 ? 1 : 0,
          scale: animationPhase >= 3 ? 1 : 0.9,
        }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="absolute left-[125px] top-1/2 -translate-y-1/2 z-10"
      >
        <div className="relative bg-card/95 backdrop-blur-sm border border-primary/20 rounded-lg p-1.5 w-[70px] shadow-md">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-3 h-3 rounded bg-primary/15 flex items-center justify-center">
              <Store className="w-1.5 h-1.5 text-primary" />
            </div>
            <div className="h-0.5 bg-foreground/10 rounded flex-1" />
          </div>

          <div className="grid grid-cols-2 gap-0.5 mb-0.5">
            <div className="h-2 rounded bg-primary/8" />
            <div className="h-2 rounded bg-primary/8" />
          </div>
          <motion.div
            ref={catalogCtaRef}
            animate={{
              backgroundColor:
                animationPhase >= 5 ? "hsl(200 100% 50% / 0.25)" : "hsl(145 65% 45% / 0.1)",
              borderColor:
                animationPhase >= 5 ? "hsl(200 100% 50% / 0.6)" : "transparent",
            }}
            className="h-2 rounded bg-telegram-green/15 border"
          />
        </div>
      </motion.div>

      <motion.div
        ref={paymentCardRef}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: animationPhase >= 5 ? 1 : 0,
          scale: animationPhase >= 5 ? 1 : 0.9,
        }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="absolute right-3 bottom-4 z-10"
      >
        <div className="relative bg-card/95 backdrop-blur-sm border border-purple-400/30 rounded-lg p-1.5 w-[70px] shadow-md">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-3 h-3 rounded bg-purple-500/15 flex items-center justify-center">
              <CreditCard className="w-1.5 h-1.5 text-purple-500" />
            </div>
            <div className="h-0.5 bg-foreground/10 rounded flex-1" />
          </div>

          <div className="h-2 rounded bg-purple-500/10 mb-0.5" />
          <div className="h-2 rounded bg-telegram-green/20" />
        </div>
      </motion.div>
    </div>
  );
}

function SparklesBadge() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.3, type: 'spring' }}
      className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-telegram-green flex items-center justify-center overflow-hidden"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
      />

      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 15, -15, 0]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Sparkles className="w-3.5 h-3.5 text-primary-foreground relative z-10" />
      </motion.div>

      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
            x: [0, (i - 1) * 8],
            y: [0, -8 + i * 4],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.4,
            ease: "easeOut"
          }}
          className="absolute w-1 h-1 rounded-full bg-primary-foreground"
        />
      ))}
    </motion.div>
  );
}

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
  const { isLoading: isTgLoading, isTelegramWebApp, telegramUser, profile } = useTelegram();

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleCreateProject = () => {
    const project = createProject('Новый бот', 'Мой телеграм бот', selectedTemplate);
    navigate(`/builder/${project.id}`);
  };

  // Show loading while authenticating in Telegram
  if (isTgLoading && isTelegramWebApp) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Авторизация...</p>
        </div>
      </div>
    );
  }

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
          className="absolute bottom-1/4 -right-32 w-96 h-96 bg-telegram-blue-light/10 rounded-full blur-3xl"
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-telegram-green/5 rounded-full blur-3xl" />
      </div>

      <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {/* User profile header for Telegram */}
        {telegramUser && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 right-4 flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-border rounded-full pl-3 pr-1 py-1"
          >
            <span className="text-sm font-medium text-foreground">
              {telegramUser.first_name}
            </span>
            <Avatar className="w-8 h-8">
              <AvatarImage src={profile?.photo_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {telegramUser.first_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </motion.div>
        )}

        <AnimatePresence>
          {showContent && (
            <>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', duration: 0.8 }}
                className="relative mb-6"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-telegram-blue-light flex items-center justify-center shadow-lg">
                  <Bot className="w-10 h-10 text-primary-foreground" />
                </div>
                <SparklesBadge />
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
                transition={{ delay: 0.3 }}
                className="w-full max-w-sm mb-8"
              >
                <BuilderPreview />
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
