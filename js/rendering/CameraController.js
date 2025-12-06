// js/rendering/CameraController.js

import * as THREE from 'three';
import { clamp } from '../core/Easing.js';

export class CameraController {
  constructor(camera, domElement, config) {
    this.camera = camera;
    this.domElement = domElement;
    this.config = config;

    // Состояние
    this.autoRotate = true;
    this.autoRotateAngle = 0;

    // Целевые углы для плавного движения
    this.targetRotationX = 0;
    this.targetRotationY = 0;
    this.currentRotationX = 0;
    this.currentRotationY = 0;

    // Для drag
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };

    // Zoom
    this.targetFov = config.fov;
    this.currentFov = config.fov;

    // Shake offset
    this.shakeOffset = new THREE.Vector3();

    // Базовая позиция и ориентация
    this.basePosition = new THREE.Vector3(...config.position);
    this.lookAtTarget = new THREE.Vector3(0, 0, 0);

    // Привязка обработчиков
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onWheel = this.onWheel.bind(this);

    // Подписка на события
    this.domElement.addEventListener('mousedown', this.onMouseDown);
    this.domElement.addEventListener('mousemove', this.onMouseMove);
    this.domElement.addEventListener('mouseup', this.onMouseUp);
    this.domElement.addEventListener('mouseleave', this.onMouseUp);
    this.domElement.addEventListener('wheel', this.onWheel, { passive: false });
  }

  onMouseDown(event) {
    this.isDragging = true;
    this.previousMousePosition = {
      x: event.clientX,
      y: event.clientY
    };
  }

  onMouseMove(event) {
    if (!this.isDragging || this.autoRotate) return;

    const deltaX = event.clientX - this.previousMousePosition.x;
    const deltaY = event.clientY - this.previousMousePosition.y;

    this.targetRotationY += deltaX * this.config.sensitivity;
    this.targetRotationX += deltaY * this.config.sensitivity;

    // Ограничиваем вертикальный угол
    this.targetRotationX = clamp(this.targetRotationX, -Math.PI / 2 + 0.1, Math.PI / 2 - 0.1);

    this.previousMousePosition = {
      x: event.clientX,
      y: event.clientY
    };
  }

  onMouseUp() {
    this.isDragging = false;
  }

  onWheel(event) {
    event.preventDefault();

    const delta = event.deltaY > 0 ? 1 : -1;
    this.targetFov += delta * this.config.zoomSpeed * 10;
    this.targetFov = clamp(this.targetFov, this.config.zoomRange[0], this.config.zoomRange[1]);
  }

  setAutoRotate(enabled) {
    this.autoRotate = enabled;
  }

  applyShake(x, y, z) {
    this.shakeOffset.set(x, y, z);
  }

  update(deltaTime) {
    // Авторотация
    if (this.autoRotate) {
      this.autoRotateAngle += this.config.autoRotateSpeed * deltaTime;
      this.targetRotationY = this.autoRotateAngle;
    }

    // Плавная интерполяция вращения
    const lerpFactor = 1 - Math.pow(1 - this.config.damping, deltaTime * 60);

    this.currentRotationX += (this.targetRotationX - this.currentRotationX) * lerpFactor;
    this.currentRotationY += (this.targetRotationY - this.currentRotationY) * lerpFactor;

    // Плавная интерполяция FOV
    this.currentFov += (this.targetFov - this.currentFov) * lerpFactor;
    this.camera.fov = this.currentFov;
    this.camera.updateProjectionMatrix();

    // Вычисляем позицию камеры на сфере
    const distance = this.basePosition.length();

    const x = distance * Math.sin(this.currentRotationY) * Math.cos(this.currentRotationX);
    const y = distance * Math.sin(this.currentRotationX) + 10; // +10 — базовое смещение вверх
    const z = distance * Math.cos(this.currentRotationY) * Math.cos(this.currentRotationX);

    this.camera.position.set(x, y, z);

    // Применяем shake
    this.camera.position.add(this.shakeOffset);

    // Смотрим в центр
    this.camera.lookAt(this.lookAtTarget);

    // Сбрасываем shake offset
    this.shakeOffset.set(0, 0, 0);
  }

  dispose() {
    this.domElement.removeEventListener('mousedown', this.onMouseDown);
    this.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.domElement.removeEventListener('mouseup', this.onMouseUp);
    this.domElement.removeEventListener('mouseleave', this.onMouseUp);
    this.domElement.removeEventListener('wheel', this.onWheel);
  }
}
