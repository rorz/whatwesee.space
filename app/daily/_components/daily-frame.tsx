import type { ReactNode } from "react";
import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

type DailyFrameProps = {
  profile: DailyArtworkProfile;
  children: ReactNode;
};

const RENDER_MODE_LABELS: Record<DailyArtworkProfile["visualBrief"]["renderMode"], string> = {
  "canvas-2d": "Canvas 2D",
  "css-dom": "CSS",
  "html-controls": "HTML",
  "mixed-dom": "Mixed DOM",
  svg: "SVG",
  "text-grid": "Text Grid",
  webgl: "WebGL",
};

function labelFromSlug(value: string): string {
  return value
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function DailyFrame({ profile, children }: DailyFrameProps) {
  return (
    <div className="wws-daily-frame">
      <div className="wws-daily-frame-stamp" aria-hidden>
        <span className="wws-daily-frame-stamp-line">DAILY</span>
        <span className="wws-daily-frame-stamp-date">{profile.date}</span>
      </div>
      <div className="wws-daily-frame-canvas">{children}</div>
      <div className="wws-daily-frame-plaque">
        <p className="wws-daily-frame-plaque-title">{profile.title}</p>
        <p className="wws-daily-frame-plaque-artist">
          {profile.artist.name}
          <span className="wws-daily-frame-plaque-dot" aria-hidden>
            {" · "}
          </span>
          <span className="wws-daily-frame-plaque-hometown">{profile.artist.hometown}</span>
        </p>
        <dl className="wws-daily-frame-plaque-meta">
          <div>
            <dt>Action</dt>
            <dd>{labelFromSlug(profile.visualBrief.interaction)}</dd>
          </div>
          <div>
            <dt>System</dt>
            <dd>{RENDER_MODE_LABELS[profile.visualBrief.renderMode]}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
