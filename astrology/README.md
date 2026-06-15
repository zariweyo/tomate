# Tomate Astrology

Modulo de compatibilidad astrologica para Tomate.

## Stack

- Vite
- JavaScript ES Modules
- Tailwind CSS
- DaisyUI
- Lucide Icons
- Motion One
- js-yaml

## Arquitectura

El modulo esta orientado a datos. Las preguntas, pantallas, arbol de decision y reglas de puntuacion viven en YAML.

```text
src/data/questions.yaml
src/data/steps.yaml
src/data/decision-tree.yaml
src/data/scoring-rules.yaml
src/data/zodiac.yaml
```

## Flujo inicial

1. Signos del zodiaco
2. Edades
3. Sexo
4. Tipo de vinculo
5. Resultado de compatibilidad

## Desarrollo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
