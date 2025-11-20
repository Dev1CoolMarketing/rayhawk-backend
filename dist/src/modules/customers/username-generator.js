"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUsername = generateUsername;
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
function generateUsername(suffixDigits = 4) {
    const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const suffix = Math.floor(Math.random() * Math.pow(10, suffixDigits))
        .toString()
        .padStart(suffixDigits, '0');
    return `${adjective}-${noun}-${suffix}`;
}
//# sourceMappingURL=username-generator.js.map