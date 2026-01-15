import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Eye,
  Filter,
  Globe,
  Layers,
  Lock,
  Network,
  RefreshCw,
  Search,
  Server,
  XCircle,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

interface Router {
  name: string;
  status: string;
  rule: string;
  service: string;
  entryPoints: string[];
  provider: string;
  using?: string[];
  tls?: {
    certResolver?: string;
    options?: string;
  };
  middlewares?: string[];
  priority?: number;
  [key: string]: any;
}

interface Service {
  name: string;
  status: string;
  type?: string;
  provider: string;
  serverStatus?: Record<string, string>;
  usedBy?: string[];
  loadBalancer?: {
    servers: Array<{ url: string }>;
    strategy: string;
  };
  [key: string]: any;
}

interface Middleware {
  name: string;
  status: string;
  type?: string;
  provider: string;
  usedBy?: string[];
  [key: string]: any;
}

interface StatusData {
  routers: Router[];
  services: Service[];
  middlewares: Middleware[];
}

export default function StatusPage() {
  const [data, setData] = useState<StatusData>({
    routers: [],
    services: [],
    middlewares: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRawData, setShowRawData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [servicesRes, routersRes, middlewaresRes] = await Promise.all([
        api.get('/traefik/status/services'),
        api.get('/traefik/status/routers'),
        api.get('/traefik/status/middlewares'),
      ]);

      setData({
        routers: Array.isArray(routersRes.data) ? routersRes.data : [],
        services: Array.isArray(servicesRes.data) ? servicesRes.data : [],
        middlewares: Array.isArray(middlewaresRes.data) ? middlewaresRes.data : [],
      });
    } catch (error) {
      toast.error('Failed to fetch status data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      enabled: 'default',
      disabled: 'secondary',
      error: 'destructive',
      success: 'default',
      up: 'default',
      down: 'destructive',
    };

    return (
      <Badge variant={variants[status.toLowerCase()] || 'secondary'} className='gap-1'>
        {status.toLowerCase() === 'enabled' || status.toLowerCase() === 'up' ? (
          <CheckCircle className='h-3 w-3' />
        ) : status.toLowerCase() === 'disabled' || status.toLowerCase() === 'down' ? (
          <XCircle className='h-3 w-3' />
        ) : (
          <AlertCircle className='h-3 w-3' />
        )}
        {status}
      </Badge>
    );
  };

  const getProviderBadge = (provider: string) => {
    const isInternal = provider.includes('internal');
    return (
      <Badge variant={isInternal ? 'secondary' : 'outline'} className='text-xs'>
        {provider}
      </Badge>
    );
  };

  const getServerStatus = (service: Service) => {
    if (!service.serverStatus) return null;

    const servers = Object.entries(service.serverStatus);
    const upCount = servers.filter(([_, status]) => status === 'UP').length;

    return (
      <div className='flex items-center gap-2 text-sm'>
        <Badge variant='outline' className='text-xs'>
          {upCount}/{servers.length} UP
        </Badge>
        {service.loadBalancer?.servers && (
          <span className='text-muted-foreground text-xs'>
            {service.loadBalancer.servers.length} server(s)
          </span>
        )}
      </div>
    );
  };

  const renderRouterCard = (router: Router) => (
    <Card key={router.name} className='overflow-hidden hover:shadow-md transition-shadow'>
      <CardHeader className='pb-2 bg-muted/30'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-sm font-medium truncate' title={router.name}>
            <div className='flex items-center gap-2'>
              <Globe className='h-4 w-4 text-muted-foreground' />
              <span className='truncate'>{router.name}</span>
            </div>
          </CardTitle>
          <div className='flex items-center gap-2'>
            {getStatusBadge(router.status)}
            {getProviderBadge(router.provider)}
          </div>
        </div>
      </CardHeader>
      <CardContent className='p-4 space-y-3'>
        <div className='space-y-2'>
          <div className='flex items-center justify-between text-sm'>
            <span className='font-medium'>Rule:</span>
            <code
              className='bg-muted px-2 py-1 rounded text-xs font-mono truncate max-w-50'
              title={router.rule}
            >
              {router.rule}
            </code>
          </div>

          <div className='flex items-center justify-between text-sm'>
            <span className='font-medium'>Service:</span>
            <span className='font-mono text-xs'>{router.service}</span>
          </div>

          {router.priority && (
            <div className='flex items-center justify-between text-sm'>
              <span className='font-medium'>Priority:</span>
              <Badge variant='outline' className='text-xs'>
                {router.priority}
              </Badge>
            </div>
          )}

          <div className='flex items-center justify-between text-sm'>
            <span className='font-medium'>Entry Points:</span>
            <div className='flex gap-1'>
              {router.entryPoints?.map((ep) => (
                <Badge key={ep} variant='secondary' className='text-xs'>
                  {ep}
                </Badge>
              ))}
            </div>
          </div>

          {router.tls && (
            <div className='flex items-center justify-between text-sm'>
              <span className='font-medium'>TLS:</span>
              <Badge variant='outline' className='text-xs gap-1'>
                <Lock className='h-3 w-3' />
                {router.tls.certResolver || 'Enabled'}
              </Badge>
            </div>
          )}

          {router.middlewares && router.middlewares.length > 0 && (
            <div className='flex items-center justify-between text-sm'>
              <span className='font-medium'>Middlewares:</span>
              <div className='flex flex-wrap gap-1 justify-end max-w-50'>
                {router.middlewares.map((mw) => (
                  <Badge key={mw} variant='outline' className='text-xs truncate'>
                    {mw}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {showRawData && (
          <div className='mt-3 pt-3 border-t'>
            <pre className='text-[10px] bg-muted p-2 rounded overflow-auto max-h-37.5 font-mono'>
              {JSON.stringify(router, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderServiceCard = (service: Service) => (
    <Card key={service.name} className='overflow-hidden hover:shadow-md transition-shadow'>
      <CardHeader className='pb-2 bg-muted/30'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-sm font-medium truncate' title={service.name}>
            <div className='flex items-center gap-2'>
              <Server className='h-4 w-4 text-muted-foreground' />
              <span className='truncate'>{service.name}</span>
            </div>
          </CardTitle>
          <div className='flex items-center gap-2'>
            {getStatusBadge(service.status)}
            {getProviderBadge(service.provider)}
          </div>
        </div>
      </CardHeader>
      <CardContent className='p-4 space-y-3'>
        <div className='space-y-2'>
          {service.type && (
            <div className='flex items-center justify-between text-sm'>
              <span className='font-medium'>Type:</span>
              <Badge variant='outline' className='text-xs'>
                {service.type}
              </Badge>
            </div>
          )}

          {getServerStatus(service)}

          {service.loadBalancer && (
            <div className='space-y-1'>
              <div className='flex items-center justify-between text-sm'>
                <span className='font-medium'>Servers:</span>
                <Badge variant='outline' className='text-xs'>
                  {service.loadBalancer.servers.length}
                </Badge>
              </div>
              <div className='space-y-1'>
                {service.loadBalancer.servers.map((server, index) => (
                  <div
                    key={index}
                    className='text-xs font-mono bg-muted px-2 py-1 rounded truncate'
                  >
                    {server.url}
                  </div>
                ))}
              </div>
            </div>
          )}

          {service.usedBy && service.usedBy.length > 0 && (
            <div className='flex items-center justify-between text-sm'>
              <span className='font-medium'>Used by:</span>
              <div className='flex flex-wrap gap-1 justify-end max-w-50'>
                {service.usedBy.map((router) => (
                  <Badge key={router} variant='outline' className='text-xs truncate'>
                    {router}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {showRawData && (
          <div className='mt-3 pt-3 border-t'>
            <pre className='text-[10px] bg-muted p-2 rounded overflow-auto max-h-37.5 font-mono'>
              {JSON.stringify(service, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderMiddlewareCard = (middleware: Middleware) => (
    <Card key={middleware.name} className='overflow-hidden hover:shadow-md transition-shadow'>
      <CardHeader className='pb-2 bg-muted/30'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-sm font-medium truncate' title={middleware.name}>
            <div className='flex items-center gap-2'>
              <Layers className='h-4 w-4 text-muted-foreground' />
              <span className='truncate'>{middleware.name}</span>
            </div>
          </CardTitle>
          <div className='flex items-center gap-2'>
            {getStatusBadge(middleware.status)}
            {getProviderBadge(middleware.provider)}
          </div>
        </div>
      </CardHeader>
      <CardContent className='p-4 space-y-3'>
        <div className='space-y-2'>
          {middleware.type && (
            <div className='flex items-center justify-between text-sm'>
              <span className='font-medium'>Type:</span>
              <Badge variant='outline' className='text-xs'>
                {middleware.type}
              </Badge>
            </div>
          )}

          {middleware.usedBy && middleware.usedBy.length > 0 && (
            <div className='flex items-center justify-between text-sm'>
              <span className='font-medium'>Used by:</span>
              <div className='flex flex-wrap gap-1 justify-end max-w-50'>
                {middleware.usedBy.map((router) => (
                  <Badge key={router} variant='outline' className='text-xs truncate'>
                    {router}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className='text-sm'>
            <span className='font-medium'>Configuration:</span>
            <div className='mt-1 bg-muted p-2 rounded text-xs font-mono overflow-x-auto'>
              {Object.entries(middleware)
                .filter(([key]) => !['name', 'status', 'provider', 'type', 'usedBy'].includes(key))
                .map(([key, value]) => (
                  <div key={key} className='flex gap-2'>
                    <span className='text-muted-foreground'>{key}:</span>
                    <span className='truncate'>
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {showRawData && (
          <div className='mt-3 pt-3 border-t'>
            <pre className='text-[10px] bg-muted p-2 rounded overflow-auto max-h-37.5 font-mono'>
              {JSON.stringify(middleware, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const filterItems = <T extends { name: string; status: string; provider: string }>(
    items: T[]
  ) => {
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesProvider = providerFilter === 'all' || item.provider === providerFilter;
      return matchesSearch && matchesStatus && matchesProvider;
    });
  };

  const renderList = <T extends { name: string; status: string; provider: string }>(
    items: T[],
    type: string,
    renderCard: (item: T) => ReactNode
  ) => {
    const filteredItems = filterItems(items);

    if (filteredItems.length === 0) {
      return (
        <div className='text-center py-8 text-muted-foreground'>
          <div className='mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2'>
            {type === 'routers' ? (
              <Globe className='h-6 w-6' />
            ) : type === 'services' ? (
              <Server className='h-6 w-6' />
            ) : (
              <Layers className='h-6 w-6' />
            )}
          </div>
          <p>No {type} found matching your criteria.</p>
        </div>
      );
    }

    return (
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {filteredItems.map(renderCard)}
      </div>
    );
  };

  const getStats = () => {
    const enabledRouters = data.routers?.filter((r) => r.status === 'enabled').length;
    const enabledServices = data.services?.filter((s) => s.status === 'enabled').length;
    const enabledMiddlewares = data.middlewares?.filter((m) => m.status === 'enabled').length;

    const internalRouters = data.routers?.filter((r) => r.provider.includes('internal')).length;
    const internalServices = data.services?.filter((s) => s.provider.includes('internal')).length;
    const internalMiddlewares = data.middlewares?.filter((m) =>
      m.provider.includes('internal')
    ).length;

    return {
      enabledRouters,
      enabledServices,
      enabledMiddlewares,
      internalRouters,
      internalServices,
      internalMiddlewares,
    };
  };

  const stats = getStats();

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold flex items-center gap-2'>
          <Activity className='h-6 w-6' /> Traefik Status Dashboard
        </h1>
        <div className='flex items-center gap-2'>
          <div className='flex items-center gap-2'>
            <Switch checked={showRawData} onCheckedChange={setShowRawData} id='raw-data' />
            <Label htmlFor='raw-data' className='flex items-center gap-1 text-sm'>
              <Eye className='h-4 w-4' />
              Raw Data
            </Label>
          </div>
          <Button variant='outline' size='sm' onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <Globe className='h-4 w-4' />
              Routers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between'>
              <div>
                <div className='text-2xl font-bold'>{data.routers.length}</div>
                <div className='text-sm text-muted-foreground'>Total</div>
              </div>
              <div className='text-right'>
                <div className='text-lg font-semibold text-green-600'>
                  {stats.enabledRouters} enabled
                </div>
                <div className='text-sm text-muted-foreground'>
                  {stats.internalRouters} internal
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <Server className='h-4 w-4' />
              Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between'>
              <div>
                <div className='text-2xl font-bold'>{data.services.length}</div>
                <div className='text-sm text-muted-foreground'>Total</div>
              </div>
              <div className='text-right'>
                <div className='text-lg font-semibold text-green-600'>
                  {stats.enabledServices} enabled
                </div>
                <div className='text-sm text-muted-foreground'>
                  {stats.internalServices} internal
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <Layers className='h-4 w-4' />
              Middlewares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between'>
              <div>
                <div className='text-2xl font-bold'>{data.middlewares.length}</div>
                <div className='text-sm text-muted-foreground'>Total</div>
              </div>
              <div className='text-right'>
                <div className='text-lg font-semibold text-green-600'>
                  {stats.enabledMiddlewares} enabled
                </div>
                <div className='text-sm text-muted-foreground'>
                  {stats.internalMiddlewares} internal
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue='routers' className='w-full'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4'>
          <TabsList>
            <TabsTrigger value='routers' className='flex items-center gap-2'>
              <Globe className='h-4 w-4' /> Routers
              <Badge variant='secondary' className='ml-1'>
                {data.routers.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value='services' className='flex items-center gap-2'>
              <Server className='h-4 w-4' /> Services
              <Badge variant='secondary' className='ml-1'>
                {data.services.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value='middlewares' className='flex items-center gap-2'>
              <Layers className='h-4 w-4' /> Middlewares
              <Badge variant='secondary' className='ml-1'>
                {data.middlewares.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <div className='flex flex-col sm:flex-row gap-2'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-9 w-full sm:w-48'
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-full sm:w-36'>
                <div className='flex items-center gap-2'>
                  <Filter className='h-4 w-4' />
                  <SelectValue placeholder='Status' />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='enabled'>Enabled</SelectItem>
                <SelectItem value='disabled'>Disabled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className='w-full sm:w-36'>
                <div className='flex items-center gap-2'>
                  <Network className='h-4 w-4' />
                  <SelectValue placeholder='Provider' />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Providers</SelectItem>
                <SelectItem value='file'>File</SelectItem>
                <SelectItem value='internal'>Internal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className='text-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto'></div>
            <p className='mt-2 text-muted-foreground'>Loading status data...</p>
          </div>
        ) : (
          <>
            <TabsContent value='routers' className='space-y-4'>
              {renderList(data.routers, 'routers', renderRouterCard)}
            </TabsContent>
            <TabsContent value='services' className='space-y-4'>
              {renderList(data.services, 'services', renderServiceCard)}
            </TabsContent>
            <TabsContent value='middlewares' className='space-y-4'>
              {renderList(data.middlewares, 'middlewares', renderMiddlewareCard)}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
