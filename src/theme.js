const { nativeTheme } = require('electron');

function setupTheme(mainWindow) {
  let lastTheme = null;

  async function updateTheme() {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return;
    }

    try {
      const isDarkWhatsApp =
        await mainWindow.webContents.executeJavaScript(`
          document.body.classList.contains('dark') ||
          document.documentElement.classList.contains('dark') ||
          document.querySelector(
            'body.dark, html.dark, .dark'
          ) !== null
        `);

      const isDark =
        isDarkWhatsApp || nativeTheme.shouldUseDarkColors;

      const theme = isDark ? 'dark' : 'light';

      // Evita ficar chamando setBackgroundColor
      // sem necessidade a cada segundo.
      if (theme === lastTheme) {
        return;
      }

      lastTheme = theme;

      mainWindow.setBackgroundColor(
        isDark ? '#111B21' : '#FFFFFF'
      );
    } catch {
      // WhatsApp ainda pode estar carregando.
    }
  }

  updateTheme();

  const interval = setInterval(updateTheme, 1000);

  nativeTheme.on('updated', updateTheme);

  mainWindow.once('closed', () => {
    clearInterval(interval);
    nativeTheme.removeListener('updated', updateTheme);
  });
}

module.exports = {
  setupTheme,
};