(function () {
  const appEl = document.getElementById("app");

  function mount(view) {
    appEl.innerHTML = "";
    appEl.appendChild(view);
  }

  function renderHome() {
    const view = UI.layout({ tracks: Curriculum.tracks, mainContent: UI.tracksHome(Curriculum.tracks) });
    mount(view);
  }

  function renderTrack({ trackId }) {
    const track = Curriculum.getTrackById(trackId);
    if (!track) return Router.navigateTo("#/");
    const view = UI.layout({ tracks: Curriculum.tracks, mainContent: UI.trackOverview(track) });
    mount(view);
  }

  function renderLesson({ trackId, lessonId }) {
    const track = Curriculum.getTrackById(trackId);
    const lesson = Curriculum.getLesson(trackId, lessonId);
    if (!track || !lesson) return Router.navigateTo("#/");
    const view = UI.layout({ tracks: Curriculum.tracks, mainContent: UI.lessonView(track, lesson) });
    mount(view);
  }

  function renderAdmin() {
    const view = UI.layout({ tracks: Curriculum.tracks, mainContent: AdminUI.adminPanel() });
    mount(view);
  }

  Router.addRoute((parts) => ({ matched: parts.length === 0, params: {} }), () => renderHome());
  Router.addRoute((parts) => parts.length === 1 && parts[0] === 'admin' ? { matched: true, params: {} } : { matched: false, params: {} }, () => renderAdmin());
  Router.addRoute((parts) => parts.length === 1 ? { matched: true, params: { trackId: parts[0] } } : { matched: false, params: {} }, (params) => renderTrack(params));
  Router.addRoute((parts) => parts.length === 2 ? { matched: true, params: { trackId: parts[0], lessonId: parts[1] } } : { matched: false, params: {} }, (params) => renderLesson(params));

  Auth.init().then(() => {
    if (!location.hash) Router.navigateTo("#/");
    else Router.onChange();
  });
})();

