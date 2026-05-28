"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    epiphysis_redline_render_to_text?: () => string;
    epiphysis_redline_advance?: (steps: number) => void;
  }
}

type Part = {
  id: number;
  label: string;
  heat: number;
};

type DragState = {
  id: number;
  fromCell: number;
  pointerX: number;
  pointerY: number;
};

type Layout = {
  headerHeight: number;
  boardLeft: number;
  boardTop: number;
  boardSize: number;
  cellSize: number;
  meterTop: number;
  meterHeight: number;
};

const GRID = 4;
const CELL_COUNT = GRID * GRID;
const LABELS = ["A1", "B2", "C3", "D4", "E5", "F6", "G7", "H8", "J9", "K1", "L2", "M3", "N4", "P5", "R6", "T7"];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function buildInitialParts(): Part[] {
  return LABELS.map((label, id) => ({
    id,
    label,
    heat: 38 + ((id * 17) % 39),
  }));
}

function getLayout(width: number, height: number): Layout {
  const margin = Math.min(width, height) * 0.05;
  const headerHeight = Math.max(36, height * 0.14);
  const meterHeight = Math.max(46, height * 0.14);
  const boardTop = headerHeight + margin * 0.3;
  const boardSize = Math.max(140, Math.min(width - margin * 2, height - boardTop - meterHeight - margin));
  const cellSize = boardSize / GRID;
  const boardLeft = (width - boardSize) / 2;
  const meterTop = boardTop + boardSize + margin * 0.45;
  return { headerHeight, boardLeft, boardTop, boardSize, cellSize, meterTop, meterHeight };
}

function getCellFromPoint(x: number, y: number, layout: Layout): number | null {
  if (x < layout.boardLeft || y < layout.boardTop || x > layout.boardLeft + layout.boardSize || y > layout.boardTop + layout.boardSize) {
    return null;
  }
  const col = clamp(Math.floor((x - layout.boardLeft) / layout.cellSize), 0, GRID - 1);
  const row = clamp(Math.floor((y - layout.boardTop) / layout.cellSize), 0, GRID - 1);
  return row * GRID + col;
}

function evolveParts(parts: Part[], board: number[], steps: number, startTick: number): { parts: Part[]; tick: number } {
  let nextParts = parts;
  let tick = startTick;
  const safeSteps = Math.max(0, Math.floor(steps));

  for (let i = 0; i < safeSteps; i += 1) {
    const positions = new Map<number, number>();
    board.forEach((partId, cellIndex) => {
      positions.set(partId, cellIndex);
    });

    nextParts = nextParts.map((part) => {
      const cell = positions.get(part.id) ?? 0;
      const row = Math.floor(cell / GRID);
      const thermalDrift = row === GRID - 1 ? -2.5 : 1.4 + row * 0.55;
      const pulse = Math.sin((tick + part.id * 9) * 0.16) * 0.42;
      return {
        ...part,
        heat: clamp(part.heat + thermalDrift + pulse, 2, 120),
      };
    });

    tick += 1;
  }

  return { parts: nextParts, tick };
}

export default function EpiphysisRedline() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef(0);
  const lastFrameRef = useRef(0);
  const simTickRef = useRef(0);
  const meterRef = useRef(0);
  const swapsRef = useRef(0);
  const boardRef = useRef<number[]>(Array.from({ length: CELL_COUNT }, (_, i) => i));
  const partsRef = useRef<Part[]>(buildInitialParts());
  const dragRef = useRef<DragState | null>(null);

  const [size, setSize] = useState({ width: 1, height: 1, dpr: 1 });
  const [board, setBoard] = useState<number[]>(Array.from({ length: CELL_COUNT }, (_, i) => i));
  const [parts, setParts] = useState<Part[]>(buildInitialParts());
  const [drag, setDrag] = useState<DragState | null>(null);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  useEffect(() => {
    partsRef.current = parts;
    meterRef.current = parts.reduce((sum, part) => sum + part.heat, 0) / parts.length;
  }, [parts]);

  useEffect(() => {
    dragRef.current = drag;
  }, [drag]);

  const stepThermal = useCallback((steps: number) => {
    setParts((current) => {
      const evolved = evolveParts(current, boardRef.current, steps, simTickRef.current);
      simTickRef.current = evolved.tick;
      return evolved.parts;
    });
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      const width = Math.max(1, Math.floor(entry.contentRect.width));
      const height = Math.max(1, Math.floor(entry.contentRect.height));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      setSize({ width, height, dpr });
    });

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const animate = (time: number) => {
      if (!lastFrameRef.current) {
        lastFrameRef.current = time;
      }

      const elapsed = time - lastFrameRef.current;
      if (elapsed > 90) {
        const steps = Math.max(1, Math.floor(elapsed / 90));
        stepThermal(steps);
        lastFrameRef.current = time;
      }

      animationFrameRef.current = window.requestAnimationFrame(animate);
    };

    animationFrameRef.current = window.requestAnimationFrame(animate);
    return () => {
      window.cancelAnimationFrame(animationFrameRef.current);
    };
  }, [stepThermal]);

  const orderedParts = useMemo(() => {
    const map = new Map(parts.map((part) => [part.id, part]));
    return board.map((partId) => map.get(partId)).filter((part): part is Part => Boolean(part));
  }, [board, parts]);

  const meter = Math.round(parts.reduce((sum, part) => sum + part.heat, 0) / parts.length);
  const alarm = meter >= 86;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const { width, height, dpr } = size;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const layout = getLayout(width, height);
    context.clearRect(0, 0, width, height);

    const background = context.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, "#545a61");
    background.addColorStop(0.45, "#2e3339");
    background.addColorStop(1, "#16191d");
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);

    context.fillStyle = "#0f1318";
    context.fillRect(layout.boardLeft - 6, layout.boardTop - 6, layout.boardSize + 12, layout.boardSize + 12);

    context.fillStyle = "#252a30";
    context.fillRect(layout.boardLeft, layout.boardTop, layout.boardSize, layout.boardSize);

    context.fillStyle = "#9ca4ad";
    context.font = `${Math.max(10, Math.floor(layout.headerHeight * 0.21))}px monospace`;
    context.textBaseline = "middle";
    context.fillText("ORTHO INVENTORY / REDLINE CHANNEL", layout.boardLeft, layout.headerHeight * 0.4);

    context.fillStyle = alarm ? "#ff6b52" : "#d8dee6";
    context.textAlign = "right";
    context.fillText(`METER ${meter}%`, layout.boardLeft + layout.boardSize, layout.headerHeight * 0.4);
    context.textAlign = "left";

    const partMap = new Map(parts.map((part) => [part.id, part]));

    for (let index = 0; index < board.length; index += 1) {
      const col = index % GRID;
      const row = Math.floor(index / GRID);
      const x = layout.boardLeft + col * layout.cellSize;
      const y = layout.boardTop + row * layout.cellSize;

      context.fillStyle = row === GRID - 1 ? "#2f3b46" : "#31373e";
      context.fillRect(x + 1, y + 1, layout.cellSize - 2, layout.cellSize - 2);

      context.strokeStyle = "#59616c";
      context.strokeRect(x + 1, y + 1, layout.cellSize - 2, layout.cellSize - 2);

      const partId = board[index];
      if (drag && partId === drag.id) {
        continue;
      }
      const part = partMap.get(partId);
      if (!part) {
        continue;
      }

      const inset = layout.cellSize * 0.12;
      const px = x + inset;
      const py = y + inset;
      const pw = layout.cellSize - inset * 2;
      const ph = layout.cellSize - inset * 2;

      const hotness = clamp(part.heat / 120, 0, 1);
      context.fillStyle = `rgb(${Math.round(118 + hotness * 102)}, ${Math.round(124 - hotness * 64)}, ${Math.round(136 - hotness * 94)})`;
      context.fillRect(px, py, pw, ph);

      context.strokeStyle = hotness > 0.72 ? "#ff603a" : "#c8d0da";
      context.strokeRect(px, py, pw, ph);

      const dotCount = 6;
      for (let i = 0; i < dotCount; i += 1) {
        const dx = px + ((i * 13 + part.id * 7) % 17) / 17 * pw;
        const dy = py + ((i * 19 + part.id * 11) % 23) / 23 * ph;
        context.fillStyle = hotness > 0.72 ? "rgba(255,210,190,0.55)" : "rgba(52,59,67,0.4)";
        context.fillRect(dx, dy, Math.max(1.2, pw * 0.05), Math.max(1.2, ph * 0.05));
      }

      context.fillStyle = "#0f141b";
      context.font = `${Math.max(10, Math.floor(layout.cellSize * 0.21))}px monospace`;
      context.fillText(part.label, px + 6, py + 14);

      context.fillStyle = hotness > 0.72 ? "#ff3e2c" : "#1d232b";
      context.fillRect(px + 6, py + ph - 12, (pw - 12) * hotness, 6);
    }

    if (drag) {
      const draggedPart = partMap.get(drag.id);
      if (draggedPart) {
        const sizePx = layout.cellSize * 0.76;
        const x = drag.pointerX - sizePx / 2;
        const y = drag.pointerY - sizePx / 2;
        const hotness = clamp(draggedPart.heat / 120, 0, 1);
        context.fillStyle = `rgba(${Math.round(130 + hotness * 110)}, ${Math.round(110 - hotness * 50)}, ${Math.round(122 - hotness * 92)}, 0.92)`;
        context.fillRect(x, y, sizePx, sizePx);
        context.strokeStyle = "#fff2e8";
        context.strokeRect(x, y, sizePx, sizePx);
        context.fillStyle = "#0b1015";
        context.font = `${Math.max(10, Math.floor(layout.cellSize * 0.2))}px monospace`;
        context.fillText(draggedPart.label, x + 6, y + 16);
      }
    }

    const meterLeft = layout.boardLeft;
    const meterWidth = layout.boardSize;
    const meterTop = layout.meterTop;
    const meterHeight = Math.min(layout.meterHeight, height - meterTop - 10);

    context.fillStyle = "#1a1f24";
    context.fillRect(meterLeft, meterTop, meterWidth, meterHeight);

    context.fillStyle = alarm ? "#ff4f35" : "#d8dde5";
    context.font = `${Math.max(10, Math.floor(meterHeight * 0.28))}px monospace`;
    context.fillText("HEAT CHANNEL", meterLeft + 10, meterTop + meterHeight * 0.28);

    context.fillStyle = "#0f1318";
    context.fillRect(meterLeft + 10, meterTop + meterHeight * 0.48, meterWidth - 20, meterHeight * 0.32);

    const meterFillWidth = ((meterWidth - 20) * clamp(meter, 0, 100)) / 100;
    context.fillStyle = alarm ? "#ff4f35" : "#7e8c9a";
    context.fillRect(meterLeft + 10, meterTop + meterHeight * 0.48, meterFillWidth, meterHeight * 0.32);

    const redlineX = meterLeft + 10 + (meterWidth - 20) * 0.86;
    context.strokeStyle = "#ffb19f";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(redlineX, meterTop + meterHeight * 0.46);
    context.lineTo(redlineX, meterTop + meterHeight * 0.82);
    context.stroke();

    context.fillStyle = "#c7ced7";
    context.font = `${Math.max(9, Math.floor(meterHeight * 0.22))}px monospace`;
    context.fillText(`swaps ${swapsRef.current}`, meterLeft + 10, meterTop + meterHeight * 0.95);
    context.textAlign = "right";
    context.fillText(alarm ? "METER ALREADY IN RED" : "COOL RACK ACTIVE", meterLeft + meterWidth - 10, meterTop + meterHeight * 0.95);
    context.textAlign = "left";
  }, [board, drag, meter, orderedParts.length, parts, size, alarm]);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const cell = getCellFromPoint(x, y, getLayout(rect.width, rect.height));
    if (cell === null) {
      return;
    }

    const partId = boardRef.current[cell];
    if (partId === undefined) {
      return;
    }

    setDrag({ id: partId, fromCell: cell, pointerX: x, pointerY: y });
  }, []);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setDrag((current) => (current ? { ...current, pointerX: x, pointerY: y } : current));
  }, []);

  const releaseDrag = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const currentDrag = dragRef.current;
    if (!canvas || !currentDrag) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const targetCell = getCellFromPoint(x, y, getLayout(rect.width, rect.height));

    if (targetCell !== null && targetCell !== currentDrag.fromCell) {
      setBoard((current) => {
        const next = [...current];
        [next[currentDrag.fromCell], next[targetCell]] = [next[targetCell], next[currentDrag.fromCell]];
        boardRef.current = next;
        swapsRef.current += 1;
        return next;
      });
    }

    setDrag(null);
  }, []);

  useEffect(() => {
    window.epiphysis_redline_render_to_text = () => {
      const meterNow = Math.round(meterRef.current);
      const status = meterNow >= 86 ? "redline" : "stable";
      const dragging = dragRef.current ? "yes" : "no";
      return `meter=${meterNow} status=${status} swaps=${swapsRef.current} dragging=${dragging}`;
    };

    window.epiphysis_redline_advance = (steps: number) => {
      const safeSteps = Math.max(0, Math.floor(steps));
      if (safeSteps === 0) {
        return;
      }
      setParts((current) => {
        const evolved = evolveParts(current, boardRef.current, safeSteps, simTickRef.current);
        simTickRef.current = evolved.tick;
        return evolved.parts;
      });
    };

    return () => {
      delete window.epiphysis_redline_render_to_text;
      delete window.epiphysis_redline_advance;
    };
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full bg-[#2d3339]">
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={releaseDrag}
        onPointerCancel={releaseDrag}
      />
    </div>
  );
}
