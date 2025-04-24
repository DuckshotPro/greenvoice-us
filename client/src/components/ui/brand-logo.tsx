import React from "react";
import logo from "../../assets/green-voice-logo.png";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
  variant?: "default" | "light" | "dark";
}

export function BrandLogo({ 
  size = "md", 
  className = "", 
  showText = true,
  variant = "default" 
}: BrandLogoProps) {
  const sizeClasses = {
    sm: "h-6",
    md: "h-8",
    lg: "h-10",
    xl: "h-12"
  };

  const textColors = {
    default: "text-greenvoice-primary",
    light: "text-white",
    dark: "text-greenvoice-text"
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        <img 
          src={logo} 
          alt="GreenVoice Logo" 
          className="h-full object-contain"
        />
      </div>
      
      {showText && (
        <div className="ml-2 flex flex-col">
          <span className={`font-nunito font-bold leading-tight ${textColors[variant]}`} style={{letterSpacing: "-0.01em"}}>
            GreenVoice
          </span>
          <span className={`font-montserrat text-xs ${variant === "light" ? "text-gray-200" : "text-gray-600"}`}>
            {/* Optional tagline */}
            Invoice Simplified
          </span>
        </div>
      )}
    </div>
  );
}