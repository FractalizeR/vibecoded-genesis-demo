// js/effects/Pulsars.js

import * as THREE from 'three';

/**
 * Пульсары — ритмично мерцающие яркие точки с лучами
 */
export class Pulsars {
  constructor(scene, config = {}) {
    this.scene = scene;
    this.config = {
      count: config.count || 5,                    // Количество пульсаров
      distanceRange: config.distanceRange || [30, 100], // Расстояние от центра
      pulseSpeed: config.pulseSpeed || [2, 8],     // Диапазон скорости пульсации (Гц)
      size: config.size || 3,                      // Базовый размер
      beamLength: config.beamLength || 20,         // Длина лучей
      color: config.color || [0.5, 0.8, 1.0],      // Голубоватый цвет
      ...config
    };

    this.pulsars = [];
    this.enabled = false;
  }

  init() {
    const { count, distanceRange, pulseSpeed, size, beamLength, color } = this.config;
    const [minDist, maxDist] = distanceRange;
    const [minSpeed, maxSpeed] = pulseSpeed;

    for (let i = 0; i < count; i++) {
      // Случайная позиция
      const r = minDist + Math.random() * (maxDist - minDist);
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 20; // Небольшой разброс по Y

      const position = new THREE.Vector3(
        r * Math.cos(theta),
        y,
        r * Math.sin(theta)
      );

      // Случайная скорость и фаза
      const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
      const phase = Math.random() * Math.PI * 2;

      // Центральная точка
      const coreGeometry = new THREE.SphereGeometry(size * 0.5, 8, 8);
      const coreMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(...color),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending
      });
      const core = new THREE.Mesh(coreGeometry, coreMaterial);
      core.position.copy(position);

      // Лучи (2 противоположных конуса)
      const beamGeometry = new THREE.ConeGeometry(size * 0.3, beamLength, 8);
      const beamMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(...color),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending
      });

      // Луч 1 (вверх)
      const beam1 = new THREE.Mesh(beamGeometry, beamMaterial.clone());
      beam1.position.y = beamLength / 2;
      core.add(beam1);

      // Луч 2 (вниз)
      const beam2 = new THREE.Mesh(beamGeometry, beamMaterial.clone());
      beam2.position.y = -beamLength / 2;
      beam2.rotation.x = Math.PI;
      core.add(beam2);

      // Случайная ориентация оси вращения
      core.rotation.x = Math.random() * Math.PI;
      core.rotation.z = Math.random() * Math.PI;

      // Изначально невидимы
      core.visible = false;

      this.scene.add(core);

      this.pulsars.push({
        core,
        beam1,
        beam2,
        speed,
        phase,
        rotationSpeed: speed * 0.5 // Вращение лучей
      });
    }

    return this;
  }

  enable() {
    this.enabled = true;
    for (const pulsar of this.pulsars) {
      pulsar.core.visible = true;
    }
  }

  disable() {
    this.enabled = false;
    for (const pulsar of this.pulsars) {
      pulsar.core.visible = false;
    }
  }

  update(time, deltaTime) {
    if (!this.enabled) return;

    for (const pulsar of this.pulsars) {
      // Пульсация яркости (резкий импульс)
      const pulsePhase = (time * pulsar.speed + pulsar.phase) % (Math.PI * 2);

      // Создаём резкий импульс (узкий пик)
      const pulse = Math.pow(Math.max(0, Math.cos(pulsePhase)), 8);

      // Обновляем яркость
      pulsar.core.material.opacity = 0.3 + pulse * 0.7;
      pulsar.beam1.material.opacity = pulse * 0.5;
      pulsar.beam2.material.opacity = pulse * 0.5;

      // Размер пульсирует
      const scale = 1.0 + pulse * 0.5;
      pulsar.core.scale.setScalar(scale);

      // Вращение лучей
      pulsar.core.rotation.y += deltaTime * pulsar.rotationSpeed;
    }
  }

  dispose() {
    for (const pulsar of this.pulsars) {
      this.scene.remove(pulsar.core);
      pulsar.core.geometry.dispose();
      pulsar.core.material.dispose();
      pulsar.beam1.geometry.dispose();
      pulsar.beam1.material.dispose();
      pulsar.beam2.geometry.dispose();
      pulsar.beam2.material.dispose();
    }
  }
}
