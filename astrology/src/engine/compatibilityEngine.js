import {
  calculateAgeScore,
  calculateSexScore,
  calculateWeightedScore,
  calculateZodiacScore,
  clampScore,
} from './scoreCalculator.js';

export function calculateCompatibility(answers, scoringRules, zodiacData) {
  const parts = {
    zodiac: calculateZodiacScore(answers.user_sign, answers.partner_sign, zodiacData),
    age: calculateAgeScore(answers.user_age, answers.partner_age, scoringRules.age),
    sex: calculateSexScore(answers.user_sex, answers.partner_sex, scoringRules.sex),
    relationship_type: scoringRules.relationship_type[answers.relationship_type] ?? 70,
  };

  const score = clampScore(calculateWeightedScore(parts, scoringRules.weights));
  const level = getLevel(score, scoringRules.levels);

  return {
    score,
    level,
    parts,
    title: level.title,
    description: buildDescription(score, answers.relationship_type),
  };
}

function getLevel(score, levels) {
  return Object.values(levels).find((level) => score >= level.min && score <= level.max) ?? levels.medium;
}

function buildDescription(score, relationshipType) {
  const relationshipLabel = {
    love: 'amorosa',
    friendship: 'de amistad',
    work: 'laboral',
  }[relationshipType] ?? 'general';

  if (score >= 85) {
    return `La energia ${relationshipLabel} es muy favorable. Hay una base fuerte para crecer y entenderse.`;
  }

  if (score >= 70) {
    return `La compatibilidad ${relationshipLabel} es alta, con algunos matices que pueden enriquecer la relacion.`;
  }

  if (score >= 45) {
    return `La compatibilidad ${relationshipLabel} es equilibrada. Hay puntos buenos, pero tambien diferencias a gestionar.`;
  }

  return `La compatibilidad ${relationshipLabel} necesita trabajo. Puede haber atraccion o interes, pero tambien bastante friccion.`;
}
