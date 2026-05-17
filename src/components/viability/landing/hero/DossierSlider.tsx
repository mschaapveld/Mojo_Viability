import { cn } from '@/lib/utils';

interface DossierSliderProps {
  label: string;
  help: string;
  value: number;
  touched: boolean;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  untouchedDisplay: string;
  onChange: (next: number) => void;
}

export function DossierSlider({
  label,
  help,
  value,
  touched,
  min,
  max,
  step,
  format,
  untouchedDisplay,
  onChange,
}: DossierSliderProps) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-end gap-3">
        <div>
          <span className="block font-sans text-[12.5px] text-viability-fg-muted">
            {label}
          </span>
          <span className="block font-mono text-[10px] text-viability-fg-subtle tracking-[0.04em] mt-0.5">
            {help}
          </span>
        </div>
        <span
          className={cn(
            'font-mono text-[13px] tabular-nums whitespace-nowrap',
            touched ? 'text-viability-cream' : 'text-viability-fg-subtle',
          )}
        >
          {touched ? format(value) : untouchedDisplay}
        </span>
      </div>

      <div className="relative h-[26px]">
        {/* Background track */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-[rgba(245,242,237,0.08)] rounded-[2px]" />
        {/* Fill */}
        <div
          className={cn(
            'absolute left-0 top-1/2 -translate-y-1/2 h-[2px] rounded-[2px]',
            touched ? 'bg-viability-green' : 'bg-[rgba(245,242,237,0.15)]',
            'motion-safe:transition-[width,background-color] motion-safe:duration-200',
          )}
          style={{ width: `${pct}%` }}
        />
        {/* Hidden native input — accessible + interactive */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer m-0 p-0"
        />
        {/* Visual thumb (pointer-events-none so the input below stays clickable) */}
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full pointer-events-none',
            'bg-viability-ink border-[1.5px]',
            touched ? 'border-viability-green' : 'border-viability-fg-subtle',
            touched && 'shadow-[0_0_0_5px_var(--vbr-green-softer)]',
            'motion-safe:transition-[left,border-color,box-shadow] motion-safe:duration-200',
          )}
          style={{ left: `${pct}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
