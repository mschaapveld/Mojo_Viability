/* Mojo Viability — body sections.
 *  SectionWhat        — "What you're checking for" — 3 cards (Money / Location / Operations)
 *  SectionBuiltFor    — "Built for…" — 3 persona cards
 *  SectionHow         — "How it works" — 3 steps
 *  SectionProof       — stat + founder story
 *  SectionFinalCTA    — final CTA + tail
 */

/* shared section chrome */
function SectionShell({ id, eyebrow, title, intro, children, bg = VBR.ink, divider = 'top', maxW = VBR.maxw }) {
  return (
    <section id={id} style={{
      width: '100%', boxSizing: 'border-box',
      padding: '110px 56px',
      background: bg,
      borderTop: divider === 'top' ? VBR.hairline : 'none',
    }}>
      <div style={{ maxWidth: maxW, margin: '0 auto' }}>
        {(eyebrow || title) && (
          <div style={{ marginBottom: 56, maxWidth: 760 }}>
            {eyebrow && <Eyebrow color={VBR.green} style={{ marginBottom: 22 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: VBR.green }}/>
              {eyebrow}
            </Eyebrow>}
            {title && (
              <h2 style={{
                fontFamily: VBR.fontDisplay, fontWeight: 600,
                fontSize: 'clamp(38px, 4.2vw, 60px)', lineHeight: 1.02,
                letterSpacing: '-0.025em', margin: 0, color: VBR.cream,
                textWrap: 'balance',
              }}>{title}</h2>
            )}
            {intro && (
              <p style={{
                fontFamily: VBR.fontBody, fontWeight: 300,
                fontSize: 17, lineHeight: 1.6, color: VBR.fgMuted,
                margin: '24px 0 0', maxWidth: 620,
              }}>{intro}</p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   SECTION 2 — What you're checking for
   3 cards: The money / The location / The operations
   Each card shows the modules covered, as a small monospace list.
   ════════════════════════════════════════════════════════════ */
function SectionWhat() {
  const cards = [
    {
      kicker: '01',
      title: 'The money',
      blurb: 'Whether the numbers actually stack — and what happens when one assumption moves.',
      items: ['simple break-even', 'detailed break-even', 'fitout finance · rent vs buy', 'labour costing'],
    },
    {
      kicker: '02',
      title: 'The location',
      blurb: 'Whether the site can deliver the foot traffic and the mix you are betting on.',
      items: ['location suitability', 'sales modelling', 'sales predictions'],
    },
    {
      kicker: '03',
      title: 'The operations',
      blurb: 'Whether the format will actually run — hours, menu, roster, plan.',
      items: ['hours of operation', 'menu building', 'business planning', 'AI plan draft + builder'],
    },
  ];
  return (
    <SectionShell
      eyebrow="What you're checking for"
      title="The deal-breakers fall into three places."
      intro="Mojo Viability covers the surface area of a venue concept across twelve modules — grouped here so you can see what the tool is actually looking at."
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
        {cards.map((c) => (
          <article key={c.title} style={{
            background: VBR.ink2, border: VBR.hairline, borderRadius: 6,
            padding: '28px 26px 24px', display: 'flex', flexDirection: 'column',
            minHeight: 320, position: 'relative', overflow: 'hidden',
          }}>
            <span style={{
              position: 'absolute', top: 22, right: 22,
              fontFamily: VBR.fontMono, fontSize: 11, letterSpacing: '0.14em',
              color: VBR.fgSubtle,
            }}>{c.kicker}</span>
            <h3 style={{
              fontFamily: VBR.fontDisplay, fontWeight: 600, fontSize: 28,
              letterSpacing: '-0.02em', margin: '0 0 10px', color: VBR.cream,
            }}>{c.title}</h3>
            <p style={{
              fontFamily: VBR.fontBody, fontWeight: 300, fontSize: 14.5, lineHeight: 1.55,
              color: VBR.fgMuted, margin: '0 0 24px',
            }}>{c.blurb}</p>
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{
                fontFamily: VBR.fontMono, fontSize: 10.5, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: VBR.green, marginBottom: 2,
              }}>Modules</span>
              {c.items.map((m) => (
                <div key={m} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  fontFamily: VBR.fontMono, fontSize: 12, color: VBR.fgMuted,
                }}>
                  <span style={{ color: VBR.fgSubtle }}>·</span>
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

/* ════════════════════════════════════════════════════════════
   SECTION 3 — Built for
   3 persona cards, with optional amber "deal-breaker" tag on first
   ════════════════════════════════════════════════════════════ */
function SectionBuiltFor({ showAmber = true }) {
  const cards = [
    {
      key: 'first',
      kicker: 'First venue',
      title: 'Catch what you don\'t know you don\'t know.',
      body: 'You haven\'t run one before. The cost of a structural mistake is the rest of your life. Use Viability to make those mistakes visible while they\'re still on paper.',
      tag: 'highest stakes',
      tagColor: showAmber ? VBR.amber : VBR.green,
      tagBg:    showAmber ? VBR.amberSoft : VBR.greenSoft,
      tagLine:  showAmber ? VBR.amberLine : VBR.greenLine,
    },
    {
      key: 'second',
      kicker: 'Venue #2',
      title: 'Pressure-test the site, the format, the numbers.',
      body: 'You already operate. You know the operational pain. Use the tool for speed — model the new site\'s realities against the one you already understand.',
    },
    {
      key: 'deal',
      kicker: 'Investor · partner',
      title: 'A structured case to take to a bank.',
      body: 'You\'re looking at someone else\'s concept and a request for capital. Get an exportable viability dossier that holds up under questioning, not a pitch.',
    },
  ];
  return (
    <SectionShell
      eyebrow="Built for"
      title="Three people land here, with the same question."
      intro="The tool triages explicitly — pick the card that sounds like you."
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
        {cards.map((c) => (
          <article key={c.key} style={{
            background: VBR.ink2, border: VBR.hairline, borderRadius: 6,
            padding: '28px 26px', display: 'flex', flexDirection: 'column', minHeight: 320,
            position: 'relative',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <span style={{
                fontFamily: VBR.fontMono, fontSize: 11, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: VBR.green,
              }}>{c.kicker}</span>
              {c.tag && (
                <span style={{
                  fontFamily: VBR.fontMono, fontSize: 10, letterSpacing: '0.14em',
                  textTransform: 'uppercase', color: c.tagColor,
                  background: c.tagBg, border: `1px solid ${c.tagLine}`,
                  padding: '4px 10px', borderRadius: 9999,
                }}>{c.tag}</span>
              )}
            </div>
            <h3 style={{
              fontFamily: VBR.fontDisplay, fontWeight: 600, fontSize: 24,
              letterSpacing: '-0.02em', margin: '0 0 12px', color: VBR.cream, lineHeight: 1.15,
              textWrap: 'balance',
            }}>{c.title}</h3>
            <p style={{
              fontFamily: VBR.fontBody, fontWeight: 300, fontSize: 14.5, lineHeight: 1.6,
              color: VBR.fgMuted, margin: 0,
            }}>{c.body}</p>
            <a href="#" style={{
              marginTop: 'auto', paddingTop: 22,
              fontFamily: VBR.fontBody, fontSize: 13, color: VBR.green,
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>Start with this →</a>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

/* ════════════════════════════════════════════════════════════
   SECTION 4 — How it works (3 steps)
   ════════════════════════════════════════════════════════════ */
function SectionHow() {
  const steps = [
    { n: '01', t: 'Sketch your concept', b: 'Format, location, hours, scale. Five minutes. No login required to try.' },
    { n: '02', t: 'Run the modules',     b: 'Break-even, fitout, labour, location, sales — answer as much or as little as you have. The tool tells you what\'s missing.' },
    { n: '03', t: 'Export the case',     b: 'Get a structured viability dossier — PDF or Excel — built for a lender, a partner, or your own desk.' },
  ];
  return (
    <SectionShell
      eyebrow="How it works"
      title="Three moves from concept to case."
      intro="A first read takes about thirty minutes. You can come back to it as often as you like — every change recalculates the verdict."
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, position: 'relative' }}>
        {/* horizontal dotted rail */}
        <div style={{
          position: 'absolute', top: 28, left: '14%', right: '14%', height: 1,
          background: `repeating-linear-gradient(to right, ${VBR.greenLine} 0 4px, transparent 4px 9px)`,
        }}/>
        {steps.map((s, i) => (
          <div key={s.n} style={{
            padding: '0 32px', position: 'relative',
            borderLeft: i > 0 ? VBR.hairline : 'none',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: VBR.ink, border: `1px solid ${VBR.greenLine}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: VBR.fontMono, fontSize: 14, color: VBR.green,
              letterSpacing: '0.06em', position: 'relative', zIndex: 2,
              boxShadow: `0 0 0 8px ${VBR.ink}`,
              marginBottom: 28,
            }}>{s.n}</div>
            <h3 style={{
              fontFamily: VBR.fontDisplay, fontWeight: 600, fontSize: 22,
              letterSpacing: '-0.02em', margin: '0 0 10px', color: VBR.cream,
            }}>{s.t}</h3>
            <p style={{
              fontFamily: VBR.fontBody, fontWeight: 300, fontSize: 14.5, lineHeight: 1.6,
              color: VBR.fgMuted, margin: 0, maxWidth: 320,
            }}>{s.b}</p>
          </div>
        ))}
      </div>

      {/* small shopfront placeholder strip — visual anchor */}
      <div style={{ marginTop: 72, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <ShopfrontPlaceholder height={200} label="PRE-FITOUT SHOPFRONT · INTERIOR"/>
        <ShopfrontPlaceholder height={200} label="UNSIGNED LEASE · TABLE STILL LIFE"/>
      </div>
    </SectionShell>
  );
}

/* ════════════════════════════════════════════════════════════
   SECTION 5 — Proof: market stat + founder story
   ════════════════════════════════════════════════════════════ */
function SectionProof({ showBadges = true, showAmber = true }) {
  return (
    <section style={{
      width: '100%', boxSizing: 'border-box', padding: '120px 56px',
      background: '#0a0a0a', borderTop: VBR.hairline,
    }}>
      <div style={{ maxWidth: VBR.maxw, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 80, alignItems: 'flex-start' }}>

        {/* Market stat */}
        <div>
          <Eyebrow color={showAmber ? VBR.amber : VBR.green} style={{ marginBottom: 26 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: showAmber ? VBR.amber : VBR.green }}/>
            The cost of getting it wrong
          </Eyebrow>

          <div style={{
            fontFamily: VBR.fontDisplay, fontWeight: 700,
            fontSize: 'clamp(72px, 9vw, 132px)', lineHeight: 0.92,
            letterSpacing: '-0.04em', color: VBR.cream, margin: '0 0 8px',
          }}>
            ~1 in 2
          </div>
          <p style={{
            fontFamily: VBR.fontDisplay, fontWeight: 500,
            fontSize: 'clamp(22px, 2.2vw, 30px)', lineHeight: 1.2,
            letterSpacing: '-0.015em', color: VBR.cream, margin: '0 0 18px',
            maxWidth: 520, textWrap: 'balance',
          }}>
            Australian small businesses don't make it to five years.
          </p>
          <p style={{
            fontFamily: VBR.fontBody, fontWeight: 300, fontSize: 15.5, lineHeight: 1.6,
            color: VBR.fgMuted, margin: '0 0 22px', maxWidth: 460,
          }}>
            ABS-aligned analyses put five-year survival around 45–50%. The operators who model first don't always succeed —
            but they're far less likely to fail blind.
          </p>

          {showBadges && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['~25% close in year 1', '~30–35% close in year 2', '~50–55% close in year 5'].map((b, i) => (
                <span key={b} style={{
                  fontFamily: VBR.fontMono, fontSize: 11, letterSpacing: '0.06em',
                  color: VBR.fgMuted, padding: '7px 12px', borderRadius: 9999,
                  border: VBR.hairline, background: 'rgba(245,242,237,0.02)',
                }}>{b}</span>
              ))}
            </div>
          )}
          <p style={{
            fontFamily: VBR.fontMono, fontSize: 11, color: VBR.fgSubtle, letterSpacing: '0.04em',
            margin: '22px 0 0',
          }}>
            Source · Commentaries back-checking ABS small-business counts (8165.0). Figures are approximations.
          </p>
        </div>

        {/* Founder story */}
        <div style={{
          background: '#0c0c0c', border: VBR.hairline, borderRadius: 6,
          padding: '32px 30px',
          position: 'relative',
        }}>
          <span style={{
            position: 'absolute', top: -1, left: 24, transform: 'translateY(-50%)',
            fontFamily: VBR.fontMono, fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase',
            background: '#0a0a0a', padding: '2px 10px', color: VBR.fgMuted,
          }}>From the maker</span>

          <div style={{
            fontFamily: VBR.fontDisplay, fontWeight: 600, fontSize: 28, lineHeight: 1.1,
            letterSpacing: '-0.02em', color: VBR.cream, marginBottom: 20, marginTop: 6,
          }}>
            <span style={{
              fontFamily: VBR.fontDisplay, fontStyle: 'italic', fontSize: 56,
              lineHeight: 0, verticalAlign: '-0.2em', color: VBR.green, marginRight: 4,
            }}>"</span>
            Behind every closed venue there's a family.
          </div>

          <p style={{
            fontFamily: VBR.fontBody, fontWeight: 300, fontSize: 15.5, lineHeight: 1.65,
            color: VBR.fgMuted, margin: 0,
          }}>
            I've watched mates sign leases on numbers that never had a chance — savings drained, marriages stretched,
            sometimes worse. I built Viability because the deal-breakers are almost always visible <em>before</em> the
            lease is signed; you just need a structured way to look. The tool doesn't promise success. It just makes the
            structural mistakes visible while there's still time to walk away. If it helps one operator make a better
            call, it's done its job.
          </p>

          <div style={{
            marginTop: 26, paddingTop: 18, borderTop: VBR.hairline,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: VBR.greenSoft, border: `1px solid ${VBR.greenLine}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: VBR.fontDisplay, fontWeight: 700, fontSize: 16, color: VBR.green,
            }}>MS</div>
            <div>
              <div style={{ fontFamily: VBR.fontBody, fontSize: 13.5, color: VBR.cream, fontWeight: 500 }}>Max Schaapveld</div>
              <div style={{ fontFamily: VBR.fontBody, fontSize: 12, color: VBR.fgSubtle, marginTop: 2 }}>
                Built Mojo Viability · Port Macquarie NSW
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   SECTION 6 — Final CTA
   ════════════════════════════════════════════════════════════ */
function SectionFinalCTA() {
  return (
    <section style={{
      width: '100%', boxSizing: 'border-box', padding: '120px 56px 100px',
      background: VBR.ink, borderTop: VBR.hairline, position: 'relative', overflow: 'hidden',
    }}>
      {/* soft green wash */}
      <div style={{
        position: 'absolute', top: '-40%', left: '50%', transform: 'translateX(-50%)',
        width: 900, height: 900, borderRadius: '50%',
        background: 'radial-gradient(closest-side, rgba(52,211,153,0.10), rgba(52,211,153,0))',
        pointerEvents: 'none',
      }}/>
      <div style={{ maxWidth: 920, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        <Eyebrow color={VBR.green} style={{ marginBottom: 24, justifyContent: 'center' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: VBR.green }}/>
          Free forever — that's the whole deal
        </Eyebrow>
        <h2 style={{
          fontFamily: VBR.fontDisplay, fontWeight: 600,
          fontSize: 'clamp(44px, 5vw, 72px)', lineHeight: 1, letterSpacing: '-0.03em',
          margin: '0 0 24px', color: VBR.cream, textWrap: 'balance',
        }}>
          Run the numbers before<br/><span style={{ fontStyle: 'italic' }}>you sign anything.</span>
        </h2>
        <p style={{
          fontFamily: VBR.fontBody, fontWeight: 300, fontSize: 17, lineHeight: 1.55,
          color: VBR.fgMuted, margin: '0 auto 36px', maxWidth: 520,
        }}>
          Thirty minutes to a first read. Bank-ready export at the end.
          No paid tier · no in-app purchases · no credit card · no trial that ends.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22 }}>
          <VButton variant="primary" size="lg">Let's do this properly →</VButton>
          <a href="#" style={{
            fontFamily: VBR.fontBody, fontSize: 14, color: VBR.fgMuted,
            textDecoration: 'none', borderBottom: `1px solid ${VBR.fgFaint}`, paddingBottom: 2,
          }}>Already have an account? Sign in</a>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   SECTION 5.5 — Mojo 360 sibling strip
   Slim band that surfaces the cross-link without dominating the page.
   Uses Mojo 360's brand orange so it reads as a different product.
   ════════════════════════════════════════════════════════════ */
function SectionMojo360() {
  const ORANGE = '#e8622a';
  const ORANGE_SOFT = 'rgba(232,98,42,0.10)';
  const ORANGE_LINE = 'rgba(232,98,42,0.28)';
  return (
    <section style={{
      width: '100%', boxSizing: 'border-box', padding: '72px 56px',
      background: VBR.ink, borderTop: VBR.hairline,
    }}>
      <div style={{
        maxWidth: VBR.maxw, margin: '0 auto',
        background: `linear-gradient(180deg, rgba(232,98,42,0.04) 0%, rgba(232,98,42,0) 100%), ${VBR.ink2}`,
        border: `1px solid ${ORANGE_LINE}`,
        borderRadius: 8, padding: '32px 36px',
        display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 32, alignItems: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* subtle dotted side rail in orange */}
        <div style={{
          position: 'absolute', top: 16, bottom: 16, right: 0, width: 1,
          background: `repeating-linear-gradient(to bottom, ${ORANGE_LINE} 0 4px, transparent 4px 8px)`,
        }}/>

        {/* M-glyph in Mojo 360 orange */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 56, height: 56, borderRadius: 12,
          background: ORANGE_SOFT, border: `1px solid ${ORANGE_LINE}`,
        }}>
          <MGlyph size={32} color={ORANGE} ink={VBR.ink}/>
        </div>

        {/* copy */}
        <div>
          <div style={{
            fontFamily: VBR.fontDisplayAlt, fontSize: 11, fontWeight: 600,
            letterSpacing: '0.16em', textTransform: 'uppercase', color: ORANGE, marginBottom: 10,
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: ORANGE }}/>
            Once you're open · Mojo 360
          </div>
          <h3 style={{
            fontFamily: VBR.fontDisplayAlt, fontWeight: 700, fontSize: 28,
            letterSpacing: '-0.02em', margin: '0 0 10px', color: VBR.cream, lineHeight: 1.1,
            whiteSpace: 'nowrap',
          }}>
            When you're trading, our <span style={{ color: ORANGE }}>sibling</span> takes over.
          </h3>
          <p style={{
            fontFamily: VBR.fontBody, fontWeight: 300, fontSize: 14.5, lineHeight: 1.6,
            color: VBR.fgMuted, margin: 0, maxWidth: 620,
          }}>
            Five virtual managers — <span style={{ color: VBR.cream, fontWeight: 500 }}>Sales · Ops · Marketing · Finance · People</span> —
            running the day-to-day so you don't have to. Separate paid product. Same operator-first thinking.
          </p>
        </div>

        {/* CTA */}
        <a href="#" style={{
          fontFamily: VBR.fontDisplayAlt, fontSize: 13, fontWeight: 700, color: '#fff',
          textDecoration: 'none', letterSpacing: '0.04em',
          padding: '13px 22px', borderRadius: 9999,
          background: ORANGE, border: `1px solid ${ORANGE}`,
          display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
          transition: 'background 180ms ease, transform 180ms ease, box-shadow 220ms ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#d4571f'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 22px rgba(232,98,42,0.35)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = ORANGE; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
        >
          Visit Mojo 360 →
        </a>
      </div>
    </section>
  );
}

Object.assign(window, { SectionShell, SectionWhat, SectionBuiltFor, SectionHow, SectionProof, SectionFinalCTA, SectionMojo360 });
