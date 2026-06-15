export function validateStep(step, questions, answers) {
  const errors = {};

  for (const fieldId of step.fields) {
    const question = questions[fieldId];
    const value = answers[fieldId];

    if (question.required && isEmpty(value)) {
      errors[fieldId] = 'Este campo es obligatorio.';
      continue;
    }

    if (question.type === 'number') {
      const numericValue = Number(value);

      if (Number.isNaN(numericValue)) {
        errors[fieldId] = 'Introduce un numero valido.';
        continue;
      }

      if (question.min !== undefined && numericValue < question.min) {
        errors[fieldId] = `El valor minimo es ${question.min}.`;
      }

      if (question.max !== undefined && numericValue > question.max) {
        errors[fieldId] = `El valor maximo es ${question.max}.`;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

function isEmpty(value) {
  return value === undefined || value === null || String(value).trim() === '';
}
