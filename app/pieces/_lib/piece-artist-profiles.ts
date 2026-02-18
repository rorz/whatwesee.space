export type PieceArtistProfile = {
  name: string;
  city: string;
  avatar: string;
};

export const PIECE_ARTIST_PROFILES: Record<number, PieceArtistProfile> = {
  1: { name: "Arden Vale", city: "Rotterdam", avatar: "/profiles/piece-1.jpg" },
  2: { name: "Mina Calder", city: "Glasgow", avatar: "/profiles/piece-2.jpg" },
  3: { name: "Luca Stern", city: "Tallinn", avatar: "/profiles/piece-3.jpg" },
  4: { name: "Priya Noam", city: "Lisbon", avatar: "/profiles/piece-4.jpg" },
  5: { name: "Eli Navarro", city: "Manila", avatar: "/profiles/piece-5.jpg" },
  6: { name: "Sable Mercer", city: "Marseille", avatar: "/profiles/piece-6.jpg" },
  7: { name: "Jonah Pike", city: "Montreal", avatar: "/profiles/piece-7.jpg" },
  8: { name: "Nia Corbett", city: "Seoul", avatar: "/profiles/piece-8.jpg" },
  9: { name: "Tomas Rhee", city: "Porto", avatar: "/profiles/piece-9.jpg" },
};

export function getPieceArtistProfile(pieceId: number): PieceArtistProfile {
  return PIECE_ARTIST_PROFILES[pieceId] ?? PIECE_ARTIST_PROFILES[1];
}
