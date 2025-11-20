const ADJECTIVES = [
  'swift',
  'bold',
  'calm',
  'daring',
  'eager',
  'fresh',
  'glowing',
  'lively',
  'mighty',
  'radiant',
];

const NOUNS = [
  'lion',
  'falcon',
  'otter',
  'orca',
  'panther',
  'sparrow',
  'walrus',
  'willow',
  'juniper',
  'ember',
];

export function generateUsername(suffixDigits = 4): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const suffix = Math.floor(Math.random() * Math.pow(10, suffixDigits))
    .toString()
    .padStart(suffixDigits, '0');
  return `${adjective}-${noun}-${suffix}`;
}
