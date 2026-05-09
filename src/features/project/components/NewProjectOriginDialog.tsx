import { useState, useEffect } from 'react';
import { BusinessOrigin } from '@/lib/types/projectTypes';

interface NewProjectOriginDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (origin: BusinessOrigin) => void;
}

export function NewProjectOriginDialog({
  open,
  onClose,
  onConfirm,
}: NewProjectOriginDialogProps) {
  const [origin, setOrigin] = useState<BusinessOrigin>('new');

  useEffect(() => {
    if (!open) {
      setOrigin('new');
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          What kind of opportunity are we assessing?
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          We'll use this to configure your plan and the fitout & financing tools.
        </p>

        <div className="grid grid-cols-1 gap-3 mb-6">
          <SelectableCard
            selected={origin === 'new'}
            onClick={() => setOrigin('new')}
            title="New site or concept"
            subtitle="You're planning a brand new business or opening a new location."
            icon="⚡"
          />
          <SelectableCard
            selected={origin === 'existing'}
            onClick={() => setOrigin('existing')}
            title="Buying an existing business"
            subtitle="You're assessing a business that's already trading."
            icon="🏪"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(origin);
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

interface CardProps {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  icon?: string;
}

function SelectableCard({ selected, onClick, title, subtitle, icon }: CardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
        selected
          ? 'border-blue-500 bg-blue-500 shadow-sm'
          : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
      }`}
    >
      {icon && <span className="mt-0.5 text-2xl">{icon}</span>}
      <div className="flex-1">
        <div className={`text-sm font-semibold mb-1 ${selected ? 'text-white' : 'text-slate-900'}`}>{title}</div>
        <div className={`text-xs leading-relaxed ${selected ? 'text-blue-100' : 'text-slate-600'}`}>{subtitle}</div>
      </div>
    </button>
  );
}
