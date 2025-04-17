import { motion, AnimatePresence } from "framer-motion";
import { Button, ButtonProps } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ReactNode, forwardRef, HTMLAttributes } from "react";

/**
 * Animated Components
 * These components wrap shadcn components with framer-motion for animations
 */

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } }
};

const slideInFromBottom = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 400, damping: 20 } }
};

const slideInFromRight = {
  hidden: { x: 20, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 400, damping: 20 } }
};

const popIn = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 500, damping: 25 } }
};

// Animated Button with tooltip option
interface AnimatedButtonProps extends ButtonProps {
  tooltipText?: string;
  tooltipSide?: "top" | "right" | "bottom" | "left";
  delay?: number;
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, tooltipText, tooltipSide = "top", delay = 0, ...props }, ref) => {
    const button = (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={popIn}
        transition={{ delay }}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
      >
        <Button ref={ref} {...props}>
          {children}
        </Button>
      </motion.div>
    );

    if (tooltipText) {
      return (
        <TooltipProvider>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              {button}
            </TooltipTrigger>
            <TooltipContent side={tooltipSide}>
              <p>{tooltipText}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return button;
  }
);
AnimatedButton.displayName = "AnimatedButton";

// Animated Card
export const AnimatedCard = forwardRef<HTMLDivElement, React.ComponentProps<typeof Card>>(
  ({ children, ...props }, ref) => {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
      >
        <Card ref={ref} {...props}>
          {children}
        </Card>
      </motion.div>
    );
  }
);
AnimatedCard.displayName = "AnimatedCard";

// Animated Badge
export const AnimatedBadge = forwardRef<HTMLDivElement, React.ComponentProps<typeof Badge>>(
  ({ children, ...props }, ref) => {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={popIn}
        whileHover={{ scale: 1.1 }}
      >
        <Badge {...props}>
          {children}
        </Badge>
      </motion.div>
    );
  }
);
AnimatedBadge.displayName = "AnimatedBadge";

// Animated List Item
interface AnimatedListItemProps {
  children: ReactNode;
  delay?: number;
}

export const AnimatedListItem = ({ children, delay = 0 }: AnimatedListItemProps) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideInFromRight}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
};

// Animated Section (for larger content blocks)
interface AnimatedSectionProps {
  children: ReactNode;
  delay?: number;
}

export const AnimatedSection = ({ children, delay = 0 }: AnimatedSectionProps) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideInFromBottom}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
};

// Tooltips with contextual help
interface HelpTooltipProps {
  children: ReactNode;
  helpText: string;
  side?: "top" | "right" | "bottom" | "left";
}

export const HelpTooltip = ({ children, helpText, side = "top" }: HelpTooltipProps) => {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <p>{helpText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Animated text notification (for success messages, alerts, etc.)
interface AnimatedNotificationProps {
  children: ReactNode;
  isVisible: boolean;
}

export const AnimatedNotification = ({ children, isVisible }: AnimatedNotificationProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="rounded-md p-2"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};