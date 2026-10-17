import { skill as holes } from './precalc/holes.js?v=1.8';
import { skill as rationalSigns } from './precalc/rational-signs.js?v=1.8';
import { arithmetic, geometric } from './precalc/sequences.js?v=1.8';
import { skill as expEnd } from './precalc/exp-end-behavior.js?v=1.8';
import { expModels, expRewrite } from './precalc/exp-models.js?v=1.8';
import { skill as factoring } from './alg2/factoring.js?v=1.8';
import { graphStandard, graphVertex } from './alg2/graphing.js?v=1.8';
import { factoredFromGraph, toVertexForm } from './alg2/forms.js?v=1.8';
import { solveSqrt, simplifyRadicals, solveFactoring, ctsAccel, ctsHonors, formulaAccel, formulaHonors } from './alg2/solving.js?v=1.8';

// Order shown on the home page. Each skill's `course` lists which courses see it
// ('precalc', 'accel', 'honors'; see js/config.js).
export const SKILLS = [
  holes, rationalSigns, arithmetic, geometric, expEnd, expModels, expRewrite,
  factoring, simplifyRadicals, solveSqrt, solveFactoring, ctsAccel, ctsHonors, formulaAccel, formulaHonors,
  graphStandard, graphVertex, factoredFromGraph, toVertexForm,
];
export const byId = Object.fromEntries(SKILLS.map(s => [s.id, s]));
