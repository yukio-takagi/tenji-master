
import React from 'react';
import { DotState } from '../types';

interface BrailleCellProps {
  dots: DotState;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  interactive?: boolean;
  onToggleDot?: (index: number) => void;
}

const BrailleCell: React.FC<BrailleCellProps> = ({ 
  dots, 
  size = 'md', 
  label, 
  interactive = false, 
  onToggleDot 
}) => {
  const sizes = {
    sm: 'w-12 h-16 p-1',
    md: 'w-24 h-32 p-3',
    lg: 'w-32 h-44 p-4',
  };

  const dotSizes = {
    sm: 'w-3 h-3',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  // Dot order visual layout:
  // 0 3
  // 1 4
  // 2 5
  const visualIndices = [0, 3, 1, 4, 2, 5];

  return (
    <div className="flex flex-col items-center">
      <div className={`${sizes[size]} bg-white border-2 border-slate-200 rounded-xl shadow-sm grid grid-cols-2 gap-2 content-center`}>
        {visualIndices.map((idx) => (
          <button
            key={idx}
            disabled={!interactive}
            onClick={() => onToggleDot?.(idx)}
            className={`
              ${dotSizes[size]} rounded-full transition-all duration-200
              ${dots[idx] ? 'bg-indigo-600 scale-110 shadow-md' : 'bg-slate-100 hover:bg-slate-200'}
              ${interactive ? 'cursor-pointer active:scale-90' : 'cursor-default'}
            `}
          />
        ))}
      </div>
      {label && <span className="mt-2 text-sm font-bold text-slate-600 uppercase">{label}</span>}
    </div>
  );
};

export default BrailleCell;
