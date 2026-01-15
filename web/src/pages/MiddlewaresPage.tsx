import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import {
  AlertCircle,
  ArrowRightLeft,
  Code,
  ExternalLink,
  Eye,
  EyeOff,
  Lock,
  Pencil,
  Plus,
  Scissors,
  Shield,
  Trash2,
  Wand2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// Define all middleware types from your API
type MiddlewareType =
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

interface MiddlewareConfig {
  [key: string]: Record<string, any>;
}

interface MiddlewareWithSource {
  name: string;
  config: MiddlewareConfig;
  source: 'configured' | 'live'; // 'configured' = from panel, 'live' = from Traefik API
  _apiMiddleware?: any;
}

interface ApiMiddleware {
  name?: string;
  [key: string]: any;
}

// Type guards and validation utilities
const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isValidMiddlewareType = (type: string): type is MiddlewareType => {
  const validTypes: MiddlewareType[] = [
    'basicauth',
    'headers',
    'digestauth',
    'chain',
    'compress',
    'errorpage',
    'ipwhitelist',
    'ratelimit',
    'redirectregex',
    'redirectscheme',
    'replacepath',
    'replacepathregex',
    'stripprefix',
    'stripprefixregex',
    'retry',
    'requestheader',
  ];
  return validTypes.includes(type as MiddlewareType);
};

const normalizeMiddlewareData = (data: any): MiddlewareConfig => {
  if (!data || !isRecord(data)) return {};

  const normalized: MiddlewareConfig = {};

  Object.entries(data).forEach(([key, value]) => {
    // Only include valid middleware types with non-null/undefined object values
    if (isValidMiddlewareType(key) && isRecord(value) && Object.keys(value).length > 0) {
      // Deep clean the value object
      const cleanedValue: Record<string, any> = {};
      Object.entries(value).forEach(([subKey, subValue]) => {
        if (subValue !== null && subValue !== undefined && subValue !== '') {
          cleanedValue[subKey] = subValue;
        }
      });

      if (Object.keys(cleanedValue).length > 0) {
        normalized[key] = cleanedValue;
      }
    }
  });

  return normalized;
};

const isApiMiddleware = (value: unknown): value is ApiMiddleware => {
  return isRecord(value);
};

const isValidMiddlewareName = (name: unknown): name is string => {
  return typeof name === 'string' && name.length > 0;
};

/* ===========================
   Type Icons Map
=========================== */
const typeIcons: Record<MiddlewareType, React.ReactNode> = {
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

const typeLabels: Record<MiddlewareType, string> = {
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

/* ===========================
   Configuration Preview Component
=========================== */
function ConfigPreview({ config }: { config: MiddlewareConfig }) {
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

/* ===========================
   YAML Preview Component
=========================== */
function YAMLPreview({ name, config }: { name: string; config: MiddlewareConfig }) {
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

/* ===========================
   Enhanced Multi-Type Configuration Builder
=========================== */
function EnhancedConfigBuilder({
  enabledTypes,
  rawConfigs,
  setEnabledTypes,
  setRawConfigs,
  simpleMode,
}: {
  enabledTypes: MiddlewareType[];
  rawConfigs: Record<MiddlewareType, string>;
  setEnabledTypes: (types: MiddlewareType[]) => void;
  setRawConfigs: (configs: Record<MiddlewareType, string>) => void;
  simpleMode: boolean;
}) {
  const exampleConfigs: Partial<Record<MiddlewareType, string>> = {
    basicauth: JSON.stringify(
      {
        users: ['user1:$apr1$hashedpassword1', 'user2:$apr1$hashedpassword2'],
      },
      null,
      2
    ),
    headers: JSON.stringify(
      {
        customRequestHeaders: {
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff',
        },
        customResponseHeaders: {
          'X-Custom-Response': 'value',
        },
      },
      null,
      2
    ),
    ratelimit: JSON.stringify(
      {
        average: 100,
        burst: 50,
        period: '1s',
      },
      null,
      2
    ),
    redirectscheme: JSON.stringify(
      {
        scheme: 'https',
        permanent: true,
      },
      null,
      2
    ),
    stripprefix: JSON.stringify(
      {
        prefixes: ['/api', '/v1'],
      },
      null,
      2
    ),
    requestheader: JSON.stringify(
      {
        headers: {
          'X-Custom-Header': 'value',
          Authorization: 'Bearer token',
        },
      },
      null,
      2
    ),
    chain: JSON.stringify(
      {
        middlewares: ['auth', 'rate-limit'],
      },
      null,
      2
    ),
    ipwhitelist: JSON.stringify(
      {
        sourceRange: ['192.168.1.0/24', '10.0.0.0/8'],
      },
      null,
      2
    ),
  };

  const toggleType = (type: MiddlewareType) => {
    if (enabledTypes.includes(type)) {
      setEnabledTypes(enabledTypes.filter((t) => t !== type));
      // Clear config when disabled
      const newConfigs = { ...rawConfigs };
      delete newConfigs[type];
      setRawConfigs(newConfigs);
    } else {
      setEnabledTypes([...enabledTypes, type]);
      // Initialize with example config if available
      const newConfigs = { ...rawConfigs };
      newConfigs[type] = exampleConfigs[type] || '{}';
      setRawConfigs(newConfigs);
    }
  };

  const handleConfigChange = (type: MiddlewareType, value: string) => {
    setRawConfigs({
      ...rawConfigs,
      [type]: value,
    });
  };

  const loadExample = (type: MiddlewareType) => {
    if (exampleConfigs[type]) {
      setRawConfigs({
        ...rawConfigs,
        [type]: exampleConfigs[type]!,
      });
    }
  };

  const allMiddlewareTypes: MiddlewareType[] = [
    'basicauth',
    'headers',
    'digestauth',
    'chain',
    'compress',
    'errorpage',
    'ipwhitelist',
    'ratelimit',
    'redirectregex',
    'redirectscheme',
    'replacepath',
    'replacepathregex',
    'stripprefix',
    'stripprefixregex',
    'retry',
    'requestheader',
  ];

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <Label className='text-base font-semibold'>Middleware Types</Label>
        <Tabs
          value={simpleMode ? 'simple' : 'advanced'}
          onValueChange={() => {}}
          className='w-auto'
        >
          <TabsList>
            <TabsTrigger value='simple' className='flex items-center gap-2'>
              <Wand2 className='h-4 w-4' />
              Simple
            </TabsTrigger>
            <TabsTrigger value='advanced' className='flex items-center gap-2'>
              <Code className='h-4 w-4' />
              Advanced
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {simpleMode ? (
        <div className='space-y-4'>
          <div className='rounded-lg border p-4'>
            <Label className='mb-4 block'>Select Middleware Types</Label>
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
              {allMiddlewareTypes.map((type) => (
                <div key={type} className='flex items-center space-x-2'>
                  <Checkbox
                    id={`type-${type}`}
                    checked={enabledTypes.includes(type)}
                    onCheckedChange={() => toggleType(type)}
                  />
                  <Label
                    htmlFor={`type-${type}`}
                    className='flex items-center gap-2 text-sm cursor-pointer'
                  >
                    {typeIcons[type]}
                    {typeLabels[type]}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {enabledTypes.length > 0 && (
            <div className='space-y-4'>
              <Label className='text-base font-semibold'>Configurations</Label>
              {enabledTypes.map((type) => (
                <div key={type} className='space-y-2 rounded-lg border p-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      {typeIcons[type]}
                      <span className='font-medium'>{typeLabels[type]}</span>
                      <Badge variant='outline' className='text-xs'>
                        {type}
                      </Badge>
                    </div>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => loadExample(type)}
                    >
                      Load Example
                    </Button>
                  </div>
                  <Textarea
                    value={rawConfigs[type] || ''}
                    onChange={(e) => handleConfigChange(type, e.target.value)}
                    className='min-h-37.5 font-mono text-sm'
                    placeholder={`Enter JSON configuration for ${type}`}
                    spellCheck={false}
                  />
                  <div className='text-xs text-muted-foreground'>
                    Enter valid JSON configuration for {typeLabels[type]}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className='space-y-4'>
          <div className='rounded-lg border p-4'>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <Label>Raw JSON Configuration</Label>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    try {
                      const config = enabledTypes.reduce((acc, type) => {
                        try {
                          const parsed = JSON.parse(rawConfigs[type] || '{}');
                          if (isRecord(parsed) && Object.keys(parsed).length > 0) {
                            acc[type] = parsed;
                          }
                        } catch {
                          // Ignore invalid JSON
                        }
                        return acc;
                      }, {} as MiddlewareConfig);

                      if (Object.keys(config).length > 0) {
                        navigator.clipboard.writeText(JSON.stringify(config, null, 2));
                        toast.success('Configuration copied to clipboard');
                      } else {
                        toast.error('No valid configuration to copy');
                      }
                    } catch {
                      toast.error('Failed to copy configuration');
                    }
                  }}
                >
                  Copy Config
                </Button>
              </div>
              <Textarea
                value={JSON.stringify(
                  enabledTypes.reduce((acc, type) => {
                    try {
                      const parsed = JSON.parse(rawConfigs[type] || '{}');
                      if (isRecord(parsed)) {
                        acc[type] = parsed;
                      }
                    } catch {
                      // Keep empty object for invalid JSON
                      acc[type] = {};
                    }
                    return acc;
                  }, {} as MiddlewareConfig),
                  null,
                  2
                )}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    if (isRecord(parsed)) {
                      // Extract enabled types from parsed object
                      const newTypes = Object.keys(parsed).filter(
                        isValidMiddlewareType
                      ) as MiddlewareType[];
                      setEnabledTypes(newTypes);
                      const newConfigs: Record<MiddlewareType, string> = {} as Record<
                        MiddlewareType,
                        string
                      >;
                      newTypes.forEach((type) => {
                        newConfigs[type] = JSON.stringify(parsed[type], null, 2);
                      });
                      setRawConfigs(newConfigs);
                    }
                  } catch {
                    // Keep raw text if invalid JSON
                  }
                }}
                className='min-h-[300px] font-mono text-sm'
                spellCheck={false}
                placeholder='{
  "basicauth": {
    "users": ["user:hashedpassword"]
  },
  "headers": {
    "customRequestHeaders": {
      "X-Custom": "value"
    }
  }
}'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label className='text-sm'>Common Examples:</Label>
            <div className='grid grid-cols-2 gap-2'>
              {Object.entries(exampleConfigs).map(([type, config]) => {
                const middlewareType = type as MiddlewareType;
                return (
                  <Button
                    key={type}
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      if (!enabledTypes.includes(middlewareType)) {
                        setEnabledTypes([...enabledTypes, middlewareType]);
                      }
                      setRawConfigs({
                        ...rawConfigs,
                        [middlewareType]: config,
                      });
                    }}
                    className='h-auto py-2 px-3 text-xs justify-start'
                  >
                    <div className='flex flex-col items-start'>
                      <span className='font-medium'>{typeLabels[middlewareType]}</span>
                      <span className='text-muted-foreground truncate w-full'>
                        {config?.split('\n')[1] || 'Example configuration'}
                      </span>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===========================
   Main Page Component
=========================== */
export default function MiddlewaresPage() {
  const [configuredMiddlewares, setConfiguredMiddlewares] = useState<
    Record<string, MiddlewareConfig>
  >({});
  const [liveMiddlewares, setLiveMiddlewares] = useState<ApiMiddleware[]>([]);
  const [allMiddlewares, setAllMiddlewares] = useState<MiddlewareWithSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [showLiveMiddlewares, setShowLiveMiddlewares] = useState(true);

  const [name, setName] = useState('');
  const [simpleMode, setSimpleMode] = useState(true);
  const [enabledTypes, setEnabledTypes] = useState<MiddlewareType[]>([]);
  const [rawConfigs, setRawConfigs] = useState<Record<MiddlewareType, string>>(
    {} as Record<MiddlewareType, string>
  );

  /* ===========================
     Normalize Middleware Data from API
  =========================== */
  const normalizeApiMiddleware = (apiMiddleware: ApiMiddleware): MiddlewareConfig => {
    if (!apiMiddleware) return {};

    // Extract configuration from API middleware
    // The structure might vary based on your Traefik API response
    const config: MiddlewareConfig = {};

    // Check for common middleware properties in the API response
    if (apiMiddleware.basicauth && isRecord(apiMiddleware.basicauth)) {
      config.basicauth = apiMiddleware.basicauth;
    }
    if (apiMiddleware.headers && isRecord(apiMiddleware.headers)) {
      config.headers = apiMiddleware.headers;
    }
    if (apiMiddleware.ratelimit && isRecord(apiMiddleware.ratelimit)) {
      config.ratelimit = apiMiddleware.ratelimit;
    }
    // Add more middleware types as needed

    return config;
  };

  /* ===========================
     Fetch Middlewares
  =========================== */
  const fetchMiddlewares = async () => {
    try {
      setIsLoading(true);

      // Fetch manually configured middlewares
      const configRes = await api.get(`/traefik/middlewares`).catch(() => ({ data: {} }));

      // Type check and validate configured middlewares
      let configuredMiddlewares: Record<string, MiddlewareConfig> = {};
      if (configRes.data && isRecord(configRes.data)) {
        Object.entries(configRes.data).forEach(([key, value]) => {
          if (typeof key === 'string' && key.trim() !== '') {
            const normalizedConfig = normalizeMiddlewareData(value);
            if (Object.keys(normalizedConfig).length > 0) {
              configuredMiddlewares[key] = normalizedConfig;
            }
          }
        });
      }

      setConfiguredMiddlewares(configuredMiddlewares);

      // Fetch middlewares from Traefik API status
      let apiMiddlewares: ApiMiddleware[] = [];
      try {
        const statusRes = await api.get('/traefik/status/middlewares');
        if (Array.isArray(statusRes.data)) {
          apiMiddlewares = statusRes.data.filter(isApiMiddleware);
        }
      } catch (err) {
        console.warn('Failed to fetch status middlewares:', err);
      }

      setLiveMiddlewares(apiMiddlewares);

      // Combine middlewares
      const allMiddlewaresList: MiddlewareWithSource[] = [];

      // Add configured middlewares first
      Object.entries(configuredMiddlewares).forEach(([middlewareName, config]) => {
        allMiddlewaresList.push({
          name: middlewareName,
          config,
          source: 'configured',
        });
      });

      // Add live middlewares that are not already in configured middlewares
      if (showLiveMiddlewares) {
        apiMiddlewares.forEach((apiMiddleware) => {
          const middlewareName = apiMiddleware.name;
          if (isValidMiddlewareName(middlewareName) && !configuredMiddlewares[middlewareName]) {
            allMiddlewaresList.push({
              name: middlewareName,
              config: normalizeApiMiddleware(apiMiddleware),
              source: 'live',
              _apiMiddleware: apiMiddleware,
            });
          }
        });
      }

      setAllMiddlewares(allMiddlewaresList);
    } catch (error) {
      console.error('Error loading middlewares:', error);
      toast.error('Failed to load middlewares');
      setAllMiddlewares([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMiddlewares();
  }, [showLiveMiddlewares]);

  /* ===========================
     Open / Edit
  =========================== */
  const openAddModal = () => {
    setEditingName(null);
    setName('');
    setSimpleMode(true);
    setEnabledTypes([]);
    setRawConfigs({} as Record<MiddlewareType, string>);
    setIsModalOpen(true);
  };

  const handleEdit = (
    middlewareName: string,
    config: MiddlewareConfig,
    source: 'configured' | 'live'
  ) => {
    // Only allow editing of configured middlewares
    if (source === 'live') {
      toast.error('Cannot edit middlewares from Traefik API');
      return;
    }

    setEditingName(middlewareName);
    setName(middlewareName);
    setSimpleMode(false); // Always use advanced mode for editing existing configs

    // Extract types and configs from data
    const types = Object.keys(config).filter(isValidMiddlewareType) as MiddlewareType[];
    setEnabledTypes(types);

    const configs: Record<MiddlewareType, string> = {} as Record<MiddlewareType, string>;
    types.forEach((type) => {
      configs[type] = JSON.stringify(config[type] || {}, null, 2);
    });
    setRawConfigs(configs);

    setIsModalOpen(true);
  };

  /* ===========================
     Delete
  =========================== */
  const handleDelete = async (middlewareName: string, source: 'configured' | 'live') => {
    // Only allow deletion of configured middlewares
    if (source === 'live') {
      toast.error('Cannot delete middlewares from Traefik API');
      return;
    }

    if (!confirm(`Delete middleware "${middlewareName}"?`)) return;
    try {
      await api.delete(`/traefik/middlewares/${middlewareName}`);
      toast.success('Middleware deleted');
      fetchMiddlewares();
    } catch (error) {
      console.error('Failed to delete middleware:', error);
      toast.error('Failed to delete middleware');
    }
  };

  /* ===========================
     Submit
  =========================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Middleware name is required');
      return;
    }

    if (enabledTypes.length === 0) {
      toast.error('At least one middleware type must be enabled');
      return;
    }

    // Build payload by parsing all configs
    const payload: MiddlewareConfig = {};
    let hasError = false;

    enabledTypes.forEach((type) => {
      try {
        const config = JSON.parse(rawConfigs[type] || '{}');
        if (isRecord(config) && Object.keys(config).length > 0) {
          payload[type] = config;
        } else {
          toast.error(`Empty configuration for ${typeLabels[type]}`);
          hasError = true;
        }
      } catch (error) {
        toast.error(`Invalid JSON configuration for ${typeLabels[type]}`);
        hasError = true;
      }
    });

    if (hasError || Object.keys(payload).length === 0) {
      toast.error('Valid configuration required for at least one middleware type');
      return;
    }

    try {
      if (editingName) {
        await api.put(`/traefik/middlewares/${trimmedName}`, payload);
        toast.success('Middleware updated successfully');
      } else {
        await api.post(`/traefik/middlewares/${trimmedName}`, payload);
        toast.success('Middleware created successfully');
      }

      setIsModalOpen(false);
      fetchMiddlewares();
    } catch (error: any) {
      console.error('Failed to save middleware:', error);
      toast.error(`Failed to save middleware: ${error.response?.data?.message || error.message}`);
    }
  };

  const renderModal = () => {
    return (
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            {editingName ? (
              <>
                <Pencil className='h-5 w-5' />
                Edit Middleware: <Badge variant='outline'>{editingName}</Badge>
              </>
            ) : (
              <>
                <Plus className='h-5 w-5' />
                Create New Middleware
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form className='grid gap-6' onSubmit={handleSubmit}>
          <div className='grid gap-4 rounded-lg border p-4'>
            <Label className='text-base font-semibold'>Basic Information</Label>
            <div className='grid gap-3'>
              <div>
                <Label htmlFor='middlewareName' className='mb-2 block'>
                  Middleware Name
                </Label>
                <Input
                  id='middlewareName'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={!!editingName}
                  placeholder='auth-middleware'
                  className='font-mono'
                />
              </div>
              <div>
                <Label className='text-base font-semibold'>Configuration Mode</Label>
                <div className='flex items-center gap-4'>
                  <Label className='flex items-center gap-2'>
                    <Checkbox
                      checked={simpleMode}
                      onCheckedChange={(v) => {
                        const newMode = !!v;
                        setSimpleMode(newMode);
                        if (newMode) {
                          // Clear configs when switching to simple mode
                          setEnabledTypes([]);
                          setRawConfigs({} as Record<MiddlewareType, string>);
                        }
                      }}
                    />
                    Use Simple Configuration Mode
                  </Label>
                  <Badge variant='outline'>{enabledTypes.length} type(s) selected</Badge>
                </div>
              </div>
            </div>
          </div>

          <EnhancedConfigBuilder
            enabledTypes={enabledTypes}
            rawConfigs={rawConfigs}
            setEnabledTypes={setEnabledTypes}
            setRawConfigs={setRawConfigs}
            simpleMode={simpleMode}
          />

          {name && enabledTypes.length > 0 && (
            <YAMLPreview
              name={name}
              config={enabledTypes.reduce((acc, type) => {
                try {
                  const parsed = JSON.parse(rawConfigs[type] || '{}');
                  if (isRecord(parsed) && Object.keys(parsed).length > 0) {
                    acc[type] = parsed;
                  }
                } catch {
                  // Skip invalid JSON
                }
                return acc;
              }, {} as MiddlewareConfig)}
            />
          )}

          <DialogFooter className='gap-2'>
            <Button type='button' variant='outline' onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type='submit'>{editingName ? 'Update Middleware' : 'Create Middleware'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    );
  };

  /* ===========================
     Render
  =========================== */
  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center flex-wrap gap-4'>
        <div className='flex items-start flex-col gap-2 flex-wrap'>
          <h1 className='text-2xl font-bold'>Middlewares</h1>
          <p className='text-muted-foreground'>
            Add security, routing, and transformation rules to your traffic
          </p>
        </div>
        <div className='flex items-center gap-4 flex-wrap'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setShowLiveMiddlewares(!showLiveMiddlewares)}
            className='flex items-center gap-2'
          >
            {showLiveMiddlewares ? (
              <>
                <EyeOff className='h-4 w-4' />
                Hide Live Middlewares
              </>
            ) : (
              <>
                <Eye className='h-4 w-4' />
                Show Live Middlewares
              </>
            )}
          </Button>
          <Button className='flex-1' onClick={openAddModal}>
            <Plus className='mr-2 h-4 w-4' /> Add Middleware
          </Button>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {renderModal()}
      </Dialog>

      {isLoading ? (
        <div className='text-center py-12'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto'></div>
          <p className='mt-2 text-muted-foreground'>Loading middlewares...</p>
        </div>
      ) : allMiddlewares.length === 0 ? (
        <div className='text-center py-12 rounded-lg border-2 border-dashed'>
          <Shield className='h-12 w-12 mx-auto text-muted-foreground' />
          <h3 className='mt-4 text-lg font-semibold'>No middlewares configured</h3>
          <p className='text-muted-foreground mt-2'>
            Add middlewares to enhance security and control traffic flow
          </p>
          <Button onClick={openAddModal} className='mt-4'>
            <Plus className='mr-2 h-4 w-4' /> Create Middleware
          </Button>
        </div>
      ) : (
        <div className='space-y-4'>
          <div className='flex items-center justify-between text-sm text-muted-foreground'>
            <div>
              Showing {allMiddlewares.length} middleware{allMiddlewares.length !== 1 ? 's' : ''}
              {showLiveMiddlewares && (
                <span className='ml-2'>
                  ({allMiddlewares.filter((m) => m.source === 'configured').length} configured,
                  {allMiddlewares.filter((m) => m.source === 'live').length} live)
                </span>
              )}
            </div>
            <div className='flex items-center gap-2'>
              <div className='flex items-center gap-1'>
                <div className='w-3 h-3 rounded-full bg-blue-500'></div>
                <span className='text-xs'>Configured</span>
              </div>
              <div className='flex items-center gap-1'>
                <div className='w-3 h-3 rounded-full bg-green-500'></div>
                <span className='text-xs'>Live (Read-only)</span>
              </div>
            </div>
          </div>

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
                {allMiddlewares.map(({ name, config, source }) => {
                  const types = Object.keys(config).filter(
                    isValidMiddlewareType
                  ) as MiddlewareType[];

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
                                onClick={() => handleEdit(name, config, source)}
                                title='Edit middleware'
                              >
                                <Pencil className='h-4 w-4' />
                              </Button>
                              <Button
                                size='icon'
                                variant='ghost'
                                onClick={() => handleDelete(name, source)}
                                title='Delete middleware'
                              >
                                <Trash2 className='h-4 w-4 text-destructive' />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size='icon'
                              variant='ghost'
                              disabled
                              title='Live middlewares are read-only'
                            >
                              <Eye className='h-4 w-4 text-muted-foreground' />
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
        </div>
      )}
    </div>
  );
}
