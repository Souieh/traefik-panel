import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import type { Service } from './ServicesTable';

export function ServiceYAMLPreview({
  service,
  name,
  protocol,
}: {
  service: Service;
  name: string;
  protocol: 'http' | 'tcp' | 'udp';
}) {
  const servers = service.loadBalancer?.servers || [];
  const healthCheck = service.loadBalancer?.healthCheck;

  const yamlContent = `# Service Configuration Preview
${protocol}:
  services:
    ${name}:
      loadBalancer:
        servers:
${servers
  .map(
    (server) =>
      `          - ${protocol === 'http' ? 'url' : 'address'}: "${
        protocol === 'http' ? server.url : server.address
      }"`
  )
  .join('\n')}
${
  healthCheck
    ? `        healthCheck:
          path: "${healthCheck.path || ''}"
          ${healthCheck.interval ? `interval: "${healthCheck.interval}"` : ''}
          ${healthCheck.timeout ? `timeout: "${healthCheck.timeout}"` : ''}`
    : ''
}`;

  return (
    <div className='space-y-2 rounded-lg border p-4'>
      <div className='flex items-center justify-between'>
        <Label className='flex items-center gap-2'>
          <code className='text-sm font-semibold'>YAML Configuration Preview</code>
        </Label>
        <Badge variant='outline' className='font-mono text-xs'>
          {name || 'service-name'}
        </Badge>
      </div>
      <pre className='text-sm bg-muted/30 p-3 rounded-md overflow-x-auto font-mono whitespace-pre-wrap'>
        {yamlContent}
      </pre>
      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
        <span>This is how the service will appear in your Traefik configuration file</span>
      </div>
    </div>
  );
}
