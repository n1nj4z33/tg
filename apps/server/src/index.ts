import { resolve } from 'node:path';
import { buildApp } from './app.ts';
import { JsonFileStore } from './store.ts';

const root = resolve(import.meta.dirname, '../../..');
const store = new JsonFileStore(process.env.DATA_FILE ?? resolve(root, 'apps/server/data/players.json'));
const botToken = process.env.BOT_TOKEN;
const devAuth = process.env.DEV_AUTH === '1';
if (!botToken && !devAuth) console.warn('BOT_TOKEN не задан — авторизация через Telegram недоступна. Для разработки: DEV_AUTH=1');

const app = buildApp({ store, botToken, devAuth, staticDir: resolve(root, 'apps/web/dist'), logger: true });

const shutdown = async () => {
  await app.close();
  store.flush();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await app.listen({ port: Number(process.env.PORT ?? 8787), host: process.env.HOST ?? '0.0.0.0' });
