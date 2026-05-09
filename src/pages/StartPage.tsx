import { BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StartPageProps {
  onGuest: () => void;
  onCreateAccount: () => void;
  onBack?: () => void;
}

export function StartPage({ onGuest, onCreateAccount, onBack }: StartPageProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">

      <div className="text-center mb-10 max-w-[480px]">
        <div
          className="w-10 h-10 rounded-[10px] flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.25)' }}
        >
          <BarChart2 size={20} style={{ color: 'rgba(52,211,153,1)' }} />
        </div>
        <h1 className="font-heading font-bold text-[1.5rem] text-foreground mb-2">
          Business Viability Tool
        </h1>
        <p className="font-sans text-body text-muted-foreground">
          Test whether your business idea stacks up — before you spend a dollar.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[600px] w-full">

        {/* Guest */}
        <button
          onClick={onGuest}
          className={cn(
            'mojo-card text-left flex flex-col gap-3 p-6 cursor-pointer',
            'hover:border-border/80 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-brand/40',
          )}
        >
          <div className="font-heading font-semibold text-[0.95rem] text-foreground">
            Try it now
          </div>
          <div className="font-sans text-caption text-muted-foreground leading-relaxed">
            No sign-up needed. Simple break-even only. Work is not saved.
          </div>
          <div className="font-sans text-caption font-semibold mt-auto" style={{ color: 'rgba(52,211,153,1)' }}>
            Continue as guest →
          </div>
        </button>

        {/* Create account */}
        <button
          onClick={onCreateAccount}
          className={cn(
            'mojo-card text-left flex flex-col gap-3 p-6 cursor-pointer',
            'border-brand/30 hover:border-brand/60 bg-brand/5 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-brand/40',
          )}
        >
          <div className="font-heading font-semibold text-[0.95rem] text-foreground">
            Create a free account
          </div>
          <div className="font-sans text-caption text-muted-foreground leading-relaxed">
            Full tool. Save projects. Export to PDF and Excel. All modules unlocked.
          </div>
          <div className="font-sans text-caption font-semibold text-brand mt-auto">
            Takes 30 seconds →
          </div>
        </button>

      </div>

      {onBack && (
        <button
          onClick={onBack}
          className="mt-8 font-sans text-caption text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back
        </button>
      )}

    </div>
  );
}
