// js/rendering/SceneManager.js

import * as THREE from 'three';

export class SceneManager {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.config = config;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      config.CAMERA.fov,
      window.innerWidth / window.innerHeight,
      config.CAMERA.near,
      config.CAMERA.far
    );
    this.camera.position.set(
      config.CAMERA.position[0],
      config.CAMERA.position[1],
      config.CAMERA.position[2]
    );
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Bind resize handler
    this.onResize = this.onResize.bind(this);
  }

  getScene() {
    return this.scene;
  }

  getCamera() {
    return this.camera;
  }

  getRenderer() {
    return this.renderer;
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  dispose() {
    this.renderer.dispose();
  }
}
