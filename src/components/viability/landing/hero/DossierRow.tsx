import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { Light } from './thresholds';

interface DossierRowProps {
  label: ReactNode;
  display: string;
  hint: string;
  light: Light;
  emphasised?: boolean;
}

const dotColour: Record<Light, string> = {
  pending: 'bg-viability-fg-faint',
  green: 'bg-viability-green',
  amber: 'bg-viability-amber',
  red: 'bg-viability-red',
};

const dotGlow: Record<Light, string> = {
  pending: '',
  green: 'shadow-[0_0_0_4px_var(--vbr-green-softer)]',
  amber: 'shadow-[0_0_0_4px_var(--vbr-amber-soft)]',
  red: 'shadow-[0_0_0_4px_var(--vbr-red-soft)]',
};

export function DossierRow({
  label,
  display,
  hint,
  light,
  emphasised = false,
}: DossierRowProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-[1fr_auto] items-center gap-4 border-t border-viability-border',
        emphasised
          ? 'py-3.5 -mx-[22px] px-[22px] bg-[rgba(52,211,153,0.025)]'
          : 'py-[11px]',
      )}
    >
      <div>
        <div
          className={cn(
            'font-sans text-[13px]',
            emphasised
              ? 'text-viability-cream font-medium mb-0.5'
              : 'text-viability-fg-muted mb-0.5',
          )}
        >
          {label}
        </div>
        <div
          className={cn(
            'font-mono text-[11px] tracking-[0.04em]',
            light === 'pending'
              ? 'text-viability-fg-faint'
              : 'text-viability-fg-subtle',
          )}
        >
          {hint}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'font-mono tabular-nums',
            emphasised ? 'text-[18px] font-medium' : 'text-[15.5px] font-normal',
            light === 'pending' ? 'text-viability-fg-faint' : 'text-viability-cream',
            'motion-safe:transition-colors motion-safe:duration-200',
          )}
        >
          {display}
        </span>
        <span
          className={cn(
            'rounded-full',
            emphasised ? 'w-[11px] h-[11px]' : 'w-[9px] h-[9px]',
            dotColour[light],
            dotGlow[light],
            'motion-safe:transition-[background-color,box-shadow] motion-safe:duration-200',
          )}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
