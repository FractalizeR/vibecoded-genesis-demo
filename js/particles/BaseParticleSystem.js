// js/particles/BaseParticleSystem.js

import * as THREE from 'three';

export class BaseParticleSystem {
  constructor(config) {
    if (new.target === BaseParticleSystem) {
      throw new Error('BaseParticleSystem is abstract');
    }

    this.config = config;
    this.geometry = null;
    this.material = null;
    this.points = null;
  }

  // Абстрактные методы — должны быть переопределены
  createGeometry() {
    throw new Error('Must implement createGeometry');
  }

  createMaterial() {
    throw new Error('Must implement createMaterial');
  }

  init() {
    this.geometry = this.createGeometry();
    this.material = this.createMaterial();
    this.points = new THREE.Points(this.geometry, this.material);
    return this.points;
  }

  update(time, params) {
    // Переопределяется в наследниках
  }

  setVisible(visible) {
    if (this.points) {
      this.points.visible = visible;
    }
  }

  dispose() {
    if (this.geometry) {
      this.geometry.dispose();
    }
    if (this.material) {
      this.material.dispose();
    }
  }
}
