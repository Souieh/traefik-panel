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
import {
  AlertCircle,
  ArrowRightLeft,
  Eye,
  Lock,
  Pencil,
  Scissors,
  Shield,
  Trash2,
} from 'lucide-react';

// Types
export type MiddlewareType =
  | 'basicauth'
  | 'headers'
  | 'digestauth'
  | 'chain'
  | 'compress'
  | 'errorpage'
  | 'ipwhitelist'
  | 'ratelimit'
  | 'redirectregex'
  | 'redirectscheme'
  | 'replacepath'
  | 'replacepathregex'
  | 'stripprefix'
  | 'stripprefixregex'
  | 'retry'
  | 'requestheader';

export interface MiddlewareConfig {
  [key: string]: Record<string, any>;
}

export interface MiddlewareWithSource {
  name: string;
  config: MiddlewareConfig;
  source: 'configured' | 'live';
  _apiMiddleware?: any;
}

// Constants
export const typeIcons: Record<MiddlewareType, React.ReactNode> = {
  basicauth: <Lock className='h-4 w-4' />,
  headers: <Shield className='h-4 w-4' />,
  digestauth: <Lock className='h-4 w-4' />,
  chain: <Eye className='h-4 w-4' />,
  compress: <Scissors className='h-4 w-4' />,
  errorpage: <AlertCircle className='h-4 w-4' />,
  ipwhitelist: <Shield className='h-4 w-4' />,
  ratelimit: <AlertCircle className='h-4 w-4' />,
  redirectregex: <ArrowRightLeft className='h-4 w-4' />,
  redirectscheme: <ArrowRightLeft className='h-4 w-4' />,
  replacepath: <ArrowRightLeft className='h-4 w-4' />,
  replacepathregex: <ArrowRightLeft className='h-4 w-4' />,
  stripprefix: <Scissors className='h-4 w-4' />,
  stripprefixregex: <Scissors className='h-4 w-4' />,
  retry: <AlertCircle className='h-4 w-4' />,
  requestheader: <Shield className='h-4 w-4' />,
};

export const typeLabels: Record<MiddlewareType, string> = {
  basicauth: 'Basic Auth',
  headers: 'Headers',
  digestauth: 'Digest Auth',
  chain: 'Chain',
  compress: 'Compress',
  errorpage: 'Error Page',
  ipwhitelist: 'IP Whitelist',
  ratelimit: 'Rate Limit',
  redirectregex: 'Redirect Regex',
  redirectscheme: 'Redirect Scheme',
  replacepath: 'Replace Path',
  replacepathregex: 'Replace Path Regex',
  stripprefix: 'Strip Prefix',
  stripprefixregex: 'Strip Prefix Regex',
  retry: 'Retry',
  requestheader: 'Request Header',
};

// Utils
export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const isValidMiddlewareType = (type: string): type is MiddlewareType => {
  return Object.keys(typeLabels).includes(type);
};

// ConfigPreview Component
export function ConfigPreview({ config }: { config: MiddlewareConfig }) {
  if (!config || Object.keys(config).length === 0) {
    return <span className='text-sm text-muted-foreground'>No configuration</span>;
  }

  const renderConfig = (type: MiddlewareType, options: Record<string, any>) => {
    if (!options || Object.keys(options).length === 0) {
      return <span className='text-sm text-muted-foreground'>Empty configuration</span>;
    }

    const safeOptions = options || {};

    switch (type) {
      case 'basicauth':
        const users = Array.isArray(safeOptions.users) ? safeOptions.users : [];
        return (
          <div className='space-y-1'>
            <div className='flex items-center gap-2'>
              <Badge variant='outline' className='text-xs'>
                Users
              </Badge>
              <span className='text-sm'>{users.length} user(s)</span>
            </div>
            {users.slice(0, 2).map((user: string, i: number) => (
              <code key={i} className='block text-xs text-muted-foreground'>
                {typeof user === 'string' ? user.replace(/:.*/, ':*****') : 'Invalid user format'}
              </code>
            ))}
            {users.length > 2 && (
              <span className='text-xs text-muted-foreground'>+{users.length - 2} more</span>
            )}
          </div>
        );
      case 'headers':
        const requestHeaders = isRecord(safeOptions.customRequestHeaders)
          ? safeOptions.customRequestHeaders
          : {};
        const responseHeaders = isRecord(safeOptions.customResponseHeaders)
          ? safeOptions.customResponseHeaders
          : {};

        return (
          <div className='space-y-1'>
            {Object.keys(requestHeaders).length > 0 && (
              <div className='flex items-center gap-2'>
                <Badge variant='outline' className='text-xs'>
                  Request Headers
                </Badge>
                <span className='text-sm'>{Object.keys(requestHeaders).length}</span>
              </div>
            )}
            {Object.keys(responseHeaders).length > 0 && (
              <div className='flex items-center gap-2'>
                <Badge variant='outline' className='text-xs'>
                  Response Headers
                </Badge>
                <span className='text-sm'>{Object.keys(responseHeaders).length}</span>
              </div>
            )}
          </div>
        );
      case 'ratelimit':
        return (
          <div className='space-y-1'>
            <div className='flex gap-2'>
              <Badge variant='outline' className='text-xs'>
                Avg: {typeof safeOptions.average === 'number' ? safeOptions.average : '0'}
              </Badge>
              <Badge variant='outline' className='text-xs'>
                Burst: {typeof safeOptions.burst === 'number' ? safeOptions.burst : '0'}
              </Badge>
            </div>
          </div>
        );
      case 'redirectscheme':
        return (
          <div className='space-y-1'>
            <div className='flex items-center gap-2'>
              <Badge variant='outline' className='text-xs'>
                Scheme
              </Badge>
              <span className='text-sm'>
                {typeof safeOptions.scheme === 'string' ? safeOptions.scheme : 'https'}
              </span>
            </div>
            {safeOptions.port && (
              <div className='flex items-center gap-2'>
                <Badge variant='outline' className='text-xs'>
                  Port
                </Badge>
                <span className='text-sm'>{safeOptions.port}</span>
              </div>
            )}
          </div>
        );
      case 'stripprefix':
        const prefixes = Array.isArray(safeOptions.prefixes) ? safeOptions.prefixes : [];
        return (
          <div className='space-y-1'>
            <div className='flex items-center gap-2'>
              <Badge variant='outline' className='text-xs'>
                Prefixes
              </Badge>
              <span className='text-sm'>{prefixes.length}</span>
            </div>
            {prefixes.slice(0, 2).map((prefix: string, i: number) => (
              <code key={i} className='block text-xs text-muted-foreground'>
                {typeof prefix === 'string' ? prefix : 'Invalid prefix'}
              </code>
            ))}
            {prefixes.length > 2 && (
              <span className='text-xs text-muted-foreground'>+{prefixes.length - 2} more</span>
            )}
          </div>
        );
      case 'requestheader':
        const headers = isRecord(safeOptions.headers) ? safeOptions.headers : {};
        return (
          <div className='space-y-1'>
            {Object.keys(headers).length > 0 && (
              <div className='flex items-center gap-2'>
                <Badge variant='outline' className='text-xs'>
                  Headers
                </Badge>
                <span className='text-sm'>{Object.keys(headers).length}</span>
              </div>
            )}
          </div>
        );
      default:
        return (
          <span className='text-sm text-muted-foreground'>
            {Object.keys(safeOptions).length} configuration items
          </span>
        );
    }
  };

  return (
    <div className='space-y-2'>
      {Object.entries(config).map(([type, options]) => {
        if (!isValidMiddlewareType(type) || !isRecord(options)) {
          return null;
        }

        return (
          <div key={type} className='space-y-1'>
            <div className='flex items-center gap-2'>
              {typeIcons[type] || <Shield className='h-3 w-3' />}
              <span className='text-xs font-medium'>{typeLabels[type] || type}</span>
            </div>
            {renderConfig(type, options)}
          </div>
        );
      })}
    </div>
  );
}

interface MiddlewaresTableProps {
  middlewares: MiddlewareWithSource[];
  onEdit: (name: string, config: MiddlewareConfig, source: 'configured' | 'live') => void;
  onDelete: (name: string, source: 'configured' | 'live') => void;
}

export function MiddlewaresTable({ middlewares, onEdit, onDelete }: MiddlewaresTableProps) {
  return (
    <div className='rounded-lg border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-10'></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Types</TableHead>
            <TableHead>Configuration</TableHead>
            <TableHead className='w-28'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {middlewares.map(({ name, config, source }) => {
            const types = Object.keys(config).filter(isValidMiddlewareType) as MiddlewareType[];

            return (
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
                    <Shield className='h-4 w-4' />
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
                  <div className='flex flex-wrap gap-1'>
                    {types.map((type) => (
                      <Badge key={type} variant='secondary' className='font-mono text-xs'>
                        {type}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <ConfigPreview config={config} />
                </TableCell>
                <TableCell>
                  <div className='flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                    {source === 'configured' ? (
                      <>
                        <Button
                          size='icon'
                          variant='ghost'
                          onClick={() => onEdit(name, config, source)}
                          title='Edit middleware'
                        >
                          <Pencil className='h-4 w-4' />
                        </Button>
                        <Button
                          size='icon'
                          variant='ghost'
                          onClick={() => onDelete(name, source)}
                          title='Delete middleware'
                        >
                          <Trash2 className='h-4 w-4 text-destructive' />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size='icon'
                        variant='ghost'
                        onClick={() => onEdit(name, config, source)}
                        title='View middleware details'
                      >
                        <Eye className='h-4 w-4' />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
