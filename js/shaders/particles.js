// js/shaders/particles.js

import { noiseGLSL } from './noise.js';

export const particlesVertexShader = `
${noiseGLSL}

uniform float uTime;
uniform float uExplosionForce;
uniform float uFlowFieldStrength;
uniform float uNoiseScale;
uniform float uNoiseSpeed;
uniform float uMaxDistance;
uniform float uLifetime;      // Время жизни частицы (для цикла)

attribute vec3 velocity;      // Начальное направление разлёта
attribute float size;
attribute float birthTime;
attribute float random;
attribute float temperature;  // 0-1, определяет цвет

varying float vTemperature;
varying float vDistanceFromCenter;
varying float vAlpha;
varying float vRandom;

void main() {
  vTemperature = temperature;
  vRandom = random;

  // Время жизни частицы с учётом цикла
  // После взрыва частицы непрерывно рождаются и улетают
  float timeSinceBirth = uTime - birthTime;

  // Индивидуальный lifetime для разнообразия (6-10 сек)
  float particleLifetime = uLifetime * (0.6 + random * 0.4);

  // Циклический возраст (0 → lifetime → 0 → ...)
  float age = mod(timeSinceBirth, particleLifetime);

  // Прогресс жизни частицы (0 → 1)
  float lifeProgress = age / particleLifetime;

  // Начальная позиция — в центре (сингулярность)
  vec3 pos = position;

  // 1. Непрерывный разлёт от центра
  // Частица летит от центра к краю за время lifetime
  if (uExplosionForce > 0.0) {
    // Плавное ускорение в начале, замедление в конце
    float moveProgress = smoothstep(0.0, 0.3, lifeProgress);
    pos += velocity * moveProgress * uMaxDistance * 0.9;
  }

  // 2. Flow field: curl noise + спираль
  if (uFlowFieldStrength > 0.0) {
    // Curl noise для хаотического движения
    vec3 noisePos = pos * uNoiseScale + uTime * uNoiseSpeed;
    vec3 curl = curlNoise(noisePos) * uFlowFieldStrength * 0.3;

    // Спиральное движение вокруг центра
    vec3 spiral = spiralFlow(pos, uFlowFieldStrength * 0.5);

    // Комбинируем
    pos += (curl + spiral) * lifeProgress;
  }

  // Ограничиваем максимальное расстояние
  float dist = length(pos);
  if (dist > uMaxDistance) {
    pos = normalize(pos) * uMaxDistance;
  }

  vDistanceFromCenter = dist / uMaxDistance;

  // Fade in при рождении, fade out при "смерти"
  float fadeIn = smoothstep(0.0, 0.1, lifeProgress);
  float fadeOut = smoothstep(1.0, 0.85, lifeProgress);

  // Мерцание
  float twinkle = sin(uTime * 3.0 + random * 6.28318) * 0.2 + 0.8;
  vAlpha = twinkle * fadeIn * fadeOut;

  // Позиционирование
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  // Размер: красные гиганты крупнее
  float sizeMultiplier = temperature < 0.3 ? 2.0 : 1.0;
  gl_PointSize = size * sizeMultiplier * (200.0 / -mvPosition.z);

  gl_Position = projectionMatrix * mvPosition;
}
`;

export const particlesFragmentShader = `
precision highp float;

varying float vTemperature;
varying float vDistanceFromCenter;
varying float vAlpha;
varying float vRandom;

// Цвет по температуре звезды (реалистичная шкала Планка)
vec3 getStarColor(float temp) {
  if (temp < 0.3) {
    // Красные гиганты: насыщенный красный → оранжевый
    return mix(
      vec3(1.0, 0.3, 0.1),
      vec3(1.0, 0.6, 0.2),
      temp / 0.3
    );
  } else if (temp < 0.7) {
    // Жёлтые/белые карлики (как Солнце): оранжево-жёлтый → бледно-жёлтый
    return mix(
      vec3(1.0, 0.8, 0.4),
      vec3(1.0, 0.95, 0.8),
      (temp - 0.3) / 0.4
    );
  } else {
    // Голубые гиганты: бело-голубой → насыщенный голубой
    return mix(
      vec3(0.8, 0.9, 1.0),
      vec3(0.5, 0.7, 1.0),
      (temp - 0.7) / 0.3
    );
  }
}

void main() {
  // Круглая форма
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);

  if (dist > 0.5) discard;

  // Мягкие края с ярким центром
  float coreBrightness = smoothstep(0.5, 0.0, dist);
  float edgeFade = smoothstep(0.5, 0.3, dist);

  // Цвет по температуре
  vec3 color = getStarColor(vTemperature);

  // Ярче в центре галактики
  float centerBoost = 1.0 + (1.0 - vDistanceFromCenter) * 0.5;

  // Финальный цвет
  vec3 finalColor = color * coreBrightness * centerBoost;

  // Альфа
  float alpha = edgeFade * vAlpha;

  gl_FragColor = vec4(finalColor, alpha);
}
`;
