import { useEffect } from 'react';

interface ShortcutHandlers {
  onSave?: () => void;
  onLoad?: () => void;
  onNew?: () => void;
  onExport?: () => void;
  onHelp?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            handlers.onSave?.();
            break;
          case 'o':
            e.preventDefault();
            handlers.onLoad?.();
            break;
          case 'n':
            e.preventDefault();
            handlers.onNew?.();
            break;
          case 'e':
            e.preventDefault();
            handlers.onExport?.();
            break;
          case '/':
            e.preventDefault();
            handlers.onHelp?.();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
