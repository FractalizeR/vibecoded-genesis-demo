# План тестирования

## Тестовое окружение

### package.json

```json
{
  "name": "genesis-demo",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  },
  "devDependencies": {
    "vitest": "^1.0.0"
  }
}
```

### test/setup.js

```javascript
// test/setup.js
// Моки для Three.js — минимальный набор для тестирования логики

export class MockVector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  copy(v) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  multiplyScalar(s) {
    this.x *= s;
    this.y *= s;
    this.z *= s;
    return this;
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  normalize() {
    const len = this.length();
    if (len > 0) {
      this.x /= len;
      this.y /= len;
      this.z /= len;
    }
    return this;
  }

  clone() {
    return new MockVector3(this.x, this.y, this.z);
  }
}

export class MockClock {
  constructor() {
    this.elapsedTime = 0;
    this.lastTime = 0;
  }

  getDelta() {
    const delta = this.elapsedTime - this.lastTime;
    this.lastTime = this.elapsedTime;
    return delta;
  }

  getElapsedTime() {
    return this.elapsedTime;
  }

  // Для тестов: симуляция времени
  advance(seconds) {
    this.elapsedTime += seconds;
  }
}

// Мок для requestAnimationFrame (не нужен в vitest, но полезен для справки)
export function mockRAF() {
  let callbacks = [];
  let time = 0;

  global.requestAnimationFrame = (cb) => {
    callbacks.push(cb);
    return callbacks.length;
  };

  global.cancelAnimationFrame = (id) => {
    callbacks[id - 1] = null;
  };

  return {
    tick: (deltaMs = 16) => {
      time += deltaMs;
      const cbs = callbacks.slice();
      callbacks = [];
      cbs.forEach(cb => cb && cb(time));
    }
  };
}
```

### vitest.config.js

```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.js'],
    setupFiles: ['test/setup.js']
  }
});
```

---

## Тесты по модулям

### test/Easing.test.js

```javascript
import { describe, it, expect } from 'vitest';
import {
  linear,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeOutExpo,
  easeInOutCubic,
  smoothstep,
  lerp,
  clamp
} from '../js/core/Easing.js';

describe('Easing', () => {
  describe('linear', () => {
    it('linear(0) = 0', () => {
      expect(linear(0)).toBe(0);
    });

    it('linear(1) = 1', () => {
      expect(linear(1)).toBe(1);
    });

    it('linear(0.5) = 0.5', () => {
      expect(linear(0.5)).toBe(0.5);
    });
  });

  describe('easeInQuad', () => {
    it('easeInQuad(0) = 0', () => {
      expect(easeInQuad(0)).toBe(0);
    });

    it('easeInQuad(1) = 1', () => {
      expect(easeInQuad(1)).toBe(1);
    });

    it('easeInQuad(0.5) < 0.5 (ускорение)', () => {
      expect(easeInQuad(0.5)).toBeLessThan(0.5);
    });
  });

  describe('easeOutQuad', () => {
    it('easeOutQuad(0) = 0', () => {
      expect(easeOutQuad(0)).toBe(0);
    });

    it('easeOutQuad(1) = 1', () => {
      expect(easeOutQuad(1)).toBe(1);
    });

    it('easeOutQuad(0.5) > 0.5 (замедление)', () => {
      expect(easeOutQuad(0.5)).toBeGreaterThan(0.5);
    });
  });

  describe('easeInOutQuad', () => {
    it('граничные значения', () => {
      expect(easeInOutQuad(0)).toBe(0);
      expect(easeInOutQuad(1)).toBe(1);
    });

    it('симметрия относительно 0.5', () => {
      expect(easeInOutQuad(0.5)).toBeCloseTo(0.5, 5);
    });
  });

  describe('easeOutExpo', () => {
    it('граничные значения', () => {
      expect(easeOutExpo(0)).toBe(0);
      expect(easeOutExpo(1)).toBe(1);
    });

    it('быстрый старт', () => {
      expect(easeOutExpo(0.1)).toBeGreaterThan(0.5);
    });
  });

  describe('smoothstep', () => {
    it('граничные значения', () => {
      expect(smoothstep(0)).toBe(0);
      expect(smoothstep(1)).toBe(1);
    });

    it('smoothstep(0.5) = 0.5', () => {
      expect(smoothstep(0.5)).toBe(0.5);
    });
  });

  describe('lerp', () => {
    it('lerp(0, 10, 0) = 0', () => {
      expect(lerp(0, 10, 0)).toBe(0);
    });

    it('lerp(0, 10, 1) = 10', () => {
      expect(lerp(0, 10, 1)).toBe(10);
    });

    it('lerp(0, 10, 0.5) = 5', () => {
      expect(lerp(0, 10, 0.5)).toBe(5);
    });

    it('lerp работает с отрицательными числами', () => {
      expect(lerp(-10, 10, 0.5)).toBe(0);
    });
  });

  describe('clamp', () => {
    it('clamp(5, 0, 10) = 5 (в пределах)', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('clamp(-1, 0, 10) = 0 (ниже минимума)', () => {
      expect(clamp(-1, 0, 10)).toBe(0);
    });

    it('clamp(15, 0, 10) = 10 (выше максимума)', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('clamp на границе', () => {
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });
  });

  describe('монотонность', () => {
    const easings = [linear, easeInQuad, easeOutQuad, smoothstep];

    easings.forEach(fn => {
      it(`${fn.name} монотонно возрастает`, () => {
        let prev = fn(0);
        for (let t = 0.1; t <= 1; t += 0.1) {
          const curr = fn(t);
          expect(curr).toBeGreaterThanOrEqual(prev);
          prev = curr;
        }
      });
    });
  });
});
```

---

### test/EventBus.test.js

```javascript
import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../js/core/EventBus.js';

describe('EventBus', () => {
  it('вызывает callback при emit', () => {
    const bus = new EventBus();
    const callback = vi.fn();

    bus.on('test', callback);
    bus.emit('test');

    expect(callback).toHaveBeenCalled();
  });

  it('передаёт данные в callback', () => {
    const bus = new EventBus();
    const callback = vi.fn();
    const data = { foo: 'bar' };

    bus.on('test', callback);
    bus.emit('test', data);

    expect(callback).toHaveBeenCalledWith(data);
  });

  it('поддерживает множественных слушателей', () => {
    const bus = new EventBus();
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    bus.on('test', callback1);
    bus.on('test', callback2);
    bus.emit('test');

    expect(callback1).toHaveBeenCalled();
    expect(callback2).toHaveBeenCalled();
  });

  it('off() отписывает конкретный callback', () => {
    const bus = new EventBus();
    const callback = vi.fn();

    bus.on('test', callback);
    bus.off('test', callback);
    bus.emit('test');

    expect(callback).not.toHaveBeenCalled();
  });

  it('не вызывает отписанный callback, но вызывает другие', () => {
    const bus = new EventBus();
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    bus.on('test', callback1);
    bus.on('test', callback2);
    bus.off('test', callback1);
    bus.emit('test');

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalled();
  });

  it('вызывает callbacks в порядке подписки (FIFO)', () => {
    const bus = new EventBus();
    const order = [];

    bus.on('test', () => order.push(1));
    bus.on('test', () => order.push(2));
    bus.on('test', () => order.push(3));
    bus.emit('test');

    expect(order).toEqual([1, 2, 3]);
  });

  it('продолжает вызывать callbacks даже если один бросает ошибку', () => {
    const bus = new EventBus();
    const callback1 = vi.fn(() => { throw new Error('test'); });
    const callback2 = vi.fn();

    bus.on('test', callback1);
    bus.on('test', callback2);

    // Не должно бросить ошибку наружу
    expect(() => bus.emit('test')).not.toThrow();
    expect(callback2).toHaveBeenCalled();
  });

  it('emit на несуществующее событие не бросает ошибку', () => {
    const bus = new EventBus();
    expect(() => bus.emit('nonexistent')).not.toThrow();
  });

  it('off на несуществующий callback не бросает ошибку', () => {
    const bus = new EventBus();
    const callback = vi.fn();
    expect(() => bus.off('test', callback)).not.toThrow();
  });
});
```

---

### test/TimelineController.test.js

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TimelineController } from '../js/core/TimelineController.js';
import { EventBus } from '../js/core/EventBus.js';

// Тестовые фазы
const TEST_PHASES = [
  { name: 'intro',       duration: 1,        start: 0,  label: null },
  { name: 'darkness',    duration: 2,        start: 1,  label: null },
  { name: 'singularity', duration: 1,        start: 3,  label: 'SINGULARITY' },
  { name: 'bigbang',     duration: 2,        start: 4,  label: 'BIG BANG' },
  { name: 'expansion',   duration: 10,       start: 6,  label: 'EXPANSION' },
  { name: 'galaxy',      duration: Infinity, start: 16, label: null }
];

describe('TimelineController', () => {
  let eventBus;
  let timeline;

  beforeEach(() => {
    eventBus = new EventBus();
    timeline = new TimelineController(TEST_PHASES, eventBus);
  });

  describe('фазы', () => {
    it('начинает с фазы intro', () => {
      expect(timeline.getCurrentPhase().name).toBe('intro');
    });

    it('переходит в darkness на t=1', () => {
      timeline.update(1);
      expect(timeline.getCurrentPhase().name).toBe('darkness');
    });

    it('переходит в singularity на t=3', () => {
      timeline.update(3);
      expect(timeline.getCurrentPhase().name).toBe('singularity');
    });

    it('переходит в bigbang на t=4', () => {
      timeline.update(4);
      expect(timeline.getCurrentPhase().name).toBe('bigbang');
    });

    it('переходит в expansion на t=6', () => {
      timeline.update(6);
      expect(timeline.getCurrentPhase().name).toBe('expansion');
    });

    it('переходит в galaxy на t=16', () => {
      timeline.update(16);
      expect(timeline.getCurrentPhase().name).toBe('galaxy');
    });

    it('остаётся в galaxy после t=16', () => {
      timeline.update(100);
      expect(timeline.getCurrentPhase().name).toBe('galaxy');
    });
  });

  describe('getPhaseProgress', () => {
    it('возвращает 0 в начале фазы', () => {
      timeline.update(0);
      expect(timeline.getPhaseProgress()).toBe(0);

      timeline.update(1);  // начало darkness
      expect(timeline.getPhaseProgress()).toBe(0);
    });

    it('возвращает ~1 в конце фазы', () => {
      timeline.update(0.99);  // почти конец intro
      expect(timeline.getPhaseProgress()).toBeCloseTo(0.99, 1);
    });

    it('возвращает 0.5 в середине фазы', () => {
      timeline.update(0.5);  // середина intro (duration=1)
      expect(timeline.getPhaseProgress()).toBeCloseTo(0.5, 1);
    });
  });

  describe('getGlobalTime', () => {
    it('возвращает накопленное время', () => {
      timeline.update(1);
      timeline.update(0.5);
      timeline.update(0.5);
      expect(timeline.getGlobalTime()).toBe(2);
    });
  });

  describe('getCurrentLabel', () => {
    it('возвращает null в intro/darkness', () => {
      expect(timeline.getCurrentLabel()).toBeNull();

      timeline.update(1);
      expect(timeline.getCurrentLabel()).toBeNull();
    });

    it('возвращает "SINGULARITY" в singularity', () => {
      timeline.update(3);
      expect(timeline.getCurrentLabel()).toBe('SINGULARITY');
    });

    it('возвращает "BIG BANG" в bigbang', () => {
      timeline.update(4);
      expect(timeline.getCurrentLabel()).toBe('BIG BANG');
    });

    it('возвращает "EXPANSION" в expansion', () => {
      timeline.update(6);
      expect(timeline.getCurrentLabel()).toBe('EXPANSION');
    });

    it('возвращает null в galaxy', () => {
      timeline.update(16);
      expect(timeline.getCurrentLabel()).toBeNull();
    });
  });

  describe('getFadeOpacity', () => {
    it('= 1 при t=0', () => {
      expect(timeline.getFadeOpacity()).toBe(1);
    });

    it('= 0 при t>=1', () => {
      timeline.update(1);
      expect(timeline.getFadeOpacity()).toBe(0);

      timeline.update(10);
      expect(timeline.getFadeOpacity()).toBe(0);
    });

    it('плавно интерполируется', () => {
      timeline.update(0.5);
      const opacity = timeline.getFadeOpacity();
      expect(opacity).toBeGreaterThan(0);
      expect(opacity).toBeLessThan(1);
    });
  });

  describe('getSingularityGlow', () => {
    it('= 0 до singularity', () => {
      timeline.update(2);  // darkness
      expect(timeline.getSingularityGlow()).toBe(0);
    });

    it('нарастает в singularity', () => {
      timeline.update(3);  // начало singularity
      const start = timeline.getSingularityGlow();

      timeline.update(0.5);  // середина
      const middle = timeline.getSingularityGlow();

      expect(middle).toBeGreaterThan(start);
    });

    it('= 1 в bigbang', () => {
      timeline.update(4);
      expect(timeline.getSingularityGlow()).toBe(1);
    });
  });

  describe('getExplosionForce', () => {
    it('= 0 до bigbang', () => {
      timeline.update(3);
      expect(timeline.getExplosionForce()).toBe(0);
    });

    it('пиковое в начале bigbang', () => {
      timeline.update(4);
      const atStart = timeline.getExplosionForce();
      expect(atStart).toBeGreaterThan(0.5);
    });

    it('затухает в expansion', () => {
      timeline.update(4);
      const atBang = timeline.getExplosionForce();

      timeline.update(4);  // t=8
      const later = timeline.getExplosionForce();

      expect(later).toBeLessThan(atBang);
    });
  });

  describe('getFlowFieldStrength', () => {
    it('= 0 до expansion', () => {
      timeline.update(5);
      expect(timeline.getFlowFieldStrength()).toBe(0);
    });

    it('нарастает в expansion', () => {
      timeline.update(6);  // начало expansion
      const start = timeline.getFlowFieldStrength();

      timeline.update(5);  // середина
      const middle = timeline.getFlowFieldStrength();

      expect(middle).toBeGreaterThan(start);
    });

    it('= 1 в galaxy', () => {
      timeline.update(16);
      expect(timeline.getFlowFieldStrength()).toBe(1);
    });
  });

  describe('visibility flags', () => {
    it('isStarfieldVisible = false в intro', () => {
      expect(timeline.isStarfieldVisible()).toBe(false);
    });

    it('isStarfieldVisible = true после intro', () => {
      timeline.update(1);
      expect(timeline.isStarfieldVisible()).toBe(true);
    });

    it('isParticlesVisible = false до bigbang', () => {
      timeline.update(3.9);
      expect(timeline.isParticlesVisible()).toBe(false);
    });

    it('isParticlesVisible = true после t=4', () => {
      timeline.update(4);
      expect(timeline.isParticlesVisible()).toBe(true);
    });

    it('isDustVisible = false до expansion', () => {
      timeline.update(5.9);
      expect(timeline.isDustVisible()).toBe(false);
    });

    it('isDustVisible = true после t=6', () => {
      timeline.update(6);
      expect(timeline.isDustVisible()).toBe(true);
    });
  });

  describe('события', () => {
    it('эмитит phase:changed при смене фазы', () => {
      const callback = vi.fn();
      eventBus.on('phase:changed', callback);

      timeline.update(1);  // intro -> darkness

      expect(callback).toHaveBeenCalledWith({
        from: 'intro',
        to: 'darkness',
        label: null
      });
    });

    it('эмитит bigbang:start в начале bigbang', () => {
      const callback = vi.fn();
      eventBus.on('bigbang:start', callback);

      timeline.update(4);

      expect(callback).toHaveBeenCalled();
    });

    it('эмитит shockwave:trigger 3 раза с интервалом', () => {
      const callback = vi.fn();
      eventBus.on('shockwave:trigger', callback);

      // Симулируем прохождение bigbang фазы
      timeline.update(4);    // t=4, первое кольцо
      timeline.update(0.4);  // t=4.4, второе кольцо
      timeline.update(0.4);  // t=4.8, третье кольцо
      timeline.update(0.4);  // t=5.2, больше колец нет

      expect(callback).toHaveBeenCalledTimes(3);
    });
  });

  describe('плавность', () => {
    it('параметры не имеют резких скачков на границах фаз', () => {
      const samples = [];
      const step = 0.1;

      for (let t = 0; t <= 20; t += step) {
        timeline.update(step);
        samples.push({
          t: timeline.getGlobalTime(),
          fade: timeline.getFadeOpacity(),
          glow: timeline.getSingularityGlow(),
          explosion: timeline.getExplosionForce(),
          flow: timeline.getFlowFieldStrength()
        });
      }

      // Проверяем, что разница между соседними значениями не слишком большая
      for (let i = 1; i < samples.length; i++) {
        const prev = samples[i - 1];
        const curr = samples[i];

        // Допускаем скачок не более 0.5 за 0.1 секунды
        expect(Math.abs(curr.fade - prev.fade)).toBeLessThan(0.5);
        expect(Math.abs(curr.glow - prev.glow)).toBeLessThan(0.5);
        expect(Math.abs(curr.flow - prev.flow)).toBeLessThan(0.5);
      }
    });
  });
});
```

---

## Запуск тестов

```bash
# Установка зависимостей
npm install

# Запуск всех тестов
npm test

# Запуск с watch mode (для разработки)
npm run test:watch

# Запуск с покрытием
npm run test:coverage
```

---

## Ожидаемый результат

После реализации всех модулей:

```
 ✓ test/Easing.test.js (15 tests)
 ✓ test/EventBus.test.js (10 tests)
 ✓ test/TimelineController.test.js (28 tests)
 ✓ test/config.test.js (12 tests)

 Test Files  4 passed (4)
      Tests  65 passed (65)
```
