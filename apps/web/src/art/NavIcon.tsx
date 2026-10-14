import type { ReactNode } from 'react';

export type NavIconKey = 'location' | 'map' | 'inventory' | 'character' | 'quests' | 'arena' | 'trader' | 'rest' | 'skull' | 'caps';

const PATHS: Record<NavIconKey, ReactNode> = {
  location: <path d="M12 2 L20 9 V21 H4 V9 Z M9 21 V14 H15 V21" />,
  map: <path d="M3 6 L9 3 L15 6 L21 3 V18 L15 21 L9 18 L3 21 Z M9 3 V18 M15 6 V21" />,
  inventory: <path d="M4 8 H20 V20 H4 Z M8 8 V5 H16 V8 M4 13 H20 M11 13 V15 H13 V13" />,
  character: <path d="M12 3 a4 4 0 1 1 0 8 a4 4 0 1 1 0 -8 Z M4 21 Q4 13 12 13 Q20 13 20 21" />,
  quests: <path d="M6 3 H16 L19 6 V21 H6 Z M9 9 H16 M9 13 H16 M9 17 H13" />,
  arena: <path d="M5 19 L15 9 M15 9 L17 3 L21 7 L15 9 M19 19 L9 9 M9 9 L7 3 L3 7 L9 9 M4 18 l2 2 M18 20 l2 -2" />,
  trader: <path d="M4 8 H20 L18 20 H6 Z M8 8 Q8 3 12 3 Q16 3 16 8 M10 13 Q12 11 14 13 Q12 16 10 13" />,
  rest: <path d="M3 18 V8 M3 13 H21 V18 M3 15 H21 M7 11 a2 2 0 1 1 0 0.1 M11 11 H20 V13" />,
  skull: <path d="M12 3 Q20 3 20 11 Q20 15 17 16 V20 H7 V16 Q4 15 4 11 Q4 3 12 3 Z M9 10 a1.5 1.5 0 1 0 0.1 0 M15 10 a1.5 1.5 0 1 0 0.1 0 M10 20 V17 M14 20 V17" />,
  caps: <path d="M12 3 L14 5 L17 4 L18 7 L21 8 L20 11 L22 13 L20 15 L21 18 L18 19 L17 22 L14 21 L12 23 L10 21 L7 22 L6 19 L3 18 L4 15 L2 13 L4 11 L3 8 L6 7 L7 4 L10 5 Z M12 8 a4 4 0 1 1 0 8 a4 4 0 1 1 0 -8" />,
};

export function NavIcon({ icon, className }: { icon: NavIconKey; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" aria-hidden>
      {PATHS[icon]}
    </svg>
  );
}
