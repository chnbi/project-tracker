import React, { useState, useEffect } from 'react';

interface ConnectorLineProps {
  fromIndex: number;
  toIndex: number;
  rowHeight: number;
  columnGap: number;
  isActive: boolean;
  headerHeight?: number;
}

export const ConnectorLine: React.FC<ConnectorLineProps> = ({
  fromIndex,
  toIndex,
  rowHeight,
  columnGap,
  isActive,
  headerHeight = 56
}) => {
  // Responsive gap detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const responsiveGap = isMobile ? 32 : columnGap; // gap-8 = 32px on mobile

  if (!isActive) return null;

  const offset = 56;
  const startY = offset + (fromIndex * rowHeight) + (rowHeight / 2);
  const endY = offset + (toIndex * rowHeight) + (rowHeight / 2);

  const midX = responsiveGap / 2;
  const endX = responsiveGap;

  const path = `
    M 0 ${startY} 
    C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}
  `;

  return (
    <svg
      className="absolute top-0 left-full pointer-events-none z-0 overflow-visible"
      style={{
        width: responsiveGap,
        height: Math.max(startY, endY) + 100,
      }}
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
        style={{
          transition: 'd 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      />
      <circle
        cx="0"
        cy={startY}
        r="1.5"
        fill="currentColor"
        fillOpacity="0.2"
        style={{
          transition: 'cy 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      />
    </svg>
  );
};
