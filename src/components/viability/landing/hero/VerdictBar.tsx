import { cn } from '@/lib/utils';

export type Tone = 'pending' | 'green' | 'amber' | 'red';

interface VerdictBarProps {
  tone: Tone;
  label: string;
  sub: string;
}

const toneBg: Record<Tone, string> = {
  pending: 'bg-transparent',
  green: 'bg-viability-green-soft',
  amber: 'bg-viability-amber-soft',
  red: 'bg-viability-red-soft',
};

const toneBorder: Record<Tone, string> = {
  pending: 'border-viability-border',
  green: 'border-viability-green-line',
  amber: 'border-viability-amber-line',
  red: 'border-viability-red-line',
};

const toneDot: Record<Tone, string> = {
  pending: 'bg-viability-fg-faint',
  green: 'bg-viability-green',
  amber: 'bg-viability-amber',
  red: 'bg-viability-red',
};

const toneGlow: Record<Tone, string> = {
  pending: 'shadow-[0_0_0_4px_rgba(245,242,237,0.02)]',
  green: 'shadow-[0_0_0_4px_var(--vbr-green-soft)]',
  amber: 'shadow-[0_0_0_4px_var(--vbr-amber-soft)]',
  red: 'shadow-[0_0_0_4px_var(--vbr-red-soft)]',
};

const toneText: Record<Tone, string> = {
  pending: 'text-viability-fg-muted',
  green: 'text-viability-green',
  amber: 'text-viability-amber',
  red: 'text-viability-red',
};

export function VerdictBar({ tone, label, sub }: VerdictBarProps) {
  return (
    <div
      className={cn(
        'flex justify-between items-center gap-4',
        'px-[22px] py-4 border-t',
        toneBorder[tone],
        toneBg[tone],
        'motion-safe:transition-[background-color,border-color] motion-safe:duration-[240ms]',
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'w-[10px] h-[10px] rounded-full shrink-0',
            toneDot[tone],
            toneGlow[tone],
          )}
          aria-hidden="true"
        />
        <div>
          <div
            className={cn(
              'font-display font-semibold text-[16px] tracking-[-0.01em] leading-[1.1]',
              toneText[tone],
            )}
          >
            {label}
          </div>
          <div className="font-mono text-[10.5px] tracking-[0.06em] text-viability-fg-subtle mt-1 lowercase">
            {sub}
          </div>
        </div>
      </div>
      <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-viability-fg-muted whitespace-nowrap">
        Export · PDF / xls →
      </span>
    </div>
  );
}
