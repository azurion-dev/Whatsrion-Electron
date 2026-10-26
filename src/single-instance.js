const { app } = require('electron');

function setupSingleInstance(getWindow) {
  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    app.quit();
    return false;
  }

  app.on(
    'second-instance',
    () => {
      const window = getWindow();

      if (!window) return;

      if (window.isMinimized()) {
        window.restore();
      }

      window.show();
      window.focus();
    }
  );

  return true;
}

module.exports = {
  setupSingleInstance,
};