import React from 'react';
import { cn } from '../../utils/cn';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
  return (
    <div className={cn('bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden', className)} {...props}>
      {children}
    </div>
  );
};
