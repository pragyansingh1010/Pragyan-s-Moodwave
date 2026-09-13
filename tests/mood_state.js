function normalizeMood(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

console.assert(normalizeMood('  Happy ') === 'happy');
console.assert(normalizeMood('CALM') === 'calm');
console.assert(normalizeMood('   ') === '');
console.assert(normalizeMood(null) === '');
console.log('Mood state tests passed');
