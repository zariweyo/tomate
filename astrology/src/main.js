import './styles.css';
import { AstrologyApp } from './app/AstrologyApp.js';
import { loadYaml } from './utils/yamlLoader.js';

async function bootstrap() {
  const root = document.querySelector('#app');

  if (!root) {
    throw new Error('App root not found.');
  }

  const [questionsData, stepsData, decisionTree, scoringRules, zodiacData] = await Promise.all([
    loadYaml('./src/data/questions.yaml'),
    loadYaml('./src/data/steps.yaml'),
    loadYaml('./src/data/decision-tree.yaml'),
    loadYaml('./src/data/scoring-rules.yaml'),
    loadYaml('./src/data/zodiac.yaml'),
  ]);

  const app = new AstrologyApp({
    root,
    questions: questionsData.questions,
    steps: stepsData.steps,
    decisionTree,
    scoringRules,
    zodiacData,
  });

  app.start();
}

bootstrap().catch((error) => {
  console.error(error);
  document.querySelector('#app').innerHTML = `
    <section class="step-shell flex items-center justify-center px-4 text-white">
      <div class="alert alert-error max-w-xl">
        <span>No se ha podido cargar Astrology.</span>
      </div>
    </section>
  `;
});
