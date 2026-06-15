export function createInitialState(startNodeId) {
  return {
    currentNodeId: startNodeId,
    answers: {},
    history: [],
    direction: 'next',
  };
}

export function saveStepAnswers(state, step, formData) {
  const answers = { ...state.answers };

  for (const fieldId of step.fields) {
    answers[fieldId] = formData.get(fieldId);
  }

  return {
    ...state,
    answers,
  };
}

export function moveToNextStep(state, nextNodeId) {
  return {
    ...state,
    currentNodeId: nextNodeId,
    history: [...state.history, state.currentNodeId],
    direction: 'next',
  };
}

export function moveToPreviousStep(state) {
  const history = [...state.history];
  const previousNodeId = history.pop();

  if (!previousNodeId) {
    return state;
  }

  return {
    ...state,
    currentNodeId: previousNodeId,
    history,
    direction: 'back',
  };
}
