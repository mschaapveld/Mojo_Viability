import { MGlyph } from '@/components/viability/MGlyph';
import { SectionShell } from './SectionShell';

export function SectionMojo360() {
  return (
    <SectionShell id="mojo360" className="!py-[72px]">
      <div
        className="relative overflow-hidden rounded-chip border border-m360-orange-line bg-viability-ink-2 p-8 md:p-9"
        style={{
          backgroundImage:
            'linear-gradient(180deg, rgba(232,98,42,0.04) 0%, rgba(232,98,42,0) 100%)',
        }}
      >
        {/* Decorative dotted orange side rail */}
        <div
          className="absolute right-0 top-4 bottom-4 w-px"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, var(--m360-orange-line) 0 4px, transparent 4px 8px)',
          }}
          aria-hidden="true"
        />

        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-6 md:gap-8 items-center">
          {/* M-glyph tile */}
          <div className="w-14 h-14 rounded-[12px] bg-m360-orange-soft border border-m360-orange-line flex items-center justify-center">
            <MGlyph size={32} color="var(--m360-orange)" ink="var(--vbr-ink)" />
          </div>

          {/* Copy */}
          <div>
            <span className="inline-flex items-center gap-2 font-display-alt font-semibold text-[11px] uppercase tracking-[0.16em] text-m360-orange mb-2.5">
              <span className="inline-block w-[6px] h-[6px] rounded-full bg-m360-orange" />
              Once you’re open · Mojo 360
            </span>
            <h3 className="font-display-alt font-bold text-[clamp(22px,2.6vw,28px)] tracking-[-0.02em] text-viability-cream leading-[1.1] mb-2.5">
              When you’re trading, our{' '}
              <span className="text-m360-orange">sibling</span> takes over.
            </h3>
            <p className="font-sans font-light text-[14.5px] leading-[1.6] text-viability-fg-muted m-0 max-w-[620px]">
              Five virtual managers —{' '}
              <span className="text-viability-cream font-medium">
                Sales · Ops · Marketing · Finance · People
              </span>{' '}
              — running the day-to-day so you don’t have to. Separate paid
              product. Same operator-first thinking.
            </p>
          </div>

          {/* CTA */}
          <a
            href="https://mojo360.com.au"
            target="_blank"
            rel="noopener noreferrer"
            className="font-display-alt font-bold text-[13px] tracking-[0.04em] text-white bg-m360-orange hover:bg-m360-orange-hover hover:-translate-y-[1px] hover:shadow-[0_4px_20px_rgba(232,98,42,0.35)] transition-all duration-200 inline-flex items-center gap-2 px-[22px] py-[13px] rounded-pill whitespace-nowrap"
          >
            Visit Mojo 360 →
          </a>
        </div>
      </div>
    </SectionShell>
  );
}
