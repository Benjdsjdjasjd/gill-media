/* =========================================================
   Eastside Hoops – Data Manager
   Fetches live data from a published Google Sheet.

   SETUP (one-time — see SETUP-GUIDE.html for full walkthrough):
   1. Paste the sheet setup script into Extensions → Apps Script
   2. Run the setup function once — it builds everything
   3. File → Share → Publish to web → Entire Document → Publish
   4. Copy the Sheet ID from the URL and paste it below

   The coach ONLY fills in the Fixtures tab.
   Standings auto-calculate via the Apps Script trigger.
   ========================================================= */

const VikingsData = (() => {

  // ─── CONFIGURATION ─────────────────────────────────────
  // Replace this with your real Google Sheet ID after publishing.
  // The Sheet ID is the long string in the sheet URL between /d/ and /edit
  // Example: https://docs.google.com/spreadsheets/d/ABC123xyz/edit
  //          Sheet ID = "ABC123xyz"

  const SHEET_ID = 'DEMO_MODE';

  // Tab names — must match exactly what the coach names the tabs
  const TABS = {
    fixtures:  'Fixtures',
    standings: 'Standings',
    teams:     'Teams'
  };

  // ─── INTERNAL ──────────────────────────────────────────

  function sheetURL(tabName) {
    return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${encodeURIComponent(tabName)}&tqx=out:json`;
  }

  function parseGoogleJSON(raw) {
    // Google wraps the JSON in: google.visualization.Query.setResponse({...});
    const jsonStr = raw.substring(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
    return JSON.parse(jsonStr);
  }

  function cellValue(cell) {
    if (!cell) return '';
    // Google Sheets dates come as "Date(yyyy,m,d)" — convert them
    if (cell.v && typeof cell.v === 'string' && cell.v.startsWith('Date(')) {
      const parts = cell.v.replace('Date(', '').replace(')', '').split(',');
      return new Date(+parts[0], +parts[1], +parts[2]).toISOString().split('T')[0];
    }
    return cell.v ?? '';
  }

  function isConfigured() {
    return SHEET_ID && SHEET_ID !== 'YOUR_SHEET_ID';
  }

  // ─── FETCH HELPERS ─────────────────────────────────────

  async function fetchTab(tabName) {
    const res = await fetch(sheetURL(tabName));
    const raw = await res.text();
    const json = parseGoogleJSON(raw);
    const headers = json.table.cols.map(c => (c.label || '').trim().toLowerCase());
    return json.table.rows.map(row => {
      const obj = {};
      row.c.forEach((cell, i) => {
        if (headers[i]) obj[headers[i]] = cellValue(cell);
      });
      return obj;
    });
  }

  // ─── PUBLIC API ────────────────────────────────────────

  /**
   * Fetch all fixtures.
   * Expected columns: Date, Team, Opponent, Venue, Time, Score, Result (W/L/D)
   * Returns: [{ date, team, opponent, venue, time, score, result }, ...]
   */
  async function getFixtures() {
    if (!isConfigured()) return getSampleFixtures();
    try {
      const rows = await fetchTab(TABS.fixtures);
      return rows.map(r => ({
        date:     r.date || '',
        team:     r.team || '',
        opponent: r.opponent || '',
        venue:    r.venue || '',
        time:     r.time || r.tip || '',
        score:    r.score || '',
        result:   r.result || ''
      })).filter(r => r.date && r.team);
    } catch (e) {
      console.error('Error fetching fixtures:', e);
      return getSampleFixtures();
    }
  }

  /**
   * Fetch league standings for all teams.
   * Expected columns: Team, League, P, W, L, PF, PA, PD, Pts
   * Returns: [{ team, league, p, w, l, pf, pa, pd, pts }, ...]
   */
  async function getStandings() {
    if (!isConfigured()) return getSampleStandings();
    try {
      const rows = await fetchTab(TABS.standings);
      return rows.map(r => ({
        team:   r.team || '',
        league: r.league || '',
        p:      +r.p || +r.played || 0,
        w:      +r.w || +r.won || 0,
        l:      +r.l || +r.lost || 0,
        pf:     +r.pf || +r['points for'] || 0,
        pa:     +r.pa || +r['points against'] || 0,
        pd:     +r.pd || +r['point diff'] || 0,
        pts:    +r.pts || +r.points || 0
      })).filter(r => r.team);
    } catch (e) {
      console.error('Error fetching standings:', e);
      return getSampleStandings();
    }
  }

  /**
   * Fetch team info.
   * Expected columns: Team, Age Group, League, Season
   * Returns: [{ team, ageGroup, league, season }, ...]
   */
  async function getTeams() {
    if (!isConfigured()) return getSampleTeams();
    try {
      const rows = await fetchTab(TABS.teams);
      return rows.map(r => ({
        team:     r.team || r['team name'] || '',
        ageGroup: r['age group'] || r.age || '',
        league:   r.league || r['league name'] || '',
        season:   r.season || ''
      })).filter(r => r.team);
    } catch (e) {
      console.error('Error fetching teams:', e);
      return getSampleTeams();
    }
  }

  // ─── SAMPLE DATA (shown when Sheet is not yet connected) ──

  function getSampleFixtures() {
    return [
      { date: '2026-04-05', team: 'U12', opponent: 'Harlow Hawks', venue: 'Home', time: '18:00', score: '', result: '' },
      { date: '2026-04-08', team: 'U14', opponent: 'Chelmsford Chargers', venue: 'Away', time: '19:00', score: '', result: '' },
      { date: '2026-04-12', team: 'U16', opponent: 'Cambridge Cats', venue: 'Home', time: '20:00', score: '', result: '' },
      { date: '2026-04-19', team: 'Women\'s Team', opponent: 'Norwich Falcons', venue: 'Away', time: '19:00', score: '', result: '' },
      { date: '2026-04-26', team: 'U18', opponent: 'Colchester Thunder', venue: 'Home', time: '18:30', score: '', result: '' },
      { date: '2026-03-15', team: 'Women\'s Team', opponent: 'Norwich Falcons', venue: 'Away', time: '19:00', score: '65-58', result: 'W' },
      { date: '2026-03-08', team: 'U16', opponent: 'Essex Eagles', venue: 'Home', time: '19:30', score: '52-60', result: 'L' },
      { date: '2026-03-01', team: 'U14', opponent: 'Harlow Hawks', venue: 'Home', time: '18:30', score: '44-38', result: 'W' },
      { date: '2026-02-22', team: 'U12', opponent: 'Chelmsford Chargers', venue: 'Away', time: '17:30', score: '36-42', result: 'L' },
      { date: '2026-02-15', team: 'U18', opponent: 'Ipswich Heat', venue: 'Home', time: '19:00', score: '71-63', result: 'W' },
      { date: '2026-02-08', team: 'U16', opponent: 'Cambridge Cats', venue: 'Away', time: '18:00', score: '55-55', result: 'D' },
      { date: '2026-01-25', team: 'Women\'s Team', opponent: 'Colchester Thunder', venue: 'Home', time: '19:00', score: '48-39', result: 'W' },
    ];
  }

  function getSampleStandings() {
    return [
      // U12 League
      { team: 'Eastside Hoops', league: 'U12 East Herts League', p: 8, w: 5, l: 3, pf: 312, pa: 290, pd: 22, pts: 18 },
      { team: 'Harlow Hawks', league: 'U12 East Herts League', p: 8, w: 6, l: 2, pf: 330, pa: 275, pd: 55, pts: 20 },
      { team: 'Chelmsford Chargers', league: 'U12 East Herts League', p: 8, w: 4, l: 4, pf: 298, pa: 305, pd: -7, pts: 16 },
      { team: 'Cambridge Cubs', league: 'U12 East Herts League', p: 8, w: 1, l: 7, pf: 240, pa: 310, pd: -70, pts: 10 },
      // U14 League
      { team: 'Eastside Hoops', league: 'U14 East Region', p: 10, w: 7, l: 3, pf: 445, pa: 390, pd: 55, pts: 24 },
      { team: 'Essex Eagles', league: 'U14 East Region', p: 10, w: 8, l: 2, pf: 460, pa: 370, pd: 90, pts: 26 },
      { team: 'Norwich Falcons', league: 'U14 East Region', p: 10, w: 5, l: 5, pf: 410, pa: 415, pd: -5, pts: 20 },
      { team: 'Ipswich Heat', league: 'U14 East Region', p: 10, w: 0, l: 10, pf: 310, pa: 450, pd: -140, pts: 10 },
      // U16 League
      { team: 'Eastside Hoops', league: 'U16 East Region', p: 10, w: 6, l: 4, pf: 520, pa: 495, pd: 25, pts: 22 },
      { team: 'Cambridge Cats', league: 'U16 East Region', p: 10, w: 7, l: 3, pf: 540, pa: 480, pd: 60, pts: 24 },
      { team: 'Colchester Thunder', league: 'U16 East Region', p: 10, w: 3, l: 7, pf: 460, pa: 510, pd: -50, pts: 16 },
      // Women's League
      { team: 'Eastside Women\'s', league: 'Women\'s East Herts League', p: 8, w: 6, l: 2, pf: 410, pa: 340, pd: 70, pts: 20 },
      { team: 'Norwich Falcons W', league: 'Women\'s East Herts League', p: 8, w: 5, l: 3, pf: 380, pa: 350, pd: 30, pts: 18 },
      { team: 'Colchester Storm W', league: 'Women\'s East Herts League', p: 8, w: 2, l: 6, pf: 310, pa: 400, pd: -90, pts: 12 },
    ];
  }

  function getSampleTeams() {
    return [
      { team: 'U12', ageGroup: 'Under 12', league: 'U12 East Herts League', season: '2025-26' },
      { team: 'U14', ageGroup: 'Under 14', league: 'U14 East Region', season: '2025-26' },
      { team: 'U16', ageGroup: 'Under 16', league: 'U16 East Region', season: '2025-26' },
      { team: 'U18', ageGroup: 'Under 18', league: 'U18 East Region', season: '2025-26' },
      { team: 'Women\'s Team', ageGroup: 'Women', league: 'Women\'s East Herts League', season: '2025-26' },
    ];
  }

  // ─── UTILITY FUNCTIONS ─────────────────────────────────

  /**
   * Split fixtures into upcoming and past, sorted correctly.
   */
  function splitFixtures(fixtures) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = fixtures
      .filter(f => new Date(f.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const past = fixtures
      .filter(f => new Date(f.date) < today)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return { upcoming, past };
  }

  /**
   * Group standings by league name.
   * Returns: { "U12 East Herts League": [...], "U14 East Region": [...], ... }
   */
  function groupStandingsByLeague(standings) {
    const groups = {};
    standings.forEach(row => {
      const league = row.league || 'Unknown League';
      if (!groups[league]) groups[league] = [];
      groups[league].push(row);
    });
    // Sort each league by points descending, then point diff
    Object.values(groups).forEach(table => {
      table.sort((a, b) => b.pts - a.pts || b.pd - a.pd);
    });
    return groups;
  }

  /**
   * Filter fixtures by team name.
   */
  function filterByTeam(fixtures, teamName) {
    if (!teamName || teamName === 'all') return fixtures;
    return fixtures.filter(f =>
      f.team.toLowerCase().includes(teamName.toLowerCase())
    );
  }

  /**
   * Get win/loss/draw record for a team from fixtures.
   */
  function getTeamRecord(fixtures, teamName) {
    const teamFixtures = filterByTeam(fixtures, teamName).filter(f => f.result);
    return {
      played: teamFixtures.length,
      wins: teamFixtures.filter(f => f.result === 'W').length,
      losses: teamFixtures.filter(f => f.result === 'L').length,
      draws: teamFixtures.filter(f => f.result === 'D').length
    };
  }

  // ─── PUBLIC INTERFACE ──────────────────────────────────

  return {
    getFixtures,
    getStandings,
    getTeams,
    splitFixtures,
    groupStandingsByLeague,
    filterByTeam,
    getTeamRecord,
    isConfigured
  };

})();
