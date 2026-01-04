import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import { Search, Package, Loader2 } from 'lucide-react';

interface MaxComputeManagerProps {
  isOpen: boolean;
  onClose: () => void;
  dataSourceId: string;
}

interface TableItem {
  id: string;
  name: string;
  type: 'Table' | 'View';
  owner: string;
  lastModified: string;
}

export function MaxComputeManager({ isOpen, onClose, dataSourceId }: MaxComputeManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [showApplyForm, setShowApplyForm] = useState(false);

  // Mock data
  const tables: TableItem[] = [
    { id: '1', name: 'ods_user_info', type: 'Table', owner: 'zhangsan', lastModified: '2024-12-30' },
    { id: '2', name: 'ods_order_detail', type: 'Table', owner: 'lisi', lastModified: '2024-12-29' },
    { id: '3', name: 'dwd_sales_daily', type: 'Table', owner: 'wangwu', lastModified: '2024-12-28' },
    { id: '4', name: 'ads_user_retention', type: 'View', owner: 'zhangsan', lastModified: '2024-12-27' },
    { id: '5', name: 'dim_product_sku', type: 'Table', owner: 'zhaoliu', lastModified: '2024-12-26' },
  ];

  const filteredTables = tables.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTables(filteredTables.map(t => t.id));
    } else {
      setSelectedTables([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedTables([...selectedTables, id]);
    } else {
      setSelectedTables(selectedTables.filter(tid => tid !== id));
    }
  };

  const handleOpenApplyForm = () => {
    if (selectedTables.length === 0) {
      alert('请至少选择一张表或视图');
      return;
    }
    setShowApplyForm(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>MaxCompute 资源管理 - {dataSourceId}</DialogTitle>
          </DialogHeader>
          
          <div className="flex items-center justify-between py-4">
            <div className="relative w-72">
              <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="搜索表或视图..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                已选择 {selectedTables.length} 项
              </span>
              <Button onClick={handleOpenApplyForm} disabled={selectedTables.length === 0}>
                <Package className="size-4 mr-2" />
                批量提交 Auto Package
              </Button>
            </div>
          </div>

          <div className="border rounded-md flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedTables.length === filteredTables.length && filteredTables.length > 0}
                      onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                    />
                  </TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>负责人</TableHead>
                  <TableHead>最后修改</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTables.map((table) => (
                  <TableRow key={table.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedTables.includes(table.id)}
                        onCheckedChange={(checked) => handleSelectOne(table.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{table.name}</TableCell>
                    <TableCell>
                      <Badge variant={table.type === 'Table' ? 'default' : 'secondary'}>
                        {table.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{table.owner}</TableCell>
                    <TableCell>{table.lastModified}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <AutoPackageForm
        isOpen={showApplyForm}
        onClose={() => setShowApplyForm(false)}
        selectedCount={selectedTables.length}
        onSubmit={() => {
          setShowApplyForm(false);
          onClose();
        }}
      />
    </>
  );
}

interface AutoPackageFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onSubmit: () => void;
}

function AutoPackageForm({ isOpen, onClose, selectedCount, onSubmit }: AutoPackageFormProps) {
  const [formData, setFormData] = useState({
    targetProject: '',
    applicant: '当前用户', // Should come from context
    reason: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.targetProject) {
      alert('请选择目标 Project');
      return;
    }
    
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    
    alert('申请提交成功！等待审批中...');
    onSubmit();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>提交 Auto Package 申请</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>申请包含资源数</Label>
            <div className="text-sm font-medium">{selectedCount} 个表/视图</div>
          </div>

          <div className="space-y-2">
            <Label>申请人</Label>
            <Input value={formData.applicant} disabled />
          </div>

          <div className="space-y-2">
            <Label>Target Project (目标项目)</Label>
            <Select
              value={formData.targetProject}
              onValueChange={(val) => setFormData({ ...formData, targetProject: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择目标项目" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="proj_marketing">Marketing Project</SelectItem>
                <SelectItem value="proj_finance">Finance Project</SelectItem>
                <SelectItem value="proj_risk">Risk Control Project</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>申请理由</Label>
            <Input
              placeholder="请输入申请理由..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
            提交申请
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
