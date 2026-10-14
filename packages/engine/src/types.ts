/** Характеристики персонажа (аналог S.P.E.C.I.A.L.). */
export type StatKey = 'str' | 'per' | 'end' | 'cha' | 'int' | 'agi' | 'luck';
export type Stats = Record<StatKey, number>;

/** Навыки, в которые вкладываются очки при повышении уровня. */
export type SkillKey = 'guns' | 'energy' | 'melee' | 'medicine' | 'barter' | 'survival';
export type Skills = Record<SkillKey, number>;

/** Части тела, по которым можно прицеливаться. */
export type BodyPart =
  | 'head'
  | 'eyes'
  | 'torso'
  | 'groin'
  | 'rightArm'
  | 'leftArm'
  | 'rightLeg'
  | 'leftLeg';

export type ItemId = string;
export type EnemyId = string;
export type LocationId = string;
export type QuestId = string;
export type PerkId = string;

export type IconKey =
  | 'knife'
  | 'pipe'
  | 'hammer'
  | 'fist'
  | 'pistol'
  | 'shotgun'
  | 'rifle'
  | 'sniper'
  | 'laser'
  | 'plasma'
  | 'blaster'
  | 'jacket'
  | 'vest'
  | 'hazmat'
  | 'plate'
  | 'power'
  | 'gasmask'
  | 'helmet'
  | 'syringe'
  | 'pills'
  | 'bottle'
  | 'can'
  | 'water'
  | 'ammo'
  | 'cell'
  | 'scrap'
  | 'chip'
  | 'crystal'
  | 'core'
  | 'vial'
  | 'card'
  | 'tape'
  | 'alien';

export type WeaponSkill = 'guns' | 'energy' | 'melee';

/** Тип смерти — определяет, какую анимацию показать. */
export type DeathKind = 'headExplode' | 'limbOff' | 'torsoBurst' | 'ash' | 'goo' | 'collapse';

export interface WeaponSpec {
  name: string;
  skill: WeaponSkill;
  damage: [number, number];
  apCost: number;
  /** Модификатор меткости, %. */
  accuracy: number;
  /** Множитель урона при критическом попадании. */
  critMult: number;
  /** id патронов; если нет — оружие не тратит боеприпасы. */
  ammo?: ItemId;
  /** Минимальная сила; за каждую недостающую единицу -10% меткости. */
  minStr?: number;
  /** Визуальный эффект выстрела. */
  fx: 'melee' | 'bullet' | 'pellets' | 'laser' | 'plasma' | 'claw' | 'bite';
}

interface ItemBase {
  id: ItemId;
  name: string;
  description: string;
  weight: number;
  value: number;
  icon: IconKey;
}

export interface WeaponItem extends ItemBase {
  type: 'weapon';
  weapon: WeaponSpec;
}

export interface ArmorItem extends ItemBase {
  type: 'armor';
  slot: 'body' | 'head';
  /** Порог урона — вычитается из каждого попадания. */
  dt: number;
  /** Сопротивление урону, %. */
  dr: number;
  /** Защита от радиации, %. */
  radRes: number;
  /** Штраф к очкам действия (тяжёлая броня). */
  apPenalty?: number;
  look: ArmorLook;
}

export interface ArmorLook {
  color: string;
  accent: string;
  style: 'cloth' | 'jacket' | 'hazmat' | 'plate' | 'vest' | 'power' | 'gasmask' | 'helmet' | 'sphere';
}

export interface ConsumableEffect {
  heal?: number;
  /** Отрицательное значение снимает радиацию. */
  rads?: number;
  /** Лечит все повреждённые конечности. */
  healLimbs?: boolean;
}

export interface ConsumableItem extends ItemBase {
  type: 'consumable';
  effect: ConsumableEffect;
  /** Можно ли использовать в бою и сколько ОД стоит. */
  combatApCost: number | null;
}

export interface SimpleItem extends ItemBase {
  type: 'ammo' | 'junk' | 'quest';
}

export type Item = WeaponItem | ArmorItem | ConsumableItem | SimpleItem;

export interface Equipment {
  weapon: ItemId | null;
  body: ItemId | null;
  head: ItemId | null;
}

/** Внешний вид существа — по нему рисуется SVG. */
export interface CreatureLook {
  body: 'humanoid' | 'beast';
  skin: string;
  cloth?: string;
  accent?: string;
  eyes?: string;
  hair?: string;
  head?: 'normal' | 'bald' | 'alien' | 'mutant' | 'robot' | 'skull';
  headgear?: 'none' | 'gasmask' | 'helmet' | 'sphere' | 'power';
  armor?: ArmorLook['style'];
  extras?: Array<'horns' | 'spikes' | 'tail' | 'crystals' | 'antenna' | 'glow' | 'claws' | 'mane'>;
  /** Ширина телосложения, 0.8..1.4. */
  bulk?: number;
  /** Общий масштаб на сцене, 0.6..1.3. */
  scale?: number;
}

export interface LootEntry {
  item: ItemId;
  chance: number;
  min?: number;
  max?: number;
}

export interface EnemyTemplate {
  id: EnemyId;
  name: string;
  description: string;
  level: number;
  stats: Stats;
  /** Навык владения атакой, %. */
  skill: number;
  hp: number;
  weapon: WeaponSpec;
  armor: { dt: number; dr: number };
  look: CreatureLook;
  xp: number;
  caps: [number, number];
  loot: LootEntry[];
  boss?: boolean;
}

export interface Perk {
  id: PerkId;
  name: string;
  description: string;
  /** Доступен как стартовая особенность при создании персонажа. */
  starter?: boolean;
  minLevel: number;
}

export interface Player {
  name: string;
  level: number;
  xp: number;
  stats: Stats;
  /** Вложенные очки навыков (к базовым значениям от характеристик). */
  skills: Skills;
  unspentSkillPoints: number;
  unspentStatPoints: number;
  unspentPerks: number;
  perks: PerkId[];
  hp: number;
  rads: number;
  caps: number;
  inventory: Record<ItemId, number>;
  equipment: Equipment;
  look: { skin: string; hair: string };
}

export interface PartState {
  damage: Partial<Record<BodyPart, number>>;
  crippled: BodyPart[];
  /** Пропускает следующий ход (попадание в пах). */
  stunned?: boolean;
}

/** Боец в бою — собирается и из шаблона врага, и из игрока/снимка соперника по арене. */
export interface Combatant {
  id: string;
  name: string;
  level: number;
  stats: Stats;
  /** Навык для текущего оружия, %. */
  skill: number;
  hp: number;
  maxHp: number;
  maxAp: number;
  weapon: WeaponSpec;
  armor: { body: { dt: number; dr: number }; head: { dt: number; dr: number } };
  critChance: number;
  /** Бонус к криту при стрельбе в голову/глаза. */
  aimedCritBonus: number;
  /** Добавка к множителю критического урона. */
  critDamageBonus: number;
  meleeBonus: number;
  bloodyMess: boolean;
  parts: PartState;
  look: CreatureLook;
}

export type TurnAction = { kind: 'attack'; part: BodyPart } | { kind: 'item'; item: ItemId };

export type Side = 'player' | 'enemy';

export type CombatEvent =
  | {
      kind: 'attack';
      actor: Side;
      part: BodyPart;
      hit: boolean;
      crit: boolean;
      damage: number;
      hpAfter: number;
      crippled: boolean;
      fx: WeaponSpec['fx'];
      death?: DeathKind;
    }
  | { kind: 'item'; actor: Side; item: ItemId; heal: number; hpAfter: number }
  | { kind: 'noAmmo'; actor: Side }
  | { kind: 'flee'; actor: Side; success: boolean }
  | { kind: 'stunned'; actor: Side };

export type CombatKind = 'pve' | 'boss' | 'arena' | 'travel';

export interface CombatResult {
  outcome: 'win' | 'lose' | 'fled';
  xp: number;
  caps: number;
  loot: Record<ItemId, number>;
  levelUp: boolean;
  /** Изменение рейтинга арены. */
  rating?: number;
  deathKind?: DeathKind;
}

export interface CombatState {
  kind: CombatKind;
  round: number;
  enemyTemplate: EnemyId | null;
  /** Для арены — id соперника. */
  opponentId?: string;
  opponentRating?: number;
  enemy: Combatant;
  playerParts: PartState;
  /** События последнего раунда — клиент проигрывает их анимацией. */
  lastRound: CombatEvent[];
  log: string[];
  result: CombatResult | null;
}

export type ExpeditionEventKind = 'enter' | 'fight' | 'cache' | 'trap' | 'quiet' | 'boss' | 'cleared';

export interface Expedition {
  zone: LocationId;
  depth: number;
  bossDefeated: boolean;
  lastEvent: { kind: ExpeditionEventKind; text: string };
}

export type QuestStatus = 'active' | 'done' | 'rewarded';

export interface QuestProgress {
  status: QuestStatus;
  count: number;
}

export interface GameState {
  version: 1;
  player: Player | null;
  /** Текущее поселение. */
  location: LocationId;
  expedition: Expedition | null;
  combat: CombatState | null;
  quests: Record<QuestId, QuestProgress>;
  kills: Record<EnemyId, number>;
  arena: { rating: number; wins: number; losses: number };
  journal: string[];
  updatedAt: number;
}

/** Снимок бойца для арены — данные другого игрока или сгенерированного гладиатора. */
export interface ArenaSnapshot {
  id: string;
  name: string;
  level: number;
  rating: number;
  stats: Stats;
  skills: Skills;
  perks: PerkId[];
  equipment: Equipment;
  look: Player['look'];
  bot: boolean;
}

export interface Toast {
  text: string;
  tone: 'info' | 'good' | 'bad' | 'loot' | 'level';
}

export interface ActionResult {
  state: GameState;
  toasts: Toast[];
}

export type Rng = () => number;

export interface EngineContext {
  rng: Rng;
  now: number;
}
