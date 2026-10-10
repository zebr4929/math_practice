/**
 * Precalc Practice: results logger.
 * Paste this into Extensions > Apps Script in your results Google Sheet,
 * then deploy it as a web app (see SETUP.md, Part 2).
 */
const SHEET_NAME = 'Log';
const HEADERS = ['Timestamp', 'Name', 'Block', 'Skill', 'Level', 'Score', 'Out of', 'Percent', 'Missed problem types', 'Minutes', 'Site version'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName(SHEET_NAME);
    if (!sh) sh = ss.insertSheet(SHEET_NAME);
    if (sh.getLastRow() === 0) {
      sh.appendRow(HEADERS);
      sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
    const clean = v => String(v == null ? '' : v).slice(0, 300).replace(/^[=+\-@]/, "'$&");
    sh.appendRow([
      new Date(), clean(d.name), clean(d.block), clean(d.skill), clean(d.level),
      Number(d.score) || 0, Number(d.total) || 0, (Number(d.percent) || 0) / 100,
      clean(d.missed), Number(d.minutes) || 0, clean(d.version),
    ]);
    sh.getRange(sh.getLastRow(), 8).setNumberFormat('0%');
    return ContentService.createTextOutput('ok');
  } finally {
    lock.releaseLock();
  }
}

// Visiting the web app URL in a browser shows this, so you can confirm it is live.
function doGet() {
  return ContentService.createTextOutput('Precalc Practice logger is running.');
}
