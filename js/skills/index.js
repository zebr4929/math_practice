import { skill as holes } from './precalc/holes.js?v=2.7';
import { skill as rationalSigns } from './precalc/rational-signs.js?v=2.7';
import { arithmetic, geometric, geometricForms } from './precalc/sequences.js?v=2.7';
import { skill as expEnd } from './precalc/exp-end-behavior.js?v=2.7';
import { expModels, expRewrite } from './precalc/exp-models.js?v=2.7';
import { skill as expBehavior } from './precalc/exp-behavior.js?v=2.7';
import { expShifted, expUnits, expTwoPoints } from './precalc/exp-data.js?v=2.7';
import { compExpr, compReps } from './precalc/composition.js?v=2.7';
import { invTable, invGraph, invAlgebra } from './precalc/inverses.js?v=2.7';
import { logConvert, logEval, logPlot } from './precalc/logs.js?v=2.7';
import { skill as factoring } from './alg2/factoring.js?v=2.7';
import { graphStandard, graphVertex } from './alg2/graphing.js?v=2.7';
import { factoredFromGraph, factoredFromData, toVertexForm, vertexToStandard, maxMin, domainRange, coefFromSolutions, vertexFromPoint, incDec } from './alg2/forms.js?v=2.7';
import { solveSqrt, simplifyRadicals, solveFactoring, ctsAccel, ctsHonors, formulaAccel, formulaHonors } from './alg2/solving.js?v=2.7';

import { sqrtNegatives, powersOfI, complexOps } from './alg2/complex.js?v=2.7';
import { perfectSquare, discriminant } from './alg2/solving-extra.js?v=2.7';
import { projectile, circles } from './alg2/applications.js?v=2.7';

import { transTables, transIdentify, transPoint, transWrite, transDomain } from './alg2/transformations.js?v=2.7';

import { expLogNeither, expLogInversePoints, logBehavior, logTableK, logDomain, logCondense, logExpand, logTransformK } from './precalc/logs2.js?v=2.7';
import { expEquations, logEqOne, logEqMulti, expLogInverses, expLogInequalities, logLinear, semiLogModel } from './precalc/logs3.js?v=2.7';

// Order shown on the home page. Each skill's `course` lists which courses see it
// ('precalc', 'accel', 'honors'; see js/config.js).
export const SKILLS = [
  holes, rationalSigns, arithmetic, geometric, geometricForms, expEnd, expBehavior, expModels, expRewrite,
  expShifted, expUnits, expTwoPoints, compExpr, compReps, invTable, invGraph, invAlgebra, logConvert, logEval, logPlot,
  expLogNeither, expLogInversePoints, logBehavior, logTableK, logDomain, logCondense, logExpand, logTransformK,
  expEquations, logEqOne, logEqMulti, expLogInverses, expLogInequalities, logLinear, semiLogModel,
  factoring, simplifyRadicals, solveSqrt, solveFactoring, ctsAccel, ctsHonors, formulaAccel, formulaHonors,
  graphStandard, graphVertex, factoredFromGraph, factoredFromData, toVertexForm, vertexToStandard, maxMin, domainRange,
  sqrtNegatives, powersOfI, complexOps, transTables, transIdentify, transPoint, transWrite, transDomain, perfectSquare, discriminant, coefFromSolutions, vertexFromPoint, incDec, projectile, circles,
];
export const byId = Object.fromEntries(SKILLS.map(s => [s.id, s]));
