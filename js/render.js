(function () {
  function header(globalProgressPct) {
    const node = document.createElement("header");
    node.className = "header";
    node.innerHTML = `
      <div class="brand">
        <div class="brand-logo">📚</div>
        <div class="brand-title">CodèLearn</div>
      </div>
      <div class="progress-pill">
        <span>Overall progress</span>
        <div class="progress" style="width:160px;"><div style="width:${globalProgressPct}%"></div></div>
        <span>${globalProgressPct}%</span>
      </div>
    `;
    return node;
  }

  function sidebar(tracks, onPickTrack) {
    const aside = document.createElement("aside");
    aside.className = "sidebar";
    aside.innerHTML = `
      <div class="section-title">Tracks</div>
      <div class="track-list"></div>
    `;
    const list = aside.querySelector(".track-list");
    tracks.forEach((t) => {
      const progress = StorageAPI.getTrackProgress(t.id);
      const completed = Object.values(progress.lessons).filter((l) => l.completed).length;
      const node = document.createElement("div");
      node.className = "track-item";
      node.style.borderColor = "var(--border)";
      node.innerHTML = `
        <div class="name" style="color:${t.color}">${t.name}</div>
        <div class="meta">${completed}/${t.lessons.length} lessons</div>
      `;
      node.addEventListener("click", () => onPickTrack(t.id));
      list.appendChild(node);
    });
    return aside;
  }

  function mainContainer() {
    const main = document.createElement("main");
    main.className = "main";
    return main;
  }

  function lessonBadge(lesson) {
    if (!lesson.projectType) return "";
    const label = lesson.projectType === "checkpoint" ? "Project · Checkpoint" : "Project · Final";
    return `<span class="badge">${label}</span>`;
  }

  function trackOverview(track) {
    const box = document.createElement("div");
    box.className = "card";
    const progress = StorageAPI.getTrackProgress(track.id);
    const completed = Object.values(progress.lessons).filter((l) => l.completed).length;
    const pct = track.lessons.length ? Math.round((completed / track.lessons.length) * 100) : 0;

    box.innerHTML = `
      <h2 class="page-title">${track.name}</h2>
      <p style="color:var(--muted);margin-top:-4px">${track.description}</p>
      <div class="progress" style="margin:10px 0 14px;"><div style="width:${pct}%"></div></div>
      <div class="lesson-list"></div>
    `;
    const list = box.querySelector(".lesson-list");
    track.lessons.forEach((lesson, idx) => {
      const item = document.createElement("div");
      item.className = "lesson-item";
      const isDone = StorageAPI.isLessonCompleted(track.id, lesson.id);
      item.innerHTML = `
        <div>
          <div class="title">${idx + 1}. ${lesson.title} ${lessonBadge(lesson)}</div>
          <div class="status">${isDone ? "Completed" : "Not completed"}</div>
        </div>
        <div><a class="btn" href="#/${track.id}/${lesson.id}">Open</a></div>
      `;
      list.appendChild(item);
    });
    return box;
  }

  function lessonView(track, lesson) {
    const box = document.createElement("div");
    box.className = "card";
    box.innerHTML = `
      <div class="lesson-header">
        <h2 class="lesson-title">${track.name} — ${lesson.title}</h2>
        <span class="badge">${StorageAPI.isLessonCompleted(track.id, lesson.id) ? "Completed" : (lesson.projectType ? `In progress · ${lesson.projectType === "checkpoint" ? "Checkpoint Project" : "Final Project"}` : "In progress")}</span>
      </div>
      <section class="lesson-content"></section>
    `;
    box.querySelector(".lesson-content").innerHTML = lesson.content;

    // IDE mount (per track)
    const ideMount = document.createElement('div');
    box.appendChild(ideMount);
    if (track.id === 'python') {
      IDE.mountPython(ideMount, { trackId: track.id, lessonId: lesson.id, starter: 'print("Hello from Pyodide!")' });
    } else if (track.id === 'html' || track.id === 'css' || track.id === 'javascript') {
      const starters = {
        html: '<h1>Hello</h1>\n<p>Edit and run!</p>',
        css: 'body { font-family: system-ui, sans-serif; padding: 1rem; }\nh1 { color: #2563eb; }',
        js: 'console.log("Hello from JS")',
      };
      const focus = track.id === 'javascript' ? 'js' : undefined;
      IDE.mountWeb(ideMount, { trackId: track.id, lessonId: lesson.id, starters, focus });
    }

    const assignment = Assignments.renderAssignment({
      trackId: track.id,
      lessonId: lesson.id,
      assignment: lesson.assignment || { questions: [] },
      lesson,
    });
    box.appendChild(assignment);

    const footer = document.createElement("div");
    footer.className = "button-row";
    footer.innerHTML = `
      <a class="btn" href="#/${track.id}">Back to ${track.name}</a>
      <button class="btn success" data-action="complete">Mark lesson complete</button>
    `;
    footer.querySelector('[data-action="complete"]').addEventListener("click", () => {
      StorageAPI.markLessonComplete(track.id, lesson.id);
      window.Router.navigateTo(`#/${track.id}/${lesson.id}`);
    });
    box.appendChild(footer);

    return box;
  }

  function tracksHome(tracks) {
    const box = document.createElement("div");
    box.className = "card";
    box.innerHTML = `
      <h2 class="page-title">Choose a track</h2>
      <div class="lesson-list"></div>
    `;
    const list = box.querySelector(".lesson-list");
    tracks.forEach((t) => {
      const progress = StorageAPI.getTrackProgress(t.id);
      const completed = Object.values(progress.lessons).filter((l) => l.completed).length;
      const pct = t.lessons.length ? Math.round((completed / t.lessons.length) * 100) : 0;
      const item = document.createElement("div");
      item.className = "lesson-item";
      item.innerHTML = `
        <div>
          <div class="title" style="color:${t.color}">${t.name}</div>
          <div class="status">${pct}% complete</div>
        </div>
        <div><a class="btn" href="#/${t.id}">Open</a></div>
      `;
      list.appendChild(item);
    });
    return box;
  }

  function layout({ tracks, mainContent }) {
    const root = document.createElement("div");

    const { pct } = StorageAPI.getGlobalProgress({ tracks });
    const head = header(pct);
    const side = sidebar(tracks, (id) => {
      window.Router.navigateTo(`#/${id}`);
    });
    const main = mainContainer();
    main.appendChild(mainContent);

    root.appendChild(head);
    root.appendChild(side);
    root.appendChild(main);

    return root;
  }

  window.UI = {
    layout,
    trackOverview,
    lessonView,
    tracksHome,
  };
})();

