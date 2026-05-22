"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    field_memory_render_to_text?: () => string;
    field_memory_advance?: (steps: number) => void;
  }
}

const vertexShaderSource = `
attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `
precision highp float;

uniform vec2 u_resolution;
uniform vec2 u_pointer;
uniform float u_time;
uniform float u_active;

mat2 rotate2d(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

float lineField(vec2 p, float phase) {
  vec2 q = p;
  float field = 0.0;
  for (int i = 0; i < 5; i++) {
    q = rotate2d(0.52 + float(i) * 0.17) * q;
    float wave = sin(q.x * (7.0 + float(i) * 2.4) + phase + float(i) * 1.9);
    field += 0.09 / (0.018 + abs(q.y + wave * 0.06));
    q *= 1.18;
  }
  return field;
}

float ring(vec2 p, float radius, float width) {
  return smoothstep(width, 0.0, abs(length(p) - radius));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  vec2 magnet = (u_pointer * 2.0 - 1.0);
  magnet.y *= -1.0;

  float time = u_time * 0.001;
  float distanceToMagnet = length(p - magnet);
  float pull = 0.35 / (0.08 + distanceToMagnet * distanceToMagnet);
  float activePulse = mix(0.45, 1.0, u_active);

  vec2 warped = p;
  warped += normalize(p - magnet + 0.001) * sin(distanceToMagnet * 18.0 - time * 4.0) * pull * 0.085 * activePulse;
  warped = rotate2d(time * 0.18 + pull * 0.22) * warped;

  float field = lineField(warped, time * 2.1);
  float rings = ring(p - magnet, 0.16 + sin(time * 1.7) * 0.025, 0.012);
  rings += ring(p - magnet, 0.34 + cos(time * 1.3) * 0.035, 0.009) * 0.7;
  float grid = smoothstep(0.985, 1.0, cos((uv.x + sin(time) * 0.01) * 82.0)) * 0.15;
  grid += smoothstep(0.988, 1.0, cos((uv.y + cos(time) * 0.01) * 82.0)) * 0.12;

  float flare = smoothstep(0.7, 0.0, distanceToMagnet) * activePulse;
  vec3 cyan = vec3(0.02, 0.98, 1.0);
  vec3 magenta = vec3(1.0, 0.07, 0.82);
  vec3 yellow = vec3(1.0, 0.95, 0.05);
  vec3 blue = vec3(0.01, 0.04, 0.24);

  vec3 color = blue;
  color += cyan * field * 0.36;
  color += magenta * pow(field, 1.35) * 0.11;
  color += yellow * rings * 1.4;
  color += cyan * grid;
  color += magenta * flare * 0.22;
  color += vec3(0.0, 0.0, 0.02) * (1.0 - smoothstep(0.0, 1.3, length(p)));

  float scanline = 0.88 + 0.12 * sin(gl_FragCoord.y * 1.9);
  color *= scanline;

  gl_FragColor = vec4(color, 1.0);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) {
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  if (!vertexShader || !fragmentShader) {
    return null;
  }

  const program = gl.createProgram();
  if (!program) {
    return null;
  }
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

export default function FieldMemory() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      antialias: false,
      depth: false,
      preserveDrawingBuffer: true,
      stencil: false,
    });
    if (!gl) return;

    const program = createProgram(gl);
    if (!program) return;

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const pointerLocation = gl.getUniformLocation(program, "u_pointer");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const activeLocation = gl.getUniformLocation(program, "u_active");

    const pointer = { x: 0.58, y: 0.44, active: 0 };
    let rafId = 0;
    let manualOffset = 0;
    let displayWidth = 1;
    let displayHeight = 1;

    const fit = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      displayWidth = Math.max(1, Math.floor(rect.width));
      displayHeight = Math.max(1, Math.floor(rect.height));
      const width = Math.max(1, Math.floor(displayWidth * dpr));
      const height = Math.max(1, Math.floor(displayHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
    };

    const render = (timestamp = performance.now()) => {
      fit();
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform2f(pointerLocation, pointer.x, pointer.y);
      gl.uniform1f(timeLocation, timestamp + manualOffset);
      gl.uniform1f(activeLocation, pointer.active);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (timestamp: number) => {
      render(timestamp);
      rafId = window.requestAnimationFrame(loop);
    };

    const updatePointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width)));
      pointer.y = Math.max(0, Math.min(1, (event.clientY - rect.top) / Math.max(1, rect.height)));
    };

    const onPointerDown = (event: PointerEvent) => {
      pointer.active = 1;
      updatePointer(event);
      canvas.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (pointer.active > 0) {
        updatePointer(event);
      }
    };
    const onPointerEnd = (event: PointerEvent) => {
      pointer.active = 0;
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    };

    window.field_memory_render_to_text = () =>
      `Field Memory | webgl: active | pointer: ${pointer.x.toFixed(2)},${pointer.y.toFixed(2)} | armed: ${pointer.active}`;

    window.field_memory_advance = (steps: number) => {
      manualOffset += Math.max(0, steps) * 16.67;
      render();
    };

    const resizeObserver = new ResizeObserver(() => render());
    resizeObserver.observe(canvas);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerEnd);
    canvas.addEventListener("pointercancel", onPointerEnd);
    canvas.addEventListener("pointerleave", onPointerEnd);

    render();
    rafId = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerEnd);
      canvas.removeEventListener("pointercancel", onPointerEnd);
      canvas.removeEventListener("pointerleave", onPointerEnd);
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
      delete window.field_memory_render_to_text;
      delete window.field_memory_advance;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="block h-full w-full touch-none bg-[#01040f]"
      aria-label="A raw WebGL magnetic signal field. Drag to pull the neon field around the remembered point."
    />
  );
}
