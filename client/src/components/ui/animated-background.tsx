import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedBlobProps {
  color: string;
  size?: number;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  duration?: number;
  delay?: number;
  opacity?: number;
  className?: string;
}

export const AnimatedBlob: React.FC<AnimatedBlobProps> = ({
  color,
  size = 300,
  top,
  left,
  right,
  bottom,
  duration = 20,
  delay = 0,
  opacity = 0.15,
  className = ''
}) => {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      style={{
        backgroundColor: color,
        width: size,
        height: size,
        top,
        left,
        right,
        bottom,
        opacity,
        zIndex: 0,
        filter: 'blur(120px)',
      }}
      animate={{
        x: [0, 30, -20, 20, 0],
        y: [0, -40, 20, -30, 0],
        scale: [1, 1.1, 0.9, 1.05, 1],
      }}
      transition={{
        duration,
        ease: "easeInOut",
        repeat: Infinity,
        delay,
      }}
    />
  );
};

export const AnimatedGradientBg: React.FC<{className?: string}> = ({className = ''}) => {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <AnimatedBlob 
        color="#009888" 
        size={500} 
        top="-10%" 
        right="-5%" 
        opacity={0.1}
        duration={25}
      />
      <AnimatedBlob 
        color="#2563EB" 
        size={400} 
        bottom="-10%" 
        left="-10%" 
        opacity={0.08}
        duration={20}
        delay={2}
      />
      <AnimatedBlob 
        color="#7B3FE4" 
        size={350} 
        top="30%" 
        right="-15%" 
        opacity={0.07}
        duration={22}
        delay={1}
      />
      <AnimatedBlob 
        color="#F59E0B" 
        size={300} 
        bottom="20%" 
        right="10%" 
        opacity={0.05}
        duration={18}
        delay={3}
      />
    </div>
  );
};

interface FloatingElementProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  className?: string;
}

export const FloatingElement: React.FC<FloatingElementProps> = ({
  children,
  duration = 4,
  delay = 0,
  className = ''
}) => {
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -10, 0],
      }}
      transition={{
        duration,
        ease: "easeInOut",
        repeat: Infinity,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
};

export const AnimatedAccentCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      <div className="absolute inset-0 overflow-hidden">
        <AnimatedBlob 
          color="#009888" 
          size={400} 
          top="-50%" 
          right="-10%" 
          opacity={0.15}
          duration={25}
        />
        <AnimatedBlob 
          color="#2563EB" 
          size={300} 
          bottom="-50%" 
          left="-20%" 
          opacity={0.1}
          duration={20}
          delay={2}
        />
      </div>
      <div className="relative z-10 backdrop-blur-sm bg-white/70 dark:bg-gray-900/80 rounded-xl h-full">
        {children}
      </div>
    </div>
  );
};

export const ShimmerButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}> = ({ children, onClick, className = '' }) => {
  return (
    <motion.button
      onClick={onClick}
      className={`relative overflow-hidden rounded-lg px-4 py-2 font-medium text-white ${className}`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 opacity-80" />
      <motion.span
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
        style={{ width: '200%' }}
        animate={{ x: ['-100%', '100%'] }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity, 
          repeatType: 'loop',
          ease: 'linear',
        }}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};