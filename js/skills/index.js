import { skill as holes } from './precalc/holes.js?v=2.0';
import { skill as rationalSigns } from './precalc/rational-signs.js?v=2.0';
import { arithmetic, geometric, geometricForms } from './precalc/sequences.js?v=2.0';
import { skill as expEnd } from './precalc/exp-end-behavior.js?v=2.0';
import { expModels, expRewrite } from './precalc/exp-models.js?v=2.0';
import { skill as expBehavior } from './precalc/exp-behavior.js?v=2.0';
import { skill as factoring } from './alg2/factoring.js?v=2.0';
import { graphStandard, graphVertex } from './alg2/graphing.js?v=2.0';
import { factoredFromGraph, factoredFromData, toVertexForm, vertexToStandard, maxMin, domainRange } from './alg2/forms.js?v=2.0';
import { solveSqrt, simplifyRadicals, solveFactoring, ctsAccel, ctsHonors, formulaAccel, formulaHonors } from './alg2/solving.js?v=2.0';

// Order shown on the home page. Each skill's `course` lists which courses see it
// ('precalc', 'accel', 'honors'; see js/config.js).
export const SKILLS = [
  holes, rationalSigns, arithmetic, geometric, geometricForms, expEnd, expBehavior, expModels, expRewrite,
  factoring, simplifyRadicals, solveSqrt, solveFactoring, ctsAccel, ctsHonors, formulaAccel, formulaHonors,
  graphStandard, graphVertex, factoredFromGraph, factoredFromData, toVertexForm, vertexToStandard, maxMin, domainRange,
];
export const byId = Object.fromEntries(SKILLS.map(s => [s.id, s]));
