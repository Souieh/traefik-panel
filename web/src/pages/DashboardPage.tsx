import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { Activity, Globe, Layers, Server } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function DashboardPage() {
  const [stats, setStats] = useState({
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          configServices,
          configRouters,
          configMiddlewares,
          configTcpRouters,
          configTcpServices,
          configUdpRouters,
          configUdpServices,
          realServices,
          realRouters,
          realMiddlewares,
          realTcpRouters,
          realTcpServices,
          realUdpRouters,
          realUdpServices,
        ] = await Promise.all([
          api.get("/traefik/services"),
          api.get("/traefik/routers"),
          api.get("/traefik/middlewares"),
          api.get("/traefik/tcp/routers"),
          api.get("/traefik/tcp/services"),
          api.get("/traefik/udp/routers"),
          api.get("/traefik/udp/services"),
          api.get("/traefik/status/services"),
          api.get("/traefik/status/routers"),
          api.get("/traefik/status/middlewares"),
          api.get("/traefik/status/tcp/routers"),
          api.get("/traefik/status/tcp/services"),
          api.get("/traefik/status/udp/routers"),
          api.get("/traefik/status/udp/services"),
        ]);

        setStats({
          config: {
            services: Object.keys(configServices.data).length,
            routers: Object.keys(configRouters.data).length,
            middlewares: Object.keys(configMiddlewares.data).length,
            tcpRouters: Object.keys(configTcpRouters.data).length,
            tcpServices: Object.keys(configTcpServices.data).length,
            udpRouters: Object.keys(configUdpRouters.data).length,
            udpServices: Object.keys(configUdpServices.data).length,
          },
          real: {
            services: Object.keys(realServices.data).length,
            routers: Object.keys(realRouters.data).length,
            middlewares: Object.keys(realMiddlewares.data).length,
            tcpRouters: Object.keys(realTcpRouters.data).length,
            tcpServices: Object.keys(realTcpServices.data).length,
            udpRouters: Object.keys(realUdpRouters.data).length,
            udpServices: Object.keys(realUdpServices.data).length,
          },
        });
      } catch (error) {
        toast.error("Error fetching dashboard stats");
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">HTTP Services</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.real.services}</div>
            <p className="text-xs text-muted-foreground">
              {stats.config.services} configured
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">HTTP Routers</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.real.routers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.config.routers} configured
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TCP Routers</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.real.tcpRouters}</div>
            <p className="text-xs text-muted-foreground">
              {stats.config.tcpRouters} configured
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">UDP Routers</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.real.udpRouters}</div>
            <p className="text-xs text-muted-foreground">
              {stats.config.udpRouters} configured
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TCP Services</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.real.tcpServices}</div>
            <p className="text-xs text-muted-foreground">
              {stats.config.tcpServices} configured
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">UDP Services</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.real.udpServices}</div>
            <p className="text-xs text-muted-foreground">
              {stats.config.udpServices} configured
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Middlewares
            </CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.real.middlewares}</div>
            <p className="text-xs text-muted-foreground">
              {stats.config.middlewares} configured
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Healthy</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
