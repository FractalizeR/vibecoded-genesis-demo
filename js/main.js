// js/main.js

import * as THREE from 'three';
import { config } from './config.js';
import { EventBus } from './core/EventBus.js';
import { TimelineController } from './core/TimelineController.js';
import { SceneManager } from './rendering/SceneManager.js';
import { CameraController } from './rendering/CameraController.js';
import { PostProcessing } from './rendering/PostProcessing.js';
import { StarfieldSystem } from './particles/StarfieldSystem.js';
import { MainParticleSystem } from './particles/MainParticleSystem.js';
import { DustCloudSystem } from './particles/DustCloudSystem.js';
import { Singularity } from './effects/Singularity.js';
import { ScreenShake } from './effects/ScreenShake.js';
import { LensFlare } from './effects/LensFlare.js';
import { ShockWave } from './effects/ShockWave.js';
import { FadeOverlay } from './ui/FadeOverlay.js';
import { PhaseDisplay } from './ui/PhaseDisplay.js';
import { HintDisplay } from './ui/HintDisplay.js';

// 1. Инициализация
const canvas = document.getElementById('canvas');
const eventBus = new EventBus();
const sceneManager = new SceneManager(canvas, config);
const scene = sceneManager.getScene();
const camera = sceneManager.getCamera();
const renderer = sceneManager.getRenderer();

// 2. Проверка WebGL
if (!renderer.capabilities.isWebGL2) {
  document.body.innerHTML = '<div class="error">WebGL 2 required</div>';
  throw new Error('WebGL 2 not supported');
}

// 3. Создание компонентов
const timeline = new TimelineController(config.PHASES, eventBus);
const cameraController = new CameraController(camera, canvas, config.CAMERA);
const postProcessing = new PostProcessing(renderer, scene, camera, config.BLOOM);
const screenShake = new ScreenShake();
const lensFlare = new LensFlare(scene, config.EFFECTS.lensFlare);
const shockWave = new ShockWave(scene, config.EFFECTS.shockWave);
const singularity = new Singularity(scene, config.EFFECTS.singularity);

// Particle systems
const starfield = new StarfieldSystem(config.STARFIELD);
scene.add(starfield.init());
starfield.setVisible(false);

const mainParticles = new MainParticleSystem(config.PARTICLES);
scene.add(mainParticles.init());
mainParticles.setVisible(false);

const dustClouds = new DustCloudSystem(config.DUST);
scene.add(dustClouds.init());
dustClouds.setVisible(false);

// UI
const fadeOverlay = new FadeOverlay(document.getElementById('fade-overlay'));
const phaseDisplay = new PhaseDisplay(document.getElementById('phase-display'), eventBus);
const hintDisplay = new HintDisplay(document.getElementById('hint-display'));

// 4. События
eventBus.on('bigbang:start', () => {
  screenShake.trigger(config.EFFECTS.shake.intensity, config.EFFECTS.shake.duration);
  lensFlare.trigger(config.EFFECTS.lensFlare.duration);
  shockWave.triggerSequence(
    config.EFFECTS.shockWave.count,
    config.EFFECTS.shockWave.interval
  );
});

// Показать подсказку после darkness
eventBus.on('phase:changed', ({ to }) => {
  if (to === 'singularity') {
    hintDisplay.show('Нажми, чтобы осмотреться');
  }
});

// Скрыть подсказку при взаимодействии
let userInteracted = false;
canvas.addEventListener('click', () => {
  if (!userInteracted) {
    userInteracted = true;
    hintDisplay.hide();
    cameraController.setAutoRotate(false);
  }
}, { once: true });

// Debug: логируем смены фаз
if (config.DEBUG.logPhaseChanges) {
  eventBus.on('phase:changed', ({ from, to, label }) => {
    console.log(`Phase: ${from} -> ${to}${label ? ` [${label}]` : ''}`);
  });
}

// 5. Game loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const deltaTime = clock.getDelta();

  // Update timeline
  timeline.update(deltaTime);

  // Update camera
  cameraController.update(deltaTime);
  if (screenShake.isActive()) {
    const shakeOffset = screenShake.update(deltaTime);
    cameraController.applyShake(shakeOffset.x, shakeOffset.y, shakeOffset.z);
  }

  // Update UI
  fadeOverlay.setOpacity(timeline.getFadeOpacity());

  // Update particles
  const time = timeline.getGlobalTime();

  // Starfield
  starfield.setVisible(timeline.isStarfieldVisible());
  starfield.update(time, {});

  // Main particles
  const explosionForce = timeline.getExplosionForce();
  const flowFieldStrength = timeline.getFlowFieldStrength();

  mainParticles.setVisible(timeline.isParticlesVisible());
  mainParticles.update(time, { explosionForce, flowFieldStrength });

  // Debug: логируем каждую секунду
  if (config.DEBUG.enabled && Math.floor(time) !== Math.floor(time - deltaTime)) {
    console.log(`t=${time.toFixed(1)}s | explosion=${explosionForce.toFixed(2)} | flow=${flowFieldStrength.toFixed(2)}`);
  }

  // Dust clouds
  const dustVisible = timeline.isDustVisible();
  dustClouds.setVisible(dustVisible);
  if (dustVisible) {
    // Постепенное появление пыли
    const dustProgress = Math.min(1, (time - 6) / 4); // 4 секунды на появление
    dustClouds.setVisibility(dustProgress);
  }
  dustClouds.update(time, {});

  // Update effects
  singularity.update(
    timeline.getSingularityGlow(),
    timeline.getCurrentPhase().name,
    timeline.getPhaseProgress()
  );
  lensFlare.update(deltaTime);
  shockWave.update(deltaTime);

  // Update post-processing
  postProcessing.setBloomStrength(timeline.getBloomStrength());

  // Render
  postProcessing.render();
}

// 6. Resize handling
window.addEventListener('resize', () => {
  sceneManager.onResize();
  postProcessing.onResize(window.innerWidth, window.innerHeight);
});

// 7. Start
animate();

// Export for debugging
if (config.DEBUG.enabled) {
  window.gameConfig = config;
  window.timeline = timeline;
  window.scene = scene;
  window.camera = camera;
  window.renderer = renderer;
}

console.log('Genesis demo initialized');
