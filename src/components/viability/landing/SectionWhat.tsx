import { Eyebrow } from '@/components/viability/Eyebrow';
import { SectionShell } from './SectionShell';

const CARDS = [
  {
    kicker: '01',
    title: 'The money',
    blurb:
      'Whether the numbers actually stack — and what happens when one assumption moves.',
    items: [
      'simple break-even',
      'detailed break-even',
      'fitout finance · rent vs buy',
      'labour costing',
    ],
  },
  {
    kicker: '02',
    title: 'The location',
    blurb:
      'Whether the site can deliver the foot traffic and the mix you are betting on.',
    items: ['location suitability', 'sales modelling', 'sales predictions'],
  },
  {
    kicker: '03',
    title: 'The operations',
    blurb:
      'Whether the format will actually run — hours, menu, roster, plan.',
    items: [
      'hours of operation',
      'menu building',
      'business planning',
      'AI plan draft + builder',
    ],
  },
] as const;

export function SectionWhat() {
  return (
    <SectionShell id="what">
      <div className="max-w-[760px] mb-14">
        <Eyebrow>What you’re checking for</Eyebrow>
        <h2 className="font-display font-semibold text-[clamp(38px,4.2vw,60px)] leading-[1.02] tracking-[-0.025em] mt-6 text-viability-cream text-balance">
          The deal-breakers fall into three places.
        </h2>
        <p className="font-sans font-light text-[17px] leading-[1.6] text-viability-fg-muted mt-6 max-w-[620px]">
          Mojo Viability covers the surface area of a venue concept across
          twelve modules — grouped here so you can see what the tool is
          actually looking at.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {CARDS.map((c) => (
          <article
            key={c.title}
            className="relative bg-viability-ink-2 border border-viability-border rounded-tight p-7 min-h-[320px] flex flex-col gap-3 overflow-hidden"
          >
            <span className="absolute top-5 right-5 font-mono text-[11px] tracking-[0.14em] text-viability-fg-subtle">
              {c.kicker}
            </span>
            <h3 className="font-display font-semibold text-[28px] leading-[1.1] tracking-[-0.02em] text-viability-cream">
              {c.title}
            </h3>
            <p className="font-sans font-light text-[14.5px] leading-[1.55] text-viability-fg-muted">
              {c.blurb}
            </p>
            <div className="mt-auto flex flex-col gap-2 pt-4">
              <span className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-viability-green">
                Modules
              </span>
              {c.items.map((m) => (
                <div
                  key={m}
                  className="flex items-center gap-2.5 font-mono text-[12px] text-viability-fg-muted"
                >
                  <span className="text-viability-fg-subtle">·</span>
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
