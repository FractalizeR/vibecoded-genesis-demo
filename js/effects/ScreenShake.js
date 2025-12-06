// js/effects/ScreenShake.js

export class ScreenShake {
  constructor() {
    this.intensity = 0;
    this.duration = 0;
    this.elapsed = 0;
    this.active = false;

    // Переиспользуемый объект для избежания аллокаций в game loop
    this.offset = { x: 0, y: 0, z: 0 };
  }

  trigger(intensity, duration) {
    this.intensity = intensity;
    this.duration = duration;
    this.elapsed = 0;
    this.active = true;
  }

  update(deltaTime) {
    if (!this.active) {
      this.offset.x = 0;
      this.offset.y = 0;
      this.offset.z = 0;
      return this.offset;
    }

    this.elapsed += deltaTime;

    if (this.elapsed >= this.duration) {
      this.active = false;
      this.offset.x = 0;
      this.offset.y = 0;
      this.offset.z = 0;
      return this.offset;
    }

    // Экспоненциальное затухание
    const progress = this.elapsed / this.duration;
    const currentIntensity = this.intensity * Math.exp(-progress * 3);

    // Случайное смещение
    this.offset.x = (Math.random() - 0.5) * 2 * currentIntensity;
    this.offset.y = (Math.random() - 0.5) * 2 * currentIntensity;
    this.offset.z = (Math.random() - 0.5) * 0.5 * currentIntensity;

    return this.offset;
  }

  isActive() {
    return this.active;
  }
}
