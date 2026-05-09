import { useState, useEffect, FormEvent } from 'react';
import { ArrowRight, Mail, Check } from 'lucide-react';
import LandingHeader from '@/components/LandingHeader';
import { supabase } from '@/lib/supabase';

type LandingNavPage = 'home' | 'how-it-works' | 'websites' | 'reach-out';

interface LandingPageProps {
  onLaunch: () => void;
  onNavigate: (page: LandingNavPage) => void;
  onViability: () => void;
}

/* ═══════════ Ticker items ═══════════ */

const TICKER = [
  'EVERY MANAGER YOU NEED',
  'NONE OF THE POLITICS',
  'GET YOUR MOJO BACK',
  'DO A FULL 360',
  'BUILT FOR AUSTRALIAN HOSPITALITY',
  'LAUNCHING SOON',
];

/* ═══════════ Polaroid data ═══════════ */

const POLAROIDS = [
  { src: '/images/optimised/GracieBurger_SocialRes-52.jpg', w: 290, h: 210, top: 30, right: 190, rotate: -4, caption: 'Gracie Burger · Sydney' },
  { src: '/images/optimised/GracieBurger_SocialRes-3.jpg', w: 210, h: 270, top: 15, right: 15, rotate: 3.5, caption: 'On the taps' },
  { src: '/images/optimised/GracieBurger_SocialRes-64.jpg', w: 250, h: 190, top: 255, right: 250, rotate: 2, caption: 'Wings + 4 Pines' },
  { src: '/images/optimised/GracieBurger_SocialRes-19.jpg', w: 230, h: 300, top: 215, right: 35, rotate: -2.5, caption: 'Friday service' },
  { src: '/images/optimised/GracieBurger_SocialRes-27.jpg', w: 210, h: 170, top: 450, right: 230, rotate: 4, caption: 'The wall' },
];

/* ═══════════ Manager photo cards ═══════════
   Accent colours come from docs/ui-design-schema.md:
   - Sales     Lavender #a395e0 → 163,149,224
   - Ops       Amber    #d4a24a → 212,162,74
   - Marketing Magenta  #c45fa0 → 196,95,160
   - Finance   Emerald  #34d399 → 52,211,153
*/

const MANAGER_CARDS = [
  {
    src: '/images/optimised/GracieBurger_SocialRes-60.jpg',
    accent: '163,149,224',
    tag: 'Virtual Sales Manager',
    headline: 'Revenue.\nBudgets.\nTraffic lights.',
    sub: 'Sales vs budget across all your venues',
  },
  {
    src: '/images/optimised/GracieBurger_SocialRes-19.jpg',
    accent: '212,162,74',
    tag: 'Virtual Ops Manager',
    headline: 'Labour.\nCash.\nCost control.',
    sub: 'Big 2 tracking every venue',
  },
  {
    src: '/images/optimised/GracieBurger_SocialRes-27.jpg',
    accent: '196,95,160',
    tag: 'Virtual Marketing Manager',
    headline: 'Brand.\nCampaigns.\nOnline.',
    sub: 'Mojo Websites + reputation',
  },
  {
    src: '/images/optimised/GracieBurger_SocialRes-64.jpg',
    accent: '52,211,153',
    tag: 'Virtual Finance Manager',
    headline: 'Cashflow.\nForecasts.\nProfit.',
    sub: 'Financial health across your group',
  },
];

const MANAGER_ROTATE_MS = 5000;

/* ═══════════ Component ═══════════ */

export default function LandingPage({ onLaunch, onNavigate, onViability }: LandingPageProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Manager carousel — auto-rotate through the four virtual managers
  const [activeManager, setActiveManager] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setActiveManager((prev) => (prev + 1) % MANAGER_CARDS.length);
    }, MANAGER_ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  // Waitlist form state
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleWaitlist = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const { error: dbError } = await supabase.from('hospo_os_waitlist').insert({
        email: email.trim(),
        first_name: '',
        last_name: '',
        full_name: '',
      });
      if (dbError) throw dbError;
      setSubmitted(true);
    } catch {
      setError('Something went wrong — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: '#0a0a0a', color: '#f5f2ed', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", overflowX: 'hidden' }}>
      <style>{`
        @keyframes lp1-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes lp1-fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .lp1-marquee-inner { animation: none !important; }
        }
        @media (max-width: 900px) {
          .lp1-hero-collage { display: none !important; }
          .lp1-hero-inner { grid-template-columns: 1fr !important; }
          .lp1-tagline-row { grid-template-columns: repeat(2, 1fr) !important; }
          .lp1-stamp { font-size: 42px !important; padding: 10px 28px !important; }
          .lp1-price-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .lp1-price-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <LandingHeader activePage="home" onLaunch={onLaunch} onNavigate={onNavigate} />

      {/* ═══════════ HERO ═══════════ */}
      <section style={{ position: 'relative', overflow: 'hidden', background: '#0a0a0a' }}>

        {/* ── COMING SOON rubber stamp overlay ── */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%) rotate(-14deg)',
          zIndex: 15, pointerEvents: 'none',
        }}>
          <div className="lp1-stamp" style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800,
            fontSize: '64px', letterSpacing: '0.08em',
            color: '#e8622a',
            textTransform: 'uppercase', userSelect: 'none',
            border: '4px solid #e8622a',
            borderRadius: '12px',
            padding: '14px 40px',
            opacity: 0.12,
            whiteSpace: 'nowrap',
          }}>
            COMING SOON
          </div>
        </div>

        {/* Centred content wrapper */}
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 48px', position: 'relative' }}>

          {/* Two-column grid */}
          <div className="lp1-hero-inner" style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            alignItems: 'center',
            position: 'relative', zIndex: 10,
          }}>

            {/* Left — text + waitlist */}
            <div style={{
              paddingTop: '200px', paddingBottom: '64px',
              animation: mounted ? 'lp1-fadeUp 0.7s ease-out both' : 'none',
            }}>
              <p style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#e8622a', marginBottom: '24px' }}>
                Mojo 360 — Virtual Manager OS
              </p>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(52px, 5.5vw, 74px)', lineHeight: 0.95, letterSpacing: '-0.03em', margin: 0 }}>
                <span style={{ color: '#f5f2ed' }}>Get your</span><br />
                <span style={{ color: '#e8622a' }}>Mojo</span><br />
                <span style={{ color: '#f5f2ed' }}>back.</span>
              </h1>
              <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(52px, 5.5vw, 74px)', lineHeight: 0.95, letterSpacing: '-0.03em', color: 'rgba(245,242,237,0.15)', margin: '8px 0 0' }}>
                Do a full 360.
              </p>

              {/* Waitlist form */}
              <div style={{ marginTop: '40px', maxWidth: '420px' }}>
                {submitted ? (
                  <div style={{
                    background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
                    borderRadius: '12px', padding: '18px 20px',
                  }}>
                    <p style={{ fontSize: '15px', fontWeight: 500, color: '#34d399', margin: '0 0 4px' }}>You're on the list!</p>
                    <p style={{ fontSize: '13px', fontWeight: 300, color: 'rgba(245,242,237,0.45)', margin: 0 }}>We'll let you know when Mojo 360 launches.</p>
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize: '14px', fontWeight: 400, color: 'rgba(245,242,237,0.5)', margin: '0 0 14px' }}>
                      Launching soon — join the waitlist for early access.
                    </p>
                    <form onSubmit={handleWaitlist} style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <Mail size={14} color="rgba(245,242,237,0.25)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                          type="email"
                          required
                          placeholder="your@email.com"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          style={{
                            width: '100%', padding: '14px 14px 14px 38px',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '10px', color: '#f5f2ed',
                            fontFamily: "'DM Sans', sans-serif", fontSize: '14px',
                            outline: 'none', transition: 'border-color 200ms',
                          }}
                          onFocus={e => e.currentTarget.style.borderColor = 'rgba(232,98,42,0.4)'}
                          onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submitting}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '8px',
                          background: '#e8622a', color: 'white', border: 'none',
                          fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 500,
                          padding: '14px 24px', borderRadius: '10px', cursor: submitting ? 'wait' : 'pointer',
                          opacity: submitting ? 0.7 : 1, transition: 'all 200ms ease',
                          whiteSpace: 'nowrap', flexShrink: 0,
                        }}
                      >
                        {submitting ? 'Joining…' : 'Join waitlist'} <ArrowRight size={14} />
                      </button>
                    </form>
                    {error && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px' }}>{error}</p>}
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                <button onClick={onViability} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: 'transparent', color: 'rgba(245,242,237,0.7)',
                  border: '1px solid rgba(245,242,237,0.12)',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 500,
                  padding: '12px 24px', borderRadius: '10px', cursor: 'pointer',
                  transition: 'all 200ms ease',
                }}>
                  Try Business Viability — free
                </button>
              </div>

              <p style={{ fontSize: '10px', color: 'rgba(245,242,237,0.2)', marginTop: '12px' }}>
                No credit card required during beta · All managers included
              </p>
            </div>

            {/* Right — Photo collage (contained) */}
            <div className="lp1-hero-collage" style={{
              position: 'relative', height: '660px', marginLeft: '20px',
            }}>
              {POLAROIDS.map(({ src, w, h, top, right, rotate, caption }, i) => (
                <div key={i} style={{
                  position: 'absolute', top: `${top}px`, right: `${right}px`,
                  transform: `rotate(${rotate}deg)`,
                  background: '#ffffff', padding: '7px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
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
        </div>
      </section>

      {/* ═══════════ SCROLLING ORANGE TICKER ═══════════ */}
      <section style={{ height: '52px', background: '#e8622a', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        <div className="lp1-marquee-inner" style={{
          display: 'flex', gap: '48px', alignItems: 'center',
          animation: 'lp1-marquee 18s linear infinite',
          whiteSpace: 'nowrap',
        }}>
          {[...TICKER, ...TICKER].map((text, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '14px', color: '#fff', letterSpacing: '0.04em' }}>{text}</span>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
            </span>
          ))}
        </div>
      </section>

      {/* ═══════════ MANAGER PHOTO SECTION ═══════════ */}
      <section style={{ background: '#0a0a0a', padding: '64px 48px 0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <p style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(245,242,237,0.45)', marginBottom: '12px' }}>
            Your management team
          </p>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '38px', lineHeight: 1.1, color: '#f5f2ed', margin: '0 0 8px' }}>
            Built in. Always on.<br />
            <span style={{ color: '#e8622a' }}>Zero politics.</span>
          </h2>
          <p style={{ fontSize: '14px', fontWeight: 300, color: 'rgba(245,242,237,0.45)', marginBottom: '44px', maxWidth: '420px' }}>
            Each Virtual Manager owns their domain. Hire one, or hire the whole team.
          </p>

          {/* Manager carousel — crossfade between cards, auto-rotating */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '480px',
              borderRadius: '18px',
              overflow: 'hidden',
              background: '#141414',
            }}
          >
            {MANAGER_CARDS.map((card, i) => {
              const isActive = i === activeManager;
              return (
                <div
                  key={i}
                  aria-hidden={!isActive}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? 'scale(1)' : 'scale(1.03)',
                    transition: 'opacity 700ms ease, transform 900ms ease',
                    pointerEvents: isActive ? 'auto' : 'none',
                  }}
                >
                  <img
                    src={card.src}
                    alt={card.tag}
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: `linear-gradient(to top, rgba(${card.accent},0.9) 0%, rgba(${card.accent},0.15) 60%, rgba(10,10,10,0.25) 100%)`,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '44px',
                      left: '48px',
                      right: '48px',
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: `rgba(${card.accent},0.92)`,
                        border: `0.5px solid rgba(${card.accent},0.4)`,
                        borderRadius: '9999px',
                        padding: '6px 14px',
                        marginBottom: '18px',
                      }}
                    >
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 500,
                          letterSpacing: '0.08em',
                          color: '#fff',
                          textTransform: 'uppercase',
                        }}
                      >
                        {card.tag}
                      </span>
                    </div>
                    <h3
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 800,
                        fontSize: 'clamp(32px, 4.2vw, 48px)',
                        lineHeight: 1.05,
                        color: '#fff',
                        margin: '0 0 12px',
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {card.headline}
                    </h3>
                    <p
                      style={{
                        fontSize: '14px',
                        fontWeight: 300,
                        color: 'rgba(255,255,255,0.78)',
                        margin: 0,
                      }}
                    >
                      {card.sub}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Carousel dots */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
              marginTop: '24px',
            }}
            role="tablist"
            aria-label="Virtual managers"
          >
            {MANAGER_CARDS.map((card, i) => {
              const isActive = i === activeManager;
              return (
                <button
                  key={i}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={card.tag}
                  onClick={() => setActiveManager(i)}
                  style={{
                    width: isActive ? '26px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    background: isActive
                      ? `rgba(${card.accent},0.9)`
                      : 'rgba(245,242,237,0.18)',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'width 350ms ease, background 350ms ease',
                  }}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ FREE VIABILITY STRIP ═══════════ */}
      <section style={{
        background: '#141414', marginTop: '64px',
        borderTop: '0.5px solid rgba(232,98,42,0.2)',
        borderBottom: '0.5px solid rgba(232,98,42,0.2)',
        padding: '28px 48px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap', maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{
            flexShrink: 0, background: 'rgba(232,98,42,0.1)', border: '1px solid rgba(232,98,42,0.18)',
            color: '#e8622a', fontSize: '10px', fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase', padding: '5px 14px', borderRadius: '9999px',
          }}>
            Always free · No login required
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '16px', color: '#f5f2ed', margin: '0 0 4px' }}>Planning a new venue? Start here.</p>
            <p style={{ fontWeight: 300, fontSize: '12px', color: 'rgba(245,242,237,0.4)', margin: 0, maxWidth: '400px' }}>
              Break-even modelling, labour costing and sales forecasting — run your numbers before you spend a dollar.
            </p>
          </div>
          <button onClick={onViability} style={{
            flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'transparent', border: '1px solid rgba(245,242,237,0.12)',
            color: 'rgba(245,242,237,0.7)', fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', fontWeight: 500, padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
            transition: 'all 200ms ease',
          }}>
            Run your numbers →
          </button>
        </div>
      </section>

      {/* ═══════════ TAGLINE ROW ═══════════ */}
      <section style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
        <div className="lp1-tagline-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '0 48px', maxWidth: '1280px', margin: '0 auto' }}>
          {['Every manager you need', 'None of the politics', 'Built for Australian hospitality', 'Your business, fully in view'].map((text, i) => (
            <div key={i} style={{
              padding: '18px 0', display: 'flex', alignItems: 'center', gap: '10px',
              borderRight: i < 3 ? '0.5px solid rgba(255,255,255,0.06)' : 'none',
              paddingLeft: i > 0 ? '20px' : '0',
              paddingRight: i < 3 ? '20px' : '0',
            }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#e8622a', flexShrink: 0 }} />
              <span style={{ fontSize: '11px', color: 'rgba(245,242,237,0.4)', fontWeight: 400 }}>{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ PRICING ═══════════ */}
      <section style={{ padding: '80px 48px', borderTop: '0.5px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 'clamp(26px, 4vw, 34px)', color: '#f5f2ed', margin: '0 0 10px' }}>
              Simple weekly pricing.
            </h2>
            <p style={{ fontSize: '15px', fontWeight: 300, color: 'rgba(245,242,237,0.35)', margin: 0 }}>
              Cancel anytime. No lock-in.
            </p>
          </div>

          <div className="lp1-price-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
            {[
              { name: 'Website Only', sub: 'Single site', price: '$25', unit: '/wk', bullets: ['Your venue online in under an hour', 'Custom domain & synced menu', 'Bookings, events & trading hours'], highlight: false, ctaFilled: false },
              { name: 'Starter', sub: 'Single site', price: '$75', unit: '/wk', bullets: ['Any single Virtual Manager', 'Full access to all their tools', 'Unlimited users'], highlight: false, ctaFilled: false },
              { name: 'Grow', sub: 'Single site', price: '$250', unit: '/wk', bullets: ['Every Virtual Manager', 'Sales, Ops, Finance, Marketing', 'Priority support'], highlight: true, badge: 'Most popular', ctaFilled: true },
              { name: 'Scale', sub: 'Multi-site', price: '$450', unit: '/wk', subline: '+ $10/wk per additional site', bullets: ['Everything in Grow', 'Up to 20 locations', 'Group-level reporting'], highlight: false, ctaFilled: false },
              { name: 'Enterprise', sub: '20+ locations', price: "Let's talk.", unit: '', bullets: ['Custom pricing', 'Dedicated onboarding', 'SLA & support agreements'], highlight: false, ctaFilled: false, isEnterprise: true },
            ].map((plan) => (
              <div key={plan.name} style={{
                background: plan.highlight ? 'rgba(232,98,42,0.04)' : 'rgba(255,255,255,0.02)',
                border: `0.5px solid ${plan.highlight ? 'rgba(232,98,42,0.25)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '16px', padding: '24px 20px',
                display: 'flex', flexDirection: 'column', textAlign: 'center',
                position: 'relative',
              }}>
                {plan.badge && (
                  <div style={{
                    position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
                    background: '#e8622a', color: 'white', fontSize: '8px', fontWeight: 600,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    padding: '3px 10px', borderRadius: '5px', whiteSpace: 'nowrap',
                  }}>
                    {plan.badge}
                  </div>
                )}
                <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '16px', color: '#f5f2ed', margin: '0 0 3px' }}>{plan.name}</p>
                <p style={{ fontWeight: 300, fontSize: '12px', color: 'rgba(245,242,237,0.3)', margin: '0 0 16px' }}>{plan.sub}</p>
                <div style={{ height: '44px', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '3px' }}>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: plan.isEnterprise ? '17px' : '28px', color: plan.highlight ? '#e8622a' : '#f5f2ed' }}>{plan.price}</span>
                  {plan.unit && <span style={{ fontWeight: 300, fontSize: '12px', color: 'rgba(245,242,237,0.25)' }}>{plan.unit}</span>}
                </div>
                {plan.subline ? (
                  <p style={{ fontWeight: 300, fontSize: '10px', color: 'rgba(245,242,237,0.2)', margin: '0 0 16px', textAlign: 'center' }}>{plan.subline}</p>
                ) : (
                  <div style={{ height: '0', marginBottom: '16px' }} />
                )}
                <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '16px' }} />
                <ul style={{ margin: '0 0 20px', padding: 0, listStyle: 'none', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {plan.bullets.map(b => (
                    <li key={b} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', fontWeight: 400, color: 'rgba(245,242,237,0.4)' }}>
                      <Check size={10} color="#e8622a" style={{ flexShrink: 0 }} />{b}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={plan.isEnterprise ? () => onNavigate('reach-out') : onLaunch}
                  style={{
                    width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center',
                    padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 500,
                    transition: 'all 200ms ease',
                    ...(plan.ctaFilled
                      ? { background: '#e8622a', color: 'white', border: 'none' }
                      : { background: 'transparent', color: 'rgba(245,242,237,0.7)', border: '1px solid rgba(245,242,237,0.12)' }),
                  }}
                >
                  {plan.isEnterprise ? 'Contact us' : 'Get started'}
                </button>
              </div>
            ))}
          </div>

          <p style={{ fontWeight: 300, fontSize: '11px', color: 'rgba(245,242,237,0.18)', textAlign: 'center', marginTop: '20px' }}>
            During beta, all features are free — pricing activates at launch
          </p>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer style={{ background: '#0a0a0a', borderTop: '0.5px solid rgba(255,255,255,0.06)', padding: '24px 48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', maxWidth: '1280px', margin: '0 auto' }}>
          <div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '14px' }}>
              <span style={{ color: '#e8622a' }}>Mojo</span><span style={{ color: '#f5f2ed' }}>360</span>
            </span>
            <p style={{ fontSize: '11px', color: 'rgba(245,242,237,0.2)', margin: '4px 0 0' }}>
              Built for hospitality operators in Australia
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <button onClick={onLaunch} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(245,242,237,0.25)', padding: 0, transition: 'color 200ms' }}>Sign in</button>
            <button onClick={onViability} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(245,242,237,0.25)', padding: 0, transition: 'color 200ms' }}>Business Viability</button>
            <button onClick={() => onNavigate('reach-out')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(245,242,237,0.25)', padding: 0, transition: 'color 200ms' }}>Contact</button>
            <a href="/privacy" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(245,242,237,0.25)', textDecoration: 'none', transition: 'color 200ms' }}>Privacy Policy</a>
            <a href="/terms" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(245,242,237,0.25)', textDecoration: 'none', transition: 'color 200ms' }}>Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
