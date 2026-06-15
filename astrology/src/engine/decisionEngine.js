export function createDecisionEngine(decisionTree, steps) {
  return {
    getStartNodeId() {
      return decisionTree.start;
    },

    isResultNode(nodeId) {
      return nodeId === decisionTree.result;
    },

    getCurrentStep(nodeId) {
      const node = decisionTree.nodes[nodeId];

      if (!node) {
        throw new Error(`Decision node not found: ${nodeId}`);
      }

      return steps[node.step];
    },

    getCurrentStepId(nodeId) {
      const node = decisionTree.nodes[nodeId];
      return node?.step;
    },

    getNextNodeId(nodeId, answers) {
      const node = decisionTree.nodes[nodeId];

      if (!node) {
        throw new Error(`Decision node not found: ${nodeId}`);
      }

      if (node.branches) {
        const branch = node.branches.find((candidate) => matchesCondition(candidate.condition, answers));
        return branch?.next ?? decisionTree.result;
      }

      return node.next ?? decisionTree.result;
    },

    getProgress(nodeId) {
      const nodeIds = Object.keys(decisionTree.nodes);
      const currentIndex = Math.max(0, nodeIds.indexOf(nodeId));
      return Math.round(((currentIndex + 1) / nodeIds.length) * 100);
    },
  };
}

function matchesCondition(condition, answers) {
  if (!condition || condition.default) {
    return true;
  }

  const value = condition.computed ? getComputedValue(condition.computed, answers) : answers[condition.field];

  switch (condition.operator) {
    case '>':
      return Number(value) > Number(condition.value);
    case '<':
      return Number(value) < Number(condition.value);
    case 'equals':
      return value === condition.value;
    default:
      return false;
  }
}

function getComputedValue(computedField, answers) {
  if (computedField === 'age_difference') {
    return Math.abs(Number(answers.user_age) - Number(answers.partner_age));
  }

  return undefined;
}
