import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2">系统设置</h1>
        <p className="text-muted-foreground">配置平台全局设置</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">通用设置</TabsTrigger>
          <TabsTrigger value="security">安全配置</TabsTrigger>
          <TabsTrigger value="performance">性能优化</TabsTrigger>
          <TabsTrigger value="notifications">通知设置</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card className="p-6">
            <h3 className="mb-4">平台信息</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>平台名称</Label>
                <Input defaultValue="EDA Platform" />
              </div>
              <div className="space-y-2">
                <Label>管理员邮箱</Label>
                <Input type="email" defaultValue="admin@example.com" />
              </div>
              <div className="space-y-2">
                <Label>时区</Label>
                <Select defaultValue="asia-shanghai">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asia-shanghai">亚洲/上海 (UTC+8)</SelectItem>
                    <SelectItem value="utc">UTC (UTC+0)</SelectItem>
                    <SelectItem value="america-new-york">美国/纽约 (UTC-5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4">功能开关</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>启用 API 文档自动生成</Label>
                  <p className="text-sm text-muted-foreground">自动生成 OpenAPI/Swagger 文档</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label>启用 SQL 智能优化建议</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label>启用 AI 字段别名推荐</Label>
                <Switch />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="p-6">
            <h3 className="mb-4">安全策略</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>默认认证方式</Label>
                <Select defaultValue="api-key">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="api-key">API Key</SelectItem>
                    <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                    <SelectItem value="jwt">JWT Token</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>SQL 安全等级</Label>
                <Select defaultValue="strict">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strict">严格 - 禁止所有危险操作</SelectItem>
                    <SelectItem value="normal">普通 - 警告危险操作</SelectItem>
                    <SelectItem value="loose">宽松 - 仅记录日志</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>启用 IP 白名单</Label>
                  <p className="text-sm text-muted-foreground">限制可访问的 IP 地址</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <Label>强制 HTTPS</Label>
                <Switch defaultChecked />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4">数据脱敏</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>自动检测敏感字段</Label>
                <Switch defaultChecked />
              </div>
              <div className="space-y-2">
                <Label>脱敏规则模板</Label>
                <div className="text-sm text-muted-foreground">
                  <div>• 手机号: 138****5678</div>
                  <div>• 身份证: 110***********2345</div>
                  <div>• 邮箱: a***@example.com</div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card className="p-6">
            <h3 className="mb-4">性能阈值</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>SQL 性能最低分数</Label>
                <Input type="number" defaultValue="60" />
                <p className="text-xs text-muted-foreground">低于此分数的 SQL 将无法发布</p>
              </div>
              <div className="space-y-2">
                <Label>查询超时时间 (秒)</Label>
                <Input type="number" defaultValue="30" />
              </div>
              <div className="space-y-2">
                <Label>默认 QPS 限制</Label>
                <Input type="number" defaultValue="100" />
              </div>
              <div className="space-y-2">
                <Label>最大返回行数</Label>
                <Input type="number" defaultValue="1000" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4">缓存策略</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>启用查询结果缓存</Label>
                <Switch defaultChecked />
              </div>
              <div className="space-y-2">
                <Label>缓存过期时间 (分钟)</Label>
                <Input type="number" defaultValue="10" />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="p-6">
            <h3 className="mb-4">通知渠道</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>邮件通知</Label>
                  <p className="text-sm text-muted-foreground">API 变更、性能预警等通知</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label>企业微信通知</Label>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <Label>钉钉通知</Label>
                <Switch />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4">通知规则</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>API 发布通知</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label>API 变更通知</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label>性能预警通知</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label>安全事件通知</Label>
                <Switch defaultChecked />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button variant="outline">重置</Button>
        <Button>保存设置</Button>
      </div>
    </div>
  );
}
