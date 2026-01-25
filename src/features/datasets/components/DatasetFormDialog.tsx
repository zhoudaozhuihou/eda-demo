import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { toast } from 'sonner';
import type { Dataset } from '@/features/datasets/types';

interface DatasetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<Dataset> | null;
  onSave: (data: Partial<Dataset>) => void;
}

const defaultForm: Partial<Dataset> = {
  name: '',
  alias: '',
  domain: 'logistics',
  description: '',
  tags: [],
  fields: 1,
  rowCount: '',
  source: 'maxcompute',
  project: '',
  masked: 0,
};

export function DatasetFormDialog({ open, onOpenChange, initialData, onSave }: DatasetFormDialogProps) {
  const { t, i18n } = useTranslation('datasets');
  const localeForSort = i18n.language.startsWith('en') ? 'en' : 'zh-Hans-CN';

  const buildFormState = (data?: Partial<Dataset> | null) => ({
    ...defaultForm,
    ...(data ?? {}),
    tagsInput: Array.isArray(data?.tags) ? data?.tags.join(', ') : '',
  });

  const [form, setForm] = useState<Partial<Dataset> & { tagsInput?: string }>(() =>
    open ? buildFormState(initialData) : defaultForm,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const domainOptions = useMemo(() => {
    const maybeDomains = t('domains', { returnObjects: true }) as unknown;
    const keys =
      maybeDomains && typeof maybeDomains === 'object' ? Object.keys(maybeDomains as Record<string, unknown>) : [];
    return keys.sort((a, b) =>
      t(`domains.${a}` as never, { defaultValue: a }).localeCompare(
        t(`domains.${b}` as never, { defaultValue: b }),
        localeForSort,
      ),
    );
  }, [localeForSort, t]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setForm(buildFormState(initialData));
      setErrors({});
    }
    onOpenChange(nextOpen);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const name = form.name?.trim() || '';
    const alias = form.alias?.trim() || '';
    const source = form.source?.trim() || '';
    const rowCount = typeof form.rowCount === 'string' ? form.rowCount.trim() : String(form.rowCount || '');
    const fields = Number(form.fields);
    const masked = Number(form.masked);

    if (!name) newErrors.name = t('form.errors.nameRequired');
    if (name && !/^[a-z][a-z0-9_]*$/i.test(name)) newErrors.name = t('form.errors.nameInvalid');
    if (!alias) newErrors.alias = t('form.errors.aliasRequired');
    if (!source) newErrors.source = t('form.errors.sourceRequired');
    if (!Number.isFinite(fields) || fields <= 0) newErrors.fields = t('form.errors.fieldsMin');
    if (!Number.isFinite(masked) || masked < 0) newErrors.masked = t('form.errors.maskedMin');
    if (Number.isFinite(fields) && Number.isFinite(masked) && masked > fields) newErrors.masked = t('form.errors.maskedMax');
    if (!rowCount) newErrors.rowCount = t('form.errors.rowCountRequired');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      toast.error(t('form.errors.fixFirst'));
      return;
    }
    
    const tags = form.tagsInput
      ? form.tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
      : ['uncategorized'];

    onSave({
      ...form,
      tags: tags.length ? tags : ['uncategorized'],
      fields: Number(form.fields),
      masked: Number(form.masked),
      rowCount: String(form.rowCount).trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{initialData ? t('dialogs.edit') : t('dialogs.create')}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm">{t('form.labels.name')}</div>
            <Input
              value={form.name}
              placeholder={t('form.placeholders.name')}
              onChange={(e) => {
                setForm((p) => ({ ...p, name: e.target.value }));
                if (errors.name) setErrors((p) => ({ ...p, name: '' }));
              }}
            />
            {errors.name && <div className="text-xs text-red-600">{errors.name}</div>}
          </div>
          <div className="space-y-2">
            <div className="text-sm">{t('form.labels.alias')}</div>
            <Input
              value={form.alias}
              placeholder={t('form.placeholders.alias')}
              onChange={(e) => {
                setForm((p) => ({ ...p, alias: e.target.value }));
                if (errors.alias) setErrors((p) => ({ ...p, alias: '' }));
              }}
            />
            {errors.alias && <div className="text-xs text-red-600">{errors.alias}</div>}
          </div>
          <div className="space-y-2">
            <div className="text-sm">{t('form.labels.source')}</div>
            <Input
              value={form.source}
              placeholder={t('form.placeholders.source')}
              onChange={(e) => {
                setForm((p) => ({ ...p, source: e.target.value }));
                if (errors.source) setErrors((p) => ({ ...p, source: '' }));
              }}
            />
            {errors.source && <div className="text-xs text-red-600">{errors.source}</div>}
          </div>
          <div className="space-y-2">
            <div className="text-sm">{t('form.labels.domain')}</div>
            <Select value={form.domain} onValueChange={(v) => setForm((p) => ({ ...p, domain: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {domainOptions.map((d) => (
                  <SelectItem key={d} value={d}>
                    {t(`domains.${d}` as never, { defaultValue: d })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="text-sm">{t('form.labels.fields')}</div>
            <Input
              inputMode="numeric"
              value={form.fields}
              onChange={(e) => {
                const next = e.target.value.replace(/[^\d]/g, '');
                setForm((p) => ({ ...p, fields: next ? Number(next) : 0 }));
                if (errors.fields) setErrors((p) => ({ ...p, fields: '' }));
              }}
            />
            {errors.fields && <div className="text-xs text-red-600">{errors.fields}</div>}
          </div>
          <div className="space-y-2">
            <div className="text-sm">{t('form.labels.masked')}</div>
            <Input
              inputMode="numeric"
              value={form.masked}
              onChange={(e) => {
                const next = e.target.value.replace(/[^\d]/g, '');
                setForm((p) => ({ ...p, masked: next ? Number(next) : 0 }));
                if (errors.masked) setErrors((p) => ({ ...p, masked: '' }));
              }}
            />
            {errors.masked && <div className="text-xs text-red-600">{errors.masked}</div>}
          </div>
          <div className="space-y-2">
            <div className="text-sm">{t('form.labels.rowCount')}</div>
            <Input
              value={form.rowCount}
              placeholder={t('form.placeholders.rowCount')}
              onChange={(e) => {
                setForm((p) => ({ ...p, rowCount: e.target.value }));
                if (errors.rowCount) setErrors((p) => ({ ...p, rowCount: '' }));
              }}
            />
            {errors.rowCount && <div className="text-xs text-red-600">{errors.rowCount}</div>}
          </div>
          <div className="space-y-2">
            <div className="text-sm">{t('form.labels.tags')}</div>
            <Input
              value={form.tagsInput}
              onChange={(e) => setForm((p) => ({ ...p, tagsInput: e.target.value }))}
              placeholder={t('form.placeholders.tags')}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <div className="text-sm">{t('form.labels.description')}</div>
            <Input
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder={t('form.placeholders.description')}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('actions.cancel')}
          </Button>
          <Button onClick={handleSave}>{initialData ? t('actions.save') : t('actions.create')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
