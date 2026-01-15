import { RoutersTable, type Router, type RouterWithSource } from '@/components/RoutersTable';
import { RuleBuilder, compileRule, type RuleBlock } from '@/components/RuleBuilder';
import { YAMLPreview } from '@/components/YAMLPreview';
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
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from '@/components/ui/multi-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';
import { Eye, EyeOff, Pencil, Plus, Search, Wand2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function RoutersPage() {
  const [allRouters, setAllRouters] = useState<RouterWithSource[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [certResolvers, setCertResolvers] = useState<string[]>([]);
  const [internalServices, setInternalServices] = useState<string[]>([]);
  const [middlewaresList, setMiddlewaresList] = useState<string[]>([]);
  const [protocol, setProtocol] = useState<'http' | 'tcp' | 'udp'>('http');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRouterName, setEditingRouterName] = useState<string | null>(null);
  const [showLiveRouters, setShowLiveRouters] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isViewMode, setIsViewMode] = useState(false);

  /* ===========================
     Router Fields
  =========================== */
  const [name, setName] = useState('');
  const [service, setService] = useState('');
  const [entryPoints, setEntryPoints] = useState<string[]>(['websecure']);
  const [middlewares, setMiddlewares] = useState<string[]>([]);
  const [priority, setPriority] = useState<number | undefined>();
  const [tlsEnabled, setTlsEnabled] = useState(false);
  const [certResolver, setCertResolver] = useState('');

  /* ===========================
     Rule Builder State
  =========================== */
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [domain, setDomain] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [path, setPath] = useState('');
  const [usePathPrefix, setUsePathPrefix] = useState(false);
  const [methods, setMethods] = useState<string[]>([]);
  const [rawRule, setRawRule] = useState('');

  /* ===========================
     Normalize Router Data from API
  =========================== */
  const normalizeLiveRouter = (routerData: any): Router => {
    if (!routerData) return {} as Router;

    try {
      const router: Router = {
        entryPoints: routerData.entryPoints || [],
        rule: routerData.rule || '',
        service: routerData.service || '',
      };

      // Extract middlewares
      if (routerData.middlewares && Array.isArray(routerData.middlewares)) {
        router.middlewares = routerData.middlewares;
      }

      // Extract priority
      if (routerData.priority !== undefined) {
        router.priority = routerData.priority;
      }

      // Extract TLS configuration
      if (routerData.tls) {
        router.tls = {};
        if (routerData.tls.certResolver) {
          router.tls.certResolver = routerData.tls.certResolver;
        }
        if (routerData.tls.passthrough !== undefined) {
          router.tls.passthrough = routerData.tls.passthrough;
        }
      }

      return router;
    } catch (error) {
      console.error('Error normalizing live router:', error);
      return {} as Router;
    }
  };

  /* ===========================
     Fetch Config
  =========================== */
  const fetchAll = async () => {
    try {
      setIsLoading(true);
      const routerEndpoint =
        protocol === 'http' ? '/traefik/routers' : `/traefik/${protocol}/routers`;
      const serviceEndpoint =
        protocol === 'http' ? '/traefik/services' : `/traefik/${protocol}/services`;

      // Fetch all data in parallel
      const [
        configuredRoutersResponse,
        servicesResponse,
        middlewaresResponse,
        internalServicesResponse,
        certResolversResponse,
        liveRoutersResponse,
      ] = await Promise.all([
        api.get(routerEndpoint).catch(() => ({ data: {} })),
        api.get(serviceEndpoint).catch(() => ({ data: {} })),
        protocol === 'http'
          ? api.get('/traefik/middlewares').catch(() => ({ data: {} }))
          : Promise.resolve({ data: {} }),
        api.get('/traefik/status/services').catch(() => ({ data: [] })),
        api.get('/traefik/certificates-resolvers').catch(() => ({ data: {} })),
        // Fetch live routers from Traefik API
        api.get('/traefik/status/routers').catch(() => ({ data: {} })),
      ]);

      // Process configured routers
      setServices(Object.keys(servicesResponse.data || {}));
      setInternalServices(internalServicesResponse.data?.map((s: any) => s.name) || []);
      setMiddlewaresList(Object.keys(middlewaresResponse.data || {}));
      setCertResolvers(Object.keys(certResolversResponse.data || {}));

      // Process live routers
      const liveRoutersData = liveRoutersResponse.data || {};

      // Combine and deduplicate routers
      const allRoutersList: RouterWithSource[] = [];

      // Add configured routers first
      Object.entries(configuredRoutersResponse.data || {}).forEach(([routerName, router]) => {
        allRoutersList.push({
          name: routerName,
          router: router as Router,
          source: 'configured',
          protocol,
        });
      });

      // Add live routers that are not already in configured routers
      if (showLiveRouters) {
        Object.entries(liveRoutersData).forEach(([routerName, routerData]) => {
          // Check if this router is already in configured routers
          const isAlreadyConfigured = allRoutersList.some((r) => r.name === routerName);
          if (!isAlreadyConfigured) {
            const normalizedRouter = normalizeLiveRouter(routerData);
            allRoutersList.push({
              name: routerName,
              router: normalizedRouter,
              source: 'live',
              protocol,
            });
          }
        });
      }

      setAllRouters(allRoutersList);
    } catch (error) {
      console.error('Error loading routers:', error);
      toast.error('Failed to load Traefik configuration');
      setAllRouters([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [protocol, showLiveRouters]);

  /* ===========================
     Open / Edit
  =========================== */
  const openAddModal = () => {
    setIsViewMode(false);
    setEditingRouterName(null);
    setName('');
    setService('');
    setEntryPoints(['websecure']);
    setMiddlewares([]);
    setPriority(undefined);
    setTlsEnabled(false);
    setCertResolver('');
    setMode('simple');
    setDomain('');
    setUseRegex(false);
    setPath('');
    setUsePathPrefix(false);
    setMethods([]);
    setRawRule('');
    setIsModalOpen(true);
  };

  const handleEdit = (routerName: string, r: Router, source: 'configured' | 'live') => {
    setIsViewMode(source === 'live');

    setEditingRouterName(routerName);
    setName(routerName);
    setService(r.service);
    setEntryPoints(r.entryPoints || []);
    setMiddlewares(r.middlewares || []);
    setPriority(r.priority);
    setTlsEnabled(!!r.tls);
    setCertResolver(r.tls?.certResolver || '');
    setRawRule(r.rule);
    setMode('advanced');
    setIsModalOpen(true);
  };

  /* ===========================
     Delete
  =========================== */
  const handleDelete = async (routerName: string) => {
    // Only allow deletion of configured routers
    const routerToDelete = allRouters.find(
      (r) => r.name === routerName && r.source === 'configured'
    );
    if (!routerToDelete) {
      toast.error('Cannot delete live routers from Traefik API');
      return;
    }

    if (!confirm(`Delete router "${routerName}"?`)) return;
    try {
      const endpoint = protocol === 'http' ? '/traefik/routers' : `/traefik/${protocol}/routers`;
      await api.delete(`${endpoint}/${routerName}`);
      toast.success('Router deleted');
      fetchAll();
    } catch {
      toast.error('Failed to delete router');
    }
  };

  /* ===========================
     Submit
  =========================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Router name is required');
      return;
    }

    let compiledRule = '';
    if (protocol === 'http') {
      compiledRule =
        mode === 'simple'
          ? compileRule(
              [
                domain
                  ? useRegex
                    ? { type: 'hostRegexp', value: domain }
                    : { type: 'host', value: domain }
                  : null,
                path
                  ? usePathPrefix
                    ? { type: 'pathPrefix', value: path }
                    : { type: 'path', value: path }
                  : null,
                ...methods.map((m) => ({ type: 'method', value: m })),
              ].filter(Boolean) as RuleBlock[]
            )
          : rawRule;
    } else if (protocol === 'tcp') {
      compiledRule = rawRule; // For TCP, we just use the raw rule input for HostSNI
    }

    if (protocol !== 'udp' && !compiledRule.trim()) {
      toast.error('Rule is required');
      return;
    }

    if (!service) {
      toast.error('Service is required');
      return;
    }

    const payload: Router = {
      entryPoints,
      rule: protocol === 'udp' ? '' : compiledRule,
      service,
    };
    if (protocol === 'http') {
      if (middlewares.length) payload.middlewares = middlewares;
      if (priority !== undefined) payload.priority = priority;
    }
    if (protocol !== 'udp')
      payload.tls = !tlsEnabled
        ? {}
        : certResolver
        ? { certResolver }
        : protocol === 'tcp'
        ? { passthrough: true }
        : {};

    try {
      const endpoint = protocol === 'http' ? '/traefik/routers' : `/traefik/${protocol}/routers`;

      await api.post(`${endpoint}/${name}`, payload);
      if (editingRouterName) {
        toast.success('Router updated successfully');
      } else {
        toast.success('Router created successfully');
      }

      setIsModalOpen(false);
      fetchAll();
    } catch {
      toast.error('Failed to save router');
    }
  };

  /* ===========================
     Render Router Modal
  =========================== */
  const renderRouterForm = () => {
    const currentRouter: Router = {
      entryPoints,
      rule:
        protocol === 'http'
          ? mode === 'simple'
            ? compileRule(
                [
                  domain
                    ? useRegex
                      ? { type: 'hostRegexp', value: domain }
                      : { type: 'host', value: domain }
                    : null,
                  path
                    ? usePathPrefix
                      ? { type: 'pathPrefix', value: path }
                      : { type: 'path', value: path }
                    : null,
                  ...methods.map((m) => ({ type: 'method', value: m })),
                ].filter(Boolean) as RuleBlock[]
              )
            : rawRule
          : rawRule,
      service,
      middlewares: middlewares.length ? middlewares : undefined,
      priority,
      tls: tlsEnabled
        ? certResolver
          ? { certResolver }
          : protocol === 'tcp'
          ? { passthrough: true }
          : {}
        : undefined,
    };

    return (
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            {isViewMode ? (
              <>
                <Eye className='h-5 w-5' />
                View Router: <Badge variant='outline'>{editingRouterName}</Badge>
              </>
            ) : editingRouterName ? (
              <>
                <Pencil className='h-5 w-5' />
                Edit Router: <Badge variant='outline'>{editingRouterName}</Badge>
              </>
            ) : (
              <>
                <Plus className='h-5 w-5' />
                Create New Router
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
                  <Label htmlFor='routerName' className='mb-2 block'>
                    Router Name
                  </Label>
                  <Input
                    id='routerName'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!!editingRouterName}
                    placeholder='my-router'
                    className='font-mono'
                  />
                </div>
                <div>
                  <Label htmlFor='service' className='mb-2 block'>
                    Service{' '}
                    <Badge variant='outline' className='ml-2 text-xs'>
                      Required
                    </Badge>
                  </Label>
                  <Select value={service} onValueChange={setService}>
                    <SelectTrigger id='service'>
                      <SelectValue placeholder='Select a service...' />
                    </SelectTrigger>
                    <SelectContent>
                      {[...services, ...internalServices].map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {protocol === 'http' && (
              <RuleBuilder
                mode={mode}
                setMode={setMode}
                domain={domain}
                setDomain={setDomain}
                useRegex={useRegex}
                setUseRegex={setUseRegex}
                path={path}
                setPath={setPath}
                usePathPrefix={usePathPrefix}
                setUsePathPrefix={setUsePathPrefix}
                methods={methods}
                setMethods={setMethods}
                rawRule={rawRule}
                setRawRule={setRawRule}
              />
            )}

            {protocol === 'tcp' && (
              <div className='grid gap-4 rounded-lg border p-4'>
                <Label>Rule</Label>
                <Input
                  value={rawRule}
                  onChange={(e) => setRawRule(e.target.value)}
                  placeholder='HostSNI(`example.com`)'
                />
              </div>
            )}

            <div className='grid gap-4 rounded-lg border p-4'>
              <Label className='text-base font-semibold'>Additional Settings</Label>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-3'>
                  <Label>Entry Points</Label>
                  <div className='flex flex-col gap-2'>
                    {(protocol === 'udp' ? ['udp'] : ['web', 'websecure']).map((ep) => (
                      <label key={ep} className='flex items-center gap-2'>
                        <Checkbox
                          checked={entryPoints.includes(ep)}
                          onCheckedChange={(v) =>
                            setEntryPoints(
                              v ? [...entryPoints, ep] : entryPoints.filter((e) => e !== ep)
                            )
                          }
                        />
                        <span className='text-sm'>{ep}</span>
                        {ep === 'websecure' && (
                          <Badge variant='secondary' className='text-xs'>
                            Default
                          </Badge>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {protocol === 'http' && (
                  <div className='space-y-3'>
                    <Label>Middlewares (Optional)</Label>
                    <MultiSelect values={middlewares} onValuesChange={setMiddlewares}>
                      <MultiSelectTrigger>
                        <MultiSelectValue placeholder='Select middlewares...' />
                      </MultiSelectTrigger>
                      <MultiSelectContent>
                        <MultiSelectGroup>
                          {middlewaresList.map((m) => (
                            <MultiSelectItem key={m} value={m}>
                              {m}
                            </MultiSelectItem>
                          ))}
                        </MultiSelectGroup>
                      </MultiSelectContent>
                    </MultiSelect>
                  </div>
                )}
              </div>

              {protocol !== 'udp' && (
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='priority'>Priority (Optional)</Label>
                    <Input
                      id='priority'
                      type='number'
                      value={priority ?? ''}
                      onChange={(e) =>
                        setPriority(e.target.value ? Number(e.target.value) : undefined)
                      }
                      placeholder='0-100'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label className='flex items-center gap-2'>
                      <Checkbox checked={tlsEnabled} onCheckedChange={(v) => setTlsEnabled(!!v)} />
                      Enable TLS {protocol === 'tcp' && '(Passthrough)'}
                    </Label>
                    {tlsEnabled && protocol === 'http' && (
                      <Select value={certResolver} onValueChange={setCertResolver}>
                        <SelectTrigger id='service'>
                          <SelectValue placeholder='Select a certResolver...' />
                        </SelectTrigger>
                        <SelectContent>
                          {[...certResolvers].map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              )}
            </div>

            {name && <YAMLPreview router={currentRouter} name={name} />}
          </fieldset>

          <DialogFooter className='gap-2'>
            <Button type='button' variant='outline' onClick={() => setIsModalOpen(false)}>
              {isViewMode ? 'Close' : 'Cancel'}
            </Button>
            {!isViewMode && (
              <Button type='submit'>{editingRouterName ? 'Update Router' : 'Create Router'}</Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    );
  };

  /* ===========================
     Render
  =========================== */
  const filteredRouters = allRouters.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchLower) ||
      item.router.rule.toLowerCase().includes(searchLower) ||
      item.router.service.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center flex-wrap gap-4'>
        <div className='flex  items-start flex-col gap-2 flex-wrap'>
          <h1 className='text-2xl font-bold'>Routers</h1>
          <p className='text-muted-foreground'>
            Define rules to route incoming HTTP requests to services
          </p>
        </div>
        <div className='flex   items-center gap-4 flex-wrap'>
          <Tabs className='flex-1' value={protocol} onValueChange={(v) => setProtocol(v as any)}>
            <TabsList className='flex justify-stretch '>
              <TabsTrigger className='flex-1' value='http'>
                HTTP
              </TabsTrigger>
              <TabsTrigger className='flex-1' value='tcp'>
                TCP
              </TabsTrigger>
              <TabsTrigger className='flex-1' value='udp'>
                UDP
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className='relative'>
            <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              type='search'
              placeholder='Search routers...'
              className='w-full sm:w-64 pl-9'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowLiveRouters(!showLiveRouters)}
              className='flex items-center gap-2'
            >
              {showLiveRouters ? (
                <>
                  <EyeOff className='h-4 w-4' />
                  Hide Live Routers
                </>
              ) : (
                <>
                  <Eye className='h-4 w-4' />
                  Show Live Routers
                </>
              )}
            </Button>
            <Button className='flex-1' onClick={openAddModal}>
              <Plus className='mr-2 h-4 w-4' /> Add Router
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {renderRouterForm()}
      </Dialog>

      {isLoading ? (
        <div className='text-center py-12'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto'></div>
          <p className='mt-2 text-muted-foreground'>Loading routers...</p>
        </div>
      ) : allRouters.length === 0 ? (
        <div className='text-center py-12 rounded-lg border-2 border-dashed'>
          <Wand2 className='h-12 w-12 mx-auto text-muted-foreground' />
          <h3 className='mt-4 text-lg font-semibold'>No routers configured</h3>
          <p className='text-muted-foreground mt-2'>Get started by creating your first router</p>
          <Button onClick={openAddModal} className='mt-4'>
            <Plus className='mr-2 h-4 w-4' /> Create Router
          </Button>
        </div>
      ) : (
        <div className='space-y-4'>
          <div className='flex items-center justify-between text-sm text-muted-foreground'>
            <div>
              Showing {filteredRouters.length} router{filteredRouters.length !== 1 ? 's' : ''}
              {showLiveRouters && (
                <span className='ml-2'>
                  ({filteredRouters.filter((r) => r.source === 'configured').length} configured,
                  {filteredRouters.filter((r) => r.source === 'live').length} live)
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

          <RoutersTable
            routers={filteredRouters}
            protocol={protocol}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      )}
    </div>
  );
}
