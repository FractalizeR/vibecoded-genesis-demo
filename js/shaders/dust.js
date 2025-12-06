// js/shaders/dust.js

import { noiseGLSL } from './noise.js';

export const dustVertexShader = `
${noiseGLSL}

uniform float uTime;
uniform float uNoiseScale;
uniform float uNoiseSpeed;
uniform float uVisibility;  // 0-1, для постепенного появления

attribute float size;
attribute float random;
attribute vec3 color;

varying vec3 vColor;
varying float vAlpha;
varying float vRandom;
varying vec2 vNoiseCoord;

void main() {
  vColor = color;
  vRandom = random;

  // Медленное движение по noise
  vec3 noisePos = position * uNoiseScale * 0.5 + uTime * uNoiseSpeed * 0.2;
  vec3 offset = curlNoise(noisePos) * 5.0;

  vec3 pos = position + offset;

  // Координаты для шума в фрагментном шейдере
  vNoiseCoord = pos.xz * 0.05 + uTime * 0.02;

  // Альфа зависит от visibility и случайности
  float baseAlpha = 0.03 + random * 0.07;  // 0.03-0.10

  // Пульсация яркости
  float pulse = sin(uTime * 0.5 + random * 6.28) * 0.2 + 1.0;
  baseAlpha *= pulse;

  vAlpha = baseAlpha * uVisibility;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  gl_PointSize = size * (350.0 / -mvPosition.z);

  gl_Position = projectionMatrix * mvPosition;
}
`;

export const dustFragmentShader = `
precision highp float;

varying vec3 vColor;
varying float vAlpha;
varying float vRandom;
varying vec2 vNoiseCoord;

// Simplex noise для внутренней структуры
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                      -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// FBM (Fractal Brownian Motion) для более детализированного шума
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  for (int i = 0; i < 4; i++) {
    value += amplitude * snoise(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }

  return value;
}

void main() {
  // Координаты относительно центра
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);

  if (dist > 0.5) discard;

  // Внутренняя структура облака с несколькими уровнями шума
  vec2 noiseUv = vNoiseCoord + center * 2.0;
  float structure = fbm(noiseUv * 3.0 + vRandom * 10.0);
  structure = structure * 0.5 + 0.5; // Нормализуем к 0-1

  // Вихревая структура
  float angle = atan(center.y, center.x);
  float spiral = sin(angle * 3.0 + dist * 10.0 + structure * 4.0) * 0.2 + 0.8;

  // Gaussian-like falloff для туманности
  float falloff = exp(-dist * dist * 6.0);

  // Комбинируем структуру
  float density = falloff * structure * spiral;

  // Цветовые вариации внутри облака
  vec3 color1 = vColor;
  vec3 color2 = vColor * 0.5 + vec3(0.2, 0.1, 0.3); // Сдвиг к фиолетовому
  vec3 color3 = vColor * 0.7 + vec3(0.1, 0.2, 0.4); // Сдвиг к синему

  // Микс цветов на основе шума
  float colorNoise = snoise(noiseUv * 2.0) * 0.5 + 0.5;
  vec3 finalColor = mix(color1, color2, colorNoise);
  finalColor = mix(finalColor, color3, structure * 0.3);

  // Яркий край (эмиссия на границах плотности)
  float edge = smoothstep(0.3, 0.5, density) * smoothstep(0.7, 0.5, density);
  finalColor += vec3(0.2, 0.1, 0.3) * edge * 0.5;

  // Финальная альфа
  float alpha = density * vAlpha;

  // Усиливаем контраст
  alpha = pow(alpha, 0.8);

  gl_FragColor = vec4(finalColor, alpha);
}
`;
