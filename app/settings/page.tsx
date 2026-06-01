'use client';

import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Volume2, VolumeX, RotateCcw, Sparkles } from 'lucide-react';
import { setMuted, playClick, playFlip } from '@/src/lib/sounds';

interface Settings {
  volume: number;
  muted: boolean;
}

const defaultSettings: Settings = { volume: 0.7, muted: false };

function loadSettings(): Settings {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const saved = localStorage.getItem('arcana-settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

function saveSettings(s: Settings) {
  localStorage.setItem('arcana-settings', JSON.stringify(s));
  setMuted(s.muted);
}

export default function SettingsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    setMuted(s.muted);
    setMounted(true);
  }, []);

  useGSAP(() => {
    if (!containerRef.current) return;

    const sections = containerRef.current.querySelectorAll('.settings-section');
    gsap.fromTo(
      sections,
      { autoAlpha: 0, y: 25 },
      { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.12, ease: 'power3.out' }
    );
  }, { scope: containerRef, dependencies: [mounted] });

  const update = (partial: Partial<Settings>) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    saveSettings(next);
  };

  if (!mounted) return null;

  return (
    <div ref={containerRef} className="relative min-h-screen px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-lg">
        <div className="settings-section mb-8" style={{ opacity: 0, willChange: 'transform' }}>
          <h1 className="font-display-alt text-2xl tracking-[0.15em] text-frost">设置</h1>
          <p className="mt-1 text-sm text-muted">自定义你的体验</p>
        </div>

        {/* 音效设置 */}
        <div className="settings-section glass-panel p-6" style={{ opacity: 0, willChange: 'transform' }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={14} className="text-gold" />
            <h2 className="text-sm font-medium text-frost tracking-wider">音效</h2>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.muted ? <VolumeX size={18} className="text-muted" /> : <Volume2 size={18} className="text-accent" />}
              <div>
                <p className="text-sm text-frost">交互音效</p>
                <p className="text-[11px] text-muted">{settings.muted ? '已静音' : '洗牌 / 翻牌 / 选牌'}</p>
              </div>
            </div>
            <button onClick={() => {
              const newMuted = !settings.muted;
              update({ muted: newMuted });
              if (!newMuted) playClick();
            }} className={`glass-button text-xs ${settings.muted ? 'text-red-400' : ''}`}>
              {settings.muted ? '开启' : '静音'}
            </button>
          </div>

          {/* 恢复默认 */}
          <div className="mt-5 border-t border-white/5 pt-4">
            <button onClick={() => {
              setSettings(defaultSettings);
              saveSettings(defaultSettings);
              playClick();
            }} className="glass-button flex items-center justify-center gap-2 w-full text-xs text-muted hover:text-frost">
              <RotateCcw size={12} />
              恢复默认设置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
