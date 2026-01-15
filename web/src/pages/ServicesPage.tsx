import { ServiceYAMLPreview } from '@/components/ServiceYAMLPreview';
import { ServicesTable, type Service, type ServiceWithSource } from '@/components/ServicesTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';
import { Eye, EyeOff, Pencil, Plus, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ApiService {
  name?: string;
  loadBalancer?: {
    servers?: Array<{ url?: string; address?: string }>;
    healthCheck?: {
      path?: string;
      interval?: string;
      timeout?: string;
    };
  };
  [key: string]: any;
}

// Type guards
const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isService = (value: unknown): value is Service => {
  if (!isRecord(value)) return false;
  if (!value.loadBalancer || !isRecord(value.loadBalancer)) return false;
  if (!Array.isArray(value.loadBalancer.servers)) return false;
  return true;
};

const isApiService = (value: unknown): value is ApiService => {
  return isRecord(value);
};

const isValidServiceName = (name: unknown): name is string => {
  return typeof name === 'string' && name.length > 0;
};

export default function ServicesPage() {
  const [allServices, setAllServices] = useState<ServiceWithSource[]>([]);
  const [protocol, setProtocol] = useState<'http' | 'tcp' | 'udp'>('http');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [showLiveServices, setShowLiveServices] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isViewMode, setIsViewMode] = useState(false);

  const [name, setName] = useState('');
  const [serverUrls, setServerUrls] = useState<string[]>(['']);
  const [healthCheckPath, setHealthCheckPath] = useState('');
  const [healthCheckInterval, setHealthCheckInterval] = useState('');
  const [healthCheckTimeout, setHealthCheckTimeout] = useState('');

  /* ===========================
     Normalize Service Data from API
  =========================== */
  const normalizeApiService = (apiService: ApiService): Service => {
    if (!apiService) return { loadBalancer: { servers: [] } };

    const loadBalancer = apiService.loadBalancer || {};
    const servers = Array.isArray(loadBalancer.servers)
      ? loadBalancer.servers.filter(
          (s): s is { url?: string; address?: string } =>
            isRecord(s) && (typeof s.url === 'string' || typeof s.address === 'string')
        )
      : [];

    return {
      loadBalancer: {
        servers,
        healthCheck:
          loadBalancer.healthCheck && isRecord(loadBalancer.healthCheck)
            ? {
                path:
                  typeof loadBalancer.healthCheck.path === 'string'
                    ? loadBalancer.healthCheck.path
                    : undefined,
                interval:
                  typeof loadBalancer.healthCheck.interval === 'string'
                    ? loadBalancer.healthCheck.interval
                    : undefined,
                timeout:
                  typeof loadBalancer.healthCheck.timeout === 'string'
                    ? loadBalancer.healthCheck.timeout
                    : undefined,
              }
            : undefined,
      },
    };
  };

  /* ===========================
     Fetch Services
  =========================== */
  const fetchServices = async () => {
    try {
      setIsLoading(true);

      // Fetch manually configured services
      const configEndpoint =
        protocol === 'http' ? '/traefik/services' : `/traefik/${protocol}/services`;
      const configRes = await api.get(configEndpoint).catch(() => ({ data: {} }));

      // Type check and validate configured services
      let configuredServices: Record<string, Service> = {};
      if (configRes.data && isRecord(configRes.data)) {
        Object.entries(configRes.data).forEach(([key, value]) => {
          if (isService(value)) {
            configuredServices[key] = value;
          }
        });
      }

      // Fetch services from Traefik API status
      const statusEndpoint =
        protocol === 'http' ? '/traefik/status/services' : `/traefik/status/${protocol}/services`;
      let apiServices: ApiService[] = [];
      try {
        const statusRes = await api.get(statusEndpoint);
        if (Array.isArray(statusRes.data)) {
          apiServices = statusRes.data.filter(isApiService);
        }
      } catch (err) {
        console.warn('Failed to fetch status services:', err);
      }

      // Combine services
      const allServicesList: ServiceWithSource[] = [];

      // Add configured services first
      Object.entries(configuredServices).forEach(([serviceName, service]) => {
        allServicesList.push({
          name: serviceName,
          service,
          source: 'configured',
          protocol,
        });
      });

      // Add live services that are not already in configured services
      if (showLiveServices) {
        apiServices.forEach((apiService) => {
          const serviceName = apiService.name;
          if (isValidServiceName(serviceName) && !configuredServices[serviceName]) {
            allServicesList.push({
              name: serviceName,
              service: normalizeApiService(apiService),
              source: 'live',
              protocol,
              isApiService: true,
            });
          }
        });
      }

      setAllServices(allServicesList);
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error('Failed to load services');
      setAllServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [protocol, showLiveServices]);

  /* ===========================
     Open / Edit
  =========================== */
  const openAddModal = () => {
    setIsViewMode(false);
    setEditingName(null);
    setName('');
    setServerUrls(['']);
    setHealthCheckPath('');
    setHealthCheckInterval('');
    setHealthCheckTimeout('');
    setIsModalOpen(true);
  };

  const handleEdit = (serviceName: string, service: Service, source: 'configured' | 'live') => {
    setIsViewMode(source === 'live');

    setEditingName(serviceName);
    setName(serviceName);
    const servers = service.loadBalancer?.servers || [];
    setServerUrls(servers.length > 0 ? servers.map((s) => s.url || s.address || '') : ['']);
    const healthCheck = service.loadBalancer?.healthCheck;
    setHealthCheckPath(healthCheck?.path || '');
    setHealthCheckInterval(healthCheck?.interval || '');
    setHealthCheckTimeout(healthCheck?.timeout || '');
    setIsModalOpen(true);
  };

  /* ===========================
     Delete
  =========================== */
  const handleDelete = async (serviceName: string, source: 'configured' | 'live') => {
    // Only allow deletion of configured services
    if (source === 'live') {
      toast.error('Cannot delete services from Traefik API');
      return;
    }

    if (!confirm(`Delete service "${serviceName}"?`)) return;
    try {
      const endpoint = protocol === 'http' ? '/traefik/services' : `/traefik/${protocol}/services`;
      await api.delete(`${endpoint}/${serviceName}`);
      toast.success('Service deleted');
      fetchServices();
    } catch {
      toast.error('Error deleting service');
    }
  };

  /* ===========================
     Submit
  =========================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      toast.error('Service name is required');
      return;
    }

    const filteredUrls = serverUrls.filter((url) => url.trim() !== '');
    if (filteredUrls.length === 0) {
      toast.error('At least one server URL/address is required');
      return;
    }

    const payload: any = {
      loadBalancer: {
        servers: filteredUrls.map((url) => (protocol === 'http' ? { url } : { address: url })),
      },
    };

    // Add health check if any field is provided
    if (healthCheckPath.trim() || healthCheckInterval.trim() || healthCheckTimeout.trim()) {
      payload.loadBalancer.healthCheck = {};
      if (healthCheckPath.trim()) {
        payload.loadBalancer.healthCheck.path = healthCheckPath.trim();
      }
      if (healthCheckInterval.trim()) {
        payload.loadBalancer.healthCheck.interval = healthCheckInterval.trim();
      }
      if (healthCheckTimeout.trim()) {
        payload.loadBalancer.healthCheck.timeout = healthCheckTimeout.trim();
      }
    }

    try {
      const endpoint = protocol === 'http' ? '/traefik/services' : `/traefik/${protocol}/services`;

      await api.post(`${endpoint}/${trimmedName}`, payload);
      if (editingName) {
        toast.success('Service updated successfully');
      } else {
        toast.success('Service created successfully');
      }

      setIsModalOpen(false);
      fetchServices();
    } catch (error: any) {
      console.error('Error saving service:', error);
      toast.error(`Failed to save service: ${error.response?.data?.message || error.message}`);
    }
  };

  const addServerUrl = () => {
    setServerUrls([...serverUrls, '']);
  };

  const removeServerUrl = (index: number) => {
    if (serverUrls.length > 1) {
      setServerUrls(serverUrls.filter((_, i) => i !== index));
    }
  };

  const updateServerUrl = (index: number, value: string) => {
    const newUrls = [...serverUrls];
    newUrls[index] = value;
    setServerUrls(newUrls);
  };

  /* ===========================
     Render Service Modal
  =========================== */
  const renderServiceForm = () => {
    const currentService: Service = {
      loadBalancer: {
        servers: serverUrls
          .filter((url) => url.trim() !== '')
          .map((url) => (protocol === 'http' ? { url } : { address: url })),
        healthCheck:
          healthCheckPath.trim() || healthCheckInterval.trim() || healthCheckTimeout.trim()
            ? {
                path: healthCheckPath.trim() || undefined,
                interval: healthCheckInterval.trim() || undefined,
                timeout: healthCheckTimeout.trim() || undefined,
              }
            : undefined,
      },
    };

    return (
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            {isViewMode ? (
              <>
                <Eye className='h-5 w-5' />
                View Service: <Badge variant='outline'>{editingName}</Badge>
              </>
            ) : editingName ? (
              <>
                <Pencil className='h-5 w-5' />
                Edit Service: <Badge variant='outline'>{editingName}</Badge>
              </>
            ) : (
              <>
                <Plus className='h-5 w-5' />
                Create New Service
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
                  <Label htmlFor='serviceName' className='mb-2 block'>
                    Service Name
                  </Label>
                  <Input
                    id='serviceName'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={!!editingName}
                    placeholder='my-service'
                    className='font-mono'
                  />
                </div>
              </div>
            </div>

            <div className='grid gap-4 rounded-lg border p-4'>
              <Label className='text-base font-semibold'>Server Configuration</Label>
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Label className='text-muted-foreground'>
                      {protocol === 'http' ? 'Server URLs' : 'Server Addresses'}
                    </Label>
                    <Button type='button' variant='outline' size='sm' onClick={addServerUrl}>
                      <Plus className='h-4 w-4 mr-1' /> Add Server
                    </Button>
                  </div>
                  <div className='space-y-2'>
                    {serverUrls.map((url, index) => (
                      <div key={index} className='flex gap-2'>
                        <Input
                          value={url}
                          onChange={(e) => updateServerUrl(index, e.target.value)}
                          placeholder={
                            protocol === 'http' ? 'http://127.0.0.1:3000' : '127.0.0.1:9000'
                          }
                          required={index === 0}
                        />
                        {serverUrls.length > 1 && (
                          <Button
                            type='button'
                            variant='outline'
                            size='icon'
                            onClick={() => removeServerUrl(index)}
                          >
                            <X className='h-4 w-4' />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className='grid gap-4 rounded-lg border p-4'>
              <Label className='text-base font-semibold'>Health Check (Optional)</Label>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='healthCheckPath'>Path</Label>
                  <Input
                    id='healthCheckPath'
                    value={healthCheckPath}
                    onChange={(e) => setHealthCheckPath(e.target.value)}
                    placeholder='/health'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='healthCheckInterval'>Interval</Label>
                  <Input
                    id='healthCheckInterval'
                    value={healthCheckInterval}
                    onChange={(e) => setHealthCheckInterval(e.target.value)}
                    placeholder='30s'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='healthCheckTimeout'>Timeout</Label>
                  <Input
                    id='healthCheckTimeout'
                    value={healthCheckTimeout}
                    onChange={(e) => setHealthCheckTimeout(e.target.value)}
                    placeholder='5s'
                  />
                </div>
              </div>
              <div className='text-sm text-muted-foreground'>
                Health check is optional. Leave fields empty to disable.
              </div>
            </div>

            {name && (
              <ServiceYAMLPreview service={currentService} name={name} protocol={protocol} />
            )}
          </fieldset>

          <DialogFooter className='gap-2'>
            <Button type='button' variant='outline' onClick={() => setIsModalOpen(false)}>
              {isViewMode ? 'Close' : 'Cancel'}
            </Button>
            {!isViewMode && (
              <Button type='submit'>{editingName ? 'Update Service' : 'Create Service'}</Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    );
  };

  /* ===========================
     Render
  =========================== */
  const filteredServices = allServices.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    const servers = item.service.loadBalancer?.servers || [];
    const serverString = servers
      .map((s) => s.url || s.address)
      .join(' ')
      .toLowerCase();

    return item.name.toLowerCase().includes(searchLower) || serverString.includes(searchLower);
  });

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center flex-wrap gap-4'>
        <div className='flex items-start flex-col gap-2 flex-wrap'>
          <h1 className='text-2xl font-bold'>Services</h1>
          <p className='text-muted-foreground'>
            Manage load balancing and health checks for your backend services
          </p>
        </div>
        <div className='flex items-center gap-4 flex-wrap'>
          <Tabs className='flex-1' value={protocol} onValueChange={(v) => setProtocol(v as any)}>
            <TabsList className='flex justify-stretch'>
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
              placeholder='Search services...'
              className='w-full sm:w-64 pl-9'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowLiveServices(!showLiveServices)}
              className='flex items-center gap-2'
            >
              {showLiveServices ? (
                <>
                  <EyeOff className='h-4 w-4' />
                  Hide Live Services
                </>
              ) : (
                <>
                  <Eye className='h-4 w-4' />
                  Show Live Services
                </>
              )}
            </Button>
            <Button className='flex-1' onClick={openAddModal}>
              <Plus className='mr-2 h-4 w-4' /> Add Service
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {renderServiceForm()}
      </Dialog>

      {isLoading ? (
        <div className='text-center py-12'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto'></div>
          <p className='mt-2 text-muted-foreground'>Loading services...</p>
        </div>
      ) : allServices.length === 0 ? (
        <div className='text-center py-12 rounded-lg border-2 border-dashed'>
          <div className='h-12 w-12 mx-auto text-muted-foreground bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-4'>
            <Plus className='h-6 w-6 text-blue-600' />
          </div>
          <h3 className='mt-4 text-lg font-semibold'>No services configured</h3>
          <p className='text-muted-foreground mt-2'>Get started by creating your first service</p>
          <Button onClick={openAddModal} className='mt-4'>
            <Plus className='mr-2 h-4 w-4' /> Create Service
          </Button>
        </div>
      ) : (
        <div className='space-y-4'>
          <div className='flex items-center justify-between text-sm text-muted-foreground'>
            <div>
              Showing {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''}
              {showLiveServices && (
                <span className='ml-2'>
                  ({filteredServices.filter((s) => s.source === 'configured').length} configured,
                  {filteredServices.filter((s) => s.source === 'live').length} live)
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

          <ServicesTable
            services={filteredServices}
            protocol={protocol}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      )}
    </div>
  );
}
