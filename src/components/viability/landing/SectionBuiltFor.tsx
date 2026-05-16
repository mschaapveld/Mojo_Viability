import { Eyebrow } from '@/components/viability/Eyebrow';
import { SectionShell } from './SectionShell';
import { cn } from '@/lib/utils';

interface BuiltForCard {
  key: 'first' | 'second' | 'deal';
  kicker: string;
  title: string;
  body: string;
  tag?: string;
}

const CARDS: readonly BuiltForCard[] = [
  {
    key: 'first',
    kicker: 'First venue',
    title: 'Catch what you don’t know you don’t know.',
    body: 'You haven’t run one before. The cost of a structural mistake is the rest of your life. Use Viability to make those mistakes visible while they’re still on paper.',
    tag: 'highest stakes',
  },
  {
    key: 'second',
    kicker: 'Venue #2',
    title: 'Pressure-test the site, the format, the numbers.',
    body: 'You already operate. You know the operational pain. Use the tool for speed — model the new site’s realities against the one you already understand.',
  },
  {
    key: 'deal',
    kicker: 'Investor · partner',
    title: 'A structured case to take to a bank.',
    body: 'You’re looking at someone else’s concept and a request for capital. Get an exportable viability dossier that holds up under questioning, not a pitch.',
  },
];

export function SectionBuiltFor() {
  return (
    <SectionShell id="built-for">
      <div className="max-w-[760px] mb-14">
        <Eyebrow>Built for</Eyebrow>
        <h2 className="font-display font-semibold text-[clamp(38px,4.2vw,60px)] leading-[1.02] tracking-[-0.025em] mt-6 text-viability-cream text-balance">
          Three people land here, with the same question.
        </h2>
        <p className="font-sans font-light text-[17px] leading-[1.6] text-viability-fg-muted mt-6 max-w-[620px]">
          The tool triages explicitly — pick the card that sounds like you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {CARDS.map((c) => (
          <article
            key={c.key}
            className="relative bg-viability-ink-2 border border-viability-border rounded-tight p-7 min-h-[320px] flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-viability-green">
                {c.kicker}
              </span>
              {c.tag && (
                <span
                  className={cn(
                    'font-mono text-[10px] tracking-[0.14em] uppercase',
                    'bg-viability-amber-soft border border-viability-amber-line text-viability-amber',
                    'px-2.5 py-1 rounded-pill',
                  )}
                >
                  {c.tag}
                </span>
              )}
            </div>
            <h3 className="font-display font-semibold text-[24px] leading-[1.15] tracking-[-0.02em] text-viability-cream text-balance mb-3">
              {c.title}
            </h3>
            <p className="font-sans font-light text-[14.5px] leading-[1.6] text-viability-fg-muted m-0">
              {c.body}
            </p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
