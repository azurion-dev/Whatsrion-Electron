const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const APP_NAME = 'Whatsrion for Electron';

// Use o MESMO AppUserModelId no desenvolvimento e no app compilado
// (precisa ser igual ao "appId" do package.json). NÃO coloque ".dev".
const APP_ID = 'com.whatsrion.azurion';

const WHATSAPP_URL = 'https://web.whatsapp.com';

/*
 * Procura o arquivo de ícone em todos os lugares possíveis.
 *
 * Desenvolvimento:  <projeto>/app.ico
 * Compilado:        <instalação>/resources/app.ico   (extraResources)
 *                   ou dentro do app.asar            (fallback)
 */
function resolveAsset(fileName) {
  const candidates = app.isPackaged
    ? [
        path.join(process.resourcesPath, fileName),
        path.join(app.getAppPath(), fileName),
        path.join(__dirname, '..', fileName),
      ]
    : [path.join(__dirname, '..', fileName)];

  return candidates.find((p) => fs.existsSync(p)) || candidates[0];
}

const icoPath = resolveAsset('app.ico');
const pngPath = resolveAsset('app.png');

// Mantido por compatibilidade: caminho do ícone "principal" da plataforma
const iconPath = process.platform === 'win32' ? icoPath : pngPath;

module.exports = {
  USER_AGENT,
  APP_NAME,
  APP_ID,
  WHATSAPP_URL,
  iconPath,
  icoPath,
  pngPath,

  WINDOW: {
    width: 1280,
    height: 850,
    minWidth: 900,
    minHeight: 600,
  },

  PARTITION: 'persist:whatsrion',
};
