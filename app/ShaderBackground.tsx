"use client";

import { useEffect, useRef } from "react";

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2 iResolution;
uniform float iTime;
uniform vec4 iMouse;
out vec4 outColor;

#define WAVES
#define BORDER

#define RAY_STEPS 150

#define BRIGHTNESS 1.2
#define GAMMA 1.4
#define SATURATION .65

#define detail .001
#define t iTime*.5

const vec3 origin = vec3(-1., .7, 0.);
float det = 0.0;

mat2 rot(float a) {
  return mat2(cos(a), sin(a), -sin(a), cos(a));
}

vec4 formula(vec4 p) {
  p.xz = abs(p.xz + 1.) - abs(p.xz - 1.) - p.xz;
  p.y -= .25;
  p.xy *= rot(radians(35.));
  p = p * 2. / clamp(dot(p.xyz, p.xyz), .2, 1.);
  return p;
}

float de(vec3 pos) {
#ifdef WAVES
  pos.y += sin(pos.z - t * 6.) * .15;
#endif
  vec3 tpos = pos;
  tpos.z = abs(3. - mod(tpos.z, 6.));
  vec4 p = vec4(tpos, 1.);
  for (int i = 0; i < 4; i++) { p = formula(p); }
  float fr = (length(max(vec2(0.), p.yz - 1.5)) - 1.) / p.w;
  float ro = max(abs(pos.x + 1.) - .3, pos.y - .35);
  ro = max(ro, -max(abs(pos.x + 1.) - .1, pos.y - .5));
  pos.z = abs(.25 - mod(pos.z, .5));
  ro = max(ro, -max(abs(pos.z) - .2, pos.y - .3));
  ro = max(ro, -max(abs(pos.z) - .01, -pos.y + .32));
  float d = min(fr, ro);
  return d;
}

vec3 path(float ti) {
  ti *= 1.5;
  vec3 p = vec3(sin(ti), (1. - sin(ti * 2.)) * .5, -ti * 5.) * .5;
  return p;
}

float edge = 0.;
vec3 normal(vec3 p) {
  vec3 e = vec3(0.0, det * 5., 0.0);
  float d1 = de(p - e.yxx), d2 = de(p + e.yxx);
  float d3 = de(p - e.xyx), d4 = de(p + e.xyx);
  float d5 = de(p - e.xxy), d6 = de(p + e.xxy);
  float d = de(p);
  edge = abs(d - 0.5 * (d2 + d1)) + abs(d - 0.5 * (d4 + d3)) + abs(d - 0.5 * (d6 + d5));
  edge = min(1., pow(edge, .55) * 15.);
  return normalize(vec3(d1 - d2, d3 - d4, d5 - d6));
}

vec3 raymarch(in vec3 from, in vec3 dir) {
  edge = 0.;
  vec3 p, norm;
  float d = 100.;
  float totdist = 0.;
  for (int i = 0; i < RAY_STEPS; i++) {
    if (d > det && totdist < 25.0) {
      p = from + totdist * dir;
      d = de(p);
      det = detail * exp(.13 * totdist);
      totdist += d;
    }
  }
  vec3 col = vec3(0.);
  p -= (det - d) * dir;
  norm = normal(p);
  col = (1. - abs(norm)) * max(0., 1. - edge * .8);
  totdist = clamp(totdist, 0., 26.);
  dir.y -= .02;
  float sunsize = 7.;
  float an = atan(dir.x, dir.y) + iTime * 1.5;
  float s = pow(clamp(1.0 - length(dir.xy) * sunsize - abs(.2 - mod(an, .4)), 0., 1.), .1);
  float sb = pow(clamp(1.0 - length(dir.xy) * (sunsize - .2) - abs(.2 - mod(an, .4)), 0., 1.), .1);
  float sg = pow(clamp(1.0 - length(dir.xy) * (sunsize - 4.5) - .5 * abs(.2 - mod(an, .4)), 0., 1.), 3.);
  float y = mix(.45, 1.2, pow(smoothstep(0., 1., .75 - dir.y), 2.)) * (1. - sb * .5);

  vec3 backg = vec3(0.5, 0., 1.) * ((1. - s) * (1. - sg) * y + (1. - sb) * sg * vec3(1., .8, 0.15) * 3.);
  backg += vec3(1., .9, .1) * s;
  backg = max(backg, sg * vec3(1., .9, .5));

  col = mix(vec3(1., .9, .3), col, exp(-.004 * totdist * totdist));
  if (totdist > 25.) col = backg;
  col = pow(col, vec3(GAMMA)) * BRIGHTNESS;
  col = mix(vec3(length(col)), col, SATURATION);
  col *= vec3(1., .9, .85);
  return col;
}

vec3 move(inout vec3 dir) {
  vec3 go = path(t);
  vec3 adv = path(t + .7);
  vec3 advec = normalize(adv - go);
  float an = adv.x - go.x;
  an *= min(1., abs(adv.z - go.z)) * sign(adv.z - go.z) * .7;
  dir.xy *= mat2(cos(an), sin(an), -sin(an), cos(an));
  an = advec.y * 1.7;
  dir.yz *= mat2(cos(an), sin(an), -sin(an), cos(an));
  an = atan(advec.x, advec.z);
  dir.xz *= mat2(cos(an), sin(an), -sin(an), cos(an));
  return go;
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  vec2 uv = fragCoord / iResolution.xy * 2. - 1.;
  vec2 oriuv = uv;
  uv.y *= iResolution.y / iResolution.x;
  vec2 mouse = (iMouse.xy / iResolution.xy - .5) * 3.;
  if (iMouse.z < 1.) mouse = vec2(0., -0.05);
  float fov = .9 - max(0., .7 - iTime * .3);
  vec3 dir = normalize(vec3(uv * fov, 1.));
  dir.yz *= rot(mouse.y);
  dir.xz *= rot(mouse.x);
  vec3 from = origin + move(dir);
  vec3 color = raymarch(from, dir);
#ifdef BORDER
  color = mix(vec3(0.), color, pow(max(0., .95 - length(oriuv * oriuv * oriuv * vec2(1.05, 1.1))), .3));
#endif
  outColor = vec4(color, 1.);
}
`;

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Failed to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${log}`);
  }
  return shader;
}

export default function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false });
    if (!gl) {
      console.error("WebGL2 not supported");
      return;
    }

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "iTime");
    const uRes = gl.getUniformLocation(program, "iResolution");
    const uMouse = gl.getUniformLocation(program, "iMouse");

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.floor(canvas.clientWidth * dpr);
      const h = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const start = performance.now();
    let raf = 0;
    const render = () => {
      resize();
      const time = (performance.now() - start) / 1000;
      gl.uniform1f(uTime, time);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform4f(uMouse, 0, 0, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 h-full w-full"
      aria-hidden
    />
  );
}
