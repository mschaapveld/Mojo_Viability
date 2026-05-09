export function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#0a0a0a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&display=swap');

        @keyframes mojo-pulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }

        .mojo-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #e8622a;
          animation: mojo-pulse 1.4s ease-in-out infinite;
        }
        .mojo-dot:nth-child(1) { animation-delay: 0s; }
        .mojo-dot:nth-child(2) { animation-delay: 0.2s; }
        .mojo-dot:nth-child(3) { animation-delay: 0.4s; }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: '#e8622a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#ffffff', lineHeight: 1 }}>M</span>
          </div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#f5f2ed' }}>
            <span style={{ color: '#f5f2ed' }}>Mojo</span><span style={{ color: '#e8622a' }}>360</span>
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="mojo-dot" />
          <div className="mojo-dot" />
          <div className="mojo-dot" />
        </div>
      </div>
    </div>
  );
}
