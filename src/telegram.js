// Cliente mínimo de la API de bots de Telegram.

const api = (token, metodo, cuerpo) =>
  fetch(`https://api.telegram.org/bot${token}/${metodo}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo ?? {}),
  }).then(r => r.json()).then(j => {
    if (!j.ok) throw new Error(`Telegram ${metodo}: ${j.description}`);
    return j.result;
  });

export function crearBot(token) {
  return {
    enviar: (chatId, texto, botones) => api(token, 'sendMessage', {
      chat_id: chatId,
      text: texto,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...(botones && { reply_markup: { inline_keyboard: botones } }),
    }),
    cambiarBotones: (chatId, messageId, botones) =>
      api(token, 'editMessageReplyMarkup', { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: botones } }),
    responderBoton: (id, texto) => api(token, 'answerCallbackQuery', { callback_query_id: id, text: texto }),
    actualizaciones: offset => api(token, 'getUpdates', { offset, timeout: 50, allowed_updates: ['message', 'callback_query'] }),
    comandos: lista => api(token, 'setMyCommands', { commands: lista }),
  };
}

export const escapar = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
