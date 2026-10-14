import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './Button.tsx';
import { Crt } from './Crt.tsx';

interface Props {
  /** Смена ключа сбрасывает ошибку (например, при переходе на другой экран). */
  resetKey?: unknown;
  onReset?: () => void;
  children: ReactNode;
}

interface State {
  error: Error | null;
  resetKey: unknown;
}

/** Ловит падение экрана и показывает ошибку вместо пустого чёрного экрана. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return props.resetKey !== state.resetKey ? { error: null, resetKey: props.resetKey } : null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="stack">
        <Crt amber>
          <div>Терминал сбойнул. Пришли этот текст разработчику:</div>
          <pre className="error-box">{`${error.name}: ${error.message}\n${(error.stack ?? '').split('\n').slice(0, 6).join('\n')}\n${navigator.userAgent}`}</pre>
        </Crt>
        <Button
          variant="primary"
          lamp
          block
          onClick={() => {
            this.setState({ error: null });
            this.props.onReset?.();
          }}
        >
          Вернуться
        </Button>
      </div>
    );
  }
}
