import api from '@/lib/api';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// Create types for better type safety
export interface HealthStatus {
  status: 'RUNNING' | 'DOWN' | 'BROKEN' | 'Checking';
  details: string;
  error: string;
}

export interface ServiceCounts {
  services: number;
  routers: number;
  middlewares: number;
  tcpRouters: number;
  tcpServices: number;
  udpRouters: number;
  udpServices: number;
}

export interface DashboardStats {
  healthy: HealthStatus;
  config: ServiceCounts;
  real: ServiceCounts;
}

// Create a hook for data fetching
const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    healthy: { status: 'Checking', details: '', error: '' },
    config: {
      services: 0,
      routers: 0,
      middlewares: 0,
      tcpRouters: 0,
      tcpServices: 0,
      udpRouters: 0,
      udpServices: 0,
    },
    real: {
      services: 0,
      routers: 0,
      middlewares: 0,
      tcpRouters: 0,
      tcpServices: 0,
      udpRouters: 0,
      udpServices: 0,
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);

        // Group API endpoints logically
        const endpoints = {
          config: {
            services: '/traefik/services',
            routers: '/traefik/routers',
            middlewares: '/traefik/middlewares',
            tcpRouters: '/traefik/tcp/routers',
            tcpServices: '/traefik/tcp/services',
            udpRouters: '/traefik/udp/routers',
            udpServices: '/traefik/udp/services',
          },
          status: {
            healthy: '/traefik/status/healthy',
            services: '/traefik/status/services',
            routers: '/traefik/status/routers',
            middlewares: '/traefik/status/middlewares',
            tcpRouters: '/traefik/status/tcp/routers',
            tcpServices: '/traefik/status/tcp/services',
            udpRouters: '/traefik/status/udp/routers',
            udpServices: '/traefik/status/udp/services',
          },
        };

        // Create all promises at once
        const promises = {
          config: Object.values(endpoints.config).map((endpoint) => api.get(endpoint)),
          status: Object.values(endpoints.status).map((endpoint) => api.get(endpoint)),
        };

        const [configResponses, statusResponses] = await Promise.all([
          Promise.all(promises.config),
          Promise.all(promises.status),
        ]);

        setStats({
          healthy: statusResponses[0].data,
          config: {
            services: Object.keys(configResponses[0].data).length,
            routers: Object.keys(configResponses[1].data).length,
            middlewares: Object.keys(configResponses[2].data).length,
            tcpRouters: Object.keys(configResponses[3].data).length,
            tcpServices: Object.keys(configResponses[4].data).length,
            udpRouters: Object.keys(configResponses[5].data).length,
            udpServices: Object.keys(configResponses[6].data).length,
          },
          real: {
            services: statusResponses[1].data.length,
            routers: statusResponses[2].data.length,
            middlewares: statusResponses[3].data.length,
            tcpRouters: statusResponses[4].data.length,
            tcpServices: statusResponses[5].data.length,
            udpRouters: statusResponses[6].data.length,
            udpServices: statusResponses[7].data.length,
          },
        });

        setError(null);
      } catch (error) {
        setError('Failed to fetch dashboard statistics');
        toast.error('Error fetching dashboard stats');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();

    // Optional: Add polling/auto-refresh
    const intervalId = setInterval(fetchStats, 30000); // Refresh every 30 seconds

    return () => clearInterval(intervalId);
  }, []);

  return { stats, isLoading, error };
};

export default useDashboardStats;
