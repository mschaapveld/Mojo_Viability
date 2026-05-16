import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface HairlineLabelProps {
  children: ReactNode;
  className?: string;
}

export function HairlineLabel({ children, className }: HairlineLabelProps) {
  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <span className="block w-px h-[28px] bg-viability-border" />
      <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-viability-fg-subtle">
        {children}
      </span>
    </div>
  );
}
