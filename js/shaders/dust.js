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

void main() {
  vColor = color;

  // Медленное движение по noise
  vec3 noisePos = position * uNoiseScale * 0.5 + uTime * uNoiseSpeed * 0.2;
  vec3 offset = curlNoise(noisePos) * 5.0;

  vec3 pos = position + offset;

  // Альфа зависит от visibility и случайности
  float baseAlpha = 0.02 + random * 0.06;  // 0.02-0.08
  vAlpha = baseAlpha * uVisibility;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  gl_PointSize = size * (300.0 / -mvPosition.z);

  gl_Position = projectionMatrix * mvPosition;
}
`;

export const dustFragmentShader = `
precision highp float;

varying vec3 vColor;
varying float vAlpha;

void main() {
  // Очень мягкие края
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);

  if (dist > 0.5) discard;

  // Gaussian-like falloff для туманности
  float alpha = exp(-dist * dist * 8.0) * vAlpha;

  gl_FragColor = vec4(vColor, alpha);
}
`;
