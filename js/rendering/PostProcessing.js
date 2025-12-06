// js/rendering/PostProcessing.js

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import * as THREE from 'three';

import { compositeShader, godRaysShader } from '../shaders/postprocessing.js';

export class PostProcessing {
  constructor(renderer, scene, camera, config) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.config = config;

    // Создаём composer
    this.composer = new EffectComposer(renderer);

    // 1. Render pass
    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    // 2. Bloom pass
    const resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
    this.bloomPass = new UnrealBloomPass(
      resolution,
      config.strength,
      config.radius,
      config.threshold
    );
    this.composer.addPass(this.bloomPass);

    // 3. God Rays pass
    this.godRaysPass = new ShaderPass(godRaysShader);
    this.godRaysPass.uniforms.uExposure.value = 0.15;
    this.godRaysPass.uniforms.uDecay.value = 0.93;
    this.godRaysPass.uniforms.uDensity.value = 0.6;
    this.godRaysPass.uniforms.uWeight.value = 0.3;
    this.composer.addPass(this.godRaysPass);

    // 4. Composite pass (chromatic aberration + vignette + grain + color grading)
    this.compositePass = new ShaderPass(compositeShader);
    this.composer.addPass(this.compositePass);

    // Таймер для анимаций
    this.time = 0;
  }

  setBloomStrength(value) {
    this.bloomPass.strength = value;
  }

  /**
   * Установить интенсивность God Rays
   * @param {number} value - 0-1
   */
  setGodRaysIntensity(value) {
    this.godRaysPass.uniforms.uExposure.value = value * 0.3;
  }

  /**
   * Установить позицию источника света для God Rays (в screen space)
   * @param {number} x - 0-1
   * @param {number} y - 0-1
   */
  setGodRaysLightPosition(x, y) {
    this.godRaysPass.uniforms.uLightPosition.value = [x, y];
  }

  /**
   * Установить интенсивность chromatic aberration
   * @param {number} value - базовое значение ~0.002
   */
  setChromaticIntensity(value) {
    this.compositePass.uniforms.uChromaticIntensity.value = value;
  }

  /**
   * Установить интенсивность виньетки
   * @param {number} value - 0-1
   */
  setVignetteIntensity(value) {
    this.compositePass.uniforms.uVignetteIntensity.value = value;
  }

  /**
   * Установить интенсивность зерна
   * @param {number} value - базовое значение ~0.05
   */
  setGrainIntensity(value) {
    this.compositePass.uniforms.uGrainIntensity.value = value;
  }

  /**
   * Установить насыщенность
   * @param {number} value - 1.0 = нормальная
   */
  setSaturation(value) {
    this.compositePass.uniforms.uSaturation.value = value;
  }

  /**
   * Установить контраст
   * @param {number} value - 1.0 = нормальный
   */
  setContrast(value) {
    this.compositePass.uniforms.uContrast.value = value;
  }

  /**
   * Обновить все эффекты одним вызовом
   * @param {object} params - параметры эффектов
   */
  updateEffects(params) {
    if (params.chromaticIntensity !== undefined) {
      this.setChromaticIntensity(params.chromaticIntensity);
    }
    if (params.vignetteIntensity !== undefined) {
      this.setVignetteIntensity(params.vignetteIntensity);
    }
    if (params.grainIntensity !== undefined) {
      this.setGrainIntensity(params.grainIntensity);
    }
    if (params.godRaysIntensity !== undefined) {
      this.setGodRaysIntensity(params.godRaysIntensity);
    }
    if (params.saturation !== undefined) {
      this.setSaturation(params.saturation);
    }
    if (params.contrast !== undefined) {
      this.setContrast(params.contrast);
    }
  }

  render(deltaTime = 0.016) {
    // Обновляем время для анимаций
    this.time += deltaTime;
    this.compositePass.uniforms.uTime.value = this.time;

    this.composer.render();
  }

  onResize(width, height) {
    this.composer.setSize(width, height);
  }
}
