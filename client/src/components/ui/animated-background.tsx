import React, { useState } from 'react';
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
        color="#009888" /* Primary brand color - Bluish Jade Stone Green */
        size={500} 
        top="-10%" 
        right="-5%" 
        opacity={0.12}
        duration={25}
      />
      <AnimatedBlob 
        color="#00B5A5" /* Lighter version of primary */
        size={400} 
        bottom="-10%" 
        left="-10%" 
        opacity={0.10}
        duration={20}
        delay={2}
      />
      <AnimatedBlob 
        color="#007A6E" /* Darker version of primary */
        size={350} 
        top="30%" 
        right="-15%" 
        opacity={0.09}
        duration={22}
        delay={1}
      />
      <AnimatedBlob 
        color="#333333" /* Secondary brand color - Dark Grey */
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
          color="#009888" /* Primary brand color */
          size={400} 
          top="-50%" 
          right="-10%" 
          opacity={0.18}
          duration={25}
        />
        <AnimatedBlob 
          color="#007A6E" /* Darker version of primary */
          size={300} 
          bottom="-50%" 
          left="-20%" 
          opacity={0.12}
          duration={20}
          delay={2}
        />
        <AnimatedBlob 
          color="#333333" /* Secondary brand color */
          size={250} 
          bottom="30%" 
          right="20%" 
          opacity={0.05}
          duration={22}
          delay={1}
        />
      </div>
      <div className="relative z-10 backdrop-blur-sm bg-white/70 dark:bg-gray-900/80 rounded-xl h-full border border-primary/20 dark:border-primary/10">
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
      {/* Strong brand gradient: Primary Bluish Jade Green to a slightly lighter version */}
      <span className="absolute inset-0 bg-gradient-to-r from-[#009888] to-[#00C4B4] opacity-90 dark:opacity-100" />
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

export const GradientCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  gradient?: string;
  onClick?: () => void;
}> = ({ 
  children, 
  className = '', 
  gradient = 'bg-gradient-to-br from-[#009888]/20 to-[#00C4B4]/10 dark:from-[#009888]/15 dark:to-[#00B5A5]/5',
  onClick
}) => {
  return (
    <motion.div
      className={`rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ${gradient} ${className}`}
      whileHover={{ 
        scale: 1.01,
        boxShadow: '0 10px 25px rgba(0, 152, 136, 0.15)' 
      }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};

export const GlassCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  onClick?: () => void;
}> = ({ 
  children, 
  className = '', 
  glowColor = 'rgba(0, 152, 136, 0.3)', 
  onClick 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      className={`
        relative rounded-xl overflow-hidden 
        bg-white/30 dark:bg-gray-800/20 
        backdrop-blur-sm backdrop-saturate-150
        shadow-md hover:shadow-lg 
        border border-white/30 dark:border-gray-700/30
        transition-all duration-300
        ${className}
      `}
      initial={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}
      whileHover={{ 
        scale: 1.02,
        boxShadow: `0 8px 25px ${glowColor}` 
      }}
      animate={{
        boxShadow: isHovered 
          ? `0 8px 25px ${glowColor}` 
          : '0 4px 12px rgba(0, 0, 0, 0.05)'
      }}
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {children}
    </motion.div>
  );
};