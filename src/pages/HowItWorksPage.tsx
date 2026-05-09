import { BarChart2, AlignJustify, Megaphone, DollarSign, Monitor, Users, MapPin, FileText, TrendingUp, ArrowRight, Zap, Check } from 'lucide-react';
import LandingHeader from '@/components/LandingHeader';

type LandingNavPage = 'home' | 'how-it-works' | 'websites' | 'reach-out';

interface HowItWorksPageProps {
  onLaunch: () => void;
  onNavigate: (page: LandingNavPage) => void;
  onViability: () => void;
}

/* ═══════════ Column data ═══════════ */

const SYSTEMS = [
  { icon: Monitor, label: 'Square / POS', type: 'Sales · dockets · cash', accent: '#a395e0', rgb: '163,149,224' },
  { icon: Users, label: 'Tanda / Deputy', type: 'Labour · rostering', accent: '#d4a24a', rgb: '212,162,74' },
  { icon: DollarSign, label: 'Xero / MYOB', type: 'P&L · costs · invoices', accent: '#34d399', rgb: '52,211,153' },
  { icon: MapPin, label: 'Google · Reviews', type: 'Reputation · NPS', accent: '#c45fa0', rgb: '196,95,160' },
  { icon: FileText, label: 'CSV · Manual entry', type: 'Historical · custom', accent: 'rgba(245,242,237,0.35)', rgb: '245,242,237' },
];

const MANAGERS = [
  { accent: '#a395e0', icon: BarChart2, name: 'Sales Manager', bg: '#13111a', insight: 'Kempsey is 14% below budget but trending up — you may recover without action.' },
  { accent: '#d4a24a', icon: AlignJustify, name: 'Ops Manager', bg: '#15130e', insight: 'Labour % has been over target 3 weeks running. Review the roster pattern.' },
  { accent: '#34d399', icon: DollarSign, name: 'Finance Manager', bg: '#0d1510', insight: "Food cost is 2pp above budget. At this run rate that's $11k unbudgeted by June." },
  { accent: '#c45fa0', icon: Megaphone, name: 'Marketing Manager', bg: '#150e13', insight: 'Your last campaign drove +9% Tuesday covers at Forster. Repeat before quiet periods.' },
];

const RESULTS = [
  'Daily briefing from every manager — in plain English',
  'Spot problems before they cost you',
  'Act on the right insight at the right time',
  'Watch your Mojo Health Score climb',
];

const MOJO_PILLS = ['Sales vs budget engine', 'Traffic light model', 'Mojo Health Score', 'Labour & cost tracking', 'Agentic insight layer'];

/* ═══════════ Component ═══════════ */

export default function HowItWorksPage({ onLaunch, onNavigate, onViability }: HowItWorksPageProps) {
  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#f5f2ed', fontFamily: "'DM Sans', sans-serif", overflowX: 'hidden' }}>
      <style>{`
        @keyframes hiw-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        @media (max-width: 1024px) {
          .hiw-flow { grid-template-columns: 1fr !important; gap: 32px !important; }
          .hiw-arrow { display: none !important; }
          .hiw-compare-grid { grid-template-columns: 1fr !important; }
          .hiw-hero-grid { grid-template-columns: 1fr !important; }
          .hiw-hero-polaroids { display: none !important; }
          .hiw-mgr-cards { height: auto !important; display: flex !important; flex-direction: column !important; gap: 16px !important; }
          .hiw-mgr-card { position: relative !important; left: auto !important; right: auto !important; top: auto !important; width: 100% !important; height: 300px !important; transform: none !important; }
        }
      `}</style>

      <LandingHeader activePage="how-it-works" onLaunch={onLaunch} onNavigate={onNavigate} />

      {/* ═══════════ HERO — two column with polaroids ═══════════ */}
      <section style={{ padding: '160px 48px 80px', position: 'relative', overflow: 'hidden' }}>
        {/* Orange glow */}
        <div style={{ position: 'absolute', top: '-120px', right: '-80px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,98,42,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div className="hiw-hero-grid" style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', gap: '40px' }}>
          {/* Left — text */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#e8622a', marginBottom: '20px' }}>
              How it works
            </p>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(40px, 5vw, 62px)', lineHeight: 1.05, letterSpacing: '-0.025em', color: '#f5f2ed', margin: '0 0 18px' }}>
              Your systems.<br />
              Your <span style={{ color: '#e8622a' }}>Mojo</span>.<br />
              Your results.
            </h1>
            <p style={{ fontSize: '16px', fontWeight: 300, color: 'rgba(245,242,237,0.45)', maxWidth: '500px', lineHeight: 1.65 }}>
              All your existing tools feed into Mojo 360. The right data goes to the right manager. They brief you. You make better decisions.
            </p>
          </div>

          {/* Right — 3 polaroids */}
          <div className="hiw-hero-polaroids" style={{ position: 'relative', height: '630px' }}>
            {[
              { src: '/images/optimised/GracieBurger_SocialRes-52.jpg', w: 390, h: 285, top: 15, right: 210, rotate: -3, caption: 'Sales Dashboard' },
              { src: '/images/optimised/GracieBurger_SocialRes-3.jpg',  w: 300, h: 375, top: 0,  right: 0,   rotate: 4, caption: 'Integrations' },
              { src: '/images/optimised/Incidentals_332_low.jpg',       w: 360, h: 270, top: 330, right: 120, rotate: 2, caption: 'Menu Builder' },
            ].map(({ src, w, h, top, right, rotate, caption }, i) => (
              <div key={i} style={{
                position: 'absolute', top: `${top}px`, right: `${right}px`,
                transform: `rotate(${rotate}deg)`,
                background: '#ffffff', padding: '7px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}>
                <img
                  src={src}
                  alt={caption}
                  decoding="async"
                  fetchPriority={i === 0 ? 'high' : 'auto'}
                  style={{ width: `${w}px`, height: `${h}px`, objectFit: 'cover', display: 'block' }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ BUILT IN. ALWAYS ON. — PHOTO MANAGER CARDS ═══════════ */}
      <section style={{ background: '#0a0a0a', padding: '80px 48px 0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(245,242,237,0.4)', marginBottom: '12px' }}>
            Your management team
          </p>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(30px, 4vw, 40px)', lineHeight: 1.1, color: '#f5f2ed', margin: '0 0 8px' }}>
            Built in. Always on.<br />
            <span style={{ color: '#e8622a' }}>Zero politics.</span>
          </h2>
          <p style={{ fontSize: '14px', fontWeight: 300, color: 'rgba(245,242,237,0.45)', marginBottom: '44px', maxWidth: '420px' }}>
            Each Virtual Manager owns their domain. Hire one, or hire the whole team.
          </p>

          {/* Overlapping photo cards */}
          <div className="hiw-mgr-cards" style={{ position: 'relative', height: '440px' }}>
            {[
              {
                src: '/images/optimised/GracieBurger_SocialRes-60.jpg',
                left: '0', top: '24px', width: '42%', height: '390px',
                rotate: '-1.5deg', origin: 'bottom left',
                overlay: 'linear-gradient(to top, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.15) 65%, transparent 100%)',
                dotColor: '#a395e0', tag: 'Virtual Sales Manager',
                tagBg: 'rgba(10,10,10,0.7)', tagBorder: 'rgba(163,149,224,0.3)',
                headline: 'Revenue.\nBudgets.\nTraffic lights.',
                sub: 'Sales vs budget across all your venues',
                subColor: 'rgba(245,242,237,0.45)',
              },
              {
                src: '/images/optimised/GracieBurger_SocialRes-19.jpg',
                left: '38%', top: '0', width: '36%', height: '350px',
                rotate: '1deg', origin: 'bottom right',
                overlay: 'linear-gradient(to top, rgba(232,98,42,0.9) 0%, rgba(232,98,42,0.05) 75%, transparent 100%)',
                dotColor: '#ffffff', tag: 'Virtual Ops Manager',
                tagBg: '#e8622a', tagBorder: 'rgba(255,255,255,0.2)',
                headline: 'Labour.\nCash.\nCost control.',
                sub: 'Big 2 tracking every venue',
                subColor: 'rgba(255,255,255,0.7)',
              },
              {
                src: '/images/optimised/GracieBurger_SocialRes-27.jpg',
                right: '0', top: '34px', width: '30%', height: '370px',
                rotate: '-0.5deg', origin: 'center',
                overlay: 'linear-gradient(to top, rgba(10,10,10,0.92) 0%, transparent 60%)',
                dotColor: '#c45fa0', tag: 'Virtual Marketing Manager',
                tagBg: 'rgba(10,10,10,0.7)', tagBorder: 'rgba(196,95,160,0.3)',
                headline: 'Brand.\nCampaigns.\nOnline.',
                sub: 'Mojo Websites + reputation',
                subColor: 'rgba(245,242,237,0.45)',
              },
            ].map((card, i) => (
              <div
                key={i}
                className="hiw-mgr-card"
                style={{
                  position: 'absolute',
                  left: card.left, right: card.right, top: card.top,
                  width: card.width, height: card.height,
                  transform: `rotate(${card.rotate})`,
                  transformOrigin: card.origin,
                  borderRadius: '14px', overflow: 'hidden',
                }}
              >
                <img src={card.src} alt={card.tag} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: card.overlay }} />
                <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    background: card.tagBg, border: `0.5px solid ${card.tagBorder}`,
                    borderRadius: '9999px', padding: '4px 10px', marginBottom: '10px',
                  }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: card.dotColor }} />
                    <span style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.06em', color: '#fff' }}>{card.tag}</span>
                  </div>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '24px', lineHeight: 1.1, color: '#fff', margin: '0 0 6px', whiteSpace: 'pre-line' }}>
                    {card.headline}
                  </h3>
                  <p style={{ fontSize: '11px', fontWeight: 300, color: card.subColor, margin: 0 }}>{card.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ REAL MANAGERS ARE EXPENSIVE — DARK STYLE ═══════════ */}
      <section style={{ background: '#0a0a0a', padding: '100px 48px' }}>
        <div style={{ maxWidth: '880px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <p style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#e8622a', marginBottom: '16px' }}>
              The Maths
            </p>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 'clamp(28px, 4vw, 38px)', color: '#f5f2ed', margin: '0 0 10px' }}>
              Real managers are expensive.
            </h2>
            <p style={{ fontSize: '15px', fontWeight: 300, color: 'rgba(245,242,237,0.4)', margin: '0 auto', maxWidth: '440px' }}>
              Great for big business. Not realistic for most hospitality operators.
            </p>
          </div>

          <div className="hiw-compare-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Traditional Hire */}
            <div style={{
              background: '#141414', borderRadius: '18px', padding: '36px 32px',
              border: '0.5px solid rgba(255,255,255,0.07)',
              textAlign: 'center',
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 18px',
              }}>
                <Users size={20} color="rgba(245,242,237,0.5)" />
              </div>
              <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '20px', color: '#f5f2ed', margin: '0 0 4px' }}>Traditional Hire</p>
              <p style={{ fontSize: '13px', color: 'rgba(245,242,237,0.35)', margin: '0 0 28px' }}>Per manager, per year</p>
              <div style={{ marginBottom: '28px' }}>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '52px', color: '#f5f2ed' }}>$100k</span>
                <span style={{ fontSize: '18px', color: 'rgba(245,242,237,0.3)', marginLeft: '2px' }}>+</span>
              </div>
              <div style={{ width: '100%', height: '0.5px', background: 'rgba(255,255,255,0.07)', marginBottom: '22px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', textAlign: 'left' }}>
                {['One person, one role', 'Annual salary + super + leave', 'Recruitment takes months', 'Limited to working hours'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'rgba(245,242,237,0.4)' }}>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(245,242,237,0.2)', flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Virtual Manager */}
            <div style={{
              background: '#141414', borderRadius: '18px', padding: '36px 32px',
              border: '0.5px solid rgba(232,98,42,0.25)', position: 'relative', overflow: 'hidden',
              textAlign: 'center',
            }}>
              <div style={{
                position: 'absolute', top: '14px', right: '14px',
                background: '#e8622a', color: 'white', fontSize: '8px', fontWeight: 600,
                letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: '5px',
              }}>
                From 95% less
              </div>
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: 'rgba(232,98,42,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 18px',
              }}>
                <Zap size={20} color="#e8622a" />
              </div>
              <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '20px', color: '#f5f2ed', margin: '0 0 4px' }}>Virtual Manager</p>
              <p style={{ fontSize: '13px', color: 'rgba(245,242,237,0.35)', margin: '0 0 28px' }}>Hire a Virtual Manager</p>
              <div style={{ marginBottom: '28px' }}>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '52px', color: '#e8622a' }}>$250</span>
                <span style={{ fontSize: '18px', color: 'rgba(245,242,237,0.3)', marginLeft: '2px' }}>/wk</span>
              </div>
              <div style={{ width: '100%', height: '0.5px', background: 'rgba(255,255,255,0.07)', marginBottom: '22px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', textAlign: 'left' }}>
                {['Four managers, every role', 'No super, no leave, no HR', 'Live in minutes', 'On 24/7, across all venues'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'rgba(245,242,237,0.5)' }}>
                    <Check size={12} color="#e8622a" style={{ flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '36px' }}>
            <button onClick={onLaunch} style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: '#e8622a', color: 'white', border: 'none',
              fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 500,
              padding: '14px 28px', borderRadius: '10px', cursor: 'pointer',
              transition: 'all 200ms ease',
            }}>
              Hire your team <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════ FLOW DIAGRAM ═══════════ */}
      <section style={{ padding: '0 48px 100px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="hiw-flow" style={{ display: 'grid', gridTemplateColumns: '1fr 48px 1fr 48px 1fr 48px 1fr', alignItems: 'start', gap: 0 }}>

            {/* ── COL 1: Your systems ── */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(245,242,237,0.2)' }} />
                <p style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(245,242,237,0.3)', margin: 0 }}>Your systems</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {SYSTEMS.map(({ icon: Icon, label, type, accent, rgb }) => (
                  <div key={label} style={{
                    background: '#141414', border: '0.5px solid rgba(255,255,255,0.07)',
                    borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px',
                    transition: 'border-color 200ms',
                  }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `rgba(${rgb},0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={15} color={accent} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 500, fontSize: '13px', color: '#f5f2ed', margin: 0 }}>{label}</p>
                      <p style={{ fontWeight: 300, fontSize: '11px', color: 'rgba(245,242,237,0.3)', margin: 0 }}>{type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Arrow 1 */}
            <div className="hiw-arrow" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '80px', gap: '8px' }}>
              <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', position: 'relative' }}>
                <div style={{ position: 'absolute', right: '-1px', top: '-4px', width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '7px solid rgba(255,255,255,0.1)' }} />
              </div>
              <span style={{ fontSize: '9px', fontWeight: 400, color: 'rgba(245,242,237,0.18)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>data in</span>
            </div>

            {/* ── COL 2: Mojo 360 ── */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e8622a' }} />
                <p style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(245,242,237,0.3)', margin: 0 }}>Mojo 360</p>
              </div>
              <div style={{
                background: '#141414', border: '0.5px solid rgba(232,98,42,0.2)',
                borderRadius: '18px', padding: '28px 20px', textAlign: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}>
                  <img src="/favicon.png" alt="" style={{ width: '22px', height: '22px', borderRadius: '6px' }} />
                  <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '16px' }}>
                    <span style={{ color: '#e8622a' }}>Mojo</span><span style={{ color: '#f5f2ed' }}>360</span>
                  </span>
                </div>
                <p style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(245,242,237,0.25)', margin: '0 0 6px' }}>Virtual Manager OS</p>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e8622a', margin: '0 auto 20px', animation: 'hiw-pulse 2s infinite' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {MOJO_PILLS.map(pill => (
                    <div key={pill} style={{
                      background: 'rgba(232,98,42,0.06)', border: '0.5px solid rgba(232,98,42,0.12)',
                      borderRadius: '8px', padding: '8px 12px', fontSize: '11px', color: 'rgba(232,98,42,0.7)',
                    }}>{pill}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Arrow 2 */}
            <div className="hiw-arrow" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '80px', gap: '8px' }}>
              <div style={{ width: '100%', height: '1px', background: 'rgba(232,98,42,0.3)', position: 'relative' }}>
                <div style={{ position: 'absolute', right: '-1px', top: '-4px', width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '7px solid rgba(232,98,42,0.3)' }} />
              </div>
              <span style={{ fontSize: '9px', fontWeight: 400, color: 'rgba(245,242,237,0.18)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>routes to</span>
            </div>

            {/* ── COL 3: Your managers ── */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(245,242,237,0.2)' }} />
                <p style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(245,242,237,0.3)', margin: 0 }}>Your managers</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {MANAGERS.map(({ accent, icon: Icon, name, bg, insight }) => (
                  <div key={name} style={{
                    background: bg, borderLeft: `2px solid ${accent}`,
                    border: '0.5px solid rgba(255,255,255,0.06)', borderLeftWidth: '2px', borderLeftColor: accent,
                    borderRadius: '14px', padding: '14px 16px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={13} color={accent} />
                      </div>
                      <span style={{ fontWeight: 500, fontSize: '13px', color: '#f5f2ed' }}>{name}</span>
                    </div>
                    <p style={{ fontWeight: 400, fontStyle: 'italic', fontSize: '11.5px', color: 'rgba(245,242,237,0.4)', margin: 0, lineHeight: 1.5, paddingLeft: '40px' }}>"{insight}"</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Arrow 3 */}
            <div className="hiw-arrow" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '80px', gap: '8px' }}>
              <div style={{ width: '100%', height: '1px', background: 'rgba(52,211,153,0.25)', position: 'relative' }}>
                <div style={{ position: 'absolute', right: '-1px', top: '-4px', width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '7px solid rgba(52,211,153,0.25)' }} />
              </div>
              <span style={{ fontSize: '9px', fontWeight: 400, color: 'rgba(245,242,237,0.18)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>you get</span>
            </div>

            {/* ── COL 4: Your results ── */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
                <p style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(245,242,237,0.3)', margin: 0 }}>Your results</p>
              </div>
              <div style={{
                background: 'rgba(52,211,153,0.03)', border: '0.5px solid rgba(52,211,153,0.15)',
                borderRadius: '18px', padding: '28px 20px',
              }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(52,211,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <TrendingUp size={18} color="#34d399" />
                </div>
                <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '16px', color: '#34d399', textAlign: 'center', margin: '0 0 20px' }}>Make more money.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {RESULTS.map((text, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <div style={{
                        width: '22px', height: '22px', borderRadius: '50%', background: '#e8622a',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        fontSize: '10px', fontWeight: 600, color: 'white',
                      }}>{i + 1}</div>
                      <p style={{ fontSize: '12px', color: 'rgba(245,242,237,0.45)', margin: 0, lineHeight: 1.55 }}>{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════ CTA STRIP ═══════════ */}
      <section style={{ background: '#e8622a', padding: '48px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '26px', color: 'white', margin: '0 0 6px' }}>
              Ready to get your Mojo back?
            </h2>
            <p style={{ fontSize: '14px', fontWeight: 300, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
              Join the waitlist for early access when we launch.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={onLaunch} style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'white', color: '#e8622a', border: 'none',
              fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600,
              padding: '14px 28px', borderRadius: '10px', cursor: 'pointer',
              transition: 'all 200ms ease',
            }}>
              Join the waitlist <ArrowRight size={14} />
            </button>
            <button onClick={onViability} style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'transparent', color: 'rgba(255,255,255,0.85)',
              border: '1px solid rgba(255,255,255,0.3)',
              fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 500,
              padding: '14px 24px', borderRadius: '10px', cursor: 'pointer',
              transition: 'all 200ms ease',
            }}>
              Try Business Viability — free
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)', padding: '26px 48px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <img src="/favicon.png" alt="" style={{ width: '18px', height: '18px', borderRadius: '4px' }} />
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '14px' }}>
                <span style={{ color: '#e8622a' }}>Mojo</span><span style={{ color: '#f5f2ed' }}>360</span>
              </span>
            </div>
            <p style={{ fontSize: '11px', color: 'rgba(245,242,237,0.2)', margin: 0 }}>Built for hospitality operators in Australia</p>
          </div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <button onClick={onLaunch} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '12px', color: 'rgba(245,242,237,0.25)', fontFamily: "'DM Sans', sans-serif", transition: 'color 200ms' }}>Sign in</button>
            <button onClick={onViability} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '12px', color: 'rgba(245,242,237,0.25)', fontFamily: "'DM Sans', sans-serif", transition: 'color 200ms' }}>Business Viability</button>
            <button onClick={() => onNavigate('reach-out')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '12px', color: 'rgba(245,242,237,0.25)', fontFamily: "'DM Sans', sans-serif", transition: 'color 200ms' }}>Contact</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
