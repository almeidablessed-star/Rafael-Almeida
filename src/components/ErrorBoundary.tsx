import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  temErro: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { temErro: false };

  static getDerivedStateFromError(): State {
    return { temErro: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Erro de renderizacao:', error, info.componentStack);
  }

  private recarregar = () => {
    window.location.href = '/';
  };

  render() {
    if (!this.state.temErro) {
      return this.props.children;
    }

    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-neutral-50 p-4">
        <div
          role="alert"
          className="w-full max-w-md bg-white rounded-xl shadow-lg border border-neutral-200 p-6 text-center space-y-4"
        >
          <div className="w-12 h-12 mx-auto rounded-full bg-pink-50 text-pink-500 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h1 className="font-bold text-lg text-neutral-900">Ops, algo deu errado</h1>
            <p className="text-sm text-neutral-600">
              Não conseguimos carregar esta tela. Seus dados estão salvos — tente voltar ao início.
            </p>
          </div>

          <button
            type="button"
            onClick={this.recarregar}
            className="w-full py-2.5 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-bold text-sm transition-colors"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }
}
