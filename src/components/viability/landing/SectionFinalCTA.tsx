import { useNavigate } from 'react-router-dom';
import { Eyebrow } from '@/components/viability/Eyebrow';
import { VButton } from '@/components/viability/VButton';

export function SectionFinalCTA() {
  const navigate = useNavigate();

  return (
    <section className="w-full bg-viability-ink relative overflow-hidden border-t border-viability-border">
      {/* Soft green radial wash */}
      <div
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          top: '-40%',
          width: 900,
          height: 900,
          background:
            'radial-gradient(closest-side, rgba(52,211,153,0.10), rgba(52,211,153,0))',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-[920px] mx-auto text-center py-[110px] px-6 md:px-14">
        <div className="flex justify-center mb-6">
          <Eyebrow showDot={false}>Free forever — that’s the whole deal</Eyebrow>
        </div>

        <h2 className="font-display font-semibold text-[clamp(44px,5vw,72px)] leading-[1.0] tracking-[-0.03em] text-viability-cream text-balance mb-6">
          Run the numbers before
          <br />
          <span className="italic">you sign anything.</span>
        </h2>

        <p className="font-sans font-light text-[17px] leading-[1.55] text-viability-fg-muted mx-auto mb-9 max-w-[520px]">
          Thirty minutes to a first read. Bank-ready export at the end. No paid
          tier · no in-app purchases · no credit card · no trial that ends.
        </p>

        <div className="flex justify-center items-center gap-6 flex-wrap">
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
      </div>
    </section>
  );
}
