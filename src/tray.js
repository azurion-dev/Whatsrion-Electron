const { Tray, Menu } = require('electron');

const { APP_NAME } = require('./config');
const { getTrayIcon, getMenuIcon } = require('./icons');

// Precisa ficar em variável global, senão o garbage collector
// remove o ícone da bandeja depois de alguns minutos.
let tray = null;

function showWindow(getWindow) {
  const window = getWindow();

  if (!window) return;

  if (window.isMinimized()) {
    window.restore();
  }

  window.show();
  window.focus();
}

function createTray(getWindow, quitApp, extraItems = []) {
  if (tray && !tray.isDestroyed()) {
    return tray;
  }

  tray = new Tray(getTrayIcon());

  const contextMenu = Menu.buildFromTemplate([
    {
      label: APP_NAME,
      icon: getMenuIcon(),
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Mostrar WhatsApp',
      click: () => showWindow(getWindow),
    },
    ...extraItems,
    { type: 'separator' },
    {
      label: 'Sair',
      click: () => quitApp(),
    },
  ]);

  tray.setToolTip(APP_NAME);
  tray.setContextMenu(contextMenu);

  tray.on('click', () => showWindow(getWindow));

  return tray;
}

module.exports = {
  createTray,
};
