import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Code, ExternalLink } from 'lucide-react';

interface Router {
  entryPoints: string[];
  rule: string;
  service: string;
  middlewares?: string[];
  priority?: number;
  tls?: { certResolver?: string; passthrough?: boolean };
}

export function YAMLPreview({ router, name }: { router: Router; name: string }) {
  const yamlContent = `# Router Configuration Preview
http:
  routers:
    ${name}:
      entryPoints: [${router.entryPoints.map((ep) => `"${ep}"`).join(', ')}]
      rule: "${router.rule}"
      service: ${router.service}
      ${
        router.middlewares?.length
          ? `middlewares: [${router.middlewares.map((m) => `"${m}"`).join(', ')}]`
          : ''
      }
      ${router.priority ? `priority: ${router.priority}` : ''}
      ${
        router.tls?.certResolver
          ? `tls:
        certResolver: "${router.tls.certResolver}"`
          : ''
      }`;

  return (
    <div className='space-y-2 rounded-lg border p-4'>
      <div className='flex items-center justify-between'>
        <Label className='flex items-center gap-2'>
          <Code className='h-4 w-4' />
          YAML Configuration Preview
        </Label>
        <Badge variant='outline' className='font-mono text-xs'>
          {name || 'router-name'}
        </Badge>
      </div>
      <pre className='text-sm bg-muted/30 p-3 rounded-md overflow-x-auto font-mono whitespace-pre-wrap'>
        {yamlContent}
      </pre>
      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
        <ExternalLink className='h-3 w-3' />
        <span>This is how the router will appear in your Traefik configuration file</span>
      </div>
    </div>
  );
}
