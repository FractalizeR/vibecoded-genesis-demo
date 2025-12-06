// js/shaders/starfield.js

export const starfieldVertexShader = `
uniform float uTime;
uniform float uTwinkleSpeed;

attribute float size;
attribute float random;

varying float vAlpha;

void main() {
  // Мерцание через sin с рандомным offset
  float twinkle = sin(uTime * uTwinkleSpeed + random * 6.28318) * 0.3 + 0.7;
  vAlpha = twinkle;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  // Размер зависит от расстояния (перспектива)
  gl_PointSize = size * (300.0 / -mvPosition.z);

  gl_Position = projectionMatrix * mvPosition;
}
`;

export const starfieldFragmentShader = `
precision highp float;

varying float vAlpha;

void main() {
  // Круглая форма звезды
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);

  if (dist > 0.5) discard;

  // Мягкие края
  float alpha = smoothstep(0.5, 0.2, dist) * vAlpha;

  // Белый цвет с лёгким голубым оттенком
  vec3 color = vec3(0.95, 0.97, 1.0);

  gl_FragColor = vec4(color, alpha);
}
`;
