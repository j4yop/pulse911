import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TopLoaderProps {
  isLoading: boolean;
  activeTab?: string;
}

export const TopLoader: React.FC<TopLoaderProps> = ({ isLoading, activeTab }) => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    let t3: ReturnType<typeof setTimeout>;
    let t4: ReturnType<typeof setTimeout>;

    if (isLoading) {
      setVisible(true);
      setProgress(25);

      t1 = setTimeout(() => setProgress(55), 120);
      t2 = setTimeout(() => setProgress(78), 280);
      t3 = setTimeout(() => setProgress(92), 480);
    } else if (visible) {
      // Operation finished — complete to 100% and gracefully fade out
      setProgress(100);
      t4 = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 350);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isLoading]);

  // Snappy responsive top progress animation on tab navigation
  useEffect(() => {
    if (!activeTab) return;
    setVisible(true);
    setProgress(35);
    const t1 = setTimeout(() => setProgress(80), 80);
    const t2 = setTimeout(() => setProgress(100), 200);
    const t3 = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 450);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [activeTab]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-1 bg-transparent overflow-hidden"
        >
          {/* Progress Indicator Bar */}
          <div
            className="h-full bg-gradient-to-r from-rose-600 via-rose-500 to-amber-400 shadow-[0_0_12px_rgba(244,63,94,0.9)] transition-all ease-out"
            style={{
              width: `${progress}%`,
              transitionDuration: progress === 100 ? '180ms' : '280ms',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TopLoader;
