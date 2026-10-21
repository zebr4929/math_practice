// Settings you can edit.
export const CONFIG = {
  // Paste your Google Apps Script web app URL here (see SETUP.md, Part 2).
  // Leave it empty and the site still works, it just does not record results.
  sheetUrl: 'https://script.google.com/macros/s/AKfycbyHIyPoyCjd-Y4XQJchGQPoxcxKQrsBOWJXsa2NM6SDiujHyCT1Ahd5tjJpR0ZO4BOi/exec',

  // Courses on the sign-in screen. `skills` says which skill set the course sees
  // (each skill file lists the sets it belongs to: 'precalc', 'accel', 'honors').
  courses: [
    { name: 'AP Precalculus', skills: 'precalc' },
    { name: 'Accelerated Algebra II', skills: 'accel' },
    { name: 'Honors Algebra II', skills: 'honors' },
  ],

  // Dropdowns on the sign-in screen. Edit these lists to match your classes.
  // Teacher names appear exactly as typed here (and in the Google Sheet).
  teachers: ['Mr. Orthwein', 'Ms. Vreeburg', 'Ms. Welch', 'Mr. Zebracki'],
  blocks: ['A', 'B', 'C', 'D', 'E', 'F'],

  problemsPerSet: 6,
  version: '2.1',
};
