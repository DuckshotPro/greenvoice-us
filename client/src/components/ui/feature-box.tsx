import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FeatureBoxProps {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
  iconBackground?: string;
  darkMode?: boolean;
}

export function FeatureBox({ 
  icon, 
  title, 
  description, 
  className,
  iconBackground = "bg-greenvoice-primary/10",
  darkMode = false
}: FeatureBoxProps) {
  return (
    <div 
      className={cn(
        "group relative p-6 rounded-lg transition-all duration-300",
        darkMode 
          ? "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 hover:border-greenvoice-primary/50 shadow-md shadow-greenvoice-primary/5" 
          : "bg-gradient-to-br from-white to-gray-50 border border-gray-200 hover:border-greenvoice-primary/30 hover:shadow-lg shadow-md",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "p-3 rounded-full transition-all duration-300 group-hover:scale-110", 
          iconBackground
        )}>
          {icon}
        </div>
        <div className="space-y-1">
          <h3 className={cn(
            "font-nunito font-bold text-lg transition-colors duration-300",
            darkMode ? "text-white group-hover:text-greenvoice-primary" : "text-greenvoice-primary"
          )}>
            {title}
          </h3>
          <p className={cn(
            "font-montserrat text-sm",
            darkMode ? "text-gray-300" : "text-gray-600"
          )}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}