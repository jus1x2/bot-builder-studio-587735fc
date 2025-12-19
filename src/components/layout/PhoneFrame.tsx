import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Signal, Wifi, Battery } from 'lucide-react';

interface PhoneFrameProps {
  children: ReactNode;
  scale?: number;
}

export function PhoneFrame({ children, scale = 1 }: PhoneFrameProps) {
  const time = new Date().toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <motion.div
      initial={{ scale: 0.9 * scale, opacity: 0 }}
      animate={{ scale, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="phone-frame"
    >
      <div className="phone-screen w-[280px]">
        {/* Status bar */}
        <div className="status-bar bg-card text-foreground">
          <span className="font-semibold">{time}</span>
          <div className="flex items-center gap-1">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden bg-background">
          {children}
        </div>

        {/* Home indicator */}
        <div className="flex justify-center py-2 bg-card">
          <div className="w-32 h-1 rounded-full bg-foreground/20" />
        </div>
      </div>
    </motion.div>
  );
}
