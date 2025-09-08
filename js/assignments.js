(function () {
  function renderMCQ({ trackId, lessonId, question }) {
    const saved = StorageAPI.getAnswer(trackId, lessonId, question.id);
    const selectedIndex = saved?.answer?.selectedIndex ?? null;

    const root = document.createElement("div");
    root.className = "question";
    root.innerHTML = `
      <div class="prompt">${question.prompt}</div>
      <div class="options">
        ${question.options
          .map((opt, idx) => {
            const label = typeof opt === "string" ? opt : (opt.title || JSON.stringify(opt));
            return `
              <label class="option">
                <input type="radio" name="${lessonId}-${question.id}" ${selectedIndex === idx ? "checked" : ""} data-index="${idx}" />
                <span>${label}</span>
              </label>`;
          })
          .join("")}
      </div>
      <div class="button-row">
        <button class="btn primary" data-action="check">Check answer</button>
        <span class="badge" data-feedback=""></span>
      </div>
    `;

    root.querySelector('[data-action="check"]').addEventListener("click", () => {
      const picked = root.querySelector('input[type="radio"]:checked');
      if (!picked) return;
      const idx = Number(picked.getAttribute("data-index"));
      StorageAPI.saveAnswer(trackId, lessonId, question.id, { selectedIndex: idx });
      const feedback = root.querySelector('[data-feedback]');
      if (idx === question.correctIndex) {
        feedback.textContent = "Correct! " + (question.explanation || "");
        feedback.style.color = "#22c55e";
      } else {
        feedback.textContent = "Not quite. " + (question.explanation || "");
        feedback.style.color = "#ef4444";
      }
    });

    return root;
  }

  function renderFreeform({ trackId, lessonId, question }) {
    const saved = StorageAPI.getAnswer(trackId, lessonId, question.id);
    const value = saved?.answer?.text || "";

    const root = document.createElement("div");
    root.className = "question";
    root.innerHTML = `
      <div class="prompt">${question.prompt}</div>
      <textarea rows="6" style="width:100%;resize:vertical;padding:10px;border-radius:10px;border:1px solid var(--border);background:#0b1324;color:var(--text);" placeholder="${question.placeholder || ""}"></textarea>
      <div class="button-row">
        <button class="btn" data-action="save">Save</button>
        <button class="btn success" data-action="mark-done">Mark lesson complete</button>
        <span class="badge" data-status=""></span>
      </div>
    `;
    const textarea = root.querySelector("textarea");
    textarea.value = value;

    root.querySelector('[data-action="save"]').addEventListener("click", () => {
      StorageAPI.saveAnswer(trackId, lessonId, question.id, { text: textarea.value });
      const status = root.querySelector('[data-status]');
      status.textContent = "Saved";
      status.style.color = "#94a3b8";
      setTimeout(() => (status.textContent = ""), 1200);
    });

    root.querySelector('[data-action="mark-done"]').addEventListener("click", () => {
      StorageAPI.saveAnswer(trackId, lessonId, question.id, { text: textarea.value });
      StorageAPI.markLessonComplete(trackId, lessonId);
      window.Router.navigateTo(`#/${trackId}/${lessonId}`);
    });

    return root;
  }

  function renderProjectChoice({ trackId, lessonId, question }) {
    const saved = StorageAPI.getAnswer(trackId, lessonId, question.id);
    const chosenId = saved?.answer?.projectId || null;

    const root = document.createElement("div");
    root.className = "question";
    const cards = (question.options || []).map((opt, idx) => {
      const isObj = typeof opt === "object";
      const id = isObj ? opt.id : `opt-${idx}`;
      const title = isObj ? opt.title : String(opt);
      const desc = isObj ? (opt.description || "") : "";
      return `
        <label class="project-card">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <input type="radio" name="${lessonId}-${question.id}" ${chosenId === id ? "checked" : ""} data-id="${id}" />
            <h4 style="margin:0;">${title}</h4>
          </div>
          ${desc ? `<div class="meta">${desc}</div>` : ""}
        </label>
      `;
    }).join("");

    root.innerHTML = `
      <div class="prompt">${question.prompt}</div>
      <div class="project-cards">${cards}</div>
      <div class="button-row">
        <button class="btn" data-action="save">Save choice</button>
        <button class="btn success" data-action="complete">Mark lesson complete</button>
        <span class="badge" data-status=""></span>
      </div>
    `;

    function saveChoice() {
      const picked = root.querySelector('input[type="radio"]:checked');
      const status = root.querySelector('[data-status]');
      if (!picked) {
        status.textContent = "Pick a project option first.";
        status.style.color = "#f59e0b";
        return false;
      }
      const projectId = picked.getAttribute("data-id");
      StorageAPI.saveAnswer(trackId, lessonId, question.id, { projectId });
      status.textContent = "Choice saved.";
      status.style.color = "#94a3b8";
      setTimeout(() => (status.textContent = ""), 1200);
      return true;
    }

    root.querySelector('[data-action="save"]').addEventListener("click", () => { saveChoice(); });
    root.querySelector('[data-action="complete"]').addEventListener("click", () => {
      if (saveChoice()) {
        StorageAPI.markLessonComplete(trackId, lessonId);
        window.Router.navigateTo(`#/${trackId}/${lessonId}`);
      }
    });

    return root;
  }

  function renderProjectSubmit({ trackId, lessonId, question }) {
    const saved = StorageAPI.getAnswer(trackId, lessonId, question.id);
    const savedData = saved?.answer || { title: "", description: "", links: "" };

    const root = document.createElement("div");
    root.className = "question";
    root.innerHTML = `
      <div class="prompt">${question.prompt}</div>
      <div style="display:grid;gap:10px;">
        <input type="text" placeholder="Project title" value="${(savedData.title || "").replace(/"/g, "&quot;")}" style="padding:10px;background:#0b1324;border:1px solid var(--border);border-radius:10px;color:var(--text);" />
        <textarea rows="6" placeholder="Short description and reflection" style="padding:10px;background:#0b1324;border:1px solid var(--border);border-radius:10px;color:var(--text);resize:vertical;">${savedData.description || ""}</textarea>
        <input type="text" placeholder="Links (comma-separated: GitHub, demo, screenshots)" value="${(savedData.links || "").replace(/"/g, "&quot;")}" style="padding:10px;background:#0b1324;border:1px solid var(--border);border-radius:10px;color:var(--text);" />
      </div>
      <div class="button-row">
        <button class="btn" data-action="save">Save</button>
        <button class="btn success" data-action="complete">Mark lesson complete</button>
        <span class="badge" data-status=""></span>
      </div>
    `;

    const [titleEl, descEl, linksEl] = root.querySelectorAll("input, textarea");

    function save() {
      const payload = { title: titleEl.value.trim(), description: descEl.value.trim(), links: linksEl.value.trim() };
      StorageAPI.saveAnswer(trackId, lessonId, question.id, payload);
      const status = root.querySelector('[data-status]');
      status.textContent = "Saved";
      status.style.color = "#94a3b8";
      setTimeout(() => (status.textContent = ""), 1200);
      return payload;
    }

    root.querySelector('[data-action="save"]').addEventListener("click", save);
    root.querySelector('[data-action="complete"]').addEventListener("click", () => {
      const { title } = save();
      if (!title) {
        const status = root.querySelector('[data-status]');
        status.textContent = "Add a project title before completing.";
        status.style.color = "#f59e0b";
        return;
      }
      StorageAPI.markLessonComplete(trackId, lessonId);
      window.Router.navigateTo(`#/${trackId}/${lessonId}`);
    });

    return root;
  }

  function renderAssignment({ trackId, lessonId, assignment, lesson }) {
    const section = document.createElement("section");
    section.className = "assignment card";
    section.innerHTML = `<h3>Assignment ${lesson?.projectType ? `· ${lesson.projectType === "checkpoint" ? "Checkpoint Project" : "Final Project"}` : ""}</h3>`;

    (assignment.questions || []).forEach((q) => {
      let node;
      if (q.type === "mcq") node = renderMCQ({ trackId, lessonId, question: q });
      else if (q.type === "freeform") node = renderFreeform({ trackId, lessonId, question: q });
      else if (q.type === "project_choice") node = renderProjectChoice({ trackId, lessonId, question: q });
      else if (q.type === "project_submit") node = renderProjectSubmit({ trackId, lessonId, question: q });
      else node = document.createElement("div");
      section.appendChild(node);
    });

    return section;
  }

  window.Assignments = { renderAssignment };
})();

