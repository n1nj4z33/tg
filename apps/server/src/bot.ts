export {};
/**
 * Минимальный бот: на /start присылает кнопку запуска мини-приложения и
 * ставит кнопку меню. Работает через long polling, без зависимостей.
 * Нужны переменные BOT_TOKEN и WEBAPP_URL (https-адрес, где открыт фронтенд).
 */
const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL;
if (!token || !webAppUrl) {
  console.error('Задай BOT_TOKEN и WEBAPP_URL');
  process.exit(1);
}

const api = async (method: string, body: unknown = {}) => {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { ok: boolean; result: unknown; description?: string };
  if (!data.ok) throw new Error(`${method}: ${data.description}`);
  return data.result;
};

await api('setChatMenuButton', { menu_button: { type: 'web_app', text: 'Играть', web_app: { url: webAppUrl } } });
console.log('Бот запущен');

let offset = 0;
for (;;) {
  try {
    const updates = (await api('getUpdates', { offset, timeout: 30 })) as Array<{ update_id: number; message?: { chat: { id: number }; text?: string } }>;
    for (const u of updates) {
      offset = u.update_id + 1;
      if (u.message?.text?.startsWith('/start')) {
        await api('sendMessage', {
          chat_id: u.message.chat.id,
          text: '☢ РАДКЛУБ — бойцовский клуб на руинах мира.\n\nЦелься в голову, отстреливай конечности, зачищай Зону 51 и Кольскую сверхглубокую. Жми кнопку ниже.',
          reply_markup: { inline_keyboard: [[{ text: '▶ Играть', web_app: { url: webAppUrl } }]] },
        });
      }
    }
  } catch (e) {
    console.error(e);
    await new Promise((r) => setTimeout(r, 3000));
  }
}
