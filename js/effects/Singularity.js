// js/effects/Singularity.js

import * as THREE from 'three';

export class Singularity {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;

    // Создаём sprite с ярким свечением
    const spriteMaterial = new THREE.SpriteMaterial({
      color: new THREE.Color(...config.glowColor),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.sprite = new THREE.Sprite(spriteMaterial);
    this.sprite.position.set(0, 0, 0);
    this.sprite.scale.set(config.baseSize, config.baseSize, 1);
    this.sprite.visible = false;

    this.scene.add(this.sprite);

    this.baseSize = config.baseSize;
    this.maxSize = config.maxSize;
    this.pulseSpeed = config.pulseSpeed;
  }

  update(glow, phaseName, progress) {
    // Показываем только в определённых фазах
    if (glow <= 0) {
      this.sprite.visible = false;
      return;
    }

    this.sprite.visible = true;

    // Вычисляем размер
    let size = this.baseSize;

    if (phaseName === 'singularity') {
      // Нарастающая пульсация
      const pulse = Math.sin(progress * Math.PI * this.pulseSpeed) * 0.3 + 1;
      size = this.baseSize * glow * pulse;
    } else if (phaseName === 'bigbang') {
      // Яркая вспышка в начале, затем уменьшение
      const flash = (1 - progress) * this.maxSize + this.baseSize;
      size = flash;
    } else {
      // После взрыва — маленькое ядро галактики
      size = this.baseSize * glow;
    }

    this.sprite.scale.set(size, size, 1);
    this.sprite.material.opacity = glow;
  }

  dispose() {
    this.scene.remove(this.sprite);
    this.sprite.material.dispose();
  }
}
