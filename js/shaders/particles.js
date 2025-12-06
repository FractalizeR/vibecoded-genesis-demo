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
uniform float uTrailStrength; // Сила эффекта следа (0-1)

attribute vec3 velocity;      // Начальное направление разлёта
attribute float size;
attribute float birthTime;
attribute float random;
attribute float temperature;  // 0-1, определяет цвет
attribute float starType;     // 0 = обычная, 1 = пульсар

varying float vTemperature;
varying float vDistanceFromCenter;
varying float vAlpha;
varying float vRandom;
varying float vStarType;
varying float vTrailFactor;   // Фактор вытягивания для трейла
varying float vSpeed;         // Скорость для трейла

void main() {
  vTemperature = temperature;
  vRandom = random;
  vStarType = starType;

  // Время жизни частицы с учётом цикла
  float timeSinceBirth = uTime - birthTime;

  // Индивидуальный lifetime для разнообразия (6-10 сек)
  float particleLifetime = uLifetime * (0.6 + random * 0.4);

  // Циклический возраст (0 → lifetime → 0 → ...)
  float age = mod(timeSinceBirth, particleLifetime);

  // Прогресс жизни частицы (0 → 1)
  float lifeProgress = age / particleLifetime;

  // Начальная позиция — в центре (сингулярность)
  vec3 pos = position;
  vec3 prevPos = position; // Для расчёта скорости

  // 1. Непрерывный разлёт от центра
  if (uExplosionForce > 0.0) {
    // Плавное ускорение в начале, замедление в конце
    float moveProgress = smoothstep(0.0, 0.3, lifeProgress);
    vec3 movement = velocity * moveProgress * uMaxDistance * 0.9;
    pos += movement;

    // Предыдущая позиция для расчёта скорости
    float prevProgress = smoothstep(0.0, 0.3, max(0.0, lifeProgress - 0.01));
    prevPos += velocity * prevProgress * uMaxDistance * 0.9;
  }

  // 2. Flow field: curl noise + спираль
  if (uFlowFieldStrength > 0.0) {
    // Curl noise для хаотического движения
    vec3 noisePos = pos * uNoiseScale + uTime * uNoiseSpeed;
    vec3 curl = curlNoise(noisePos) * uFlowFieldStrength * 0.3;

    // Спиральное движение вокруг центра
    vec3 spiral = spiralFlow(pos, uFlowFieldStrength * 0.5);

    // Комбинируем
    vec3 flowMovement = (curl + spiral) * lifeProgress;
    pos += flowMovement;
    prevPos += flowMovement * 0.95;
  }

  // Ограничиваем максимальное расстояние
  float dist = length(pos);
  if (dist > uMaxDistance) {
    pos = normalize(pos) * uMaxDistance;
  }

  vDistanceFromCenter = dist / uMaxDistance;

  // Расчёт скорости для star trails
  vec3 velocityDir = pos - prevPos;
  vSpeed = length(velocityDir) * 100.0; // Масштабируем

  // Trail factor зависит от скорости и силы взрыва
  vTrailFactor = uTrailStrength * smoothstep(0.0, 1.0, vSpeed) * uExplosionForce;

  // Fade in при рождении, fade out при "смерти"
  float fadeIn = smoothstep(0.0, 0.1, lifeProgress);
  float fadeOut = smoothstep(1.0, 0.85, lifeProgress);

  // Мерцание (обычные звёзды)
  float twinkle = sin(uTime * 3.0 + random * 6.28318) * 0.2 + 0.8;

  // Пульсары — резкие вспышки
  float pulsarFlash = 1.0;
  if (starType > 0.5) {
    float pulsarSpeed = 5.0 + random * 10.0; // Разные скорости
    pulsarFlash = pow(max(0.0, sin(uTime * pulsarSpeed + random * 6.28318)), 4.0);
    pulsarFlash = 0.3 + pulsarFlash * 0.7;
    twinkle = pulsarFlash;
  }

  vAlpha = twinkle * fadeIn * fadeOut;

  // Позиционирование
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  // Размер: красные гиганты крупнее, пульсары ярче
  float sizeMultiplier = 1.0;
  if (temperature < 0.3) sizeMultiplier = 2.0;       // Красные гиганты
  if (starType > 0.5) sizeMultiplier *= 1.5;         // Пульсары

  // Star trails: вытягиваем частицу
  float trailSize = 1.0 + vTrailFactor * 2.0;

  gl_PointSize = size * sizeMultiplier * trailSize * (200.0 / -mvPosition.z);

  gl_Position = projectionMatrix * mvPosition;
}
`;

export const particlesFragmentShader = `
precision highp float;

varying float vTemperature;
varying float vDistanceFromCenter;
varying float vAlpha;
varying float vRandom;
varying float vStarType;
varying float vTrailFactor;
varying float vSpeed;

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
  // Координаты относительно центра точки
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);

  // Star trails: вытягиваем форму
  // При высокой скорости форма становится эллипсом
  float trailStretch = 1.0 + vTrailFactor * 1.5;
  vec2 stretchedCenter = center;
  stretchedCenter.y *= trailStretch; // Вытягиваем по Y
  float stretchedDist = length(stretchedCenter);

  if (stretchedDist > 0.5) discard;

  // Мягкие края с ярким центром
  float coreBrightness = smoothstep(0.5, 0.0, stretchedDist);
  float edgeFade = smoothstep(0.5, 0.3, stretchedDist);

  // Цвет по температуре
  vec3 color = getStarColor(vTemperature);

  // Пульсары — голубоватые
  if (vStarType > 0.5) {
    color = mix(color, vec3(0.5, 0.8, 1.0), 0.5);
  }

  // Ярче в центре галактики
  float centerBoost = 1.0 + (1.0 - vDistanceFromCenter) * 0.5;

  // Trail: хвост темнее головы
  float trailGradient = 1.0 - (center.y + 0.5) * vTrailFactor * 0.5;
  trailGradient = clamp(trailGradient, 0.5, 1.0);

  // Финальный цвет
  vec3 finalColor = color * coreBrightness * centerBoost * trailGradient;

  // Альфа
  float alpha = edgeFade * vAlpha;

  gl_FragColor = vec4(finalColor, alpha);
}
`;
