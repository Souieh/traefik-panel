import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Code, ExternalLink } from 'lucide-react';
import {
  isRecord,
  isValidMiddlewareType,
  type MiddlewareConfig,
} from './MiddlewaresTable';

export function MiddlewareYAMLPreview({
  name,
  config,
}: {
  name: string;
  config: MiddlewareConfig;
}) {
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return 'null';
    }

    if (Array.isArray(value)) {
      const items = value.map((v) => {
        if (typeof v === 'string') return `"${v}"`;
        if (typeof v === 'number' || typeof v === 'boolean') return v.toString();
        return JSON.stringify(v);
      });
      return `[${items.join(', ')}]`;
    }

    if (isRecord(value)) {
      const entries = Object.entries(value)
        .filter(([_, v]) => v !== null && v !== undefined)
        .map(([k, v]) => {
          if (typeof v === 'string') return `  ${k}: "${v}"`;
          if (typeof v === 'number' || typeof v === 'boolean') return `  ${k}: ${v}`;
          return `  ${k}: ${JSON.stringify(v)}`;
        })
        .join('\n');
      return entries ? `\n${entries}` : '';
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return value.toString();
    }

    return `"${value}"`;
  };

  const yamlContent = `# Middleware Configuration Preview
http:
  middlewares:
    ${name || 'middleware-name'}:
${Object.entries(config)
  .filter(
    ([type, options]) =>
      isValidMiddlewareType(type) && isRecord(options) && Object.keys(options).length > 0
  )
  .map(
    ([type, options]) =>
      `      ${type}:\n${Object.entries(options)
        .filter(([_, value]) => value !== null && value !== undefined && value !== '')
        .map(([key, value]) => `        ${key}: ${formatValue(value)}`)
        .join('\n')}`
  )
  .join('\n')}`;

  return (
    <div className='space-y-2 rounded-lg border p-4'>
      <div className='flex items-center justify-between'>
        <Label className='flex items-center gap-2'>
          <Code className='h-4 w-4' />
          YAML Configuration Preview
        </Label>
        <Badge variant='outline' className='font-mono text-xs'>
          {name || 'middleware-name'}
        </Badge>
      </div>
      <pre className='text-sm bg-muted/30 p-3 rounded-md overflow-x-auto font-mono whitespace-pre-wrap'>
        {yamlContent}
      </pre>
      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
        <ExternalLink className='h-3 w-3' />
        <span>This is how the middleware will appear in your Traefik configuration file</span>
      </div>
    </div>
  );
}