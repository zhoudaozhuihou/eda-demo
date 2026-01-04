import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function ErrorFallback({ error, onReload, onGoHome }: { error: Error | null, onReload: () => void, onGoHome: () => void }) {
  const { t } = useTranslation('common');
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
      <div className="max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-destructive/10">
            <AlertTriangle className="size-12 text-destructive" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{t('error.systemTitle')}</h1>
          <p className="text-muted-foreground">
            {t('error.systemMessage')}
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <div className="p-4 text-left text-xs font-mono bg-muted rounded-lg overflow-auto max-h-48 border">
            {error.toString()}
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={onGoHome} className="gap-2">
            <Home className="size-4" />
            {t('error.backToHome')}
          </Button>
          <Button onClick={onReload} className="gap-2">
            <RefreshCcw className="size-4" />
            {t('error.refresh')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // Here you would typically log to a service like Sentry
    // logErrorToService(error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback 
          error={this.state.error} 
          onReload={this.handleReload} 
          onGoHome={this.handleGoHome} 
        />
      );
    }

    return this.props.children;
  }
}
