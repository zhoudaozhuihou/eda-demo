import { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Badge } from '@/app/components/ui/badge';
import { Plus, Database, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';

interface DataSource {
  id: string;
  name: string;
  type: 'MySQL' | 'PostgreSQL' | 'ClickHouse' | 'Oracle';
  host: string;
  port: number;
  database: string;
  status: 'connected' | 'disconnected';
  lastSync: string;
  tableCount: number;
}

export function DataSources() {
  const [dataSources, setDataSources] = useState<DataSource[]>([
    {
      id: '1',
      name: '生产数据库',
      type: 'MySQL',
      host: '10.0.1.100',
      port: 3306,
      database: 'prod_db',
      status: 'connected',
      lastSync: '2025-12-28 10:30',
      tableCount: 45,
    },
    {
      id: '2',
      name: '数据仓库',
      type: 'ClickHouse',
      host: '10.0.2.50',
      port: 9000,
      database: 'dw_analytics',
      status: 'connected',
      lastSync: '2025-12-28 09:15',
      tableCount: 128,
    },
    {
      id: '3',
      name: '测试环境',
      type: 'PostgreSQL',
      host: '10.0.3.20',
      port: 5432,
      database: 'test_db',
      status: 'disconnected',
      lastSync: '2025-12-27 18:00',
      tableCount: 23,
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'MySQL' as DataSource['type'],
    host: '',
    port: '',
    database: '',
    username: '',
    password: '',
  });

  const handleTestConnection = () => {
    // Simulate connection test
    alert('连接测试成功！');
  };

  const handleCreateDataSource = () => {
    const newDataSource: DataSource = {
      id: Date.now().toString(),
      name: formData.name,
      type: formData.type,
      host: formData.host,
      port: parseInt(formData.port),
      database: formData.database,
      status: 'connected',
      lastSync: new Date().toLocaleString('zh-CN'),
      tableCount: 0,
    };
    setDataSources([...dataSources, newDataSource]);
    setIsDialogOpen(false);
    setFormData({
      name: '',
      type: 'MySQL',
      host: '',
      port: '',
      database: '',
      username: '',
      password: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">数据源管理</h1>
          <p className="text-muted-foreground">配置和管理数据库连接</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              添加数据源
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>添加数据源</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>数据源名称</Label>
                  <Input
                    placeholder="例：生产数据库"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>数据库类型</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as DataSource['type'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MySQL">MySQL</SelectItem>
                      <SelectItem value="PostgreSQL">PostgreSQL</SelectItem>
                      <SelectItem value="ClickHouse">ClickHouse</SelectItem>
                      <SelectItem value="Oracle">Oracle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>主机地址</Label>
                  <Input
                    placeholder="10.0.0.1"
                    value={formData.host}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>端口</Label>
                  <Input
                    placeholder="3306"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>数据库名称</Label>
                <Input
                  placeholder="database_name"
                  value={formData.database}
                  onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>用户名</Label>
                  <Input
                    placeholder="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>密码</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={handleTestConnection}>
                  测试连接
                </Button>
                <Button onClick={handleCreateDataSource} className="flex-1">
                  创建数据源
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dataSources.map((source) => (
          <Card key={source.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-primary/10 rounded flex items-center justify-center">
                  <Database className="size-5 text-primary" />
                </div>
                <div>
                  <h3 className="mb-1">{source.name}</h3>
                  <Badge variant="outline">{source.type}</Badge>
                </div>
              </div>
              {source.status === 'connected' ? (
                <CheckCircle className="size-5 text-green-500" />
              ) : (
                <XCircle className="size-5 text-red-500" />
              )}
            </div>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">主机</span>
                <span className="font-mono">{source.host}:{source.port}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">数据库</span>
                <span className="font-mono">{source.database}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">表数量</span>
                <span>{source.tableCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">最后同步</span>
                <span className="text-xs">{source.lastSync}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Edit className="size-3 mr-1" />
                编辑
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                同步
              </Button>
              <Button variant="ghost" size="sm">
                <Trash2 className="size-3" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
