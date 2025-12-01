// components/layout/responsive-grid.tsx
'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export interface ResponsiveGridProps {
  children: ReactNode;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    ultrawide?: number;
  };
  gap?: 'small' | 'medium' | 'large' | 'none';
  alignment?: 'start' | 'center' | 'end' | 'stretch';
  portalTheme?: string;
  className?: string;
  animated?: boolean;
}

export function ResponsiveGrid({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3, ultrawide: 4 },
  gap = 'medium',
  alignment = 'stretch',
  portalTheme,
  className = '',
  animated = true
}: ResponsiveGridProps) {
  
  // Gap sizes
  const gapClasses = {
    none: 'gap-0',
    small: 'gap-3 md:gap-4',
    medium: 'gap-4 md:gap-6',
    large: 'gap-6 md:gap-8'
  };

  // Alignment classes
  const alignmentClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  // Column classes
  const colClasses = `
    grid
    grid-cols-${cols.mobile || 1}
    sm:grid-cols-${cols.tablet || 2}
    lg:grid-cols-${cols.desktop || 3}
    2xl:grid-cols-${cols.ultrawide || 4}
  `;

  // Theme colors (if portal theme provided)
  const themeStyles = portalTheme ? getThemeStyles(portalTheme) : {};

  return (
    <div
      className={`
        ${colClasses}
        ${gapClasses[gap]}
        ${alignmentClasses[alignment]}
        ${className}
      `}
      style={themeStyles}
    >
      {animated ? (
        <>
          {Array.isArray(children) && children.map((child, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: index * 0.1,
                ease: [0.645, 0.045, 0.355, 1]
              }}
            >
              {child}
            </motion.div>
          ))}
        </>
      ) : (
        children
      )}
    </div>
  );
}

function getThemeStyles(theme: string) {
  // Apply subtle theme-based styling
  const themes: Record<string, any> = {
    blue: { '--theme-glow': '59, 130, 246' },
    purple: { '--theme-glow': '139, 92, 246' },
    pink: { '--theme-glow': '236, 72, 153' },
    green: { '--theme-glow': '16, 185, 129' },
    orange: { '--theme-glow': '245, 158, 11' }
  };
  return themes[theme] || {};
}

export default ResponsiveGrid;