import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GuestBannerProps {
  onCreateAccount: () => void;
  onDismiss?: () => void;
}

export function GuestBanner({ onCreateAccount, onDismiss }: GuestBannerProps) {
  return (
    <div style={{
      background: '#ea580c',
      color: '#fff',
      padding: '0.625rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '0.875rem',
      flexShrink: 0,
      gap: '1rem',
    }}>
      <span>
        You're using Mojo 360 as a guest. Your work will be lost when you close this tab.
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        <Button
          size="sm"
          onClick={onCreateAccount}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.6)',
            color: '#fff',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          Create free account →
        </Button>
        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.25rem', display: 'flex' }}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
