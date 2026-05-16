/* Mojo Viability — Reach Out page (desktop + mobile)
 *  Single-purpose contact page. Form + founder card.
 *  Voice: serious, peer-with-experience. No SaaS politeness theatre.
 */

const ROLE_OPTIONS = [
  { value: 'first',     label: 'First venue' },
  { value: 'second',    label: 'Venue #2' },
  { value: 'investor',  label: 'Investor · partner' },
  { value: 'curious',   label: 'Just curious' },
  { value: 'press',     label: 'Press · partnership' },
];

function useReachOutForm() {
  const [form, setForm] = React.useState({ name: '', email: '', role: 'first', message: '' });
  const [status, setStatus] = React.useState('idle'); // 'idle' | 'sending' | 'sent'
  const onField = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const onRole  = (v) => setForm((p) => ({ ...p, role: v }));
  const submit = (e) => {
    e.preventDefault();
    if (status !== 'idle') return;
    setStatus('sending');
    setTimeout(() => setStatus('sent'), 900);
  };
  const reset = () => {
    setForm({ name: '', email: '', role: 'first', message: '' });
    setStatus('idle');
  };
  return { form, status, onField, onRole, submit, reset };
}

/* ─── Desktop ────────────────────────────────────────────────────────── */

function ReachOutDesktop({ showAmber = true, showMojo360Strip = true, showCrossLink = true }) {
  return (
    <div style={{ width: '100%', background: VBR.ink, color: VBR.cream, fontFamily: VBR.fontBody }}>
      <ViabilityHeader/>
      <ReachOutHero showAmber={showAmber}/>
      <ViabilityTicker/>
      {showMojo360Strip && <SectionMojo360/>}
      <ViabilityFooter showCrossLink={showCrossLink}/>
    </div>
  );
}

function ReachOutHero({ showAmber }) {
  const { form, status, onField, onRole, submit, reset } = useReachOutForm();

  return (
    <section style={{ position: 'relative', background: VBR.ink, padding: '96px 56px 112px', overflow: 'hidden' }}>
      <div style={{ maxWidth: VBR.maxw, margin: '0 auto' }}>

        {/* top strip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 38 }}>
          <Eyebrow color={VBR.green}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: VBR.green }}/>
            Mojo Viability · Reach out
          </Eyebrow>
          <HairlineLabel>Port Macquarie · NSW</HairlineLabel>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: VBR.fontDisplay, fontWeight: 600,
          fontSize: 'clamp(56px, 6.4vw, 96px)', lineHeight: 0.96,
          letterSpacing: '-0.035em', margin: 0, color: VBR.cream,
          maxWidth: 820, textWrap: 'balance',
        }}>
          Tell me about<br/>
          <span style={{ fontStyle: 'italic' }}>the venue</span> you're modelling.
        </h1>
        <p style={{
          fontFamily: VBR.fontBody, fontWeight: 300,
          fontSize: 17, lineHeight: 1.6, color: VBR.fgMuted,
          margin: '28px 0 0', maxWidth: 620,
        }}>
          The tool is free and stays free. This page is for everything around it — bugs you've hit,
          modules you'd like added, an investor case you'd like a second pair of eyes on, or you
          just want to test the thinking out loud.
        </p>

        <div style={{
          marginTop: 64,
          display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 56, alignItems: 'flex-start',
        }}>
          {/* Form / sent state */}
          <div style={{
            background: VBR.ink2, border: VBR.hairline, borderRadius: 6,
            padding: '32px 32px 28px',
            position: 'relative', overflow: 'hidden',
          }}>
            <span style={{
              position: 'absolute', top: -1, left: 24, transform: 'translateY(-50%)',
              fontFamily: VBR.fontMono, fontSize: 10.5, letterSpacing: '0.16em',
              textTransform: 'uppercase', background: VBR.ink2, padding: '2px 10px', color: VBR.fgMuted,
            }}>The form</span>

            {status === 'sent'
              ? <SentState onReset={reset} form={form}/>
              : <ContactForm form={form} status={status} onField={onField} onRole={onRole} submit={submit} showAmber={showAmber}/>
            }
          </div>

          {/* Founder card */}
          <FounderCard/>
        </div>
      </div>
    </section>
  );
}

function ContactForm({ form, status, onField, onRole, submit, showAmber }) {
  const submitting = status === 'sending';
  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <FieldRow>
        <Field label="Your name">
          <Input value={form.name} onChange={onField('name')} placeholder="e.g. Sam Nguyen"/>
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={onField('email')} placeholder="your@email.com"/>
        </Field>
      </FieldRow>

      <Field label="Where you're at">
        <RolePills value={form.role} onChange={onRole} showAmber={showAmber}/>
      </Field>

      <Field label="What's on your mind" help="The detail helps. Numbers help even more.">
        <Textarea value={form.message} onChange={onField('message')} rows={6}
          placeholder="e.g. I'm looking at a 60-seat suburban café in Brunswick. The rent feels high and the labour model doesn't quite work. Curious whether you've seen this combination before."/>
      </Field>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18,
        paddingTop: 8,
      }}>
        <div style={{
          fontFamily: VBR.fontMono, fontSize: 11, letterSpacing: '0.06em', color: VBR.fgSubtle,
        }}>
          {submitting ? 'sending…' : 'replies within 2 business days'}
        </div>
        <button type="submit" disabled={submitting} style={{
          fontFamily: VBR.fontBody, fontWeight: 500, fontSize: 14.5,
          padding: '14px 24px', borderRadius: 9999, border: 'none',
          background: submitting ? VBR.greenHover : VBR.green, color: '#062b1d',
          display: 'inline-flex', alignItems: 'center', gap: 8,
          cursor: submitting ? 'wait' : 'pointer',
          opacity: submitting ? 0.85 : 1,
          boxShadow: submitting ? 'none' : '0 4px 14px rgba(52,211,153,0.18)',
          transition: 'background 180ms ease, transform 180ms ease, box-shadow 220ms ease',
        }}
        onMouseEnter={(e) => { if (!submitting) { e.currentTarget.style.background = VBR.greenHover; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(52,211,153,0.30)'; } }}
        onMouseLeave={(e) => { if (!submitting) { e.currentTarget.style.background = VBR.green; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 14px rgba(52,211,153,0.18)'; } }}>
          {submitting ? 'Sending…' : 'Send →'}
        </button>
      </div>
    </form>
  );
}

function SentState({ onReset, form }) {
  return (
    <div style={{ paddingTop: 4, animation: 'reachOutReveal 480ms ease-out both' }}>
      <Eyebrow color={VBR.green} style={{ marginBottom: 16 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: VBR.green }}/>
        Received
      </Eyebrow>
      <h2 style={{
        fontFamily: VBR.fontDisplay, fontWeight: 600, fontSize: 38, lineHeight: 1.05,
        letterSpacing: '-0.025em', margin: '0 0 18px', color: VBR.cream, textWrap: 'balance',
      }}>
        Got it. <span style={{ fontStyle: 'italic' }}>Thanks for writing.</span>
      </h2>
      <p style={{
        fontFamily: VBR.fontBody, fontWeight: 300, fontSize: 16, lineHeight: 1.6,
        color: VBR.fgMuted, margin: '0 0 18px', maxWidth: 480,
      }}>
        Reply within two business days, usually faster.
        {form.email && <> Going to <span style={{ color: VBR.cream }}>{form.email}</span>.</>}
        {' '}If it's urgent, the founder DM on Instagram is faster — <a href="#" style={{ color: VBR.green, textDecoration: 'none', borderBottom: `1px solid ${VBR.greenLine}` }}>@maxschaapveld</a>.
      </p>
      <div style={{
        marginTop: 24, paddingTop: 20, borderTop: VBR.hairline,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href="#" style={{
          fontFamily: VBR.fontBody, fontSize: 13.5, color: VBR.green, textDecoration: 'none',
          borderBottom: `1px solid ${VBR.greenLine}`, paddingBottom: 2,
        }}>Open Viability and start modelling →</a>
        <button onClick={onReset} style={{
          fontFamily: VBR.fontBody, fontSize: 13, color: VBR.fgMuted,
          background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 0',
        }}>Send another note</button>
      </div>
      <style>{`@keyframes reachOutReveal { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}

function Field({ label, help, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 10, fontFamily: VBR.fontBody, flex: 1, minWidth: 0 }}>
      <span style={{
        fontFamily: VBR.fontMono, fontSize: 10.5, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: VBR.green,
      }}>{label}</span>
      {children}
      {help && (
        <span style={{ fontFamily: VBR.fontMono, fontSize: 10.5, color: VBR.fgSubtle, letterSpacing: '0.04em' }}>
          {help}
        </span>
      )}
    </label>
  );
}

function FieldRow({ children }) {
  return <div style={{ display: 'flex', gap: 22 }}>{children}</div>;
}

function Input({ type = 'text', value, onChange, placeholder }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{
        fontFamily: VBR.fontBody, fontSize: 15, fontWeight: 300, color: VBR.cream,
        background: 'rgba(245,242,237,0.02)',
        border: `1px solid ${focus ? VBR.greenLine : VBR.border}`,
        borderRadius: 6, padding: '13px 14px', outline: 'none',
        transition: 'border-color 160ms ease, background 160ms ease',
      }}/>
  );
}

function Textarea({ value, onChange, placeholder, rows = 5 }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{
        fontFamily: VBR.fontBody, fontSize: 15, fontWeight: 300, color: VBR.cream,
        background: 'rgba(245,242,237,0.02)',
        border: `1px solid ${focus ? VBR.greenLine : VBR.border}`,
        borderRadius: 6, padding: '13px 14px', outline: 'none',
        transition: 'border-color 160ms ease, background 160ms ease',
        resize: 'vertical', lineHeight: 1.55, fontFamily: VBR.fontBody,
      }}/>
  );
}

function RolePills({ value, onChange, showAmber }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {ROLE_OPTIONS.map((r) => {
        const active = value === r.value;
        const isStakes = r.value === 'first';
        const activeColor = showAmber && isStakes ? VBR.amber : VBR.green;
        const activeLine  = showAmber && isStakes ? VBR.amberLine : VBR.greenLine;
        const activeSoft  = showAmber && isStakes ? 'rgba(232,180,90,0.16)' : VBR.greenSoft;
        return (
          <button key={r.value} type="button" onClick={() => onChange(r.value)} style={{
            fontFamily: VBR.fontBody, fontSize: 13, fontWeight: active ? 500 : 400,
            color: active ? activeColor : VBR.fgMuted,
            background: active ? activeSoft : 'transparent',
            border: `1px solid ${active ? activeLine : VBR.border}`,
            padding: '9px 14px', borderRadius: 9999, cursor: 'pointer',
            transition: 'background 160ms ease, border-color 160ms ease, color 160ms ease',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: active ? activeColor : VBR.fgFaint,
              transition: 'background 160ms ease',
            }}/>
            {r.label}
          </button>
        );
      })}
    </div>
  );
}

function FounderCard() {
  return (
    <aside style={{
      background: '#0c0c0c', border: VBR.hairline, borderRadius: 6,
      padding: '28px 28px 26px', position: 'relative',
    }}>
      <span style={{
        position: 'absolute', top: -1, left: 24, transform: 'translateY(-50%)',
        fontFamily: VBR.fontMono, fontSize: 10.5, letterSpacing: '0.16em',
        textTransform: 'uppercase', background: '#0c0c0c', padding: '2px 10px', color: VBR.fgMuted,
      }}>Who you'll hear from</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6, marginBottom: 18 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: VBR.greenSoft, border: `1px solid ${VBR.greenLine}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: VBR.fontDisplay, fontWeight: 700, fontSize: 18, color: VBR.green,
        }}>MS</div>
        <div>
          <div style={{ fontFamily: VBR.fontBody, fontSize: 15, color: VBR.cream, fontWeight: 500 }}>
            Max Schaapveld
          </div>
          <div style={{ fontFamily: VBR.fontBody, fontSize: 12.5, color: VBR.fgSubtle, marginTop: 2 }}>
            Built Mojo Viability · Port Macquarie NSW
          </div>
        </div>
      </div>

      <p style={{
        fontFamily: VBR.fontDisplay, fontWeight: 500, fontStyle: 'italic',
        fontSize: 17, lineHeight: 1.4, color: VBR.cream, margin: '0 0 18px',
        letterSpacing: '-0.01em',
      }}>
        "If the numbers don't stack on the page, they won't stack on opening day. I'd rather have an
        uncomfortable conversation with you now than read about your closure on Broadsheet next year."
      </p>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0,
        borderTop: VBR.hairline, paddingTop: 16, marginTop: 4,
      }}>
        {[
          ['Reply window', '< 2 business days'],
          ['Cost of reply', '$0 · still free'],
          ['Best for', 'modelling pain'],
          ['Not for', 'sales pitches'],
        ].map(([h, b], i) => (
          <div key={h} style={{
            padding: '10px 0',
            borderRight: i % 2 === 0 ? VBR.hairline : 'none',
            paddingRight: i % 2 === 0 ? 12 : 0,
            paddingLeft:  i % 2 === 1 ? 12 : 0,
          }}>
            <div style={{ fontFamily: VBR.fontMono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: VBR.fgSubtle, marginBottom: 4 }}>{h}</div>
            <div style={{ fontFamily: VBR.fontBody, fontSize: 13, color: VBR.cream, fontWeight: 400 }}>{b}</div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 18, paddingTop: 16, borderTop: VBR.hairline,
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <a href="mailto:max@mojobusiness.ai" style={{
          fontFamily: VBR.fontMono, fontSize: 12, color: VBR.cream, textDecoration: 'none',
          letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ color: VBR.green }}>✉</span> max@mojobusiness.ai
        </a>
        <a href="#" style={{
          fontFamily: VBR.fontMono, fontSize: 12, color: VBR.cream, textDecoration: 'none',
          letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ color: VBR.green }}>◯</span> @maxschaapveld · IG
        </a>
      </div>
    </aside>
  );
}

/* ─── Mobile ─────────────────────────────────────────────────────────── */

function ReachOutMobile({ showAmber = true, showCrossLink = true }) {
  const { form, status, onField, onRole, submit, reset } = useReachOutForm();
  return (
    <div style={{ width: '100%', background: VBR.ink, color: VBR.cream, fontFamily: VBR.fontBody }}>
      <MobileStatusBar/>
      <MobileHeaderV2/>

      <section style={{ padding: '32px 22px 40px' }}>
        <Eyebrow color={VBR.green} style={{ marginBottom: 16 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: VBR.green }}/>
          Reach out
        </Eyebrow>
        <h1 style={{
          fontFamily: VBR.fontDisplay, fontWeight: 600, fontSize: 38, lineHeight: 0.98,
          letterSpacing: '-0.03em', color: VBR.cream, margin: 0, textWrap: 'balance',
        }}>
          Tell me about<br/>
          <span style={{ fontStyle: 'italic' }}>the venue</span>.
        </h1>
        <p style={{
          fontFamily: VBR.fontBody, fontWeight: 300, fontSize: 14.5, lineHeight: 1.55,
          color: VBR.fgMuted, margin: '18px 0 26px',
        }}>
          Replies within two business days. Free, like everything else.
        </p>

        <div style={{
          background: VBR.ink2, border: VBR.hairline, borderRadius: 6,
          padding: '22px 18px',
        }}>
          {status === 'sent'
            ? <SentState onReset={reset} form={form}/>
            : <ContactForm form={form} status={status} onField={onField} onRole={onRole} submit={submit} showAmber={showAmber}/>
          }
        </div>

        <div style={{ marginTop: 22 }}>
          <FounderCard/>
        </div>
      </section>

      <ViabilityTicker duration={28}/>
      <MobileMojo360Card/>
      <MobileFooterV2 showCrossLink={showCrossLink}/>
    </div>
  );
}

Object.assign(window, { ReachOutDesktop, ReachOutMobile, ReachOutHero, ContactForm, FounderCard, RolePills });
