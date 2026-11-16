import { skill as holes } from './precalc/holes.js?v=3.2';
import { skill as rationalSigns } from './precalc/rational-signs.js?v=3.2';
import { arithmetic, geometric, geometricForms } from './precalc/sequences.js?v=3.2';
import { skill as expEnd } from './precalc/exp-end-behavior.js?v=3.2';
import { expModels, expRewrite } from './precalc/exp-models.js?v=3.2';
import { skill as expBehavior } from './precalc/exp-behavior.js?v=3.2';
import { expShifted, expUnits, expTwoPoints } from './precalc/exp-data.js?v=3.2';
import { compExpr, compReps } from './precalc/composition.js?v=3.2';
import { invTable, invGraph, invAlgebra } from './precalc/inverses.js?v=3.2';
import { logConvert, logEval, logPlot } from './precalc/logs.js?v=3.2';
import { skill as factoring } from './alg2/factoring.js?v=3.2';
import { graphStandard, graphVertex } from './alg2/graphing.js?v=3.2';
import { factoredFromGraph, factoredFromData, toVertexForm, vertexToStandard, maxMin, domainRange, coefFromSolutions, vertexFromPoint, incDec } from './alg2/forms.js?v=3.2';
import { solveSqrt, simplifyRadicals, solveFactoring, ctsAccel, ctsHonors, formulaAccel, formulaHonors } from './alg2/solving.js?v=3.2';

import { sqrtNegatives, powersOfI, complexOps } from './alg2/complex.js?v=3.2';
import { perfectSquare, discriminant } from './alg2/solving-extra.js?v=3.2';
import { projectile, circles } from './alg2/applications.js?v=3.2';

import { transTables, transIdentify, transPoint, transWrite, transDomain } from './alg2/transformations.js?v=3.2';

import { expLogNeither, expLogInversePoints, logBehavior, logTableK, logDomain, logCondense, logExpand, logTransformK } from './precalc/logs2.js?v=3.2';
import { examUnit2 } from './precalc/exam-unit2.js?v=3.2';
import { seqClassify, expRulesTransform, inverseProps, changeOfBase, logDomainIneq, expModelsData } from './precalc/guide.js?v=3.2';
import { expEquations, logEqOne, logEqMulti, expLogInverses, expLogInequalities, logLinear, semiLogModel } from './precalc/logs3.js?v=3.2';

// Order shown on the home page. Each skill's `course` lists which courses see it
// ('precalc', 'accel', 'honors'; see js/config.js).
export const SKILLS = [
  holes, rationalSigns, arithmetic, geometric, geometricForms, seqClassify, expEnd, expBehavior, expModels, expRewrite, expRulesTransform,
  expShifted, expUnits, expTwoPoints, compExpr, compReps, invTable, invGraph, invAlgebra, logConvert, logEval, logPlot,
  expLogNeither, expLogInversePoints, logBehavior, logTableK, logDomain, logCondense, logExpand, logTransformK, inverseProps, changeOfBase,
  expEquations, logEqOne, logEqMulti, expLogInverses, expLogInequalities, logDomainIneq, expModelsData, logLinear, semiLogModel,
  factoring, simplifyRadicals, solveSqrt, solveFactoring, ctsAccel, ctsHonors, formulaAccel, formulaHonors,
  graphStandard, graphVertex, factoredFromGraph, factoredFromData, toVertexForm, vertexToStandard, maxMin, domainRange,
  sqrtNegatives, powersOfI, complexOps, transTables, transIdentify, transPoint, transWrite, transDomain, perfectSquare, discriminant, coefFromSolutions, vertexFromPoint, incDec, projectile, circles,
];
export const byId = Object.fromEntries(SKILLS.map(s => [s.id, s]));

// mock exams (one per unit); each item lists the skill ids its question can come from
export const EXAMS = [examUnit2];
