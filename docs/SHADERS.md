# Шейдеры

Все шейдеры хранятся как строки в JS файлах. Это позволяет использовать ES modules без бандлера.

---

## noise.js

Базовые noise функции, используемые другими шейдерами.

```javascript
// js/shaders/noise.js

/**
 * Simplex noise и curl noise функции
 * Основано на: https://github.com/ashima/webgl-noise
 */

export const noiseGLSL = `
//
// Simplex 3D Noise
// by Ian McEwan, Ashima Arts
//
vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
  return mod289(((x * 34.0) + 10.0) * x);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  // Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  // Permutations
  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  // Gradients
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  // Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix final noise value
  vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

//
// Curl Noise (divergence-free)
// Создаёт вихревое поле, отлично подходит для галактики
//
vec3 curlNoise(vec3 p) {
  const float e = 0.1;

  float n1 = snoise(p + vec3(e, 0.0, 0.0));
  float n2 = snoise(p - vec3(e, 0.0, 0.0));
  float n3 = snoise(p + vec3(0.0, e, 0.0));
  float n4 = snoise(p - vec3(0.0, e, 0.0));
  float n5 = snoise(p + vec3(0.0, 0.0, e));
  float n6 = snoise(p - vec3(0.0, 0.0, e));

  float x = (n4 - n3) - (n6 - n5);
  float y = (n6 - n5) - (n2 - n1);
  float z = (n2 - n1) - (n4 - n3);

  return normalize(vec3(x, y, z));
}

//
// Спиральный модификатор для галактики
// Добавляет вращательное движение вокруг оси Y
//
vec3 spiralFlow(vec3 pos, float strength) {
  float dist = length(pos.xz);
  float angle = atan(pos.z, pos.x);

  // Угловая скорость обратно пропорциональна расстоянию (как в реальной галактике)
  float angularVel = strength / (dist + 1.0);

  // Добавляем спиральный twist
  float spiralTwist = dist * 0.1;

  vec3 flow;
  flow.x = -sin(angle + spiralTwist) * angularVel;
  flow.y = 0.0;
  flow.z = cos(angle + spiralTwist) * angularVel;

  return flow;
}
`;
```

---

## starfield.js

Шейдеры для фоновых звёзд.

```javascript
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
```

---

## particles.js

Шейдеры для основных частиц галактики.

```javascript
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

  // Время с момента "рождения" частицы
  float age = max(0.0, uTime - birthTime);

  // Начальная позиция — в центре (сингулярность)
  vec3 pos = position;

  // 1. Взрыв: радиальное разлетание
  if (uExplosionForce > 0.0) {
    // Экспоненциальное затухание взрыва
    float explosionFactor = uExplosionForce * (1.0 - exp(-age * 2.0));
    pos += velocity * explosionFactor * 50.0;
  }

  // 2. Flow field: curl noise + спираль
  if (uFlowFieldStrength > 0.0) {
    // Curl noise для хаотического движения
    vec3 noisePos = pos * uNoiseScale + uTime * uNoiseSpeed;
    vec3 curl = curlNoise(noisePos) * uFlowFieldStrength * 0.5;

    // Спиральное движение вокруг центра
    vec3 spiral = spiralFlow(pos, uFlowFieldStrength * 2.0);

    // Комбинируем
    pos += (curl + spiral) * age * 0.1;
  }

  // Ограничиваем максимальное расстояние
  float dist = length(pos);
  if (dist > uMaxDistance) {
    pos = normalize(pos) * uMaxDistance;
  }

  vDistanceFromCenter = dist / uMaxDistance;

  // Мерцание
  float twinkle = sin(uTime * 3.0 + random * 6.28318) * 0.2 + 0.8;
  vAlpha = twinkle;

  // Позиционирование
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  // Размер: красные гиганты крупнее
  float sizeMultiplier = temperature < 0.3 ? 2.0 : 1.0;
  gl_PointSize = size * sizeMultiplier * (200.0 / -mvPosition.z);

  gl_Position = projectionMatrix * mvPosition;
}
`;

export const particlesFragmentShader = `
varying float vTemperature;
varying float vDistanceFromCenter;
varying float vAlpha;
varying float vRandom;

// Цвет по температуре звезды
vec3 getStarColor(float temp) {
  if (temp < 0.3) {
    // Красные гиганты: тёмно-красный → оранжевый
    return mix(
      vec3(0.8, 0.2, 0.1),
      vec3(1.0, 0.5, 0.2),
      temp / 0.3
    );
  } else if (temp < 0.7) {
    // Жёлтые/белые карлики (как Солнце)
    return mix(
      vec3(1.0, 0.9, 0.6),
      vec3(1.0, 1.0, 0.95),
      (temp - 0.3) / 0.4
    );
  } else {
    // Голубые гиганты: белый → голубовато-белый
    return mix(
      vec3(1.0, 1.0, 1.0),
      vec3(0.7, 0.85, 1.0),
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
```

---

## dust.js

Шейдеры для космической пыли.

```javascript
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
```

---

## shockwave.js

Шейдеры для расширяющихся колец.

```javascript
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
```

---

## Использование в коде

### StarfieldSystem.js

```javascript
import * as THREE from 'three';
import { starfieldVertexShader, starfieldFragmentShader } from '../shaders/starfield.js';

export class StarfieldSystem extends BaseParticleSystem {
  createMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTwinkleSpeed: { value: this.config.twinkleSpeed }
      },
      vertexShader: starfieldVertexShader,
      fragmentShader: starfieldFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
  }

  update(time) {
    this.material.uniforms.uTime.value = time;
  }
}
```

### MainParticleSystem.js

```javascript
import * as THREE from 'three';
import { particlesVertexShader, particlesFragmentShader } from '../shaders/particles.js';

export class MainParticleSystem extends BaseParticleSystem {
  createMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uExplosionForce: { value: 0 },
        uFlowFieldStrength: { value: 0 },
        uNoiseScale: { value: this.config.noiseScale },
        uNoiseSpeed: { value: this.config.noiseSpeed },
        uMaxDistance: { value: this.config.maxDistance }
      },
      vertexShader: particlesVertexShader,
      fragmentShader: particlesFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
  }

  update(time, params) {
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uExplosionForce.value = params.explosionForce || 0;
    this.material.uniforms.uFlowFieldStrength.value = params.flowFieldStrength || 0;
  }
}
```

### ShockWave.js

```javascript
import * as THREE from 'three';
import { shockwaveVertexShader, shockwaveFragmentShader } from '../shaders/shockwave.js';

export class ShockWave {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
    this.waves = [];
  }

  trigger() {
    // Создаём плоское кольцо
    const geometry = new THREE.RingGeometry(0.8, 1.0, 64);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0 },
        uMaxRadius: { value: this.config.maxRadius },
        uColor: { value: new THREE.Color(this.config.color) }
      },
      vertexShader: shockwaveVertexShader,
      fragmentShader: shockwaveFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2; // Горизонтально

    this.scene.add(mesh);
    this.waves.push({
      mesh,
      material,
      progress: 0,
      duration: this.config.duration
    });
  }

  update(deltaTime) {
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const wave = this.waves[i];
      wave.progress += deltaTime / wave.duration;
      wave.material.uniforms.uProgress.value = wave.progress;

      if (wave.progress >= 1) {
        this.scene.remove(wave.mesh);
        wave.mesh.geometry.dispose();
        wave.material.dispose();
        this.waves.splice(i, 1);
      }
    }
  }
}
```

---

## Цветовая палитра

### Звёзды по температуре

| Температура | Тип | RGB | Hex |
|-------------|-----|-----|-----|
| 0.0 | Красный гигант (холодный) | (204, 51, 26) | #CC331A |
| 0.3 | Красный гигант (тёплый) | (255, 128, 51) | #FF8033 |
| 0.3 | Жёлтый карлик (холодный) | (255, 230, 153) | #FFE699 |
| 0.7 | Белый карлик | (255, 255, 242) | #FFFFF2 |
| 0.7 | Голубой гигант (холодный) | (255, 255, 255) | #FFFFFF |
| 1.0 | Голубой гигант (горячий) | (179, 217, 255) | #B3D9FF |

### Космическая пыль

| Тип | RGB | Hex |
|-----|-----|-----|
| Фиолетовая туманность | (102, 51, 153) | #663399 |
| Синяя туманность | (51, 102, 153) | #336699 |
| Тёмная пыль | (26, 26, 51) | #1A1A33 |

### Эффекты

| Эффект | RGB | Hex |
|--------|-----|-----|
| Shock wave | (204, 230, 255) | #CCE6FF |
| Lens flare | (255, 255, 230) | #FFFFE6 |
| Singularity core | (255, 255, 255) | #FFFFFF |
