import { cn } from '@/lib/utils';

interface ShopfrontPlaceholderProps {
  caption: string;
  className?: string;
}

export function ShopfrontPlaceholder({ caption, className }: ShopfrontPlaceholderProps) {
  return (
    <div
      className={cn(
        'relative bg-viability-ink-2 rounded-tight aspect-[4/3] overflow-hidden',
        'border border-viability-border',
        className,
      )}
      style={{
        backgroundImage:
          'repeating-linear-gradient(45deg, rgba(245,242,237,0.025) 0 8px, rgba(245,242,237,0) 8px 16px)',
      }}
    >
      {/* Corner brackets */}
      <span className="absolute top-[10px] left-[10px] w-[14px] h-[14px] border-t border-l border-viability-border-strong" />
      <span className="absolute top-[10px] right-[10px] w-[14px] h-[14px] border-t border-r border-viability-border-strong" />
      <span className="absolute bottom-[10px] left-[10px] w-[14px] h-[14px] border-b border-l border-viability-border-strong" />
      <span className="absolute bottom-[10px] right-[10px] w-[14px] h-[14px] border-b border-r border-viability-border-strong" />

      {/* Centred caption */}
      <span className="absolute inset-0 flex items-center justify-center font-mono text-[11px] uppercase tracking-[0.16em] text-viability-fg-subtle text-center px-6">
        {caption}
      </span>
    </div>
  );
}
