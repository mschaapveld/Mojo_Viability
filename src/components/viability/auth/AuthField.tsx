interface AuthFieldProps {
  id: string;
  label: string;
  type: 'email' | 'password' | 'text';
  value: string;
  onChange: (next: string) => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  help?: string;
}

export function AuthField({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  required,
  minLength,
  help,
}: AuthFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-viability-green"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        className="bg-[rgba(245,242,237,0.02)] border border-viability-border focus:border-viability-green-line rounded-tight px-[14px] py-[13px] font-sans text-[15px] text-viability-cream font-light transition-colors duration-150 outline-none"
      />
      {help && (
        <span className="font-mono text-[10.5px] text-viability-fg-subtle">
          {help}
        </span>
      )}
    </div>
  );
}
