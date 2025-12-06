// js/shaders/shockwave.js

export const shockwaveVertexShader = `
uniform float uProgress;     // 0-1, прогресс расширения
uniform float uMaxRadius;

varying vec2 vUv;

void main() {
  vUv = uv;

  // Масштабируем кольцо по прогрессу
  float scale = uProgress * uMaxRadius;

  vec3 pos = position * scale;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const shockwaveFragmentShader = `
precision highp float;

uniform float uProgress;
uniform vec3 uColor;

varying vec2 vUv;

void main() {
  // Расстояние от центра UV
  vec2 center = vUv - 0.5;
  float dist = length(center) * 2.0;  // 0-1 от центра к краю

  // Кольцо: яркость максимальна на определённом радиусе
  float ringWidth = 0.1;
  float ringRadius = 0.8;  // Близко к краю
  float ring = smoothstep(ringRadius - ringWidth, ringRadius, dist)
             * smoothstep(ringRadius + ringWidth, ringRadius, dist);

  // Альфа затухает с прогрессом
  float alpha = ring * (1.0 - uProgress) * 0.8;

  // Свечение в центре кольца
  vec3 color = uColor + vec3(0.2) * ring;

  gl_FragColor = vec4(color, alpha);
}
`;
