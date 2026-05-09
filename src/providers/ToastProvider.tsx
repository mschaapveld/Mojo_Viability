import { Toaster } from 'sonner';
import { ReactNode } from 'react';

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="bottom-right" toastOptions={{ duration: 4000 }} closeButton />
    </>
  );
}
