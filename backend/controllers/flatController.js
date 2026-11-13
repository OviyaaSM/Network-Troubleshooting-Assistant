/**
 * FLAT Demonstration API Controller
 * 
 * Exposes endpoints for inspecting and simulating:
 * 1. DFA Definition, States, Transition Table, and Step-by-Step execution
 * 2. Regular Expression pattern matching with explanations and confidence scores
 */

import { ALPHABET, STATES, TRANSITIONS, DIAGNOSTIC_OUTCOMES, runDFA } from '../flat-engine/networkDFA.js';
import { ERROR_PATTERNS, classifyNetworkError } from '../flat-engine/errorPatternMatcher.js';

export function getDfaSpecification(req, res) {
  // Construct transition matrix table for UI rendering
  const alphabetSymbols = Object.keys(ALPHABET);
  const matrix = Object.entries(TRANSITIONS).map(([stateKey, transitions]) => {
    const row = {
      state: stateKey,
      label: STATES[stateKey]?.label || stateKey,
      isAccepting: Boolean(STATES[stateKey]?.isAccepting),
      transitions: {}
    };

    alphabetSymbols.forEach(sym => {
      row.transitions[sym] = transitions[sym] || 'q_trap';
    });

    return row;
  });

  res.status(200).json({
    success: true,
    specification: {
      tuple: 'M = (Q, Σ, δ, q0, F)',
      alphabet: ALPHABET,
      states: STATES,
      transitions: TRANSITIONS,
      transitionMatrix: matrix,
      outcomes: DIAGNOSTIC_OUTCOMES
    }
  });
}

export function simulateDfaHandler(req, res) {
  const { sequence = '' } = req.body;
  const result = runDFA(sequence);

  res.status(200).json({
    success: true,
    result
  });
}

export function testRegexHandler(req, res) {
  const { text = '' } = req.body;
  const classification = classifyNetworkError(text);

  res.status(200).json({
    success: true,
    classification,
    availablePatterns: ERROR_PATTERNS.map(p => ({
      code: p.code,
      category: p.category,
      pattern: p.regex.toString(),
      severity: p.severity,
      explanation: p.explanation
    }))
  });
}

export default {
  getDfaSpecification,
  simulateDfaHandler,
  testRegexHandler
};
