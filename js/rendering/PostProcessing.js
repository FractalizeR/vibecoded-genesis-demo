// js/rendering/PostProcessing.js

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import * as THREE from 'three';

export class PostProcessing {
  constructor(renderer, scene, camera, config) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.config = config;

    // Создаём composer
    this.composer = new EffectComposer(renderer);

    // Render pass
    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    // Bloom pass
    const resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
    this.bloomPass = new UnrealBloomPass(
      resolution,
      config.strength,     // strength
      config.radius,       // radius
      config.threshold     // threshold
    );
    this.composer.addPass(this.bloomPass);
  }

  setBloomStrength(value) {
    this.bloomPass.strength = value;
  }

  render() {
    this.composer.render();
  }

  onResize(width, height) {
    this.composer.setSize(width, height);
  }
}
