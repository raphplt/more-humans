import { useEffect } from 'react';
import { useStore } from '../state/store';
import type { Toast } from '../state/store';

function ToastItem({ toast }: { toast: Toast }) {
  const remove = useStore((s) => s.removeToast);
  useEffect(() => {
    const t = setTimeout(() => remove(toast.key), 3500);
    return () => clearTimeout(t);
  }, [toast.key, remove]);
  return (
    <div className="toast-enter rounded-base border border-accent bg-surface px-4 py-2 text-sm text-fg">
      {toast.text}
    </div>
  );
}

export function Toaster() {
  const toasts = useStore((s) => s.toasts);
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.key} toast={t} />
      ))}
    </div>
  );
}
