// js/shaders/postprocessing.js

/**
 * Chromatic Aberration — цветовое расщепление на краях
 */
export const chromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    uIntensity: { value: 0.003 },
    uTime: { value: 0 }
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uIntensity;
    uniform float uTime;
    varying vec2 vUv;

    void main() {
      vec2 center = vUv - 0.5;
      float dist = length(center);

      // Усиливаем эффект к краям
      float aberration = dist * dist * uIntensity;

      // Небольшая анимация
      aberration *= 1.0 + sin(uTime * 0.5) * 0.1;

      // Смещение каналов
      vec2 redOffset = center * aberration;
      vec2 blueOffset = -center * aberration;

      float r = texture2D(tDiffuse, vUv + redOffset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv + blueOffset).b;

      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `
};

/**
 * Vignette — затемнение краёв
 */
export const vignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    uIntensity: { value: 0.4 },
    uSmoothness: { value: 0.5 }
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uIntensity;
    uniform float uSmoothness;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);

      vec2 center = vUv - 0.5;
      float dist = length(center) * 2.0; // 0 в центре, ~1.4 в углах

      // Плавное затемнение
      float vignette = 1.0 - smoothstep(1.0 - uSmoothness, 1.0 + uSmoothness, dist * (1.0 + uIntensity));

      // Затемняем, но не до полной черноты (минимум 0.2)
      vignette = mix(0.2, 1.0, vignette);

      gl_FragColor = vec4(color.rgb * vignette, color.a);
    }
  `
};

/**
 * Film Grain — кинематографический шум
 */
export const filmGrainShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uIntensity: { value: 0.08 },
    uSpeed: { value: 15.0 }
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uIntensity;
    uniform float uSpeed;
    varying vec2 vUv;

    // Простой псевдослучайный генератор
    float random(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);

      // Генерируем шум
      float noise = random(vUv + fract(uTime * uSpeed));

      // Центрируем шум вокруг 0
      noise = (noise - 0.5) * 2.0;

      // Меньше шума в ярких областях
      float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      float grainAmount = uIntensity * (1.0 - luminance * 0.5);

      // Применяем шум
      color.rgb += noise * grainAmount;

      gl_FragColor = color;
    }
  `
};

/**
 * Color Grading — цветокоррекция для космического вида
 */
export const colorGradingShader = {
  uniforms: {
    tDiffuse: { value: null },
    uSaturation: { value: 1.2 },
    uContrast: { value: 1.1 },
    uBrightness: { value: 1.0 },
    // Цветовой сдвиг для теней и светов
    uShadowTint: { value: [0.1, 0.05, 0.15] },  // Фиолетовые тени
    uHighlightTint: { value: [1.0, 0.95, 0.9] } // Тёплые света
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uSaturation;
    uniform float uContrast;
    uniform float uBrightness;
    uniform vec3 uShadowTint;
    uniform vec3 uHighlightTint;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);

      // Яркость
      color.rgb *= uBrightness;

      // Контраст (вокруг среднего серого)
      color.rgb = (color.rgb - 0.5) * uContrast + 0.5;

      // Насыщенность
      float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      color.rgb = mix(vec3(luminance), color.rgb, uSaturation);

      // Color grading: тонировка теней и светов
      float shadowMask = 1.0 - smoothstep(0.0, 0.4, luminance);
      float highlightMask = smoothstep(0.6, 1.0, luminance);

      color.rgb = mix(color.rgb, color.rgb + uShadowTint * 0.3, shadowMask);
      color.rgb = mix(color.rgb, color.rgb * uHighlightTint, highlightMask);

      // Clamp
      color.rgb = clamp(color.rgb, 0.0, 1.0);

      gl_FragColor = color;
    }
  `
};

/**
 * God Rays (Volumetric Light Scattering)
 * Лучи света из центра
 */
export const godRaysShader = {
  uniforms: {
    tDiffuse: { value: null },
    uLightPosition: { value: [0.5, 0.5] }, // Центр экрана
    uExposure: { value: 0.3 },
    uDecay: { value: 0.95 },
    uDensity: { value: 0.8 },
    uWeight: { value: 0.4 },
    uSamples: { value: 60 }
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 uLightPosition;
    uniform float uExposure;
    uniform float uDecay;
    uniform float uDensity;
    uniform float uWeight;
    uniform int uSamples;
    varying vec2 vUv;

    void main() {
      vec2 deltaTextCoord = (vUv - uLightPosition) * (1.0 / float(uSamples)) * uDensity;
      vec2 textCoord = vUv;
      vec4 color = texture2D(tDiffuse, vUv);

      float illuminationDecay = 1.0;
      vec3 godRays = vec3(0.0);

      for (int i = 0; i < 60; i++) {
        if (i >= uSamples) break;

        textCoord -= deltaTextCoord;
        vec4 sampleColor = texture2D(tDiffuse, textCoord);

        // Берём только яркие пиксели
        float brightness = dot(sampleColor.rgb, vec3(0.299, 0.587, 0.114));
        sampleColor.rgb *= smoothstep(0.3, 0.8, brightness);

        sampleColor.rgb *= illuminationDecay * uWeight;
        godRays += sampleColor.rgb;
        illuminationDecay *= uDecay;
      }

      godRays *= uExposure;

      gl_FragColor = vec4(color.rgb + godRays, 1.0);
    }
  `
};

/**
 * Комбинированный финальный шейдер
 * Объединяет несколько эффектов для производительности
 */
export const compositeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },

    // Chromatic aberration
    uChromaticIntensity: { value: 0.002 },

    // Vignette
    uVignetteIntensity: { value: 0.3 },
    uVignetteSmoothness: { value: 0.4 },

    // Film grain
    uGrainIntensity: { value: 0.05 },

    // Color grading
    uSaturation: { value: 1.15 },
    uContrast: { value: 1.05 },
    uBrightness: { value: 1.0 }
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;

    uniform float uChromaticIntensity;
    uniform float uVignetteIntensity;
    uniform float uVignetteSmoothness;
    uniform float uGrainIntensity;
    uniform float uSaturation;
    uniform float uContrast;
    uniform float uBrightness;

    varying vec2 vUv;

    float random(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 center = vUv - 0.5;
      float dist = length(center);

      // === Chromatic Aberration ===
      float aberration = dist * dist * uChromaticIntensity;
      vec2 redOffset = center * aberration;
      vec2 blueOffset = -center * aberration;

      float r = texture2D(tDiffuse, vUv + redOffset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv + blueOffset).b;
      vec3 color = vec3(r, g, b);

      // === Color Grading ===
      color *= uBrightness;
      color = (color - 0.5) * uContrast + 0.5;

      float luminance = dot(color, vec3(0.299, 0.587, 0.114));
      color = mix(vec3(luminance), color, uSaturation);

      // Фиолетовые тени, тёплые света
      float shadowMask = 1.0 - smoothstep(0.0, 0.3, luminance);
      float highlightMask = smoothstep(0.7, 1.0, luminance);

      color += vec3(0.05, 0.02, 0.1) * shadowMask;
      color *= mix(vec3(1.0), vec3(1.0, 0.97, 0.92), highlightMask);

      // === Vignette ===
      float vigDist = dist * 2.0;
      float vignette = 1.0 - smoothstep(1.0 - uVignetteSmoothness, 1.0 + uVignetteSmoothness, vigDist * (1.0 + uVignetteIntensity));
      vignette = mix(0.15, 1.0, vignette);
      color *= vignette;

      // === Film Grain ===
      float noise = random(vUv + fract(uTime * 10.0));
      noise = (noise - 0.5) * 2.0;
      float grainAmount = uGrainIntensity * (1.0 - luminance * 0.5);
      color += noise * grainAmount;

      // Clamp
      color = clamp(color, 0.0, 1.0);

      gl_FragColor = vec4(color, 1.0);
    }
  `
};
