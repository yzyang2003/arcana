'use client';

import React from 'react';

interface CardBackProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  minimal?: boolean;
  parallax?: boolean; // Mouse-following holographic tilt
}

const sizeMap = {
  sm: { width: 120, height: 180 },
  md: { width: 180, height: 270 },
  lg: { width: 240, height: 360 },
};

// Helper to generate dots on a circle
function ringDots(cx: number, cy: number, radius: number, count: number, dotR: number) {
  const dots: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    dots.push(
      <circle key={`dot-${radius}-${i}`} cx={x} cy={y} r={dotR} fill="#D4AF37" opacity={0.7} />
    );
  }
  return dots;
}

// Corner flourish: geometric lines + diamond
function CornerFlourish({
  x,
  y,
  rotate,
}: {
  x: number;
  y: number;
  rotate: number;
}) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rotate})`}>
      {/* Diamond */}
      <polygon points="0,-8 6,0 0,8 -6,0" fill="#D4AF37" opacity={0.8} />
      {/* Lines radiating outward */}
      <line x1={0} y1={-10} x2={0} y2={-30} stroke="#9B8CFF" strokeWidth={1} opacity={0.5} />
      <line x1={7} y1={-7} x2={20} y2={-20} stroke="#9B8CFF" strokeWidth={0.75} opacity={0.4} />
      <line x1={-7} y1={-7} x2={-20} y2={-20} stroke="#9B8CFF" strokeWidth={0.75} opacity={0.4} />
      {/* Small crossbar */}
      <line x1={-4} y1={-22} x2={4} y2={-22} stroke="#D4AF37" strokeWidth={0.75} opacity={0.6} />
      <line x1={-12} y1={-14} x2={-8} y2={-18} stroke="#D4AF37" strokeWidth={0.5} opacity={0.4} />
      <line x1={12} y1={-14} x2={8} y2={-18} stroke="#D4AF37" strokeWidth={0.5} opacity={0.4} />
    </g>
  );
}

export default function CardBack({ className = '', size = 'md', animated = true, minimal = false, parallax = false }: CardBackProps) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const holoRef = React.useRef<HTMLDivElement>(null);

  // Holographic refraction — ambient slow rotation when not minimal
  React.useEffect(() => {
    if (minimal || !holoRef.current) return;
    // Slow continuous rotation for ambient holo effect
    const el = holoRef.current;
    let angle = 0;
    let animId: number;
    const rotate = () => {
      angle += 0.3; // ~120s per full rotation
      el.style.setProperty('--holo-angle', `${angle}deg`);
      animId = requestAnimationFrame(rotate);
    };
    animId = requestAnimationFrame(rotate);
    return () => cancelAnimationFrame(animId);
  }, [minimal]);
  const uid = React.useId();
  const { width, height } = sizeMap[size];
  const CX = 150; // center X of viewBox
  const CY = 220; // center Y of viewBox

  // 6 concentric circles config
  const concentrics = [
    { r: 35, strokeW: 1.2, opacity: 0.3 },
    { r: 52, strokeW: 0.8, opacity: 0.25 },
    { r: 68, strokeW: 1.5, opacity: 0.35 },
    { r: 85, strokeW: 0.6, opacity: 0.2 },
    { r: 100, strokeW: 1, opacity: 0.3 },
    { r: 115, strokeW: 1.8, opacity: 0.4 },
  ];

  // P1-8: Parallax tilt on mouse
  const handleMouseMove = React.useCallback((e: React.MouseEvent) => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    if (parallax) {
      wrapRef.current.style.transform = `perspective(800px) rotateY(${x * 15}deg) rotateX(${-y * 10}deg)`;
    }
    // Holographic refraction follows mouse X position
    if (holoRef.current && !minimal) {
      const mouseAngle = (x + 0.5) * 360; // 0-360 based on mouse X
      holoRef.current.style.setProperty('--holo-angle', `${mouseAngle}deg`);
    }
  }, [parallax]);

  const handleMouseLeave = React.useCallback(() => {
    if (!wrapRef.current) return;
    wrapRef.current.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg)';
  }, []);

  return (
    <>
      {/* Keyframes injected once via style tag */}
      <style jsx global>{`
        @keyframes card-back-holo-shift {
          0% { background-position: 200% 0%; }
          100% { background-position: -200% 0%; }
        }
        @keyframes card-back-moon-pulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.3; }
        }
        @keyframes card-back-dot-drift {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div
        ref={wrapRef}
        className={`relative inline-block ${className}`}
        style={{ width, height, transition: 'transform 0.15s ease-out', transformStyle: 'preserve-3d' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <svg
          viewBox="0 0 300 440"
          width={width}
          height={height}
          xmlns="http://www.w3.org/2000/svg"
          className="rounded-xl overflow-hidden"
          style={minimal ? undefined : { filter: 'drop-shadow(0 4px 12px rgba(155, 140, 255, 0.2))' }}
        >
          <defs>
            {/* Background gradient: mystic purple → void black */}
            <linearGradient id={`${uid}-bg-grad`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a1035" />
              <stop offset="50%" stopColor="#0d0a1a" />
              <stop offset="100%" stopColor="#050308" />
            </linearGradient>

            {/* Radial vignette */}
            <radialGradient id={`${uid}-vignette`} cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="70%" stopColor="rgba(0,0,0,0.15)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.7)" />
            </radialGradient>

            {/* Holographic shimmer gradient */}
            <linearGradient id={`${uid}-holo-shimmer`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(155,140,255,0)" />
              <stop offset="30%" stopColor="rgba(212,175,55,0.08)" />
              <stop offset="50%" stopColor="rgba(155,140,255,0.12)" />
              <stop offset="70%" stopColor="rgba(212,175,55,0.06)" />
              <stop offset="100%" stopColor="rgba(155,140,255,0)" />
            </linearGradient>

            {/* Moon glow radial */}
            <radialGradient id={`${uid}-moon-glow`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.35} />
              <stop offset="40%" stopColor="#9B8CFF" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#9B8CFF" stopOpacity={0} />
            </radialGradient>

            {/* Mask for crescent moon */}
            <mask id={`${uid}-crescent-mask`}>
              <rect width="300" height="440" fill="black" />
              <circle cx="150" cy="180" r="30" fill="white" />
              <circle cx="162" cy="173" r="26" fill="black" />
            </mask>

            {/* Subtle inner glow for concentric rings */}
            <radialGradient id={`${uid}-ring-glow`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#9B8CFF" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#9B8CFF" stopOpacity={0} />
            </radialGradient>
          </defs>

          {/* === LAYER 1: Background === */}
          <rect width="300" height="440" fill={`url(#${uid}-bg-grad)`} />

          {/* Subtle noise texture via tiny pattern */}
          <rect width="300" height="440" opacity={0.03}>
            <animate attributeName="opacity" values="0.03;0.05;0.03" dur="8s" repeatCount="indefinite" />
          </rect>

          {/* === LAYER 2: Concentric circles === */}
          {!minimal && <circle cx={CX} cy={CY} r="120" fill={`url(#${uid}-ring-glow)`} />}
          {concentrics.map((c, i) => (
            <circle
              key={`concentric-${i}`}
              cx={CX}
              cy={CY}
              r={c.r}
              fill="none"
              stroke="#9B8CFF"
              strokeWidth={c.strokeW}
              opacity={c.opacity}
            />
          ))}

          {/* Cross-hair lines through center */}
          <line x1={CX} y1={CY - 125} x2={CX} y2={CY + 125} stroke="#9B8CFF" strokeWidth={0.4} opacity={0.15} />
          <line x1={CX - 125} y1={CY} x2={CX + 125} y2={CY} stroke="#9B8CFF" strokeWidth={0.4} opacity={0.15} />
          {/* Diagonal lines */}
          <line x1={CX - 88} y1={CY - 88} x2={CX + 88} y2={CY + 88} stroke="#9B8CFF" strokeWidth={0.3} opacity={0.1} />
          <line x1={CX + 88} y1={CY - 88} x2={CX - 88} y2={CY + 88} stroke="#9B8CFF" strokeWidth={0.3} opacity={0.1} />

          {/* === LAYER 3: Three rings of decorative dots === */}
          <g style={animated ? { animation: 'card-back-dot-drift 120s linear infinite' } : undefined}>
            {ringDots(CX, CY, 42, 12, 1.5)}
            {ringDots(CX, CY, 76, 20, 1.2)}
            {ringDots(CX, CY, 108, 28, 0.9)}
          </g>

          {/* === LAYER 4: Crescent moon with glow === */}
          {/* Glow behind */}
          {!minimal && (
            <circle cx="150" cy="180" r="50" fill={`url(#${uid}-moon-glow)`} opacity={0.6}>
              {animated && (
                <animate attributeName="opacity" values="0.4;0.7;0.4" dur="6s" repeatCount="indefinite" />
              )}
            </circle>
          )}

          {/* Crescent shape */}
          <circle cx="150" cy="180" r="30" fill="none" stroke="#D4AF37" strokeWidth={1.2} opacity={0.5} mask={`url(#${uid}-crescent-mask)`} />
          <circle cx="150" cy="180" r="30" fill="#D4AF37" opacity={0.12} mask={`url(#${uid}-crescent-mask)`} />

          {/* Small stars around moon */}
          {[
            { x: 120, y: 155, r: 0.8 },
            { x: 178, y: 160, r: 0.6 },
            { x: 135, y: 205, r: 0.7 },
            { x: 168, y: 200, r: 0.5 },
            { x: 145, y: 148, r: 0.5 },
          ].map((s, i) => (
            <circle
              key={`star-${i}`}
              cx={s.x}
              cy={s.y}
              r={s.r}
              fill="#D4AF37"
              opacity={0.6}
            >
              {animated && (
                <animate
                  attributeName="opacity"
                  values="0.3;0.8;0.3"
                  dur={`${3 + i * 0.7}s`}
                  repeatCount="indefinite"
                />
              )}
            </circle>
          ))}

          {/* === LAYER 5: Corner flourishes === */}
          {/* Top-left */}
          <CornerFlourish x={30} y={35} rotate={0} />
          {/* Top-right */}
          <CornerFlourish x={270} y={35} rotate={0} />
          {/* Bottom-left */}
          <CornerFlourish x={30} y={405} rotate={180} />
          {/* Bottom-right */}
          <CornerFlourish x={270} y={405} rotate={180} />

          {/* Additional inner corner diamonds */}
          {[
            { x: 50, y: 60 },
            { x: 250, y: 60 },
            { x: 50, y: 380 },
            { x: 250, y: 380 },
          ].map((p, i) => (
            <polygon
              key={`inner-diamond-${i}`}
              points={`${p.x},${p.y - 4} ${p.x + 3},${p.y} ${p.x},${p.y + 4} ${p.x - 3},${p.y}`}
              fill="#9B8CFF"
              opacity={0.3}
            />
          ))}

          {/* Decorative border lines near edges */}
          <rect
            x={12}
            y={12}
            width={276}
            height={416}
            rx={8}
            fill="none"
            stroke="#9B8CFF"
            strokeWidth={0.6}
            opacity={0.2}
          />
          <rect
            x={18}
            y={18}
            width={264}
            height={404}
            rx={6}
            fill="none"
            stroke="#D4AF37"
            strokeWidth={0.4}
            opacity={0.15}
          />

          {/* === LAYER 6: ARCANA text === */}
          <text
            x={CX}
            y={45}
            textAnchor="middle"
            fontFamily="'Georgia', 'Times New Roman', serif"
            fontSize={13}
            fill="#D4AF37"
            opacity={0.65}
            letterSpacing="8"
            style={{ fontVariant: 'small-caps' }}
          >
            ARCANA
          </text>

          {/* Bottom decorative line under text */}
          <line x1={110} y1={52} x2={190} y2={52} stroke="#D4AF37" strokeWidth={0.5} opacity={0.3} />

          {/* === LAYER 7: Holographic shimmer overlay === */}
          {!minimal && (
            <>
              <rect
                width="300"
                height="440"
                fill={`url(#${uid}-holo-shimmer)`}
                opacity={0.5}
                style={
                  animated
                    ? {
                        animation: 'card-back-holo-shift 8s ease-in-out infinite',
                        backgroundSize: '200% 200%',
                      }
                    : undefined
                }
              />

              {/* Animated shimmer sweep */}
              {animated && (
                <rect width="300" height="440" fill={`url(#${uid}-holo-shimmer)`} opacity={0.3}>
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    values="-300,0;300,0;-300,0"
                    dur="6s"
                    repeatCount="indefinite"
                  />
                </rect>
              )}
            </>
          )}

          {/* === LAYER 8: Vignette === */}
          <rect width="300" height="440" fill={`url(#${uid}-vignette)`} />

          {/* Outer glow / border highlight */}
          <rect
            x={1}
            y={1}
            width={298}
            height={438}
            rx={10}
            fill="none"
            stroke="rgba(155,140,255,0.15)"
            strokeWidth={1}
          />
        </svg>

        {/* Holographic refraction overlay — conic-gradient that rotates */}
        {!minimal && (
          <div
            ref={holoRef}
            className="absolute inset-0 pointer-events-none rounded-xl"
            style={{
              '--holo-angle': '0deg',
              background: `conic-gradient(
                from var(--holo-angle, 0deg),
                transparent 0%,
                rgba(155,140,255,0.07) 12%,
                transparent 20%,
                rgba(212,175,55,0.05) 35%,
                transparent 45%,
                rgba(255,100,200,0.04) 60%,
                transparent 70%,
                rgba(100,200,255,0.05) 85%,
                transparent 100%
              )`,
              mixBlendMode: 'screen',
              opacity: 0.8,
            } as React.CSSProperties}
          />
        )}
      </div>
    </>
  );
}
