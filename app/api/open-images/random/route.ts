import { NextResponse } from "next/server";
import { getRollingShutterFrameBatch } from "../../../pieces/_lib/open-images-pool";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_COUNT = 90;
const MAX_COUNT = 180;

function clampCount(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_COUNT;
  }
  return Math.min(MAX_COUNT, Math.max(1, Math.floor(value)));
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const count = clampCount(Number(requestUrl.searchParams.get("count") ?? DEFAULT_COUNT));

  const batch = getRollingShutterFrameBatch(count);
  return NextResponse.json(
    {
      frames: batch.frames,
      status: batch.status,
      poolSize: batch.poolSize,
      source: "open-images",
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
