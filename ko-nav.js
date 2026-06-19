// ko-nav.js — Globale navigatiebalk voor KO-Company Platform
// Voeg toe aan elke pagina: <script src="/ko-nav.js"></script>
// Gebruik: KONav.init({ module: 'Evaluaties', crumbs: [{ label: 'Club Rolluik', href: '/locatie.html' }] })

const KONav = {
  _supabase: null,

  init({ module = null, crumbs = [], accentColor = null } = {}) {
    // Wacht tot DOM geladen is
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this._build(module, crumbs, accentColor));
    } else {
      this._build(module, crumbs, accentColor);
    }
  },

  _build(module, crumbs, accentColor) {
    // Inject CSS
    if (!document.getElementById('ko-nav-style')) {
      const style = document.createElement('style');
      style.id = 'ko-nav-style';
      style.textContent = `
        :root {
          --ko-cream: #F5F0E8;
          --ko-black: #1a1a18;
          --ko-gray: #666660;
          --ko-border: rgba(0,0,0,0.1);
          --ko-nav-h: 52px;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --ko-cream: #2a2a28;
            --ko-black: #f0f0ee;
            --ko-gray: #aaaaaa;
            --ko-border: rgba(255,255,255,0.1);
          }
        }
        #ko-nav {
          position: sticky;
          top: 0;
          z-index: 50;
          background: var(--ko-cream);
          border-bottom: 0.5px solid var(--ko-border);
          height: var(--ko-nav-h);
          display: flex;
          align-items: center;
          padding: 0 1.25rem;
          gap: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        #ko-nav .ko-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          flex-shrink: 0;
        }
        #ko-nav .ko-logo img {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }
        #ko-nav .ko-logo-txt {
          font-size: 15px;
          font-weight: 600;
          color: var(--ko-black);
          letter-spacing: -0.02em;
        }
        #ko-nav .ko-divider {
          width: 0.5px;
          height: 20px;
          background: var(--ko-border);
          margin: 0 14px;
          flex-shrink: 0;
        }
        #ko-nav .ko-crumbs {
          display: flex;
          align-items: center;
          gap: 0;
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }
        #ko-nav .ko-crumb {
          display: flex;
          align-items: center;
          gap: 0;
          white-space: nowrap;
          min-width: 0;
        }
        #ko-nav .ko-crumb a,
        #ko-nav .ko-crumb span {
          font-size: 13px;
          color: var(--ko-gray);
          text-decoration: none;
          padding: 4px 6px;
          border-radius: 6px;
          transition: background 0.15s, color 0.15s;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 160px;
          display: block;
        }
        #ko-nav .ko-crumb a:hover { background: rgba(0,0,0,0.06); color: var(--ko-black); }
        #ko-nav .ko-crumb.active span { color: var(--ko-black); font-weight: 500; }
        #ko-nav .ko-sep {
          font-size: 12px;
          color: var(--ko-border);
          margin: 0 2px;
          flex-shrink: 0;
        }
        #ko-nav .ko-user {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
          margin-left: auto;
        }
        #ko-nav .ko-user-name {
          font-size: 12px;
          color: var(--ko-gray);
          white-space: nowrap;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        #ko-nav .ko-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--ko-black);
          color: var(--ko-cream);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
          flex-shrink: 0;
          cursor: pointer;
        }
        #ko-nav .ko-logout {
          font-size: 12px;
          color: var(--ko-gray);
          cursor: pointer;
          padding: 5px 8px;
          border-radius: 6px;
          border: 0.5px solid var(--ko-border);
          background: none;
          font-family: inherit;
          transition: background 0.15s;
          white-space: nowrap;
        }
        #ko-nav .ko-logout:hover { background: rgba(0,0,0,0.06); }
        body { padding-top: 0 !important; }
        .ko-page { padding: 1.5rem 1rem 3rem; }
        @media (max-width: 480px) {
          #ko-nav .ko-user-name { display: none; }
          #ko-nav .ko-crumb a,
          #ko-nav .ko-crumb span { max-width: 100px; }
        }
      `;
      document.head.appendChild(style);
    }

    // Build nav HTML
    const nav = document.createElement('nav');
    nav.id = 'ko-nav';

    // Logo
    nav.innerHTML = `
      <a href="/home.html" class="ko-logo">
        <img src="/KO_Logo1.png" alt="KO-Company" onerror="this.style.display='none'" />
        <span class="ko-logo-txt">KO-Company</span>
      </a>
    `;

    // Crumbs
    const allCrumbs = [];
    if (module) allCrumbs.push({ label: module, href: this._moduleHref(module) });
    crumbs.forEach(c => allCrumbs.push(c));

    if (allCrumbs.length > 0) {
      const divider = document.createElement('div');
      divider.className = 'ko-divider';
      nav.appendChild(divider);

      const crumbsEl = document.createElement('div');
      crumbsEl.className = 'ko-crumbs';

      allCrumbs.forEach((c, i) => {
        const isLast = i === allCrumbs.length - 1;
        const crumb = document.createElement('div');
        crumb.className = 'ko-crumb' + (isLast ? ' active' : '');

        if (i > 0) {
          const sep = document.createElement('span');
          sep.className = 'ko-sep';
          sep.textContent = '/';
          crumbsEl.appendChild(sep);
        }

        if (!isLast && c.href) {
          crumb.innerHTML = `<a href="${c.href}">${c.label}</a>`;
        } else {
          crumb.innerHTML = `<span>${c.label}</span>`;
        }
        crumbsEl.appendChild(crumb);
      });

      nav.appendChild(crumbsEl);
    }

    // User section
    const userEl = document.createElement('div');
    userEl.className = 'ko-user';
    userEl.innerHTML = `
      <span class="ko-user-name" id="ko-user-name">—</span>
      <div class="ko-avatar" id="ko-avatar" title="Profiel">?</div>
      <button class="ko-logout" onclick="KONav.logout()">Uitloggen</button>
    `;
    nav.appendChild(userEl);

    // Insert at top of body
    document.body.insertBefore(nav, document.body.firstChild);

    // Load user info
    this._loadUser();
  },

  _moduleHref(module) {
    const map = {
      'Evaluaties': '/locatie.html',
      'Pakbonnen': '/pakbonnen.html',
      'Beheer': '/admin.html',
    };
    return map[module] || '/home.html';
  },

  async _loadUser() {
    try {
      const sb = window._supabase || window.supabase;
      if (!sb) return;
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return;
      const { data: profiel } = await sb.from('gebruikers').select('naam,rol').eq('id', session.user.id).single();
      if (profiel?.naam) {
        const nameEl = document.getElementById('ko-user-name');
        const avatarEl = document.getElementById('ko-avatar');
        if (nameEl) nameEl.textContent = profiel.naam;
        if (avatarEl) avatarEl.textContent = profiel.naam.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      }
    } catch(e) {}
  },

  async logout() {
    try {
      const sb = window._supabase || window.supabase;
      if (sb) await sb.auth.signOut();
    } catch(e) {}
    window.location.href = '/auth.html';
  }
};
