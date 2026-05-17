import { Eyebrow } from '@/components/viability/Eyebrow';
import { SectionShell } from './SectionShell';
import { ShopfrontPlaceholder } from './ShopfrontPlaceholder';

const STEPS = [
  {
    n: '01',
    title: 'Sketch your concept',
    body: 'Format, location, hours, scale. Five minutes. No login required to try.',
  },
  {
    n: '02',
    title: 'Run the modules',
    body: 'Break-even, fitout, labour, location, sales — answer as much or as little as you have. The tool tells you what’s missing.',
  },
  {
    n: '03',
    title: 'Export the case',
    body: 'Get a structured viability dossier — PDF or Excel — built for a lender, a partner, or your own desk.',
  },
] as const;

export function SectionHow() {
  return (
    <SectionShell id="how">
      <div className="max-w-[760px] mb-14">
        <Eyebrow>How it works</Eyebrow>
        <h2 className="font-display font-semibold text-[clamp(38px,4.2vw,60px)] leading-[1.02] tracking-[-0.025em] mt-6 text-viability-cream text-balance">
          Three moves from concept to case.
        </h2>
        <p className="font-sans font-light text-[17px] leading-[1.6] text-viability-fg-muted mt-6 max-w-[620px]">
          A first read takes about thirty minutes. You can come back to it as
          often as you like — every change recalculates the verdict.
        </p>
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-0">
        {/* Horizontal dotted green rail (desktop only) */}
        <div
          className="hidden md:block absolute top-7 left-[14%] right-[14%] h-px"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to right, var(--vbr-green-line) 0 4px, transparent 4px 9px)',
          }}
        />
        {STEPS.map((s, i) => (
          <div
            key={s.n}
            className={`relative md:px-8 ${i > 0 ? 'md:border-l md:border-viability-border' : ''}`}
          >
            <div
              className="w-14 h-14 rounded-full border border-viability-green-line bg-viability-ink flex items-center justify-center font-mono text-[14px] text-viability-green tracking-[0.06em] relative z-10 mb-7"
              style={{ boxShadow: '0 0 0 8px var(--vbr-ink)' }}
            >
              {s.n}
            </div>
            <h3 className="font-display font-semibold text-[22px] leading-[1.15] tracking-[-0.02em] text-viability-cream mb-2.5">
              {s.title}
            </h3>
            <p className="font-sans font-light text-[14.5px] leading-[1.6] text-viability-fg-muted m-0 max-w-[320px]">
              {s.body}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-5">
        <ShopfrontPlaceholder
          caption="PRE-FITOUT SHOPFRONT · INTERIOR"
          image={{
            src: '/images/landing-shopfront-interior.jpg',
            alt: 'Empty pre-fitout café interior — exposed brick, polished concrete, late-afternoon light through the shopfront window.',
          }}
        />
        <ShopfrontPlaceholder caption="UNSIGNED LEASE · TABLE STILL LIFE" />
      </div>
    </SectionShell>
  );
}
