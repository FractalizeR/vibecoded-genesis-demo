# Структуры данных

## Фазы (Phase)

```typescript
interface Phase {
  name: string;           // 'intro' | 'darkness' | 'singularity' | 'bigbang' | 'expansion' | 'galaxy'
  duration: number;       // Длительность в секундах (Infinity для последней фазы)
  start: number;          // Время начала (вычисляется автоматически)
  label: string | null;   // Текст для UI или null
}
```

**Порядок фаз:**
| index | name | duration | start | label |
|-------|------|----------|-------|-------|
| 0 | intro | 1 | 0 | null |
| 1 | darkness | 2 | 1 | null |
| 2 | singularity | 1 | 3 | "SINGULARITY" |
| 3 | bigbang | 2 | 4 | "BIG BANG" |
| 4 | expansion | 10 | 6 | "EXPANSION" |
| 5 | galaxy | Infinity | 16 | null |

---

## События EventBus

### phase:changed

```typescript
interface PhaseChangedEvent {
  from: string;           // Имя предыдущей фазы
  to: string;             // Имя новой фазы
  label: string | null;   // Label новой фазы
}
```

**Пример:**
```javascript
eventBus.on('phase:changed', ({ from, to, label }) => {
  console.log(`Phase: ${from} -> ${to}`);
  if (label) {
    phaseDisplay.show(label);
  }
});
```

### bigbang:start

```typescript
// Событие без данных
eventBus.emit('bigbang:start');
```

**Триггер:** Момент начала фазы bigbang (t = 4s)

### shockwave:trigger

```typescript
interface ShockwaveTriggerEvent {
  index: number;          // Номер кольца (0, 1, 2)
}
```

**Триггеры:** t = 4.0s, t = 4.4s, t = 4.8s

---

## BufferGeometry атрибуты

### StarfieldSystem

| Атрибут | Тип | itemSize | Описание |
|---------|-----|----------|----------|
| position | Float32Array | 3 | Позиция на сфере (x, y, z) |
| size | Float32Array | 1 | Размер точки (1-3) |
| random | Float32Array | 1 | Случайное значение 0-1 для мерцания |

**Генерация позиций (равномерно на сфере):**
```javascript
function randomPointOnSphere(minRadius, maxRadius) {
  const radius = minRadius + Math.random() * (maxRadius - minRadius);
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);

  return {
    x: radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.sin(phi) * Math.sin(theta),
    z: radius * Math.cos(phi)
  };
}
```

---

### MainParticleSystem

| Атрибут | Тип | itemSize | Описание |
|---------|-----|----------|----------|
| position | Float32Array | 3 | Начальная позиция (около центра) |
| velocity | Float32Array | 3 | Направление разлёта (нормализованное) |
| size | Float32Array | 1 | Базовый размер (1-3) |
| birthTime | Float32Array | 1 | Время появления (staggered, 0-0.5s) |
| random | Float32Array | 1 | Случайное значение 0-1 |
| temperature | Float32Array | 1 | Температура звезды 0-1 |

**Генерация начальных позиций (в сингулярности):**
```javascript
function generateParticleAttributes(count, config) {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const birthTimes = new Float32Array(count);
  const randoms = new Float32Array(count);
  const temperatures = new Float32Array(count);

  // Стратифицированное распределение температур
  const redCount = Math.floor(count * 0.05);       // 5% красных
  const blueCount = Math.floor(count * 0.25);      // 25% голубых
  const yellowCount = count - redCount - blueCount; // 70% жёлтых

  // Заполняем массив температур
  let tempIndex = 0;
  for (let i = 0; i < redCount; i++) {
    temperatures[tempIndex++] = Math.random() * 0.3;  // 0-0.3
  }
  for (let i = 0; i < blueCount; i++) {
    temperatures[tempIndex++] = 0.7 + Math.random() * 0.3;  // 0.7-1.0
  }
  for (let i = 0; i < yellowCount; i++) {
    temperatures[tempIndex++] = 0.3 + Math.random() * 0.4;  // 0.3-0.7
  }

  // Shuffle temperatures для случайного распределения в пространстве
  shuffleArray(temperatures);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    // Позиция: маленький шар в центре
    const r = Math.random() * config.spawnRadius;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = r * Math.cos(phi);

    // Velocity: направление от центра (для взрыва)
    const vx = positions[i3];
    const vy = positions[i3 + 1];
    const vz = positions[i3 + 2];
    const vLen = Math.sqrt(vx*vx + vy*vy + vz*vz) || 1;

    velocities[i3] = vx / vLen + (Math.random() - 0.5) * 0.3;
    velocities[i3 + 1] = vy / vLen + (Math.random() - 0.5) * 0.3;
    velocities[i3 + 2] = vz / vLen + (Math.random() - 0.5) * 0.3;

    // Size: красные гиганты крупнее (но это в шейдере)
    sizes[i] = 1 + Math.random() * 2;

    // Birth time: staggered появление
    birthTimes[i] = Math.random() * 0.5;

    // Random для мерцания
    randoms[i] = Math.random();
  }

  return { positions, velocities, sizes, birthTimes, randoms, temperatures };
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
```

---

### DustCloudSystem

| Атрибут | Тип | itemSize | Описание |
|---------|-----|----------|----------|
| position | Float32Array | 3 | Позиция в пространстве галактики |
| size | Float32Array | 1 | Размер (10-50) |
| random | Float32Array | 1 | Случайное значение 0-1 |
| color | Float32Array | 3 | RGB цвет (приглушённые оттенки) |

**Генерация:**
```javascript
function generateDustAttributes(count, config) {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const randoms = new Float32Array(count);
  const colors = new Float32Array(count * 3);

  // Цвета пыли
  const dustColors = [
    [0.4, 0.2, 0.6],   // Фиолетовый
    [0.2, 0.4, 0.6],   // Синий
    [0.1, 0.1, 0.2],   // Тёмный
  ];

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    // Позиция: распределение в диске галактики
    const r = 10 + Math.random() * 70;  // 10-80 единиц от центра
    const theta = Math.random() * Math.PI * 2;
    const height = (Math.random() - 0.5) * 10;  // Небольшая высота

    positions[i3] = r * Math.cos(theta);
    positions[i3 + 1] = height;
    positions[i3 + 2] = r * Math.sin(theta);

    // Size
    sizes[i] = config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0]);

    // Random
    randoms[i] = Math.random();

    // Color: случайный из палитры
    const colorIndex = Math.floor(Math.random() * dustColors.length);
    colors[i3] = dustColors[colorIndex][0];
    colors[i3 + 1] = dustColors[colorIndex][1];
    colors[i3 + 2] = dustColors[colorIndex][2];
  }

  return { positions, sizes, randoms, colors };
}
```

---

## Uniforms шейдеров

### starfield.js

| Uniform | Тип | Значение | Описание |
|---------|-----|----------|----------|
| uTime | float | globalTime | Текущее время |
| uTwinkleSpeed | float | 2.0 | Скорость мерцания |

### particles.js

| Uniform | Тип | Диапазон | Описание |
|---------|-----|----------|----------|
| uTime | float | 0+ | Текущее время |
| uExplosionForce | float | 0-1 | Сила взрыва (пик в bigbang) |
| uFlowFieldStrength | float | 0-1 | Сила flow field (нарастает в expansion) |
| uNoiseScale | float | 0.02 | Масштаб noise |
| uNoiseSpeed | float | 0.3 | Скорость изменения noise |
| uMaxDistance | float | 80 | Максимальное расстояние от центра |

### dust.js

| Uniform | Тип | Диапазон | Описание |
|---------|-----|----------|----------|
| uTime | float | 0+ | Текущее время |
| uNoiseScale | float | 0.01 | Масштаб noise |
| uNoiseSpeed | float | 0.1 | Скорость noise |
| uVisibility | float | 0-1 | Видимость (для fade in) |

### shockwave.js

| Uniform | Тип | Диапазон | Описание |
|---------|-----|----------|----------|
| uProgress | float | 0-1 | Прогресс расширения |
| uMaxRadius | float | 100 | Максимальный радиус |
| uColor | vec3 | RGB | Цвет кольца |

---

## Параметры TimelineController

### Формулы вычисления

```javascript
// Fade: 1->0 в фазе intro
getFadeOpacity() {
  if (this.globalTime >= 1) return 0;
  return 1 - this.globalTime;
}

// Singularity glow: 0->1 в фазе singularity
getSingularityGlow() {
  const phase = this.getCurrentPhase();
  if (phase.name === 'singularity') {
    return easeInOutQuad(this.getPhaseProgress());
  }
  if (phase.name === 'bigbang') {
    return 1;  // Пик
  }
  if (phase.name === 'expansion' || phase.name === 'galaxy') {
    return 0.3;  // Остаточное свечение ядра
  }
  return 0;
}

// Explosion force: пик в начале bigbang, затухает
getExplosionForce() {
  const phase = this.getCurrentPhase();
  if (phase.name !== 'bigbang' && phase.name !== 'expansion') return 0;

  const timeSinceBang = this.globalTime - 4;  // bigbang начинается в t=4
  if (timeSinceBang < 0) return 0;

  // Быстрое нарастание, медленное затухание
  return Math.exp(-timeSinceBang * 0.5);
}

// Flow field: 0->1 в expansion
getFlowFieldStrength() {
  const phase = this.getCurrentPhase();
  if (phase.name === 'expansion') {
    return easeInOutCubic(this.getPhaseProgress());
  }
  if (phase.name === 'galaxy') {
    return 1;
  }
  return 0;
}

// Bloom: базовое значение + пик в bigbang
getBloomStrength() {
  const phase = this.getCurrentPhase();
  const base = 1.5;

  if (phase.name === 'bigbang') {
    const progress = this.getPhaseProgress();
    // Быстрый пик в начале
    const peak = 1.5 * Math.exp(-progress * 3);
    return base + peak;
  }

  return base;
}
```

---

## Типы для TypeScript (справка)

```typescript
// config.js
interface Config {
  PHASES: Phase[];
  PARTICLES: ParticlesConfig;
  DUST: DustConfig;
  STARFIELD: StarfieldConfig;
  BLOOM: BloomConfig;
  CAMERA: CameraConfig;
  EFFECTS: EffectsConfig;
  UI: UIConfig;
}

interface ParticlesConfig {
  count: number;
  spawnRadius: number;
  maxDistance: number;
  noiseScale: number;
  noiseSpeed: number;
  twinkleSpeed: number;
}

interface DustConfig {
  count: number;
  sizeRange: [number, number];
  alphaRange: [number, number];
  noiseScale: number;
  noiseSpeed: number;
}

interface StarfieldConfig {
  count: number;
  distanceRange: [number, number];
  twinkleSpeed: number;
}

interface BloomConfig {
  strength: number;
  radius: number;
  threshold: number;
}

interface CameraConfig {
  fov: number;
  near: number;
  far: number;
  position: [number, number, number];
  sensitivity: number;
  damping: number;
  autoRotateSpeed: number;
  zoomRange: [number, number];
  zoomSpeed: number;
}

interface EffectsConfig {
  shake: {
    intensity: number;
    duration: number;
  };
  lensFlare: {
    duration: number;
  };
  shockWave: {
    count: number;
    interval: number;
    maxRadius: number;
    duration: number;
    color: [number, number, number];
  };
  singularity: {
    baseSize: number;
    glowColor: [number, number, number];
  };
}

interface UIConfig {
  fadeDuration: number;
  phaseDisplayDuration: number;
  hintDelay: number;
}
```
