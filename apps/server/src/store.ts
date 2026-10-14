import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { GameState } from '@radclub/engine';

export interface PlayerRecord {
  state: GameState;
}

/** Хранилище состояний игроков. Интерфейс позволяет заменить JSON-файл на БД. */
export interface Store {
  get(userId: string): PlayerRecord | undefined;
  set(userId: string, record: PlayerRecord): void;
  delete(userId: string): void;
  all(): Iterable<[string, PlayerRecord]>;
}

export class MemoryStore implements Store {
  protected data = new Map<string, PlayerRecord>();
  get(id: string) {
    return this.data.get(id);
  }
  set(id: string, record: PlayerRecord) {
    this.data.set(id, record);
  }
  delete(id: string) {
    this.data.delete(id);
  }
  all() {
    return this.data.entries();
  }
}

/** Всё в памяти + периодический атомарный сброс в JSON-файл. Хватает на тысячи игроков. */
export class JsonFileStore extends MemoryStore {
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly file: string) {
    super();
    try {
      const raw = JSON.parse(readFileSync(file, 'utf8')) as Record<string, PlayerRecord>;
      this.data = new Map(Object.entries(raw));
    } catch {
      // файла ещё нет — начинаем с пустой базы
    }
  }

  override set(id: string, record: PlayerRecord) {
    super.set(id, record);
    this.schedule();
  }

  override delete(id: string) {
    super.delete(id);
    this.schedule();
  }

  private schedule() {
    this.timer ??= setTimeout(() => this.flush(), 1000);
  }

  flush() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    mkdirSync(dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    writeFileSync(tmp, JSON.stringify(Object.fromEntries(this.data)));
    renameSync(tmp, this.file);
  }
}
