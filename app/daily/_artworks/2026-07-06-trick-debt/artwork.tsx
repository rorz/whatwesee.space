"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    trick_debt_render_to_text?: () => string;
    trick_debt_advance?: (steps: number) => void;
  }
}

type Suit = "♠" | "♥" | "♦" | "♣";

type CardFace = {
  label: string;
  numericValue: number;
  suit: Suit;
};

type PlacedTrick = {
  playerCardIdx: number;
  won: boolean;
};

const CARD_LABELS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
const RED_SUITS = new Set<Suit>(["♥", "♦"]);

const FELT = "#1a7a2e";
const FELT_EDGE = "#145827";
const CARD_BG = "#fafaf8";
const RED_COLOR = "#c41e1e";
const BLACK_COLOR = "#111111";

function buildDeck(): CardFace[] {
  const deck: CardFace[] = [];
  for (const suit of SUITS) {
    for (let i = 0; i < CARD_LABELS.length; i++) {
      deck.push({ label: CARD_LABELS[i], numericValue: i + 2, suit });
    }
  }
  return deck;
}

function dealHands(): { house: CardFace[]; player: CardFace[] } {
  const deck = buildDeck();
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
  }
  return { house: deck.slice(0, 3), player: deck.slice(3, 6) };
}

export default function TrickDebt() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const c = ctx;

    let S = 400;
    let rafId = 0;
    let resizeObserver: ResizeObserver | null = null;

    let house: CardFace[] = [];
    let player: CardFace[] = [];
    let selectedPlayer = -1;
    let placed: (PlacedTrick | null)[] = [null, null, null];
    let flashFrames = [0, 0, 0];
    let phase: "playing" | "done" = "playing";
    let tricksWon = 0;
    let gamesPlayed = 0;

    const deal = () => {
      const hands = dealHands();
      house = hands.house;
      player = hands.player;
      selectedPlayer = -1;
      placed = [null, null, null];
      flashFrames = [0, 0, 0];
      phase = "playing";
      tricksWon = 0;
    };

    deal();

    const fitCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
      const size = Math.min(rect.width, rect.height);
      S = size;
      canvas.width = Math.floor(size * dpr);
      canvas.height = Math.floor(size * dpr);
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    fitCanvas();
    resizeObserver = new ResizeObserver(fitCanvas);
    resizeObserver.observe(container);

    const cardW = () => S * 0.26;
    const cardH = () => cardW() * 1.4;
    const margin = () => S * 0.04;

    const cardX = (col: number) => {
      const w = cardW();
      const totalGap = S - 2 * margin() - 3 * w;
      const gap = totalGap / 2;
      return margin() + col * (w + gap);
    };

    const houseCardY = () => margin();
    const playerCardY = () => S - margin() - cardH();

    function roundedRect(x: number, y: number, w: number, h: number, r: number) {
      c.beginPath();
      c.moveTo(x + r, y);
      c.lineTo(x + w - r, y);
      c.arcTo(x + w, y, x + w, y + r, r);
      c.lineTo(x + w, y + h - r);
      c.arcTo(x + w, y + h, x + w - r, y + h, r);
      c.lineTo(x + r, y + h);
      c.arcTo(x, y + h, x, y + h - r, r);
      c.lineTo(x, y + r);
      c.arcTo(x, y, x + r, y, r);
      c.closePath();
    }

    function colorForSuit(suit: Suit, greyed: boolean): string {
      if (greyed) return RED_SUITS.has(suit) ? "rgba(160,80,80,0.7)" : "rgba(80,100,80,0.7)";
      return RED_SUITS.has(suit) ? RED_COLOR : BLACK_COLOR;
    }

    function drawCard(
      x: number,
      y: number,
      w: number,
      h: number,
      card: CardFace,
      selected: boolean,
      result: PlacedTrick | null,
      greyed: boolean,
    ) {
      const r = w * 0.08;

      c.save();
      c.shadowColor = "rgba(0,0,0,0.38)";
      c.shadowBlur = w * 0.14;
      c.shadowOffsetX = w * 0.035;
      c.shadowOffsetY = w * 0.035;
      roundedRect(x, y, w, h, r);
      c.fillStyle = CARD_BG;
      c.fill();
      c.restore();

      roundedRect(x, y, w, h, r);
      if (selected) {
        c.strokeStyle = "#f5c800";
        c.lineWidth = 3.5;
      } else {
        c.strokeStyle = greyed ? "#88a090" : "#555555";
        c.lineWidth = 1.5;
      }
      c.stroke();

      const color = colorForSuit(card.suit, greyed);

      if (!greyed) {
        c.fillStyle = color;
        c.font = `bold ${w * 0.22}px monospace`;
        c.textAlign = "left";
        c.textBaseline = "top";
        c.fillText(card.label, x + w * 0.1, y + h * 0.06);
        c.font = `${w * 0.2}px serif`;
        c.fillText(card.suit, x + w * 0.1, y + h * 0.26);
        c.font = `${w * 0.44}px serif`;
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText(card.suit, x + w * 0.5, y + h * 0.52);
      } else {
        roundedRect(x, y, w, h, r);
        c.fillStyle = "rgba(20,88,39,0.5)";
        c.fill();
        c.fillStyle = color;
        c.font = `bold ${w * 0.2}px monospace`;
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText(card.label + card.suit, x + w * 0.5, y + h * 0.5);
      }

      if (result !== null) {
        roundedRect(x, y, w, h, r);
        c.fillStyle = result.won ? "rgba(0,200,60,0.28)" : "rgba(220,20,20,0.28)";
        c.fill();
        c.fillStyle = result.won ? "#00cc44" : "#dd1111";
        c.font = `bold ${w * 0.42}px monospace`;
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText(result.won ? "W" : "L", x + w * 0.5, y + h * 0.5);
      }
    }

    function drawFlash(cx: number, cy: number, t: number) {
      if (t <= 0) return;
      const radius = S * 0.11 * (1 - t * 0.4);
      c.beginPath();
      c.arc(cx, cy, radius, 0, Math.PI * 2);
      c.fillStyle = `rgba(255,220,0,${t * 0.55})`;
      c.fill();
      c.save();
      c.translate(cx, cy);
      const spokes = 8;
      for (let i = 0; i < spokes; i++) {
        c.rotate((Math.PI * 2) / spokes);
        c.beginPath();
        c.moveTo(S * 0.012, 0);
        c.lineTo(S * 0.085 * t, 0);
        c.strokeStyle = `rgba(255,230,50,${t * 0.65})`;
        c.lineWidth = 2.5;
        c.stroke();
      }
      c.restore();
    }

    function draw() {
      const w = cardW();
      const h = cardH();

      c.fillStyle = FELT;
      c.fillRect(0, 0, S, S);

      c.strokeStyle = FELT_EDGE;
      c.lineWidth = S * 0.018;
      c.strokeRect(S * 0.022, S * 0.022, S * 0.956, S * 0.956);

      c.fillStyle = "rgba(255,255,255,0.28)";
      c.font = `${S * 0.035}px monospace`;
      c.textAlign = "right";
      c.textBaseline = "top";
      c.fillText("HOUSE", S - margin() + w * 0.1, houseCardY() + h + S * 0.01);
      c.textBaseline = "bottom";
      c.fillText("YOUR HAND", S - margin() + w * 0.1, playerCardY() - S * 0.01);

      for (let i = 0; i < 3; i++) {
        const x = cardX(i);
        const y = houseCardY();
        drawCard(x, y, w, h, house[i], false, placed[i], false);
      }

      const playerPlaced = new Set(placed.filter(Boolean).map((p) => p!.playerCardIdx));

      for (let j = 0; j < 3; j++) {
        const x = cardX(j);
        const y = playerCardY();
        const isSelected = selectedPlayer === j;
        const isUsed = playerPlaced.has(j);
        drawCard(x, y, w, h, player[j], isSelected, null, isUsed);
      }

      for (let i = 0; i < 3; i++) {
        if (flashFrames[i] > 0) {
          const t = flashFrames[i] / 14;
          const fx = cardX(i) + w / 2;
          const fy = houseCardY() + h / 2;
          drawFlash(fx, fy, t);
          flashFrames[i]--;
        }
      }

      const midY = S * 0.5;
      c.textAlign = "center";
      c.textBaseline = "middle";

      if (phase === "playing") {
        const placedCount = placed.filter(Boolean).length;
        const remaining = 3 - placedCount;
        let statusLine = "";
        if (selectedPlayer >= 0) {
          statusLine = "throw at house card \u2191";
        } else if (placedCount === 0) {
          statusLine = "select a card \u2193";
        } else if (remaining > 0) {
          statusLine = `${remaining} trick${remaining > 1 ? "s" : ""} left`;
        }
        c.fillStyle = "rgba(255,255,255,0.55)";
        c.font = `${S * 0.048}px monospace`;
        c.fillText(statusLine, S * 0.5, midY);
      }

      if (phase === "done") {
        const survived = tricksWon >= 1;
        c.fillStyle = survived ? "rgba(0,0,0,0.48)" : "rgba(0,0,0,0.62)";
        c.fillRect(0, S * 0.35, S, S * 0.3);
        c.fillStyle = survived ? "#33ee66" : "#ff4444";
        c.font = `bold ${S * 0.12}px monospace`;
        c.fillText(survived ? "SURVIVED" : "KNOCKED", S * 0.5, midY - S * 0.04);
        c.fillStyle = "rgba(255,255,255,0.65)";
        c.font = `${S * 0.046}px monospace`;
        c.fillText(`${tricksWon} of 3 tricks won`, S * 0.5, midY + S * 0.07);
        c.fillStyle = "rgba(255,255,255,0.35)";
        c.font = `${S * 0.036}px monospace`;
        c.fillText("tap to deal again", S * 0.5, midY + S * 0.17);
      }
    }

    const loop = () => {
      draw();
      rafId = window.requestAnimationFrame(loop);
    };

    const hitTest = (
      ex: number,
      ey: number,
    ): { type: "house" | "player"; index: number } | null => {
      const w = cardW();
      const h = cardH();
      for (let i = 0; i < 3; i++) {
        const x = cardX(i);
        if (ex >= x && ex <= x + w) {
          if (ey >= houseCardY() && ey <= houseCardY() + h) {
            return { type: "house", index: i };
          }
          if (ey >= playerCardY() && ey <= playerCardY() + h) {
            return { type: "player", index: i };
          }
        }
      }
      return null;
    };

    const handlePointerDown = (e: PointerEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const ex = ((e.clientX - rect.left) / rect.width) * S;
      const ey = ((e.clientY - rect.top) / rect.height) * S;

      if (phase === "done") {
        deal();
        return;
      }

      const hit = hitTest(ex, ey);
      if (!hit) return;

      if (hit.type === "player") {
        const j = hit.index;
        const playerPlaced = new Set(placed.filter(Boolean).map((p) => p!.playerCardIdx));
        if (playerPlaced.has(j)) return;
        selectedPlayer = selectedPlayer === j ? -1 : j;
      } else {
        const i = hit.index;
        if (placed[i] !== null || selectedPlayer < 0) return;
        const playerPlaced = new Set(placed.filter(Boolean).map((p) => p!.playerCardIdx));
        if (playerPlaced.has(selectedPlayer)) return;

        const won = player[selectedPlayer].numericValue > house[i].numericValue;
        placed[i] = { playerCardIdx: selectedPlayer, won };
        flashFrames[i] = 14;
        selectedPlayer = -1;

        if (placed.every((p) => p !== null)) {
          tricksWon = placed.filter((p) => p?.won).length;
          gamesPlayed++;
          phase = "done";
        }
      }
    };

    canvas.addEventListener("pointerdown", handlePointerDown);

    window.trick_debt_render_to_text = () => {
      const placedCount = placed.filter(Boolean).length;
      const wons = placed.filter((p) => p?.won).length;
      return `Trick Debt | phase:${phase} placed:${placedCount}/3 won:${wons} games:${gamesPlayed} selected:${selectedPlayer}`;
    };

    window.trick_debt_advance = (steps: number) => {
      for (let s = 0; s < steps; s++) {
        for (let i = 0; i < 3; i++) {
          if (flashFrames[i] > 0) flashFrames[i]--;
        }
      }
    };

    loop();

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      canvas.removeEventListener("pointerdown", handlePointerDown);
      delete window.trick_debt_render_to_text;
      delete window.trick_debt_advance;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full touch-none select-none"
      aria-label="A canvas card table showing a game of Knack. Three house cards are dealt face-up at top. Select one of your three cards at the bottom, then click a house card slot to throw it. Win at least one of three tricks to survive; win none and you are knocked."
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-pointer" />
    </div>
  );
}
