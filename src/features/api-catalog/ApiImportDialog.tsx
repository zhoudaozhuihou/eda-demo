import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Label } from '@/app/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Plus, Trash2, FileJson } from 'lucide-react';
import { toast } from 'sonner';
import { useAppDispatch } from '@/store/hooks';
import { apiCatalogActions } from '@/features/api-catalog/store';
import type { ApiCatalogApi } from '@/features/api-catalog/types';

interface ApiImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ImportTab = 'form' | 'swagger';

interface ParamRow {
  id: string;
  name: string;
  type: string;
  required: boolean;
  description: string;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function ApiImportDialog({ open, onOpenChange }: ApiImportDialogProps) {
  const { t } = useTranslation('apiCatalog');
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<ImportTab>('form');
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    endpoint: '',
    method: 'GET',
    description: '',
  });
  const [params, setParams] = useState<ParamRow[]>([]);

  // Swagger State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);

  const resetForm = () => {
    setFormData({ name: '', endpoint: '', method: 'GET', description: '' });
    setParams([]);
  };

  const handleAddParam = () => {
    setParams([...params, { id: generateId(), name: '', type: 'string', required: true, description: '' }]);
  };

  const handleRemoveParam = (id: string) => {
    setParams(params.filter(p => p.id !== id));
  };

  const updateParam = (id: string, field: keyof ParamRow, value: string | boolean) => {
    setParams(params.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleFormSubmit = () => {
    if (!formData.name || !formData.endpoint) {
      toast.error(t('import.error', { error: 'Name and Endpoint are required' }));
      return;
    }

    const newApi: ApiCatalogApi = {
      id: generateId(),
      name: formData.name,
      path: formData.endpoint,
      method: formData.method as 'GET' | 'POST' | 'PUT' | 'DELETE',
      domain: 'Imported',
      category: 'all',
      description: formData.description,
      version: '1.0.0',
      status: 'active',
      qps: 0,
      avgLatency: 0,
      callsToday: 0,
      authType: 'apiKey',
      createdAt: new Date().toISOString(),
    };

    dispatch(apiCatalogActions.apiAdded(newApi));
    toast.success(t('import.swagger.success', { count: 1 }));
    onOpenChange(false);
    resetForm();
  };

  const handleFile = async (file: File) => {
    if (!file) return;
    setParsing(true);
    
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      
      // Basic validation
      if (!json.openapi && !json.swagger) {
        throw new Error('Invalid OpenAPI/Swagger JSON');
      }

      // Extract first path/method for demo
      const paths = json.paths || {};
      const firstPathKey = Object.keys(paths)[0];
      if (!firstPathKey) throw new Error('No paths found');
      
      const methods = paths[firstPathKey];
      const firstMethodKey = Object.keys(methods)[0];
      const methodInfo = methods[firstMethodKey];

      const importedApi = {
        name: methodInfo.summary || methodInfo.operationId || 'Imported API',
        path: firstPathKey,
        method: firstMethodKey.toUpperCase(),
        description: methodInfo.description || '',
      };

      setFormData({
        name: importedApi.name,
        endpoint: importedApi.path,
        method: ['GET', 'POST', 'PUT', 'DELETE'].includes(importedApi.method) ? importedApi.method : 'GET',
        description: importedApi.description,
      });
      setActiveTab('form'); // Switch to form review
      toast.success(t('import.swagger.success', { count: 1 }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      toast.error(t('import.swagger.error', { error: errorMessage }));
    } finally {
      setParsing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('import.title')}</DialogTitle>
          <DialogDescription>
            {t('page.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ImportTab)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form">{t('import.tabs.form')}</TabsTrigger>
            <TabsTrigger value="swagger">{t('import.tabs.swagger')}</TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('import.form.name')}</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>{t('import.form.method')}</Label>
                <Select value={formData.method} onValueChange={v => setFormData({...formData, method: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['GET', 'POST', 'PUT', 'DELETE'].map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>{t('import.form.endpoint')}</Label>
              <Input value={formData.endpoint} onChange={e => setFormData({...formData, endpoint: e.target.value})} />
            </div>

            <div className="space-y-2">
              <Label>{t('import.form.description')}</Label>
              <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>{t('import.form.params')}</Label>
                <Button variant="outline" size="sm" onClick={handleAddParam}>
                  <Plus className="w-4 h-4 mr-1" /> {t('import.form.addParam')}
                </Button>
              </div>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('import.form.paramName')}</TableHead>
                      <TableHead>{t('import.form.paramType')}</TableHead>
                      <TableHead className="w-[100px]">{t('import.form.paramRequired')}</TableHead>
                      <TableHead>{t('import.form.paramDesc')}</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {params.map(param => (
                      <TableRow key={param.id}>
                        <TableCell>
                          <Input value={param.name} onChange={e => updateParam(param.id, 'name', e.target.value)} className="h-8" />
                        </TableCell>
                        <TableCell>
                          <Select value={param.type} onValueChange={v => updateParam(param.id, 'type', v)}>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {['string', 'number', 'boolean', 'object', 'array'].map(t => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input type="checkbox" checked={param.required} onChange={e => updateParam(param.id, 'required', e.target.checked)} className="h-4 w-4" />
                        </TableCell>
                        <TableCell>
                          <Input value={param.description} onChange={e => updateParam(param.id, 'description', e.target.value)} className="h-8" />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveParam(param.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {params.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                          {t('page.empty.noResults')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="swagger" className="py-4">
            <div 
              className={`border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-center transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
              }}
            >
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <FileJson className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('import.swagger.dropzone')}</h3>
              <p className="text-sm text-muted-foreground mb-4">.json, .yaml</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json,.yaml,.yml"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} 
              />
              <Button onClick={() => fileInputRef.current?.click()} disabled={parsing}>
                {parsing ? t('import.swagger.parsing') : t('import.title')}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('import.actions.cancel')}</Button>
          {activeTab === 'form' && (
            <Button onClick={handleFormSubmit}>{t('import.actions.import')}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
