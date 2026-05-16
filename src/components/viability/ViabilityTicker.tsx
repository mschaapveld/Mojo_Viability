import { cn } from '@/lib/utils';

const TICKER_ITEMS = [
  '100% FREE FOREVER',
  'NO PAID TIER',
  'NO IN-APP PURCHASES',
  'NO HIDDEN CHARGES',
  'NO CREDIT CARD',
  'USE IT AS LONG AS YOU NEED',
  'NO TRIAL THAT ENDS',
  'BUILT TO PREVENT CLOSURE — NOT PROFIT FROM IT',
] as const;

interface ViabilityTickerProps {
  className?: string;
}

export function ViabilityTicker({ className }: ViabilityTickerProps) {
  return (
    <div
      className={cn(
        'w-full bg-viability-green overflow-hidden py-3',
        'border-y border-[rgba(6,43,29,0.15)]',
        className,
      )}
      role="marquee"
      aria-label="Mojo Viability is free forever"
    >
      <div
        className={cn(
          'flex whitespace-nowrap',
          'motion-safe:animate-viability-ticker-mobile motion-safe:sm:animate-viability-ticker',
        )}
        style={{ willChange: 'transform' }}
      >
        {[0, 1, 2].map((copy) =>
          TICKER_ITEMS.map((item, j) => (
            <span
              key={`${copy}-${j}`}
              className={cn(
                'inline-flex items-center',
                'font-sans font-bold text-[12.5px] uppercase tracking-[0.18em]',
                'text-viability-green-on',
                'gap-11',
              )}
              style={{ paddingRight: 44 }}
            >
              {item}
              <span className="opacity-45 text-[14px]">✦</span>
            </span>
          )),
        )}
      </div>
    </div>
  );
}
