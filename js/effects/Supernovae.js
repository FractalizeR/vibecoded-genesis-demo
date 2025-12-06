// js/effects/Supernovae.js

import * as THREE from 'three';

/**
 * Система вспышек сверхновых — случайные яркие вспышки звёзд
 */
export class Supernovae {
  constructor(scene, config = {}) {
    this.scene = scene;
    this.config = {
      maxActive: config.maxActive || 3,           // Максимум одновременных вспышек
      spawnRate: config.spawnRate || 0.3,         // Вспышек в секунду
      duration: config.duration || 1.5,           // Длительность вспышки
      sizeRange: config.sizeRange || [5, 15],     // Диапазон размеров
      distanceRange: config.distanceRange || [20, 80], // Диапазон расстояний от центра
      colors: config.colors || [
        [1.0, 1.0, 1.0],    // Белый
        [0.8, 0.9, 1.0],    // Голубоватый
        [1.0, 0.95, 0.8],   // Желтоватый
      ],
      ...config
    };

    this.supernovae = [];
    this.timeSinceLastSpawn = 0;
    this.enabled = false;
  }

  init() {
    // Создаём пул объектов для вспышек
    const geometry = new THREE.SphereGeometry(1, 16, 16);

    for (let i = 0; i < this.config.maxActive; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;

      // Добавляем свечение (дополнительная сфера)
      const glowGeometry = new THREE.SphereGeometry(1.5, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      mesh.add(glow);

      this.scene.add(mesh);

      this.supernovae.push({
        mesh,
        glow,
        active: false,
        time: 0,
        duration: 0,
        maxSize: 0,
        color: [1, 1, 1]
      });
    }

    return this;
  }

  /**
   * Включить генерацию вспышек
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Выключить генерацию вспышек
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Запустить вспышку вручную в указанной позиции
   */
  triggerAt(position, size = null) {
    const supernova = this.supernovae.find(s => !s.active);
    if (!supernova) return;

    const [minSize, maxSize] = this.config.sizeRange;
    supernova.active = true;
    supernova.time = 0;
    supernova.duration = this.config.duration * (0.8 + Math.random() * 0.4);
    supernova.maxSize = size || (minSize + Math.random() * (maxSize - minSize));

    // Случайный цвет
    const colorIndex = Math.floor(Math.random() * this.config.colors.length);
    supernova.color = this.config.colors[colorIndex];

    // Позиция
    supernova.mesh.position.copy(position);
    supernova.mesh.visible = true;

    // Начальное состояние
    supernova.mesh.scale.setScalar(0.1);
    supernova.mesh.material.opacity = 0;

    const color = new THREE.Color(...supernova.color);
    supernova.mesh.material.color = color;
    supernova.glow.material.color = color;
  }

  /**
   * Спавн случайной вспышки
   */
  spawnRandom() {
    const [minDist, maxDist] = this.config.distanceRange;

    // Случайная позиция в сферической области
    const r = minDist + Math.random() * (maxDist - minDist);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    const position = new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta) * 0.3, // Сжато по Y для дисковой формы
      r * Math.cos(phi)
    );

    this.triggerAt(position);
  }

  update(deltaTime) {
    if (!this.enabled) return;

    // Спавн новых вспышек
    this.timeSinceLastSpawn += deltaTime;
    const spawnInterval = 1.0 / this.config.spawnRate;

    if (this.timeSinceLastSpawn >= spawnInterval) {
      this.timeSinceLastSpawn = 0;

      // Проверяем, есть ли свободные слоты
      const freeSlot = this.supernovae.find(s => !s.active);
      if (freeSlot) {
        this.spawnRandom();
      }
    }

    // Обновляем активные вспышки
    for (const supernova of this.supernovae) {
      if (!supernova.active) continue;

      supernova.time += deltaTime;
      const progress = supernova.time / supernova.duration;

      if (progress >= 1.0) {
        // Вспышка закончилась
        supernova.active = false;
        supernova.mesh.visible = false;
        continue;
      }

      // Анимация: быстрое расширение, медленное угасание
      // Размер: быстро растёт, потом медленно
      const sizeProgress = progress < 0.2
        ? progress / 0.2  // Быстрый рост
        : 1.0 + (progress - 0.2) * 0.3;  // Медленный дорост

      const size = supernova.maxSize * sizeProgress;
      supernova.mesh.scale.setScalar(size);

      // Яркость: пик в начале, затем угасание
      const brightness = progress < 0.1
        ? progress / 0.1  // Быстрое нарастание
        : Math.pow(1.0 - (progress - 0.1) / 0.9, 2);  // Квадратичное угасание

      supernova.mesh.material.opacity = brightness * 0.8;
      supernova.glow.material.opacity = brightness * 0.4;

      // Свечение расширяется больше
      supernova.glow.scale.setScalar(1.5 + progress * 2);
    }
  }

  dispose() {
    for (const supernova of this.supernovae) {
      this.scene.remove(supernova.mesh);
      supernova.mesh.geometry.dispose();
      supernova.mesh.material.dispose();
      supernova.glow.geometry.dispose();
      supernova.glow.material.dispose();
    }
  }
}
