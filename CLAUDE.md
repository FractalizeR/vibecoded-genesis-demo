# Genesis — Flow Field Galaxy Demo

## Обзор

WebGL демо рождения Вселенной: сингулярность → Большой Взрыв → формирование галактики с непрерывным потоком звёзд.

**Технологии:** Three.js r160, GLSL шейдеры, ES6+ модули

## Запуск

```bash
npx serve .
# или
python3 -m http.server 8080
```

Открыть http://localhost:3000 (или :8080)

## Структура проекта

```
js/
├── main.js                 # Точка входа, game loop
├── config.js               # ВСЕ параметры (частицы, камера, эффекты)
├── core/
│   ├── EventBus.js         # Pub/sub для событий
│   ├── TimelineController.js # Управление фазами и временем
│   └── Easing.js           # Функции плавности
├── particles/
│   ├── MainParticleSystem.js # Основные звёзды галактики (150k)
│   ├── StarfieldSystem.js    # Фоновые звёзды (5k)
│   └── DustCloudSystem.js    # Космическая пыль
├── shaders/
│   ├── particles.js        # Шейдеры звёзд (цвет, движение, lifecycle)
│   ├── noise.js            # Curl noise, spiral flow
│   └── ...
├── effects/                # Singularity, ShockWave, LensFlare, ScreenShake
├── rendering/              # SceneManager, CameraController, PostProcessing
└── ui/                     # FadeOverlay, PhaseDisplay, HintDisplay
```

## Ключевые файлы для изменений

| Что изменить | Где искать |
|--------------|------------|
| Скорость/количество частиц | `js/config.js` → `PARTICLES` |
| Цвета звёзд | `js/shaders/particles.js` → `getStarColor()` |
| Движение частиц | `js/shaders/particles.js` → vertex shader |
| Спиральный flow | `js/shaders/noise.js` → `spiralFlow()` |
| Фазы timeline | `js/config.js` → `PHASE_DEFINITIONS` |
| Bloom/эффекты | `js/config.js` → `BLOOM`, `EFFECTS` |

## Фазы (Timeline)

| Время | Фаза | Что происходит |
|-------|------|----------------|
| 0-1s | intro | Fade in из темноты |
| 1-3s | darkness | Видны только фоновые звёзды |
| 3-4s | singularity | Пульсирующая точка в центре |
| 4-6s | bigbang | Взрыв, тряска, вспышка, shock waves |
| 6-16s | expansion | Частицы разлетаются, flow field включается |
| 16s+ | galaxy | Стабильная галактика с потоком звёзд |

## Архитектура частиц

Частицы имеют **цикл жизни** (lifetime ≈ 40 сек):
1. Рождаются в центре (ядро галактики)
2. Летят к краям по velocity + flow field
3. Fade out при достижении края
4. "Перерождаются" в центре (mod по времени)

Это создаёт непрерывный поток звёзд из ядра.

## Debug режим

В `js/config.js`:
```javascript
DEBUG: {
  enabled: true,  // Логи в консоль
  // ...
}
```

Консоль покажет: `t=5.0s | explosion=0.78 | flow=0.00`

## Тесты

```bash
npm test
```

Покрывают: Easing, EventBus, TimelineController, config.
