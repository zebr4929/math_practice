import { skill as holes } from './holes.js?v=1.1';
import { skill as negatives } from './negatives.js?v=1.1';
import { arithmetic, geometric } from './sequences.js?v=1.1';

// Order shown on the home page
export const SKILLS = [holes, negatives, arithmetic, geometric];
export const byId = Object.fromEntries(SKILLS.map(s => [s.id, s]));
