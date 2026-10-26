const { nativeImage } = require('electron');
const { icoPath, pngPath } = require('./config');

let appIconCache = null;
let trayIconCache = null;

/*
 * Ícone da janela / barra de tarefas / notificações.
 * No Windows usa o .ico (com todos os tamanhos); se por algum motivo
 * ele falhar ao carregar, cai para o .png.
 */
function getAppIcon() {
  if (appIconCache && !appIconCache.isEmpty()) {
    return appIconCache;
  }

  let image = nativeImage.createFromPath(
    process.platform === 'win32' ? icoPath : pngPath
  );

  if (image.isEmpty()) {
    image = nativeImage.createFromPath(pngPath);
  }

  if (image.isEmpty()) {
    console.error('[icons] Não foi possível carregar o ícone:', icoPath, pngPath);
  }

  appIconCache = image;
  return image;
}

/*
 * Ícone da bandeja (system tray).
 *
 * IMPORTANTE: no Windows o .ico NÃO deve ser redimensionado com
 * resize() — o Windows escolhe sozinho o tamanho certo (16/24/32px
 * conforme o DPI). Redimensionar o ico costuma resultar em ícone vazio.
 * Só o .png (fallback / Linux / Mac) é redimensionado.
 */
function getTrayIcon() {
  if (trayIconCache && !trayIconCache.isEmpty()) {
    return trayIconCache;
  }

  let image = nativeImage.createEmpty();

  if (process.platform === 'win32') {
    image = nativeImage.createFromPath(icoPath);
  }

  if (image.isEmpty()) {
    image = nativeImage
      .createFromPath(pngPath)
      .resize({ width: 32, height: 32, quality: 'best' });
  }

  if (image.isEmpty()) {
    console.error('[icons] Não foi possível carregar o ícone do tray.');
  }

  trayIconCache = image;
  return image;
}

// Versão pequena (16px) para itens de menu
function getMenuIcon() {
  return nativeImage
    .createFromPath(pngPath)
    .resize({ width: 16, height: 16, quality: 'best' });
}

module.exports = {
  getAppIcon,
  getTrayIcon,
  getMenuIcon,
};
