import { useMemo, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './ui/pagination';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Checkbox } from './ui/checkbox';
import { Search, CheckCircle, XCircle, Clock, AlertTriangle, Eye, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface ApprovalRequest {
  id: string;
  apiName: string;
  apiPath: string;
  type: 'publish' | 'update' | 'deprecate' | 'delete';
  requester: string;
  requesterAvatar: string;
  team: string;
  reason: string;
  details: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approver?: string;
  approvedAt?: string;
  approvalComment?: string;
}

export function Approval() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [pages, setPages] = useState({ pending: 1, approved: 1, rejected: 1, all: 1 });
  const [pageSizes, setPageSizes] = useState({ pending: 10, approved: 10, rejected: 10, all: 10 });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [requests, setRequests] = useState<ApprovalRequest[]>([
    {
      id: '1',
      apiName: 'getUserOrders',
      apiPath: '/api/v1/orders/user',
      type: 'publish',
      requester: '张三',
      requesterAvatar: 'John',
      team: '技术团队',
      reason: '新API上线',
      details: '用于查询用户订单列表，支持分页和筛选功能',
      status: 'pending',
      createdAt: '2025-12-30 10:30',
    },
    {
      id: '2',
      apiName: 'getProductInfo',
      apiPath: '/api/v1/products/:id',
      type: 'update',
      requester: '李四',
      requesterAvatar: 'Li',
      team: '产品团队',
      reason: '优化查询性能',
      details: '增加缓存机制，优化SQL查询',
      status: 'pending',
      createdAt: '2025-12-30 09:15',
    },
    {
      id: '3',
      apiName: 'getCustomerProfile',
      apiPath: '/api/v1/customers/profile',
      type: 'deprecate',
      requester: '王五',
      requesterAvatar: 'Wang',
      team: '数据团队',
      reason: '版本迭代',
      details: '新版本API已发布，计划下线旧版本',
      status: 'pending',
      createdAt: '2025-12-29 16:45',
    },
    {
      id: '4',
      apiName: 'updateInventory',
      apiPath: '/api/v1/inventory/update',
      type: 'publish',
      requester: '赵六',
      requesterAvatar: 'Zhao',
      team: '技术团队',
      reason: '库存管理功能',
      details: '支持批量更新库存数据',
      status: 'approved',
      createdAt: '2025-12-29 14:20',
      approver: '管理员',
      approvedAt: '2025-12-29 15:00',
    },
    {
      id: '5',
      apiName: 'deleteUserData',
      apiPath: '/api/v1/users/delete',
      type: 'delete',
      requester: '钱七',
      requesterAvatar: 'Qian',
      team: '产品团队',
      reason: '不再使用',
      details: '该API已被新版本替代，申请删除',
      status: 'rejected',
      createdAt: '2025-12-28 11:00',
      approver: '管理员',
      approvedAt: '2025-12-28 14:00',
    },
  ]);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'publish': return '上线';
      case 'update': return '更新';
      case 'deprecate': return '下线';
      case 'delete': return '删除';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'publish': return 'bg-green-100 text-green-700';
      case 'update': return 'bg-blue-100 text-blue-700';
      case 'deprecate': return 'bg-orange-100 text-orange-700';
      case 'delete': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 gap-1">
          <Clock className="size-3" />
          待审核
        </Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1">
          <CheckCircle className="size-3" />
          已批准
        </Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 gap-1">
          <XCircle className="size-3" />
          已拒绝
        </Badge>;
      default:
        return null;
    }
  };

  const handleApprove = () => {
    if (selectedRequest) {
      setRequests(requests.map(req => 
        req.id === selectedRequest.id 
          ? { ...req, status: 'approved', approver: '管理员', approvedAt: new Date().toLocaleString('zh-CN'), approvalComment }
          : req
      ));
      toast.success('审核已通过');
      setSelectedRequest(null);
      setApprovalComment('');
      setSelectedIds((s) => {
        const next = new Set(s);
        next.delete(selectedRequest.id);
        return next;
      });
    }
  };

  const handleReject = () => {
    if (selectedRequest) {
      setRequests(requests.map(req => 
        req.id === selectedRequest.id 
          ? { ...req, status: 'rejected', approver: '管理员', approvedAt: new Date().toLocaleString('zh-CN'), approvalComment }
          : req
      ));
      toast.error('审核已拒绝');
      setSelectedRequest(null);
      setApprovalComment('');
      setSelectedIds((s) => {
        const next = new Set(s);
        next.delete(selectedRequest.id);
        return next;
      });
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  const filteredRequests = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return requests;
    return requests.filter((r) => {
      return (
        r.apiName.toLowerCase().includes(term) ||
        r.requester.toLowerCase().includes(term) ||
        r.team.toLowerCase().includes(term) ||
        r.apiPath.toLowerCase().includes(term)
      );
    });
  }, [requests, searchTerm]);

  const buildPageModel = (totalPages: number, currentPage: number) => {
    const items: Array<number | 'ellipsis'> = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
      return items;
    }

    items.push(1);
    const left = Math.max(2, currentPage - 1);
    const right = Math.min(totalPages - 1, currentPage + 1);

    if (left > 2) items.push('ellipsis');
    for (let i = left; i <= right; i++) items.push(i);
    if (right < totalPages - 1) items.push('ellipsis');
    items.push(totalPages);
    return items;
  };

  const getTabRequests = (tab: typeof activeTab) => {
    if (tab === 'all') return filteredRequests;
    return filteredRequests.filter((r) => r.status === tab);
  };

  const tabRequests = getTabRequests(activeTab);
  const pageSize = pageSizes[activeTab];
  const totalPages = Math.max(1, Math.ceil(tabRequests.length / pageSize));
  const currentPage = Math.min(pages[activeTab], totalPages);
  const pagedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return tabRequests.slice(start, start + pageSize);
  }, [currentPage, pageSize, tabRequests]);
  const pageModel = useMemo(() => buildPageModel(totalPages, currentPage), [currentPage, totalPages]);

  const openRequest = (req: ApprovalRequest) => {
    setSelectedRequest(req);
    setApprovalComment(req.approvalComment ?? '');
  };

  const canApprove = true;

  const pendingTabIds = useMemo(() => {
    if (activeTab !== 'pending') return [];
    return tabRequests.filter((r) => r.status === 'pending').map((r) => r.id);
  }, [activeTab, tabRequests]);

  const selectedPendingIds = useMemo(() => {
    const ids = pendingTabIds;
    if (ids.length === 0) return [];
    return ids.filter((id) => selectedIds.has(id));
  }, [pendingTabIds, selectedIds]);

  const pendingSelectAllState = useMemo(() => {
    if (activeTab !== 'pending') return false as const;
    if (pendingTabIds.length === 0) return false as const;
    const selectedCount = selectedPendingIds.length;
    if (selectedCount === 0) return false as const;
    if (selectedCount === pendingTabIds.length) return true as const;
    return 'indeterminate' as const;
  }, [activeTab, pendingTabIds.length, selectedPendingIds.length]);

  const toggleSelectAllPending = () => {
    if (activeTab !== 'pending') return;
    if (!canApprove) {
      toast.error('当前账号无审批权限');
      return;
    }
    setSelectedIds((s) => {
      const next = new Set(s);
      const allSelected = pendingTabIds.every((id) => next.has(id));
      if (allSelected) {
        pendingTabIds.forEach((id) => next.delete(id));
      } else {
        pendingTabIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const invertSelectionPending = () => {
    if (activeTab !== 'pending') return;
    if (!canApprove) {
      toast.error('当前账号无审批权限');
      return;
    }
    setSelectedIds((s) => {
      const next = new Set(s);
      pendingTabIds.forEach((id) => {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  };

  const batchUpdate = (nextStatus: 'approved' | 'rejected') => {
    if (activeTab !== 'pending') return;
    if (!canApprove) {
      toast.error('当前账号无审批权限');
      return;
    }
    if (selectedPendingIds.length === 0) {
      toast.message('请先选择要操作的审批项');
      return;
    }
    const now = new Date().toLocaleString('zh-CN');
    setRequests((prev) =>
      prev.map((req) => {
        if (!selectedIds.has(req.id)) return req;
        if (req.status !== 'pending') return req;
        return {
          ...req,
          status: nextStatus,
          approver: '管理员',
          approvedAt: now,
          approvalComment: approvalComment || req.approvalComment,
        };
      }),
    );
    setSelectedIds((prev) => {
      const next = new Set(prev);
      selectedPendingIds.forEach((id) => next.delete(id));
      return next;
    });
    if (nextStatus === 'approved') toast.success(`批量批准成功：${selectedPendingIds.length} 项`);
    else toast.error(`批量拒绝完成：${selectedPendingIds.length} 项`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">审核中心</h1>
          <p className="text-muted-foreground">管理 API 生命周期审批流程</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-muted-foreground">待审核: </span>
            <span className="font-semibold text-yellow-600">{pendingCount}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">已批准: </span>
            <span className="font-semibold text-green-600">{approvedCount}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">已拒绝: </span>
            <span className="font-semibold text-red-600">{rejectedCount}</span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="size-4" />
            待审核 ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle className="size-4" />
            已批准 ({approvedCount})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="size-4" />
            已拒绝 ({rejectedCount})
          </TabsTrigger>
          <TabsTrigger value="all">
            全部 ({requests.length})
          </TabsTrigger>
        </TabsList>

        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="搜索 API 名称或申请人..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPages({ pending: 1, approved: 1, rejected: 1, all: 1 });
              }}
            />
          </div>
        </Card>

        {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {tab === 'pending' && tab === activeTab && (
              <Card className="p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={pendingSelectAllState} onCheckedChange={toggleSelectAllPending} />
                      <span className="text-sm">全选</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={invertSelectionPending} disabled={!canApprove || pendingTabIds.length === 0}>
                      反选
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      已选 {selectedPendingIds.length} / {pendingTabIds.length}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => batchUpdate('rejected')}
                      disabled={!canApprove || selectedPendingIds.length === 0}
                    >
                      <XCircle className="size-4" />
                      批量拒绝
                    </Button>
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => batchUpdate('approved')}
                      disabled={!canApprove || selectedPendingIds.length === 0}
                    >
                      <CheckCircle className="size-4" />
                      批量批准
                    </Button>
                  </div>
                </div>
              </Card>
            )}
            <div className="space-y-4 overflow-y-auto pr-2 max-h-[calc(100vh-360px)]">
              {(tab === activeTab ? pagedRequests : getTabRequests(tab).slice(0, 0)).map((request) => (
                <ApprovalCard
                  key={request.id}
                  request={request}
                  onSelect={openRequest}
                  selectable={activeTab === 'pending' && request.status === 'pending'}
                  selected={selectedIds.has(request.id)}
                  onToggleSelected={() => {
                    if (!canApprove) {
                      toast.error('当前账号无审批权限');
                      return;
                    }
                    setSelectedIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(request.id)) next.delete(request.id);
                      else next.add(request.id);
                      return next;
                    });
                  }}
                />
              ))}
            </div>

            {tab === activeTab && (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    共 {tabRequests.length} 条
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-muted-foreground">每页</div>
                    <Select
                      value={String(pageSizes[activeTab])}
                      onValueChange={(v) => {
                        const next = Number(v);
                        setPageSizes((s) => ({ ...s, [activeTab]: next }));
                        setPages((p) => ({ ...p, [activeTab]: 1 }));
                      }}
                    >
                      <SelectTrigger className="w-[110px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[10, 12, 15, 20].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n} 条
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Pagination className="justify-end">
                  <PaginationContent className="ml-auto">
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPages((p) => ({ ...p, [activeTab]: Math.max(1, currentPage - 1) }));
                        }}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : undefined}
                      />
                    </PaginationItem>
                    {pageModel.map((item, idx) => {
                      if (item === 'ellipsis') {
                        return (
                          <PaginationItem key={`ellipsis-${idx}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }

                      return (
                        <PaginationItem key={item}>
                          <PaginationLink
                            href="#"
                            isActive={item === currentPage}
                            onClick={(e) => {
                              e.preventDefault();
                              setPages((p) => ({ ...p, [activeTab]: item }));
                            }}
                          >
                            {item}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPages((p) => ({ ...p, [activeTab]: Math.min(totalPages, currentPage + 1) }));
                        }}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : undefined}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Approval Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => { setSelectedRequest(null); setApprovalComment(''); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>审核详情</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <h3 className="truncate max-w-[360px]">{selectedRequest.apiName}</h3>
                      </TooltipTrigger>
                      <TooltipContent sideOffset={6}>{selectedRequest.apiName}</TooltipContent>
                    </Tooltip>
                    <Badge className={getTypeColor(selectedRequest.type)}>
                      {getTypeLabel(selectedRequest.type)}
                    </Badge>
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <code className="text-sm bg-muted px-2 py-1 rounded inline-block truncate max-w-[640px]">
                        {selectedRequest.apiPath}
                      </code>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={6}>{selectedRequest.apiPath}</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-medium">审批流程</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedRequest.status === 'pending' ? '进行中' : '已结束'}
                  </div>
                </div>
                <div className="relative pl-6 space-y-4">
                  <div className="absolute left-[11px] top-1 bottom-1 w-px bg-border" />
                  {[
                    {
                      title: '提交申请',
                      user: selectedRequest.requester,
                      time: selectedRequest.createdAt,
                      comment: selectedRequest.reason,
                      status: 'approved' as const,
                    },
                    {
                      title: '平台审核',
                      user: selectedRequest.approver ?? '管理员',
                      time: selectedRequest.approvedAt ?? '—',
                      comment: selectedRequest.approvalComment ?? '—',
                      status: selectedRequest.status,
                    },
                  ].map((step) => {
                    const statusLabel =
                      step.status === 'pending' ? '待处理' : step.status === 'approved' ? '通过' : '拒绝';
                    const statusClass =
                      step.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                        : step.status === 'approved'
                          ? 'bg-green-100 text-green-700 hover:bg-green-100'
                          : 'bg-red-100 text-red-700 hover:bg-red-100';

                    return (
                      <div key={step.title} className="relative">
                        <div className="absolute left-[-1px] top-1 size-6 rounded-full bg-background border flex items-center justify-center">
                          <div className="size-2 rounded-full bg-primary" />
                        </div>
                        <div className="pl-6">
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-medium">{step.title}</div>
                            <Badge className={statusClass}>{statusLabel}</Badge>
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                            <span>审批人: {step.user}</span>
                            <span>时间: {step.time}</span>
                          </div>
                          <div className="mt-2 text-sm">
                            <span className="text-muted-foreground">意见: </span>
                            <span>{step.comment}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">申请人</div>
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedRequest.requesterAvatar}`} />
                      <AvatarFallback>{selectedRequest.requester.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div>{selectedRequest.requester}</div>
                      <div className="text-xs text-muted-foreground">{selectedRequest.team}</div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">申请时间</div>
                  <div>{selectedRequest.createdAt}</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">申请原因</div>
                <div>{selectedRequest.reason}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">详细说明</div>
                <Card className="p-4 bg-muted">
                  <p className="text-sm">{selectedRequest.details}</p>
                </Card>
              </div>

              {selectedRequest.status !== 'pending' && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">审核结果</div>
                  <div className="flex items-center gap-4">
                    <span>审核人: {selectedRequest.approver}</span>
                    <span>审核时间: {selectedRequest.approvedAt}</span>
                  </div>
                </div>
              )}

              {selectedRequest.status === 'pending' && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">审核意见</div>
                  <Textarea
                    placeholder="请输入审核意见（可选）"
                    value={approvalComment}
                    onChange={(e) => setApprovalComment(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}
          {selectedRequest?.status === 'pending' && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                取消
              </Button>
              <Button variant="destructive" onClick={handleReject} className="gap-2">
                <XCircle className="size-4" />
                拒绝
              </Button>
              <Button onClick={handleApprove} className="gap-2">
                <CheckCircle className="size-4" />
                批准
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ApprovalCard({
  request,
  onSelect,
  selectable,
  selected,
  onToggleSelected,
}: {
  request: ApprovalRequest;
  onSelect: (req: ApprovalRequest) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelected?: () => void;
}) {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'publish': return '上线';
      case 'update': return '更新';
      case 'deprecate': return '下线';
      case 'delete': return '删除';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'publish': return 'bg-green-100 text-green-700';
      case 'update': return 'bg-blue-100 text-blue-700';
      case 'deprecate': return 'bg-orange-100 text-orange-700';
      case 'delete': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 gap-1">
          <Clock className="size-3" />
          待审核
        </Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1">
          <CheckCircle className="size-3" />
          已批准
        </Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 gap-1">
          <XCircle className="size-3" />
          已拒绝
        </Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1">
          {selectable && (
            <div className="pt-1">
              <Checkbox
                checked={!!selected}
                onCheckedChange={() => onToggleSelected?.()}
              />
            </div>
          )}
          <Avatar className="size-12">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${request.requesterAvatar}`} />
            <AvatarFallback>{request.requester.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3 className="truncate max-w-[280px] sm:max-w-[360px] md:max-w-[520px]">
                    {request.apiName}
                  </h3>
                </TooltipTrigger>
                <TooltipContent sideOffset={6}>{request.apiName}</TooltipContent>
              </Tooltip>
              <Badge className={getTypeColor(request.type)}>
                {getTypeLabel(request.type)}
              </Badge>
              {getStatusBadge(request.status)}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <code className="text-sm bg-muted px-2 py-1 rounded mb-2 inline-block truncate max-w-[520px]">
                  {request.apiPath}
                </code>
              </TooltipTrigger>
              <TooltipContent sideOffset={6}>{request.apiPath}</TooltipContent>
            </Tooltip>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{request.requester}</span>
              <span>{request.team}</span>
              <span>{request.createdAt}</span>
            </div>
          </div>
        </div>
        <Button onClick={() => onSelect(request)} className="gap-2">
          <Eye className="size-4" />
          查看详情
        </Button>
      </div>

      <div className="pt-4 border-t">
        <div className="text-sm text-muted-foreground mb-1">申请原因</div>
        <p className="text-sm">{request.reason}</p>
      </div>
    </Card>
  );
}
