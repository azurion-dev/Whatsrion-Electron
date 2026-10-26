function setupZoom(mainWindow) {
  let zoomFactor = 1.0;

  mainWindow.webContents.on(
    'before-input-event',
    (event, input) => {
      if (!input.control && !input.meta) {
        return;
      }

      const key = input.key.toLowerCase();

      // Ctrl + +
      if (key === '=' || key === '+') {
        event.preventDefault();

        zoomFactor = Math.min(
          2.0,
          zoomFactor + 0.1
        );

        mainWindow.webContents.setZoomFactor(
          zoomFactor
        );
      }

      // Ctrl + -
      else if (key === '-') {
        event.preventDefault();

        zoomFactor = Math.max(
          0.5,
          zoomFactor - 0.1
        );

        mainWindow.webContents.setZoomFactor(
          zoomFactor
        );
      }

      // Ctrl + 0
      else if (key === '0') {
        event.preventDefault();

        zoomFactor = 1.0;

        mainWindow.webContents.setZoomFactor(
          zoomFactor
        );
      }
    }
  );
}

module.exports = {
  setupZoom,
};