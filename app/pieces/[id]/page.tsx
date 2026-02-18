import type { ReactElement } from "react";
import PiecePlaceholder from "../_components/piece-placeholder";
import { getPieceTitle, wrapPiece } from "../_lib/piece-constants";
import { SERVER_TOKEN_POOL } from "../_lib/token-pool";
import EvalsScene from "../_scenes/evals-scene";
import HypnogagiaScene from "../_scenes/hypnogagia-scene";
import LatentBloomScene from "../_scenes/latent-bloom-scene";
import PromptCageScene from "../_scenes/prompt-cage-scene";
import PromptFeedScene from "../_scenes/prompt-feed-scene";
import QuantaScene from "../_scenes/quanta-scene";
import RollingShutterScene from "../_scenes/rolling-shutter-scene";
import TokenCeilingScene from "../_scenes/token-ceiling-scene";

type PieceRouteParams = {
  id?: string | string[];
};

type PiecePageProps = {
  params: Promise<PieceRouteParams> | PieceRouteParams;
};

const SCENE_BY_ID: Partial<Record<number, () => ReactElement>> = {
  1: () => <TokenCeilingScene tokenPool={SERVER_TOKEN_POOL} />,
  2: () => <LatentBloomScene />,
  3: () => <EvalsScene />,
  4: () => <QuantaScene />,
  5: () => <RollingShutterScene />,
  6: () => <PromptFeedScene />,
  7: () => <HypnogagiaScene />,
  8: () => <PromptCageScene />,
};

export default async function PiecePage({ params }: PiecePageProps) {
  const resolvedParams = await params;
  const rawId = Array.isArray(resolvedParams.id) ? resolvedParams.id[0] : resolvedParams.id;
  const parsedId = Number(rawId);
  const pieceId = Number.isFinite(parsedId) ? wrapPiece(Math.floor(parsedId)) : 1;

  const renderScene = SCENE_BY_ID[pieceId];
  if (renderScene) {
    return renderScene();
  }

  return <PiecePlaceholder pieceId={pieceId} title={getPieceTitle(pieceId)} />;
}
