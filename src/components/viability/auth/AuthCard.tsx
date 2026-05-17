import type { ReactNode } from 'react';
import { MGlyph } from '@/components/viability/MGlyph';
import { ViabilityFooter } from '@/components/viability/ViabilityFooter';
import { ViabilityHeader } from '@/components/viability/ViabilityHeader';

interface AuthCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="bg-viability-ink text-viability-cream min-h-screen flex flex-col font-sans">
      <ViabilityHeader />

      <main className="flex-1 flex items-center justify-center px-6 py-16 relative">
        {/* Soft green radial wash backdrop */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none"
          style={{
            background:
              'radial-gradient(closest-side, rgba(52,211,153,0.10), rgba(52,211,153,0))',
          }}
          aria-hidden="true"
        />

        {/* Card */}
        <div className="relative z-10 w-full max-w-[440px] bg-viability-ink-2 border border-viability-border rounded-tight p-9 pt-10">
          <div className="flex justify-center">
            <MGlyph size={28} />
          </div>
          <h1 className="font-display font-semibold text-[28px] leading-[1.1] tracking-[-0.015em] text-viability-cream text-center mt-5">
            {title}
          </h1>
          {description && (
            <p className="font-sans text-[14px] text-viability-fg-muted text-center mt-2">
              {description}
            </p>
          )}

          <div className="mt-7">{children}</div>

          {footer && (
            <div className="mt-6 pt-6 border-t border-viability-border text-center text-[13px] text-viability-fg-muted space-y-2">
              {footer}
            </div>
          )}
        </div>
      </main>

      <ViabilityFooter />
    </div>
  );
}
