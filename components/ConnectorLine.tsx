import React from 'react';

interface ConnectorLineProps {
  fromIndex: number;
  toIndex: number;
  rowHeight: number;
  columnGap: number;
  isActive: boolean;
  headerHeight?: number; // New prop for offset
}

export const ConnectorLine: React.FC<ConnectorLineProps> = ({ 
  fromIndex, 
  rowHeight, 
  columnGap,
  isActive,
  headerHeight = 56 // 12 (3rem/48px) + 2 (0.5rem/8px margin) approx = 56px.
}) => {
  if (!isActive) return null;

  // Calculate strict vertical centers based on index and fixed row height
  // headerHeight (h-12 + mb-2) = 48px + 8px = 56px (Tailwind h-12 is 3rem=48px, mb-2 is 0.5rem=8px)
  const offset = 56; 

  const startY = offset + (fromIndex * rowHeight) + (rowHeight / 2);
  const endY = offset + (toIndex * rowHeight) + (rowHeight / 2); // Connects to first item level roughly
  
  const midX = columnGap / 2;
  const endX = columnGap;

  const path = `
    M 0 ${startY} 
    C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}
  `;

  return (
    <svg 
      className="absolute top-0 left-full pointer-events-none z-0 overflow-visible"
      style={{ 
        width: columnGap, 
        height: Math.max(startY, endY) + 100,
      }}
    >
      <path 
        d={path} 
        fill="none" 
        stroke="#9ca3af" 
        strokeWidth="1.5" 
        vectorEffect="non-scaling-stroke"
        style={{ 
          transition: 'd 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
        }}
      />
      {/* Add a dot at the start for visual anchor */}
      <circle 
        cx="0" 
        cy={startY} 
        r="2" 
        fill="#9ca3af"
        style={{ 
          transition: 'cy 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
        }}
      />
    </svg>
  );
};