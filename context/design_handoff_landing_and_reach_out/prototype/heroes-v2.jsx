/* Mojo Viability — refined hero (v2)
 *  HeroLiveDossier — interactive mini-calculator.
 *  Three percentage sliders: COGS, Labour, Other costs.
 *  The leftover is the net margin — that's the answer.
 */

const HERO_PAD_V2 = '108px 56px 88px';

/* ─── Sample venues ──────────────────────────────────────────────────────
   Industry-typical Australian percentages by format. Sliders are 0–60 %.
   The "presets" set the starting positions for mid/complete states. */
const SAMPLE_VENUES = {
  cafe: {
    label: '40-seat café',
    suburb: 'Brunswick East · Melbourne',
    notes: '7-day trade · breakfast + lunch · $24 avg check',
    preset: {
      mid:      { rent: 110000, cogs: 38, labour: 34, other: 18 },   // slightly tight
      complete: { rent:  56000, cogs: 32, labour: 30, other: 16 },   // healthy
    },
  },
  winebar: {
    label: '32-seat wine bar',
    suburb: 'Surry Hills · Sydney',
    notes: '5-day trade · evenings only · $58 avg check',
    preset: {
      mid:      { rent: 175000, cogs: 40, labour: 30, other: 20 },
      complete: { rent:  92000, cogs: 34, labour: 26, other: 18 },
    },
  },
  pub: {
    label: 'regional pub',
    suburb: 'Bendigo · VIC',
    notes: '7-day trade · meals + bar · $38 avg check',
    preset: {
      mid:      { rent: 160000, cogs: 36, labour: 36, other: 22 },
      complete: { rent:  92000, cogs: 32, labour: 30, other: 20 },
    },
  },
};

/* ─── Industry thresholds (same for all venues) ────────────────────────── */
const THRESHOLDS = {
  rent:   { green: 80000, amber: 150000 }, // annual $ — typical Australian small-venue rent
  cogs:   { green: 32, amber: 36 },        // < green = green; < amber = amber; else red
  labour: { green: 30, amber: 36 },
  other:  { green: 20, amber: 25 },
  margin: { green: 10, amber:  5 },        // > green = green; > amber = amber; else red
};

const SLIDER_CFG       = { min: 0, max: 60,     step: 0.5  };
const SLIDER_CFG_RENT  = { min: 0, max: 300000, step: 1000 };

function lightFor(kind, value) {
  if (kind === 'margin') {
    if (value > THRESHOLDS.margin.green) return 'green';
    if (value > THRESHOLDS.margin.amber) return 'amber';
    return 'red';
  }
  const t = THRESHOLDS[kind];
  if (value < t.green) return 'green';
  if (value < t.amber) return 'amber';
  return 'red';
}

/* Format $ rent — '$56,000' or '$56k' if you prefer compactness. */
function fmtRent(v) {
  return `$${v.toLocaleString()}`;
}
function fmtRentShort(v) {
  if (v >= 1000) return `$${Math.round(v / 1000)}k`;
  return `$${v}`;
}

function HeroLiveDossier({ showAmber = true, venueKey = 'cafe', initialState = 'empty' }) {
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
    !allTouched      ? { tone: 'pending', label: 'Move the four sliders to see the verdict', sub: '— · —' } :
    margin <= 0      ? { tone: 'red',     label: 'Walk away',                        sub: 'costs exceed sales' } :
    reds   >= 2      ? { tone: 'red',     label: 'Walk away',                        sub: `${reds} structural deal-breakers` } :
    reds   === 1     ? { tone: 'red',     label: 'One deal-breaker · re-cut it',     sub: 'fix this before signing' } :
    ambers >= 2      ? { tone: 'amber',   label: 'Viable — but tight',               sub: `${ambers} margins running thin` } :
    ambers === 1     ? { tone: 'amber',   label: 'Viable with one tight margin',     sub: 'watch this line' } :
                       { tone: 'green',   label: 'Viable',                           sub: 'on these ratios, the numbers stack' };

  return (
    <section style={{ position: 'relative', background: VBR.ink, padding: HERO_PAD_V2, overflow: 'hidden' }}>
      <div style={{
        maxWidth: VBR.maxw, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1fr 1.05fr', gap: 76, alignItems: 'center',
      }}>

        {/* Left rail */}
        <div>
          <Eyebrow color={VBR.green} style={{ marginBottom: 26 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: VBR.green }}/>
            Mojo Viability · A free tool
          </Eyebrow>

          <h1 style={{
            fontFamily: VBR.fontDisplay, fontWeight: 600,
            fontSize: 'clamp(50px, 5.8vw, 82px)', lineHeight: 0.96,
            letterSpacing: '-0.035em', margin: 0, color: VBR.cream,
            maxWidth: 600, textWrap: 'balance',
            fontVariationSettings: '"opsz" 144',
          }}>
            Before you sign the lease,<br/>
            <span style={{ fontStyle: 'italic' }}>model</span> the venue.
          </h1>

          <p style={{
            fontFamily: VBR.fontBody, fontWeight: 300,
            fontSize: 17, lineHeight: 1.6, color: VBR.fgMuted,
            margin: '28px 0 36px', maxWidth: 480,
          }}>
            Move the three sliders → watch your viability case write itself. Then come back
            and run the full {showAmber ? <span style={{ color: VBR.amber, fontWeight: 400 }}>twelve-module</span> : 'twelve-module'} version.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
            <VButton variant="primary" size="lg">Let's do this properly →</VButton>
            <a href="#" style={{
              fontFamily: VBR.fontBody, fontSize: 14, color: VBR.fgMuted,
              textDecoration: 'none', borderBottom: `1px solid ${VBR.fgFaint}`, paddingBottom: 2,
            }}>Already have an account? Sign in</a>
          </div>

          <div style={{
            marginTop: 36, paddingTop: 22, borderTop: VBR.hairline,
            display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: 32, maxWidth: 520,
          }}>
            {[
              ['12', 'modules in the full tool'],
              ['~30', 'min to a first honest read'],
              ['$0', 'no paid tier · no card'],
            ].map(([n, l]) => (
              <div key={l}>
                <div style={{
                  fontFamily: VBR.fontDisplay, fontWeight: 600, fontSize: 32,
                  letterSpacing: '-0.02em', color: VBR.green, lineHeight: 1,
                }}>{n}</div>
                <div style={{
                  fontFamily: VBR.fontBody, fontSize: 12, fontWeight: 300,
                  color: VBR.fgMuted, marginTop: 6, lineHeight: 1.4,
                }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right rail: live dossier card */}
        <LiveDossierCard
          venue={venue}
          vals={vals}
          touched={touched}
          onSlide={onSlide}
          allTouched={allTouched}
          anyTouched={anyTouched}
          totalCost={totalCost}
          margin={margin}
          rentLight={rentLight}
          cogsLight={cogsLight}
          labourLight={labourLight}
          otherLight={otherLight}
          marginLight={marginLight}
          verdict={verdict}
          showAmber={showAmber}
        />
      </div>

      <div style={{
        position: 'absolute', top: 28, right: 56,
        fontFamily: VBR.fontMono, fontSize: 10.5, color: VBR.fgSubtle,
        letterSpacing: '0.16em', textTransform: 'uppercase',
      }}>Live dossier</div>
    </section>
  );
}

function LiveDossierCard({
  venue, vals, touched, onSlide,
  allTouched, anyTouched, totalCost, margin,
  rentLight, cogsLight, labourLight, otherLight, marginLight,
  verdict, showAmber,
}) {
  const lightColor = (l) => {
    if (l === 'green') return VBR.green;
    if (l === 'amber') return showAmber ? VBR.amber : 'rgba(245,242,237,0.45)';
    if (l === 'red')   return '#ef6a5e';
    return VBR.fgFaint;
  };
  const lightGlow = (l) => {
    if (l === 'green') return VBR.greenSofter;
    if (l === 'amber') return showAmber ? VBR.amberSoft : 'rgba(245,242,237,0.05)';
    if (l === 'red')   return 'rgba(239,106,94,0.10)';
    return 'transparent';
  };

  const tHint = (kind, v, touched) => {
    if (!touched) return 'awaiting slider';
    const t = THRESHOLDS[kind];
    if (kind === 'rent') {
      if (v < t.green) return `healthy · under ${fmtRentShort(t.green)}`;
      if (v < t.amber) return `tight · over ${fmtRentShort(t.green)}`;
      return `red flag · over ${fmtRentShort(t.amber)}`;
    }
    if (v < t.green)  return `healthy · under ${t.green}%`;
    if (v < t.amber)  return `tight · over ${t.green}%`;
    return `red flag · over ${t.amber}%`;
  };

  return (
    <div style={{
      background: '#0c0c0c', border: VBR.hairline, borderRadius: 6,
      boxShadow: '0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.02)',
      fontFamily: VBR.fontBody, overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Header */}
      <div style={{
        padding: '18px 22px', borderBottom: VBR.hairline,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'linear-gradient(180deg, rgba(52,211,153,0.04), rgba(52,211,153,0))',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: anyTouched ? VBR.green : VBR.fgFaint,
            boxShadow: anyTouched ? `0 0 0 4px ${VBR.greenSoft}` : 'none',
            transition: 'background 220ms ease, box-shadow 220ms ease',
          }}/>
          <span style={{
            fontFamily: VBR.fontMono, fontSize: 11, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: VBR.fgMuted,
          }}>Try it — live viability case</span>
        </div>
        <span style={{
          fontFamily: VBR.fontMono, fontSize: 11, color: VBR.fgSubtle,
        }}>v1 · sample</span>
      </div>

      {/* Concept title */}
      <div style={{ padding: '22px 22px 8px' }}>
        <div style={{
          fontFamily: VBR.fontMono, fontSize: 10.5, color: VBR.fgSubtle,
          letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6,
        }}>Concept</div>
        <h3 style={{
          fontFamily: VBR.fontDisplay, fontWeight: 600, fontSize: 22, letterSpacing: '-0.015em',
          margin: 0, color: VBR.cream,
        }}>{venue.label} · {venue.suburb}</h3>
        <div style={{
          fontFamily: VBR.fontMono, fontSize: 11, color: VBR.fgSubtle, marginTop: 6, letterSpacing: '0.04em',
        }}>{venue.notes}</div>
      </div>

      {/* Sliders */}
      <div style={{ padding: '14px 22px 8px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <DossierSlider
          label="Annual rent"
          help="base rent on the lease (ex outgoings)"
          value={vals.rent}
          touched={touched.rent}
          cfg={SLIDER_CFG_RENT}
          format={fmtRent}
          onSlide={onSlide('rent')}
        />
        <DossierSlider
          label="Cost of goods · % of sales"
          help="food + drink inputs"
          value={vals.cogs}
          touched={touched.cogs}
          cfg={SLIDER_CFG}
          suffix="%"
          onSlide={onSlide('cogs')}
        />
        <DossierSlider
          label="Labour · % of sales"
          help="wages + super + on-costs"
          value={vals.labour}
          touched={touched.labour}
          cfg={SLIDER_CFG}
          suffix="%"
          onSlide={onSlide('labour')}
        />
        <DossierSlider
          label="Other costs · % of sales"
          help="utilities · insurance · marketing · everything else"
          value={vals.other}
          touched={touched.other}
          cfg={SLIDER_CFG}
          suffix="%"
          onSlide={onSlide('other')}
        />
      </div>

      {/* Output rows */}
      <div style={{ padding: '14px 22px 6px', borderTop: VBR.hairline, marginTop: 6 }}>
        <div style={{
          fontFamily: VBR.fontMono, fontSize: 10.5, color: VBR.green,
          letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4,
        }}>The verdict, line by line</div>

        <DossierRow
          label="Annual rent"
          value={touched.rent ? fmtRent(vals.rent) : '—'}
          delta={tHint('rent', vals.rent, touched.rent)}
          light={rentLight}
          color={lightColor(rentLight)} glow={lightGlow(rentLight)}
        />
        <DossierRow
          label="Cost of goods"
          value={touched.cogs ? `${vals.cogs.toFixed(1)}%` : '—'}
          delta={tHint('cogs', vals.cogs, touched.cogs)}
          light={cogsLight}
          color={lightColor(cogsLight)} glow={lightGlow(cogsLight)}
        />
        <DossierRow
          label="Labour"
          value={touched.labour ? `${vals.labour.toFixed(1)}%` : '—'}
          delta={tHint('labour', vals.labour, touched.labour)}
          light={labourLight}
          color={lightColor(labourLight)} glow={lightGlow(labourLight)}
        />
        <DossierRow
          label="Other costs"
          value={touched.other ? `${vals.other.toFixed(1)}%` : '—'}
          delta={tHint('other', vals.other, touched.other)}
          light={otherLight}
          color={lightColor(otherLight)} glow={lightGlow(otherLight)}
        />
        <DossierRow
          label={<span><span style={{ color: VBR.cream }}>Net margin</span> · what's left over</span>}
          value={allTouched ? `${margin.toFixed(1)}%` : '—'}
          delta={
            !allTouched      ? 'awaiting sliders' :
            margin > 10      ? 'healthy · over 10%' :
            margin > 5       ? 'tight · 5–10%' :
            margin > 0       ? 'red flag · under 5%' :
                               'red flag · costs exceed sales'
          }
          light={marginLight}
          color={lightColor(marginLight)} glow={lightGlow(marginLight)}
          emphasised
        />
      </div>

      <VerdictBar verdict={verdict} showAmber={showAmber}/>
    </div>
  );
}

function DossierSlider({ label, help, value, touched, cfg, prefix = '', suffix = '', format, onSlide }) {
  const pct = ((value - cfg.min) / (cfg.max - cfg.min)) * 100;
  const display = format
    ? format(value)
    : `${prefix}${value.toFixed(1)}${suffix}`;
  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 6, gap: 12,
      }}>
        <div>
          <span style={{
            fontFamily: VBR.fontBody, fontSize: 12.5, color: VBR.fgMuted, fontWeight: 400,
            display: 'block',
          }}>{label}</span>
          {help && (
            <span style={{
              fontFamily: VBR.fontMono, fontSize: 10, color: VBR.fgSubtle, letterSpacing: '0.04em',
              display: 'block', marginTop: 2,
            }}>{help}</span>
          )}
        </div>
        <span style={{
          fontFamily: VBR.fontMono, fontSize: 13, fontVariantNumeric: 'tabular-nums',
          color: touched ? VBR.cream : VBR.fgSubtle, letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
        }}>
          {touched ? display : `${prefix}—${suffix} · set this`}
        </span>
      </div>
      <div style={{ position: 'relative', height: 26 }}>
        <div style={{
          position: 'absolute', top: 12, left: 0, right: 0, height: 2,
          background: 'rgba(245,242,237,0.08)', borderRadius: 2,
        }}/>
        <div style={{
          position: 'absolute', top: 12, left: 0, width: `${pct}%`, height: 2,
          background: touched ? VBR.green : 'rgba(245,242,237,0.15)',
          borderRadius: 2, transition: 'width 140ms ease, background 200ms ease',
        }}/>
        <input
          type="range"
          min={cfg.min}
          max={cfg.max}
          step={cfg.step}
          value={value}
          onChange={onSlide}
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: 26,
            opacity: 0, cursor: 'pointer', margin: 0, padding: 0,
          }}
        />
        <div style={{
          position: 'absolute', top: 5, left: `calc(${pct}% - 8px)`, width: 16, height: 16,
          borderRadius: '50%',
          background: VBR.ink, border: `1.5px solid ${touched ? VBR.green : VBR.fgSubtle}`,
          boxShadow: touched ? `0 0 0 5px ${VBR.greenSofter}` : 'none',
          pointerEvents: 'none',
          transition: 'left 140ms ease, border-color 180ms ease, box-shadow 220ms ease',
        }}/>
      </div>
    </div>
  );
}

function DossierRow({ label, value, delta, light, color, glow, emphasised = false }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 18,
      padding: emphasised ? '14px 0 12px' : '11px 0', borderTop: VBR.hairline,
      background: emphasised ? 'rgba(52,211,153,0.025)' : 'transparent',
      marginInline: emphasised ? -22 : 0,
      paddingInline: emphasised ? 22 : 0,
    }}>
      <div>
        <div style={{
          fontFamily: VBR.fontBody, fontSize: 13,
          color: emphasised ? VBR.cream : VBR.fgMuted, marginBottom: 3,
          fontWeight: emphasised ? 500 : 400,
        }}>{label}</div>
        <div style={{
          fontFamily: VBR.fontMono, fontSize: 11, letterSpacing: '0.04em',
          color: light === 'pending' ? VBR.fgFaint : VBR.fgSubtle,
        }}>{delta}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{
          fontFamily: VBR.fontMono, fontVariantNumeric: 'tabular-nums',
          fontSize: emphasised ? 18 : 15.5, fontWeight: emphasised ? 500 : 400,
          color: light === 'pending' ? VBR.fgFaint : VBR.cream,
          transition: 'color 200ms ease',
        }}>{value}</span>
        <span style={{
          width: emphasised ? 11 : 9, height: emphasised ? 11 : 9, borderRadius: '50%', background: color,
          boxShadow: `0 0 0 4px ${glow}`,
          transition: 'background 220ms ease, box-shadow 220ms ease',
        }}/>
      </div>
    </div>
  );
}

function VerdictBar({ verdict, showAmber }) {
  const bg =
    verdict.tone === 'green'   ? 'rgba(52,211,153,0.10)' :
    verdict.tone === 'amber'   ? (showAmber ? 'rgba(232,180,90,0.10)' : 'rgba(245,242,237,0.04)') :
    verdict.tone === 'red'     ? 'rgba(239,106,94,0.10)' :
                                 'transparent';
  const line =
    verdict.tone === 'green'   ? VBR.greenLine :
    verdict.tone === 'amber'   ? (showAmber ? VBR.amberLine : VBR.borderStrong) :
    verdict.tone === 'red'     ? 'rgba(239,106,94,0.28)' :
                                 VBR.border;
  const fg =
    verdict.tone === 'green'   ? VBR.green :
    verdict.tone === 'amber'   ? (showAmber ? VBR.amber : VBR.cream) :
    verdict.tone === 'red'     ? '#ef6a5e' :
                                 VBR.fgMuted;
  return (
    <div style={{
      padding: '16px 22px', borderTop: `1px solid ${line}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      background: bg, transition: 'background 240ms ease, border-color 240ms ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{
          width: 10, height: 10, borderRadius: '50%', background: fg,
          boxShadow: `0 0 0 4px ${bg}`,
        }}/>
        <div>
          <div style={{
            fontFamily: VBR.fontDisplay, fontSize: 16, fontWeight: 600,
            color: fg, letterSpacing: '-0.01em', lineHeight: 1.1,
          }}>{verdict.label}</div>
          <div style={{
            fontFamily: VBR.fontMono, fontSize: 10.5, letterSpacing: '0.06em',
            color: VBR.fgSubtle, marginTop: 4, textTransform: 'lowercase',
          }}>{verdict.sub}</div>
        </div>
      </div>
      <span style={{
        fontFamily: VBR.fontMono, fontSize: 10.5, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: VBR.fgMuted,
      }}>Export · PDF / xls →</span>
    </div>
  );
}

Object.assign(window, {
  HeroLiveDossier, LiveDossierCard, DossierSlider, DossierRow, VerdictBar,
  SAMPLE_VENUES, THRESHOLDS, SLIDER_CFG, SLIDER_CFG_RENT, lightFor, fmtRent, fmtRentShort,
});
