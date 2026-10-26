/*
 * Versão em arquivo único (sem a pasta src/).
 * Rodar com:  npm run start:single
 */
const {
  app,
  BrowserWindow,
  session,
  Tray,
  Menu,
  nativeImage,
  nativeTheme,
  shell,
} = require('electron');
const fs = require('fs');
const path = require('path');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const APP_NAME = 'WhatsApp for Electron';
const APP_ID = 'com.azurion.whatsapp';
const PARTITION = 'persist:whatsapp';

app.setName(APP_NAME);

if (process.platform === 'win32') {
  app.setAppUserModelId(APP_ID);
}

// ===== Ícones =====
function resolveAsset(fileName) {
  const candidates = app.isPackaged
    ? [
        path.join(process.resourcesPath, fileName),
        path.join(app.getAppPath(), fileName),
        path.join(__dirname, fileName),
      ]
    : [path.join(__dirname, fileName)];

  return candidates.find((p) => fs.existsSync(p)) || candidates[0];
}

const icoPath = resolveAsset('app.ico');
const pngPath = resolveAsset('app.png');

function getAppIcon() {
  let image = nativeImage.createFromPath(
    process.platform === 'win32' ? icoPath : pngPath
  );
  if (image.isEmpty()) image = nativeImage.createFromPath(pngPath);
  return image;
}

// No Windows o .ico NÃO pode ser redimensionado (fica vazio)
function getTrayIcon() {
  let image = nativeImage.createEmpty();

  if (process.platform === 'win32') {
    image = nativeImage.createFromPath(icoPath);
  }
  if (image.isEmpty()) {
    image = nativeImage
      .createFromPath(pngPath)
      .resize({ width: 32, height: 32, quality: 'best' });
  }
  return image;
}

let mainWindow = null;
let tray = null;
let zoomFactor = 1.0;
let isQuitting = false;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  const showWindow = () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  };

  const createWindow = () => {
    mainWindow = new BrowserWindow({
      width: 1280,
      height: 850,
      minWidth: 900,
      minHeight: 600,
      title: APP_NAME,
      icon: getAppIcon(),
      backgroundColor: '#FFFFFF',
      autoHideMenuBar: true,
      show: false,
      frame: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        partition: PARTITION,
      },
    });

    mainWindow.on('page-title-updated', (event) => event.preventDefault());

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (/^https?:\/\//i.test(url)) shell.openExternal(url);
      return { action: 'deny' };
    });

    mainWindow.webContents.setUserAgent(USER_AGENT);
    mainWindow.loadURL('https://web.whatsapp.com');

    mainWindow.once('ready-to-show', showWindow);

    // Tema claro/escuro
    let lastTheme = null;
    const updateTheme = async () => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      try {
        const isDarkWhatsApp = await mainWindow.webContents.executeJavaScript(`
          document.body.classList.contains('dark') ||
          document.documentElement.classList.contains('dark') ||
          document.querySelector('body.dark, html.dark, .dark') !== null
        `);
        const isDark = isDarkWhatsApp || nativeTheme.shouldUseDarkColors;
        const theme = isDark ? 'dark' : 'light';
        if (theme === lastTheme) return;
        lastTheme = theme;
        mainWindow.setBackgroundColor(isDark ? '#111B21' : '#FFFFFF');
      } catch (e) {}
    };

    const themeInterval = setInterval(updateTheme, 1000);
    nativeTheme.on('updated', updateTheme);

    mainWindow.on('closed', () => {
      clearInterval(themeInterval);
      nativeTheme.removeListener('updated', updateTheme);
      mainWindow = null;
    });

    // X = esconder na bandeja
    mainWindow.on('close', (event) => {
      if (!isQuitting) {
        event.preventDefault();
        mainWindow.hide();
      }
    });

    // Zoom (Ctrl + / Ctrl - / Ctrl 0)
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (!input.control && !input.meta) return;
      const key = input.key.toLowerCase();

      if (key === '=' || key === '+') {
        event.preventDefault();
        zoomFactor = Math.min(2.0, zoomFactor + 0.1);
        mainWindow.webContents.setZoomFactor(zoomFactor);
      } else if (key === '-') {
        event.preventDefault();
        zoomFactor = Math.max(0.5, zoomFactor - 0.1);
        mainWindow.webContents.setZoomFactor(zoomFactor);
      } else if (key === '0') {
        event.preventDefault();
        zoomFactor = 1.0;
        mainWindow.webContents.setZoomFactor(zoomFactor);
      }
    });
  };

  const createTray = () => {
    tray = new Tray(getTrayIcon());

    const contextMenu = Menu.buildFromTemplate([
      { label: 'Mostrar WhatsApp', click: showWindow },
      { type: 'separator' },
      {
        label: 'Sair',
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray.setToolTip(APP_NAME);
    tray.setContextMenu(contextMenu);
    tray.on('click', showWindow);
  };

  app.whenReady().then(() => {
    const ses = session.fromPartition(PARTITION);
    const allowed = new Set([
      'notifications',
      'media',
      'clipboard-read',
      'clipboard-sanitized-write',
      'fullscreen',
    ]);

    ses.setUserAgent(USER_AGENT);
    ses.setPermissionRequestHandler((wc, permission, cb) =>
      cb(allowed.has(permission))
    );
    ses.setPermissionCheckHandler((wc, permission) => allowed.has(permission));

    if (process.platform === 'darwin' && app.dock) {
      app.dock.setIcon(getAppIcon());
    }

    createWindow();
    createTray();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      } else {
        showWindow();
      }
    });
  });

  app.on('window-all-closed', () => {});
  app.on('before-quit', () => {
    isQuitting = true;
  });
}
