import { useState, useEffect } from 'react';

type LandingPage = 'home' | 'how-it-works' | 'websites' | 'reach-out';

interface LandingHeaderProps {
  activePage: LandingPage;
  onLaunch: () => void;
  onNavigate: (page: LandingPage) => void;
}

const NAV_LINKS: { label: string; page: LandingPage }[] = [
  { label: 'Home',         page: 'home'         },
  { label: 'How It Works', page: 'how-it-works'  },
  { label: 'Websites',     page: 'websites'      },
  { label: 'Reach Out',    page: 'reach-out'     },
];

export default function LandingHeader({ activePage, onLaunch, onNavigate }: LandingHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <style>{`
        .lh-bar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 50;
          height: 64px; padding: 0 clamp(24px, 4vw, 56px);
          display: flex; align-items: center; justify-content: space-between;
          backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: background 250ms ease, border-color 250ms ease;
        }
        .lh-bar--scrolled {
          background: rgba(8,8,8,0.45) !important;
          border-color: rgba(255,255,255,0.05) !important;
        }
        .lh-logo {
          display: flex; align-items: center; gap: 10px;
          cursor: pointer; text-decoration: none; user-select: none;
        }
        .lh-logo-icon {
          width: 30px; height: 30px; border-radius: 7px; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .lh-logo-icon img { width: 100%; height: 100%; object-fit: cover; }
        .lh-logo-text {
          font-family: 'Syne', sans-serif; font-weight: 800; font-size: 19px;
          line-height: 1; display: flex; align-items: baseline; gap: 0;
        }
        .lh-nav {
          position: absolute; left: 50%; transform: translateX(-50%);
          display: flex; align-items: center; gap: 40px;
        }
        .lh-nav-link {
          background: none; border: none; cursor: pointer; padding: 0;
          font-family: 'DM Sans', sans-serif; font-size: 13.5px;
          transition: color 200ms ease; position: relative;
        }
        .lh-nav-link::after {
          content: ''; position: absolute; bottom: -4px; left: 0; right: 0;
          height: 1.5px; background: #e8622a; border-radius: 1px;
          transform: scaleX(0); transition: transform 250ms ease;
          transform-origin: center;
        }
        .lh-nav-link--active::after { transform: scaleX(1); }
        .lh-cta {
          background: #e8622a; color: white; border: none;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
          padding: 9px 22px; border-radius: 8px; cursor: pointer;
          transition: transform 200ms ease, box-shadow 200ms ease, background 200ms ease;
        }
        .lh-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(232,98,42,0.35);
          background: #d4571f;
        }
      `}</style>

      <header
        className={`lh-bar ${scrolled ? 'lh-bar--scrolled' : ''}`}
        style={{ background: scrolled ? undefined : 'rgba(8,8,8,0.25)' }}
      >
        <div className="lh-logo" onClick={() => onNavigate('home')}>
          <div className="lh-logo-icon">
            <img src="/favicon.png" alt="Mojo 360" />
          </div>
          <div className="lh-logo-text">
            <span style={{ color: '#e8622a' }}>Mojo</span>
            <span style={{ color: '#f5f2ed' }}>360</span>
          </div>
        </div>

        <nav className="lh-nav">
          {NAV_LINKS.map(({ label, page }) => (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={`lh-nav-link ${activePage === page ? 'lh-nav-link--active' : ''}`}
              style={{
                fontWeight: activePage === page ? 500 : 400,
                color: activePage === page ? '#f5f2ed' : 'rgba(245,242,237,0.5)',
              }}
              onMouseEnter={e => { if (activePage !== page) (e.target as HTMLElement).style.color = '#f5f2ed'; }}
              onMouseLeave={e => { if (activePage !== page) (e.target as HTMLElement).style.color = 'rgba(245,242,237,0.5)'; }}
            >
              {label}
            </button>
          ))}
        </nav>

        <button className="lh-cta" onClick={onLaunch}>
          Launch Mojo 360 →
        </button>
      </header>
    </>
  );
}
