// js/effects/LensFlare.js

import * as THREE from 'three';

export class LensFlare {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config || {
      duration: 1.0,
      color: [1.0, 1.0, 0.9],
      maxOpacity: 0.8
    };

    // Создаём большой sprite для вспышки
    const spriteMaterial = new THREE.SpriteMaterial({
      color: new THREE.Color(...this.config.color),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0
    });

    this.sprite = new THREE.Sprite(spriteMaterial);
    this.sprite.position.set(0, 0, 0);
    this.sprite.scale.set(200, 200, 1);
    this.sprite.visible = false;

    this.scene.add(this.sprite);

    this.duration = this.config.duration;
    this.maxOpacity = this.config.maxOpacity;
    this.elapsed = 0;
    this.active = false;
  }

  trigger(duration) {
    this.duration = duration || this.config.duration;
    this.elapsed = 0;
    this.active = true;
    this.sprite.visible = true;
  }

  update(deltaTime) {
    if (!this.active) return;

    this.elapsed += deltaTime;

    if (this.elapsed >= this.duration) {
      this.active = false;
      this.sprite.visible = false;
      this.sprite.material.opacity = 0;
      return;
    }

    // Быстрое нарастание, медленное затухание
    const progress = this.elapsed / this.duration;
    let opacity;

    if (progress < 0.1) {
      // Быстрое нарастание
      opacity = (progress / 0.1) * this.maxOpacity;
    } else {
      // Медленное затухание
      opacity = this.maxOpacity * (1 - (progress - 0.1) / 0.9);
    }

    this.sprite.material.opacity = opacity;
  }

  dispose() {
    this.scene.remove(this.sprite);
    this.sprite.material.dispose();
  }
}
