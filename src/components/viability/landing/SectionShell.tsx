import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionShellProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export function SectionShell({ children, className, id }: SectionShellProps) {
  return (
    <section
      id={id}
      className={cn(
        'w-full',
        'py-9 md:py-[110px]',
        className,
      )}
    >
      <div className="max-w-[1180px] mx-auto px-6 md:px-14">
        {children}
      </div>
    </section>
  );
}
