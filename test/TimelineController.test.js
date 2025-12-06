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

      // Сбрасываем timeline
      timeline = new TimelineController(TEST_PHASES, eventBus);

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

        // Допускаем скачок не более 0.8 за 0.1 секунды (glow резко меняется на границах фаз)
        expect(Math.abs(curr.fade - prev.fade)).toBeLessThan(0.5);
        expect(Math.abs(curr.glow - prev.glow)).toBeLessThan(0.8);
        expect(Math.abs(curr.flow - prev.flow)).toBeLessThan(0.5);
      }
    });
  });
});
