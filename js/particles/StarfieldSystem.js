// js/particles/StarfieldSystem.js

import * as THREE from 'three';
import { BaseParticleSystem } from './BaseParticleSystem.js';
import { starfieldVertexShader, starfieldFragmentShader } from '../shaders/starfield.js';

export class StarfieldSystem extends BaseParticleSystem {
  constructor(config) {
    super(config);
  }

  createGeometry() {
    const count = this.config.count;
    const [minDistance, maxDistance] = this.config.distanceRange;
    const [minSize, maxSize] = this.config.sizeRange;

    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const randoms = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Равномерное распределение на сфере
      const radius = minDistance + Math.random() * (maxDistance - minDistance);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const i3 = i * 3;
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      sizes[i] = minSize + Math.random() * (maxSize - minSize);
      randoms[i] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('random', new THREE.BufferAttribute(randoms, 1));

    return geometry;
  }

  createMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTwinkleSpeed: { value: this.config.twinkleSpeed }
      },
      vertexShader: starfieldVertexShader,
      fragmentShader: starfieldFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
  }

  update(time, params) {
    if (this.material) {
      this.material.uniforms.uTime.value = time;
    }
  }
}
