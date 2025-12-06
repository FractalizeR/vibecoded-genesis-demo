# Genesis — Flow Field Galaxy Demo

## Обзор проекта

**Цель:** Создать визуально впечатляющее WebGL демо — рождение Вселенной от сингулярности через Большой Взрыв к формированию галактики.

**Технологии:** HTML5, JavaScript (ES6+), Three.js r160, GLSL шейдеры

**Запуск:** Локальный HTTP сервер (ES modules требуют сервера)
```bash
# Любой из вариантов:
npx serve .
python3 -m http.server 8080
```

---

## Документация

| Документ | Описание |
|----------|----------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Структура файлов, модули, зависимости |
| [docs/SHADERS.md](docs/SHADERS.md) | Полный код шейдеров с комментариями |
| [docs/DATA_STRUCTURES.md](docs/DATA_STRUCTURES.md) | Интерфейсы, типы данных, события |
| [docs/CONFIG.md](docs/CONFIG.md) | Полная спецификация конфигурации |
| [docs/TESTING.md](docs/TESTING.md) | План тестирования, тест-кейсы |
| [docs/CHECKLIST.md](docs/CHECKLIST.md) | Финальный чек-лист проверки |

---

## Концепция

Наблюдатель находится вблизи центра Вселенной в момент Большого Взрыва. Камера фиксирована в пространстве, но пользователь может вращать направление взгляда мышью. До первого взаимодействия камера медленно вращается автоматически.

Частицы-звёзды разлетаются от центра, постепенно подхватываются flow field и формируют спиральную галактику. Между звёздами плавают облака космической пыли. Фоновые далёкие звёзды создают ощущение глубины.

---

## Сценарий (Timeline)

| Время | Фаза | Описание | UI Label |
|-------|------|----------|----------|
| 0-1s | INTRO | Fade in из полной темноты | — |
| 1-3s | DARKNESS | Чёрный экран, видны только далёкие фоновые звёзды | — |
| 3-4s | SINGULARITY | В центре появляется яркая белая точка, пульсирует, нарастает bloom | "SINGULARITY" |
| 4-6s | BIG_BANG | Резкая вспышка, screen shake, shock waves, частицы разлетаются, lens flare | "BIG BANG" |
| 6-16s | EXPANSION | Скорость снижается, flow field подхватывает частицы, появляется спираль, проявляется пыль | "EXPANSION" |
| 16s+ | GALAXY | Стабильная спиральная галактика, медленное вращение, пульсация ядра | — |

---

## Этапы реализации

### Этап 1: Инфраструктура
**Файлы:** `index.html`, `style.css`, `package.json`, `test/setup.js`, `js/config.js`

**Задачи:**
- [ ] Создать `index.html` с canvas и importmap (см. [ARCHITECTURE.md](docs/ARCHITECTURE.md#indexhtml))
- [ ] Создать `style.css` с fullscreen canvas и UI стилями (см. [ARCHITECTURE.md](docs/ARCHITECTURE.md#stylecss))
- [ ] Создать `package.json` с vitest
- [ ] Создать `test/setup.js` с моками Three.js
- [ ] Создать `js/config.js` (см. [CONFIG.md](docs/CONFIG.md))

**DoD:**
- `npm install` завершается без ошибок
- `npm test` запускается (0 тестов пока)
- `index.html` открывается в браузере без ошибок в консоли

---

### Этап 2: Core модули (TDD)
**Файлы:** `js/core/Easing.js`, `js/core/EventBus.js`, `js/core/TimelineController.js`

**Задачи:**
- [ ] Написать тесты для `Easing.js` → реализовать → все тесты зелёные
- [ ] Написать тесты для `EventBus.js` → реализовать → все тесты зелёные
- [ ] Написать тесты для `TimelineController.js` → реализовать → все тесты зелёные

**DoD:**
- `npm test` — 100% тестов проходит
- Покрытие core модулей >90%

---

### Этап 3: Базовый рендеринг + Fade
**Файлы:** `js/rendering/SceneManager.js`, `js/ui/FadeOverlay.js`, `js/main.js`

**Задачи:**
- [ ] Реализовать `SceneManager.js` (инициализация Three.js)
- [ ] Реализовать `FadeOverlay.js` (чёрный оверлей с opacity)
- [ ] Реализовать базовый `main.js` с game loop
- [ ] Подключить TimelineController к FadeOverlay

**DoD:**
- При открытии страницы — чёрный экран плавно становится прозрачным за 1 секунду
- Нет ошибок в консоли
- `renderer.info.render.triangles` возвращает число (Three.js работает)

---

### Этап 4: Фоновые звёзды
**Файлы:** `js/particles/BaseParticleSystem.js`, `js/particles/StarfieldSystem.js`, `js/shaders/starfield.js`

**Задачи:**
- [ ] Реализовать `BaseParticleSystem.js` (абстрактный базовый класс)
- [ ] Реализовать шейдеры в `js/shaders/starfield.js` (см. [SHADERS.md](docs/SHADERS.md#starfield))
- [ ] Реализовать `StarfieldSystem.js`
- [ ] Звёзды появляются после fade in (t > 1s)

**DoD:**
- После fade in видны ~5000 статичных звёзд на сфере большого радиуса
- Звёзды слабо мерцают
- FPS > 50

---

### Этап 5: Основные частицы + температуры
**Файлы:** `js/shaders/noise.js`, `js/shaders/particles.js`, `js/particles/MainParticleSystem.js`

**Задачи:**
- [ ] Реализовать noise функции в `js/shaders/noise.js` (см. [SHADERS.md](docs/SHADERS.md#noise))
- [ ] Реализовать шейдеры в `js/shaders/particles.js` (см. [SHADERS.md](docs/SHADERS.md#particles))
- [ ] Реализовать `MainParticleSystem.js` с атрибутом temperature
- [ ] Подключить uniforms из TimelineController

**DoD:**
- ~150000 частиц отображаются в центре (сингулярность)
- Частицы имеют разные цвета: красные (~5%), жёлтые/белые (~70%), голубые (~25%)
- Красные гиганты визуально крупнее
- FPS > 30

---

### Этап 6: Взрыв и Flow Field
**Файлы:** Модификация `js/shaders/particles.js`, `js/particles/MainParticleSystem.js`

**Задачи:**
- [ ] Реализовать радиальное разлетание в шейдере (uExplosionForce)
- [ ] Реализовать curl noise flow field (uFlowFieldStrength)
- [ ] Добавить staggered birth time для постепенного появления
- [ ] Настроить плавный переход от взрыва к спирали

**DoD:**
- При t=4s частицы начинают разлетаться от центра
- К t=10s частицы образуют спиральную структуру
- К t=16s галактика стабильна, медленно вращается
- Частицы распределены в радиусе 50-80 единиц
- FPS > 30

---

### Этап 7: Сингулярность и эффекты взрыва
**Файлы:** `js/effects/Singularity.js`, `js/effects/ScreenShake.js`, `js/effects/LensFlare.js`, `js/effects/ShockWave.js`, `js/shaders/shockwave.js`

**Задачи:**
- [ ] Реализовать `Singularity.js` (пульсирующее ядро)
- [ ] Реализовать `ScreenShake.js` (тряска камеры)
- [ ] Реализовать `LensFlare.js` (вспышка при взрыве)
- [ ] Реализовать `ShockWave.js` с шейдерами (расширяющиеся кольца)
- [ ] Подключить к событиям timeline (bigbang:start, shockwave:trigger)

**DoD:**
- В фазе singularity (t=3-4s) — пульсирующая яркая точка в центре
- При t=4s:
  - Экран трясётся 0.5s
  - Яркая вспышка (lens flare) 1s
  - 3 расширяющихся кольца с интервалом 0.4s
- Сингулярность уменьшается и становится ядром галактики

---

### Этап 8: Камера
**Файлы:** `js/rendering/CameraController.js`

**Задачи:**
- [ ] Реализовать auto-rotate до первого клика
- [ ] Реализовать mouse look после клика (pointer lock не обязателен)
- [ ] Реализовать zoom колесом мыши (изменение FOV)
- [ ] Интегрировать с ScreenShake (аддитивное смещение)

**DoD:**
- До клика камера медленно вращается вокруг центра
- После клика — управление мышью (drag to rotate)
- Scroll изменяет FOV в диапазоне 30-120 градусов
- Плавная интерполяция всех движений (damping)

---

### Этап 9: Космическая пыль
**Файлы:** `js/shaders/dust.js`, `js/particles/DustCloudSystem.js`

**Задачи:**
- [ ] Реализовать шейдеры в `js/shaders/dust.js` (см. [SHADERS.md](docs/SHADERS.md#dust))
- [ ] Реализовать `DustCloudSystem.js`
- [ ] Постепенное появление в фазе expansion (t > 6s)

**DoD:**
- ~3000 крупных полупрозрачных частиц (alpha 0.02-0.08)
- Медленное независимое движение
- Приглушённые фиолетовые/синие оттенки
- Появляются постепенно к t=10s

---

### Этап 10: Пост-обработка
**Файлы:** `js/rendering/PostProcessing.js`

**Задачи:**
- [ ] Реализовать `PostProcessing.js` с EffectComposer
- [ ] Добавить UnrealBloomPass
- [ ] Динамическое изменение bloom strength по фазам

**DoD:**
- Bloom strength = 1.5 в обычном состоянии
- Bloom strength = 3.0 в момент взрыва (t=4-5s)
- Плавные переходы между значениями
- FPS > 30 с включённым bloom

---

### Этап 11: UI
**Файлы:** `js/ui/PhaseDisplay.js`, `js/ui/HintDisplay.js`

**Задачи:**
- [ ] Реализовать `PhaseDisplay.js` (название фазы)
- [ ] Реализовать `HintDisplay.js` (подсказка для пользователя)
- [ ] Подключить PhaseDisplay к EventBus (phase:changed)
- [ ] HintDisplay появляется после darkness, исчезает при взаимодействии

**DoD:**
- "SINGULARITY" появляется при t=3s, исчезает при t=4s
- "BIG BANG" появляется при t=4s, исчезает при t=6s
- "EXPANSION" появляется при t=6s
- Подсказка "Click to look around" появляется при t=3s
- Подсказка исчезает после первого клика

---

### Этап 12: Финальная проверка
**Файлы:** —

**Задачи:**
- [ ] Пройти чек-лист из [CHECKLIST.md](docs/CHECKLIST.md)
- [ ] Убедиться, что все тесты проходят
- [ ] Проверить отсутствие ошибок в консоли

**DoD:**
- Все пункты чек-листа отмечены
- `npm test` — все тесты зелёные
- Консоль браузера чистая (без ошибок и warnings)

---

## Обработка ошибок

### WebGL не поддерживается
```javascript
if (!renderer.capabilities.isWebGL2) {
  document.body.innerHTML = '<div class="error">WebGL 2 required</div>';
  return;
}
```

### Shader compilation error
```javascript
material.onBeforeCompile = (shader) => {
  // Логировать ошибки компиляции
};
// Если shader не компилируется — graceful degradation
```

### Низкий FPS
```javascript
// В game loop:
if (fps < 20 && frameCount > 60) {
  config.PARTICLES.count = Math.floor(config.PARTICLES.count * 0.7);
  // Пересоздать particle system
}
```

---

## Возможные проблемы и решения

| Проблема | Решение |
|----------|---------|
| Низкий FPS | Уменьшить PARTICLES.count до 100000, снизить pixel ratio |
| Частицы "дёргаются" | Увеличить damping в flow field |
| Слишком яркий bloom | Уменьшить strength, увеличить threshold |
| Частицы улетают за экран | Уменьшить maxDistance или explosionForce |
| ES modules не загружаются | Запустить через HTTP сервер (не file://) |
| Шейдер не компилируется | Проверить GLSL синтаксис в консоли |

---

## Расширения (после базовой реализации)

1. Двойные звёзды — пары связанных частиц
2. Сверхновые — случайные вспышки отдельных звёзд
3. Кнопка Replay — перезапуск сценария
4. Mobile support — touch для управления камерой
5. Аудио — ambient space sound + crescendo на взрыве
