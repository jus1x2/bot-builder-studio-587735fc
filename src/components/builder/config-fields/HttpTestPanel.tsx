import { useState } from 'react';
import { Play, Loader2, CheckCircle2, XCircle, Copy, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface HttpTestPanelProps {
  url: string;
  method: string;
  headers?: string;
  body?: string;
  timeout?: number;
}

interface TestResult {
  status: number;
  statusText: string;
  data: any;
  duration: number;
  headers: Record<string, string>;
  success: boolean;
  error?: string;
}

export function HttpTestPanel({ url, method, headers, body, timeout = 30 }: HttpTestPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [showHeaders, setShowHeaders] = useState(false);

  const runTest = async () => {
    if (!url) {
      toast({ title: 'Ошибка', description: 'Укажите URL для запроса', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    const startTime = performance.now();

    try {
      // Parse headers
      let parsedHeaders: Record<string, string> = {};
      if (headers) {
        try {
          parsedHeaders = JSON.parse(headers);
        } catch {
          toast({ title: 'Ошибка', description: 'Неверный формат заголовков JSON', variant: 'destructive' });
          setIsLoading(false);
          return;
        }
      }

      // Parse body
      let parsedBody: string | undefined;
      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        try {
          // Validate JSON
          JSON.parse(body);
          parsedBody = body;
        } catch {
          toast({ title: 'Ошибка', description: 'Неверный формат тела запроса JSON', variant: 'destructive' });
          setIsLoading(false);
          return;
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout * 1000);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...parsedHeaders,
        },
        body: parsedBody,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      // Get response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Try to parse response as JSON
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        try {
          data = await response.json();
        } catch {
          data = await response.text();
        }
      } else {
        data = await response.text();
      }

      setResult({
        status: response.status,
        statusText: response.statusText,
        data,
        duration,
        headers: responseHeaders,
        success: response.ok,
      });

    } catch (error) {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setResult({
            status: 0,
            statusText: 'Timeout',
            data: null,
            duration,
            headers: {},
            success: false,
            error: `Превышено время ожидания (${timeout} сек)`,
          });
        } else {
          setResult({
            status: 0,
            statusText: 'Error',
            data: null,
            duration,
            headers: {},
            success: false,
            error: error.message,
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyResult = () => {
    if (result?.data) {
      const text = typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2);
      navigator.clipboard.writeText(text);
      toast({ title: 'Скопировано!', description: 'Ответ скопирован в буфер обмена' });
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-500';
    if (status >= 300 && status < 400) return 'text-blue-500';
    if (status >= 400 && status < 500) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border/50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Тестирование запроса</span>
        <Button
          size="sm"
          onClick={runTest}
          disabled={isLoading || !url}
          className="gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Запрос...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Тестировать
            </>
          )}
        </Button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {/* Status Line */}
            <div className="flex items-center gap-3 text-sm">
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <span className={`font-mono font-bold ${getStatusColor(result.status)}`}>
                {result.status || 'ERR'}
              </span>
              <span className="text-muted-foreground">{result.statusText}</span>
              <div className="flex items-center gap-1 text-muted-foreground ml-auto">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-mono text-xs">{result.duration}ms</span>
              </div>
            </div>

            {/* Error Message */}
            {result.error && (
              <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                {result.error}
              </div>
            )}

            {/* Response Headers Toggle */}
            {Object.keys(result.headers).length > 0 && (
              <button
                onClick={() => setShowHeaders(!showHeaders)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showHeaders ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                Заголовки ответа ({Object.keys(result.headers).length})
              </button>
            )}

            <AnimatePresence>
              {showHeaders && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs font-mono bg-background/50 rounded p-2 space-y-1"
                >
                  {Object.entries(result.headers).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <span className="text-primary">{key}:</span>
                      <span className="text-muted-foreground truncate">{value}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Response Body */}
            {result.data !== null && (
              <div className="relative">
                <pre className="text-xs font-mono bg-background/50 rounded p-2 overflow-auto max-h-48 whitespace-pre-wrap break-all">
                  {typeof result.data === 'string' 
                    ? result.data.slice(0, 2000) + (result.data.length > 2000 ? '...' : '')
                    : JSON.stringify(result.data, null, 2).slice(0, 2000)
                  }
                </pre>
                <button
                  onClick={copyResult}
                  className="absolute top-1 right-1 p-1.5 rounded bg-background/80 hover:bg-muted transition-colors"
                  title="Скопировать ответ"
                >
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!result && !isLoading && (
        <p className="text-xs text-muted-foreground">
          Нажмите «Тестировать» чтобы выполнить запрос и увидеть ответ
        </p>
      )}
    </div>
  );
}