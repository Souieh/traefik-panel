import { EnhancedConfigBuilder } from '@/components/EnhancedConfigBuilder';
import { MiddlewareYAMLPreview } from '@/components/MiddlewareYAMLPreview';
import {
  MiddlewaresTable,
  isRecord,
  isValidMiddlewareType,
  typeLabels,
  type MiddlewareConfig,
  type MiddlewareType,
  type MiddlewareWithSource,
} from '@/components/MiddlewaresTable';
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
import api from '@/lib/api';
import { Eye, EyeOff, Pencil, Plus, Search, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ApiMiddleware {
  name?: string;
  [key: string]: any;
}

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
   Main Page Component
=========================== */
export default function MiddlewaresPage() {
  const [allMiddlewares, setAllMiddlewares] = useState<MiddlewareWithSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [showLiveMiddlewares, setShowLiveMiddlewares] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isViewMode, setIsViewMode] = useState(false);

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
    setIsViewMode(false);
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
    setIsViewMode(source === 'live');

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
      await api.post(`/traefik/middlewares/${trimmedName}`, payload);
      if (editingName) {
        toast.success('Middleware updated successfully');
      } else {
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
            {isViewMode ? (
              <>
                <Eye className='h-5 w-5' />
                View Middleware: <Badge variant='outline'>{editingName}</Badge>
              </>
            ) : editingName ? (
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
          <fieldset disabled={isViewMode} className='grid gap-6 border-none p-0 m-0'>
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
              <MiddlewareYAMLPreview
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
          </fieldset>

          <DialogFooter className='gap-2'>
            <Button type='button' variant='outline' onClick={() => setIsModalOpen(false)}>
              {isViewMode ? 'Close' : 'Cancel'}
            </Button>
            {!isViewMode && (
              <Button type='submit'>
                {editingName ? 'Update Middleware' : 'Create Middleware'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    );
  };

  /* ===========================
     Render
  =========================== */
  const filteredMiddlewares = allMiddlewares.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    const types = Object.keys(item.config).join(' ').toLowerCase();
    return item.name.toLowerCase().includes(searchLower) || types.includes(searchLower);
  });

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
          <div className='relative'>
            <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              type='search'
              placeholder='Search middlewares...'
              className='w-full sm:w-64 pl-9'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
              Showing {filteredMiddlewares.length} middleware
              {filteredMiddlewares.length !== 1 ? 's' : ''}
              {showLiveMiddlewares && (
                <span className='ml-2'>
                  ({filteredMiddlewares.filter((m) => m.source === 'configured').length} configured,
                  {filteredMiddlewares.filter((m) => m.source === 'live').length} live)
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

          <MiddlewaresTable
            middlewares={filteredMiddlewares}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      )}
    </div>
  );
}
