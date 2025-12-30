import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';

interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  time: number;
  size: number;
}

interface ResponseViewerProps {
  response: ResponseData | null;
  error: string | null;
}

export function ResponseViewer({ response, error }: ResponseViewerProps) {
  if (error) {
    return (
      <div className="p-4 border rounded-lg bg-destructive/10 border-destructive">
        <h3 className="mb-2 text-destructive">Error</h3>
        <pre className="text-sm font-mono">{error}</pre>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="p-8 text-center text-muted-foreground border rounded-lg">
        Send a request to see the response here
      </div>
    );
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-green-500';
    if (status >= 300 && status < 400) return 'bg-blue-500';
    if (status >= 400 && status < 500) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Badge className={`${getStatusColor(response.status)} text-white`}>
          {response.status} {response.statusText}
        </Badge>
        <span className="text-sm text-muted-foreground">Time: {response.time}ms</span>
        <span className="text-sm text-muted-foreground">Size: {response.size} bytes</span>
      </div>

      <Tabs defaultValue="body" className="w-full">
        <TabsList>
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
        </TabsList>

        <TabsContent value="body" className="mt-4">
          <ScrollArea className="h-[400px] border rounded-lg p-4">
            <pre className="text-sm font-mono whitespace-pre-wrap">
              {typeof response.data === 'string'
                ? response.data
                : JSON.stringify(response.data, null, 2)}
            </pre>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="headers" className="mt-4">
          <ScrollArea className="h-[400px] border rounded-lg p-4">
            <div className="space-y-2">
              {Object.entries(response.headers).map(([key, value]) => (
                <div key={key} className="grid grid-cols-[200px_1fr] gap-4 text-sm">
                  <span className="font-mono break-words">{key}:</span>
                  <span className="font-mono text-muted-foreground break-words">{value}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
