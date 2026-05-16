import { useNavigate } from 'react-router-dom';
import { MGlyph } from './MGlyph';
import { Eyebrow } from './Eyebrow';
import { HairlineLabel } from './HairlineLabel';
import { cn } from '@/lib/utils';

interface ViabilityFooterProps {
  showMojo360?: boolean;
}

const linkClass = cn(
  'font-sans text-[13.5px] text-viability-fg-muted',
  'hover:text-viability-cream transition-colors duration-200',
  'text-left',
);

export function ViabilityFooter({ showMojo360 = true }: ViabilityFooterProps) {
  const navigate = useNavigate();

  return (
    <footer className="w-full bg-[#050505] border-t border-viability-border pt-12 md:pt-[72px] pb-9 px-6 md:px-14">
      <div className="max-w-[1180px] mx-auto grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 md:gap-x-14">
        {/* Column 1: Lockup + positioning */}
        <div>
          <div className="inline-flex items-center gap-[11px] mb-4">
            <MGlyph size={24} color="var(--vbr-green)" ink="var(--vbr-ink)" />
            <span
              className="font-display font-bold text-[20px] leading-none"
              style={{ letterSpacing: '-0.02em' }}
            >
              <span className="text-viability-green">Mojo</span>{' '}
              <span className="text-viability-cream">Viability</span>
            </span>
          </div>
          <p className="font-sans text-[13.5px] leading-relaxed text-viability-fg-muted max-w-[320px] m-0">
            Test whether your hospitality idea stacks up — before you sign anything.
          </p>
          {showMojo360 && (
            <a
              href="https://mojo360.com.au"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'mt-6 inline-flex items-center gap-2',
                'rounded-tight border border-m360-orange-line',
                'bg-viability-ink-2',
                'font-sans text-[12.5px] text-m360-orange',
                'hover:bg-viability-ink-3 transition-colors',
              )}
              style={{
                padding: '14px 16px',
                backgroundImage:
                  'linear-gradient(180deg, rgba(232,98,42,0.04), rgba(232,98,42,0))',
              }}
            >
              When you’re trading, Mojo 360 takes over →
            </a>
          )}
        </div>

        {/* Column 2: Product */}
        <div>
          <Eyebrow showDot={false}>Product</Eyebrow>
          <ul className="mt-4 flex flex-col gap-3 list-none p-0">
            <li>
              <button type="button" onClick={() => navigate('/reach-out')} className={linkClass}>
                Reach Out
              </button>
            </li>
          </ul>
        </div>

        {/* Column 3: Legal */}
        <div>
          <Eyebrow showDot={false}>Legal</Eyebrow>
          <ul className="mt-4 flex flex-col gap-3 list-none p-0">
            <li>
              <button type="button" onClick={() => navigate('/privacy')} className={linkClass}>
                Privacy
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate('/terms')} className={linkClass}>
                Terms
              </button>
            </li>
          </ul>
        </div>

        {/* Column 4: Ecosystem */}
        <div>
          <Eyebrow showDot={false}>Ecosystem</Eyebrow>
          <ul className="mt-4 flex flex-col gap-3 list-none p-0">
            <li>
              <a
                href="https://mojo360.com.au"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                Mojo 360 →
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom strip */}
      <div
        className={cn(
          'max-w-[1180px] mx-auto mt-9 pt-6 border-t border-viability-border',
          'flex flex-col md:flex-row md:justify-between md:items-center gap-3',
          'font-mono text-[11px] text-viability-fg-subtle',
        )}
      >
        {/* TODO: confirm ABN with Max */}
        <span>© 2026 Mojo Pty Ltd · ABN ###</span>
        <HairlineLabel>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block w-[6px] h-[6px] rounded-full bg-viability-green" />
            Built in Port Macquarie · NSW
          </span>
        </HairlineLabel>
      </div>
    </footer>
  );
}
