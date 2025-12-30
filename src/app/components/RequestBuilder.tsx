import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Plus, Trash2, Send } from 'lucide-react';

interface Header {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

interface QueryParam {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

interface RequestBuilderProps {
  onSendRequest: (config: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: string;
    queryParams: Record<string, string>;
  }) => void;
  isLoading: boolean;
}

export function RequestBuilder({ onSendRequest, isLoading }: RequestBuilderProps) {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts');
  const [headers, setHeaders] = useState<Header[]>([
    { id: '1', key: 'Content-Type', value: 'application/json', enabled: true },
  ]);
  const [queryParams, setQueryParams] = useState<QueryParam[]>([]);
  const [body, setBody] = useState('{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}');

  const addHeader = () => {
    setHeaders([...headers, { id: Date.now().toString(), key: '', value: '', enabled: true }]);
  };

  const updateHeader = (id: string, field: keyof Header, value: string | boolean) => {
    setHeaders(headers.map(h => (h.id === id ? { ...h, [field]: value } : h)));
  };

  const removeHeader = (id: string) => {
    setHeaders(headers.filter(h => h.id !== id));
  };

  const addQueryParam = () => {
    setQueryParams([...queryParams, { id: Date.now().toString(), key: '', value: '', enabled: true }]);
  };

  const updateQueryParam = (id: string, field: keyof QueryParam, value: string | boolean) => {
    setQueryParams(queryParams.map(q => (q.id === id ? { ...q, [field]: value } : q)));
  };

  const removeQueryParam = (id: string) => {
    setQueryParams(queryParams.filter(q => q.id !== id));
  };

  const handleSend = () => {
    const enabledHeaders = headers
      .filter(h => h.enabled && h.key)
      .reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {});

    const enabledParams = queryParams
      .filter(q => q.enabled && q.key)
      .reduce((acc, q) => ({ ...acc, [q.key]: q.value }), {});

    onSendRequest({
      method,
      url,
      headers: enabledHeaders,
      body,
      queryParams: enabledParams,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Select value={method} onValueChange={setMethod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
            <SelectItem value="HEAD">HEAD</SelectItem>
            <SelectItem value="OPTIONS">OPTIONS</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter request URL"
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={isLoading} className="gap-2">
          <Send className="size-4" />
          Send
        </Button>
      </div>

      <Tabs defaultValue="params" className="w-full">
        <TabsList>
          <TabsTrigger value="params">Params</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
        </TabsList>

        <TabsContent value="params" className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Label>Query Parameters</Label>
            <Button variant="outline" size="sm" onClick={addQueryParam}>
              <Plus className="size-4 mr-1" />
              Add
            </Button>
          </div>
          {queryParams.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center">
              No query parameters added
            </div>
          ) : (
            <div className="space-y-2">
              {queryParams.map((param) => (
                <div key={param.id} className="flex gap-2 items-center">
                  <input
                    type="checkbox"
                    checked={param.enabled}
                    onChange={(e) => updateQueryParam(param.id, 'enabled', e.target.checked)}
                    className="size-4"
                  />
                  <Input
                    value={param.key}
                    onChange={(e) => updateQueryParam(param.id, 'key', e.target.value)}
                    placeholder="Key"
                    className="flex-1"
                  />
                  <Input
                    value={param.value}
                    onChange={(e) => updateQueryParam(param.id, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQueryParam(param.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="headers" className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Label>Headers</Label>
            <Button variant="outline" size="sm" onClick={addHeader}>
              <Plus className="size-4 mr-1" />
              Add
            </Button>
          </div>
          <div className="space-y-2">
            {headers.map((header) => (
              <div key={header.id} className="flex gap-2 items-center">
                <input
                  type="checkbox"
                  checked={header.enabled}
                  onChange={(e) => updateHeader(header.id, 'enabled', e.target.checked)}
                  className="size-4"
                />
                <Input
                  value={header.key}
                  onChange={(e) => updateHeader(header.id, 'key', e.target.value)}
                  placeholder="Key"
                  className="flex-1"
                />
                <Input
                  value={header.value}
                  onChange={(e) => updateHeader(header.id, 'value', e.target.value)}
                  placeholder="Value"
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeHeader(header.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="body" className="space-y-2">
          <Label>Request Body (JSON)</Label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Enter request body"
            className="font-mono min-h-[200px]"
            disabled={method === 'GET' || method === 'HEAD'}
          />
          {(method === 'GET' || method === 'HEAD') && (
            <p className="text-sm text-muted-foreground">
              {method} requests typically don't include a body
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
