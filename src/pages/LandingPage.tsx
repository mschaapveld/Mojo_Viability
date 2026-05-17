import { ViabilityHeader } from '@/components/viability/ViabilityHeader';
import { ViabilityFooter } from '@/components/viability/ViabilityFooter';
import { ViabilityTicker } from '@/components/viability/ViabilityTicker';
import { HeroLiveDossier } from '@/components/viability/landing/hero/HeroLiveDossier';
import { SectionWhat } from '@/components/viability/landing/SectionWhat';
import { SectionBuiltFor } from '@/components/viability/landing/SectionBuiltFor';
import { SectionHow } from '@/components/viability/landing/SectionHow';
import { SectionProof } from '@/components/viability/landing/SectionProof';
import { SectionMojo360 } from '@/components/viability/landing/SectionMojo360';
import { SectionFinalCTA } from '@/components/viability/landing/SectionFinalCTA';

export default function LandingPage() {
  return (
    <div className="bg-viability-ink text-viability-cream font-sans min-h-screen">
      <ViabilityHeader activePage="home" />
      <HeroLiveDossier />
      <ViabilityTicker />
      <SectionWhat />
      <SectionBuiltFor />
      <SectionHow />
      <SectionProof />
      <SectionMojo360 />
      <SectionFinalCTA />
      <ViabilityTicker />
      <ViabilityFooter />
    </div>
  );
}
