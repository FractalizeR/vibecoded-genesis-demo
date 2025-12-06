// js/particles/MainParticleSystem.js

import * as THREE from 'three';
import { BaseParticleSystem } from './BaseParticleSystem.js';
import { particlesVertexShader, particlesFragmentShader } from '../shaders/particles.js';

export class MainParticleSystem extends BaseParticleSystem {
  constructor(config) {
    super(config);
  }

  createGeometry() {
    const count = this.config.count;
    const spawnRadius = this.config.spawnRadius;
    const [minSize, maxSize] = this.config.sizeRange;
    const { redGiantChance, blueChance } = this.config.temperatures;

    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const birthTimes = new Float32Array(count);
    const randoms = new Float32Array(count);
    const temperatures = new Float32Array(count);

    // Стратифицированное распределение температур
    const redCount = Math.floor(count * redGiantChance);
    const blueCount = Math.floor(count * blueChance);
    const yellowCount = count - redCount - blueCount;

    // Заполняем массив температур
    let tempIndex = 0;
    for (let i = 0; i < redCount; i++) {
      temperatures[tempIndex++] = Math.random() * 0.3;  // 0-0.3
    }
    for (let i = 0; i < blueCount; i++) {
      temperatures[tempIndex++] = 0.7 + Math.random() * 0.3;  // 0.7-1.0
    }
    for (let i = 0; i < yellowCount; i++) {
      temperatures[tempIndex++] = 0.3 + Math.random() * 0.4;  // 0.3-0.7
    }

    // Shuffle temperatures
    this.shuffleArray(temperatures);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Позиция: маленький шар в центре
      const r = Math.random() * spawnRadius;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);

      // Velocity: направление от центра (для взрыва)
      // Для частиц в самом центре генерируем случайное направление
      let vx = positions[i3];
      let vy = positions[i3 + 1];
      let vz = positions[i3 + 2];
      let vLen = Math.sqrt(vx*vx + vy*vy + vz*vz);

      if (vLen < 0.01) {
        // Случайное направление на сфере для частиц в центре
        const randTheta = Math.random() * Math.PI * 2;
        const randPhi = Math.acos(2 * Math.random() - 1);
        vx = Math.sin(randPhi) * Math.cos(randTheta);
        vy = Math.sin(randPhi) * Math.sin(randTheta);
        vz = Math.cos(randPhi);
        vLen = 1;
      }

      velocities[i3] = vx / vLen + (Math.random() - 0.5) * 0.3;
      velocities[i3 + 1] = vy / vLen + (Math.random() - 0.5) * 0.3;
      velocities[i3 + 2] = vz / vLen + (Math.random() - 0.5) * 0.3;

      // Size
      sizes[i] = minSize + Math.random() * (maxSize - minSize);

      // Birth time: распределяем равномерно по всему lifetime
      // Это создаёт непрерывный поток частиц
      birthTimes[i] = Math.random() * (this.config.lifetime || 10.0);

      // Random для мерцания
      randoms[i] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('birthTime', new THREE.BufferAttribute(birthTimes, 1));
    geometry.setAttribute('random', new THREE.BufferAttribute(randoms, 1));
    geometry.setAttribute('temperature', new THREE.BufferAttribute(temperatures, 1));

    return geometry;
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  createMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uExplosionForce: { value: 0 },
        uFlowFieldStrength: { value: 0 },
        uNoiseScale: { value: this.config.noiseScale },
        uNoiseSpeed: { value: this.config.noiseSpeed },
        uMaxDistance: { value: this.config.maxDistance },
        uLifetime: { value: this.config.lifetime || 8.0 }
      },
      vertexShader: particlesVertexShader,
      fragmentShader: particlesFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
  }

  update(time, params) {
    if (this.material) {
      this.material.uniforms.uTime.value = time;
      this.material.uniforms.uExplosionForce.value = params.explosionForce || 0;
      this.material.uniforms.uFlowFieldStrength.value = params.flowFieldStrength || 0;
    }
  }
}
