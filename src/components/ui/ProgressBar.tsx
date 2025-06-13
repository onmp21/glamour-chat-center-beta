import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  label?: string;
  showPercentage?: boolean;
  height?: number;
  color?: string;
  backgroundColor?: string;
  className?: string;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
  height = 8,
  color = 'bg-primary',
  backgroundColor = 'bg-gray-200',
  className = '',
  animated = true,
}) => {
  // Garantir que o progresso esteja entre 0 e 100
  const normalizedProgress = Math.min(100, Math.max(0, progress));
  
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showPercentage && (
            <span className="text-sm font-medium text-gray-500">{Math.round(normalizedProgress)}%</span>
          )}
        </div>
      )}
      
      <div 
        className={`w-full ${backgroundColor} rounded-full overflow-hidden`}
        style={{ height: `${height}px` }}
      >
        <div 
          className={`${color} ${animated ? 'transition-all duration-300 ease-out' : ''}`}
          style={{ 
            width: `${normalizedProgress}%`,
            height: '100%'
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;

