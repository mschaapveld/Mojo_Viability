const LAST_UPDATED = '6 April 2026';

export default function TermsPage() {
  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", color: '#1a1a1a', textAlign: 'left', colorScheme: 'light' }}>
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
          Terms of Service
        </h1>
        <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '2rem' }}>
          Mojo 360 Pty Ltd — mojo360.com.au &nbsp;·&nbsp; Last updated: {LAST_UPDATED}
        </p>

        <p>
          These Terms of Service ("Terms") govern your access to and use of the Mojo 360 platform (mojo360.com.au)
          operated by Mojo 360 Pty Ltd ("Mojo 360", "we", "us", or "our"). By creating an account or using the
          platform, you agree to be bound by these Terms.
        </p>
        <p>
          If you are using Mojo 360 on behalf of a business, you represent that you have authority to bind that
          business to these Terms.
        </p>

        <H2>1. The Service</H2>
        <p>
          Mojo 360 is a cloud-based business management platform for hospitality operators. It includes modules
          for cash management, menu and inventory, organisation setup, business dashboard, marketing and content
          management, and related tools.
        </p>
        <p>
          We may update, add, or remove features at any time. We will endeavour to give reasonable notice of
          material changes.
        </p>

        <H2>2. Your Account</H2>
        <p>To use Mojo 360 you must:</p>
        <Ul items={[
          'Be at least 18 years of age',
          'Provide accurate and complete registration information',
          'Maintain the security of your account credentials',
          'Notify us immediately of any unauthorised access to your account',
        ]} />
        <p>You are responsible for all activity that occurs under your account.</p>

        <H2>3. Subscription and Billing</H2>
        <p>
          Mojo 360 is offered on a subscription basis. Fees are billed in Australian dollars and are inclusive
          of GST where applicable. You agree to pay all fees associated with your chosen plan.
        </p>
        <p>
          Subscriptions renew automatically unless cancelled before the renewal date. Refunds are not provided
          for partial billing periods except where required by Australian Consumer Law.
        </p>

        <H2>4. Acceptable Use</H2>
        <p>
          You agree to use Mojo 360 only for lawful purposes and in accordance with these Terms. You must not:
        </p>
        <Ul items={[
          'Use the platform for any fraudulent or deceptive purpose',
          'Attempt to gain unauthorised access to any part of the platform or its infrastructure',
          'Upload or transmit malicious code, viruses, or harmful content',
          'Scrape, copy, or reproduce platform content without our written permission',
          'Use the platform in a way that infringes the rights of any third party',
          'Resell or sublicence access to the platform without our written consent',
        ]} />

        <H2>5. Google Business Profile Integration</H2>

        <H3>5.1 Your Authorisation</H3>
        <p>If you connect your Google Business Profile account to Mojo 360, you authorise us to:</p>
        <Ul items={[
          'Access your Google Business Profile data including reviews, ratings, and location information',
          'Post, edit, and delete replies to reviews on your behalf',
          'Retrieve and cache review data for display within your Mojo 360 account',
        ]} />
        <p>
          You retain full ownership of and responsibility for your Google Business Profile. Mojo 360 acts as
          your agent when taking actions on your behalf.
        </p>

        <H3>5.2 Your Responsibilities</H3>
        <p>When using the Google Business Profile integration, you are responsible for:</p>
        <Ul items={[
          'Ensuring that all review replies posted via Mojo 360 comply with Google\'s review policies',
          'Not using the platform to post false, misleading, or spam replies',
          'Not attempting to use the platform to manipulate your Google rating or reviews',
          'Ensuring your use of the integration complies with all applicable laws including Australian Consumer Law',
        ]} />

        <H3>5.3 Compliance with Google Policies</H3>
        <p>
          Your use of the Google Business Profile integration must comply with Google's Terms of Service and
          Google's review policies. Mojo 360 is not responsible for any action Google takes against your listing
          as a result of your use of the integration.
        </p>

        <H3>5.4 Disconnection</H3>
        <p>
          You may disconnect the Google integration at any time via the Marketing module settings. Upon
          disconnection, we will delete your cached Google data within 30 days.
        </p>

        <H2>6. Your Data</H2>
        <p>
          You retain ownership of all data you enter into Mojo 360. By using the platform, you grant us a
          limited licence to store, process, and display your data solely for the purpose of providing the
          service to you.
        </p>
        <p>
          We do not sell your data. Our data practices are described in our{' '}
          <a href="/privacy" style={{ color: '#e8622a' }}>Privacy Policy</a>.
        </p>
        <p>
          You are responsible for the accuracy of the data you enter and for maintaining backups of any data
          critical to your business operations.
        </p>

        <H2>7. AI-Generated Content</H2>
        <p>
          Mojo 360 uses artificial intelligence to generate marketing content, review reply suggestions, and
          business insights. You acknowledge that:
        </p>
        <Ul items={[
          'AI-generated content is a suggestion only — you are responsible for reviewing and approving all content before use or publication',
          'We do not guarantee the accuracy, appropriateness, or fitness for purpose of AI-generated content',
          'You must not use AI-generated review replies to deceive customers or misrepresent your business',
          'You are solely responsible for any content you publish via the platform, including review replies',
        ]} />

        <H2>8. Intellectual Property</H2>
        <p>
          Mojo 360 and its content, features, and functionality are owned by Mojo 360 Pty Ltd and are protected
          by Australian and international intellectual property laws.
        </p>
        <p>
          You may not copy, modify, distribute, or create derivative works based on the Mojo 360 platform
          without our prior written consent.
        </p>
        <p>
          Any feedback or suggestions you provide about the platform may be used by us without obligation to you.
        </p>

        <H2>9. Availability and Support</H2>
        <p>
          We aim to provide a reliable service but do not guarantee uninterrupted access. We may perform
          scheduled or emergency maintenance which may temporarily affect availability. We will endeavour to
          provide advance notice of scheduled maintenance.
        </p>
        <p>
          Support is provided via the channels listed at mojo360.com.au/support. Response times vary by plan.
        </p>

        <H2>10. Limitation of Liability</H2>
        <p>To the maximum extent permitted by law:</p>
        <Ul items={[
          'Mojo 360 is provided "as is" without warranties of any kind',
          'We are not liable for any indirect, incidental, special, or consequential damages arising from your use of the platform',
          'Our total liability to you for any claim arising from these Terms or your use of the platform is limited to the fees you paid in the 12 months preceding the claim',
        ]} />
        <p>
          Nothing in these Terms excludes any rights you have under the Australian Consumer Law that cannot be
          excluded by agreement.
        </p>

        <H2>11. Termination</H2>
        <p>You may terminate your account at any time via the account settings page.</p>
        <p>
          We may suspend or terminate your account if you breach these Terms, fail to pay fees when due, or if
          we are required to do so by law. We will provide notice where reasonably practicable.
        </p>
        <p>
          Upon termination, your access to the platform will cease and your data will be deleted in accordance
          with our Privacy Policy.
        </p>

        <H2>12. Changes to These Terms</H2>
        <p>
          We may update these Terms from time to time. We will notify you of material changes via email or a
          notice within the platform at least 14 days before the changes take effect. Your continued use of
          Mojo 360 after that date constitutes acceptance of the updated Terms.
        </p>

        <H2>13. Governing Law</H2>
        <p>
          These Terms are governed by the laws of New South Wales, Australia. Any disputes arising from these
          Terms will be subject to the exclusive jurisdiction of the courts of New South Wales.
        </p>

        <H2>14. Contact Us</H2>
        <p>For questions about these Terms, contact:</p>
        <p>
          <strong>Mojo 360 Pty Ltd</strong><br />
          Email: <a href="mailto:legal@mojo360.com.au" style={{ color: '#e8622a' }}>legal@mojo360.com.au</a><br />
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
