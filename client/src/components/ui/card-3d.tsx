import React from 'react'
import { Card } from './card'
import { cn } from '@/lib/utils'

interface Card3DProps extends React.ComponentPropsWithoutRef<typeof Card> {
  backgroundGradient?: boolean
  topHighlight?: boolean
  elevated?: boolean
  hoverable?: boolean
  noFloat?: boolean
}

export function Card3D({
  children,
  className,
  backgroundGradient = true,
  topHighlight = true,
  elevated = true,
  hoverable = true,
  noFloat = false,
  ...props
}: Card3DProps) {
  return (
    <div className={cn("card-3d-wrapper", { "animate-float-slow": !noFloat })}>
      <div className="relative h-full transform-style-3d transition-transform duration-300 transform">
        {elevated && (
          <>
            <div className="card-elevated-shadow"></div>
            <div className="card-base-shadow"></div>
          </>
        )}
        <Card 
          className={cn(
            "w-full border-primary/20 bg-white dark:bg-[#1C2333] shadow-md relative", 
            { "card-3d": hoverable },
            className
          )} 
          {...props}
        >
          {backgroundGradient && <div className="card-background-gradient"></div>}
          {topHighlight && <div className="card-shadow-top-highlight"></div>}
          {children}
        </Card>
      </div>
    </div>
  )
}