'use client';
import { useAppStore } from '@/lib/store';

export default function ToastContainer() {
  const { toasts, removeToast } = useAppStore();
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: 'white', border: '1px solid #d0e0e3',
          borderLeft: `4px solid ${t.type === 'error' ? '#EB5D5D' : t.type === 'warning' ? '#F2B84B' : t.type === 'success' ? '#4CAF50' : '#087F8C'}`,
          borderRadius: 6, padding: '11px 14px', minWidth: 300, maxWidth: 360,
          boxShadow: '0 4px 20px rgba(0,0,0,0.11)', animation: 'slideIn 0.3s ease',
          cursor: 'pointer',
        }} onClick={() => removeToast(t.id)}>
          <div style={{ fontFamily: 'var(--font-heading), sans-serif', fontWeight: 700, fontSize: 13, color: '#102A2E', marginBottom: 2 }}>{t.title}</div>
          <div style={{ fontSize: 12, color: '#4a6670', lineHeight: 1.4 }}>{t.body}</div>
        </div>
      ))}
    </div>
  );
}
