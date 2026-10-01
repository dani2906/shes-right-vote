/** @OnlyCurrentDoc */

/**
 * She's Right design vote: Google Apps Script backend.
 *
 * Saves one row per voter in the "Votes" tab of this spreadsheet.
 * Voting again from the same browser replaces that voter's row.
 *
 * Setup (once):
 *   1. Create a Google Sheet, then Extensions > Apps Script.
 *   2. Replace everything in Code.gs with this file.
 *   3. Set RESULTS_KEY below to a long random string only you know.
 *   4. Deploy > New deployment > Web app.
 *        Execute as: Me
 *        Who has access: Anyone
 *   5. Copy the Web app URL (ends in /exec) and give it to Claude.
 *
 * Your private results page is the vote page URL plus ?results=YOUR_KEY.
 * Never put RESULTS_KEY in the public GitHub repo.
 */

const RESULTS_KEY = 'PASTE-YOUR-SECRET-KEY-HERE';
const SHEET_NAME = 'Votes';
const LETTERS = ['O', 'A', 'B', 'C', 'D', 'E'];
const NAMES = {
  O: 'Original',
  A: 'Morning paper',
  B: 'Game day',
  C: 'The dot',
  D: 'Weather app',
  E: 'Field brief',
};
const HEADER = ['Updated', 'Voter ID', 'Name', 'Code', '1st', '2nd', '3rd', '4th', '5th', '6th', 'Note'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    const code = String(body.code || '');
    if (!isValidCode_(code)) return json_({ ok: false, error: 'bad_code' });

    const voter = String(body.voter || '');
    if (!/^[a-z0-9]{12,40}$/.test(voter)) return json_({ ok: false, error: 'bad_voter' });

    const name = clean_(body.name, 80);
    const note = clean_(body.note, 500);
    const places = code.split('').map(function (l) { return l + ' · ' + NAMES[l]; });
    const row = [new Date(), voter, name, code].concat(places, [note]);

    const sheet = sheet_();
    const last = sheet.getLastRow();
    let target = 0;
    if (last > 1) {
      const ids = sheet.getRange(2, 2, last - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) {
        if (ids[i][0] === voter) { target = i + 2; break; }
      }
    }
    if (target) {
      sheet.getRange(target, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: 'server_error' });
  } finally {
    try { lock.releaseLock(); } catch (ignored) {}
  }
}

function doGet(e) {
  const key = (e && e.parameter && e.parameter.key) || '';
  if (RESULTS_KEY === 'PASTE-YOUR-SECRET-KEY-HERE' || key !== RESULTS_KEY) {
    return json_({ ok: false, error: 'not_allowed' });
  }
  const sheet = sheet_();
  const last = sheet.getLastRow();
  const votes = [];
  if (last > 1) {
    const rows = sheet.getRange(2, 1, last - 1, HEADER.length).getValues();
    rows.forEach(function (r) {
      if (isValidCode_(String(r[3]))) {
        votes.push({
          updated: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
          name: String(r[2]).replace(/^'/, ''),
          code: String(r[3]),
          note: String(r[10]).replace(/^'/, ''),
        });
      }
    });
  }
  return json_({ ok: true, votes: votes });
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADER);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADER.length).setFontWeight('bold');
  }
  return sheet;
}

function isValidCode_(code) {
  if (code.length !== LETTERS.length) return false;
  const seen = {};
  for (let i = 0; i < code.length; i++) {
    const l = code[i];
    if (LETTERS.indexOf(l) === -1 || seen[l]) return false;
    seen[l] = true;
  }
  return true;
}

// Trims text and stops it from being read as a spreadsheet formula.
function clean_(value, max) {
  const s = String(value || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
