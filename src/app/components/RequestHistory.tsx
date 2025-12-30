import { Clock, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';

export interface HistoryItem {
  id: string;
  method: string;
  url: string;
  status: number | null;
  timestamp: Date;
}

interface RequestHistoryProps {
  history: HistoryItem[];
  onSelectRequest: (item: HistoryItem) => void;
  onClearHistory: () => void;
}

export function RequestHistory({ history, onSelectRequest, onClearHistory }: RequestHistoryProps) {
  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-500';
      case 'POST':
        return 'bg-green-500';
      case 'PUT':
        return 'bg-yellow-500';
      case 'PATCH':
        return 'bg-orange-500';
      case 'DELETE':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: number | null) => {
    if (!status) return 'text-muted-foreground';
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 400) return 'text-red-600';
    return 'text-yellow-600';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Clock className="size-5" />
          <h2>History</h2>
        </div>
        {history.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearHistory}>
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        {history.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No request history yet
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectRequest(item)}
                className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`${getMethodColor(item.method)} text-white text-xs`}>
                    {item.method}
                  </Badge>
                  {item.status && (
                    <span className={`text-xs ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  )}
                </div>
                <div className="text-sm truncate mb-1">{item.url}</div>
                <div className="text-xs text-muted-foreground">
                  {item.timestamp.toLocaleTimeString()}
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
