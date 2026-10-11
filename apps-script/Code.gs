/**
 * Math Practice: results logger.
 * Paste this into Extensions > Apps Script in your results Google Sheet,
 * then deploy it as a web app (see SETUP.md, Part 2).
 *
 * One row per practice set. The site sends an update after every problem,
 * so a set a student quits partway through still shows up ("Stopped: 2 of 6").
 */
const SHEET_NAME = 'Log';
const HEADERS = ['Last updated', 'Name', 'Course', 'Teacher', 'Block', 'Skill', 'Level', 'Status',
  'Correct', 'Attempted', 'Set size', 'Percent correct', 'Missed problem types', 'Minutes', 'Set ID', 'Site version'];
const COL = name => HEADERS.indexOf(name) + 1;

function getLogSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  // If an older Log tab has different columns, set it aside instead of mixing formats.
  if (sh && sh.getLastRow() > 0) {
    const current = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    if (current.join('|') !== HEADERS.join('|')) {
      sh.setName(SHEET_NAME + ' (old ' + Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), 'yyyy-MM-dd HHmm') + ')');
      sh = null;
    }
  }
  if (!sh) sh = ss.insertSheet(SHEET_NAME, 0);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);
    const sh = getLogSheet_();
    const clean = v => String(v == null ? '' : v).slice(0, 300).replace(/^[=+\-@]/, "'$&");
    const row = [
      new Date(), clean(d.name), clean(d.course), clean(d.teacher), clean(d.block), clean(d.skill), clean(d.level), clean(d.status),
      Number(d.score) || 0, Number(d.attempted) || 0, Number(d.total) || 0, (Number(d.percent) || 0) / 100,
      clean(d.missed), Number(d.minutes) || 0, clean(d.setId), clean(d.version),
    ];

    // Find this set's existing row, if any
    let target = 0;
    if (d.setId && sh.getLastRow() > 1) {
      const hit = sh.getRange(2, COL('Set ID'), sh.getLastRow() - 1, 1)
        .createTextFinder(String(d.setId)).matchEntireCell(true).findNext();
      if (hit) target = hit.getRow();
    }
    if (target) {
      // Updates can arrive out of order; never replace newer progress with older.
      const prevAttempted = Number(sh.getRange(target, COL('Attempted')).getValue()) || 0;
      const prevStatus = String(sh.getRange(target, COL('Status')).getValue());
      if (prevStatus === 'Completed' || (Number(d.attempted) || 0) < prevAttempted) return ContentService.createTextOutput('stale');
      sh.getRange(target, 1, 1, HEADERS.length).setValues([row]);
    } else {
      sh.appendRow(row);
      target = sh.getLastRow();
    }
    sh.getRange(target, COL('Percent correct')).setNumberFormat('0%');
    return ContentService.createTextOutput('ok');
  } finally {
    lock.releaseLock();
  }
}

// Visiting the web app URL in a browser shows this, so you can confirm it is live.
function doGet() {
  return ContentService.createTextOutput('Math Practice logger is running.');
}
