import { Eyebrow } from '@/components/viability/Eyebrow';
import { SectionShell } from './SectionShell';

const BADGES = [
  '~25% close in year 1',
  '~30–35% close in year 2',
  '~50–55% close in year 5',
] as const;

export function SectionProof() {
  return (
    <SectionShell id="proof" className="bg-[#0a0a0a] border-t border-viability-border">
      <div className="grid grid-cols-1 md:grid-cols-[1.15fr_1fr] gap-10 md:gap-20 items-start">
        {/* Left column — market stat */}
        <div>
          <Eyebrow tone="amber">The cost of getting it wrong</Eyebrow>

          {/* TODO: confirm precise ABS source + URL with Max before public launch */}
          <div className="font-display font-bold text-[clamp(72px,9vw,132px)] leading-[0.92] tracking-[-0.04em] text-viability-cream mt-6 mb-2">
            ~1 in 2
          </div>
          <p className="font-display font-medium text-[clamp(28px,2.4vw,36px)] leading-[1.1] tracking-[-0.015em] text-viability-cream mt-2 mb-5 max-w-[520px] text-balance">
            Australian small businesses don’t make it to five years.
          </p>
          <p className="font-sans font-light text-[15.5px] leading-[1.6] text-viability-fg-muted mb-6 max-w-[460px]">
            ABS-aligned analyses put five-year survival around 45–50%. The
            operators who model first don’t always succeed — but they’re far
            less likely to fail blind.
          </p>

          <div className="flex flex-wrap gap-2">
            {BADGES.map((b) => (
              <span
                key={b}
                className="font-mono text-[11px] tracking-[0.06em] text-viability-fg-muted px-3 py-[7px] rounded-pill border border-viability-border bg-[rgba(245,242,237,0.02)]"
              >
                {b}
              </span>
            ))}
          </div>

          <p className="font-mono text-[10.5px] leading-[1.5] text-viability-fg-faint tracking-[0.04em] mt-6">
            Source · Commentaries back-checking ABS small-business counts
            (8165.0). Figures are approximations.
          </p>
        </div>

        {/* Right column — founder story card */}
        <div className="relative bg-viability-ink-2 border border-viability-border rounded-tight px-8 pt-10 pb-8">
          <span className="absolute -top-[10px] left-7 bg-viability-ink-2 px-3 font-mono text-[10.5px] tracking-[0.16em] uppercase text-viability-fg-muted">
            From the maker
          </span>

          <div className="font-display font-semibold text-[28px] leading-[1.1] tracking-[-0.02em] text-viability-cream mb-5 mt-1">
            <span
              className="font-display italic text-viability-green mr-1"
              style={{ fontSize: 56, lineHeight: 0, verticalAlign: '-0.2em' }}
              aria-hidden="true"
            >
              “
            </span>
            Behind every closed venue there’s a family.
            <span
              className="font-display italic text-viability-green ml-1"
              style={{ fontSize: 56, lineHeight: 0, verticalAlign: '-0.2em' }}
              aria-hidden="true"
            >
              ”
            </span>
          </div>

          <p className="font-sans font-light text-[15.5px] leading-[1.65] text-viability-fg-muted m-0">
            I’ve watched mates sign leases on numbers that never had a chance —
            savings drained, marriages stretched, sometimes worse. I built
            Mojo Viability because the deal-breakers are almost always visible{' '}
            <em>before</em> the lease is signed; you just need a structured way
            to look. The tool doesn’t promise success. It just makes the
            structural mistakes visible while there’s still time to walk away.
            If it helps one operator make a better call, it’s done its job.
          </p>

          <div className="mt-6 pt-5 border-t border-viability-border flex items-center gap-3.5">
            <div className="w-[38px] h-[38px] rounded-full bg-viability-green-soft border border-viability-green-line flex items-center justify-center font-display font-bold text-[16px] text-viability-green">
              MS
            </div>
            <div>
              <div className="font-sans text-[13.5px] font-medium text-viability-cream">
                Max Schaapveld
              </div>
              <div className="font-sans text-[12px] text-viability-fg-subtle mt-0.5">
                Built Mojo Viability · Port Macquarie NSW
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
