import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, Pencil, Trash2 } from 'lucide-react';

export interface Service {
  loadBalancer: {
    servers: { url?: string; address?: string }[];
    healthCheck?: {
      path?: string;
      interval?: string;
      timeout?: string;
    };
  };
}

export interface ServiceWithSource {
  name: string;
  service: Service;
  source: 'configured' | 'live'; // 'configured' = from panel, 'live' = from Traefik API
  protocol: 'http' | 'tcp' | 'udp';
  isApiService?: boolean;
}

function HealthCheckStatus({ service }: { service: Service }) {
  const hasHealthCheck = !!service.loadBalancer?.healthCheck;

  if (!hasHealthCheck) {
    return (
      <Badge variant='outline' className='text-xs'>
        None
      </Badge>
    );
  }

  const hc = service.loadBalancer.healthCheck || {};
  return (
    <div className='flex flex-col gap-1'>
      <Badge className='bg-green-100 text-green-800 hover:bg-green-100 text-xs'>Enabled</Badge>
      <div className='text-xs text-muted-foreground space-y-1'>
        {hc.path && <div>Path: {hc.path}</div>}
        {hc.interval && <div>Interval: {hc.interval}</div>}
        {hc.timeout && <div>Timeout: {hc.timeout}</div>}
      </div>
    </div>
  );
}

function ServersDisplay({
  service,
  protocol,
}: {
  service: Service;
  protocol: 'http' | 'tcp' | 'udp';
}) {
  const servers = service.loadBalancer?.servers || [];

  if (servers.length === 0) {
    return <span className='text-sm text-muted-foreground'>No servers</span>;
  }

  return (
    <div className='space-y-1'>
      {servers.slice(0, 3).map((server, index) => (
        <Badge key={index} variant='secondary' className='font-mono text-xs block'>
          {protocol === 'http' ? server.url : server.address}
        </Badge>
      ))}
      {servers.length > 3 && (
        <span className='text-xs text-muted-foreground'>+{servers.length - 3} more</span>
      )}
    </div>
  );
}

interface ServicesTableProps {
  services: ServiceWithSource[];
  protocol: 'http' | 'tcp' | 'udp';
  onEdit: (name: string, service: Service, source: 'configured' | 'live') => void;
  onDelete: (name: string, source: 'configured' | 'live') => void;
}

export function ServicesTable({ services, protocol, onEdit, onDelete }: ServicesTableProps) {
  return (
    <div className='rounded-lg border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-10'></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Servers</TableHead>
            <TableHead>Health Check</TableHead>
            <TableHead className='w-[100px]'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map(({ name, service, source }) => (
            <TableRow key={name} className='group'>
              <TableCell>
                {source === 'configured' ? (
                  <div
                    className='w-3 h-3 rounded-full bg-blue-500'
                    title='Configured via panel'
                  ></div>
                ) : (
                  <div
                    className='w-3 h-3 rounded-full bg-green-500'
                    title='Live from Traefik API'
                  ></div>
                )}
              </TableCell>
              <TableCell className='font-medium'>
                <div className='flex items-center gap-2'>
                  {name}
                  {source === 'live' && (
                    <Badge
                      variant='outline'
                      className='text-xs bg-green-50 text-green-700 border-green-200'
                    >
                      Live
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <ServersDisplay service={service} protocol={protocol} />
              </TableCell>
              <TableCell>
                <HealthCheckStatus service={service} />
              </TableCell>
              <TableCell>
                <div className='flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                  {source === 'configured' ? (
                    <>
                      <Button
                        size='icon'
                        variant='ghost'
                        onClick={() => onEdit(name, service, source)}
                        title='Edit service'
                      >
                        <Pencil className='h-4 w-4' />
                      </Button>
                      <Button
                        size='icon'
                        variant='ghost'
                        onClick={() => onDelete(name, source)}
                        title='Delete service'
                      >
                        <Trash2 className='h-4 w-4 text-destructive' />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size='icon'
                      variant='ghost'
                      onClick={() => onEdit(name, service, source)}
                      title='View service details'
                    >
                      <Eye className='h-4 w-4' />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
