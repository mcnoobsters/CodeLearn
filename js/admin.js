(function () {
  function buildProgressSummary() {
    const tracks = Curriculum.tracks;
    return tracks.map((t) => {
      const prog = StorageAPI.getTrackProgress(t.id);
      const completed = Object.values(prog.lessons || {}).filter((l) => l.completed).length;
      return { id: t.id, name: t.name, completed, total: t.lessons.length };
    });
  }

  function markAllLessonsComplete(trackId) {
    const track = Curriculum.getTrackById(trackId);
    if (!track) return;
    track.lessons.forEach((lesson) => StorageAPI.markLessonComplete(trackId, lesson.id));
  }

  function exportProgress() { return JSON.stringify(StorageAPI.read(), null, 2); }
  function importProgress(json) { try { const data = JSON.parse(json); if (!data || typeof data !== 'object' || !data.tracks) throw new Error('Invalid format'); StorageAPI.write(data); return true; } catch { return false; } }

  function adminPanel() {
    const card = document.createElement('div');
    card.className = 'card';
    const summary = buildProgressSummary();
    const ipText = Auth.publicIp ? Auth.publicIp : 'Unknown';
    const adminStatus = Auth.isAdmin ? 'You have admin privileges.' : 'You are NOT admin.';

    card.innerHTML = `
      <h2 class="page-title">Admin Panel</h2>
      <p class="badge" style="display:inline-block;margin-bottom:10px;">IP: ${ipText}</p>
      <p style="color:${Auth.isAdmin ? '#22c55e' : '#ef4444'};margin-top:0">${adminStatus}</p>
      ${Auth.isAdmin ? `
        <section class="card">
          <h3 style="margin:0 0 6px;">Progress Overview</h3>
          <div class="lesson-list">
            ${summary.map((s) => `
              <div class="lesson-item">
                <div>
                  <div class="title">${s.name}</div>
                  <div class="status">${s.completed}/${s.total} lessons completed</div>
                </div>
                <div><button class="btn success" data-action="complete-track" data-track="${s.id}">Mark all complete</button></div>
              </div>
            `).join('')}
          </div>
        </section>

        <section class="card">
          <h3 style="margin:0 0 6px;">Export / Import Progress</h3>
          <div class="button-row">
            <button class="btn" data-action="export">Export</button>
            <button class="btn warn" data-action="reset">Reset All</button>
          </div>
          <textarea rows="8" style="width:100%;margin-top:10px;padding:10px;border:1px solid var(--border);border-radius:10px;background:#0b1324;color:var(--text);" placeholder="Paste exported JSON here to import"></textarea>
          <div class="button-row">
            <button class="btn primary" data-action="import">Import</button>
            <span class="badge" data-status=""></span>
          </div>
        </section>
      ` : `
        <div class="card"><p>Access denied. Add your public IP to Config.ADMIN_IPS or use ?admin=1 if enabled.</p></div>
      `}
      <div class="button-row" style="margin-top:12px;"><a class="btn" href="#/">Back Home</a></div>
    `;

    if (Auth.isAdmin) {
      card.querySelectorAll('[data-action="complete-track"]').forEach((btn) => {
        btn.addEventListener('click', () => { const trackId = btn.getAttribute('data-track'); markAllLessonsComplete(trackId); window.Router.navigateTo(`#/${trackId}`); });
      });
      const exportBtn = card.querySelector('[data-action="export"]');
      const resetBtn = card.querySelector('[data-action="reset"]');
      const importBtn = card.querySelector('[data-action="import"]');
      const textArea = card.querySelector('textarea');
      const status = card.querySelector('[data-status]');
      exportBtn.addEventListener('click', () => { textArea.value = exportProgress(); status.textContent = 'Exported current progress below.'; status.style.color = '#94a3b8'; setTimeout(() => (status.textContent = ''), 1500); });
      resetBtn.addEventListener('click', () => { StorageAPI.write({ tracks: {} }); status.textContent = 'All progress reset.'; status.style.color = '#ef4444'; setTimeout(() => (status.textContent = ''), 1500); });
      importBtn.addEventListener('click', () => { const ok = importProgress(textArea.value); status.textContent = ok ? 'Imported successfully.' : 'Import failed (invalid JSON).'; status.style.color = ok ? '#22c55e' : '#ef4444'; setTimeout(() => (status.textContent = ''), 1500); });
    }

    return card;
  }

  window.AdminUI = { adminPanel };
})();

