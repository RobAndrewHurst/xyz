function resetDom() {
  document.body.innerHTML = '<div id="Map"></div>';
  document.head.dataset.dir = '';
}

globalThis.ol ??= {
  extent: {
    containsCoordinate: () => true,
  },
  proj: {
    transform: (coords) => coords,
  },
  util: {
    VERSION: '10.8.0',
  },
};

resetDom();

window.history.replaceState({}, document.title, '/?language=TEST');

await import('../../lib/mapp.mjs');
await import('../../lib/ui.mjs');

globalThis.__resetBrowserTestState = () => {
  resetDom();

  delete mapp.user;
  mapp.hooks.current = {
    language: 'TEST',
    layers: [],
    locations: [],
  };
  mapp.language = 'TEST';

  mapp.dictionary.ok;
};

globalThis.__resetBrowserTestState();
