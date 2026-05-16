import { ViabilityHeader } from '@/components/viability/ViabilityHeader';
import { ViabilityFooter } from '@/components/viability/ViabilityFooter';
import { ViabilityTicker } from '@/components/viability/ViabilityTicker';
import { Eyebrow } from '@/components/viability/Eyebrow';
import { VButton } from '@/components/viability/VButton';
import { MGlyph } from '@/components/viability/MGlyph';
import { HairlineLabel } from '@/components/viability/HairlineLabel';

export default function DesignPreview() {
  return (
    <div className="bg-viability-ink text-viability-cream min-h-screen font-sans">
      <ViabilityHeader />
      <main className="pt-24 pb-24 max-w-[1180px] mx-auto px-14 space-y-16">
        <section>
          <Eyebrow>Design preview · internal</Eyebrow>
          <h1 className="font-display font-semibold text-5xl mt-4">
            Token + chrome sanity check.
          </h1>
          <p className="text-viability-fg-muted max-w-[620px] mt-6">
            This page exists only to verify Dispatch A. Removed in Dispatch B.
          </p>
        </section>

        <section className="space-y-4">
          <Eyebrow tone="amber">Buttons</Eyebrow>
          <div className="flex flex-wrap items-center gap-4">
            <VButton size="sm">Try free →</VButton>
            <VButton size="md">Try free →</VButton>
            <VButton size="lg">Let&apos;s do this properly →</VButton>
            <VButton variant="ghost">Ghost variant</VButton>
          </div>
        </section>

        <section className="space-y-4">
          <Eyebrow>Glyphs</Eyebrow>
          <div className="flex items-center gap-8">
            <MGlyph size={22} />
            <MGlyph size={26} />
            <MGlyph size={32} />
            <MGlyph size={32} color="var(--m360-orange)" />
          </div>
        </section>

        <section className="space-y-4">
          <Eyebrow>HairlineLabel</Eyebrow>
          <HairlineLabel>Port Macquarie · NSW</HairlineLabel>
        </section>
      </main>

      <ViabilityTicker />
      <ViabilityFooter />
    </div>
  );
}
