import { RuleDisplay } from '@/components/RuleDisplay';
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

export interface Router {
  entryPoints: string[];
  rule: string;
  service: string;
  middlewares?: string[];
  priority?: number;
  tls?: { certResolver?: string; passthrough?: boolean };
}

export interface RouterWithSource {
  name: string;
  router: Router;
  source: 'configured' | 'live'; // 'configured' = from panel, 'live' = from Traefik API
  protocol: 'http' | 'tcp' | 'udp';
}

interface RoutersTableProps {
  routers: RouterWithSource[];
  protocol: 'http' | 'tcp' | 'udp';
  onEdit: (name: string, router: Router, source: 'configured' | 'live') => void;
  onDelete: (name: string) => void;
}

export function RoutersTable({ routers, protocol, onEdit, onDelete }: RoutersTableProps) {
  return (
    <div className='rounded-lg border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-10'></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Rule</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Entry Points</TableHead>
            <TableHead>TLS</TableHead>
            <TableHead className='w-[100px]'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {routers.map(({ name, router, source }) => (
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
                  {protocol === 'http' && router.priority !== undefined && (
                    <Badge variant='outline' className='text-xs'>
                      Prio: {router.priority}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {protocol === 'http' ? <RuleDisplay rule={router.rule} /> : router.rule || '-'}
              </TableCell>
              <TableCell>
                <Badge variant='secondary'>{router.service}</Badge>
              </TableCell>
              <TableCell>
                <div className='flex flex-wrap gap-1'>
                  {(router?.entryPoints || []).map((ep) => (
                    <Badge key={ep} variant='outline' className='text-xs'>
                      {ep}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                {router.tls ? (
                  <Badge className='bg-green-100 text-green-800 hover:bg-green-100'>
                    {router.tls.certResolver ||
                      (router.tls.passthrough ? 'Passthrough' : 'Enabled')}
                  </Badge>
                ) : (
                  <span className='text-muted-foreground text-sm'>-</span>
                )}
              </TableCell>
              <TableCell>
                <div className='flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                  {source === 'configured' ? (
                    <>
                      <Button
                        size='icon'
                        variant='ghost'
                        onClick={() => onEdit(name, router, source)}
                        title='Edit router'
                      >
                        <Pencil className='h-4 w-4' />
                      </Button>
                      <Button
                        size='icon'
                        variant='ghost'
                        onClick={() => onDelete(name)}
                        title='Delete router'
                      >
                        <Trash2 className='h-4 w-4 text-destructive' />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size='icon'
                      variant='ghost'
                      onClick={() => onEdit(name, router, source)}
                      title='View router details'
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
