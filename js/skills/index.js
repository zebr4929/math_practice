import { skill as holes } from './precalc/holes.js?v=1.4';
import { skill as rationalSigns } from './precalc/rational-signs.js?v=1.4';
import { arithmetic, geometric } from './precalc/sequences.js?v=1.4';
import { skill as factoring } from './alg2/factoring.js?v=1.4';
import { skill as quadFormula } from './alg2/quadratic-formula.js?v=1.4';

// Order shown on the home page. Each skill's `course` decides which course sees it.
export const SKILLS = [holes, rationalSigns, arithmetic, geometric, factoring, quadFormula];
export const byId = Object.fromEntries(SKILLS.map(s => [s.id, s]));
