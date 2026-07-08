import { useEffect, useState } from 'react';

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 100);
    const t2 = setTimeout(() => setPhase('out'), 2200);
    const t3 = setTimeout(() => onDone(), 2700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #0E0E10 0%, #1a1208 100%)',
        opacity: phase === 'out' ? 0 : 1,
        transition: 'opacity 0.5s ease',
        pointerEvents: phase === 'out' ? 'none' : 'all',
      }}
    >
      {/* Glow ring behind logo */}
      <div
        className="absolute rounded-full"
        style={{
          width: 200,
          height: 200,
          background: 'radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)',
          opacity: phase === 'hold' ? 1 : 0,
          transition: 'opacity 0.6s ease 0.1s',
        }}
      />

      {/* Logo image */}
      <img
        src="/logo.png"
        alt="OrderFlow"
        style={{
          width: 110,
          height: 110,
          borderRadius: 28,
          objectFit: 'contain',
          animation: phase !== 'in' ? 'splash-in 0.55s cubic-bezier(0.34,1.56,0.64,1) both' : undefined,
          opacity: phase === 'in' ? 0 : 1,
          boxShadow: '0 24px 60px rgba(249,115,22,0.25)',
        }}
      />

      {/* Text */}
      <div
        style={{
          marginTop: 24,
          textAlign: 'center',
          opacity: phase === 'hold' ? 1 : 0,
          transform: phase === 'hold' ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.4s ease 0.25s, transform 0.4s ease 0.25s',
        }}
      >
        <p style={{ fontSize: 28, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.5px', margin: 0 }}>
          OrderFlow
        </p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
          Fresh food, made to order
        </p>
      </div>

      {/* Loading bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          width: 80,
          height: 3,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 99,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            background: 'var(--accent)',
            borderRadius: 99,
            width: phase === 'hold' ? '100%' : '0%',
            transition: phase === 'hold' ? 'width 2s linear' : 'none',
          }}
        />
      </div>
    </div>
  );
}
