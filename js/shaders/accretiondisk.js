// js/shaders/accretiondisk.js

/**
 * Шейдеры для аккреционного диска
 * Светящееся вращающееся кольцо вокруг центра галактики
 */

export const accretionDiskVertexShader = `
uniform float uTime;
uniform float uRotationSpeed;

varying vec2 vUv;
varying float vAngle;

void main() {
  vUv = uv;

  // Вычисляем угол для определения яркости
  vAngle = atan(position.y, position.x);

  // Вращение диска
  float angle = uTime * uRotationSpeed;
  float c = cos(angle);
  float s = sin(angle);
  vec3 rotatedPosition = vec3(
    position.x * c - position.z * s,
    position.y,
    position.x * s + position.z * c
  );

  gl_Position = projectionMatrix * modelViewMatrix * vec4(rotatedPosition, 1.0);
}
`;

export const accretionDiskFragmentShader = `
uniform float uTime;
uniform float uOpacity;
uniform vec3 uInnerColor;
uniform vec3 uOuterColor;
uniform float uNoiseScale;

varying vec2 vUv;
varying float vAngle;

// Simplex noise
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
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                          + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                          dot(x12.zw,x12.zw)), 0.0);
  m = m*m;
  m = m*m;
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

void main() {
  // Расстояние от центра UV (0.5, 0.5)
  vec2 center = vUv - 0.5;
  float dist = length(center) * 2.0;

  // Создаём кольцо (диск с дыркой в центре)
  float innerRadius = 0.2;
  float outerRadius = 1.0;

  float ring = smoothstep(innerRadius, innerRadius + 0.1, dist) *
               smoothstep(outerRadius, outerRadius - 0.2, dist);

  if (ring < 0.01) discard;

  // Угол для создания спиральных структур
  float angle = atan(center.y, center.x);

  // Шум для неоднородности
  float noise1 = snoise(vec2(angle * 3.0 + uTime * 0.5, dist * 10.0)) * 0.3;
  float noise2 = snoise(vec2(angle * 7.0 - uTime * 0.3, dist * 5.0 + uTime * 0.2)) * 0.2;

  // Спиральные рукава
  float spiral = sin(angle * 2.0 + dist * 10.0 - uTime * 2.0) * 0.3 + 0.7;

  // Яркость: ярче к центру
  float brightness = (1.0 - dist) * 0.5 + 0.5;
  brightness *= spiral;
  brightness += noise1 + noise2;
  brightness = clamp(brightness, 0.0, 1.0);

  // Цвет: градиент от внутреннего (горячего) к внешнему (холодному)
  float colorMix = smoothstep(innerRadius, outerRadius, dist);
  vec3 color = mix(uInnerColor, uOuterColor, colorMix);

  // Добавляем яркий край у внутренней границы
  float innerGlow = smoothstep(innerRadius + 0.15, innerRadius, dist);
  color += vec3(1.0, 0.8, 0.5) * innerGlow * 0.5;

  // Финальная альфа
  float alpha = ring * brightness * uOpacity;

  gl_FragColor = vec4(color * brightness, alpha);
}
`;
