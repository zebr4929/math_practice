import { skill as holes } from './holes.js?v=1.2';
import { skill as rationalSigns } from './rational-signs.js?v=1.2';
import { arithmetic, geometric } from './sequences.js?v=1.2';

// Order shown on the home page
export const SKILLS = [holes, rationalSigns, arithmetic, geometric];
export const byId = Object.fromEntries(SKILLS.map(s => [s.id, s]));
