"use client";

import { useState, type CSSProperties, type ReactNode } from "react";

type MobileControlsPaneProps = {
  rootClassName: string;
  panelClassName: string;
  panelStyle?: CSSProperties;
  children: ReactNode;
};

export default function MobileControlsPane({
  rootClassName,
  panelClassName,
  panelStyle,
  children,
}: MobileControlsPaneProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className={rootClassName}>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setIsMinimized((current) => !current)}
          className="pointer-events-auto inline-flex min-h-11 w-full items-center justify-center border border-white/40 bg-black/60 px-3 font-pixel-square text-base uppercase tracking-[0.09em] text-white sm:hidden"
        >
          {isMinimized ? "v controls" : "^ minimize"}
        </button>

        <div className={isMinimized ? "hidden sm:block" : ""}>
          <div className={panelClassName} style={panelStyle}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
