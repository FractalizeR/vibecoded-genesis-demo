# Архитектура проекта

## Принципы

1. **Single Responsibility** — каждый модуль отвечает за одну задачу
2. **Dependency Injection** — зависимости передаются через конструктор
3. **Configuration Driven** — параметры вынесены в config, не захардкожены
4. **Шейдеры как строки** — GLSL код хранится в JS файлах (не требует бандлера)

---

## Структура файлов

```
genesis-demo/
├── index.html                 # Точка входа
├── style.css                  # Fullscreen canvas + UI стили
├── package.json               # Для тестов (vitest)
├── js/
│   ├── main.js                # Bootstrap, game loop
│   ├── config.js              # Все параметры и константы
│   ├── core/
│   │   ├── TimelineController.js   # Управление фазами
│   │   ├── EventBus.js             # Pub/sub для коммуникации
│   │   └── Easing.js               # Функции плавности
│   ├── rendering/
│   │   ├── SceneManager.js         # Инициализация Three.js
│   │   ├── PostProcessing.js       # Bloom
│   │   └── CameraController.js     # Mouse look + auto-rotate
│   ├── particles/
│   │   ├── BaseParticleSystem.js   # Абстрактный базовый класс
│   │   ├── StarfieldSystem.js      # Фоновые далёкие звёзды
│   │   ├── MainParticleSystem.js   # Основные частицы галактики
│   │   └── DustCloudSystem.js      # Космическая пыль
│   ├── effects/
│   │   ├── Singularity.js          # Центральное ядро
│   │   ├── ScreenShake.js          # Тряска при взрыве
│   │   ├── LensFlare.js            # Вспышка при взрыве
│   │   └── ShockWave.js            # Расширяющиеся кольца
│   ├── ui/
│   │   ├── PhaseDisplay.js         # Отображение названия фазы
│   │   ├── FadeOverlay.js          # Fade in/out эффект
│   │   └── HintDisplay.js          # Подсказка для пользователя
│   └── shaders/
│       ├── noise.js                # Simplex noise, curl noise
│       ├── starfield.js            # Шейдеры фоновых звёзд
│       ├── particles.js            # Шейдеры основных частиц
│       ├── dust.js                 # Шейдеры пыли
│       └── shockwave.js            # Шейдеры колец
├── test/
│   ├── setup.js                    # Моки для Three.js
│   ├── Easing.test.js
│   ├── EventBus.test.js
│   ├── TimelineController.test.js
│   └── config.test.js
└── docs/
    ├── ARCHITECTURE.md             # Этот файл
    ├── SHADERS.md
    ├── DATA_STRUCTURES.md
    ├── CONFIG.md
    ├── TESTING.md
    └── CHECKLIST.md
```

---

## index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Genesis — Flow Field Galaxy</title>
  <script type="importmap">
    {
      "imports": {
        "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
        "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
      }
    }
  </script>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <canvas id="canvas"></canvas>
  <div id="ui-container">
    <div id="fade-overlay"></div>
    <div id="phase-display"></div>
    <div id="hint-display"></div>
  </div>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

---

## style.css

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000;
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

#canvas {
  display: block;
  width: 100%;
  height: 100%;
}

#ui-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* Fade overlay */
#fade-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000;
  opacity: 1;
  transition: opacity 0.1s linear;
  z-index: 100;
}

/* Phase display */
#phase-display {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: rgba(255, 255, 255, 0.9);
  font-size: 24px;
  font-weight: 300;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  opacity: 0;
  transition: opacity 0.5s ease-in-out;
  z-index: 50;
}

#phase-display.visible {
  opacity: 1;
}

/* Hint display */
#hint-display {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  font-weight: 300;
  letter-spacing: 0.1em;
  opacity: 0;
  transition: opacity 0.5s ease-in-out;
  z-index: 50;
}

#hint-display.visible {
  opacity: 1;
}

/* Error message */
.error {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #ff4444;
  font-size: 18px;
  text-align: center;
}
```

---

## Спецификация модулей

### core/Easing.js

**Назначение:** Функции плавности для анимаций.

**Экспорты:**
```javascript
export function linear(t) { return t; }
export function easeInQuad(t) { return t * t; }
export function easeOutQuad(t) { return t * (2 - t); }
export function easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
export function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
export function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
export function smoothstep(t) { return t * t * (3 - 2 * t); }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
```

---

### core/EventBus.js

**Назначение:** Слабое связывание компонентов через события.

**Интерфейс:**
```javascript
export class EventBus {
  constructor()
  on(event, callback)      // Подписаться
  off(event, callback)     // Отписаться
  emit(event, data)        // Отправить событие
}
```

**Поведение:**
- Порядок вызова: FIFO (в порядке подписки)
- Если callback бросает ошибку — остальные всё равно вызываются

---

### core/TimelineController.js

**Назначение:** Управление фазами сценария.

**Зависимости:** `config.PHASES`, `Easing`, `EventBus`

**Интерфейс:**
```javascript
export class TimelineController {
  constructor(phases, eventBus)

  update(deltaTime)           // Вызывать каждый кадр
  getCurrentPhase()           // Текущая фаза {name, duration, start, label}
  getPhaseProgress()          // 0-1 прогресс в текущей фазе
  getGlobalTime()             // Общее время с начала
  getCurrentLabel()           // Текст для UI или null

  // Параметры анимации (чистые функции от времени):
  getFadeOpacity()            // 1→0 в intro
  getSingularityGlow()        // 0→1 в singularity
  getExplosionForce()         // Пик в bigbang, затем затухает
  getFlowFieldStrength()      // 0→1 в expansion
  getBloomStrength()          // Базовое значение + пик в bigbang
  getShakeIntensity()         // Значение для ScreenShake

  isParticlesVisible()        // true после t=4s (bigbang)
  isDustVisible()             // true после t=6s (expansion)
  isStarfieldVisible()        // true после t=1s (после intro)
}
```

**События:**
- `phase:changed` — `{ from, to, label }`
- `bigbang:start` — момент взрыва
- `shockwave:trigger` — запуск очередного кольца (3 раза с интервалом 0.4s)

---

### rendering/SceneManager.js

**Назначение:** Инициализация Three.js.

**Интерфейс:**
```javascript
export class SceneManager {
  constructor(canvas, config)

  getScene()       // THREE.Scene
  getCamera()      // THREE.PerspectiveCamera
  getRenderer()    // THREE.WebGLRenderer

  onResize()       // Обработка изменения размера окна
  dispose()        // Очистка ресурсов
}
```

**Настройки renderer:**
```javascript
{
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance'
}
```

---

### rendering/CameraController.js

**Назначение:** Управление камерой.

**Интерфейс:**
```javascript
export class CameraController {
  constructor(camera, domElement, config)

  update(deltaTime)                    // Обновление каждый кадр
  setAutoRotate(enabled)               // Включить/выключить авторотацию
  applyShake(offsetX, offsetY, offsetZ) // Применить смещение от тряски

  dispose()
}
```

**Состояния:**
1. **Auto-rotate** — до первого клика, медленное вращение вокруг центра
2. **User control** — после клика, drag для вращения
3. **Zoom** — wheel изменяет FOV

---

### rendering/PostProcessing.js

**Назначение:** Bloom эффект.

**Зависимости:** `three/addons/postprocessing/EffectComposer.js`, `three/addons/postprocessing/UnrealBloomPass.js`

**Интерфейс:**
```javascript
export class PostProcessing {
  constructor(renderer, scene, camera, config)

  setBloomStrength(value)              // Установить силу bloom
  render()                             // Рендер с постобработкой
  onResize(width, height)              // Обработка resize
}
```

---

### particles/BaseParticleSystem.js

**Назначение:** Базовый класс для систем частиц.

**Интерфейс:**
```javascript
export class BaseParticleSystem {
  constructor(config) {
    if (new.target === BaseParticleSystem) {
      throw new Error('BaseParticleSystem is abstract');
    }
  }

  // Переопределяемые методы:
  createGeometry() { throw new Error('Must implement'); }
  createMaterial() { throw new Error('Must implement'); }

  // Базовые методы:
  init()                              // Создаёт Points, возвращает THREE.Points
  update(time, params)                // Обновляет uniforms
  setVisible(visible)                 // Показать/скрыть
  dispose()                           // Очистка ресурсов
}
```

---

### particles/StarfieldSystem.js

**Назначение:** Статичные далёкие звёзды.

**Особенности:**
- ~5000 частиц на сфере радиусом 200-500 единиц
- Простой шейдер без noise
- Мерцание через sin(time + random)

---

### particles/MainParticleSystem.js

**Назначение:** Основные звёзды галактики.

**Особенности:**
- ~150000 частиц
- Начинают в центре (r ≈ 0)
- Атрибуты: position, velocity, size, birthTime, random, temperature
- Цвет зависит от temperature (см. [SHADERS.md](SHADERS.md#particles))

---

### particles/DustCloudSystem.js

**Назначение:** Космическая пыль.

**Особенности:**
- ~3000 крупных частиц
- Очень низкая alpha (0.02-0.08)
- Независимый медленный noise

---

### effects/Singularity.js

**Назначение:** Центральное ядро.

**Интерфейс:**
```javascript
export class Singularity {
  constructor(scene, config)

  update(glow, phase, progress)       // glow: 0-1
  dispose()
}
```

**Реализация:** THREE.Sprite или THREE.Mesh с glowing материалом.

---

### effects/ScreenShake.js

**Назначение:** Тряска камеры.

**Интерфейс:**
```javascript
export class ScreenShake {
  constructor()

  trigger(intensity, duration)        // Запустить тряску
  update(deltaTime)                   // Обновить (возвращает {x, y, z} смещение)
  isActive()                          // Активна ли тряска
}
```

---

### effects/LensFlare.js

**Назначение:** Вспышка при взрыве.

**Интерфейс:**
```javascript
export class LensFlare {
  constructor(scene)

  trigger(duration)                   // Запустить вспышку
  update(deltaTime)
  dispose()
}
```

**Реализация:** Fullscreen sprite или overlay с аддитивным blending.

---

### effects/ShockWave.js

**Назначение:** Расширяющиеся кольца.

**Интерфейс:**
```javascript
export class ShockWave {
  constructor(scene, config)

  trigger()                           // Запустить одно кольцо
  triggerSequence(count, interval)    // Несколько колец
  update(deltaTime)
  dispose()
}
```

**Реализация:** THREE.RingGeometry с шейдером, расширяется от центра, alpha затухает.

---

### ui/FadeOverlay.js

**Интерфейс:**
```javascript
export class FadeOverlay {
  constructor(element)                // #fade-overlay

  setOpacity(value)                   // 0-1, мгновенно
}
```

---

### ui/PhaseDisplay.js

**Интерфейс:**
```javascript
export class PhaseDisplay {
  constructor(element, eventBus)      // #phase-display

  show(text)                          // Показать текст
  hide()                              // Скрыть
  dispose()
}
```

**Поведение:** Подписывается на `phase:changed`, показывает label фазы.

---

### ui/HintDisplay.js

**Интерфейс:**
```javascript
export class HintDisplay {
  constructor(element)                // #hint-display

  show(text)                          // Показать текст
  hide()                              // Скрыть
}
```

---

## main.js — структура

```javascript
import * as THREE from 'three';
import { config } from './config.js';
import { EventBus } from './core/EventBus.js';
import { TimelineController } from './core/TimelineController.js';
import { SceneManager } from './rendering/SceneManager.js';
import { CameraController } from './rendering/CameraController.js';
import { PostProcessing } from './rendering/PostProcessing.js';
import { StarfieldSystem } from './particles/StarfieldSystem.js';
import { MainParticleSystem } from './particles/MainParticleSystem.js';
import { DustCloudSystem } from './particles/DustCloudSystem.js';
import { Singularity } from './effects/Singularity.js';
import { ScreenShake } from './effects/ScreenShake.js';
import { LensFlare } from './effects/LensFlare.js';
import { ShockWave } from './effects/ShockWave.js';
import { FadeOverlay } from './ui/FadeOverlay.js';
import { PhaseDisplay } from './ui/PhaseDisplay.js';
import { HintDisplay } from './ui/HintDisplay.js';

// 1. Инициализация
const canvas = document.getElementById('canvas');
const eventBus = new EventBus();
const sceneManager = new SceneManager(canvas, config);
const { scene, camera, renderer } = sceneManager;

// 2. Проверка WebGL
if (!renderer.capabilities.isWebGL2) {
  document.body.innerHTML = '<div class="error">WebGL 2 required</div>';
  throw new Error('WebGL 2 not supported');
}

// 3. Создание компонентов
const timeline = new TimelineController(config.PHASES, eventBus);
const cameraController = new CameraController(camera, canvas, config.CAMERA);
const postProcessing = new PostProcessing(renderer, scene, camera, config.BLOOM);
const screenShake = new ScreenShake();
const lensFlare = new LensFlare(scene);
const shockWave = new ShockWave(scene, config.EFFECTS.shockWave);
const singularity = new Singularity(scene, config.EFFECTS.singularity);

// Particle systems
const starfield = new StarfieldSystem(config.STARFIELD);
scene.add(starfield.init());

const mainParticles = new MainParticleSystem(config.PARTICLES);
scene.add(mainParticles.init());

const dustClouds = new DustCloudSystem(config.DUST);
scene.add(dustClouds.init());

// UI
const fadeOverlay = new FadeOverlay(document.getElementById('fade-overlay'));
const phaseDisplay = new PhaseDisplay(document.getElementById('phase-display'), eventBus);
const hintDisplay = new HintDisplay(document.getElementById('hint-display'));

// 4. События
eventBus.on('bigbang:start', () => {
  screenShake.trigger(config.EFFECTS.shake.intensity, config.EFFECTS.shake.duration);
  lensFlare.trigger(config.EFFECTS.lensFlare.duration);
  shockWave.triggerSequence(
    config.EFFECTS.shockWave.count,
    config.EFFECTS.shockWave.interval
  );
});

// Показать подсказку после darkness
eventBus.on('phase:changed', ({ to }) => {
  if (to === 'singularity') {
    hintDisplay.show('Click to look around');
  }
});

// Скрыть подсказку при взаимодействии
canvas.addEventListener('click', () => {
  hintDisplay.hide();
  cameraController.setAutoRotate(false);
}, { once: true });

// 5. Game loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const deltaTime = clock.getDelta();

  // Update timeline
  timeline.update(deltaTime);

  // Update camera
  cameraController.update(deltaTime);
  const shakeOffset = screenShake.update(deltaTime);
  if (shakeOffset) {
    cameraController.applyShake(shakeOffset.x, shakeOffset.y, shakeOffset.z);
  }

  // Update UI
  fadeOverlay.setOpacity(timeline.getFadeOpacity());

  // Update particles
  const time = timeline.getGlobalTime();
  starfield.setVisible(timeline.isStarfieldVisible());
  starfield.update(time, {});

  mainParticles.setVisible(timeline.isParticlesVisible());
  mainParticles.update(time, {
    explosionForce: timeline.getExplosionForce(),
    flowFieldStrength: timeline.getFlowFieldStrength()
  });

  dustClouds.setVisible(timeline.isDustVisible());
  dustClouds.update(time, {});

  // Update effects
  singularity.update(
    timeline.getSingularityGlow(),
    timeline.getCurrentPhase().name,
    timeline.getPhaseProgress()
  );
  lensFlare.update(deltaTime);
  shockWave.update(deltaTime);

  // Update post-processing
  postProcessing.setBloomStrength(timeline.getBloomStrength());

  // Render
  postProcessing.render();
}

// 6. Resize handling
window.addEventListener('resize', () => {
  sceneManager.onResize();
  postProcessing.onResize(window.innerWidth, window.innerHeight);
});

// 7. Start
animate();
```

---

## Зависимости между модулями

```
config.js ←─────────────────────────────────────────┐
    │                                               │
    ▼                                               │
EventBus ←── TimelineController                     │
    │              │                                │
    │              ▼                                │
    │        (events: phase:changed,                │
    │         bigbang:start, shockwave:trigger)     │
    │              │                                │
    ▼              ▼                                │
PhaseDisplay  main.js ──► SceneManager ─────────────┤
                 │                                  │
                 ├──► CameraController ─────────────┤
                 │                                  │
                 ├──► PostProcessing ───────────────┤
                 │                                  │
                 ├──► StarfieldSystem ──────────────┤
                 │                                  │
                 ├──► MainParticleSystem ───────────┤
                 │                                  │
                 ├──► DustCloudSystem ──────────────┤
                 │                                  │
                 ├──► Singularity ──────────────────┤
                 │                                  │
                 ├──► ScreenShake                   │
                 │                                  │
                 ├──► LensFlare                     │
                 │                                  │
                 └──► ShockWave ────────────────────┘
```
