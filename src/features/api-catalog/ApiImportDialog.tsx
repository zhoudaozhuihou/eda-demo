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
import { Plus, Trash2, FileJson, CheckCircle2, AlertCircle, Loader2, ArrowRight, RefreshCw, Database, FolderPlus, AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import { Progress } from '@/app/components/ui/progress';
import { toast } from 'sonner';
import { useAppDispatch } from '@/store/hooks';
import { apiCatalogActions } from '@/features/api-catalog/store';
import type { ApiCatalogApi } from '@/features/api-catalog/types';

// Mock Data for Connections (Duplicated for demo)
const MOCK_CONNECTIONS = [
  { id: 'conn_1', name: 'Production DB (MySQL)', type: 'MySQL' },
  { id: 'conn_2', name: 'Analytics DB (ClickHouse)', type: 'ClickHouse' },
  { id: 'conn_3', name: 'MaxCompute Prod', type: 'MaxCompute' },
];

// Mock Data for Tables
const MOCK_TABLES: Record<string, string[]> = {
  conn_1: ['user_orders', 'product_info', 'customer_profile'],
  conn_2: ['ads_sales_daily', 'ads_user_retention'],
  conn_3: ['dwd_transaction_log', 'dim_sku_info'],
};

// Mock Data for Table -> Dataset Mapping
const INITIAL_DATASET_MAPPING: Record<string, { id: string; name: string; alias: string; domain: string }> = {
  'conn_1:user_orders': { id: 'ds_1', name: 'user_orders', alias: 'User Orders Dataset', domain: 'Order' },
  'conn_1:product_info': { id: 'ds_2', name: 'product_info', alias: 'Product Info Dataset', domain: 'Product' },
};

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
  const [importStep, setImportStep] = useState<'idle' | 'parsing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<{name: string; method: string; path: string; description: string} | null>(null);

  // Dataset Linkage State
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [datasetStatus, setDatasetStatus] = useState<'idle' | 'found' | 'not_found'>('idle');
  const [linkedDataset, setLinkedDataset] = useState<{ id: string; name: string; alias: string; domain: string } | null>(null);
  const [datasetMapping, setDatasetMapping] = useState(INITIAL_DATASET_MAPPING);

  const applyImport = () => {
    if (parsedResult) {
      setFormData(prev => ({
        ...prev,
        name: parsedResult.name,
        endpoint: parsedResult.path,
        method: parsedResult.method,
        description: parsedResult.description
      }));
      setActiveTab('form');
      setImportStep('idle');
      toast.success(t('import.swagger.success_review'));
    }
  };

  const handleCreateDataset = () => {
    if (!selectedConnection || !selectedTable) return;
    const key = `${selectedConnection}:${selectedTable}`;
    const newDataset = {
      id: `ds_${Date.now()}`,
      name: selectedTable,
      alias: `${selectedTable} Dataset`,
      domain: 'Custom'
    };
    setDatasetMapping(prev => ({ ...prev, [key]: newDataset }));
    setDatasetStatus('found');
    setLinkedDataset(newDataset);
    toast.success('Dataset created and linked successfully!');
  };

  const handleTableSelect = (table: string) => {
    setSelectedTable(table);
    const key = `${selectedConnection}:${table}`;
    const mapping = datasetMapping[key];
    if (mapping) {
      setDatasetStatus('found');
      setLinkedDataset(mapping);
    } else {
      setDatasetStatus('not_found');
      setLinkedDataset(null);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', endpoint: '', method: 'GET', description: '' });
    setParams([]);
    setImportStep('idle');
    setProgress(0);
    setImportError(null);
    setParsedResult(null);
    setSelectedConnection('');
    setSelectedTable('');
    setDatasetStatus('idle');
    setLinkedDataset(null);
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
      datasets: linkedDataset ? [linkedDataset.name] : [],
    };

    dispatch(apiCatalogActions.apiAdded(newApi));
    toast.success(t('import.swagger.success', { count: 1 }));
    onOpenChange(false);
    resetForm();
  };

  const handleFile = async (file: File) => {
    if (!file) return;
    setImportStep('parsing');
    
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
      setImportError(errorMessage);
      setImportStep('error');
      toast.error(t('import.swagger.error', { error: errorMessage }));
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
            {/* Connection & Dataset Linkage Section */}
            <div className="rounded-lg border p-4 bg-muted/30 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-muted-foreground" />
                <h4 className="font-medium text-sm">Data Source & Dataset</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Database Connection</Label>
                  <Select 
                    value={selectedConnection} 
                    onValueChange={(val) => {
                      setSelectedConnection(val);
                      setSelectedTable('');
                      setDatasetStatus('idle');
                      setLinkedDataset(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Connection" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_CONNECTIONS.map(conn => (
                        <SelectItem key={conn.id} value={conn.id}>
                          {conn.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedConnection && (
                  <div className="space-y-2">
                    <Label>Table / View</Label>
                    <Select value={selectedTable} onValueChange={handleTableSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Table" />
                      </SelectTrigger>
                      <SelectContent>
                        {(MOCK_TABLES[selectedConnection] || []).map(table => (
                          <SelectItem key={table} value={table}>{table}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {selectedTable && (
                <div className="mt-2">
                  {datasetStatus === 'found' && linkedDataset ? (
                    <Alert className="bg-green-50 border-green-200 py-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-800 text-sm font-medium">Dataset Linked</AlertTitle>
                      <AlertDescription className="text-green-700 text-xs">
                        Using <strong>{linkedDataset.alias}</strong> ({linkedDataset.name})
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="bg-amber-50 border-amber-200 py-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="text-amber-800 text-sm font-medium">No Linked Dataset</AlertTitle>
                      <AlertDescription className="text-amber-700 text-xs flex items-center justify-between gap-2">
                        <span>Dataset required for this table.</span>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 bg-white border-amber-300 hover:bg-amber-100 text-amber-900"
                          onClick={handleCreateDataset}
                        >
                          <FolderPlus className="w-3 h-3 mr-1" />
                          Create
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>

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
            {importStep === 'idle' && (
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
                <Button onClick={() => fileInputRef.current?.click()}>
                  {t('import.title')}
                </Button>
              </div>
            )}

            {importStep === 'parsing' && (
              <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <div className="w-full max-w-xs space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t('import.swagger.parsing')}</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </div>
            )}

            {importStep === 'error' && (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {importError}
                  </AlertDescription>
                </Alert>
                <div className="flex justify-center">
                  <Button variant="outline" onClick={() => setImportStep('idle')}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {importStep === 'success' && parsedResult && (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center text-center space-y-2 text-green-600">
                  <CheckCircle2 className="w-12 h-12" />
                  <h3 className="text-lg font-semibold">Import Successful</h3>
                </div>
                
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                    <span className="font-medium text-muted-foreground">Name:</span>
                    <span>{parsedResult.name}</span>
                    <span className="font-medium text-muted-foreground">Method:</span>
                    <span>{parsedResult.method}</span>
                    <span className="font-medium text-muted-foreground">Path:</span>
                    <code className="bg-background px-1 py-0.5 rounded border">{parsedResult.path}</code>
                  </div>
                </div>

                <div className="flex justify-center gap-3">
                  <Button variant="outline" onClick={() => setImportStep('idle')}>
                    Cancel
                  </Button>
                  <Button onClick={applyImport}>
                    Continue to Review
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
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
