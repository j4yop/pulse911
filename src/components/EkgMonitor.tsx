import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Activity, Heart, AlertTriangle, ShieldCheck } from 'lucide-react';
import { EmergencyCategory } from '../types';

interface EkgMonitorProps {
  category?: EmergencyCategory;
  cadenceBpm?: number;
  isMetronomeActive?: boolean;
}

export const EkgMonitor: React.FC<EkgMonitorProps> = ({
  category = 'cardiac',
  cadenceBpm,
  isMetronomeActive = false,
}) => {
  const [pulseBeat, setPulseBeat] = useState(false);

  // Compute heart rate and clinical rhythm label based on emergency category
  const bpm = cadenceBpm || (category === 'cardiac' ? 110 : category === 'airway' ? 142 : category === 'anaphylaxis' ? 130 : category === 'stroke' ? 82 : 74);
  const beatIntervalMs = (60 / bpm) * 1000;

  // Flash a beat trigger in sync with the heart rate
  useEffect(() => {
    const timer = setInterval(() => {
      setPulseBeat(true);
      setTimeout(() => setPulseBeat(false), 140);
    }, beatIntervalMs);
    return () => clearInterval(timer);
  }, [beatIntervalMs]);

  // Pacing metadata.
  //
  // This component used to render hardcoded SpO2 and MAP values per protocol
  // ("SpO2 76%", "MAP 42 mmHg") under a "Live Lead II Telemetry" label. There is
  // no monitor and no patient: the input is a voice on a microphone. A
  // dispatcher glancing at this panel was shown invented numbers for a real
  // person, which is the same defect as the fabricated MEDIC-14 dispatch.
  //
  // What remains is honest and still useful: a moving trace that paces
  // compressions, labelled as a pacing visual.
  const rhythmConfig = {
    cardiac: {
      rhythm: 'CARDIAC ARREST PROTOCOL \u2014 CPR PACING',
      color: 'rose',
      status: 'CRITICAL',
    },
    airway: {
      rhythm: 'AIRWAY PROTOCOL \u2014 PACING VISUAL',
      color: 'amber',
      status: 'HYPOXIC',
    },
    stroke: {
      rhythm: 'STROKE PROTOCOL \u2014 PACING VISUAL',
      color: 'indigo',
      status: 'HYPERTENSIVE',
    },
    anaphylaxis: {
      rhythm: 'ANAPHYLAXIS PROTOCOL \u2014 PACING VISUAL',
      color: 'rose',
      status: 'ANAPHYLACTIC',
    },
    cyber_extortion: {
      rhythm: 'SCAM PROTOCOL \u2014 NO PACING',
      color: 'rose',
      status: 'ANOMALY',
    },
    general: {
      rhythm: 'PACING VISUAL \u2014 NO PROTOCOL SELECTED',
      color: 'emerald',
      status: 'STABLE',
    },
    trauma: {
      rhythm: 'TOXICOLOGY PROTOCOL \u2014 PACING VISUAL',
      color: 'rose',
      status: 'SHOCK',
    },
    security: {
      rhythm: 'TOXICOLOGY PROTOCOL \u2014 PACING VISUAL',
      color: 'amber',
      status: 'ELEVATED',
    },
  }[category] || {
    rhythm: 'PACING VISUAL',
    color: 'emerald',
    status: 'READY',
  };

  return (
    <div className="bg-slate-950 text-slate-100 rounded-2xl px-3 py-2 border border-slate-800 shadow-md relative overflow-hidden font-mono">
      {/* Background Oscilloscope Grid */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(16, 185, 129, 0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(16, 185, 129, 0.4) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      />

      {/* Top Telemetry Header */}
      <div className="relative z-10 flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2 text-[10px] tracking-wide">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <motion.div
              animate={{ scale: pulseBeat ? 1.4 : 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  rhythmConfig.color === 'rose'
                    ? 'text-rose-500 fill-rose-500'
                    : rhythmConfig.color === 'amber'
                    ? 'text-amber-500 fill-amber-500'
                    : 'text-emerald-500 fill-emerald-500'
                }`}
              />
            </motion.div>
            <span className="font-extrabold text-white text-xs">{bpm}</span>
            <span className="text-slate-400">BPM</span>
          </div>

          <span className="text-slate-600">|</span>

          <span
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
              rhythmConfig.color === 'rose'
                ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                : rhythmConfig.color === 'amber'
                ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
            }`}
          >
            {rhythmConfig.status}
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-[10px]">
          <span className="text-slate-500">
            No monitor attached &mdash; pacing at {bpm} BPM
          </span>
        </div>
      </div>

      {/* SVG EKG Oscilloscope Waveform */}
      <div className="relative z-10 my-1 h-8 w-full flex items-center justify-center overflow-hidden">
        <svg
          viewBox="0 0 600 60"
          className="w-full h-full preserve-3d"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="ekgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
              <stop offset="70%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="95%" stopColor="#34d399" stopOpacity="1" />
              <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0.3" />
            </linearGradient>

            <linearGradient id="ekgRoseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.1" />
              <stop offset="70%" stopColor="#f43f5e" stopOpacity="0.8" />
              <stop offset="95%" stopColor="#fb7185" stopOpacity="1" />
              <stop offset="100%" stopColor="#fda4af" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* EKG Path: Repeating cardiac cycle */}
          <motion.path
            d="M 0,30 L 40,30 L 50,26 L 58,34 L 64,30 L 80,30 L 88,36 L 94,6 L 102,52 L 108,30 L 120,30 L 132,22 L 144,30 L 190,30 L 200,26 L 208,34 L 214,30 L 230,30 L 238,36 L 244,6 L 252,52 L 258,30 L 270,30 L 282,22 L 294,30 L 340,30 L 350,26 L 358,34 L 364,30 L 380,30 L 388,36 L 394,6 L 402,52 L 408,30 L 420,30 L 432,22 L 444,30 L 490,30 L 500,26 L 508,34 L 514,30 L 530,30 L 538,36 L 544,6 L 552,52 L 558,30 L 570,30 L 582,22 L 600,30"
            fill="none"
            stroke={rhythmConfig.color === 'rose' ? 'url(#ekgRoseGradient)' : 'url(#ekgGradient)'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathOffset: 0 }}
            animate={{ pathOffset: [0, -1] }}
            transition={{
              repeat: Infinity,
              duration: 60 / bpm * 3.5,
              ease: 'linear',
            }}
          />
        </svg>

        {/* Oscilloscope Phosphor Scan Beam */}
        <motion.div
          animate={{ x: ['-10%', '110%'] }}
          transition={{
            repeat: Infinity,
            duration: 60 / bpm * 3.5,
            ease: 'linear',
          }}
          className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
        />
      </div>

      {/* Bottom Telemetry Legend */}
      <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 truncate">
          <Activity className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="text-slate-300 font-semibold truncate">{rhythmConfig.rhythm}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0 font-sans text-[9px]">
          {isMetronomeActive ? (
            <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold animate-pulse">
              110 BPM Metronome Sync
            </span>
          ) : (
            <span className="text-slate-500">Compression pacing visual &mdash; not a patient monitor</span>
          )}
        </div>
      </div>
    </div>
  );
};
