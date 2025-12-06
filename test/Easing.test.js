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
      expect(easeOutExpo(0.1)).toBeGreaterThanOrEqual(0.5);
    });
  });

  describe('easeInOutCubic', () => {
    it('граничные значения', () => {
      expect(easeInOutCubic(0)).toBe(0);
      expect(easeInOutCubic(1)).toBe(1);
    });

    it('симметрия относительно 0.5', () => {
      expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 5);
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
