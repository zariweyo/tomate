import { renderIcon } from './icons.js';

export function renderQuestionScreen({ step, stepId, questions, answers, errors, progress, canGoBack }) {
  const fields = step.fields.map((fieldId) => renderField(fieldId, questions[fieldId], answers[fieldId], errors[fieldId])).join('');

  return `
    <section class="step-shell flex items-center justify-center px-4 py-8 text-white">
      <div class="card w-full max-w-2xl border border-white/10 bg-base-100/20 shadow-2xl backdrop-blur">
        <div class="card-body gap-6">
          <a class="link link-hover text-sm text-white/70" href="../index.html">Volver a Tomate</a>

          <div class="flex items-center gap-4">
            <div class="rounded-2xl bg-primary/25 p-4 text-primary-content">
              ${renderIcon(step.icon, 'size-8')}
            </div>
            <div>
              <p class="text-sm uppercase tracking-[0.3em] text-white/50">Astrology</p>
              <h1 class="text-3xl font-bold">${step.title}</h1>
            </div>
          </div>

          <p class="text-base text-white/70">${step.description}</p>

          <progress class="progress progress-primary w-full" value="${progress}" max="100"></progress>

          <form id="step-form" class="grid gap-5" data-step-id="${stepId}">
            ${fields}

            <div class="card-actions mt-4 flex items-center justify-between">
              <button class="btn btn-ghost" type="button" id="back-button" ${canGoBack ? '' : 'disabled'}>
                ${renderIcon('ChevronLeft', 'size-5')}
                Back
              </button>

              <button class="btn btn-primary" type="submit">
                Next
                ${renderIcon('ChevronRight', 'size-5')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  `;
}

function renderField(fieldId, question, value = '', error = '') {
  if (question.type === 'select') {
    return renderSelect(fieldId, question, value, error);
  }

  if (question.type === 'radio') {
    return renderRadioGroup(fieldId, question, value, error);
  }

  if (question.type === 'number') {
    return renderNumber(fieldId, question, value, error);
  }

  return '';
}

function renderSelect(fieldId, question, value, error) {
  const options = question.options.map((option) => {
    const selected = option.value === value ? 'selected' : '';
    return `<option value="${option.value}" ${selected}>${option.label}</option>`;
  }).join('');

  return `
    <label class="form-control w-full">
      <span class="label-text text-white/80">${question.label}</span>
      <select class="select select-bordered w-full bg-base-100/80" name="${fieldId}">
        <option value="">Selecciona una opcion</option>
        ${options}
      </select>
      ${renderError(error)}
    </label>
  `;
}

function renderNumber(fieldId, question, value, error) {
  return `
    <label class="form-control w-full">
      <span class="label-text text-white/80">${question.label}</span>
      <input class="input input-bordered w-full bg-base-100/80" type="number" name="${fieldId}" value="${value}" min="${question.min}" max="${question.max}" />
      ${renderError(error)}
    </label>
  `;
}

function renderRadioGroup(fieldId, question, value, error) {
  const options = question.options.map((option) => {
    const checked = option.value === value ? 'checked' : '';

    return `
      <label class="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10">
        <input class="radio radio-primary" type="radio" name="${fieldId}" value="${option.value}" ${checked} />
        <span>${option.label}</span>
      </label>
    `;
  }).join('');

  return `
    <fieldset class="grid gap-3">
      <legend class="mb-1 text-sm text-white/80">${question.label}</legend>
      ${options}
      ${renderError(error)}
    </fieldset>
  `;
}

function renderError(error) {
  return error ? `<span class="mt-1 text-sm text-error">${error}</span>` : '';
}
