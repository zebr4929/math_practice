import { skill as holes } from './holes.js';
import { skill as negatives } from './negatives.js';
import { arithmetic, geometric } from './sequences.js';

// Order shown on the home page
export const SKILLS = [holes, negatives, arithmetic, geometric];
export const byId = Object.fromEntries(SKILLS.map(s => [s.id, s]));
