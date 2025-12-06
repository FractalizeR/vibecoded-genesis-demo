// js/core/TimelineController.js

import { easeInOutQuad, easeInOutCubic } from './Easing.js';

export class TimelineController {
  constructor(phases, eventBus) {
    this.phases = phases;
    this.eventBus = eventBus;
    this.globalTime = 0;
    this.currentPhaseIndex = 0;
    this.shockwaveCount = 0;
    this.shockwaveInterval = 0.4;
    this.lastShockwaveTime = -1;
    this.bigbangTriggered = false;
  }

  update(deltaTime) {
    const previousPhaseIndex = this.currentPhaseIndex;
    this.globalTime += deltaTime;

    // Определяем текущую фазу
    for (let i = this.phases.length - 1; i >= 0; i--) {
      if (this.globalTime >= this.phases[i].start) {
        this.currentPhaseIndex = i;
        break;
      }
    }

    // Событие смены фазы
    if (this.currentPhaseIndex !== previousPhaseIndex) {
      const from = this.phases[previousPhaseIndex].name;
      const to = this.phases[this.currentPhaseIndex].name;
      const label = this.phases[this.currentPhaseIndex].label;

      this.eventBus.emit('phase:changed', { from, to, label });

      // Событие начала bigbang
      if (to === 'bigbang' && !this.bigbangTriggered) {
        this.bigbangTriggered = true;
        this.eventBus.emit('bigbang:start');
        this.lastShockwaveTime = this.globalTime;
        this.shockwaveCount = 1;
        this.eventBus.emit('shockwave:trigger', { index: 0 });
      }
    }

    // Shockwave triggers во время bigbang
    if (this.bigbangTriggered && this.shockwaveCount < 3) {
      const timeSinceLastShockwave = this.globalTime - this.lastShockwaveTime;
      if (timeSinceLastShockwave >= this.shockwaveInterval) {
        this.eventBus.emit('shockwave:trigger', { index: this.shockwaveCount });
        this.shockwaveCount++;
        this.lastShockwaveTime = this.globalTime;
      }
    }
  }

  getCurrentPhase() {
    return this.phases[this.currentPhaseIndex];
  }

  getPhaseProgress() {
    const phase = this.getCurrentPhase();
    if (phase.duration === Infinity) return 0;

    const elapsed = this.globalTime - phase.start;
    return Math.min(1, Math.max(0, elapsed / phase.duration));
  }

  getGlobalTime() {
    return this.globalTime;
  }

  getCurrentLabel() {
    return this.getCurrentPhase().label;
  }

  // Параметры анимации

  getFadeOpacity() {
    if (this.globalTime >= 1) return 0;
    return 1 - this.globalTime;
  }

  getSingularityGlow() {
    const phase = this.getCurrentPhase();
    if (phase.name === 'singularity') {
      return easeInOutQuad(this.getPhaseProgress());
    }
    if (phase.name === 'bigbang') {
      return 1;
    }
    if (phase.name === 'expansion' || phase.name === 'galaxy') {
      return 0.3;
    }
    return 0;
  }

  getExplosionForce() {
    const phase = this.getCurrentPhase();
    if (phase.name !== 'bigbang' && phase.name !== 'expansion' && phase.name !== 'galaxy') {
      return 0;
    }

    const bigbangStart = 4; // bigbang начинается в t=4
    const timeSinceBang = this.globalTime - bigbangStart;
    if (timeSinceBang < 0) return 0;

    // Накопленное смещение: быстро растёт от 0 до 1
    // Коэффициент 1.5 = 95% разлёта за 2 секунды
    return 1.0 - Math.exp(-timeSinceBang * 1.5);
  }

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

  getShakeIntensity() {
    const phase = this.getCurrentPhase();
    if (phase.name !== 'bigbang') return 0;

    const progress = this.getPhaseProgress();
    // Тряска только в первые 0.25 от фазы (0.5s из 2s)
    if (progress > 0.25) return 0;

    return 1 - (progress / 0.25);
  }

  // Visibility flags

  isStarfieldVisible() {
    return this.globalTime >= 1;
  }

  isParticlesVisible() {
    return this.globalTime >= 4;
  }

  isDustVisible() {
    return this.globalTime >= 6;
  }
}
