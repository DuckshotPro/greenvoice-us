import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  glowColor?: string;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverEffect = true,
  glowColor = 'rgba(0, 152, 136, 0.3)', // Default to our primary teal color
  onClick
}) => {
  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-xl bg-gradient-to-b from-white/20 to-white/5 dark:from-gray-800/40 dark:to-gray-900/60 backdrop-blur-md border border-white/20 dark:border-gray-800/40 shadow-xl',
        onClick ? 'cursor-pointer' : '',
        className,
      )}
      initial={{ opacity: 0.9 }}
      whileHover={hoverEffect ? { 
        scale: 1.02, 
        boxShadow: `0 0 20px 2px ${glowColor}` 
      } : {}}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
    >
      {/* Ambient glow effect */}
      <div 
        className="absolute -inset-0.5 opacity-20 dark:opacity-30 rounded-xl blur-xl"
        style={{ 
          background: `radial-gradient(circle at top left, ${glowColor}, transparent 70%)` 
        }}
      ></div>
      
      {/* Main content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
        <motion.div
          className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            repeatType: 'loop',
            ease: 'linear',
            delay: Math.random() * 2
          }}
        />
      </div>
    </motion.div>
  );
};

export const GradientCard: React.FC<GlassCardProps & { gradient?: string }> = ({
  children,
  className = '',
  hoverEffect = true,
  glowColor = 'rgba(0, 152, 136, 0.4)',
  gradient = 'bg-gradient-to-br from-primary/30 to-blue-600/20 dark:from-primary/20 dark:to-indigo-900/30',
  onClick
}) => {
  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-xl backdrop-blur-md border border-white/20 dark:border-gray-800/30 shadow-xl',
        gradient,
        onClick ? 'cursor-pointer' : '',
        className,
      )}
      initial={{ opacity: 0.9 }}
      whileHover={hoverEffect ? { 
        scale: 1.02, 
        boxShadow: `0 0 20px 2px ${glowColor}` 
      } : {}}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
    >
      {/* Ambient shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-10"
        style={{ width: '200%' }}
        animate={{ x: ['-100%', '100%'] }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          repeatType: 'loop',
          ease: 'linear',
          delay: Math.random() * 2
        }}
      />
      
      {/* Main content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  glowColor?: string;
}> = ({
  icon,
  title,
  description,
  className = '',
  glowColor = 'rgba(0, 152, 136, 0.3)',
}) => {
  return (
    <GlassCard className={cn('p-6', className)} glowColor={glowColor}>
      <div className="flex items-start space-x-5">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary shadow-sm">
            {icon}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold font-nunito text-primary dark:text-primary mb-2.5">{title}</h3>
          <p className="text-gray-700 dark:text-gray-300 font-montserrat text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </GlassCard>
  );
};