export interface ToastPayload {
  id: number;
  title: string;
  subtitle?: {
    text: string;
    dotColor?: string;
  };
}

export function Toast({ toast }: { toast: ToastPayload | null }) {
  if (!toast) return null;

  return (
    <div className="toast-wrap" role="status" aria-live="polite" data-testid="toast">
      <div className="toast-card">
        <div style={{ fontWeight: 500 }}>{toast.title}</div>
        {toast.subtitle && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 14 }}>
            {toast.subtitle.dotColor && (
              <span className="status-dot" style={{ backgroundColor: toast.subtitle.dotColor }} />
            )}
            <span>{toast.subtitle.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
