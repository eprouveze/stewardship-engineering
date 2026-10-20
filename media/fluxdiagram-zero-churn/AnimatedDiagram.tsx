import { useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill, Sequence, Easing } from 'remotion';
import React from 'react';

export const AnimatedDiagram: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const sx = width / 1920;
  const sy = height / 1080;
  const S = Math.min(sx, sy);
  const sc = (v: number) => v * S;

  const FLUX = {
    colors: {
      bg: '#0a0d16',
      primary: '#6366f1',
      success: '#10b981',
      accent: '#f59e0b',
      warn: '#ef4444',
      text: '#e2e8f0',
      textMuted: '#64748b',
      surface: '#1e293b',
      card: '#131826',
      cardBorder: '#2d3748',
      cardBorderGreen: '#1f5a43',
    },
    fonts: {
      hero: 64,
      heading: 48,
      subtitle: 26,
      label: 20,
      small: 16,
    },
    timing: {
      fast: 12,
      normal: 20,
      slow: 30,
      stagger: 12,
      hold: 90,
    },
    spring: {
      calm: { damping: 30, stiffness: 80, mass: 1 },
      hero: { damping: 18, stiffness: 100, mass: 0.9 },
      instant: { damping: 200, stiffness: 100 },
    },
    spacing: {
      pad: 20,
      gap: 32,
      margin: 64,
      radius: 14,
      radiusLg: 20,
    },
  } as const;

  // Header Animations
  const headerOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const headerY = interpolate(frame, [0, 20], [-20, 0], { extrapolateRight: 'clamp' });

  // Left Card (The Anti-Pattern)
  const leftCardScale = spring({ frame: frame - 20, fps, config: FLUX.spring.calm });
  const leftCardOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: 'clamp' });

  // Left Bullets
  const l1Opacity = interpolate(frame, [45, 55], [0, 1], { extrapolateRight: 'clamp' });
  const l2Opacity = interpolate(frame, [57, 67], [0, 1], { extrapolateRight: 'clamp' });
  const l3Opacity = interpolate(frame, [69, 79], [0, 1], { extrapolateRight: 'clamp' });

  // Center VS Pill
  const vsScale = spring({ frame: frame - 80, fps, config: FLUX.spring.hero });

  // Right Card (Stewardship Solution)
  const rightCardScale = spring({ frame: frame - 95, fps, config: FLUX.spring.calm });
  const rightCardOpacity = interpolate(frame, [95, 115], [0, 1], { extrapolateRight: 'clamp' });

  // Right Bullets
  const r1Opacity = interpolate(frame, [120, 130], [0, 1], { extrapolateRight: 'clamp' });
  const r2Opacity = interpolate(frame, [132, 142], [0, 1], { extrapolateRight: 'clamp' });
  const r3Opacity = interpolate(frame, [144, 154], [0, 1], { extrapolateRight: 'clamp' });

  // Bottom Footer
  const footerOpacity = interpolate(frame, [160, 180], [0, 1], { extrapolateRight: 'clamp' });
  const footerY = interpolate(frame, [160, 180], [20, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: FLUX.colors.bg, overflow: 'hidden' }}>
      {/* Background Gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(1200px 700px at 50% 18%, #10162a 0%, #0a0d16 60%)',
        }}
      />

      {/* Header */}
      <div
        style={{
          position: 'absolute',
          top: sc(60),
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
        }}
      >
        <div
          style={{
            display: 'inline-block',
            padding: `${sc(6)}px ${sc(18)}px`,
            borderRadius: sc(20),
            backgroundColor: 'rgba(99,102,241,0.15)',
            border: `1px solid ${FLUX.colors.primary}`,
            color: '#818cf8',
            fontSize: sc(FLUX.fonts.small),
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: sc(12),
          }}
        >
          Stewardship Engineering Architecture
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: sc(FLUX.fonts.hero),
            fontWeight: 800,
            color: '#f1f5f9',
            letterSpacing: '-0.02em',
          }}
        >
          Zero-Churn Repository Custody
        </h1>
        <p
          style={{
            margin: `${sc(8)}px 0 0 0`,
            fontSize: sc(FLUX.fonts.subtitle),
            color: FLUX.colors.textMuted,
          }}
        >
          Why autonomous agent fleets must decouple operational telemetry from Git commits
        </p>
      </div>

      {/* Left Column: The Anti-Pattern */}
      <div
        style={{
          position: 'absolute',
          top: sc(270),
          left: sc(120),
          width: sc(780),
          height: sc(570),
          backgroundColor: FLUX.colors.card,
          border: `1px solid ${FLUX.colors.cardBorder}`,
          borderRadius: sc(FLUX.spacing.radiusLg),
          padding: sc(40),
          opacity: leftCardOpacity,
          transform: `scale(${Math.max(0, leftCardScale)})`,
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sc(20) }}>
          <span style={{ fontSize: sc(FLUX.fonts.label), fontWeight: 700, color: FLUX.colors.warn, textTransform: 'uppercase' }}>
            The Anti-Pattern
          </span>
          <span style={{ fontSize: sc(FLUX.fonts.small), color: FLUX.colors.textMuted, backgroundColor: FLUX.colors.surface, padding: `${sc(4)}px ${sc(10)}px`, borderRadius: sc(6) }}>
            Git-as-a-Database
          </span>
        </div>

        <div
          style={{
            backgroundColor: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: sc(FLUX.spacing.radius),
            padding: sc(20),
            marginBottom: sc(24),
          }}
        >
          <div style={{ fontSize: sc(48), fontWeight: 800, color: FLUX.colors.warn, lineHeight: 1 }}>
            ~1,470 <span style={{ fontSize: sc(22), fontWeight: 600, color: '#f87171' }}>commits / day</span>
          </div>
          <div style={{ fontSize: sc(18), color: FLUX.colors.textMuted, marginTop: sc(6) }}>
            5 agents on 5-minute heartbeat loops
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: sc(16) }}>
          <div style={{ opacity: l1Opacity, display: 'flex', gap: sc(12), alignItems: 'center' }}>
            <span style={{ color: FLUX.colors.warn, fontSize: sc(20) }}>✕</span>
            <span style={{ fontSize: sc(FLUX.fonts.label), color: FLUX.colors.text }}>
              <strong style={{ color: '#fff' }}>Git Log Obfuscation:</strong> 99.6% of history is timecards
            </span>
          </div>
          <div style={{ opacity: l2Opacity, display: 'flex', gap: sc(12), alignItems: 'center' }}>
            <span style={{ color: FLUX.colors.warn, fontSize: sc(20) }}>✕</span>
            <span style={{ fontSize: sc(FLUX.fonts.label), color: FLUX.colors.text }}>
              <strong style={{ color: '#fff' }}>Rebase Gridlock:</strong> Constant push rejections across worktrees
            </span>
          </div>
          <div style={{ opacity: l3Opacity, display: 'flex', gap: sc(12), alignItems: 'center' }}>
            <span style={{ color: FLUX.colors.warn, fontSize: sc(20) }}>✕</span>
            <span style={{ fontSize: sc(FLUX.fonts.label), color: FLUX.colors.text }}>
              <strong style={{ color: '#fff' }}>Repository Bloat:</strong> 130,000 synthetic objects / quarter
            </span>
          </div>
        </div>
      </div>

      {/* Center VS Badge */}
      <div
        style={{
          position: 'absolute',
          top: sc(520),
          left: sc(930),
          width: sc(60),
          height: sc(60),
          borderRadius: '50%',
          backgroundColor: FLUX.colors.surface,
          border: `2px solid ${FLUX.colors.cardBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: sc(18),
          fontWeight: 800,
          color: '#cbd5e1',
          transform: `scale(${Math.max(0, vsScale)})`,
          boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
          zIndex: 10,
        }}
      >
        VS
      </div>

      {/* Right Column: Stewardship Solution */}
      <div
        style={{
          position: 'absolute',
          top: sc(270),
          right: sc(120),
          width: sc(780),
          height: sc(570),
          backgroundColor: FLUX.colors.card,
          border: `1px solid ${FLUX.colors.cardBorderGreen}`,
          borderRadius: sc(FLUX.spacing.radiusLg),
          padding: sc(40),
          opacity: rightCardOpacity,
          transform: `scale(${Math.max(0, rightCardScale)})`,
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sc(20) }}>
          <span style={{ fontSize: sc(FLUX.fonts.label), fontWeight: 700, color: FLUX.colors.success, textTransform: 'uppercase' }}>
            Stewardship Custody
          </span>
          <span style={{ fontSize: sc(FLUX.fonts.small), color: FLUX.colors.success, backgroundColor: 'rgba(16,185,129,0.1)', padding: `${sc(4)}px ${sc(10)}px`, borderRadius: sc(6), border: '1px solid rgba(16,185,129,0.3)' }}>
            Out-of-Band Dead-Man
          </span>
        </div>

        <div
          style={{
            backgroundColor: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: sc(FLUX.spacing.radius),
            padding: sc(20),
            marginBottom: sc(24),
          }}
        >
          <div style={{ fontSize: sc(48), fontWeight: 800, color: FLUX.colors.success, lineHeight: 1 }}>
            0 <span style={{ fontSize: sc(22), fontWeight: 600, color: '#34d399' }}>telemetry commits on main</span>
          </div>
          <div style={{ fontSize: sc(18), color: FLUX.colors.textMuted, marginTop: sc(6) }}>
            Clean code assets + 1 daily midnight audit squash
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: sc(16) }}>
          <div style={{ opacity: r1Opacity, display: 'flex', gap: sc(12), alignItems: 'center' }}>
            <span style={{ color: FLUX.colors.success, fontSize: sc(20) }}>✓</span>
            <span style={{ fontSize: sc(FLUX.fonts.label), color: FLUX.colors.text }}>
              <strong style={{ color: '#fff' }}>Edge Ingest:</strong> Lightweight HTTPS to Cloudflare D1 (&lt;30ms)
            </span>
          </div>
          <div style={{ opacity: r2Opacity, display: 'flex', gap: sc(12), alignItems: 'center' }}>
            <span style={{ color: FLUX.colors.success, fontSize: sc(20) }}>✓</span>
            <span style={{ fontSize: sc(FLUX.fonts.label), color: FLUX.colors.text }}>
              <strong style={{ color: '#fff' }}>Atomic CAS:</strong> Race-free state flags via D1 version check
            </span>
          </div>
          <div style={{ opacity: r3Opacity, display: 'flex', gap: sc(12), alignItems: 'center' }}>
            <span style={{ color: FLUX.colors.success, fontSize: sc(20) }}>✓</span>
            <span style={{ fontSize: sc(FLUX.fonts.label), color: FLUX.colors.text }}>
              <strong style={{ color: '#fff' }}>5-Rung Escalation:</strong> On-host auto-repair before paging human
            </span>
          </div>
        </div>
      </div>

      {/* Footer Banner */}
      <div
        style={{
          position: 'absolute',
          bottom: sc(50),
          left: sc(120),
          right: sc(120),
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: sc(FLUX.spacing.radius),
          padding: `${sc(18)}px ${sc(36)}px`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          opacity: footerOpacity,
          transform: `translateY(${footerY}px)`,
          boxShadow: '0 15px 30px rgba(0,0,0,0.4)',
        }}
      >
        <span style={{ fontSize: sc(20), fontWeight: 600, color: '#f8fafc' }}>
          First Law of Stewardship: <span style={{ color: '#38bdf8' }}>A repository is an asset registry, not an operational spool.</span>
        </span>
        <span style={{ fontSize: sc(FLUX.fonts.small), fontWeight: 700, color: '#818cf8', letterSpacing: '0.05em' }}>
          stewardshipengineering.com
        </span>
      </div>
    </AbsoluteFill>
  );
};
