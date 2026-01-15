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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';
import {
  AlertCircle,
  Code,
  ExternalLink,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
  Wand2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Router {
  entryPoints: string[];
  rule: string;
  service: string;
  middlewares?: string[];
  priority?: number;
  tls?: { certResolver?: string; passthrough?: boolean };
}

interface RouterWithSource {
  name: string;
  router: Router;
  source: 'configured' | 'live'; // 'configured' = from panel, 'live' = from Traefik API
  protocol: 'http' | 'tcp' | 'udp';
}

/* ===========================
   Rule Builder Types
=========================== */
type RuleBlock =
  | { type: 'host'; value: string }
  | { type: 'hostRegexp'; value: string }
  | { type: 'path'; value: string }
  | { type: 'pathPrefix'; value: string }
  | { type: 'method'; value: string };

function compileRule(blocks: RuleBlock[]): string {
  if (!blocks.length) return '';
  return blocks
    .map((b) => {
      switch (b.type) {
        case 'host':
          return `Host(\`${b.value}\`)`;
        case 'hostRegexp':
          return `HostRegexp(\`${b.value}\`)`;
        case 'path':
          return `Path(\`${b.value}\`)`;
        case 'pathPrefix':
          return `PathPrefix(\`${b.value}\`)`;
        case 'method':
          return `Method(\`${b.value}\`)`;
      }
    })
    .join(' && ');
}

/* ===========================
   Rule Display Component
=========================== */
function RuleDisplay({ rule }: { rule: string }) {
  const parts = rule.split(' && ');

  return (
    <div className='flex flex-wrap gap-1'>
      {parts.map((part, i) => {
        const match = part.match(/^(\w+)\(`([^`]+)`\)$/);
        if (!match)
          return (
            <Badge key={i} variant='outline'>
              {part}
            </Badge>
          );

        const [, type, value] = match;
        let variant: 'default' | 'secondary' | 'outline' = 'outline';
        let displayType = type;

        switch (type) {
          case 'Host':
            variant = 'default';
            break;
          case 'Path':
          case 'PathPrefix':
            variant = 'secondary';
            break;
          case 'Method':
            displayType = 'method';
            break;
          case 'HostRegexp':
            displayType = 'regex';
            break;
        }

        return (
          <div key={i} className='flex items-center gap-1'>
            {i > 0 && <span className='text-muted-foreground text-sm'>&&</span>}
            <Badge variant={variant} className='font-mono text-xs'>
              {displayType}: {value}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}

/* ===========================
   Rule Builder Component
=========================== */
function RuleBuilder({
  mode,
  setMode,
  domain,
  setDomain,
  useRegex,
  setUseRegex,
  path,
  setPath,
  usePathPrefix,
  setUsePathPrefix,
  methods,
  setMethods,
  rawRule,
  setRawRule,
}: {
  mode: 'simple' | 'advanced';
  setMode: (mode: 'simple' | 'advanced') => void;
  domain: string;
  setDomain: (domain: string) => void;
  useRegex: boolean;
  setUseRegex: (use: boolean) => void;
  path: string;
  setPath: (path: string) => void;
  usePathPrefix: boolean;
  setUsePathPrefix: (use: boolean) => void;
  methods: string[];
  setMethods: (methods: string[]) => void;
  rawRule: string;
  setRawRule: (rule: string) => void;
}) {
  const compiledRule = compileRule(
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
  );

  const exampleRules = [
    { label: 'Basic Domain', value: 'Host(`example.com`)' },
    { label: 'Domain with Path', value: 'Host(`example.com`) && Path(`/api`)' },
    {
      label: 'Multiple Domains',
      value: 'Host(`api.example.com`, `api.test.com`)',
    },
    { label: 'Regex Domain', value: 'HostRegexp(`^api\\..+\\.com$`)' },
    {
      label: 'Path Prefix',
      value: 'Host(`example.com`) && PathPrefix(`/v2/`)',
    },
  ];

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <Label className='text-base font-semibold'>Rule Configuration</Label>
        <Tabs value={mode} onValueChange={(v) => setMode(v as 'simple' | 'advanced')}>
          <TabsList>
            <TabsTrigger value='simple' className='flex items-center gap-2'>
              <Wand2 className='h-4 w-4' />
              Simple Builder
            </TabsTrigger>
            <TabsTrigger value='advanced' className='flex items-center gap-2'>
              <Code className='h-4 w-4' />
              Raw Rule
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {mode === 'simple' ? (
        <div className='space-y-4 rounded-lg border p-4'>
          <div className='space-y-2'>
            <Label htmlFor='domain' className='flex items-center gap-2'>
              Domain
              <Badge variant='outline' className='ml-2 text-xs'>
                Required
              </Badge>
            </Label>
            <div className='flex gap-2'>
              <Input
                id='domain'
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder='example.com or ^api\..+\.com$'
                className='flex-1'
              />
              <div className='flex items-center gap-2'>
                <Checkbox
                  id='useRegex'
                  checked={useRegex}
                  onCheckedChange={(v) => setUseRegex(!!v)}
                />
                <Label htmlFor='useRegex' className='text-sm cursor-pointer'>
                  Regex
                </Label>
              </div>
            </div>
            {useRegex && (
              <div className='flex items-center gap-2 text-sm text-amber-600'>
                <AlertCircle className='h-4 w-4' />
                <span>Use ^api\\..+\\.com$ for domains starting with "api."</span>
              </div>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='path' className='text-muted-foreground'>
              Path (Optional)
            </Label>
            <div className='flex gap-2'>
              <Input
                id='path'
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder='/api or /v2/users'
                className='flex-1'
              />
              <div className='flex items-center gap-2'>
                <Checkbox
                  id='usePathPrefix'
                  checked={usePathPrefix}
                  onCheckedChange={(v) => setUsePathPrefix(!!v)}
                />
                <Label htmlFor='usePathPrefix' className='text-sm cursor-pointer'>
                  Prefix
                </Label>
              </div>
            </div>
          </div>

          <div className='space-y-2'>
            <Label className='text-muted-foreground'>HTTP Methods (Optional)</Label>
            <MultiSelect values={methods} onValuesChange={setMethods}>
              <MultiSelectTrigger>
                <MultiSelectValue placeholder='Select methods...' />
              </MultiSelectTrigger>
              <MultiSelectContent>
                <MultiSelectGroup>
                  {['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].map((m) => (
                    <MultiSelectItem key={m} value={m}>
                      {m}
                    </MultiSelectItem>
                  ))}
                </MultiSelectGroup>
              </MultiSelectContent>
            </MultiSelect>
          </div>

          {compiledRule && (
            <div className='space-y-2 rounded-md bg-muted/50 p-3'>
              <Label className='text-sm'>Generated Rule</Label>
              <RuleDisplay rule={compiledRule} />
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <Code className='h-3 w-3' />
                <code className='text-xs'>{compiledRule}</code>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className='space-y-4'>
          <div className='rounded-lg border p-4'>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='rawRule'>Raw Rule Expression</Label>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => setRawRule(compiledRule)}
                  disabled={!domain}
                >
                  Use Simple Builder Rule
                </Button>
              </div>
              <textarea
                id='rawRule'
                value={rawRule}
                onChange={(e) => setRawRule(e.target.value)}
                placeholder='Host(`example.com`) && PathPrefix(`/api`)'
                className='w-full min-h-[100px] font-mono text-sm p-3 rounded-md border bg-background resize-y'
                spellCheck={false}
              />
              <div className='space-y-2'>
                <Label className='text-sm'>Quick Examples:</Label>
                <div className='flex flex-wrap gap-2'>
                  {exampleRules.map((example, i) => (
                    <Button
                      key={i}
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => setRawRule(example.value)}
                      className='h-auto py-1 px-2 text-xs'
                    >
                      {example.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===========================
   YAML Preview Component
=========================== */
function YAMLPreview({ router, name }: { router: Router; name: string }) {
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

/* ===========================
   Page Component
=========================== */
export default function RoutersPage() {
  const [configuredRouters, setConfiguredRouters] = useState<Record<string, Router>>({});
  const [liveRouters, setLiveRouters] = useState<Record<string, any>>({});
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
      setConfiguredRouters(configuredRoutersResponse.data || {});
      setServices(Object.keys(servicesResponse.data || {}));
      setInternalServices(internalServicesResponse.data?.map((s: any) => s.name) || []);
      setMiddlewaresList(Object.keys(middlewaresResponse.data || {}));
      setCertResolvers(Object.keys(certResolversResponse.data || {}));

      // Process live routers
      const liveRoutersData = liveRoutersResponse.data || {};
      setLiveRouters(liveRoutersData);

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

  const handleEdit = (routerName: string, r: Router) => {
    // Only allow editing of configured routers
    const routerToEdit = allRouters.find((r) => r.name === routerName && r.source === 'configured');
    if (!routerToEdit) {
      toast.error('Cannot edit live routers from Traefik API');
      return;
    }

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

      if (editingRouterName) {
        await api.put(`${endpoint}/${name}`, payload);
        toast.success('Router updated successfully');
      } else {
        await api.post(`${endpoint}/${name}`, payload);
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
            {editingRouterName ? (
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

          <DialogFooter className='gap-2'>
            <Button type='button' variant='outline' onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type='submit'>{editingRouterName ? 'Update Router' : 'Create Router'}</Button>
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
              Showing {allRouters.length} router{allRouters.length !== 1 ? 's' : ''}
              {showLiveRouters && (
                <span className='ml-2'>
                  ({allRouters.filter((r) => r.source === 'configured').length} configured,
                  {allRouters.filter((r) => r.source === 'live').length} live)
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
                  <TableHead>Rule</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Entry Points</TableHead>
                  <TableHead>TLS</TableHead>
                  <TableHead className='w-[100px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allRouters.map(({ name, router, source }) => (
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
                      {protocol === 'http' ? (
                        <RuleDisplay rule={router.rule} />
                      ) : (
                        router.rule || '-'
                      )}
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
                              onClick={() => handleEdit(name, router)}
                              title='Edit router'
                            >
                              <Pencil className='h-4 w-4' />
                            </Button>
                            <Button
                              size='icon'
                              variant='ghost'
                              onClick={() => handleDelete(name)}
                              title='Delete router'
                            >
                              <Trash2 className='h-4 w-4 text-destructive' />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size='icon'
                            variant='ghost'
                            disabled
                            title='Live routers are read-only'
                          >
                            <Eye className='h-4 w-4 text-muted-foreground' />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
