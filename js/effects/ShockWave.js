// js/effects/ShockWave.js

import * as THREE from 'three';
import { shockwaveVertexShader, shockwaveFragmentShader } from '../shaders/shockwave.js';

export class ShockWave {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
    this.waves = [];
    this.scheduledTriggers = [];
    this.startTime = 0;
  }

  trigger() {
    // Создаём плоское кольцо
    const geometry = new THREE.RingGeometry(0.8, 1.0, 64);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0 },
        uMaxRadius: { value: this.config.maxRadius },
        uColor: { value: new THREE.Color(...this.config.color) }
      },
      vertexShader: shockwaveVertexShader,
      fragmentShader: shockwaveFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2; // Горизонтально

    this.scene.add(mesh);
    this.waves.push({
      mesh,
      material,
      progress: 0,
      duration: this.config.duration
    });
  }

  triggerSequence(count, interval) {
    // Используем game loop для управления таймингом вместо setTimeout
    this.startTime = performance.now();
    this.scheduledTriggers = [];

    for (let i = 0; i < count; i++) {
      this.scheduledTriggers.push({
        triggerTime: this.startTime + interval * i * 1000,
        triggered: false
      });
    }
  }

  update(deltaTime) {
    const now = performance.now();

    // Обработка отложенных triggers
    for (const scheduled of this.scheduledTriggers) {
      if (!scheduled.triggered && now >= scheduled.triggerTime) {
        this.trigger();
        scheduled.triggered = true;
      }
    }

    // Обновление активных волн
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const wave = this.waves[i];
      wave.progress += deltaTime / wave.duration;
      wave.material.uniforms.uProgress.value = wave.progress;

      if (wave.progress >= 1) {
        this.scene.remove(wave.mesh);
        wave.mesh.geometry.dispose();
        wave.material.dispose();
        this.waves.splice(i, 1);
      }
    }
  }

  dispose() {
    // Очищаем запланированные triggers
    this.scheduledTriggers = [];

    for (const wave of this.waves) {
      this.scene.remove(wave.mesh);
      wave.mesh.geometry.dispose();
      wave.material.dispose();
    }
    this.waves = [];
  }
}
