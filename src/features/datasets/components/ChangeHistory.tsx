import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Button } from '@/app/components/ui/button';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/app/components/ui/pagination';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Calendar } from '@/app/components/ui/calendar';
import { Badge } from '@/app/components/ui/badge';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/app/components/ui/utils';

type HistoryRecord = {
  id: string;
  timestamp: string;
  operator: string;
  action: string;
  details: string;
};

// Mock data generator
const generateHistory = (count: number): HistoryRecord[] => {
  const actions = ['update_schema', 'update_description', 'add_tag', 'remove_tag', 'grant_access'];
  const operators = ['Alice', 'Bob', 'Charlie', 'Dave'];
  
  return Array.from({ length: count }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(i / 5));
    date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
    
    return {
      id: `hist-${i}`,
      timestamp: date.toISOString(),
      operator: operators[Math.floor(Math.random() * operators.length)],
      action: actions[Math.floor(Math.random() * actions.length)],
      details: `Changed field definition for column_${Math.floor(Math.random() * 10)}`,
    };
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const MOCK_HISTORY = generateHistory(100);

export function ChangeHistory() {
  const { t } = useTranslation(['datasets', 'common']);
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  const pageSize = 10;

  const filteredHistory = useMemo(() => {
    let data = MOCK_HISTORY;
    if (dateRange?.from) {
      const from = dateRange.from.getTime();
      const to = dateRange.to ? dateRange.to.getTime() + 86400000 : from + 86400000;
      data = data.filter(h => {
        const time = new Date(h.timestamp).getTime();
        return time >= from && time < to;
      });
    }
    return data;
  }, [dateRange]);

  const totalPages = Math.ceil(filteredHistory.length / pageSize);
  const currentData = filteredHistory.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      <div className="flex-none flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>{t('history.filterDate')}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          {dateRange && (
            <Button variant="ghost" onClick={() => setDateRange(undefined)}>
              {t('actions.clear')}
            </Button>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {t('history.totalRecords', { count: filteredHistory.length })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 border rounded-md relative">
        <table className="w-full caption-bottom text-sm text-left">
          <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
            <TableRow>
              <TableHead className="w-[180px]">{t('history.time')}</TableHead>
              <TableHead className="w-[120px]">{t('history.operator')}</TableHead>
              <TableHead className="w-[140px]">{t('history.action')}</TableHead>
              <TableHead>{t('history.detailsHeader')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.length > 0 ? (
              currentData.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground text-xs w-[180px]">
                    {format(new Date(record.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                  </TableCell>
                  <TableCell className="w-[120px]">{record.operator}</TableCell>
                  <TableCell className="w-[140px]">
                    <Badge variant="outline">{record.action}</Badge>
                  </TableCell>
                  <TableCell className="break-words min-w-[200px]" title={record.details}>
                    {record.details}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  {t('history.noRecords')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex-none">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                if (totalPages > 7 && (p > 2 && p < totalPages - 1 && Math.abs(p - page) > 1)) {
                   if (p === 3 || p === totalPages - 2) return <PaginationItem key={p}><PaginationEllipsis /></PaginationItem>;
                   return null;
                }
                return (
                  <PaginationItem key={p}>
                    <PaginationLink 
                      isActive={page === p}
                      onClick={() => setPage(p)}
                      className="cursor-pointer"
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
