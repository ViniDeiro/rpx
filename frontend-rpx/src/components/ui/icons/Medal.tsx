import React from 'react';

interface MedalProps {
  size?: number;
  className?: string;
  color?: string;
}

const Medal: React.FC<MedalProps> = ({ 
  size = 24, 
  className = "", 
  color = "currentColor" 
}) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />
    <path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.11" />
    <path d="M8.21 10.11 7 1l5 3 5-3-1.21 9.11" />
  </svg>
);

export default Medal; 