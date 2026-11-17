// Settings you can edit.
export const CONFIG = {
  // Paste your Google Apps Script web app URL here (see SETUP.md, Part 2).
  // Leave it empty and the site still works, it just does not record results.
  sheetUrl: 'https://script.google.com/macros/s/AKfycbyHIyPoyCjd-Y4XQJchGQPoxcxKQrsBOWJXsa2NM6SDiujHyCT1Ahd5tjJpR0ZO4BOi/exec',

  // Courses on the sign-in screen. `skills` says which skill set the course sees
  // (each skill file lists the sets it belongs to: 'precalc', 'accel', 'honors').
  courses: [
    // collapsible: show skills in sections that open and close. openSections: the sections that
    // start open for a student who has not opened or closed any yet (update as the year goes on).
    { name: 'AP Precalculus', skills: 'precalc', collapsible: true, openSections: ['Unit 2 - Logarithms', 'Unit 2 - Log Equations and Semi-Log Plots'] },
    // unitOrder: the order of units on the home page (Unit T came between Units 2 and 3).
    // openVersion: bump it when openSections change, so every student's page starts from the new default.
    { name: 'Accelerated Algebra II', skills: 'accel', collapsible: true, unitOrder: ['1', '2', 'T', '3', '4', '5', '6', '7', '8'], openVersion: 2,
      openSections: ['Unit T - Transformations', 'Unit 3 - Rational Exponents', 'Unit 3 - Exponential Functions'] },
    { name: 'Honors Algebra II', skills: 'honors' },
  ],

  // Dropdowns on the sign-in screen. Edit these lists to match your classes.
  // Teacher names appear exactly as typed here (and in the Google Sheet).
  teachers: ['Mr. Orthwein', 'Ms. Vreeburg', 'Ms. Welch', 'Mr. Zebracki'],
  blocks: ['A', 'B', 'C', 'D', 'E', 'F'],

  problemsPerSet: 6,
  version: '3.4',
};
