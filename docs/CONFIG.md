# Конфигурация

Файл `js/config.js` — единый источник истины для всех параметров проекта.

---

## Полный код config.js

```javascript
// js/config.js

/**
 * Вычисляет start time для каждой фазы на основе duration
 */
function buildPhases(definitions) {
  let currentStart = 0;
  return definitions.map(def => {
    const phase = {
      ...def,
      start: currentStart
    };
    currentStart += def.duration === Infinity ? 0 : def.duration;
    return phase;
  });
}

/**
 * Определения фаз (без start — вычисляется автоматически)
 */
const PHASE_DEFINITIONS = [
  { name: 'intro',       duration: 1,        label: null },
  { name: 'darkness',    duration: 2,        label: null },
  { name: 'singularity', duration: 1,        label: 'SINGULARITY' },
  { name: 'bigbang',     duration: 2,        label: 'BIG BANG' },
  { name: 'expansion',   duration: 10,       label: 'EXPANSION' },
  { name: 'galaxy',      duration: Infinity, label: null }
];

/**
 * Конфигурация проекта
 */
export const config = {

  // ═══════════════════════════════════════════════════════════════
  // ФАЗЫ
  // ═══════════════════════════════════════════════════════════════

  PHASE_DEFINITIONS,
  PHASES: buildPhases(PHASE_DEFINITIONS),

  // ═══════════════════════════════════════════════════════════════
  // ЧАСТИЦЫ ГАЛАКТИКИ
  // ═══════════════════════════════════════════════════════════════

  PARTICLES: {
    count: 150000,           // Количество частиц
    spawnRadius: 0.5,        // Начальный радиус сингулярности
    maxDistance: 80,         // Максимальное расстояние от центра

    // Noise параметры
    noiseScale: 0.02,        // Масштаб curl noise (меньше = крупнее вихри)
    noiseSpeed: 0.3,         // Скорость эволюции noise

    // Визуальные параметры
    twinkleSpeed: 3.0,       // Скорость мерцания
    sizeRange: [1, 3],       // Диапазон размеров

    // Температуры (распределение типов звёзд)
    temperatures: {
      redGiantChance: 0.05,      // 5% красных гигантов
      blueChance: 0.25,          // 25% голубых звёзд
      // остальные 70% — жёлтые/белые
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // КОСМИЧЕСКАЯ ПЫЛЬ
  // ═══════════════════════════════════════════════════════════════

  DUST: {
    count: 3000,             // Количество облаков пыли
    sizeRange: [10, 50],     // Диапазон размеров
    alphaRange: [0.02, 0.08], // Диапазон прозрачности

    // Noise параметры
    noiseScale: 0.01,        // Масштаб движения
    noiseSpeed: 0.1,         // Скорость движения

    // Цвета пыли (RGB, 0-1)
    colors: [
      [0.4, 0.2, 0.6],       // Фиолетовый
      [0.2, 0.4, 0.6],       // Синий
      [0.1, 0.1, 0.2],       // Тёмный
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // ФОНОВЫЕ ЗВЁЗДЫ
  // ═══════════════════════════════════════════════════════════════

  STARFIELD: {
    count: 5000,             // Количество звёзд
    distanceRange: [200, 500], // Диапазон расстояний от центра
    twinkleSpeed: 2.0,       // Скорость мерцания
    sizeRange: [1, 2.5],     // Диапазон размеров
  },

  // ═══════════════════════════════════════════════════════════════
  // BLOOM (пост-обработка)
  // ═══════════════════════════════════════════════════════════════

  BLOOM: {
    strength: 1.5,           // Базовая сила bloom
    peakStrength: 3.0,       // Пиковая сила (при взрыве)
    radius: 0.4,             // Радиус размытия
    threshold: 0.85,         // Порог яркости
  },

  // ═══════════════════════════════════════════════════════════════
  // КАМЕРА
  // ═══════════════════════════════════════════════════════════════

  CAMERA: {
    fov: 60,                 // Угол обзора по умолчанию
    near: 0.1,               // Ближняя плоскость отсечения
    far: 2000,               // Дальняя плоскость отсечения
    position: [0, 10, 100],  // Начальная позиция [x, y, z]

    // Управление
    sensitivity: 0.002,      // Чувствительность мыши
    damping: 0.05,           // Плавность движения (0-1, меньше = плавнее)

    // Авторотация
    autoRotateSpeed: 0.1,    // Скорость автовращения (рад/сек)

    // Zoom
    zoomRange: [30, 120],    // Диапазон FOV [min, max]
    zoomSpeed: 0.1,          // Скорость zoom
  },

  // ═══════════════════════════════════════════════════════════════
  // ЭФФЕКТЫ
  // ═══════════════════════════════════════════════════════════════

  EFFECTS: {
    // Screen shake
    shake: {
      intensity: 0.5,        // Амплитуда тряски
      duration: 0.5,         // Длительность в секундах
      decay: 'exponential',  // Тип затухания: 'linear' | 'exponential'
    },

    // Lens flare (вспышка)
    lensFlare: {
      duration: 1.0,         // Длительность вспышки
      color: [1.0, 1.0, 0.9], // Цвет (RGB, 0-1)
      maxOpacity: 0.8,       // Максимальная непрозрачность
    },

    // Shock waves (кольца)
    shockWave: {
      count: 3,              // Количество колец
      interval: 0.4,         // Интервал между кольцами (сек)
      maxRadius: 100,        // Максимальный радиус
      duration: 2.0,         // Длительность расширения
      color: [0.8, 0.9, 1.0], // Цвет (RGB, 0-1) — голубовато-белый
    },

    // Singularity (центральное ядро)
    singularity: {
      baseSize: 2,           // Базовый размер
      maxSize: 5,            // Максимальный размер (при пульсации)
      pulseSpeed: 3.0,       // Скорость пульсации
      glowColor: [1.0, 1.0, 1.0], // Цвет свечения (RGB, 0-1)
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // UI
  // ═══════════════════════════════════════════════════════════════

  UI: {
    fadeDuration: 1.0,           // Длительность fade in
    phaseDisplayDuration: 2.0,   // Сколько показывать название фазы
    hintDelay: 3.0,              // Через сколько показать подсказку

    // Стили (используются в CSS, здесь для справки)
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    phaseTextColor: 'rgba(255, 255, 255, 0.9)',
    hintTextColor: 'rgba(255, 255, 255, 0.5)',
  },

  // ═══════════════════════════════════════════════════════════════
  // DEBUG
  // ═══════════════════════════════════════════════════════════════

  DEBUG: {
    enabled: false,          // Включить debug режим
    showStats: false,        // Показывать FPS meter
    logPhaseChanges: true,   // Логировать смены фаз
    wireframe: false,        // Wireframe режим
  }
};

// Экспорт вспомогательной функции
export { buildPhases };
```

---

## Тюнинг параметров

### Производительность

| Параметр | Эффект | Рекомендация |
|----------|--------|--------------|
| `PARTICLES.count` | Больше = плотнее, но медленнее | 100000 для слабых GPU |
| `DUST.count` | Влияет меньше, чем частицы | 2000 для слабых GPU |
| `BLOOM.strength` | Интенсивнее = медленнее | 1.0 для слабых GPU |

### Визуальный стиль

| Параметр | Эффект |
|----------|--------|
| `PARTICLES.noiseScale` | Меньше = крупнее спиральные рукава |
| `PARTICLES.maxDistance` | Радиус галактики |
| `EFFECTS.shockWave.count` | Количество колец при взрыве |
| `BLOOM.threshold` | Выше = только самые яркие объекты светятся |

### Timing

| Параметр | Эффект |
|----------|--------|
| `PHASE_DEFINITIONS[i].duration` | Длительность фазы |
| `EFFECTS.shake.duration` | Длительность тряски |
| `UI.hintDelay` | Когда появится подсказка |

---

## Валидация конфига

```javascript
// test/config.test.js

import { describe, it, expect } from 'vitest';
import { config, buildPhases } from '../js/config.js';

describe('config', () => {
  describe('PHASES', () => {
    it('содержит все обязательные фазы', () => {
      const names = config.PHASES.map(p => p.name);
      expect(names).toContain('intro');
      expect(names).toContain('darkness');
      expect(names).toContain('singularity');
      expect(names).toContain('bigbang');
      expect(names).toContain('expansion');
      expect(names).toContain('galaxy');
    });

    it('фазы отсортированы по start time', () => {
      for (let i = 1; i < config.PHASES.length; i++) {
        expect(config.PHASES[i].start).toBeGreaterThanOrEqual(config.PHASES[i-1].start);
      }
    });

    it('фазы не пересекаются', () => {
      for (let i = 0; i < config.PHASES.length - 1; i++) {
        const current = config.PHASES[i];
        const next = config.PHASES[i + 1];
        expect(current.start + current.duration).toBe(next.start);
      }
    });
  });

  describe('buildPhases', () => {
    it('корректно вычисляет start', () => {
      const result = buildPhases([
        { name: 'a', duration: 1 },
        { name: 'b', duration: 2 },
        { name: 'c', duration: 3 }
      ]);

      expect(result[0].start).toBe(0);
      expect(result[1].start).toBe(1);
      expect(result[2].start).toBe(3);
    });
  });

  describe('PARTICLES', () => {
    it('count положительный', () => {
      expect(config.PARTICLES.count).toBeGreaterThan(0);
    });

    it('spawnRadius меньше maxDistance', () => {
      expect(config.PARTICLES.spawnRadius).toBeLessThan(config.PARTICLES.maxDistance);
    });
  });

  describe('CAMERA', () => {
    it('zoomRange[0] < zoomRange[1]', () => {
      expect(config.CAMERA.zoomRange[0]).toBeLessThan(config.CAMERA.zoomRange[1]);
    });

    it('fov в пределах zoomRange', () => {
      expect(config.CAMERA.fov).toBeGreaterThanOrEqual(config.CAMERA.zoomRange[0]);
      expect(config.CAMERA.fov).toBeLessThanOrEqual(config.CAMERA.zoomRange[1]);
    });
  });

  describe('BLOOM', () => {
    it('threshold между 0 и 1', () => {
      expect(config.BLOOM.threshold).toBeGreaterThanOrEqual(0);
      expect(config.BLOOM.threshold).toBeLessThanOrEqual(1);
    });
  });

  describe('EFFECTS.shockWave', () => {
    it('count положительный', () => {
      expect(config.EFFECTS.shockWave.count).toBeGreaterThan(0);
    });

    it('interval положительный', () => {
      expect(config.EFFECTS.shockWave.interval).toBeGreaterThan(0);
    });
  });
});
```

---

## Изменение конфига в runtime

Для debug целей можно изменять параметры через консоль браузера:

```javascript
// В main.js — экспортировать config в window для debug
if (config.DEBUG.enabled) {
  window.gameConfig = config;
}

// В консоли браузера:
// gameConfig.PARTICLES.count = 50000;
// (потребуется пересоздание particle system)
```

---

## Пресеты качества

```javascript
// Опционально: пресеты для разных устройств

export const QUALITY_PRESETS = {
  low: {
    PARTICLES: { count: 50000 },
    DUST: { count: 1000 },
    BLOOM: { strength: 1.0 }
  },
  medium: {
    PARTICLES: { count: 100000 },
    DUST: { count: 2000 },
    BLOOM: { strength: 1.5 }
  },
  high: {
    PARTICLES: { count: 150000 },
    DUST: { count: 3000 },
    BLOOM: { strength: 1.5 }
  }
};

// Применение пресета:
// Object.assign(config.PARTICLES, QUALITY_PRESETS.low.PARTICLES);
```
