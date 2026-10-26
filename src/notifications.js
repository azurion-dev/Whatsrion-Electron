const { Notification } = require('electron');

const { APP_NAME } = require('./config');
const { getAppIcon } = require('./icons');

/*
 * As notificações de mensagens do WhatsApp Web são geradas pelo próprio
 * site (API Notification do Chromium) e já aparecem como notificação
 * nativa do Windows usando o ícone do app (por causa do AppUserModelId).
 *
 * Este módulo serve para notificações geradas pelo próprio app
 * (ex.: o teste no menu da bandeja).
 */

let notificationsEnabled = true;

function isNotificationSupported() {
  return Notification.isSupported();
}

function setNotificationsEnabled(enabled) {
  notificationsEnabled = Boolean(enabled);
}

function areNotificationsEnabled() {
  return notificationsEnabled;
}

function showMessageNotification({
  sender = APP_NAME,
  message = 'Nova mensagem',
  avatar = getAppIcon(),
  onClick,
} = {}) {
  if (!notificationsEnabled) return null;

  if (!Notification.isSupported()) {
    console.warn('Este sistema não suporta notificações nativas.');
    return null;
  }

  const notification = new Notification({
    title: sender,
    body: message,
    icon: avatar,
    silent: false,
  });

  notification.on('click', () => {
    if (onClick) onClick();
  });

  notification.on('failed', (event, error) => {
    console.error('Falha ao mostrar notificação:', error);
  });

  notification.show();

  return notification;
}

function showTestNotification(getWindow) {
  return showMessageNotification({
    sender: APP_NAME,
    message: 'Notificação de teste funcionando!',
    onClick: () => {
      const window = getWindow();

      if (!window) return;

      if (window.isMinimized()) window.restore();

      window.show();
      window.focus();
      window.moveTop();
    },
  });
}

module.exports = {
  showMessageNotification,
  showTestNotification,
  isNotificationSupported,
  setNotificationsEnabled,
  areNotificationsEnabled,
};
