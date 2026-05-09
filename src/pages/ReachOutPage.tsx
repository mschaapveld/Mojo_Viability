import { useState } from 'react';
import { Loader2, Mail, MapPin, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import LandingHeader from '@/components/LandingHeader';

type LandingNavPage = 'home' | 'how-it-works' | 'websites' | 'reach-out';

interface ReachOutPageProps {
  onLaunch: () => void;
  onNavigate: (page: LandingNavPage) => void;
  onViability: () => void;
}

const VENUE_TYPES = ['Café', 'Restaurant', 'Bar / Pub', 'QSR / Fast Casual', 'Club / Function Centre', 'Multi-site Group', 'Other'];
const LOCATION_COUNTS = ['1', '2–5', '6–20', '20+'];

export default function ReachOutPage({ onLaunch, onNavigate, onViability }: ReachOutPageProps) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', businessName: '', venueType: '', message: '', locationCount: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const set = (f: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm(prev => ({ ...prev, [f]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.message) return;
    setSubmitting(true); setError('');
    try {
      const { error: fnError } = await supabase.functions.invoke('send-contact-email', { body: form });
      if (fnError) throw fnError;
      setSuccess(true);
    } catch { setError('Something went wrong — please email us directly at admin@mojo360.com.au'); }
    finally { setSubmitting(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px', color: '#f5f2ed', padding: '12px 14px',
    fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 400,
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 200ms',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif", fontSize: '10.5px', fontWeight: 500,
    color: 'rgba(245,242,237,0.35)', marginBottom: '7px', display: 'block',
    textTransform: 'uppercase', letterSpacing: '0.1em',
  };

  return (
    <div style={{ background: '#080808', minHeight: '100vh', color: '#f5f2ed', fontFamily: "'DM Sans', sans-serif", overflowX: 'hidden', position: 'relative' }}>
      {/* Grain */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E\")" }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <LandingHeader activePage="reach-out" onLaunch={onLaunch} onNavigate={onNavigate} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '150px clamp(24px, 5vw, 56px) 80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'start' }}>

          {/* ── LEFT ─────────────────────────────────────── */}
          <div>
            <p style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#e8622a', margin: '0 0 18px' }}>Reach out</p>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '38px', lineHeight: 1.08, color: '#f5f2ed', margin: '0 0 18px' }}>
              Let's get your business<br />its <span style={{ color: '#e8622a' }}>Mojo</span> back.
            </h1>
            <p style={{ fontWeight: 300, fontSize: '15px', color: 'rgba(245,242,237,0.45)', lineHeight: 1.7, margin: '0 0 44px' }}>
              Whether you're ready to hire your first Virtual Manager, want a demo,
              or just have questions — we'd love to hear from you.
              We're a small, focused team and we read every message.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {[
                { icon: Mail, text: 'admin@mojo360.com.au' },
                { icon: MapPin, text: 'Built in Australia, for Australian operators' },
                { icon: Clock, text: 'We typically respond within one business day' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(232,98,42,0.08)', border: '1px solid rgba(232,98,42,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={15} color="#e8622a" />
                  </div>
                  <p style={{ fontWeight: 400, fontSize: '14px', color: 'rgba(245,242,237,0.55)', margin: 0, paddingTop: '9px', lineHeight: 1.4 }}>{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT — Form ─────────────────────────────── */}
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '20px', padding: '36px', backdropFilter: 'blur(10px)',
          }}>
            {success ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                  <CheckCircle size={24} color="#34d399" />
                </div>
                <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '20px', color: '#f5f2ed', margin: '0 0 8px' }}>Message sent!</p>
                <p style={{ fontWeight: 300, fontSize: '14px', color: 'rgba(245,242,237,0.45)', margin: 0 }}>We'll be in touch soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>First name</label>
                    <input type="text" value={form.firstName} onChange={set('firstName')} placeholder="Max" style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'rgba(232,98,42,0.4)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                  </div>
                  <div>
                    <label style={labelStyle}>Last name</label>
                    <input type="text" value={form.lastName} onChange={set('lastName')} placeholder="Schaapveld" style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'rgba(232,98,42,0.4)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Email address</label>
                  <input type="email" required value={form.email} onChange={set('email')} placeholder="you@yourvenue.com.au" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'rgba(232,98,42,0.4)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                </div>
                <div>
                  <label style={labelStyle}>Business name</label>
                  <input type="text" value={form.businessName} onChange={set('businessName')} placeholder="Your Venue Group" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'rgba(232,98,42,0.4)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                </div>
                <div>
                  <label style={labelStyle}>What type of venue?</label>
                  <select value={form.venueType} onChange={set('venueType')} style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties}
                    onFocus={e => e.target.style.borderColor = 'rgba(232,98,42,0.4)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}>
                    <option value="" style={{ background: '#141414' }}>Select venue type</option>
                    {VENUE_TYPES.map(t => <option key={t} value={t} style={{ background: '#141414' }}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>How can we help?</label>
                  <textarea required rows={5} value={form.message} onChange={set('message')}
                    placeholder="Tell us about your business and what you're hoping to achieve..."
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                    onFocus={e => e.target.style.borderColor = 'rgba(232,98,42,0.4)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                </div>
                <div>
                  <label style={labelStyle}>How many locations?</label>
                  <select value={form.locationCount} onChange={set('locationCount')} style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties}
                    onFocus={e => e.target.style.borderColor = 'rgba(232,98,42,0.4)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}>
                    <option value="" style={{ background: '#141414' }}>Select</option>
                    {LOCATION_COUNTS.map(c => <option key={c} value={c} style={{ background: '#141414' }}>{c}</option>)}
                  </select>
                </div>
                {error && <p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>{error}</p>}
                <button type="submit" disabled={submitting} style={{
                  width: '100%', background: submitting ? 'rgba(232,98,42,0.5)' : '#e8622a', color: 'white', border: 'none',
                  fontSize: '15px', fontWeight: 500, padding: '14px', borderRadius: '10px',
                  cursor: submitting ? 'not-allowed' : 'pointer', transition: 'all 200ms',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {submitting ? <><Loader2 size={16} style={{ animation: 'ro-spin 1s linear infinite' }} /> Sending...</> : 'Send message →'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────── */}
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '0 clamp(24px, 5vw, 56px)' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <img src="/favicon.png" alt="" style={{ width: '18px', height: '18px', borderRadius: '4px' }} />
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '14px' }}>
                  <span style={{ color: '#e8622a' }}>Mojo</span><span style={{ color: '#f5f2ed' }}>360</span>
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'rgba(245,242,237,0.22)', margin: 0 }}>Built for hospitality operators in Australia</p>
            </div>
            <div style={{ display: 'flex', gap: '24px' }}>
              {([['Sign in', onLaunch], ['Business Viability', onViability], ['Contact', () => onNavigate('reach-out')]] as const).map(([label, handler]) => (
                <button key={label as string} onClick={handler as () => void} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '12px', color: 'rgba(245,242,237,0.25)', transition: 'color 200ms', fontFamily: "'DM Sans', sans-serif" }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.color = 'rgba(245,242,237,0.7)'; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.color = 'rgba(245,242,237,0.25)'; }}
                >{label as string}</button>
              ))}
            </div>
          </div>
        </footer>
      </div>

      <style>{`@keyframes ro-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
