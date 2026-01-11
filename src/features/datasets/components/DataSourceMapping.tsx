import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Badge } from '@/app/components/ui/badge';
import { Label } from '@/app/components/ui/label';
import { Link as LinkIcon, Unlink, Wand2 } from 'lucide-react';
import type { Dataset, TableMapping } from '../types';
import { useAppDispatch } from '@/store/hooks';
import { datasetsActions } from '../store';

// Mock Hologres Connections
const MOCK_HOLO_CONNECTIONS = [
  { id: 'holo_1', name: 'Hologres_Production', host: 'hg-postcn-cn-shanghai.hologres.aliyuncs.com' },
  { id: 'holo_2', name: 'Hologres_Dev', host: 'hg-postcn-cn-hangzhou.hologres.aliyuncs.com' },
];

// Mock Hologres Tables
const MOCK_HOLO_TABLES: Record<string, string[]> = {
  holo_1: ['ads_user_orders', 'ads_product_sales', 'ads_inventory_daily', 'dim_user_profile'],
  holo_2: ['dwd_user_orders_dev', 'dwd_product_dev', 'tmp_test_table_01'],
};

interface DataSourceMappingProps {
  dataset: Dataset;
}

function generateId() {
  return Math.random().toString(36).slice(2);
}

export function DataSourceMapping({ dataset }: DataSourceMappingProps) {
  const { t } = useTranslation('datasets');
  const dispatch = useAppDispatch();
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const mappings = dataset.mappings || [];
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentEditingTable, setCurrentEditingTable] = useState<string | null>(null);
  const [selectedTargetTable, setSelectedTargetTable] = useState<string>('');

  const availableHoloTables = useMemo(() => {
    if (!selectedConnection) return [];
    return MOCK_HOLO_TABLES[selectedConnection] || [];
  }, [selectedConnection]);

  const handleOpenConfig = (mcTableName: string) => {
    setCurrentEditingTable(mcTableName);
    // Find existing mapping
    const existing = mappings.find(m => m.maxComputeTableName === mcTableName);
    if (existing) {
      setSelectedConnection(existing.hologresConnectionId);
      setSelectedTargetTable(existing.hologresTableName);
    } else {
      // Auto-match logic
      // Simple similarity: check if holo table contains mc table name parts
      if (selectedConnection) {
        const match = availableHoloTables.find(ht => ht.includes(mcTableName) || mcTableName.includes(ht));
        if (match) {
            setSelectedTargetTable(match);
        } else {
            setSelectedTargetTable('');
        }
      } else {
          setSelectedTargetTable('');
      }
    }
    setIsDialogOpen(true);
  };

  const handleSmartMatch = () => {
    if (!currentEditingTable || !selectedConnection) return;
    const match = availableHoloTables.find(ht => {
        // Simple heuristic: name containment or high similarity
        const htNorm = ht.replace(/_/g, '').toLowerCase();
        const mcNorm = currentEditingTable.replace(/_/g, '').toLowerCase();
        return htNorm.includes(mcNorm) || mcNorm.includes(htNorm);
    });
    
    if (match) {
      setSelectedTargetTable(match);
    }
  };

  const handleSaveMapping = () => {
    if (!currentEditingTable || !selectedConnection || !selectedTargetTable) return;

    const newMapping: TableMapping = {
      id: generateId(),
      maxComputeTableName: currentEditingTable,
      hologresConnectionId: selectedConnection,
      hologresTableName: selectedTargetTable,
      status: 'mapped',
      updatedAt: new Date().toISOString(),
      updatedBy: 'Current User', // Mock user
    };

    // Update local state and dispatch to store
    // In a real app, this would be an API call
    // Here we update the dataset object in the store
    const updatedMappings = [
      ...mappings.filter(m => m.maxComputeTableName !== currentEditingTable),
      newMapping
    ];
    
    dispatch(datasetsActions.datasetUpdated({
      id: dataset.id,
      patch: { mappings: updatedMappings }
    }));

    setIsDialogOpen(false);
  };

  const handleDeleteMapping = (mcTableName: string) => {
    const updatedMappings = mappings.filter(m => m.maxComputeTableName !== mcTableName);
    dispatch(datasetsActions.datasetUpdated({
      id: dataset.id,
      patch: { mappings: updatedMappings }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{t('mapping.title')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('mapping.description', { defaultValue: 'Configure mappings between MaxCompute source tables and Hologres acceleration tables.' })}
          </p>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('mapping.columns.mcTable')}</TableHead>
              <TableHead>{t('mapping.columns.holoTable')}</TableHead>
              <TableHead>{t('mapping.columns.status')}</TableHead>
              <TableHead>{t('mapping.columns.updateTime')}</TableHead>
              <TableHead className="text-right">{t('labels.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* 
               In reality, a Dataset might correspond to one or more tables. 
               For this demo, we assume the dataset itself IS the table (dataset.name).
               But the requirements say "left side display dataset's MaxCompute metadata".
               If a dataset contains multiple tables, we'd iterate them.
               Assuming 1-to-1 for now based on current Dataset type.
            */}
            <TableRow>
              <TableCell className="font-mono">{dataset.name}</TableCell>
              <TableCell className="font-mono">
                {mappings.find(m => m.maxComputeTableName === dataset.name)?.hologresTableName || '-'}
              </TableCell>
              <TableCell>
                {mappings.some(m => m.maxComputeTableName === dataset.name) ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                    <LinkIcon className="size-3 mr-1" />
                    {t('mapping.mapped')}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-muted-foreground">
                    <Unlink className="size-3 mr-1" />
                    {t('mapping.unmapped')}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {mappings.find(m => m.maxComputeTableName === dataset.name)?.updatedAt?.slice(0, 10) || '-'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenConfig(dataset.name)}>
                    {mappings.some(m => m.maxComputeTableName === dataset.name) ? t('mapping.actions.edit') : t('mapping.actions.config')}
                  </Button>
                  {mappings.some(m => m.maxComputeTableName === dataset.name) && (
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteMapping(dataset.name)}>
                        {t('mapping.actions.delete')}
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('mapping.dialog.title')}</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-8 py-4">
            {/* Left: Source */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">{t('mapping.dialog.sourceTable')}</h4>
              <Card className="p-4 bg-muted/50">
                <div className="space-y-2">
                    <div>
                        <Label className="text-xs text-muted-foreground">Project</Label>
                        <div className="font-mono text-sm">{dataset.project || 'default_project'}</div>
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">Table</Label>
                        <div className="font-mono text-sm font-semibold">{currentEditingTable}</div>
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">Comment</Label>
                        <div className="text-sm">{dataset.alias}</div>
                    </div>
                </div>
              </Card>
            </div>

            {/* Right: Target */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">{t('mapping.dialog.targetTable')}</h4>
              
              <div className="space-y-3">
                <div className="space-y-1">
                    <Label>{t('mapping.selectSource')}</Label>
                    <Select value={selectedConnection} onValueChange={setSelectedConnection}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select connection..." />
                        </SelectTrigger>
                        <SelectContent>
                            {MOCK_HOLO_CONNECTIONS.map(conn => (
                                <SelectItem key={conn.id} value={conn.id}>{conn.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {selectedConnection && (
                    <div className="space-y-1">
                        <Label>Hologres Table</Label>
                        <div className="flex gap-2">
                             <Select value={selectedTargetTable} onValueChange={setSelectedTargetTable}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select table..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableHoloTables.map(t => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button size="icon" variant="outline" title={t('mapping.autoMatch')} onClick={handleSmartMatch}>
                                <Wand2 className="size-4" />
                            </Button>
                        </div>
                        {selectedTargetTable && (
                            <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                                <LinkIcon className="size-3" />
                                {t('mapping.dialog.autoMatchTip')}
                            </div>
                        )}
                    </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t('actions.cancel')}</Button>
            <Button onClick={handleSaveMapping} disabled={!selectedTargetTable}>{t('actions.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
