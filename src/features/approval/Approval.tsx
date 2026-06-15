import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/app/components/ui/pagination';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/ui/tooltip';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Search, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { approvalActions, fetchApprovals } from '@/features/approval/store';
import type { ApprovalRequest } from '@/features/approval/types';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '@/i18n/format';

const getAvatarLabel = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0);
};

const getAvatarColors = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 360;
  }
  const hue = Math.abs(hash) % 360;
  return {
    bg: `hsl(${hue} 70% 85%)`,
    fg: `hsl(${hue} 35% 30%)`,
  };
};

const buildAvatarDataUrl = (value: string) => {
  const label = getAvatarLabel(value).toUpperCase();
  const { bg, fg } = getAvatarColors(value || label);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="${bg}"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-size="28" fill="${fg}">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export function Approval() {
  const { t, i18n } = useTranslation(['approval', 'datasets']);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [pages, setPages] = useState({ pending: 1, approved: 1, rejected: 1, all: 1 });
  const [pageSizes, setPageSizes] = useState({ pending: 10, approved: 10, rejected: 10, all: 10 });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const dispatch = useAppDispatch();
  const approvalsStatus = useAppSelector((s) => s.approval.status);
  const requests = useAppSelector((s) => s.approval.items);

  useEffect(() => {
    if (approvalsStatus !== 'idle') return;
    dispatch(fetchApprovals());
  }, [approvalsStatus, dispatch]);

  const selectedRequest = useMemo(() => {
    if (!selectedRequestId) return null;
    return requests.find((r) => r.id === selectedRequestId) ?? null;
  }, [requests, selectedRequestId]);

  const requestById = useMemo(() => {
    return new Map<string, ApprovalRequest>(requests.map((r) => [r.id, r]));
  }, [requests]);

  const isActiveTab = (v: string): v is typeof activeTab => {
    return v === 'pending' || v === 'approved' || v === 'rejected' || v === 'all';
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'publish': return t('requestTypes.publish');
      case 'update': return t('requestTypes.update');
      case 'deprecate': return t('requestTypes.deprecate');
      case 'delete': return t('requestTypes.delete');
      case 'access_package': return t('requestTypes.access_package');
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'publish': return 'bg-green-100 text-green-700';
      case 'update': return 'bg-blue-100 text-blue-700';
      case 'deprecate': return 'bg-orange-100 text-orange-700';
      case 'delete': return 'bg-red-100 text-red-700';
      case 'access_package': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 gap-1">
          <Clock className="size-3" />
          {t('statuses.pending')}
        </Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1">
          <CheckCircle className="size-3" />
          {t('statuses.approved')}
        </Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 gap-1">
          <XCircle className="size-3" />
          {t('statuses.rejected')}
        </Badge>;
      default:
        return null;
    }
  };

  const handleApprove = () => {
    if (selectedRequest && selectedRequest.status === 'pending') {
      dispatch(
        approvalActions.approvalUpdated({
          id: selectedRequest.id,
          patch: {
            status: 'approved',
            approver: t('actors.admin'),
            approvedAt: formatDateTime(new Date(), undefined, i18n.language),
            approvalComment,
          },
        }),
      );
      toast.success(t('toasts.approved'));
      setSelectedRequestId(null);
      setApprovalComment('');
      setSelectedIds((s) => {
        const next = new Set(s);
        next.delete(selectedRequest.id);
        return next;
      });
    }
  };

  const handleReject = () => {
    if (selectedRequest && selectedRequest.status === 'pending') {
      dispatch(
        approvalActions.approvalUpdated({
          id: selectedRequest.id,
          patch: {
            status: 'rejected',
            approver: t('actors.admin'),
            approvedAt: formatDateTime(new Date(), undefined, i18n.language),
            approvalComment,
          },
        }),
      );
      toast.error(t('toasts.rejected'));
      setSelectedRequestId(null);
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
    setSelectedRequestId(req.id);
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
      toast.error(t('toasts.errors.noPermission'));
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
      toast.error(t('toasts.errors.noPermission'));
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
      toast.error(t('toasts.errors.noPermission'));
      return;
    }
    if (selectedPendingIds.length === 0) {
      toast.message(t('toasts.errors.selectAtLeastOne'));
      return;
    }
    const now = formatDateTime(new Date(), undefined, i18n.language);
    for (const id of selectedPendingIds) {
      const current = requestById.get(id);
      if (!current) continue;
      dispatch(
        approvalActions.approvalUpdated({
          id,
          patch: {
            status: nextStatus,
            approver: t('actors.admin'),
            approvedAt: now,
            approvalComment: approvalComment || current.approvalComment,
          },
        }),
      );
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      selectedPendingIds.forEach((id) => next.delete(id));
      return next;
    });
    if (nextStatus === 'approved') toast.success(t('toasts.batchApproved', { count: selectedPendingIds.length }));
    else toast.error(t('toasts.batchRejected', { count: selectedPendingIds.length }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">{t('page.title')}</h1>
          <p className="text-muted-foreground">{t('page.subtitle')}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-muted-foreground">{t('stats.pending')}: </span>
            <span className="font-semibold text-yellow-600">{pendingCount}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">{t('stats.approved')}: </span>
            <span className="font-semibold text-green-600">{approvedCount}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">{t('stats.rejected')}: </span>
            <span className="font-semibold text-red-600">{rejectedCount}</span>
          </div>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          if (isActiveTab(v)) setActiveTab(v);
        }}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="size-4" />
            {t('tabs.pending', { count: pendingCount })}
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle className="size-4" />
            {t('tabs.approved', { count: approvedCount })}
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="size-4" />
            {t('tabs.rejected', { count: rejectedCount })}
          </TabsTrigger>
          <TabsTrigger value="all">
            {t('tabs.all', { count: requests.length })}
          </TabsTrigger>
        </TabsList>

        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={t('search.placeholder')}
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
                      <span className="text-sm">{t('selection.selectAll')}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={invertSelectionPending} disabled={!canApprove || pendingTabIds.length === 0}>
                      {t('selection.invert')}
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      {t('selection.selected', { selected: selectedPendingIds.length, total: pendingTabIds.length })}
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
                      {t('actions.batchReject')}
                    </Button>
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => batchUpdate('approved')}
                      disabled={!canApprove || selectedPendingIds.length === 0}
                    >
                      <CheckCircle className="size-4" />
                      {t('actions.batchApprove')}
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
                      toast.error(t('toasts.errors.noPermission'));
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
                    {t('pagination.total', { count: tabRequests.length })}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-muted-foreground">{t('pagination.perPage')}</div>
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
                            {t('pagination.perPageCount', { count: n })}
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
      <Dialog
        open={selectedRequestId != null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRequestId(null);
            setApprovalComment('');
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('dialog.title')}</DialogTitle>
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
                  <div className="font-medium">{t('workflow.title')}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedRequest.status === 'pending' ? t('workflow.status.inProgress') : t('workflow.status.completed')}
                  </div>
                </div>
                <div className="relative pl-6 space-y-4">
                  <div className="absolute left-[11px] top-1 bottom-1 w-px bg-border" />
                  {[
                    {
                      title: t('workflow.steps.submitRequest'),
                      user: selectedRequest.requester,
                      time: selectedRequest.createdAt,
                      comment: selectedRequest.reason,
                      status: 'approved' as const,
                    },
                    {
                      title: t('workflow.steps.platformReview'),
                      user: selectedRequest.approver ?? t('actors.admin'),
                      time: selectedRequest.approvedAt ?? t('placeholders.dash'),
                      comment: selectedRequest.approvalComment ?? t('placeholders.dash'),
                      status: selectedRequest.status,
                    },
                  ].map((step) => {
                    const statusLabel =
                      step.status === 'pending'
                        ? t('workflow.stepStatus.pending')
                        : step.status === 'approved'
                          ? t('workflow.stepStatus.approved')
                          : t('workflow.stepStatus.rejected');
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
                            <span>{t('labels.approver')}: {step.user}</span>
                            <span>{t('labels.time')}: {step.time}</span>
                          </div>
                          <div className="mt-2 text-sm">
                            <span className="text-muted-foreground">{t('labels.comment')}: </span>
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
                  <div className="text-sm text-muted-foreground mb-1">{t('detail.requester.label')}</div>
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8">
                      <AvatarImage src={buildAvatarDataUrl(selectedRequest.requester)} />
                      <AvatarFallback>{selectedRequest.requester.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div>{selectedRequest.requester}</div>
                      <div className="text-xs text-muted-foreground">{selectedRequest.team}</div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">{t('detail.requestTime.label')}</div>
                  <div>{selectedRequest.createdAt}</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">{t('detail.reason.label')}</div>
                <div>{selectedRequest.reason}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">{t('detail.details.label')}</div>
                <Card className="p-4 bg-muted">
                  {selectedRequest.type === 'access_package' && selectedRequest.packageInfo ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium mb-1">{t('detail.package.project')}</div>
                          <div>{selectedRequest.packageInfo.project}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium mb-1">{t('detail.package.validity')}</div>
                          <div>{t(`datasets:apply.${selectedRequest.packageInfo.validity}`)}</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-1">{t('detail.package.tables')}</div>
                        <div className="flex flex-wrap gap-2">
                          {selectedRequest.packageInfo.tables.map((table, index) => (
                            <Badge key={`${table}-${index}`} variant="outline" className="bg-background">
                              {table}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm">{selectedRequest.details}</p>
                  )}
                </Card>
              </div>

              {selectedRequest.status !== 'pending' && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">{t('detail.result.label')}</div>
                  <div className="flex items-center gap-4">
                    <span>{t('detail.result.approver')}: {selectedRequest.approver}</span>
                    <span>{t('detail.result.time')}: {selectedRequest.approvedAt}</span>
                  </div>
                </div>
              )}

              {selectedRequest.status === 'pending' && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">{t('detail.comment.label')}</div>
                  <Textarea
                    placeholder={t('detail.comment.placeholder')}
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
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedRequestId(null);
                  setApprovalComment('');
                }}
              >
                {t('actions.cancel')}
              </Button>
              <Button variant="destructive" onClick={handleReject} className="gap-2">
                <XCircle className="size-4" />
                {t('actions.reject')}
              </Button>
              <Button onClick={handleApprove} className="gap-2">
                <CheckCircle className="size-4" />
                {t('actions.approve')}
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
  const { t } = useTranslation('approval');
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'publish': return t('requestTypes.publish');
      case 'update': return t('requestTypes.update');
      case 'deprecate': return t('requestTypes.deprecate');
      case 'delete': return t('requestTypes.delete');
      case 'access_package': return t('requestTypes.access_package');
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'publish': return 'bg-green-100 text-green-700';
      case 'update': return 'bg-blue-100 text-blue-700';
      case 'deprecate': return 'bg-orange-100 text-orange-700';
      case 'delete': return 'bg-red-100 text-red-700';
      case 'access_package': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 gap-1">
          <Clock className="size-3" />
          {t('statuses.pending')}
        </Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1">
          <CheckCircle className="size-3" />
          {t('statuses.approved')}
        </Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 gap-1">
          <XCircle className="size-3" />
          {t('statuses.rejected')}
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
            <AvatarImage src={buildAvatarDataUrl(request.requester)} />
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
          {t('actions.viewDetail')}
        </Button>
      </div>

      <div className="pt-4 border-t">
        <div className="text-sm text-muted-foreground mb-1">{t('detail.reason.label')}</div>
        <p className="text-sm">{request.reason}</p>
      </div>
    </Card>
  );
}
