const { app, session } = require('electron');

const {
  USER_AGENT,
  PARTITION,
  APP_NAME,
  APP_ID,
} = require('./config');

const { createWindow, getMainWindow } = require('./window');
const { createTray } = require('./tray');
const { setupSingleInstance } = require('./single-instance');
const { getAppIcon } = require('./icons');
const { showTestNotification } = require('./notifications');

// ========================================
// IDENTIDADE DO APLICATIVO
// ========================================

app.setName(APP_NAME);

// O Windows usa o AppUserModelId para saber a qual app a janela
// (e as notificações) pertencem. Tem que ser chamado antes do "ready".
if (process.platform === 'win32') {
  app.setAppUserModelId(APP_ID);
}

let isQuitting = false;

function quitApp() {
  isQuitting = true;
  app.quit();
}

// ========================================
// SINGLE INSTANCE
// ========================================

if (!setupSingleInstance(getMainWindow)) {
  process.exit(0);
}

// ========================================
// PERMISSÕES (notificações, mídia, etc.)
// ========================================

const ALLOWED_PERMISSIONS = new Set([
  'notifications',
  'media',
  'clipboard-read',
  'clipboard-sanitized-write',
  'fullscreen',
]);

function setupPermissions() {
  const ses = session.fromPartition(PARTITION);

  ses.setUserAgent(USER_AGENT);

  ses.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(ALLOWED_PERMISSIONS.has(permission));
  });

  ses.setPermissionCheckHandler((webContents, permission) => {
    return ALLOWED_PERMISSIONS.has(permission);
  });
}

// ========================================
// APP READY
// ========================================

app.whenReady().then(() => {
  setupPermissions();

  const window = createWindow();

  // Fechar (X) = esconder na bandeja
  window.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      window.hide();
    }
  });

  createTray(getMainWindow, quitApp, [
    {
      label: 'Testar notificação',
      click: () => showTestNotification(getMainWindow),
    },
  ]);

  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(getAppIcon());
  }

  app.on('activate', () => {
    const current = getMainWindow();

    if (!current) {
      const newWindow = createWindow();

      newWindow.on('close', (event) => {
        if (!isQuitting) {
          event.preventDefault();
          newWindow.hide();
        }
      });
    } else {
      current.show();
      current.focus();
    }
  });
});

// O app continua rodando na bandeja
app.on('window-all-closed', () => {});

app.on('before-quit', () => {
  isQuitting = true;
});
