"use client";
import React, { useRef } from "react";
import { useScroll, useTransform, motion, MotionValue } from "framer-motion";

export const ContainerScroll = ({
  titleComponent,
  children,
  className,
}: {
  titleComponent?: string | React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const scaleDimensions = () => {
    return isMobile ? [0.7, 0.9] : [1.05, 1];
  };

  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div
      className={`h-[46rem] sm:h-[68rem] md:h-[82rem] flex flex-col items-center justify-start relative pt-4 sm:pt-8 md:pt-10 pb-10 sm:pb-20 px-2 md:px-6 ${className || ''}`}
      ref={containerRef}
    >
      <div
        className="py-4 md:py-8 w-full relative"
        style={{
          perspective: "1000px",
        }}
      >
        {titleComponent && <Header translate={translate} titleComponent={titleComponent} />}
        <Card rotate={rotate} translate={translate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  );
};

export const Header = ({ translate, titleComponent }: any) => {
  return (
    <motion.div
      style={{
        translateY: translate,
      }}
      className="div max-w-5xl mx-auto text-center"
    >
      {titleComponent}
    </motion.div>
  );
};

export const Card = ({
  rotate,
  scale,
  translate: _translate,
  children,
  className,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate?: MotionValue<number>;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          "0 0 #00000066, 0 12px 30px #00000055, 0 45px 50px #0000004d, 0 95px 65px #00000033, 0 160px 80px #00000014, 0 240px 95px #00000008, inset 0 1px 1px rgba(255, 255, 255, 0.15)",
      }}
      className={`relative max-w-5xl mt-6 sm:mt-10 md:mt-14 mx-auto h-[26rem] sm:h-[34rem] md:h-[42rem] w-full border-[3.5px] border-neutral-800/90 ring-1 ring-white/[0.08] p-2.5 sm:p-3.5 md:p-4 bg-[#0a0a0c] rounded-[28px] sm:rounded-[32px] shadow-2xl ${className || ''}`}
    >
      {/* Front camera lens / ambient sensor indicator */}
      <div className="absolute top-1 sm:top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-neutral-900 border border-neutral-700/80 flex items-center justify-center pointer-events-none z-20">
        <div className="w-1 h-1 rounded-full bg-[#050507] ring-1 ring-white/10" />
      </div>

      <div className="h-full w-full overflow-hidden rounded-xl sm:rounded-2xl bg-black border border-white/[0.08] shadow-inner relative">
        {children}
      </div>
    </motion.div>
  );
};

export default ContainerScroll;
