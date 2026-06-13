# Tomate F1 Time Trial

Minijuego 2D de Formula 1 construido con Phaser 3 y Vite.

## Desarrollo local

```bash
cd game
npm install
npm run dev
```

## Build

```bash
cd game
npm run build
```

## Arquitectura

- `src/data/tracks`: definiciones JSON de circuitos.
- `src/data/cars`: definiciones JSON de coches.
- `src/repositories`: capa de acceso a datos preparada para sustituirse por API o BBDD.
- `src/entities`: entidades visuales del juego.
- `src/systems`: sistemas de input, vueltas y temporizador.
- `src/scenes`: escenas Phaser.

El circuito y el coche inicial se cargan desde JSON. En el futuro, los repositorios podran sustituir esta carga local por llamadas a una API.
