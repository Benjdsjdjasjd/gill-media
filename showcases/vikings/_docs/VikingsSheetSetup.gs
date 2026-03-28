// ============================================================
//  STORTFORD VIKINGS — Google Sheets Auto-Setup Script
//  Version 2.0 — Phil only needs to fill in the Fixtures tab.
//  Everything else is automatic.
//
//  HOW TO INSTALL (one time, 3 minutes):
//  1. Open your Google Sheet
//  2. Click Extensions → Apps Script
//  3. Delete any existing code, paste this entire file in
//  4. Click Save (disk icon)
//  5. Click Run → select "setupVikingsSheet" → click Run
//  6. Allow permissions when asked
//  7. Done! Close the script editor and go back to your sheet.
// ============================================================


// ── CONFIGURATION ───────────────────────────────────────────
// Edit these to match your teams and leagues.
// You can add more teams at any time — just re-run setupVikingsSheet.

const CONFIG = {
  season: '2025-26',

  teams: [
    { name: 'U12',      ageGroup: 'Under 12',  league: 'U12 East Herts League'     },
    { name: 'U14',      ageGroup: 'Under 14',  league: 'U14 East Region'           },
    { name: 'U16',      ageGroup: 'Under 16',  league: 'U16 East Region'           },
    { name: 'U18',      ageGroup: 'Under 18',  league: 'U18 East Region'           },
    { name: 'Valkyries',ageGroup: 'Women',     league: "Women's East Herts League" },
  ],

  // Points system: how many league points for a Win, Loss, Draw
  pointsForWin:  2,
  pointsForLoss: 1,
  pointsForDraw: 1,
};


// ── MENU ────────────────────────────────────────────────────
// Adds a "Vikings" menu to the top of the sheet.

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🏀 Vikings')
    .addItem('Recalculate Standings', 'calculateStandings')
    .addItem('Setup / Reset Sheets',  'setupVikingsSheet')
    .addToUi();
}


// ── MAIN SETUP ──────────────────────────────────────────────
// Creates all sheets, adds headers, validation, and formatting.
// Safe to re-run at any time — it won't delete existing data.

function setupVikingsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  setupFixturesTab(ss);
  setupStandingsTab(ss);
  setupTeamsTab(ss);

  // Make Fixtures the active sheet
  ss.setActiveSheet(ss.getSheetByName('Fixtures'));

  // Run initial standings calculation
  calculateStandings();

  SpreadsheetApp.getUi().alert(
    '✅ Setup complete!\n\n' +
    'Phil, just fill in the FIXTURES tab.\n' +
    'Standings update automatically when you type a result.'
  );
}


// ── FIXTURES TAB ────────────────────────────────────────────

function setupFixturesTab(ss) {
  let sheet = ss.getSheetByName('Fixtures');
  if (!sheet) sheet = ss.insertSheet('Fixtures');

  // Move Fixtures to be the first tab
  ss.setActiveSheet(sheet);
  ss.moveActiveSheet(1);

  // ── Headers ──
  const headers = ['Date', 'Team', 'Opponent', 'Venue', 'Time', 'Score', 'Result'];
  const headerRow = sheet.getRange(1, 1, 1, headers.length);
  headerRow.setValues([headers]);

  // Header styling
  headerRow
    .setBackground('#14194b')
    .setFontColor('#fde900')
    .setFontWeight('bold')
    .setFontFamily('Arial')
    .setFontSize(11)
    .setHorizontalAlignment('center');

  // Freeze header row
  sheet.setFrozenRows(1);

  // ── Column widths ──
  sheet.setColumnWidth(1, 120); // Date
  sheet.setColumnWidth(2, 100); // Team
  sheet.setColumnWidth(3, 180); // Opponent
  sheet.setColumnWidth(4, 80);  // Venue
  sheet.setColumnWidth(5, 70);  // Time
  sheet.setColumnWidth(6, 80);  // Score
  sheet.setColumnWidth(7, 70);  // Result

  // ── Data validation: Team dropdown ──
  const teamNames = CONFIG.teams.map(t => t.name);
  const teamRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(teamNames, true)
    .setAllowInvalid(false)
    .setHelpText('Select a team from the list')
    .build();
  sheet.getRange('B2:B500').setDataValidation(teamRule);

  // ── Data validation: Venue dropdown ──
  const venueRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Home', 'Away'], true)
    .setAllowInvalid(false)
    .setHelpText('Home or Away')
    .build();
  sheet.getRange('D2:D500').setDataValidation(venueRule);

  // ── Data validation: Result dropdown ──
  const resultRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['W', 'L', 'D'], true)
    .setAllowInvalid(false)
    .setHelpText('W = Win, L = Loss, D = Draw')
    .build();
  sheet.getRange('G2:G500').setDataValidation(resultRule);

  // ── Conditional formatting: Result column colours ──
  const rules = sheet.getConditionalFormatRules();

  // Win = green
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('W')
    .setBackground('#c6efce').setFontColor('#276221')
    .setRanges([sheet.getRange('G2:G500')])
    .build());

  // Loss = red
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('L')
    .setBackground('#ffc7ce').setFontColor('#9c0006')
    .setRanges([sheet.getRange('G2:G500')])
    .build());

  // Draw = amber
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('D')
    .setBackground('#fff2cc').setFontColor('#7d6608')
    .setRanges([sheet.getRange('G2:G500')])
    .build());

  // Alternate row shading
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND(ROW()>1,MOD(ROW(),2)=0)')
    .setBackground('#f0f2f8')
    .setRanges([sheet.getRange('A2:G500')])
    .build());

  sheet.setConditionalFormatRules(rules);

  // ── Date column format ──
  sheet.getRange('A2:A500').setNumberFormat('DD/MM/YYYY');

  // ── Time column format ──
  sheet.getRange('E2:E500').setNumberFormat('HH:MM');

  // ── Add column notes (instructions in the header cells) ──
  sheet.getRange('A1').setNote('Enter the game date. Dates in the past with no result are ignored.');
  sheet.getRange('B1').setNote('Select your team from the dropdown.');
  sheet.getRange('C1').setNote('Type the opponent team name.');
  sheet.getRange('D1').setNote('Select Home or Away.');
  sheet.getRange('E1').setNote('Tip-off time e.g. 18:30');
  sheet.getRange('F1').setNote('Score — fill in AFTER the game. Format: 52-48 (Vikings score first)');
  sheet.getRange('G1').setNote('Result — fill in AFTER the game. W = Win, L = Loss, D = Draw');

  // ── Sample row (only if sheet is empty) ──
  if (sheet.getLastRow() <= 1) {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    sheet.getRange('A2').setValue(nextWeek);
    sheet.getRange('B2').setValue('U14');
    sheet.getRange('C2').setValue('Harlow Hawks (Example — delete me)');
    sheet.getRange('D2').setValue('Home');
    sheet.getRange('E2').setValue('18:30');
    sheet.getRange('F2').setValue('');
    sheet.getRange('G2').setValue('');
    sheet.getRange('A2:G2').setFontColor('#999999').setFontStyle('italic');
  }
}


// ── STANDINGS TAB ───────────────────────────────────────────
// This tab is auto-populated — Phil never needs to touch it.

function setupStandingsTab(ss) {
  let sheet = ss.getSheetByName('Standings');
  if (!sheet) sheet = ss.insertSheet('Standings');
  ss.setActiveSheet(sheet);
  ss.moveActiveSheet(2);

  // Clear and rebuild
  sheet.clearContents();
  sheet.clearFormats();

  const headers = ['Team', 'League', 'P', 'W', 'L', 'D', 'PF', 'PA', 'PD', 'Pts'];
  const headerRow = sheet.getRange(1, 1, 1, headers.length);
  headerRow.setValues([headers]);

  headerRow
    .setBackground('#14194b')
    .setFontColor('#fde900')
    .setFontWeight('bold')
    .setFontFamily('Arial')
    .setFontSize(11)
    .setHorizontalAlignment('center');

  sheet.setFrozenRows(1);

  // Note explaining this tab
  sheet.getRange('A1').setNote(
    'AUTO-CALCULATED from Fixtures tab.\n' +
    'Phil does not need to edit this tab.\n' +
    'Updates automatically when a result is entered.'
  );

  // Column widths
  sheet.setColumnWidth(1, 160); // Team
  sheet.setColumnWidth(2, 200); // League
  [3,4,5,6,7,8,9,10].forEach(c => sheet.setColumnWidth(c, 55));

  // Protect this sheet from accidental edits
  try {
    const protection = sheet.protect().setDescription('Auto-calculated — do not edit manually');
    protection.setWarningOnly(true); // Warning only (not locked), so admin can still edit
  } catch(e) { /* Protection may not be available in all contexts */ }

  calculateStandings();
}


// ── TEAMS TAB ───────────────────────────────────────────────
// Auto-generated from CONFIG — Phil never touches this.

function setupTeamsTab(ss) {
  let sheet = ss.getSheetByName('Teams');
  if (!sheet) sheet = ss.insertSheet('Teams');
  ss.setActiveSheet(sheet);
  ss.moveActiveSheet(3);

  sheet.clearContents();
  sheet.clearFormats();

  const headers = ['Team', 'Age Group', 'League', 'Season'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground('#14194b')
    .setFontColor('#fde900')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  sheet.setFrozenRows(1);

  // Populate from CONFIG
  CONFIG.teams.forEach((team, i) => {
    sheet.getRange(i + 2, 1, 1, 4).setValues([[
      team.name, team.ageGroup, team.league, CONFIG.season
    ]]);
  });

  sheet.setColumnWidth(1, 100);
  sheet.setColumnWidth(2, 120);
  sheet.setColumnWidth(3, 220);
  sheet.setColumnWidth(4, 80);

  // Protect
  try {
    sheet.protect().setDescription('Auto-generated — edit CONFIG in Apps Script instead').setWarningOnly(true);
  } catch(e) {}
}


// ── AUTO-CALCULATE STANDINGS ────────────────────────────────
// Reads all Fixtures with a Result and builds the league tables.
// Called automatically onEdit and manually from the menu.

function calculateStandings() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const fixturesSheet = ss.getSheetByName('Fixtures');
  const standingsSheet = ss.getSheetByName('Standings');

  if (!fixturesSheet || !standingsSheet) return;

  // Read all fixture rows
  const data = fixturesSheet.getDataRange().getValues();
  if (data.length < 2) return;

  // Build a record for every team we know about
  // { "U14|U14 East Region": { team, league, p, w, l, d, pf, pa } }
  const records = {};

  // Seed with all known teams so they show even with 0 games played
  CONFIG.teams.forEach(t => {
    const key = `${t.name}|${t.league}`;
    records[key] = { team: `Stortford ${t.name === 'Valkyries' ? 'Valkyries' : 'Vikings ' + t.name}`,
                     league: t.league, p: 0, w: 0, l: 0, d: 0, pf: 0, pa: 0 };
  });

  // Parse each fixture row
  for (let i = 1; i < data.length; i++) {
    const [date, team, opponent, venue, time, score, result] = data[i];

    // Skip rows without a result or without a team
    if (!result || !team) continue;

    // Find this team's league
    const teamConfig = CONFIG.teams.find(t => t.name === team);
    if (!teamConfig) continue;

    const key = `${team}|${teamConfig.league}`;
    if (!records[key]) {
      records[key] = {
        team: `Stortford ${team === 'Valkyries' ? 'Valkyries' : 'Vikings ' + team}`,
        league: teamConfig.league, p: 0, w: 0, l: 0, d: 0, pf: 0, pa: 0
      };
    }

    const rec = records[key];
    rec.p++;

    // Parse score e.g. "52-48"
    if (score && typeof score === 'string' && score.includes('-')) {
      const parts = score.split('-');
      rec.pf += parseInt(parts[0]) || 0;
      rec.pa += parseInt(parts[1]) || 0;
    }

    if (result === 'W') rec.w++;
    else if (result === 'L') rec.l++;
    else if (result === 'D') rec.d++;
  }

  // Calculate points and point difference, then sort by league
  const rows = [];
  Object.values(records).forEach(rec => {
    const pd  = rec.pf - rec.pa;
    const pts = (rec.w * CONFIG.pointsForWin) +
                (rec.l * CONFIG.pointsForLoss) +
                (rec.d * CONFIG.pointsForDraw);
    rows.push([rec.team, rec.league, rec.p, rec.w, rec.l, rec.d, rec.pf, rec.pa, pd, pts]);
  });

  // Sort: by league name, then by points desc, then point diff desc
  rows.sort((a, b) => {
    if (a[1] < b[1]) return -1;
    if (a[1] > b[1]) return 1;
    if (b[9] !== a[9]) return b[9] - a[9]; // pts
    return b[8] - a[8]; // pd
  });

  // Write to Standings tab (clear old data first)
  const lastRow = standingsSheet.getLastRow();
  if (lastRow > 1) {
    standingsSheet.getRange(2, 1, lastRow - 1, 10).clearContent().clearFormat();
  }

  if (rows.length > 0) {
    const dataRange = standingsSheet.getRange(2, 1, rows.length, 10);
    dataRange.setValues(rows);

    // ── Format the data rows ──
    dataRange.setFontFamily('Arial').setFontSize(10).setVerticalAlignment('middle');
    dataRange.setHorizontalAlignment('center');
    standingsSheet.getRange(2, 1, rows.length, 2).setHorizontalAlignment('left'); // Team, League left-aligned

    // Bold Pts column
    standingsSheet.getRange(2, 10, rows.length, 1).setFontWeight('bold');

    // Highlight Vikings/Valkyries rows in yellow
    for (let r = 0; r < rows.length; r++) {
      const teamName = rows[r][0];
      if (teamName.toLowerCase().includes('stortford') ||
          teamName.toLowerCase().includes('viking') ||
          teamName.toLowerCase().includes('valkyrie')) {
        standingsSheet.getRange(r + 2, 1, 1, 10)
          .setBackground('#fef9c3')
          .setFontWeight('bold');
      }
    }

    // Alternate row shading for non-Vikings rows
    for (let r = 0; r < rows.length; r++) {
      const teamName = rows[r][0];
      const isVikings = teamName.toLowerCase().includes('stortford');
      if (!isVikings && (r + 2) % 2 === 0) {
        standingsSheet.getRange(r + 2, 1, 1, 10).setBackground('#f8f9fa');
      }
    }

    // Positive PD = green, Negative PD = red (column I = index 9 = col 9)
    for (let r = 0; r < rows.length; r++) {
      const pd = rows[r][8];
      const pdCell = standingsSheet.getRange(r + 2, 9);
      if (pd > 0) {
        pdCell.setFontColor('#276221');
        pdCell.setValue('+' + pd);
      } else if (pd < 0) {
        pdCell.setFontColor('#9c0006');
      }
    }

    // Add row borders between leagues
    let currentLeague = rows[0][1];
    for (let r = 1; r < rows.length; r++) {
      if (rows[r][1] !== currentLeague) {
        standingsSheet.getRange(r + 1, 1, 1, 10)
          .setBorder(true, false, false, false, false, false, '#14194b', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
        currentLeague = rows[r][1];
      }
    }
  }

  // Timestamp in footer cell
  standingsSheet.getRange(rows.length + 3, 1).setValue('Last updated: ' + new Date().toLocaleString('en-GB'));
  standingsSheet.getRange(rows.length + 3, 1).setFontColor('#999999').setFontSize(9).setFontStyle('italic');
}


// ── AUTO-TRIGGER ON EDIT ────────────────────────────────────
// Called automatically every time Phil edits a cell.
// Only recalculates standings when the Score or Result column changes.

function onEdit(e) {
  const sheet = e.range.getSheet();
  if (sheet.getName() !== 'Fixtures') return;

  const col = e.range.getColumn();
  // Column 6 = Score, Column 7 = Result
  if (col === 6 || col === 7) {
    calculateStandings();
  }
}
