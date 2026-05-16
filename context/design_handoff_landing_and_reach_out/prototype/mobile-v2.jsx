/* Mojo Viability — v2 mobile shell.
 *   MobileLandingV2 — narrow viewport, live dossier with three % sliders.
 */

function MobileLandingV2({ showAmber = true, showCrossLink = true, venueKey = 'cafe', dossierState = 'empty' }) {
  return (
    <div style={{
      width: '100%', background: VBR.ink, color: VBR.cream,
      fontFamily: VBR.fontBody,
    }}>
      <MobileStatusBar/>
      <MobileHeaderV2/>
      <MobileLiveDossier showAmber={showAmber} venueKey={venueKey} initialState={dossierState}/>
      <ViabilityTicker duration={28}/>
      <MobileMojo360Card/>
      <MobileFooterV2 showCrossLink={showCrossLink}/>
    </div>
  );
}

function MobileStatusBar() {
  return (
    <div style={{
      height: 44, padding: '0 22px', display: 'flex',
      alignItems: 'center', justifyContent: 'space-between',
      fontFamily: VBR.fontBody, fontSize: 12.5, color: VBR.cream, fontWeight: 500,
    }}>
      <span>9:41</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          width: 16, height: 8, border: `1px solid ${VBR.cream}`, borderRadius: 2,
          position: 'relative', display: 'inline-block',
        }}>
          <span style={{ position: 'absolute', inset: 1, background: VBR.cream, width: '70%' }}/>
        </span>
      </span>
    </div>
  );
}

function MobileHeaderV2() {
  return (
    <header style={{
      padding: '12px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: VBR.hairline,
    }}>
      <a href="#" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
        <MGlyph size={22} color={VBR.green} ink={VBR.ink}/>
        <span style={{ fontFamily: VBR.fontDisplay, fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
          <span style={{ color: VBR.green }}>Mojo</span>{' '}
          <span style={{ color: VBR.cream }}>Viability</span>
        </span>
      </a>
      <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ width: 18, height: 1.5, background: VBR.cream, borderRadius: 1, display: 'inline-block' }}/>
        <span style={{ width: 18, height: 1.5, background: VBR.cream, borderRadius: 1, display: 'inline-block' }}/>
      </span>
    </header>
  );
}

/* Mobile: live dossier with three % sliders */
function MobileLiveDossier({ showAmber, venueKey, initialState }) {
  const venue = SAMPLE_VENUES[venueKey] || SAMPLE_VENUES.cafe;

  const setFromState = (s) => {
    if (s === 'empty') return { rent: 0, cogs: 0, labour: 0, other: 0 };
    return { ...venue.preset[s] };
  };

  const [vals, setVals] = React.useState(setFromState(initialState));
  const [touched, setTouched] = React.useState({
    rent:   initialState !== 'empty',
    cogs:   initialState !== 'empty',
    labour: initialState !== 'empty',
    other:  initialState !== 'empty',
  });

  React.useEffect(() => {
    setVals(setFromState(initialState));
    setTouched({
      rent:   initialState !== 'empty',
      cogs:   initialState !== 'empty',
      labour: initialState !== 'empty',
      other:  initialState !== 'empty',
    });
  }, [initialState, venueKey]);

  const onSlide = (k) => (e) => {
    const v = Number(e.target.value);
    setVals((p) => ({ ...p, [k]: v }));
    if (!touched[k]) setTouched((t) => ({ ...t, [k]: true }));
  };

  const allTouched = touched.rent && touched.cogs && touched.labour && touched.other;
  const anyTouched = touched.rent || touched.cogs || touched.labour || touched.other;
  const totalCost = vals.cogs + vals.labour + vals.other;
  const margin    = 100 - totalCost;

  const rentLight   = touched.rent   ? lightFor('rent',   vals.rent)   : 'pending';
  const cogsLight   = touched.cogs   ? lightFor('cogs',   vals.cogs)   : 'pending';
  const labourLight = touched.labour ? lightFor('labour', vals.labour) : 'pending';
  const otherLight  = touched.other  ? lightFor('other',  vals.other)  : 'pending';
  const marginLight = allTouched     ? lightFor('margin', margin)      : 'pending';

  const reds   = [rentLight, cogsLight, labourLight, otherLight, marginLight].filter((x) => x === 'red').length;
  const ambers = [rentLight, cogsLight, labourLight, otherLight, marginLight].filter((x) => x === 'amber').length;
  const verdict =
    !allTouched      ? { tone: 'pending', label: 'Move the sliders',         sub: 'see the verdict write itself' } :
    margin <= 0      ? { tone: 'red',     label: 'Walk away',                sub: 'costs exceed sales' } :
    reds   >= 2      ? { tone: 'red',     label: 'Walk away',                sub: `${reds} deal-breakers` } :
    reds   === 1     ? { tone: 'red',     label: 'One deal-breaker',         sub: 'fix before signing' } :
    ambers >= 2      ? { tone: 'amber',   label: 'Viable but tight',         sub: `${ambers} thin margins` } :
    ambers === 1     ? { tone: 'amber',   label: 'Viable · tight',           sub: 'watch this line' } :
                       { tone: 'green',   label: 'Viable',                   sub: 'ratios stack' };

  const colorFor = (l) =>
    l === 'green' ? VBR.green :
    l === 'amber' ? (showAmber ? VBR.amber : VBR.fgMuted) :
    l === 'red'   ? '#ef6a5e' : VBR.fgFaint;
  const glowFor = (l) =>
    l === 'green' ? VBR.greenSofter :
    l === 'amber' ? (showAmber ? VBR.amberSoft : 'transparent') :
    l === 'red'   ? 'rgba(239,106,94,0.12)' : 'transparent';

  const tHint = (kind, v, t) => {
    if (!t) return 'awaiting';
    const th = THRESHOLDS[kind];
    if (v < th.green) return 'healthy';
    if (v < th.amber) return 'tight';
    return 'red flag';
  };

  return (
    <section style={{ padding: '36px 22px 44px' }}>
      <Eyebrow color={VBR.green} style={{ marginBottom: 18 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: VBR.green }}/>
        A free tool
      </Eyebrow>
      <h1 style={{
        fontFamily: VBR.fontDisplay, fontWeight: 600, fontSize: 42, lineHeight: 0.98,
        letterSpacing: '-0.03em', color: VBR.cream, margin: 0, textWrap: 'balance',
      }}>
        Before you sign,<br/>
        <span style={{ fontStyle: 'italic' }}>model</span> the venue.
      </h1>
      <p style={{
        fontFamily: VBR.fontBody, fontWeight: 300, fontSize: 14.5, lineHeight: 1.55,
        color: VBR.fgMuted, margin: '20px 0 24px',
      }}>
        Move the four sliders. Watch your viability case write itself.
        {showAmber && <> {<span style={{ color: VBR.amber }}>Deal-breakers</span>} light up before you sign anything.</>}
      </p>

      <div style={{
        background: '#0c0c0c', border: VBR.hairline, borderRadius: 6,
        boxShadow: '0 16px 40px rgba(0,0,0,0.45)', overflow: 'hidden',
      }}>
        <div style={{
          padding: '14px 16px', borderBottom: VBR.hairline,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: anyTouched ? VBR.green : VBR.fgFaint,
              boxShadow: anyTouched ? `0 0 0 4px ${VBR.greenSoft}` : 'none',
            }}/>
            <span style={{
              fontFamily: VBR.fontMono, fontSize: 10.5, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: VBR.fgMuted,
            }}>Live viability case</span>
          </div>
          <span style={{ fontFamily: VBR.fontMono, fontSize: 10.5, color: VBR.fgSubtle }}>sample</span>
        </div>

        <div style={{ padding: '16px 16px 6px' }}>
          <div style={{ fontFamily: VBR.fontMono, fontSize: 10, color: VBR.fgSubtle, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Concept</div>
          <div style={{ fontFamily: VBR.fontDisplay, fontWeight: 600, fontSize: 17, letterSpacing: '-0.015em', color: VBR.cream }}>
            {venue.label} · {venue.suburb}
          </div>
        </div>

        <div style={{ padding: '10px 16px 6px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <DossierSlider label="Annual rent"                 help="base rent on the lease"  value={vals.rent}   touched={touched.rent}   cfg={SLIDER_CFG_RENT} format={fmtRent} onSlide={onSlide('rent')}/>
          <DossierSlider label="Cost of goods · % of sales" help="food + drink inputs"     value={vals.cogs}   touched={touched.cogs}   cfg={SLIDER_CFG} suffix="%" onSlide={onSlide('cogs')}/>
          <DossierSlider label="Labour · % of sales"        help="wages + on-costs"        value={vals.labour} touched={touched.labour} cfg={SLIDER_CFG} suffix="%" onSlide={onSlide('labour')}/>
          <DossierSlider label="Other costs · % of sales"   help="utilities · insurance · everything else" value={vals.other}  touched={touched.other}  cfg={SLIDER_CFG} suffix="%" onSlide={onSlide('other')}/>
        </div>

        <div style={{ padding: '10px 16px', borderTop: VBR.hairline }}>
          <DossierRow label="Annual rent"   value={touched.rent ? fmtRent(vals.rent) : '—'} delta={tHint('rent', vals.rent, touched.rent)}             light={rentLight}   color={colorFor(rentLight)}   glow={glowFor(rentLight)}/>
          <DossierRow label="Cost of goods" value={touched.cogs ? `${vals.cogs.toFixed(1)}%` : '—'} delta={tHint('cogs', vals.cogs, touched.cogs)}       light={cogsLight}   color={colorFor(cogsLight)}   glow={glowFor(cogsLight)}/>
          <DossierRow label="Labour"        value={touched.labour ? `${vals.labour.toFixed(1)}%` : '—'} delta={tHint('labour', vals.labour, touched.labour)} light={labourLight} color={colorFor(labourLight)} glow={glowFor(labourLight)}/>
          <DossierRow label="Other"         value={touched.other ? `${vals.other.toFixed(1)}%` : '—'} delta={tHint('other', vals.other, touched.other)}    light={otherLight}  color={colorFor(otherLight)}  glow={glowFor(otherLight)}/>
          <DossierRow label={<span style={{ color: VBR.cream }}>Net margin</span>}
            value={allTouched ? `${margin.toFixed(1)}%` : '—'}
            delta={!allTouched ? 'awaiting' : margin > 10 ? 'healthy' : margin > 5 ? 'tight' : margin > 0 ? 'red flag' : 'costs exceed sales'}
            light={marginLight} color={colorFor(marginLight)} glow={glowFor(marginLight)} emphasised/>
        </div>

        <VerdictBar verdict={verdict} showAmber={showAmber}/>
      </div>

      <div style={{ marginTop: 22 }}>
        <VButton variant="primary" size="lg" style={{ width: '100%', justifyContent: 'center', padding: '15px 0' }}>
          Let's do this properly →
        </VButton>
        <a href="#" style={{
          display: 'block', textAlign: 'center', marginTop: 14,
          fontFamily: VBR.fontBody, fontSize: 13, color: VBR.fgMuted, textDecoration: 'none',
        }}>Already have an account? Sign in</a>
      </div>
    </section>
  );
}

function MobileMojo360Card() {
  return (
    <section style={{ padding: '32px 22px' }}>
      <a href="#" style={{
        display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none',
        padding: '14px 16px', borderRadius: 8,
        background: 'rgba(232,98,42,0.06)', border: '1px solid rgba(232,98,42,0.28)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          background: 'rgba(232,98,42,0.10)', border: '1px solid rgba(232,98,42,0.28)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <MGlyph size={22} color="#e8622a" ink={VBR.ink}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: VBR.fontBody, fontSize: 10.5, fontWeight: 600,
            letterSpacing: '0.14em', textTransform: 'uppercase', color: '#e8622a', marginBottom: 2,
          }}>Once you're open</div>
          <div style={{ fontFamily: VBR.fontBody, fontSize: 13, color: VBR.cream, fontWeight: 500 }}>
            Mojo 360 takes over →
          </div>
        </div>
      </a>
    </section>
  );
}

function MobileFooterV2({ showCrossLink }) {
  return (
    <footer style={{
      padding: '36px 22px 32px', background: '#050505', borderTop: VBR.hairline,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <MGlyph size={20} color={VBR.green} ink={VBR.ink}/>
        <span style={{ fontFamily: VBR.fontDisplay, fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
          <span style={{ color: VBR.green }}>Mojo</span>{' '}
          <span style={{ color: VBR.cream }}>Viability</span>
        </span>
      </div>
      <p style={{ fontFamily: VBR.fontBody, fontWeight: 300, fontSize: 12.5, lineHeight: 1.55, color: VBR.fgMuted, margin: 0 }}>
        A free tool for modelling a hospitality venue before you commit.
      </p>
      <div style={{
        marginTop: 22, paddingTop: 16, borderTop: VBR.hairline,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: VBR.fontBody, fontSize: 10.5, color: VBR.fgSubtle,
      }}>
        <span>© 2026 Mojo Pty Ltd</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: VBR.green }}/>
          Built in Australia
        </span>
      </div>
    </footer>
  );
}

Object.assign(window, { MobileLandingV2, MobileStatusBar, MobileHeaderV2, MobileLiveDossier, MobileMojo360Card, MobileFooterV2 });
