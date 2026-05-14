import type { ReactNode } from "react";
import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

type DailyFrameProps = {
  profile: DailyArtworkProfile;
  children: ReactNode;
};

export function DailyFrame({ profile, children }: DailyFrameProps) {
  return (
    <div className="wws-daily-frame">
      <div className="wws-daily-frame-stamp" aria-hidden>
        <span className="wws-daily-frame-stamp-line">GUEST</span>
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
        <p className="wws-daily-frame-plaque-manifesto">&ldquo;{profile.artist.manifesto}&rdquo;</p>
        <p className="wws-daily-frame-plaque-explanation">{profile.explanation}</p>
        <dl className="wws-daily-frame-plaque-meta">
          <div>
            <dt>Interaction</dt>
            <dd>{profile.interaction}</dd>
          </div>
          <div>
            <dt>Medium</dt>
            <dd>{profile.medium}</dd>
          </div>
          <div>
            <dt>Era</dt>
            <dd>{profile.artist.era}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
