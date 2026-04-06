/* =========================================================
   Eastside Hoops – Site JavaScript (v4 Redesign)
   Uses data-manager.js for Google Sheets integration
   ========================================================= */

const $ = (sel, scope) => (scope || document).querySelector(sel);
const $$ = (sel, scope) => Array.from((scope || document).querySelectorAll(sel));

/* ----- Mobile nav ----- */
const toggleBtn = $('.nav-toggle');
const navMenu = $('#nav');
if (toggleBtn && navMenu) {
  toggleBtn.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    toggleBtn.textContent = isOpen ? 'Close' : 'Menu';
  });
  $$('a', navMenu).forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.textContent = 'Menu';
    });
  });
}

/* ----- Sticky header hide/show ----- */
let lastScrollY = window.scrollY;
const header = document.querySelector('.site-header');
if (header) {
  window.addEventListener('scroll', () => {
    const current = window.scrollY;
    if (current > lastScrollY && current > 120) {
      header.classList.add('hide');
    } else {
      header.classList.remove('hide');
    }
    lastScrollY = current;
  }, { passive: true });
}

/* ----- Copyright year ----- */
const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* =========================================================
   Homepage: Fixtures + Standings Preview
   (Only runs on pages that have these elements)
   ========================================================= */

document.addEventListener('DOMContentLoaded', async () => {

  // ── Fixtures (sidebar on homepage) ──
  const upcomingList = $('#upcomingFixtures');
  const previousList = $('#previousFixtures');

  if (upcomingList && previousList && typeof VikingsData !== 'undefined') {
    try {
      const fixtures = await VikingsData.getFixtures();
      const { upcoming, past } = VikingsData.splitFixtures(fixtures);
      renderFixtureList('upcomingFixtures', upcoming, 'No upcoming fixtures.');
      renderFixtureList('previousFixtures', past.slice(0, 5), 'No previous results.');
    } catch (e) {
      console.error('Error loading fixtures:', e);
    }
  }

  // ── Standings Preview (homepage) ──
  const standingsPreview = $('#standingsPreview');
  if (standingsPreview && typeof VikingsData !== 'undefined') {
    try {
      const standings = await VikingsData.getStandings();
      const grouped = VikingsData.groupStandingsByLeague(standings);
      renderStandingsPreview(standingsPreview, grouped);
    } catch (e) {
      console.error('Error loading standings:', e);
    }
  }
});

/* =========================================================
   Render Functions
   ========================================================= */

function renderFixtureList(listId, items, emptyMsg) {
  const list = document.getElementById(listId);
  if (!list) return;
  list.innerHTML = '';

  if (!items.length) {
    const li = document.createElement('li');
    li.textContent = emptyMsg;
    li.className = 'muted';
    list.appendChild(li);
    return;
  }

  items.forEach(f => {
    const li = document.createElement('li');
    const dateObj = new Date(f.date);
    const dayName = dateObj.toLocaleDateString('en-GB', { weekday: 'short' });
    const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const isHome = (f.venue || '').toLowerCase() === 'home';
    const venueBadge = `<span class="venue-badge ${isHome ? 'home' : 'away'}">${f.venue}</span>`;

    let resultHtml = '';
    if (f.result) {
      const cls = f.result === 'W' ? 'win' : f.result === 'L' ? 'loss' : 'draw';
      resultHtml = `<span class="fx-result ${cls}">${f.result}</span>`;
      if (f.score) {
        resultHtml = `<span class="score-badge ${cls}">${f.score}</span> ${resultHtml}`;
      }
    }

    li.innerHTML = `
      <div class="fx-date">${dayName} ${dateStr} ${venueBadge}</div>
      <div class="fx-row"><strong>${f.team}</strong> vs ${f.opponent} ${resultHtml}</div>
      <div class="fx-meta">Tip-off ${f.time}</div>
    `;
    list.appendChild(li);
  });
}

function renderStandingsPreview(container, grouped) {
  // Show a compact preview of the first 2 leagues
  const leagueNames = Object.keys(grouped).slice(0, 2);

  if (!leagueNames.length) {
    container.innerHTML = '<p class="muted">No standings data available yet.</p>';
    return;
  }

  let html = '<div class="grid-2">';
  leagueNames.forEach(league => {
    const table = grouped[league];
    html += `
      <div class="league-table-wrap">
        <h3 class="league-title">${league}</h3>
        <div class="table-scroll">
          <table class="standings-table">
            <thead>
              <tr>
                <th class="pos-col">#</th>
                <th class="team-col">Team</th>
                <th>P</th>
                <th>W</th>
                <th>L</th>
                <th class="pts-col">Pts</th>
              </tr>
            </thead>
            <tbody>
    `;
    table.forEach((row, i) => {
      const isVikings = row.team.toLowerCase().includes('eastside') ||
                        row.team.toLowerCase().includes('hoops') ||
                        row.team.toLowerCase().includes('women');
      const rowClass = isVikings ? 'vikings-row' : '';
      html += `
        <tr class="${rowClass}">
          <td class="pos-col">${i + 1}</td>
          <td class="team-col">${isVikings ? '<strong>' + row.team + '</strong>' : row.team}</td>
          <td>${row.p}</td>
          <td>${row.w}</td>
          <td>${row.l}</td>
          <td class="pts-col"><strong>${row.pts}</strong></td>
        </tr>
      `;
    });
    html += '</tbody></table></div></div>';
  });
  html += '</div>';
  container.innerHTML = html;
}

/* =========================================================
   Get Involved form
   ========================================================= */
const giForm = $('#getInvolvedForm');
const toast = $('#toast');

if (giForm) {
  giForm.addEventListener('submit', e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    console.log('Get Involved enquiry:', data);

    if (toast) {
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 4000);
    }

    e.target.reset();
  });
}
