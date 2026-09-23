import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const popButtonVariants = cva(
  "group relative inline-flex items-center justify-center font-bold uppercase select-none transition-all duration-150 ease-[cubic-bezier(0,0,0.58,1)] cursor-pointer disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Authentic VengeanceUI signature retro 3D pop palette (calibrated for navbar fit)
        default: cn(
          "text-[#382b22] bg-[#fff0f0] border-2 border-[#b18597]",
          "shadow-[0_4px_0_-1px_#f9c4d2,0_4px_0_0_#b18597,0_7px_0_0_#ffe3e2]",
          "hover:bg-[#ffe9e9] hover:translate-y-[1px] hover:shadow-[0_3px_0_-1px_#f9c4d2,0_3px_0_0_#b18597,0_5px_0_0_#ffe3e2]",
          "active:bg-[#ffe9e9] active:translate-y-[4px] active:shadow-none",
          "dark:text-[#382b22] dark:shadow-[0_4px_0_-1px_#f9c4d2,0_4px_0_0_#b18597,0_7px_4px_-1px_rgba(0,0,0,0.25)]",
          "dark:hover:shadow-[0_3px_0_-1px_#f9c4d2,0_3px_0_0_#b18597,0_5px_3px_-1px_rgba(0,0,0,0.25)]",
          "dark:active:shadow-none"
        ),
        // Authentic VengeanceUI full-height pop palette (original raw spec)
        vengence: cn(
          "text-[#382b22] bg-[#fff0f0] border-2 border-[#b18597]",
          "shadow-[0_12px_0_-2px_#f9c4d2,0_12px_0_0_#b18597,0_22px_0_0_#ffe3e2]",
          "hover:bg-[#ffe9e9] hover:translate-y-1 hover:shadow-[0_8px_0_-2px_#f9c4d2,0_8px_0_0_#b18597,0_16px_0_0_#ffe3e2]",
          "active:bg-[#ffe9e9] active:translate-y-3 active:shadow-none",
          "dark:text-[#382b22] dark:shadow-[0_12px_0_-2px_#f9c4d2,0_12px_0_0_#b18597,0_22px_15px_-5px_rgba(0,0,0,0.3)]",
          "dark:hover:shadow-[0_8px_0_-2px_#f9c4d2,0_8px_0_0_#b18597,0_16px_10px_-5px_rgba(0,0,0,0.3)]",
          "dark:active:shadow-none"
        ),
        // Emergency Rose 3D Pop (VengeanceUI pop architecture in emergency clinical rose)
        rose: cn(
          "text-white bg-rose-600 border-2 border-rose-900",
          "shadow-[0_4px_0_-1px_#fb7185,0_4px_0_0_#881337,0_7px_0_0_#fecdd3]",
          "hover:bg-rose-500 hover:translate-y-[1px] hover:shadow-[0_3px_0_-1px_#fb7185,0_3px_0_0_#881337,0_5px_0_0_#fecdd3]",
          "active:bg-rose-700 active:translate-y-[4px] active:shadow-none",
          "dark:shadow-[0_4px_0_-1px_#fb7185,0_4px_0_0_#881337,0_7px_4px_-1px_rgba(0,0,0,0.3)]",
          "dark:hover:shadow-[0_3px_0_-1px_#fb7185,0_3px_0_0_#881337,0_5px_3px_-1px_rgba(0,0,0,0.3)]",
          "dark:active:shadow-none"
        ),
        // Tactical clinical dark pop
        dark: cn(
          "text-white bg-slate-900 border-2 border-slate-950",
          "shadow-[0_4px_0_-1px_#475569,0_4px_0_0_#0f172a,0_7px_0_0_#cbd5e1]",
          "hover:bg-slate-800 hover:translate-y-[1px] hover:shadow-[0_3px_0_-1px_#475569,0_3px_0_0_#0f172a,0_5px_0_0_#cbd5e1]",
          "active:bg-slate-950 active:translate-y-[4px] active:shadow-none"
        ),
      },
      size: {
        default: "px-4 py-1.5 rounded-xl text-xs tracking-wider gap-2",
        sm: "px-3.5 py-1 rounded-lg text-[11px] tracking-wider gap-1.5",
        md: "px-5 py-2.5 rounded-xl text-xs tracking-wider gap-2",
        lg: "px-8 py-5 rounded-xl text-sm tracking-wider gap-2.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface PopButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof popButtonVariants> {
  asChild?: boolean;
}

export const PopButton = React.forwardRef<HTMLButtonElement, PopButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(popButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);

PopButton.displayName = "PopButton";

export default PopButton;
