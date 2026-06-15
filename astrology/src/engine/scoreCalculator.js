export function calculateZodiacScore(userSign, partnerSign, zodiacData) {
  const userElement = zodiacData.signs[userSign]?.element;
  const partnerElement = zodiacData.signs[partnerSign]?.element;

  if (!userElement || !partnerElement) {
    return 50;
  }

  return zodiacData.element_scores[userElement]?.[partnerElement] ?? 50;
}

export function calculateAgeScore(userAge, partnerAge, ageRules) {
  const difference = Math.abs(Number(userAge) - Number(partnerAge));

  if (difference <= ageRules.perfect_difference) {
    return 96;
  }

  if (difference <= ageRules.acceptable_difference) {
    return 82;
  }

  if (difference <= ageRules.large_difference) {
    return 64;
  }

  return 48;
}

export function calculateSexScore(userSex, partnerSex, sexRules) {
  if (userSex === 'other' || partnerSex === 'other') {
    return sexRules.other;
  }

  return userSex === partnerSex ? sexRules.same : sexRules.different;
}

export function calculateWeightedScore(parts, weights) {
  const totalWeight = Object.values(weights).reduce((total, weight) => total + weight, 0);
  const weightedTotal = Object.entries(parts).reduce((total, [key, value]) => {
    return total + value * (weights[key] ?? 0);
  }, 0);

  return Math.round(weightedTotal / totalWeight);
}

export function clampScore(score) {
  return Math.max(0, Math.min(100, score));
}
