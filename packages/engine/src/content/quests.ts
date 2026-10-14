import type { EnemyId, ItemId, LocationId, QuestId } from '../types.ts';

export type QuestGoal =
  | { kind: 'kill'; enemy: EnemyId; count: number }
  | { kind: 'fetch'; item: ItemId; count: number };

export interface Quest {
  id: QuestId;
  settlement: LocationId;
  title: string;
  giver: string;
  text: string;
  goal: QuestGoal;
  reward: { xp: number; caps: number; items?: Record<ItemId, number> };
  minLevel: number;
  /** Квест, который нужно сдать до этого. */
  requires?: QuestId;
}

const QUEST_LIST: Quest[] = [
  // Академгородок
  {
    id: 'rats', settlement: 'academ', title: 'Крысиный король', giver: 'Завхоз Семёныч',
    text: 'Крысы прогрызли кабель к реактору ИЯФ. Ещё неделя — и мы без света. Перебей десяток в коллекторах.',
    goal: { kind: 'kill', enemy: 'radrat', count: 10 }, reward: { xp: 120, caps: 60, items: { stim: 2 } }, minLevel: 1,
  },
  {
    id: 'sewer_brute', settlement: 'academ', title: 'Что-то большое в трубах', giver: 'Сантехник Палыч',
    text: 'В самом конце коллектора поселилась зелёная туша. Палыч видел её и с тех пор не пьёт. Совсем. Убери её.',
    goal: { kind: 'kill', enemy: 'brute', count: 1 }, reward: { xp: 250, caps: 150, items: { leather: 1 } }, minLevel: 2, requires: 'rats',
  },
  {
    id: 'vector_samples', settlement: 'academ', title: 'Вакцина', giver: 'Профессор Лаврентьева',
    text: 'Чтобы сделать вакцину, мне нужны образцы штамма. Их носят в себе заражённые лаборанты «Вектора». Принеси три пробирки.',
    goal: { kind: 'fetch', item: 'vector_sample', count: 3 }, reward: { xp: 300, caps: 200, items: { superstim: 1, antirad: 2 } }, minLevel: 3,
  },
  {
    id: 'vector_zero', settlement: 'academ', title: 'Нулевой пациент', giver: 'Профессор Лаврентьева',
    text: 'Вакцина не поможет, пока источник жив. В виварии «Вектора» сидит «Вектор-0». Уничтожь его.',
    goal: { kind: 'kill', enemy: 'vector0', count: 1 }, reward: { xp: 600, caps: 400, items: { laser: 1 } }, minLevel: 5, requires: 'vector_samples',
  },
  // Заполярный
  {
    id: 'kola_cores', settlement: 'zapolyarny', title: 'Образцы с глубины', giver: 'Геолог Ковалёва',
    text: 'Учёные Академгородка платят за керн из СГ-3. Принеси два образца — поделим по-братски.',
    goal: { kind: 'fetch', item: 'kola_core', count: 2 }, reward: { xp: 400, caps: 500 }, minLevel: 5,
  },
  {
    id: 'kola_dwellers', settlement: 'zapolyarny', title: 'Ночная смена', giver: 'Бригадир Нильсен',
    text: 'Глубинники утащили троих буровиков. Убей шестерых — пусть знают, кто тут хозяин.',
    goal: { kind: 'kill', enemy: 'deepdweller', count: 6 }, reward: { xp: 500, caps: 300, items: { ak74: 1, ammo_545: 30 } }, minLevel: 6,
  },
  {
    id: 'kola_voice', settlement: 'zapolyarny', title: 'Заткнуть ад', giver: 'Бригадир Нильсен',
    text: 'На глубине двенадцати километров что-то кричит. Спустись и заставь его замолчать.',
    goal: { kind: 'kill', enemy: 'voice', count: 1 }, reward: { xp: 1200, caps: 900, items: { superstim: 3 } }, minLevel: 9, requires: 'kola_dwellers',
  },
  // Ванавара
  {
    id: 'crystals', settlement: 'vanavara', title: 'Слёзы Агды', giver: 'Шаман Учур',
    text: 'Кристаллы из эпицентра лечат и проклинают. Принеси четыре — я сделаю оберег.',
    goal: { kind: 'fetch', item: 'tunguska_crystal', count: 4 }, reward: { xp: 450, caps: 350, items: { ozk: 1 } }, minLevel: 4,
  },
  {
    id: 'agdy', settlement: 'vanavara', title: 'Огненный змей', giver: 'Шаман Учур',
    text: 'Агды проснулся. Тайга горит. Убей змея, и эвенки сложат о тебе песню.',
    goal: { kind: 'kill', enemy: 'agdy', count: 1 }, reward: { xp: 1000, caps: 700, items: { superstim: 2 } }, minLevel: 8, requires: 'crystals',
  },
  // Межгорье
  {
    id: 'garrison', settlement: 'mezhgorye', title: 'Дембель неизбежен', giver: 'Прапорщик Кузьмич',
    text: 'Гарнизон Ямантау не знает, что война кончилась. Объясни восьмерым. Доходчиво.',
    goal: { kind: 'kill', enemy: 'garrison', count: 8 }, reward: { xp: 700, caps: 500, items: { vest6b43: 1 } }, minLevel: 7,
  },
  {
    id: 'deadhand', settlement: 'mezhgorye', title: 'Отменить апокалипсис', giver: 'Майор Громов (в отставке)',
    text: '«Периметр» готовит пуск. Уничтожь ядро системы и принеси перфокарту с кодами — нужно убедиться, что всё кончено.',
    goal: { kind: 'fetch', item: 'perimeter_card', count: 1 }, reward: { xp: 1500, caps: 1200, items: { power: 1 } }, minLevel: 11, requires: 'garrison',
  },
  // Янов
  {
    id: 'ghouls_glow', settlement: 'yanov', title: 'Ночник', giver: 'Дед Мазай',
    text: 'Светящиеся гули лезут к лагерю — от них дозиметры с ума сходят. Перебей пятерых.',
    goal: { kind: 'kill', enemy: 'radghoul', count: 5 }, reward: { xp: 550, caps: 350, items: { antirad: 3 } }, minLevel: 6,
  },
  {
    id: 'woodpecker', settlement: 'yanov', title: 'Русский дятел', giver: 'Радист Сыч',
    text: 'Стук «Дуги» сводит с ума. Добудь бобину с записью из операторской — я найду частоту, чтобы её заглушить.',
    goal: { kind: 'fetch', item: 'duga_tape', count: 1 }, reward: { xp: 1300, caps: 900, items: { sphere: 1 } }, minLevel: 10, requires: 'ghouls_glow',
  },
  // Раменки
  {
    id: 'metro_rats', settlement: 'ramenki', title: 'Санобработка', giver: 'Барыга Лёха',
    text: 'Крысоволки сожрали весь склад тушёнки. Убей шестерых, и я забуду про твой долг. Какой долг? Будет.',
    goal: { kind: 'kill', enemy: 'tunnelrat', count: 6 }, reward: { xp: 700, caps: 500 }, minLevel: 9,
  },
  {
    id: 'commandant', settlement: 'ramenki', title: 'Последний приказ', giver: 'Староста Раменок',
    text: 'Пока Комендант Д-6 жив, Метро-2 закрыто. А там — склады на сто лет. Отправь генерала в отставку.',
    goal: { kind: 'kill', enemy: 'commandant', count: 1 }, reward: { xp: 1800, caps: 1500, items: { plasma: 1, microcell: 20 } }, minLevel: 12, requires: 'metro_rats',
  },
  // Рейчел
  {
    id: 'ufo_shards', settlement: 'rachel', title: 'Сувениры', giver: 'Мотельщица Пэт',
    text: 'Туристы — ну, те, кто остался — отдадут что угодно за кусок настоящей тарелки. Принеси три.',
    goal: { kind: 'fetch', item: 'ufo_shard', count: 3 }, reward: { xp: 1200, caps: 1500 }, minLevel: 11,
  },
  {
    id: 's4', settlement: 'rachel', title: 'Правда где-то рядом', giver: 'Уфолог Боб Лазар-младший',
    text: 'Отец говорил: в S-4 держат пилота. Найди его. Убей его. Докажи, что мы не сумасшедшие.',
    goal: { kind: 'kill', enemy: 's4pilot', count: 1 }, reward: { xp: 3000, caps: 3000 }, minLevel: 14, requires: 'ufo_shards',
  },
];

export const QUESTS: Record<QuestId, Quest> = Object.fromEntries(QUEST_LIST.map((q) => [q.id, q]));

export function getQuest(id: QuestId): Quest {
  const q = QUESTS[id];
  if (!q) throw new Error(`Неизвестный квест: ${id}`);
  return q;
}

export const questsOf = (settlement: LocationId): Quest[] => QUEST_LIST.filter((q) => q.settlement === settlement);
