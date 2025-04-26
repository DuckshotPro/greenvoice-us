import React from 'react';

interface StaticBlobProps {
  color: string;
  size?: number;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  opacity?: number;
  className?: string;
}

export const AnimatedBlob: React.FC<StaticBlobProps> = ({
  color,
  size = 300,
  top,
  left,
  right,
  bottom,
  opacity = 0.15,
  className = ''
}) => {
  return (
    <div
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
      />
      <AnimatedBlob 
        color="#00B5A5" /* Lighter version of primary */
        size={400} 
        bottom="-10%" 
        left="-10%" 
        opacity={0.10}
      />
      <AnimatedBlob 
        color="#007A6E" /* Darker version of primary */
        size={350} 
        top="30%" 
        right="-15%" 
        opacity={0.09}
      />
      <AnimatedBlob 
        color="#333333" /* Secondary brand color - Dark Grey */
        size={300} 
        bottom="20%" 
        right="10%" 
        opacity={0.05}
      />
    </div>
  );
};

interface FloatingElementProps {
  children: React.ReactNode;
  className?: string;
}

// No floating animation, just passes children through
export const FloatingElement: React.FC<FloatingElementProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`${className}`}>
      {children}
    </div>
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
        />
        <AnimatedBlob 
          color="#007A6E" /* Darker version of primary */
          size={300} 
          bottom="-50%" 
          left="-20%" 
          opacity={0.12}
        />
        <AnimatedBlob 
          color="#333333" /* Secondary brand color */
          size={250} 
          bottom="30%" 
          right="20%" 
          opacity={0.05}
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
  variant?: 'primary' | 'secondary' | 'outline';
}> = ({ children, onClick, className = '', variant = 'primary' }) => {
  // Different styling based on variant
  const getBackgroundStyle = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-white text-primary';
      case 'outline':
        return 'bg-transparent border-2 border-primary text-primary';
      case 'primary':
      default:
        return 'bg-gradient-to-r from-[#009888] to-[#00C4B4] opacity-90 dark:opacity-100 text-white';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden rounded-lg px-4 py-2 font-medium ${className} hover:scale-[1.03] active:scale-[0.98] transition-transform duration-200`}
    >
      {/* Background based on variant */}
      <span className={`absolute inset-0 ${getBackgroundStyle()}`} />
      
      {/* Content */}
      <span className="relative z-10">{children}</span>
    </button>
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
    <div
      className={`rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] ${gradient} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
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
  return (
    <div
      className={`
        relative rounded-xl overflow-hidden 
        bg-white/30 dark:bg-gray-800/20 
        backdrop-blur-sm backdrop-saturate-150
        shadow-md hover:shadow-lg 
        border border-white/30 dark:border-gray-700/30
        transition-all duration-300
        hover:scale-[1.02]
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

/**
 * Card3D component creates an elevated card with 3D effects and dynamic shadows
 * The card has an accent color bar along the top
 * On hover, it will show a deeper shadow
 */
export const Card3D: React.FC<{
  children: React.ReactNode;
  className?: string;
  backgroundColor?: string;
  accentColor?: string;
  onClick?: () => void;
  isPremiumPlus?: boolean; // Kept for backward compatibility
  glowColor?: string;
}> = ({ 
  children, 
  className = '',
  backgroundColor = 'bg-white dark:bg-gray-800',
  accentColor = '#009888',
  onClick,
  isPremiumPlus = true, // No longer used but kept for compatibility
  glowColor = 'rgba(0, 0, 0, 0.12)'
}) => {
  return (
    <div 
      className={`
        relative rounded-xl
        ${backgroundColor}
        p-0.5
        transition-all duration-300
        hover:shadow-lg
        shadow-md
        ${className}
      `}
      onClick={onClick}
    >
      {/* Accent line on top */}
      <div 
        className="absolute top-0 left-0 h-1 w-full rounded-t-xl"
        style={{ backgroundColor: accentColor, opacity: 0.9 }}
      />
      
      {/* Shadow effect */}
      <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-[90%] h-[10px] bg-black/5 dark:bg-black/20 blur-xl rounded-full opacity-70 z-0" />
      
      {/* Subtle 3D border effect */}
      <div className="h-full w-full rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden relative z-10">
        {children}
      </div>
    </div>
  );
};