function normalizeMood(mood) {
  return mood.trim().toLowerCase();
}

console.assert(normalizeMood(' Happy ') === 'happy');
console.assert(normalizeMood('SAD') === 'sad');
console.assert(normalizeMood(' calm ') === 'calm');
console.log('Mood normalization passed');
