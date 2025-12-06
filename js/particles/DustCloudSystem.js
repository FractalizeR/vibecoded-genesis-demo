// js/particles/DustCloudSystem.js

import * as THREE from 'three';
import { BaseParticleSystem } from './BaseParticleSystem.js';
import { dustVertexShader, dustFragmentShader } from '../shaders/dust.js';

export class DustCloudSystem extends BaseParticleSystem {
  constructor(config) {
    super(config);
    this.visibility = 0;
  }

  createGeometry() {
    const count = this.config.count;
    const [minSize, maxSize] = this.config.sizeRange;
    const colors = this.config.colors;

    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const randoms = new Float32Array(count);
    const colorAttrib = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Позиция: распределение в диске галактики
      const r = 10 + Math.random() * 70;  // 10-80 единиц от центра
      const theta = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 10;  // Небольшая высота

      positions[i3] = r * Math.cos(theta);
      positions[i3 + 1] = height;
      positions[i3 + 2] = r * Math.sin(theta);

      // Size
      sizes[i] = minSize + Math.random() * (maxSize - minSize);

      // Random
      randoms[i] = Math.random();

      // Color: случайный из палитры
      const colorIndex = Math.floor(Math.random() * colors.length);
      colorAttrib[i3] = colors[colorIndex][0];
      colorAttrib[i3 + 1] = colors[colorIndex][1];
      colorAttrib[i3 + 2] = colors[colorIndex][2];
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('random', new THREE.BufferAttribute(randoms, 1));
    geometry.setAttribute('color', new THREE.BufferAttribute(colorAttrib, 3));

    return geometry;
  }

  createMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uNoiseScale: { value: this.config.noiseScale },
        uNoiseSpeed: { value: this.config.noiseSpeed },
        uVisibility: { value: 0 }
      },
      vertexShader: dustVertexShader,
      fragmentShader: dustFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
  }

  setVisibility(visibility) {
    this.visibility = visibility;
  }

  update(time, params) {
    if (this.material) {
      this.material.uniforms.uTime.value = time;
      this.material.uniforms.uVisibility.value = this.visibility;
    }
  }
}
