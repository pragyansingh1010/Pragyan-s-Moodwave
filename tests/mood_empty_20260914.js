function safeMood(value) {
  return typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : 'neutral';
}

console.assert(safeMood('Happy') === 'happy');
console.assert(safeMood('') === 'neutral');
console.assert(safeMood('   ') === 'neutral');
console.log('Empty mood handling passed');
