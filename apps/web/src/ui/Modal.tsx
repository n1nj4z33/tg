import type { ReactNode } from 'react';
import { Panel } from './Panel.tsx';

/** Нижний лист поверх экрана; закрывается тапом по фону. */
export function Modal({ title, onClose, children }: { title?: ReactNode; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal__sheet" onClick={(e) => e.stopPropagation()}>
        <Panel title={title} rust>
          {children}
        </Panel>
      </div>
    </div>
  );
}
