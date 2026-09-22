import React from 'react';

interface PulseLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export const PulseLogo: React.FC<PulseLogoProps> = ({
  size = 42,
  className = '',
  animated = true,
}) => {
  return (
    <div
      className={`relative select-none shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          {/* Main tile gradient: Tactical ruby to deep carmine */}
          <linearGradient id="p911-bg-grad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="55%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#9f1239" />
          </linearGradient>

          {/* Specular rim light */}
          <linearGradient id="p911-rim-grad" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
            <stop offset="40%" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
          </linearGradient>

          {/* EKG pulse line gradient: Pure white to luminous amber lightning */}
          <linearGradient id="p911-pulse-grad" x1="8" y1="24" x2="40" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="45%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.85" />
          </linearGradient>

          {/* Glow filter for the cardiac apex */}
          <filter id="p911-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Squircle Chassis */}
        <rect
          x="3"
          y="3"
          width="42"
          height="42"
          rx="12"
          fill="url(#p911-bg-grad)"
        />

        {/* Specular Inner Border */}
        <rect
          x="3.5"
          y="3.5"
          width="41"
          height="41"
          rx="11.5"
          stroke="url(#p911-rim-grad)"
          strokeWidth="1"
          fill="none"
        />

        {/* Faint Medical Cross Watermark in Background */}
        <path
          d="M24 13V35M13 24H35"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeOpacity="0.12"
        />

        {/* The Zero-Latency Cardiac EKG + Lightning Stroke */}
        <path
          d="M8.5 24.5 H 14.5 L 18 19 L 21 28.5 L 25.5 10.5 L 29.5 37.5 L 33 21.5 L 36 24.5 H 39.5"
          stroke="url(#p911-pulse-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Instantaneous Triage Apex Spark (Moss Retrieval Convergence) */}
        <circle
          cx="25.5"
          cy="10.5"
          r="1.8"
          fill="#fef08a"
          filter="url(#p911-glow)"
          className={animated ? 'animate-ping origin-center' : ''}
          style={{ transformOrigin: '25.5px 10.5px' }}
        />
        <circle
          cx="25.5"
          cy="10.5"
          r="1.5"
          fill="#ffffff"
        />
      </svg>
    </div>
  );
};
