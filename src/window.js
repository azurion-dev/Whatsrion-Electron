const { BrowserWindow, shell } = require('electron');

const {
  USER_AGENT,
  APP_NAME,
  WHATSAPP_URL,
  WINDOW,
  PARTITION,
} = require('./config');

const { getAppIcon } = require('./icons');
const { setupZoom } = require('./shortcuts');
const { setupTheme } = require('./theme');

let mainWindow = null;

function createWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
    return mainWindow;
  }

  mainWindow = new BrowserWindow({
    width: WINDOW.width,
    height: WINDOW.height,
    minWidth: WINDOW.minWidth,
    minHeight: WINDOW.minHeight,

    // Sem isso o Windows mostra o ícone padrão do Electron
    icon: getAppIcon(),

    title: APP_NAME,
    backgroundColor: '#FFFFFF',
    autoHideMenuBar: true,
    show: false,

    webPreferences: {
      partition: PARTITION,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: true,
    },
  });

  // Impede o WhatsApp Web de mudar o título da janela
  mainWindow.on('page-title-updated', (event) => {
    event.preventDefault();
  });

  // Links externos abrem no navegador padrão
  // (evita janelas novas do Electron com o ícone padrão)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.setUserAgent(USER_AGENT);

  setupZoom(mainWindow);
  setupTheme(mainWindow);

  mainWindow.loadURL(WHATSAPP_URL);

  mainWindow.once('ready-to-show', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;

    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

function getMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return null;
  }

  return mainWindow;
}

module.exports = {
  createWindow,
  getMainWindow,
};
