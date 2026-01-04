import { Button } from '@/app/components/ui/button';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function NotFound() {
  const { t } = useTranslation(['common']);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center animate-in fade-in zoom-in duration-300">
      <div className="p-6 rounded-full bg-muted mb-6">
        <FileQuestion className="size-16 text-muted-foreground" />
      </div>
      
      <h1 className="text-4xl font-bold tracking-tight mb-2">404</h1>
      <h2 className="text-xl font-semibold mb-4">{t('error.notFoundTitle')}</h2>
      
      <p className="text-muted-foreground max-w-sm mb-8">
        {t('error.notFoundMessage')}
      </p>

      <div className="flex gap-4">
        <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
          <ArrowLeft className="size-4" />
          {t('error.back')}
        </Button>
        <Button onClick={() => window.location.href = '/'} className="gap-2">
          <Home className="size-4" />
          {t('error.backToHome')}
        </Button>
      </div>
    </div>
  );
}
