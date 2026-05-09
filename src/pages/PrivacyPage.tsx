const LAST_UPDATED = '6 April 2026';

export default function PrivacyPage() {
  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", color: '#1a1a1a', textAlign: 'left', colorScheme: 'light' }}>
      {/* Google Fonts + dark-mode reset */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;600&display=swap');
        body { background: #ffffff !important; }
      `}</style>

      {/* Top nav */}
      <nav style={{
        borderBottom: '1px solid #f0f0f0',
        padding: '0 2rem',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        background: '#ffffff',
        zIndex: 10,
      }}>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.15rem', color: '#e8622a' }}>
          Mojo 360
        </span>
        <a
          href="/"
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: '#555', textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#1a1a1a')}
          onMouseLeave={e => (e.currentTarget.style.color = '#555')}
        >
          ← Back to app
        </a>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '2.2rem', color: '#1a1a1a', marginBottom: '0.25rem' }}>
          Privacy Policy
        </h1>
        <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '2rem' }}>
          Mojo 360 Pty Ltd — mojo360.com.au &nbsp;·&nbsp; Last updated: {LAST_UPDATED}
        </p>

        <p>
          Mojo 360 Pty Ltd ("Mojo 360", "we", "us", or "our") is committed to protecting the privacy of the businesses
          and individuals who use our platform. This Privacy Policy explains how we collect, use, store, and disclose
          your information when you use Mojo 360 (mojo360.com.au) and related services.
        </p>
        <p>
          By using Mojo 360, you agree to the practices described in this policy. If you do not agree, please do not
          use our platform.
        </p>

        <H2>1. Who We Are</H2>
        <p>
          Mojo 360 Pty Ltd is an Australian company providing a cloud-based business management platform for
          hospitality operators. Our contact details are available at mojo360.com.au/contact.
        </p>

        <H2>2. Information We Collect</H2>

        <H3>2.1 Account Information</H3>
        <p>When you create an account, we collect:</p>
        <Ul items={[
          'Your name and email address',
          'Business name and details',
          'Your chosen subscription plan',
          'Payment information (processed securely by our payment provider — we do not store card details)',
        ]} />

        <H3>2.2 Business Operational Data</H3>
        <p>Data you enter into the platform including:</p>
        <Ul items={[
          'Organisation hierarchy and venue details',
          'Menu items, pricing, and inventory',
          'Cash management records',
          'Budget and forecast data',
          'Sales and performance data',
        ]} />

        <H3>2.3 Google Business Profile Data</H3>
        <p>If you connect your Google Business Profile account to Mojo 360, we collect and store:</p>
        <Ul items={[
          'Your Google account identifier and OAuth access credentials (encrypted)',
          'Your Google Business Profile location identifiers',
          'Customer reviews associated with your business listings (review text, star rating, reviewer name, date)',
          'Review reply history',
          'Your overall star rating and review count',
        ]} />
        <p>
          We access this data only on your behalf, using permissions you explicitly grant during the Google OAuth
          connection process. We do not access any Google data beyond what is necessary to provide the review
          management features you have requested.
        </p>

        <H3>2.4 Usage Data</H3>
        <p>We automatically collect certain technical information including:</p>
        <Ul items={[
          'IP address and device type',
          'Browser type and version',
          'Pages visited and features used within the platform',
          'Session duration and timestamps',
        ]} />

        <H2>3. How We Use Your Information</H2>
        <p>We use the information we collect to:</p>
        <Ul items={[
          'Provide, operate, and improve the Mojo 360 platform',
          'Display your Google reviews within the platform and allow you to respond to them',
          'Generate AI-powered marketing content and suggestions based on your business data',
          'Send you account-related notifications and product updates',
          'Respond to your support requests',
          'Comply with our legal obligations',
        ]} />
        <p>
          We do not use your business data to train AI models for use by other businesses. Your operational data
          belongs to you.
        </p>

        <H2>4. Google Business Profile — Specific Disclosures</H2>
        <p>Our use of data obtained through the Google Business Profile API is limited to the following:</p>
        <Ul items={[
          'Displaying your reviews within your Mojo 360 account',
          'Allowing you to post, edit, and delete replies to your reviews',
          'Calculating reputation metrics (average rating, response rate) for your business dashboard',
          'Generating AI-suggested review replies in your brand tone for your review and approval',
        ]} />
        <p>We do not:</p>
        <Ul items={[
          'Share your Google Business Profile data with third parties for their own purposes',
          'Use your review data to advertise to your customers',
          'Sell or licence your Google data to any party',
          'Retain Google data beyond what is necessary for the features described above',
        ]} />
        <p>
          You can revoke Mojo 360's access to your Google Business Profile at any time by disconnecting the
          integration within the Marketing module settings, or directly via your Google Account security settings
          at myaccount.google.com.
        </p>

        <H2>5. How We Store and Protect Your Data</H2>
        <p>
          Your data is stored on Supabase infrastructure, hosted in data centres compliant with industry security
          standards. We implement the following protections:
        </p>
        <Ul items={[
          'All data transmitted between your browser and our servers is encrypted using TLS',
          'OAuth tokens and sensitive credentials are encrypted at rest',
          'Access to your data is controlled by role-based permissions',
          'We do not store Google OAuth tokens in your browser — all Google API calls are made server-side through our secure Edge Functions',
        ]} />
        <p>
          Our data infrastructure is primarily located in the Asia-Pacific region. By using Mojo 360, you consent
          to your data being stored and processed in this region.
        </p>

        <H2>6. Sharing Your Information</H2>
        <p>We do not sell your personal information. We may share your information with:</p>
        <Ul items={[
          'Service providers who assist us in operating the platform (e.g. Supabase for database hosting, Vercel for application hosting, Anthropic for AI features) — these providers are contractually bound to protect your data',
          'Payment processors for handling subscription billing',
          'Google, as required to operate the Google Business Profile integration you have authorised',
          'Law enforcement or regulatory bodies where required by Australian law',
        ]} />

        <H2>7. Your Rights</H2>
        <p>
          Under the Australian Privacy Act 1988 and the Australian Privacy Principles, you have the right to:
        </p>
        <Ul items={[
          'Access the personal information we hold about you',
          'Request correction of inaccurate information',
          'Request deletion of your data (subject to our legal obligations to retain certain records)',
          'Withdraw consent for data processing where consent is the basis for processing',
          'Revoke third-party integrations (including Google) at any time',
        ]} />
        <p>
          To exercise any of these rights, contact us at{' '}
          <a href="mailto:privacy@mojo360.com.au" style={{ color: '#e8622a' }}>privacy@mojo360.com.au</a>.
        </p>

        <H2>8. Data Retention</H2>
        <p>
          We retain your account data for as long as your account is active. If you close your account, we will
          delete your personal data within 90 days, except where we are required by law to retain it longer.
        </p>
        <p>
          Google Business Profile data (reviews and ratings) cached in our system is deleted when you disconnect
          the Google integration or close your account.
        </p>

        <H2>9. Cookies</H2>
        <p>
          Mojo 360 uses essential cookies to maintain your login session and platform preferences. We do not use
          advertising or tracking cookies.
        </p>

        <H2>10. Third-Party Links</H2>
        <p>
          Our platform may contain links to third-party services. This Privacy Policy does not apply to those
          services and we are not responsible for their privacy practices.
        </p>

        <H2>11. Changes to This Policy</H2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of material changes via email
          or a notice within the platform. Your continued use of Mojo 360 after changes are posted constitutes
          acceptance of the updated policy.
        </p>

        <H2>12. Contact Us</H2>
        <p>For privacy enquiries or to exercise your rights, contact:</p>
        <p>
          <strong>Privacy Officer — Mojo 360 Pty Ltd</strong><br />
          Email: <a href="mailto:privacy@mojo360.com.au" style={{ color: '#e8622a' }}>privacy@mojo360.com.au</a><br />
          Website: mojo360.com.au/contact
        </p>
      </div>
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: "'Syne', sans-serif",
      fontWeight: 700,
      fontSize: '1.25rem',
      color: '#1a1a1a',
      marginTop: '2.5rem',
      marginBottom: '0.75rem',
      borderBottom: '2px solid #f0f0f0',
      paddingBottom: '0.4rem',
    }}>
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      fontFamily: "'DM Sans', sans-serif",
      fontWeight: 600,
      fontSize: '1rem',
      color: '#1a1a1a',
      marginTop: '1.5rem',
      marginBottom: '0.5rem',
    }}>
      {children}
    </h3>
  );
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
      {items.map((item, i) => (
        <li key={i} style={{ marginBottom: '0.5rem', lineHeight: '1.7', color: '#1a1a1a' }}>{item}</li>
      ))}
    </ul>
  );
}
