/* Mojo Viability — shared core
 * Tokens, primitives, header, footer, M-glyph.
 * All exposed via window for cross-file Babel scope.
 */

const VBR = {
  ink:        '#080808',
  ink2:       '#0e0e0e',
  ink3:       '#141414',
  surface:    '#101010',
  cream:      '#f5f2ed',
  fg:         '#f5f2ed',
  fgMuted:    'rgba(245,242,237,0.62)',
  fgSubtle:   'rgba(245,242,237,0.38)',
  fgFaint:    'rgba(245,242,237,0.18)',
  border:     'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.14)',
  hairline:   '0.5px solid rgba(255,255,255,0.07)',

  green:      '#34d399',
  greenHover: '#2ec07f',
  greenSoft:  'rgba(52,211,153,0.12)',
  greenSofter:'rgba(52,211,153,0.06)',
  greenLine:  'rgba(52,211,153,0.28)',

  amber:      'rgba(232,180,90,0.92)',
  amberSoft:  'rgba(232,180,90,0.12)',
  amberLine:  'rgba(232,180,90,0.32)',

  fontDisplay: '"Fraunces", Georgia, "Times New Roman", serif',
  fontDisplayAlt: '"Syne", "Helvetica Neue", Helvetica, system-ui, sans-serif',
  fontBody:    '"DM Sans", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  fontMono:    'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace',

  maxw: 1180,
  pad:  56,
};
window.VBR = VBR;

/* ─── M-glyph (rounded square + M counter), recolourable ─── */
function MGlyph({ size = 28, color = VBR.green, ink = VBR.ink, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 63 61" style={style} aria-hidden="true">
      <path d="M61.746,10.156c0,-5.349 -4.402,-9.751 -9.751,-9.751l-41.839,0c-5.349,-0 -9.751,4.402 -9.751,9.751l0,40.681c0,5.349 4.402,9.751 9.751,9.751l41.839,0c5.349,0 9.751,-4.402 9.751,-9.751l-0,-40.681" fill={color}/>
      <path d="M12.522,31.218c-0.026,0 -0.048,0.022 -0.048,0.048l0,12.614c-0,0.024 -0.02,0.044 -0.044,0.044l-8.804,0c-0.033,0 -0.06,-0.027 -0.06,-0.06l0,-26.773c0,-0.013 0.011,-0.024 0.024,-0.024l9.745,0c0.05,0 0.097,0.021 0.131,0.058c2.551,2.825 5.481,6.052 8.791,9.682c3.797,4.164 6.362,6.974 7.696,8.429c0.242,0.265 0.359,0.478 0.768,0.459c0.049,-0.002 0.354,-0.003 0.915,-0.003c0.098,0.001 0.193,-0.041 0.259,-0.114l16.815,-18.452c0.003,-0.003 0.006,-0.007 0.009,-0.01c0.031,-0.033 0.149,-0.05 0.354,-0.05c3.154,-0.001 6.308,-0 9.463,0.001c0.027,0 0.049,0.022 0.049,0.049l0,26.75c0,0.032 -0.027,0.058 -0.059,0.058l-8.884,0c-0.02,0 -0.036,-0.016 -0.036,-0.036l0,-12.595c0,-0.036 -0.029,-0.066 -0.065,-0.068c-0.322,-0.018 -0.726,0.001 -1.14,-0.012c-0.154,-0.005 -0.277,0.039 -0.37,0.131c-0.209,0.209 -1.084,1.12 -2.627,2.735c-2.099,2.199 -5.202,5.456 -9.308,9.77c-0.047,0.049 -0.112,0.077 -0.18,0.077c-3.268,-0.002 -6.45,-0.002 -9.547,0.001c-0.136,0 -0.252,-0.017 -0.349,-0.052c-0.012,-0.004 -0.022,-0.01 -0.03,-0.019c-6.15,-6.491 -10.071,-10.629 -11.766,-12.412c-0.161,-0.17 -0.285,-0.23 -0.522,-0.23c-0.357,-0.001 -0.751,0 -1.18,0.003Z" fill={ink}/>
    </svg>
  );
}

/* ─── Eyebrow (small overline) ─── */
function Eyebrow({ children, color = VBR.green, style }) {
  return (
    <span style={{
      fontFamily: VBR.fontBody, fontSize: 11, fontWeight: 500,
      letterSpacing: '0.18em', textTransform: 'uppercase', color,
      display: 'inline-flex', alignItems: 'center', gap: 10,
      ...style,
    }}>{children}</span>
  );
}

/* ─── CTA button ─── */
function VButton({ children, variant = 'primary', size = 'md', onClick, style, as: As = 'button', href }) {
  const [h, setH] = React.useState(false);
  const sizes = {
    md: { padding: '13px 22px', fontSize: 14.5 },
    lg: { padding: '16px 28px', fontSize: 15.5 },
    sm: { padding: '9px 16px',  fontSize: 13 },
  };
  const variants = {
    primary: {
      background: h ? VBR.greenHover : VBR.green,
      color: '#062b1d',
      boxShadow: h ? '0 6px 24px rgba(52,211,153,0.30)' : 'none',
      transform: h ? 'translateY(-1px)' : 'translateY(0)',
      fontWeight: 600,
    },
    ghost: {
      background: h ? 'rgba(245,242,237,0.06)' : 'transparent',
      color: VBR.cream,
      border: `1px solid ${VBR.borderStrong}`,
    },
    text: {
      background: 'transparent', color: h ? VBR.green : VBR.fgMuted,
      padding: '6px 0', borderBottom: `1px solid ${h ? VBR.green : 'transparent'}`,
      borderRadius: 0,
      fontWeight: 400,
    },
  };
  const base = {
    fontFamily: VBR.fontBody, fontWeight: 500,
    borderRadius: 9999, border: 'none', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 8,
    transition: 'background 180ms ease, transform 180ms ease, box-shadow 220ms ease, color 160ms ease, border-color 160ms ease',
    textDecoration: 'none', lineHeight: 1,
    ...sizes[size], ...variants[variant], ...style,
  };
  if (As === 'a' || href) {
    return (
      <a href={href || '#'} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} onClick={onClick} style={base}>
        {children}
      </a>
    );
  }
  return (
    <button onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} onClick={onClick} style={base}>
      {children}
    </button>
  );
}

/* ─── A vertical hair rule with caption (editorial chrome) ─── */
function HairlineLabel({ children, color = VBR.fgSubtle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 28, height: 1, background: color }}/>
      <span style={{
        fontFamily: VBR.fontMono, fontSize: 11, letterSpacing: '0.08em',
        textTransform: 'uppercase', color,
      }}>{children}</span>
    </div>
  );
}

/* ─── Pre-fitout shopfront placeholder (no fake photo) ─── */
function ShopfrontPlaceholder({ width = '100%', height = 220, label = 'PRE-FITOUT SHOPFRONT · PORT MACQUARIE', style }) {
  return (
    <div style={{
      position: 'relative', width, height, overflow: 'hidden',
      background: `
        repeating-linear-gradient(
          135deg,
          rgba(245,242,237,0.025) 0 8px,
          rgba(245,242,237,0) 8px 16px
        ),
        linear-gradient(180deg, #0c0c0c 0%, #0a0a0a 100%)
      `,
      border: VBR.hairline, borderRadius: 4,
      ...style,
    }}>
      {/* corner brackets */}
      {[
        { top: 10, left: 10, b: ['t','l'] },
        { top: 10, right: 10, b: ['t','r'] },
        { bottom: 10, left: 10, b: ['b','l'] },
        { bottom: 10, right: 10, b: ['b','r'] },
      ].map((c, i) => (
        <div key={i} style={{
          position: 'absolute', ...c, width: 14, height: 14,
          borderTop: c.b.includes('t') ? `1px solid ${VBR.fgSubtle}` : 'none',
          borderBottom: c.b.includes('b') ? `1px solid ${VBR.fgSubtle}` : 'none',
          borderLeft: c.b.includes('l') ? `1px solid ${VBR.fgSubtle}` : 'none',
          borderRight: c.b.includes('r') ? `1px solid ${VBR.fgSubtle}` : 'none',
        }}/>
      ))}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        fontFamily: VBR.fontMono, fontSize: 10.5, letterSpacing: '0.18em',
        color: VBR.fgSubtle, textAlign: 'center', whiteSpace: 'nowrap',
      }}>
        <div style={{ marginBottom: 4 }}>◬</div>
        {label}
      </div>
    </div>
  );
}

/* ─── Header — sticky-style for mockups ─── */
function ViabilityHeader({ authed = false, tint = false, style }) {
  return (
    <header style={{
      width: '100%', boxSizing: 'border-box',
      padding: '20px 56px',
      background: tint ? 'rgba(8,8,8,0.72)' : 'transparent',
      backdropFilter: tint ? 'blur(18px)' : 'none',
      borderBottom: tint ? VBR.hairline : '0.5px solid transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 24, ...style,
    }}>
      <a href="#" style={{ display: 'inline-flex', alignItems: 'center', gap: 11, textDecoration: 'none' }}>
        <MGlyph size={26} color={VBR.green} ink={VBR.ink}/>
        <span style={{
          fontFamily: VBR.fontDisplay, fontSize: 22, fontWeight: 700,
          letterSpacing: '-0.02em', color: VBR.cream, lineHeight: 1,
        }}>
          <span style={{ color: VBR.green }}>Mojo</span>{' '}
          <span style={{ color: VBR.cream }}>Viability</span>
        </span>
      </a>

      <nav style={{ display: 'flex', gap: 28 }}>
        {['Home', 'Reach Out'].map((n, i) => (
          <a key={n} href="#" style={{
            fontFamily: VBR.fontBody, fontSize: 13.5, color: i === 0 ? VBR.cream : VBR.fgMuted,
            textDecoration: 'none', padding: '6px 0', position: 'relative',
          }}>{n}</a>
        ))}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {authed ? (
          <VButton variant="primary" size="sm">Open Viability →</VButton>
        ) : (
          <>
            <a href="#" style={{
              fontFamily: VBR.fontBody, fontSize: 13.5, color: VBR.fgMuted,
              textDecoration: 'none', padding: '6px 4px',
            }}>Sign in</a>
            <VButton variant="primary" size="sm">Try free →</VButton>
          </>
        )}
      </div>
    </header>
  );
}

/* ─── Footer ─── */
function ViabilityFooter({ showCrossLink = true }) {
  const cols = [
    { h: 'Product', l: ['Reach Out'] },
    { h: 'Legal', l: ['Privacy', 'Terms'] },
    { h: 'Ecosystem', l: showCrossLink ? ['Mojo 360 →'] : [] },
  ];
  return (
    <footer style={{
      width: '100%', boxSizing: 'border-box',
      padding: '72px 56px 36px',
      background: '#050505', borderTop: VBR.hairline,
    }}>
      <div style={{ maxWidth: VBR.maxw, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 40, alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
            <MGlyph size={24} color={VBR.green} ink={VBR.ink}/>
            <span style={{ fontFamily: VBR.fontDisplay, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
              <span style={{ color: VBR.green }}>Mojo</span>{' '}
              <span style={{ color: VBR.cream }}>Viability</span>
            </span>
          </div>
          <p style={{
            fontFamily: VBR.fontBody, fontSize: 13.5, lineHeight: 1.6,
            color: VBR.fgMuted, margin: 0, fontWeight: 300, maxWidth: 320,
          }}>
            A free tool for modelling a hospitality venue before you commit. Built in Australia for Australian operators.
          </p>
          {showCrossLink && (
            <a href="#" style={{
              marginTop: 22, display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', border: VBR.hairline, borderRadius: 8,
              fontFamily: VBR.fontBody, fontSize: 12.5, color: VBR.fgMuted, textDecoration: 'none',
              background: 'rgba(245,242,237,0.025)',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: '#e8622a' }}/>
              When you're trading, <span style={{ color: VBR.cream }}>Mojo&nbsp;360</span> takes over →
            </a>
          )}
        </div>
        {cols.map((c) => (
          <div key={c.h}>
            <h5 style={{
              fontFamily: VBR.fontBody, fontSize: 11, fontWeight: 600,
              letterSpacing: '0.16em', textTransform: 'uppercase', color: VBR.fgMuted,
              margin: '0 0 16px',
            }}>{c.h}</h5>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 11 }}>
              {c.l.map((i) => (
                <li key={i}>
                  <a href="#" style={{ fontFamily: VBR.fontBody, fontSize: 13.5, color: VBR.fgMuted, textDecoration: 'none' }}>{i}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{
        maxWidth: VBR.maxw, margin: '52px auto 0', padding: '20px 0 0',
        borderTop: VBR.hairline,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: VBR.fontBody, fontSize: 11.5, color: VBR.fgSubtle,
      }}>
        <span>© 2026 Mojo Pty Ltd · ABN 00 000 000 000</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: VBR.green }}/>
          Built in Port Macquarie, Australia
        </span>
      </div>
    </footer>
  );
}

Object.assign(window, { MGlyph, Eyebrow, VButton, HairlineLabel, ShopfrontPlaceholder, ViabilityHeader, ViabilityFooter, ViabilityTicker, FreeForeverStamp });

/* ─── Viability ticker — green marquee, dark text. Sits below the hero.
   Same shape as the Mojo 360 ticker so the family relationship is clear,
   different colour. DM Sans uppercase keeps it utilitarian. ─── */
function ViabilityTicker({
  items = [
    '100% FREE FOREVER',
    'NO PAID TIER',
    'NO IN-APP PURCHASES',
    'NO HIDDEN CHARGES',
    'NO CREDIT CARD',
    'USE IT AS LONG AS YOU NEED',
    'NO TRIAL THAT ENDS',
    'BUILT TO PREVENT CLOSURE — NOT PROFIT FROM IT',
  ],
  duration = 38,
}) {
  return (
    <div style={{
      background: VBR.green, overflow: 'hidden', padding: '12px 0',
      borderTop: '1px solid rgba(6,43,29,0.15)', borderBottom: '1px solid rgba(6,43,29,0.15)',
      position: 'relative',
    }}>
      <div style={{
        display: 'flex', gap: 44, whiteSpace: 'nowrap',
        animation: `vbr-ticker ${duration}s linear infinite`,
        willChange: 'transform',
      }}>
        {[...Array(3)].flatMap((_, copy) => items.map((it, j) => (
          <span key={`${copy}-${j}`} style={{
            fontFamily: VBR.fontBody, fontSize: 12.5, fontWeight: 700,
            letterSpacing: '0.18em', color: '#062b1d',
            display: 'inline-flex', alignItems: 'center', gap: 44,
          }}>
            {it}<span style={{ opacity: 0.45, fontSize: 14 }}>✦</span>
          </span>
        )))}
      </div>
      <style>{`
        @keyframes vbr-ticker { from { transform: translateX(0); } to { transform: translateX(-33.333%); } }
        @media (prefers-reduced-motion: reduce) {
          [style*="vbr-ticker"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ─── FreePromise — pill strip emphasising the four "no's".
   The first pill is filled green so it reads first; the rest are outlined.
   Size variants for context. ─── */
function FreePromise({ size = 'md', justify = 'flex-start', style }) {
  const items = [
    'Free forever',
    'No paid tier',
    'No in-app purchases',
    'No login to try',
  ];
  const fs = size === 'lg' ? 13.5 : size === 'sm' ? 11.5 : 12.5;
  const pad = size === 'lg' ? '9px 16px' : size === 'sm' ? '6px 11px' : '7px 13px';
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: justify,
      alignItems: 'center', ...style,
    }}>
      {items.map((s, i) => {
        const filled = i === 0;
        return (
          <span key={s} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: VBR.fontBody, fontSize: fs, fontWeight: filled ? 600 : 500,
            color: filled ? '#062b1d' : VBR.cream,
            padding: pad, borderRadius: 9999,
            background: filled ? VBR.green : VBR.greenSoft,
            border: `1px solid ${filled ? VBR.green : VBR.greenLine}`,
            letterSpacing: '0.01em', whiteSpace: 'nowrap',
            boxShadow: filled ? '0 4px 14px rgba(52,211,153,0.18)' : 'none',
          }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
              <path d="M2 5.6 L4.4 8 L9 3" stroke={filled ? '#062b1d' : VBR.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {s}
          </span>
        );
      })}
    </div>
  );
}

/* ─── FreeForeverStamp — rotated circular badge, used in the hero negative
   space so the "this is free" signal is impossible to miss. ─── */
function FreeForeverStamp({ size = 132, rotate = -8, style }) {
  const r = size / 2;
  // SVG textPath for the curved outer ring.
  return (
    <div style={{
      width: size, height: size, transform: `rotate(${rotate}deg)`,
      position: 'relative', display: 'inline-block', ...style,
    }} aria-hidden="true">
      {/* outer + inner rings */}
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}
        style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <path id="ffsRing" d={`M ${r},${r} m -${r - 6},0 a ${r - 6},${r - 6} 0 1,1 ${(r - 6) * 2},0 a ${r - 6},${r - 6} 0 1,1 -${(r - 6) * 2},0`}/>
        </defs>
        <circle cx={r} cy={r} r={r - 1.5} fill="none" stroke={VBR.green} strokeWidth="1.5"/>
        <circle cx={r} cy={r} r={r - 11} fill="none" stroke={VBR.green} strokeWidth="0.6" strokeDasharray="2 3" opacity="0.7"/>
        <text fontFamily={VBR.fontBody} fontSize="9.5" fontWeight="600"
          letterSpacing="3.2" fill={VBR.green}>
          <textPath href="#ffsRing" startOffset="0">
            FREE FOREVER · NO CATCHES · FREE FOREVER · NO CATCHES ·
          </textPath>
        </text>
      </svg>
      {/* centre lockup */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        color: VBR.green, fontFamily: VBR.fontDisplay,
      }}>
        <span style={{ fontFamily: VBR.fontBody, fontSize: 10, fontWeight: 600, letterSpacing: '0.22em' }}>$0</span>
        <span style={{ fontSize: size * 0.18, fontWeight: 700, lineHeight: 1, marginTop: 2, letterSpacing: '-0.01em' }}>free</span>
        <span style={{ fontFamily: VBR.fontDisplay, fontSize: size * 0.13, fontWeight: 500, fontStyle: 'italic', lineHeight: 1, marginTop: 2 }}>forever</span>
      </div>
    </div>
  );
}
