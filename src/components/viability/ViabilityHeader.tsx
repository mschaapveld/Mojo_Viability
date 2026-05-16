import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { MGlyph } from './MGlyph';
import { VButton } from './VButton';
import { cn } from '@/lib/utils';

interface ViabilityHeaderProps {
  activePage?: 'home' | 'reach-out';
}

export function ViabilityHeader({ activePage = 'home' }: ViabilityHeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full',
        'flex items-center justify-between',
        'px-6 md:px-14 py-4 md:py-5',
        'transition-[background-color,backdrop-filter,border-color] duration-200',
        scrolled
          ? 'bg-black/45 backdrop-blur-md border-b border-viability-border'
          : 'bg-transparent border-b border-transparent',
      )}
    >
      <button
        type="button"
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-[11px] cursor-pointer"
        aria-label="Mojo Viability home"
      >
        <MGlyph size={26} color="var(--vbr-green)" ink="var(--vbr-ink)" />
        <span
          className="font-display font-bold text-[22px] leading-none"
          style={{ letterSpacing: '-0.02em' }}
        >
          <span className="text-viability-green">Mojo</span>{' '}
          <span className="text-viability-cream">Viability</span>
        </span>
      </button>

      <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-7">
        <button
          type="button"
          onClick={() => navigate('/')}
          className={cn(
            'relative font-sans text-[13.5px] py-1.5 transition-colors',
            activePage === 'home'
              ? 'text-viability-cream'
              : 'text-viability-fg-muted hover:text-viability-cream',
          )}
        >
          Home
          {activePage === 'home' && (
            <span className="absolute left-0 right-0 -bottom-[2px] h-[1.5px] bg-viability-green" />
          )}
        </button>
        <button
          type="button"
          onClick={() => navigate('/reach-out')}
          className={cn(
            'relative font-sans text-[13.5px] py-1.5 transition-colors',
            activePage === 'reach-out'
              ? 'text-viability-cream'
              : 'text-viability-fg-muted hover:text-viability-cream',
          )}
        >
          Reach Out
          {activePage === 'reach-out' && (
            <span className="absolute left-0 right-0 -bottom-[2px] h-[1.5px] bg-viability-green" />
          )}
        </button>
      </nav>

      <div className="flex items-center gap-3">
        {user ? (
          <VButton size="sm" onClick={() => navigate('/projects')}>
            Open Viability →
          </VButton>
        ) : (
          <>
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="font-sans text-[13.5px] text-viability-fg-muted hover:text-viability-cream transition-colors"
            >
              Sign in
            </button>
            <VButton size="sm" onClick={() => navigate('/start')}>
              Try free →
            </VButton>
          </>
        )}
      </div>
    </header>
  );
}
