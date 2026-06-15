import { animate } from 'motion';
import { createDecisionEngine } from '../engine/decisionEngine.js';
import { validateStep } from '../engine/answerValidator.js';
import { calculateCompatibility } from '../engine/compatibilityEngine.js';
import { createInitialState, moveToNextStep, moveToPreviousStep, saveStepAnswers } from './state.js';
import { renderQuestionScreen } from '../ui/QuestionScreen.js';
import { renderResultScreen } from '../ui/ResultScreen.js';

export class AstrologyApp {
  constructor({ root, questions, steps, decisionTree, scoringRules, zodiacData }) {
    this.root = root;
    this.questions = questions;
    this.steps = steps;
    this.decisionEngine = createDecisionEngine(decisionTree, steps);
    this.scoringRules = scoringRules;
    this.zodiacData = zodiacData;
    this.state = createInitialState(this.decisionEngine.getStartNodeId());
    this.errors = {};
  }

  start() {
    this.render();
  }

  async render() {
    if (this.decisionEngine.isResultNode(this.state.currentNodeId)) {
      this.renderResult();
      return;
    }

    const stepId = this.decisionEngine.getCurrentStepId(this.state.currentNodeId);
    const step = this.decisionEngine.getCurrentStep(this.state.currentNodeId);

    this.root.innerHTML = renderQuestionScreen({
      step,
      stepId,
      questions: this.questions,
      answers: this.state.answers,
      errors: this.errors,
      progress: this.decisionEngine.getProgress(this.state.currentNodeId),
      canGoBack: this.state.history.length > 0,
    });

    await this.animateCurrentScreen();
    this.bindQuestionEvents(step);
  }

  async renderResult() {
    const result = calculateCompatibility(this.state.answers, this.scoringRules, this.zodiacData);
    this.root.innerHTML = renderResultScreen(result);
    await animate(this.root.firstElementChild, { opacity: [0, 1], scale: [0.96, 1] }, { duration: 0.28 });

    this.root.querySelector('#restart-button')?.addEventListener('click', () => {
      this.state = createInitialState(this.decisionEngine.getStartNodeId());
      this.errors = {};
      this.render();
    });
  }

  bindQuestionEvents(step) {
    const form = this.root.querySelector('#step-form');
    const backButton = this.root.querySelector('#back-button');

    form?.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const nextState = saveStepAnswers(this.state, step, formData);
      const validation = validateStep(step, this.questions, nextState.answers);

      if (!validation.isValid) {
        this.state = nextState;
        this.errors = validation.errors;
        this.render();
        return;
      }

      const nextNodeId = this.decisionEngine.getNextNodeId(this.state.currentNodeId, nextState.answers);
      this.state = moveToNextStep(nextState, nextNodeId);
      this.errors = {};
      await this.transitionToNextRender();
    });

    backButton?.addEventListener('click', async () => {
      this.state = moveToPreviousStep(this.state);
      this.errors = {};
      await this.transitionToNextRender();
    });
  }

  async transitionToNextRender() {
    const offset = this.state.direction === 'back' ? 24 : -24;
    await animate(this.root.firstElementChild, { opacity: [1, 0], x: [0, offset] }, { duration: 0.18 });
    await this.render();
  }

  animateCurrentScreen() {
    const offset = this.state.direction === 'back' ? -24 : 24;
    return animate(this.root.firstElementChild, { opacity: [0, 1], x: [offset, 0] }, { duration: 0.24 });
  }
}
