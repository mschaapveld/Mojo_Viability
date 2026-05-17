import { useNavigate } from 'react-router-dom';
import { Eyebrow } from '@/components/viability/Eyebrow';
import { VButton } from '@/components/viability/VButton';
import { LiveDossierCard } from './LiveDossierCard';

const STATS = [
  ['12', 'modules in the full tool'],
  ['~30', 'min to a first honest read'],
  ['$0', 'no paid tier · no card'],
] as const;

export function HeroLiveDossier() {
  const navigate = useNavigate();

  return (
    <section className="w-full">
      <div
        className="relative max-w-[1180px] mx-auto px-6 md:px-14"
        style={{ paddingTop: 108, paddingBottom: 88 }}
      >
        <span className="hidden md:block absolute top-[28px] right-14 font-mono text-[10.5px] uppercase tracking-[0.16em] text-viability-fg-subtle">
          Live dossier
        </span>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.05fr] gap-12 md:gap-[76px] items-center">
          {/* Left rail */}
          <div className="flex flex-col">
            <Eyebrow>Mojo Viability · A free tool</Eyebrow>

            <h1
              className="font-display font-semibold text-[clamp(50px,5.8vw,82px)] leading-[0.96] tracking-[-0.035em] text-viability-cream mt-7 max-w-[600px] text-balance"
              style={{ fontVariationSettings: '"opsz" 144' }}
            >
              Before you sign the lease,
              <br />
              <span className="italic">model</span> the venue.
            </h1>

            <p className="font-sans font-light text-[17px] leading-[1.6] text-viability-fg-muted mt-7 max-w-[480px]">
              Move the four sliders → watch your viability case write itself.
              Then come back and run the full{' '}
              <span className="text-viability-amber">twelve-module</span>{' '}
              version.
            </p>

            <div className="flex items-center gap-6 flex-wrap mt-9">
              <VButton size="lg" onClick={() => navigate('/start')}>
                Let’s do this properly →
              </VButton>
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="font-sans text-[14px] text-viability-fg-muted hover:text-viability-cream border-b border-viability-fg-faint hover:border-viability-fg-muted pb-0.5 transition-colors"
              >
                Already have an account? Sign in
              </button>
            </div>

            <div className="mt-9 pt-[22px] border-t border-viability-border grid grid-cols-3 gap-8 max-w-[520px]">
              {STATS.map(([n, l]) => (
                <div key={l}>
                  <div className="font-display font-semibold text-[32px] leading-none tracking-[-0.02em] text-viability-green">
                    {n}
                  </div>
                  <div className="font-sans font-light text-[12px] leading-[1.4] text-viability-fg-muted mt-1.5">
                    {l}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right rail */}
          <LiveDossierCard />
        </div>
      </div>
    </section>
  );
}
