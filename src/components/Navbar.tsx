import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Menu,
  X,
  Zap,
  Volume2,
  VolumeX,
  Layers,
  FileText,
  BarChart3,
  Radio,
  Sparkles,
  Heart,
  Baby,
  Brain,
  AlertOctagon,
  ShieldAlert,
  Truck,
  ShieldCheck,
  MoveRight,
  Activity,
  Cpu,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { PulseLogo } from './PulseLogo';
import { cn } from '@/lib/utils';
import { EMERGENCY_SCENARIOS } from '../engine/emergencyProtocols';

interface NavbarProps {
  activeTab: 'overview' | 'console' | 'benchmark' | 'architecture' | 'prd';
  onSelectTab: (tab: 'overview' | 'console' | 'benchmark' | 'architecture' | 'prd') => void;
  latencyMs: number | null;
  engineLabel: string | null;
  isCallActive: boolean;
  audioFeedbackEnabled: boolean;
  onToggleAudioFeedback: () => void;
}

type DesktopMenu = 'features' | 'scenarios' | 'benchmarks' | 'resources' | null;

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  latencyMs,
  engineLabel,
  isCallActive,
  audioFeedbackEnabled,
  onToggleAudioFeedback,
}) => {
  const [openMenu, setOpenMenu] = useState<DesktopMenu>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Close desktop dropdown on outside pointerdown or Escape key
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileOpen]);

  const closeMobile = () => {
    setMobileOpen(false);
    setMobileSection(null);
  };

  const handleNavTab = (tab: 'overview' | 'console' | 'benchmark' | 'architecture' | 'prd') => {
    onSelectTab(tab);
    setOpenMenu(null);
    closeMobile();
  };

  const features = [
    {
      title: 'Moss WASM Engine',
      description: 'Sub-10ms in-process semantic protocol retrieval without external network database overhead.',
      badge: '3.8ms',
      icon: Zap,
      iconColor: 'text-amber-500',
      action: () => handleNavTab('benchmark'),
    },
    {
      title: 'LiveKit Voice Stream',
      description: 'Ultra-low jitter WebRTC audio channel with streaming VAD boundary tokenization.',
      badge: '<300ms',
      icon: Radio,
      iconColor: 'text-rose-600',
      action: () => handleNavTab('architecture'),
    },
    {
      title: 'CAD Paramedic Dispatch',
      description: 'Automatic ALS paramedic rescue unit assignment with dynamic GPS telemetry route tracking.',
      icon: Truck,
      iconColor: 'text-emerald-600',
      action: () => handleNavTab('console'),
    },
    {
      title: 'CPR Cardiac Metronome',
      description: 'Acoustic 110 BPM metronome keeping distressed callers synchronized with AHA compression rates.',
      icon: Heart,
      iconColor: 'text-rose-600',
      action: () => handleNavTab('console'),
    },
    {
      title: 'AHA & CDC Grounding',
      description: 'Deterministic, verified clinical emergency protocols for cardiac, airway, and stroke triage.',
      badge: 'Grounded',
      icon: ShieldCheck,
      iconColor: 'text-blue-600',
      action: () => handleNavTab('prd'),
    },
    {
      title: 'Async Copilot Coach',
      description: 'Background LLM enrichment layer decoupled from the deterministic voice path.',
      icon: Sparkles,
      iconColor: 'text-indigo-600',
      action: () => handleNavTab('console'),
    },
  ];

  const scenarios = [
    {
      title: 'Adult Cardiac Arrest',
      description: 'ESI-1 Immediate Resuscitation • Pulseless V-Tach & 110 BPM CPR instructions.',
      badge: 'ESI-1',
      icon: Heart,
      iconColor: 'text-rose-600',
      action: () => handleNavTab('console'),
    },
    {
      title: 'Pediatric Choking',
      description: 'ESI-1 Immediate Resuscitation • Infant foreign body airway obstruction sequence.',
      badge: 'ESI-1',
      icon: Baby,
      iconColor: 'text-amber-600',
      action: () => handleNavTab('console'),
    },
    {
      title: 'Acute Ischemic Stroke',
      description: 'ESI-2 Emergent • BE-FAST assessment & LVO mobile stroke unit priority dispatch.',
      badge: 'ESI-2',
      icon: Brain,
      iconColor: 'text-indigo-600',
      action: () => handleNavTab('console'),
    },
    {
      title: 'Anaphylactic Shock',
      description: 'ESI-1 Immediate Resuscitation • Severe airway edema & Epinephrine auto-injector guide.',
      badge: 'ESI-1',
      icon: AlertOctagon,
      iconColor: 'text-rose-600',
      action: () => handleNavTab('console'),
    },
    {
      title: 'Digital Arrest Tamper',
      description: 'ESI-2 Emergent • Hostage extortion, physiological distress & telemetry verification.',
      badge: 'ESI-2',
      icon: ShieldAlert,
      iconColor: 'text-purple-600',
      action: () => handleNavTab('console'),
    },
  ];

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-50 w-full border-b border-slate-200/90 bg-white/85 backdrop-blur-xl transition-all font-sans"
      onMouseLeave={() => setOpenMenu(null)}
    >
      <div className="mx-auto max-w-[1700px] px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand & Live Ingestion Status */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            <button
              onClick={() => handleNavTab('overview')}
              className="flex items-center gap-3 text-left cursor-pointer group"
            >
              <PulseLogo size={36} animated={false} />
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-slate-900 font-sans flex items-center leading-none">
                  Pulse<span className="text-rose-600">911</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono tracking-tight mt-0.5 hidden sm:block">
                  Zero-Latency Clinical Triage
                </span>
              </div>
            </button>

            {/* Live Ingestion & AHA Badges */}
            <div className="hidden md:flex items-center gap-2">
              <span className="h-4 w-[1px] bg-slate-200" />
              <div
                className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border transition-all ${
                  isCallActive
                    ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-2xs'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isCallActive ? 'bg-rose-600 animate-pulse' : 'bg-emerald-500'
                  }`}
                />
                <span>{isCallActive ? 'LIVE INGEST' : 'CAD READY'}</span>
              </div>

              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white tracking-wide shadow-2xs">
                MOSS &bull; AHA
              </span>
            </div>
          </div>

          {/* Desktop Mega Menu Navigation Links */}
          <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-1">
            {/* Overview / Story Tab */}
            <button
              onClick={() => handleNavTab('overview')}
              className={cn(
                'px-3.5 py-2 text-sm font-semibold rounded-xl transition-colors cursor-pointer',
                activeTab === 'overview'
                  ? 'bg-rose-50 text-rose-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              )}
            >
              Overview
            </button>

            {/* Features Mega Menu Trigger */}
            <div
              className="relative"
              onMouseEnter={() => setOpenMenu('features')}
            >
              <button
                type="button"
                onClick={() => setOpenMenu(openMenu === 'features' ? null : 'features')}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl transition-colors cursor-pointer',
                  openMenu === 'features'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                )}
              >
                <span>Features</span>
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 opacity-60 transition-transform duration-200',
                    openMenu === 'features' && 'rotate-180'
                  )}
                />
              </button>

              {/* Features Mega Menu Dropdown */}
              {openMenu === 'features' && (
                <div className="absolute left-0 top-full pt-2 z-50 w-[640px] -translate-x-12">
                  <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xl space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {features.map((item) => {
                        const Icon = item.icon;
                        return (
                          <div
                            key={item.title}
                            onClick={item.action}
                            className="group flex items-start gap-3 rounded-xl p-3 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-2xs group-hover:border-slate-300">
                              <Icon className={cn('size-5', item.iconColor)} />
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900">{item.title}</span>
                                {item.badge && (
                                  <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.2 text-[10px] font-bold text-rose-700 font-mono">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-xs text-slate-500 leading-relaxed line-clamp-2">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t border-slate-100 pt-3 px-2 flex items-center justify-between text-xs text-slate-500 font-mono">
                      <span>Powered by Moss (YC F25) in-process WASM runtime</span>
                      <button
                        onClick={() => handleNavTab('benchmark')}
                        className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Latency Shootout</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Emergency Scenarios Mega Menu Trigger */}
            <div
              className="relative"
              onMouseEnter={() => setOpenMenu('scenarios')}
            >
              <button
                type="button"
                onClick={() => setOpenMenu(openMenu === 'scenarios' ? null : 'scenarios')}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl transition-colors cursor-pointer',
                  openMenu === 'scenarios'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                )}
              >
                <span>Scenarios</span>
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 opacity-60 transition-transform duration-200',
                    openMenu === 'scenarios' && 'rotate-180'
                  )}
                />
              </button>

              {/* Scenarios Mega Menu Dropdown */}
              {openMenu === 'scenarios' && (
                <div className="absolute left-0 top-full pt-2 z-50 w-[420px] -translate-x-16">
                  <div className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xl space-y-1">
                    <div className="px-3 py-1.5 text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Quick-Launch Emergency Triage
                    </div>
                    {scenarios.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.title}
                          onClick={item.action}
                          className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-slate-50 transition-colors cursor-pointer group"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-2xs group-hover:border-slate-300">
                            <Icon className={cn('size-4', item.iconColor)} />
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">{item.title}</span>
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                {item.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.description}</p>
                          </div>
                        </div>
                      );
                    })}

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 font-mono mt-2">
                      <span>Clicking any scenario launches the live 911 audio stream into the CAD HUD.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Benchmarks Tab Link */}
            <button
              onClick={() => handleNavTab('benchmark')}
              className={cn(
                'px-3.5 py-2 text-sm font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5',
                activeTab === 'benchmark'
                  ? 'bg-rose-50 text-rose-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              )}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Benchmarks</span>
            </button>

            {/* Architecture Tab Link */}
            <button
              onClick={() => handleNavTab('architecture')}
              className={cn(
                'px-3.5 py-2 text-sm font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5',
                activeTab === 'architecture'
                  ? 'bg-rose-50 text-rose-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              )}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>Architecture</span>
            </button>

            {/* Product Spec Tab Link */}
            <button
              onClick={() => handleNavTab('prd')}
              className={cn(
                'px-3.5 py-2 text-sm font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5',
                activeTab === 'prd'
                  ? 'bg-rose-50 text-rose-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              )}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Product Spec</span>
            </button>
          </nav>

          {/* Right Action Suite: Telemetry Pill, Audio Toggle, Launch CTA */}
          <div className="flex items-center gap-3">
            {/* Live Moss WASM Latency Readout Pill */}
            <div className="hidden sm:flex items-center gap-2 bg-emerald-50/80 border border-emerald-200 px-3 py-1.5 rounded-xl font-mono text-xs shadow-2xs">
              <span className="text-emerald-800 flex items-center gap-1 font-semibold">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                Moss:
              </span>
              <span className="text-emerald-700 font-extrabold tabular-nums">
                {latencyMs != null ? `${latencyMs.toFixed(2)} ms` : '3.80 ms'}
              </span>
              <span className="text-[9px] uppercase px-1.5 py-0.2 bg-emerald-600 text-white rounded font-bold">
                WASM
              </span>
            </div>

            {/* Voice Audio Mute Toggle Button */}
            <button
              onClick={onToggleAudioFeedback}
              title={audioFeedbackEnabled ? 'Mute Voice Agent Audio' : 'Unmute Voice Agent Audio'}
              className={cn(
                'btn-tactile px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all',
                audioFeedbackEnabled
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
              )}
            >
              {audioFeedbackEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-[11px] font-mono hidden md:inline">Voice: ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-mono hidden md:inline">Voice: Muted</span>
                </>
              )}
            </button>

            {/* Primary Action Button: Launch Emergency Console */}
            <button
              onClick={() => handleNavTab('console')}
              className={cn(
                'btn-tactile px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all',
                activeTab === 'console'
                  ? 'bg-rose-600 text-white ring-2 ring-rose-500/30 shadow-md shadow-rose-600/20'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
              )}
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Launch Console</span>
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
              className="flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Backdrop */}
      <div
        aria-hidden={!mobileOpen}
        onClick={closeMobile}
        className={cn(
          'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      />

      {/* Mobile Slide-Over Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-hidden={!mobileOpen}
        aria-label="Mobile navigation"
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white p-6 shadow-2xl transition-transform duration-300 ease-out lg:hidden',
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="mb-6 flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <PulseLogo size={32} animated={false} />
            <span className="text-base font-black text-slate-900">Pulse911</span>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeMobile}
            aria-label="Close navigation menu"
            className="flex size-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav aria-label="Mobile navigation" className="flex-1 overflow-y-auto space-y-4">
          <div className="space-y-1">
            <button
              onClick={() => handleNavTab('overview')}
              className={cn(
                'w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-sm transition-colors cursor-pointer',
                activeTab === 'overview' ? 'bg-rose-50 text-rose-700' : 'text-slate-800 hover:bg-slate-50'
              )}
            >
              Overview & Landing Story
            </button>
            <button
              onClick={() => handleNavTab('console')}
              className={cn(
                'w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-sm transition-colors cursor-pointer flex items-center justify-between',
                activeTab === 'console' ? 'bg-rose-50 text-rose-700' : 'text-slate-800 hover:bg-slate-50'
              )}
            >
              <span>Emergency CAD Console</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                Live Ingest
              </span>
            </button>
            <button
              onClick={() => handleNavTab('benchmark')}
              className={cn(
                'w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-sm transition-colors cursor-pointer',
                activeTab === 'benchmark' ? 'bg-rose-50 text-rose-700' : 'text-slate-800 hover:bg-slate-50'
              )}
            >
              Moss Latency Benchmarks
            </button>
            <button
              onClick={() => handleNavTab('architecture')}
              className={cn(
                'w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-sm transition-colors cursor-pointer',
                activeTab === 'architecture' ? 'bg-rose-50 text-rose-700' : 'text-slate-800 hover:bg-slate-50'
              )}
            >
              Architecture & Critical Path Flow
            </button>
            <button
              onClick={() => handleNavTab('prd')}
              className={cn(
                'w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-sm transition-colors cursor-pointer',
                activeTab === 'prd' ? 'bg-rose-50 text-rose-700' : 'text-slate-800 hover:bg-slate-50'
              )}
            >
              Product Spec (PRD)
            </button>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-2">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block px-2">
              Quick Scenarios
            </span>
            {scenarios.map((scen) => {
              const Icon = scen.icon;
              return (
                <div
                  key={scen.title}
                  onClick={scen.action}
                  className="p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 flex items-center gap-3 cursor-pointer"
                >
                  <Icon className={cn('size-4', scen.iconColor)} />
                  <div className="flex-1 truncate">
                    <span className="text-xs font-bold text-slate-900 block truncate">{scen.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{scen.badge}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 font-mono text-xs">
              <span className="text-slate-400 block text-[10px]">Moss Runtime:</span>
              <span className="font-bold text-emerald-700 block">
                {latencyMs != null ? `${latencyMs.toFixed(2)} ms` : '3.80 ms'} (WASM In-Process)
              </span>
            </div>

            <button
              onClick={() => handleNavTab('console')}
              className="w-full py-3 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Launch Emergency Console</span>
            </button>
          </div>
        </nav>
      </aside>
    </header>
  );
};
