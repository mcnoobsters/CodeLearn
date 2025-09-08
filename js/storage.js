(function () {
  const STORAGE_KEY = "learnx_progress_v1";

  function read() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { tracks: {} };
      return JSON.parse(raw);
    } catch {
      return { tracks: {} };
    }
  }

  function write(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function ensureTrack(state, trackId) {
    if (!state.tracks[trackId]) {
      state.tracks[trackId] = { lessons: {}, startedAt: Date.now(), updatedAt: Date.now() };
    }
  }

  function getTrackProgress(trackId) {
    const state = read();
    ensureTrack(state, trackId);
    return state.tracks[trackId];
  }

  function markLessonComplete(trackId, lessonId) {
    const state = read();
    ensureTrack(state, trackId);
    state.tracks[trackId].lessons[lessonId] = { ...(state.tracks[trackId].lessons[lessonId] || {}), completed: true, updatedAt: Date.now() };
    state.tracks[trackId].updatedAt = Date.now();
    write(state);
  }

  function saveAnswer(trackId, lessonId, questionId, answer) {
    const state = read();
    ensureTrack(state, trackId);
    const lesson = state.tracks[trackId].lessons[lessonId] || {};
    lesson.answers = lesson.answers || {};
    lesson.answers[questionId] = { answer, updatedAt: Date.now() };
    state.tracks[trackId].lessons[lessonId] = lesson;
    state.tracks[trackId].updatedAt = Date.now();
    write(state);
  }

  function getAnswer(trackId, lessonId, questionId) {
    const state = read();
    const track = state.tracks[trackId];
    if (!track) return undefined;
    const lesson = track.lessons[lessonId];
    if (!lesson) return undefined;
    return lesson.answers ? lesson.answers[questionId] : undefined;
  }

  function isLessonCompleted(trackId, lessonId) {
    const state = read();
    return Boolean(state.tracks?.[trackId]?.lessons?.[lessonId]?.completed);
  }

  function getGlobalProgress(data) {
    const totals = { completed: 0, total: 0 };
    data.tracks.forEach((t) => {
      totals.total += t.lessons.length;
      const progress = getTrackProgress(t.id);
      const completed = Object.values(progress.lessons || {}).filter((l) => l.completed).length;
      totals.completed += completed;
    });
    return { ...totals, pct: totals.total ? Math.round((totals.completed / totals.total) * 100) : 0 };
  }

  window.StorageAPI = {
    read,
    write,
    getTrackProgress,
    markLessonComplete,
    saveAnswer,
    getAnswer,
    isLessonCompleted,
    getGlobalProgress,
  };
})();

