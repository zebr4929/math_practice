// AP Precalculus Unit 2 mock exam: one Challenging question for each study guide skill.
// Each question is drawn from one site skill in that skill's pool, so every exam is different.
export const examUnit2 = {
  id: 'precalc-unit2', course: 'precalc',
  title: 'Unit 2 Mock Exam',
  section: 'Unit 2 - Mock Exam',
  after: 'Unit 2',                      // the section is listed after the last Unit 2 section
  level: 3,
  blurb: 'One Challenging question for each of the 12 study guide skills. Nothing is graded until you submit, then you can review every question.',
  items: [
    { n: 1, name: 'Arithmetic and geometric sequences', skills: ['arithmetic', 'geometric', 'seq-classify', 'geometric-forms'] },
    { n: 2, name: 'End behavior of exponential functions', skills: ['exp-end-behavior'] },
    { n: 3, name: 'Exponent rules as transformations', skills: ['exp-rules-transform', 'exp-rewrite'] },
    { n: 4, name: 'Growth and decay rates with time units', skills: ['exp-units'] },
    { n: 5, name: 'Inverse properties and log rules', skills: ['inverse-properties', 'log-condense', 'log-expand'] },
    { n: 6, name: 'Log graphs: domain, asymptotes, end behavior', skills: ['log-domain', 'log-behavior'] },
    { n: 7, name: 'Rates of change and concavity', skills: ['exp-behavior', 'exp-log-inverse-points'] },
    { n: 8, name: 'Change of base', skills: ['change-of-base', 'log-transform-k'] },
    { n: 9, name: 'Inverse functions', skills: ['inverse-algebra', 'exp-log-inverses'] },
    { n: 10, name: 'Log equations and inequalities', skills: ['exp-equations', 'log-equations-one', 'log-equations-multi', 'exp-log-inequalities', 'log-quad-domain'] },
    { n: 11, name: 'Exponential models from data', skills: ['exp-models-data', 'exp-two-points', 'exp-models'] },
    { n: 12, name: 'Semi-log plots and log-linear form', skills: ['log-linear', 'semi-log-model', 'log-plot'] },
  ],
};
