'use client';

import * as React from 'react';
import { Progress, ProgressCircle, ProgressRadial } from '@/components/ui/progress';

export function ProgressDemo() {
  const [progress, setProgress] = React.useState(13);

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full max-w-md space-y-6 p-4 bg-white rounded-2xl border border-slate-200">
      <div>
        <p className="text-xs font-mono font-bold text-slate-500 mb-2">Linear Progress</p>
        <Progress value={progress} />
      </div>

      <div className="flex items-center gap-6">
        <div>
          <p className="text-xs font-mono font-bold text-slate-500 mb-2">Circle Progress</p>
          <ProgressCircle value={progress} size={56} strokeWidth={5}>
            <span className="text-xs font-bold font-mono">{progress}%</span>
          </ProgressCircle>
        </div>

        <div>
          <p className="text-xs font-mono font-bold text-slate-500 mb-2">Radial Progress</p>
          <ProgressRadial value={progress} size={80} strokeWidth={6} showLabel />
        </div>
      </div>
    </div>
  );
}

export default function Component() {
  const [progress, setProgress] = React.useState(13);

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full max-w-md">
      <Progress value={progress} />
    </div>
  );
}
