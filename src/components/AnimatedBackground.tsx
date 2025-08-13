import React from 'react';




// Expanded SVGs: classic bus, minivan, mini bus, mini van, van, microbus, etc.
const busSvgs = [
  // Classic yellow school bus
  (<svg viewBox="0 0 60 32" fill="none"><rect x="2" y="8" width="56" height="16" rx="6" fill="#FFD600" stroke="#222" strokeWidth="2"/><rect x="10" y="12" width="12" height="8" rx="2" fill="#FFF" stroke="#222" strokeWidth="1.5"/><rect x="26" y="12" width="12" height="8" rx="2" fill="#FFF" stroke="#222" strokeWidth="1.5"/><rect x="42" y="12" width="8" height="8" rx="2" fill="#FFF" stroke="#222" strokeWidth="1.5"/><circle cx="14" cy="26" r="4" fill="#222" /><circle cx="46" cy="26" r="4" fill="#222" /></svg>),
  // Blue minivan
  (<svg viewBox="0 0 60 32" fill="none"><rect x="6" y="14" width="48" height="10" rx="4" fill="#3B82F6" stroke="#222" strokeWidth="2"/><rect x="12" y="16" width="12" height="6" rx="2" fill="#FFF" stroke="#222" strokeWidth="1.2"/><rect x="28" y="16" width="10" height="6" rx="2" fill="#FFF" stroke="#222" strokeWidth="1.2"/><rect x="40" y="16" width="8" height="6" rx="2" fill="#FFF" stroke="#222" strokeWidth="1.2"/><circle cx="16" cy="28" r="3" fill="#222" /><circle cx="44" cy="28" r="3" fill="#222" /></svg>),
  // Orange short bus
  (<svg viewBox="0 0 60 32" fill="none"><rect x="8" y="10" width="44" height="12" rx="5" fill="#FFA726" stroke="#222" strokeWidth="2"/><rect x="14" y="14" width="10" height="6" rx="2" fill="#FFF" stroke="#222" strokeWidth="1.2"/><rect x="28" y="14" width="8" height="6" rx="2" fill="#FFF" stroke="#222" strokeWidth="1.2"/><rect x="38" y="14" width="6" height="6" rx="2" fill="#FFF" stroke="#222" strokeWidth="1.2"/><circle cx="18" cy="24" r="3" fill="#222" /><circle cx="42" cy="24" r="3" fill="#222" /></svg>),
  // Green van
  (<svg viewBox="0 0 60 32" fill="none"><rect x="10" y="13" width="40" height="9" rx="4" fill="#22C55E" stroke="#222" strokeWidth="2"/><rect x="16" y="15" width="10" height="5" rx="2" fill="#FFF" stroke="#222" strokeWidth="1.1"/><rect x="28" y="15" width="8" height="5" rx="2" fill="#FFF" stroke="#222" strokeWidth="1.1"/><rect x="38" y="15" width="6" height="5" rx="2" fill="#FFF" stroke="#222" strokeWidth="1.1"/><circle cx="20" cy="25" r="2.5" fill="#222" /><circle cx="40" cy="25" r="2.5" fill="#222" /></svg>),
  // Red microbus
  (<svg viewBox="0 0 60 32" fill="none"><rect x="12" y="15" width="36" height="8" rx="4" fill="#EF4444" stroke="#222" strokeWidth="2"/><rect x="18" y="17" width="8" height="4" rx="1.5" fill="#FFF" stroke="#222" strokeWidth="1"/><rect x="28" y="17" width="6" height="4" rx="1.5" fill="#FFF" stroke="#222" strokeWidth="1"/><rect x="36" y="17" width="6" height="4" rx="1.5" fill="#FFF" stroke="#222" strokeWidth="1"/><circle cx="22" cy="25" r="2" fill="#222" /><circle cx="38" cy="25" r="2" fill="#222" /></svg>),
  // Purple mini van
  (<svg viewBox="0 0 60 32" fill="none"><rect x="14" y="16" width="32" height="7" rx="3.5" fill="#A78BFA" stroke="#222" strokeWidth="2"/><rect x="18" y="18" width="8" height="3" rx="1.5" fill="#FFF" stroke="#222" strokeWidth="1"/><rect x="28" y="18" width="6" height="3" rx="1.5" fill="#FFF" stroke="#222" strokeWidth="1"/><rect x="36" y="18" width="6" height="3" rx="1.5" fill="#FFF" stroke="#222" strokeWidth="1"/><circle cx="20" cy="25" r="2" fill="#222" /><circle cx="40" cy="25" r="2" fill="#222" /></svg>),
  // Teal mini bus
  (<svg viewBox="0 0 60 32" fill="none"><rect x="8" y="12" width="44" height="10" rx="4" fill="#06B6D4" stroke="#222" strokeWidth="2"/><rect x="14" y="14" width="10" height="5" rx="2" fill="#FFF" stroke="#222" strokeWidth="1.1"/><rect x="28" y="14" width="8" height="5" rx="2" fill="#FFF" stroke="#222" strokeWidth="1.1"/><rect x="38" y="14" width="6" height="5" rx="2" fill="#FFF" stroke="#222" strokeWidth="1.1"/><circle cx="18" cy="22" r="2.5" fill="#222" /><circle cx="42" cy="22" r="2.5" fill="#222" /></svg>),
];

// Only place buses in corners/edges, not center
const buses = [
  { top: '6%', left: '4%', size: 48, delay: '0s' }, // top-left
  { top: '10%', left: '80%', size: 60, delay: '1.2s' }, // top-right
  { top: '80%', left: '8%', size: 40, delay: '2.1s' }, // bottom-left
  { top: '78%', left: '75%', size: 54, delay: '0.7s' }, // bottom-right
  { top: '50%', left: '2%', size: 36, delay: '1.7s' }, // left edge
  { top: '60%', left: '90%', size: 44, delay: '2.5s' }, // right edge
];

const AnimatedBackground = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    {buses.map((bus, i) => {
      const BusSVG = busSvgs[i % busSvgs.length];
      return (
        <div
          key={i}
          className="absolute animate-bus-pop"
          style={{
            top: bus.top,
            left: bus.left,
            width: bus.size,
            height: bus.size * 0.53,
            opacity: 0.28,
            filter: 'blur(0.5px)',
            animationDelay: bus.delay,
            zIndex: 0,
          } as React.CSSProperties}
        >
          {BusSVG}
        </div>
      );
    })}
    <style>{`
      @keyframes bus-pop {
        0% { opacity: 0.12; transform: scale(0.95); }
        50% { opacity: 0.22; transform: scale(1.05); }
        100% { opacity: 0.12; transform: scale(0.95); }
      }
      .animate-bus-pop {
        animation: bus-pop 4.5s ease-in-out infinite;
      }
    `}</style>
  </div>
);

export default AnimatedBackground;
