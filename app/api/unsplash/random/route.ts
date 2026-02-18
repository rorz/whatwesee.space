import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type UnsplashPhotoPayload = {
  id?: string;
  alt_description?: string | null;
  color?: string | null;
  urls?: {
    raw?: string;
    regular?: string;
    small?: string;
    thumb?: string;
  };
  user?: {
    name?: string;
    username?: string;
    links?: {
      html?: string;
    };
  };
  links?: {
    html?: string;
  };
};

type RollingShutterPhoto = {
  id: string;
  url: string;
  alt: string;
  color: string;
  photographer: string;
  photographerUrl: string;
  unsplashUrl: string;
};

const TOPICS = [
  "street",
  "portrait",
  "architecture",
  "landscape",
  "night",
  "crowd",
  "motion",
  "city",
  "texture",
  "abstract",
] as const;

const DEFAULT_COUNT = 30;
const MAX_COUNT = 30;

function clampCount(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_COUNT;
  }
  return Math.min(MAX_COUNT, Math.max(1, Math.floor(value)));
}

function withUtm(url: string): string {
  const parsed = new URL(url);
  parsed.searchParams.set("utm_source", "what_we_see");
  parsed.searchParams.set("utm_medium", "referral");
  return parsed.toString();
}

function buildLowResImageUrl(photo: UnsplashPhotoPayload): string | null {
  if (photo.urls?.raw) {
    const parsed = new URL(photo.urls.raw);
    parsed.searchParams.set("w", "560");
    parsed.searchParams.set("h", "560");
    parsed.searchParams.set("crop", "entropy");
    parsed.searchParams.set("fit", "crop");
    parsed.searchParams.set("auto", "format");
    parsed.searchParams.set("fm", "jpg");
    return parsed.toString();
  }

  return photo.urls?.small ?? photo.urls?.regular ?? photo.urls?.thumb ?? null;
}

function mapUnsplashPhoto(photo: UnsplashPhotoPayload): RollingShutterPhoto | null {
  if (!photo.id) {
    return null;
  }

  const url = buildLowResImageUrl(photo);
  if (!url) {
    return null;
  }

  const username = photo.user?.username ?? "unsplash";
  const photographerUrl = photo.user?.links?.html
    ? withUtm(photo.user.links.html)
    : withUtm(`https://unsplash.com/@${username}`);

  const photoPageUrl = photo.links?.html
    ? withUtm(photo.links.html)
    : withUtm(`https://unsplash.com/photos/${photo.id}`);

  return {
    id: photo.id,
    url,
    alt: photo.alt_description ?? "Unsplash image",
    color: photo.color ?? "#101010",
    photographer: photo.user?.name ?? username,
    photographerUrl,
    unsplashUrl: photoPageUrl,
  };
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const count = clampCount(Number(requestUrl.searchParams.get("count") ?? DEFAULT_COUNT));

  const accessKey =
    process.env.UNSPLASH_ACCESS_KEY ?? process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY ?? "";

  if (!accessKey) {
    return NextResponse.json(
      {
        photos: [],
        source: "none",
        reason: "missing_unsplash_access_key",
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  const endpoint = new URL("https://api.unsplash.com/photos/random");
  endpoint.searchParams.set("count", String(count));
  endpoint.searchParams.set("orientation", "squarish");
  endpoint.searchParams.set("content_filter", "high");
  endpoint.searchParams.set("query", topic);

  try {
    const response = await fetch(endpoint.toString(), {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        "Accept-Version": "v1",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          photos: [],
          source: "unsplash",
          reason: "unsplash_fetch_failed",
          status: response.status,
        },
        {
          status: 200,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    const payload = (await response.json()) as UnsplashPhotoPayload | UnsplashPhotoPayload[];
    const list = Array.isArray(payload) ? payload : [payload];
    const photos = list
      .map(mapUnsplashPhoto)
      .filter((photo): photo is RollingShutterPhoto => photo !== null);

    return NextResponse.json(
      {
        photos,
        source: "unsplash",
        topic,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch {
    return NextResponse.json(
      {
        photos: [],
        source: "unsplash",
        reason: "unsplash_request_error",
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
