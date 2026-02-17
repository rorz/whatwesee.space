import type { ReactElement } from "react";
import PiecePlaceholder from "../_components/piece-placeholder";
import { getPieceTitle, wrapPiece } from "../_lib/piece-constants";
import { SERVER_TOKEN_POOL } from "../_lib/token-pool";
import EvalsScene from "../_scenes/evals-scene";
import LatentBloomScene from "../_scenes/latent-bloom-scene";
import QuantaScene from "../_scenes/quanta-scene";
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
