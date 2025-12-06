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
