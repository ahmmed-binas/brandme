"use client";

import { useEffect, useRef } from "react";
import { motionOff } from "./motion";

/**
 * A full-size WebGL canvas running one fragment shader, for template
 * backgrounds (Dispatch's current, Atelier's pearl, Radar's sweep…).
 *
 * Uniforms every shader gets:
 *   u_time (seconds), u_res (pixels), u_pointer (0–1, follows the mouse),
 *   u_a, u_b, u_c (three colours as vec3, from CSS colours you pass in).
 *
 * Draws one still frame when motion is off (captures, reduced motion), stops
 * while off screen, caps the pixel ratio at 1.5 to stay light on phones, and
 * falls back to the parent's background if WebGL isn't available.
 */

const VERTEX = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

/** Shared GLSL helpers prepended to every shader: hashing and smooth noise. */
const LIB = `
precision highp float;
uniform float u_time;
uniform vec2 u_res;
uniform vec2 u_pointer;
uniform vec3 u_a;
uniform vec3 u_b;
uniform vec3 u_c;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; }
  return v;
}
`;

/** "#rrggbb" or "#rgb" as 0–1 RGB; anything else becomes mid grey. */
function rgb(hex: string): [number, number, number] {
  let value = hex.trim().replace(/^#/, "");
  if (value.length === 3) value = [...value].map((char) => char + char).join("");
  const number = Number.parseInt(value, 16);
  if (value.length !== 6 || Number.isNaN(number)) return [0.5, 0.5, 0.5];
  return [((number >> 16) & 255) / 255, ((number >> 8) & 255) / 255, (number & 255) / 255];
}

export function Shader({
  fragment,
  colours,
  className = "",
  speed = 1,
}: {
  /** GLSL body that sets gl_FragColor; LIB's uniforms and helpers are available. */
  fragment: string;
  /** Three hex colours for u_a, u_b, u_c, usually the palette's bg, the accent and fg. */
  colours: [string, string, string];
  className?: string;
  speed?: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const key = colours.join("|");

  useEffect(() => {
    const node = canvas.current;
    if (!node) return;
    const gl = node.getContext("webgl", { premultipliedAlpha: false, antialias: false });
    if (!gl) return;

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost())
        console.warn("Shader:", gl.getShaderInfoLog(shader));
      return shader;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, LIB + fragment));
    gl.linkProgram(program);
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const [a, b, c] = colours.map(rgb);
    gl.uniform3fv(uniform("u_a"), a!);
    gl.uniform3fv(uniform("u_b"), b!);
    gl.uniform3fv(uniform("u_c"), c!);

    const start = performance.now();
    const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    const onMove = (event: PointerEvent) => {
      const box = node.getBoundingClientRect();
      pointer.tx = (event.clientX - box.left) / box.width;
      pointer.ty = 1 - (event.clientY - box.top) / box.height;
    };
    window.addEventListener("pointermove", onMove);

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      node.width = Math.max(1, Math.round(node.clientWidth * ratio));
      node.height = Math.max(1, Math.round(node.clientHeight * ratio));
      gl.viewport(0, 0, node.width, node.height);
      gl.uniform2f(uniform("u_res"), node.width, node.height);
    };
    resize();
    const still = motionOff();

    let visible = true;
    const seen = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
    });
    seen.observe(node);

    let frame = 0;
    const draw = (now: number) => {
      if (gl.isContextLost()) return;
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;
      gl.uniform1f(uniform("u_time"), still ? 12.0 : ((now - start) / 1000) * speed);
      gl.uniform2f(uniform("u_pointer"), pointer.x, pointer.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    // Resizing clears the canvas, so a still frame is drawn again after each resize.
    const observer = new ResizeObserver(() => {
      resize();
      if (still) draw(performance.now());
    });
    observer.observe(node);
    const loop = (now: number) => {
      if (visible) draw(now);
      frame = requestAnimationFrame(loop);
    };
    if (still) draw(start);
    else frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      seen.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rebuilt only when the shader or colours change
  }, [fragment, key, speed]);

  return <canvas ref={canvas} aria-hidden className={`pointer-events-none block size-full ${className}`} />;
}
