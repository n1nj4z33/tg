import {
  actionCost,
  currentAp,
  getItem,
  getZone,
  hitChance,
  partLabel,
  playerCombatant,
  type BodyPart,
  type CombatEvent,
  type CombatState,
  type ItemId,
  type Player,
  type TurnAction,
  type WeaponSpec,
} from '@radclub/engine';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Creature, creatureAnchors, FLOOR_Y, VIEW_H, VIEW_W, type CreatureDeath, type CreatureHit } from '../art/Creature.tsx';
import { ItemIcon } from '../art/ItemIcon.tsx';
import { Scene } from '../art/Scene.tsx';
import { capsText } from '../game/format.ts';
import { usePlayerState } from '../state/GameProvider.tsx';
import { haptic } from '../telegram/telegram.ts';
import { Bar, Button, Crt, cx, ItemRow, Modal } from '../ui/index.ts';
import './combat.css';

interface Display {
  enemyHp: number;
  playerHp: number;
  enemyCrippled: BodyPart[];
  playerCrippled: BodyPart[];
  death: CreatureDeath | null;
}

interface Float {
  key: number;
  x: number;
  y: number;
  text: string;
  tone: 'dmg' | 'crit' | 'miss' | 'heal' | 'hurt';
}

interface Tracer {
  key: number;
  part: BodyPart;
  fx: WeaponSpec['fx'];
  hit: boolean;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const LEFT_PARTS: BodyPart[] = ['head', 'eyes', 'rightArm', 'rightLeg'];
const RIGHT_PARTS: BodyPart[] = ['torso', 'groin', 'leftArm', 'leftLeg'];

function deathFromState(combat: CombatState): CreatureDeath | null {
  if (combat.result?.outcome !== 'win') return null;
  const ev = [...combat.lastRound].reverse().find((e) => e.kind === 'attack' && e.death);
  return ev?.kind === 'attack' && ev.death ? { kind: ev.death, part: ev.part } : { kind: 'collapse', part: 'torso' };
}

/** Проигрывание событий раунда: трассеры, брызги, цифры урона, смерть. */
function usePlayback(combat: CombatState, player: Player) {
  const [display, setDisplay] = useState<Display | null>(null);
  const [hit, setHit] = useState<CreatureHit | null>(null);
  const [tracer, setTracer] = useState<Tracer | null>(null);
  const [floats, setFloats] = useState<Float[]>([]);
  const [flash, setFlashState] = useState<{ key: number; kind: 'hurt' | 'heal' | 'crit' | 'claw' } | null>(null);
  const shakeRef = useRef<HTMLDivElement | null>(null);
  const setFlash = (f: { key: number; kind: 'hurt' | 'heal' | 'crit' | 'claw' }) => {
    setFlashState(f);
    if (f.kind !== 'heal') {
      const amp = f.kind === 'crit' ? 9 : 5;
      shakeRef.current?.animate(
        [0, -amp, amp, -amp / 2, amp / 2, 0].map((x, i) => ({ transform: `translate(${x}px, ${i % 2 ? amp / 2 : -amp / 2}px)` })),
        { duration: 320, easing: 'ease-out' },
      );
    }
  };
  const keyRef = useRef(1);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => void (alive.current = false);
  }, []);

  const snapshot = (): Display => ({
    enemyHp: combat.enemy.hp,
    playerHp: player.hp,
    enemyCrippled: [...combat.enemy.parts.crippled],
    playerCrippled: [...combat.playerParts.crippled],
    death: null,
  });

  const addFloat = (f: Omit<Float, 'key'>) => {
    const key = keyRef.current++;
    setFloats((list) => [...list, { ...f, key }]);
    setTimeout(() => alive.current && setFloats((list) => list.filter((x) => x.key !== key)), 1300);
  };

  async function play(events: CombatEvent[], start: Display, anchors: Record<BodyPart, { x: number; y: number }>) {
    let d = start;
    const update = (patch: Partial<Display>) => {
      d = { ...d, ...patch };
      setDisplay(d);
    };
    for (const e of events) {
      if (!alive.current) return;
      const key = keyRef.current++;
      if (e.kind === 'attack' && e.actor === 'player') {
        setTracer({ key, part: e.part, fx: e.fx, hit: e.hit });
        await sleep(160);
        const a = anchors[e.part];
        if (e.hit) {
          setHit({ part: e.part, key, hit: true, crit: e.crit });
          addFloat({ x: a.x, y: a.y, text: e.crit ? `${e.damage}!` : String(e.damage), tone: e.crit ? 'crit' : 'dmg' });
          haptic.impact(e.crit || e.death ? 'heavy' : 'light');
          if (e.crit) setFlash({ key, kind: 'crit' });
          update({
            enemyHp: e.hpAfter,
            enemyCrippled: e.crippled ? [...d.enemyCrippled, e.part] : d.enemyCrippled,
            death: e.death ? { kind: e.death, part: e.part } : null,
          });
        } else {
          addFloat({ x: a.x + 24, y: a.y, text: 'мимо', tone: 'miss' });
        }
        await sleep(e.death ? 1700 : e.crit ? 800 : 560);
      } else if (e.kind === 'attack') {
        if (e.hit) {
          setFlash({ key, kind: e.fx === 'claw' || e.fx === 'bite' || e.fx === 'melee' ? 'claw' : 'hurt' });
          addFloat({ x: 46, y: FLOOR_Y - 10, text: `−${e.damage}`, tone: 'hurt' });
          haptic.impact(e.crit ? 'heavy' : 'medium');
          update({ playerHp: e.hpAfter, playerCrippled: e.crippled ? [...d.playerCrippled, e.part] : d.playerCrippled });
        } else {
          addFloat({ x: 46, y: FLOOR_Y - 10, text: 'уклон', tone: 'miss' });
        }
        await sleep(e.death ? 1200 : 620);
      } else if (e.kind === 'item') {
        setFlash({ key, kind: 'heal' });
        if (e.actor === 'player') {
          const it = getItem(e.item);
          addFloat({ x: 46, y: FLOOR_Y - 10, text: `+${e.heal}`, tone: 'heal' });
          update({ playerHp: e.hpAfter, playerCrippled: it.type === 'consumable' && it.effect.healLimbs ? [] : d.playerCrippled });
        }
        await sleep(520);
      } else if (e.kind === 'noAmmo') {
        if (e.actor === 'player') addFloat({ x: 46, y: FLOOR_Y - 10, text: 'щёлк!', tone: 'miss' });
        await sleep(480);
      } else {
        await sleep(400);
      }
      setTracer(null);
    }
  }

  return { display, setDisplay, hit, tracer, floats, flash, shakeRef, snapshot, play };
}

function TracerFx({ tracer, anchors }: { tracer: Tracer; anchors: Record<BodyPart, { x: number; y: number }> }) {
  const a = anchors[tracer.part];
  const tx = tracer.hit ? a.x : a.x + 40;
  const ty = tracer.hit ? a.y : a.y - 30;
  if (tracer.fx === 'melee') {
    return <path key={tracer.key} className="fx-slash" d={`M${a.x - 40} ${a.y - 30} Q${a.x} ${a.y} ${a.x + 40} ${a.y + 30}`} />;
  }
  if (tracer.fx === 'pellets') {
    return (
      <g key={tracer.key}>
        {[-14, -6, 0, 7, 15].map((dx) => (
          <line key={dx} className="fx-bullet" x1={120} y1={VIEW_H + 120} x2={tx + dx} y2={ty + dx / 2} />
        ))}
      </g>
    );
  }
  return <line key={tracer.key} className={`fx-${tracer.fx === 'laser' || tracer.fx === 'plasma' ? tracer.fx : 'bullet'}`} x1={120} y1={VIEW_H + 120} x2={tx} y2={ty} />;
}

function PartButton({ part, chance, label, crippled, queued, onClick, disabled }: { part: BodyPart; chance: number; label: string; crippled: boolean; queued: number; onClick: () => void; disabled: boolean }) {
  return (
    <button type="button" className={cx('vats-part', queued > 0 && 'vats-part--queued', crippled && 'vats-part--crippled')} onClick={onClick} disabled={disabled} data-part={part}>
      <span className="vats-part__chance">{chance}</span>
      <span className="vats-part__label">
        {label}
        {queued > 0 && <span className="vats-part__count">×{queued}</span>}
      </span>
    </button>
  );
}

function ResultModal({ combat, onContinue, busy }: { combat: CombatState; onContinue: () => void; busy: boolean }) {
  const r = combat.result!;
  const title = r.outcome === 'win' ? 'ПОБЕДА' : r.outcome === 'lose' ? 'ПОРАЖЕНИЕ' : 'ПОБЕГ';
  return (
    <Modal title={title} onClose={() => undefined}>
      <Crt amber={r.outcome !== 'win'}>
        {r.outcome === 'win' && <div>{combat.enemy.name} повержен.</div>}
        {r.outcome === 'lose' && <div>{combat.kind === 'arena' ? 'Тебя вынесли с ринга без сознания.' : 'Ты очнулся в поселении. Кто-то обчистил карманы.'}</div>}
        {r.outcome === 'fled' && <div>Ты унёс ноги.</div>}
        {r.xp > 0 && <div>+{r.xp} опыта</div>}
        {r.caps !== 0 && <div>{r.caps > 0 ? '+' : ''}{capsText(r.caps)}</div>}
        {r.rating !== undefined && <div>Рейтинг ринга: {r.rating > 0 ? '+' : ''}{r.rating}</div>}
        {r.levelUp && <div className="amber">НОВЫЙ УРОВЕНЬ! Загляни в «Боец».</div>}
      </Crt>
      {Object.keys(r.loot).length > 0 && (
        <div className="stack" style={{ marginTop: 10 }}>
          <div className="dim small">Добыча:</div>
          <Crt>
            {Object.entries(r.loot).map(([id, n]) => (
              <ItemRow key={id} item={id} count={n} />
            ))}
          </Crt>
        </div>
      )}
      <Button variant="primary" lamp block style={{ marginTop: 12 }} disabled={busy} onClick={onContinue}>
        Продолжить
      </Button>
    </Modal>
  );
}

export function CombatScreen() {
  const { state, player, run, busy } = usePlayerState();
  const combat = state.combat!;
  const [queue, setQueue] = useState<TurnAction[]>([]);
  const [animating, setAnimating] = useState(false);
  const pb = usePlayback(combat, player);

  const me = playerCombatant(state);
  const enemy = combat.enemy;
  const anchors = creatureAnchors(enemy.look);
  const ap = currentAp(me);
  const spent = queue.reduce((sum, a) => sum + actionCost(me, a), 0);
  const left = ap - spent;
  const canAct = !busy && !animating && !combat.result;

  const view: Display = pb.display ?? {
    enemyHp: enemy.hp,
    playerHp: player.hp,
    enemyCrippled: enemy.parts.crippled,
    playerCrippled: combat.playerParts.crippled,
    death: deathFromState(combat),
  };

  const ammo = me.weapon.ammo ? (player.inventory[me.weapon.ammo] ?? 0) : null;
  const queuedAmmo = queue.filter((a) => a.kind === 'attack').length;
  const items = Object.entries(player.inventory).filter(([id]) => {
    const it = getItem(id);
    return it.type === 'consumable' && it.combatApCost !== null;
  });
  const queuedItems = (id: ItemId) => queue.filter((a) => a.kind === 'item' && a.item === id).length;
  const scene = combat.kind === 'arena' ? 'arena' : state.expedition ? getZone(state.expedition.zone).scene : 'wasteland';

  const addAttack = (part: BodyPart) => {
    if (!canAct || left < me.weapon.apCost) return;
    if (ammo !== null && queuedAmmo >= ammo) return;
    haptic.tap();
    setQueue((q) => [...q, { kind: 'attack', part }]);
  };

  async function execute(action: Parameters<typeof run>[0]) {
    const start = pb.snapshot();
    pb.setDisplay(start);
    setAnimating(true);
    const res = await run(action);
    if (res?.state.combat) await pb.play(res.state.combat.lastRound, start, anchors);
    pb.setDisplay(null);
    setQueue([]);
    setAnimating(false);
  }

  return (
    <div className="combat">
      {pb.flash && <div key={pb.flash.key} className={`combat__flash combat__flash--${pb.flash.kind}`} />}
      <div ref={pb.shakeRef}>
      <Scene scene={scene} className="combat__stage">
        <div className="combat__enemy-hud">
          <div className="row">
            <span className="grow combat__enemy-name">
              {enemy.name} <span className="dim">ур. {enemy.level}</span>
            </span>
            <span className="small dim">раунд {combat.round + 1}</span>
          </div>
          <Bar kind="hp" value={view.enemyHp} max={enemy.maxHp} />
          {view.enemyCrippled.length > 0 && <div className="small red">покалечено: {view.enemyCrippled.map((p) => partLabel(p, enemy.look).toLowerCase()).join(', ')}</div>}
        </div>
        <div className="combat__enemy">
          <Creature look={enemy.look} crippled={view.enemyCrippled} hit={pb.hit} death={view.death} />
          <svg className="combat__fx" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} overflow="visible">
            {pb.tracer && <TracerFx tracer={pb.tracer} anchors={anchors} />}
            {pb.floats.map((f) => (
              <text key={f.key} x={f.x} y={f.y} className={`fx-float fx-float--${f.tone}`}>
                {f.text}
              </text>
            ))}
          </svg>
        </div>
        <div className="combat__player-hud">
          <Bar label={player.name} kind="hp" value={view.playerHp} max={me.maxHp} />
          {view.playerCrippled.length > 0 && <div className="small red">ранено: {view.playerCrippled.map((p) => partLabel(p, me.look).toLowerCase()).join(', ')}</div>}
        </div>
      </Scene>
      </div>

      <div className="combat__panel">
        <Crt className="vats">
          <div className="vats__head">
            <span>П.Р.И.Ц.Е.Л.</span>
            <span className="vats__weapon">
              {me.weapon.name} · {me.weapon.damage[0]}–{me.weapon.damage[1]} · {me.weapon.apCost} ОД
              {ammo !== null && ` · ${ammo - queuedAmmo} пт.`}
            </span>
          </div>
          <div className="vats__grid">
            <div className="vats__col">
              {LEFT_PARTS.map((part) => (
                <PartButton key={part} part={part} chance={hitChance(me, enemy, part)} label={partLabel(part, enemy.look)} crippled={view.enemyCrippled.includes(part)} queued={queue.filter((a) => a.kind === 'attack' && a.part === part).length} onClick={() => addAttack(part)} disabled={!canAct} />
              ))}
            </div>
            <div className="vats__body">
              <Creature look={enemy.look} variant="vats" crop selected={queue.flatMap((a) => (a.kind === 'attack' ? [a.part] : []))} onPart={canAct ? addAttack : undefined} />
            </div>
            <div className="vats__col">
              {RIGHT_PARTS.map((part) => (
                <PartButton key={part} part={part} chance={hitChance(me, enemy, part)} label={partLabel(part, enemy.look)} crippled={view.enemyCrippled.includes(part)} queued={queue.filter((a) => a.kind === 'attack' && a.part === part).length} onClick={() => addAttack(part)} disabled={!canAct} />
              ))}
            </div>
          </div>
          <div className="vats__ap" aria-label={`ОД ${left} из ${ap}`}>
            <span className="small">ОД</span>
            {Array.from({ length: ap }, (_, i) => (
              <span key={i} className={cx('vats__pip', i < left && 'vats__pip--on')} />
            ))}
            <span className="small">{left}/{ap}</span>
          </div>
          {items.length > 0 && (
            <div className="vats__items">
              {items.map(([id, count]) => {
                const it = getItem(id);
                const cost = it.type === 'consumable' ? (it.combatApCost ?? 0) : 0;
                const avail = count - queuedItems(id);
                return (
                  <button key={id} type="button" className="vats__item" disabled={!canAct || avail <= 0 || left < cost} onClick={() => setQueue((q) => [...q, { kind: 'item', item: id }])}>
                    <ItemIcon icon={it.icon} className="vats__item-icon" />
                    <span>
                      {it.name} ×{avail}
                      <span className="dim"> · {cost} ОД</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </Crt>

        <div className="combat__actions">
          <Button variant="primary" lamp disabled={!canAct || queue.length === 0} onClick={() => execute({ type: 'combatTurn', actions: queue })} className="grow">
            {queue.length === 0 ? 'Выбери цель' : `Огонь (${queue.length})`}
          </Button>
          <Button disabled={!canAct || queue.length === 0} onClick={() => setQueue([])}>
            Сброс
          </Button>
          {combat.kind !== 'arena' && combat.kind !== 'boss' && (
            <Button variant="ghost" disabled={!canAct} onClick={() => execute({ type: 'flee' })}>
              Бежать
            </Button>
          )}
        </div>

        <Crt className="combat__log">
          {combat.log.slice(0, animating ? 0 : 6).map((line, i) => (
            <div key={`${combat.round}-${i}`} className="small" style={{ opacity: 1 - i * 0.14 } as CSSProperties}>
              › {line}
            </div>
          ))}
          {animating && <div className="small vats__blink">› ВЫПОЛНЕНИЕ…</div>}
        </Crt>
      </div>

      {combat.result && !animating && <ResultModal combat={combat} busy={busy} onContinue={() => run({ type: 'finishCombat' })} />}
    </div>
  );
}

