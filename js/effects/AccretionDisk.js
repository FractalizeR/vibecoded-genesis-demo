// js/effects/AccretionDisk.js

import * as THREE from 'three';
import { accretionDiskVertexShader, accretionDiskFragmentShader } from '../shaders/accretiondisk.js';

/**
 * Аккреционный диск — светящееся вращающееся кольцо вокруг центра галактики
 */
export class AccretionDisk {
  constructor(scene, config = {}) {
    this.scene = scene;
    this.config = {
      innerRadius: config.innerRadius || 5,
      outerRadius: config.outerRadius || 25,
      rotationSpeed: config.rotationSpeed || 0.3,
      opacity: config.opacity || 0.6,
      innerColor: config.innerColor || [1.0, 0.8, 0.4],  // Жёлто-белый (горячий)
      outerColor: config.outerColor || [0.4, 0.2, 0.8],  // Фиолетовый (холодный)
      tilt: config.tilt || 0.3,  // Наклон диска (радианы)
      ...config
    };

    this.mesh = null;
    this.visible = false;
    this.targetOpacity = 0;
    this.currentOpacity = 0;
  }

  init() {
    const { innerRadius, outerRadius, tilt } = this.config;

    // Создаём плоскость (кольцо будет в шейдере)
    const size = outerRadius * 2;
    const geometry = new THREE.PlaneGeometry(size, size, 1, 1);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uRotationSpeed: { value: this.config.rotationSpeed },
        uOpacity: { value: 0 },
        uInnerColor: { value: new THREE.Vector3(...this.config.innerColor) },
        uOuterColor: { value: new THREE.Vector3(...this.config.outerColor) },
        uNoiseScale: { value: 1.0 }
      },
      vertexShader: accretionDiskVertexShader,
      fragmentShader: accretionDiskFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(geometry, material);

    // Наклоняем диск
    this.mesh.rotation.x = -Math.PI / 2 + tilt;

    // Изначально невидим
    this.mesh.visible = false;

    this.scene.add(this.mesh);
    return this.mesh;
  }

  /**
   * Показать диск с анимацией
   */
  show() {
    this.visible = true;
    this.mesh.visible = true;
    this.targetOpacity = this.config.opacity;
  }

  /**
   * Скрыть диск с анимацией
   */
  hide() {
    this.targetOpacity = 0;
  }

  /**
   * Установить видимость напрямую (0-1)
   */
  setVisibility(value) {
    this.targetOpacity = value * this.config.opacity;
    if (value > 0 && !this.mesh.visible) {
      this.mesh.visible = true;
      this.visible = true;
    }
  }

  update(time, deltaTime = 0.016) {
    if (!this.mesh) return;

    // Плавное появление/исчезновение
    const fadeSpeed = 2.0;
    if (this.currentOpacity < this.targetOpacity) {
      this.currentOpacity = Math.min(this.currentOpacity + fadeSpeed * deltaTime, this.targetOpacity);
    } else if (this.currentOpacity > this.targetOpacity) {
      this.currentOpacity = Math.max(this.currentOpacity - fadeSpeed * deltaTime, this.targetOpacity);
    }

    // Скрываем если полностью прозрачный
    if (this.currentOpacity <= 0 && this.targetOpacity <= 0) {
      this.mesh.visible = false;
      this.visible = false;
    }

    // Обновляем uniforms
    this.mesh.material.uniforms.uTime.value = time;
    this.mesh.material.uniforms.uOpacity.value = this.currentOpacity;
  }

  dispose() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
    }
  }
}
