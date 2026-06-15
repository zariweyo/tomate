import { renderIcon } from './icons.js';

export function renderResultScreen(result) {
  return `
    <section class="step-shell flex items-center justify-center px-4 py-8 text-white">
      <div class="card w-full max-w-2xl border border-white/10 bg-base-100/20 shadow-2xl backdrop-blur">
        <div class="card-body items-center gap-6 text-center">
          <div class="rounded-full bg-primary/25 p-5 text-primary-content">
            ${renderIcon('Heart', 'size-12')}
          </div>

          <div>
            <p class="text-sm uppercase tracking-[0.3em] text-white/50">Resultado</p>
            <h1 class="text-4xl font-black">${result.score}%</h1>
            <h2 class="mt-2 text-2xl font-bold">${result.title}</h2>
          </div>

          <p class="max-w-xl text-white/75">${result.description}</p>

          <div class="grid w-full gap-3 text-left sm:grid-cols-2">
            ${renderPart('Signos', result.parts.zodiac)}
            ${renderPart('Edad', result.parts.age)}
            ${renderPart('Sexo', result.parts.sex)}
            ${renderPart('Tipo de vinculo', result.parts.relationship_type)}
          </div>

          <div class="card-actions mt-4 justify-center">
            <button class="btn btn-primary" type="button" id="restart-button">Empezar de nuevo</button>
            <a class="btn btn-ghost" href="../index.html">Volver a Tomate</a>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderPart(label, value) {
  return `
    <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div class="flex items-center justify-between gap-4">
        <span class="text-white/75">${label}</span>
        <strong>${value}%</strong>
      </div>
      <progress class="progress progress-primary mt-3 w-full" value="${value}" max="100"></progress>
    </div>
  `;
}
