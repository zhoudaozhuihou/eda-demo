import { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { datasetsActions, fetchDatasets } from '@/features/datasets/store';
import { DatasetDetailContent } from './DatasetDetailContent';
import { DatasetFormDialog } from './components/DatasetFormDialog';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { Dataset } from '@/features/datasets/types';

interface DatasetDetailsPageProps {
  datasetId?: string;
}

export function DatasetDetailsPage({ datasetId }: DatasetDetailsPageProps) {
  const id = datasetId;
  const dispatch = useAppDispatch();
  const { t } = useTranslation('datasets');
  
  const datasets = useAppSelector((state) => state.datasets.items);
  const status = useAppSelector((state) => state.datasets.status);
  
  const dataset = datasets.find((d) => d.id === id);
  
  const [isEditOpen, setIsEditOpen] = useState(false);

  const navigateTo = (view: string) => {
    window.dispatchEvent(
      new CustomEvent('eda:navigate', {
        detail: { view },
      })
    );
  };

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchDatasets());
    }
  }, [status, dispatch]);

  if (status === 'loading' && !dataset) {
    return <div className="p-8 text-center text-muted-foreground">{t('common.loading', { defaultValue: 'Loading...' })}</div>;
  }

  if (!dataset && status !== 'loading') {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-2">{t('errors.notFound', { defaultValue: 'Dataset not found' })}</h2>
        <button onClick={() => navigateTo('datasets')} className="text-primary hover:underline">
          {t('actions.backToList', { defaultValue: 'Back to List' })}
        </button>
      </div>
    );
  }

  if (!dataset) return null;

  const handleEditSave = (patch: Partial<Dataset>) => {
    if (!id) return;
    dispatch(
      datasetsActions.datasetUpdated({
        id,
        patch: {
            ...patch,
            updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
            lastUpdate: new Date().toISOString().slice(0, 10),
        },
      }),
    );
    toast.success(t('toast.updated', { defaultValue: 'Dataset updated' }));
    setIsEditOpen(false);
  };

  return (
    <div className="p-6 h-full overflow-auto bg-background">
      <DatasetDetailContent 
        dataset={dataset} 
        onBack={() => navigateTo('datasets')} 
        canEdit={true}
        canCreateAPI={true}
        onEdit={() => setIsEditOpen(true)}
      />
      
      <DatasetFormDialog
        key={isEditOpen ? `dataset-detail-edit-${dataset.id}` : 'dataset-detail-edit-closed'}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        initialData={dataset}
        onSave={handleEditSave}
      />
    </div>
  );
}
