import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EyebrowProps {
  children: ReactNode;
  tone?: 'green' | 'amber';
  showDot?: boolean;
  className?: string;
}

export function Eyebrow({
  children,
  tone = 'green',
  showDot = true,
  className,
}: EyebrowProps) {
  const toneClass =
    tone === 'amber' ? 'text-viability-amber' : 'text-viability-green';

  return (
    <span
      className={cn(
        'font-sans font-medium text-[11px] uppercase tracking-[0.18em]',
        'inline-flex items-center',
        toneClass,
        className,
      )}
    >
      {showDot && (
        <span
          className={cn(
            'inline-block w-[6px] h-[6px] rounded-full mr-2',
            tone === 'amber' ? 'bg-viability-amber' : 'bg-viability-green',
          )}
        />
      )}
      {children}
    </span>
  );
}
