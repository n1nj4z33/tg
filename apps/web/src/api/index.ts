import { LocalApi } from './local.ts';
import { RemoteApi } from './remote.ts';
import type { GameApi } from './types.ts';

export type { GameApi, LeaderRow } from './types.ts';

export function createApi(): GameApi {
  if (import.meta.env.VITE_API_MODE === 'remote') return new RemoteApi(import.meta.env.VITE_API_URL ?? '');
  return new LocalApi();
}
