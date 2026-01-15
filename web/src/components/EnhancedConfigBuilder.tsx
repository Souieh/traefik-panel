import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Code, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  isRecord,
  isValidMiddlewareType,
  typeIcons,
  typeLabels,
  type MiddlewareConfig,
  type MiddlewareType,
} from './MiddlewaresTable';

export function EnhancedConfigBuilder({
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

  const allMiddlewareTypes = Object.keys(typeLabels) as MiddlewareType[];

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