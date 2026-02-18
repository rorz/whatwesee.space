export type RollingShutterFrame = {
  id: string;
  url: string;
  alt: string;
  name: string;
  split: "train" | "validation" | "test";
  rawId: string;
  sourceLabel: string;
  sourceUrl: string;
};
