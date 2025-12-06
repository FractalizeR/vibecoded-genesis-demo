// test/setup.js
// Моки для Three.js — минимальный набор для тестирования логики

export class MockVector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  copy(v) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  multiplyScalar(s) {
    this.x *= s;
    this.y *= s;
    this.z *= s;
    return this;
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  normalize() {
    const len = this.length();
    if (len > 0) {
      this.x /= len;
      this.y /= len;
      this.z /= len;
    }
    return this;
  }

  clone() {
    return new MockVector3(this.x, this.y, this.z);
  }
}

export class MockClock {
  constructor() {
    this.elapsedTime = 0;
    this.lastTime = 0;
  }

  getDelta() {
    const delta = this.elapsedTime - this.lastTime;
    this.lastTime = this.elapsedTime;
    return delta;
  }

  getElapsedTime() {
    return this.elapsedTime;
  }

  // Для тестов: симуляция времени
  advance(seconds) {
    this.elapsedTime += seconds;
  }
}

// Мок для requestAnimationFrame
export function mockRAF() {
  let callbacks = [];
  let time = 0;

  global.requestAnimationFrame = (cb) => {
    callbacks.push(cb);
    return callbacks.length;
  };

  global.cancelAnimationFrame = (id) => {
    callbacks[id - 1] = null;
  };

  return {
    tick: (deltaMs = 16) => {
      time += deltaMs;
      const cbs = callbacks.slice();
      callbacks = [];
      cbs.forEach(cb => cb && cb(time));
    }
  };
}
