/* Mojo Viability — v2 page shell.
 *  FullLandingV2 — desktop, all sections, header + footer.
 */

function FullLandingV2({
  showAmber = true,
  showBadges = true,
  showMojo360Strip = true,
  showCrossLink = true,
  venueKey = 'cafe',
  dossierState = 'empty',
}) {
  return (
    <div style={{
      width: '100%', background: VBR.ink, color: VBR.cream,
      fontFamily: VBR.fontBody,
    }}>
      <ViabilityHeader/>
      <HeroLiveDossier showAmber={showAmber} venueKey={venueKey} initialState={dossierState}/>
      <ViabilityTicker/>
      <SectionWhat/>
      <SectionBuiltFor showAmber={showAmber}/>
      <SectionHow/>
      <SectionProof showBadges={showBadges} showAmber={showAmber}/>
      {showMojo360Strip && <SectionMojo360/>}
      <SectionFinalCTA/>
      <ViabilityTicker/>
      <ViabilityFooter showCrossLink={showCrossLink}/>
    </div>
  );
}

Object.assign(window, { FullLandingV2 });
