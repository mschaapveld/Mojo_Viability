import { useState, useEffect } from 'react';
import { X, CircleCheck as CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface HospoOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MODULE_OPTIONS = [
  { slug: 'business-viability', label: 'Business Viability' },
  { slug: 'cash-management', label: 'Cash Management' },
  { slug: 'menu-inventory', label: 'Menu & Inventory' },
  { slug: 'org-setup', label: 'Organisation Setup' },
  { slug: 'mojo-websites', label: 'Mojo Websites' },
  { slug: 'budget-forecast', label: 'Budget & Forecast' },
  { slug: 'loyalty-engine', label: 'Loyalty Engine' },
  { slug: 'operational-checklists', label: 'Operational Checklists' },
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#1a1a1a',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#f5f2ed',
  fontSize: '0.88rem',
  fontFamily: 'DM Sans, sans-serif',
  padding: '0.6rem 0.85rem',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

const labelStyle: React.CSSProperties = {
  fontFamily: 'DM Sans, sans-serif',
  fontSize: '0.8rem',
  fontWeight: 500,
  color: 'rgba(245,242,237,0.55)',
  display: 'block',
  marginBottom: '0.35rem',
};

export function HospoOSModal({ isOpen, onClose }: HospoOSModalProps) {
  // Viability is owner-only — users are prospective venues with no
  // business yet. businessId/businessName are always null here.
  // useBusinessContext was stripped during Step 6 port (architectural
  // override consistent with Step 1's AuthProvider strip per
  // app-tsx-anatomy §2.3). Future Mojo 360 use of this modal would
  // re-introduce the hook there or pass the values as props.
  const businessId: string | null = null;
  const businessName: string | null = null;
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bizName, setBizName] = useState('');
  const [venues, setVenues] = useState('1');
  const [useCase, setUseCase] = useState('');
  const [modulesInterested, setModulesInterested] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser({ id: data.user.id, email: data.user.email ?? '' });
        setEmail(data.user.email ?? '');
      }
    });
  }, []);

  useEffect(() => {
    if (businessName) setBizName(businessName);
  }, [businessName]);

  useEffect(() => {
    if (!isOpen) {
      setSuccess(false);
      setError('');
      setFirstName('');
      setLastName('');
      setPhone('');
      setUseCase('');
      setVenues('1');
      setModulesInterested([]);
    }
  }, [isOpen]);

  const toggleModule = (slug: string) => {
    setModulesInterested(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !email.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const { error: dbError } = await supabase.from('hospo_os_waitlist').insert({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        email: email.trim(),
        phone_number: phone.trim() || null,
        business_name: bizName.trim() || null,
        venue_count: parseInt(venues, 10) || null,
        modules_interested: modulesInterested,
        user_id: user?.id ?? null,
        business_id: businessId ?? null,
      });
      if (dbError) throw dbError;
      setSuccess(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#141414',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: '16px',
        padding: '2rem',
        width: '100%',
        maxWidth: '480px',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
      }}>
        <style>{`
          .hospos-input:focus { border-color: rgba(232,98,42,0.5) !important; box-shadow: 0 0 0 3px rgba(232,98,42,0.08); }
        `}</style>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '1.25rem', right: '1.25rem',
            background: 'transparent', border: 'none',
            color: 'rgba(245,242,237,0.35)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0.25rem',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(245,242,237,0.7)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,242,237,0.35)')}
        >
          <X size={18} />
        </button>

        {success ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{
              width: '3.5rem', height: '3.5rem',
              background: 'rgba(42,158,110,0.12)', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}>
              <CheckCircle size={24} color="#2a9e6e" />
            </div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.2rem', fontWeight: 700, color: '#f5f2ed', margin: '0 0 0.5rem' }}>
              You're on the list!
            </h3>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.88rem', color: 'rgba(245,242,237,0.5)', margin: '0 0 1.75rem', lineHeight: 1.6 }}>
              We'll be in touch when Mojo 360 is ready.
            </p>
            <button
              onClick={onClose}
              style={{
                background: '#e8622a', border: 'none', color: 'white',
                fontFamily: 'DM Sans, sans-serif', fontSize: '0.88rem', fontWeight: 600,
                padding: '0.6rem 1.5rem', borderRadius: '8px', cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#d4541f')}
              onMouseLeave={e => (e.currentTarget.style.background = '#e8622a')}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem', paddingRight: '2rem' }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.2rem', fontWeight: 700, color: '#f5f2ed', margin: '0 0 0.35rem' }}>
                Join the Mojo 360 Waitlist
              </h2>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', color: 'rgba(245,242,237,0.45)', margin: 0 }}>
                Be first to know when Mojo 360 launches.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* First Name + Last Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>First Name <span style={{ color: '#e8622a' }}>*</span></label>
                  <input
                    className="hospos-input"
                    type="text"
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="Jane"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Last Name</label>
                  <input
                    className="hospos-input"
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Smith"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={labelStyle}>Email Address <span style={{ color: '#e8622a' }}>*</span></label>
                <input
                  className="hospos-input"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="jane@yourvenue.com"
                  style={inputStyle}
                />
              </div>

              {/* Phone Number */}
              <div>
                <label style={labelStyle}>Phone Number</label>
                <input
                  className="hospos-input"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="04xx xxx xxx"
                  style={inputStyle}
                />
              </div>

              {/* Business Name + Venues */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Business Name</label>
                  <input
                    className="hospos-input"
                    type="text"
                    value={bizName}
                    onChange={e => setBizName(e.target.value)}
                    placeholder="The Corner Bistro"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Number of Venues</label>
                  <input
                    className="hospos-input"
                    type="number"
                    min={1}
                    value={venues}
                    onChange={e => setVenues(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Module checkboxes */}
              <div>
                <label style={{ ...labelStyle, marginBottom: '0.6rem' }}>Which modules are you interested in?</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {MODULE_OPTIONS.map(mod => {
                    const checked = modulesInterested.includes(mod.slug);
                    return (
                      <label
                        key={mod.slug}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.45rem 0.65rem',
                          borderRadius: '8px',
                          background: checked ? 'rgba(232,98,42,0.12)' : '#1a1a1a',
                          border: `1px solid ${checked ? 'rgba(232,98,42,0.4)' : 'rgba(255,255,255,0.08)'}`,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '0.8rem',
                          color: checked ? '#f5f2ed' : 'rgba(245,242,237,0.55)',
                        }}
                      >
                        <div style={{
                          width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                          background: checked ? '#e8622a' : 'transparent',
                          border: `1.5px solid ${checked ? '#e8622a' : 'rgba(255,255,255,0.2)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s',
                        }}>
                          {checked && (
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          )}
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleModule(mod.slug)}
                          style={{ display: 'none' }}
                        />
                        {mod.label}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Use case */}
              <div>
                <label style={labelStyle}>What would you use it for?</label>
                <textarea
                  className="hospos-input"
                  value={useCase}
                  onChange={e => setUseCase(e.target.value)}
                  placeholder="Tell us a bit about your venue and what you need"
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.55 }}
                />
              </div>

              {error && (
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.83rem', color: '#e8622a', margin: 0 }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: submitting ? 'rgba(232,98,42,0.4)' : '#e8622a',
                  border: 'none', color: 'white',
                  fontFamily: 'DM Sans, sans-serif', fontSize: '1rem', fontWeight: 600,
                  padding: '0.9rem 1.5rem', borderRadius: '10px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  marginTop: '0.25rem',
                }}
                onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = '#d4541f'; }}
                onMouseLeave={e => { if (!submitting) e.currentTarget.style.background = submitting ? 'rgba(232,98,42,0.4)' : '#e8622a'; }}
              >
                {submitting ? (
                  <>
                    <div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Submitting…
                  </>
                ) : 'Join Waitlist'}
              </button>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
