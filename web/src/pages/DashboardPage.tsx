import HealthStatusCard from "@/components/HealthStatusCard";
import StatCard from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useDashboardStats from "@/hooks/use-dashboard-stats";
import { Globe, Layers, Server } from "lucide-react";

export default function DashboardPage() {
  const { stats, isLoading, error } = useDashboardStats();

  // Define card configurations
  const statCards = [
    {
      key: "http-services",
      title: "HTTP Services",
      icon: <Server className="h-4 w-4 text-muted-foreground" />,
      current: stats.real.services,
      configured: stats.config.services,
    },
    {
      key: "http-routers",
      title: "HTTP Routers",
      icon: <Globe className="h-4 w-4 text-muted-foreground" />,
      current: stats.real.routers,
      configured: stats.config.routers,
    },
    {
      key: "tcp-routers",
      title: "TCP Routers",
      icon: <Globe className="h-4 w-4 text-muted-foreground" />,
      current: stats.real.tcpRouters,
      configured: stats.config.tcpRouters,
    },
    {
      key: "udp-routers",
      title: "UDP Routers",
      icon: <Globe className="h-4 w-4 text-muted-foreground" />,
      current: stats.real.udpRouters,
      configured: stats.config.udpRouters,
    },
    {
      key: "tcp-services",
      title: "TCP Services",
      icon: <Server className="h-4 w-4 text-muted-foreground" />,
      current: stats.real.tcpServices,
      configured: stats.config.tcpServices,
    },
    {
      key: "udp-services",
      title: "UDP Services",
      icon: <Server className="h-4 w-4 text-muted-foreground" />,
      current: stats.real.udpServices,
      configured: stats.config.udpServices,
    },
    {
      key: "middlewares",
      title: "Total Middlewares",
      icon: <Layers className="h-4 w-4 text-muted-foreground" />,
      current: stats.real.middlewares,
      configured: stats.config.middlewares,
    },
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="p-4 border border-red-300 bg-red-50 rounded-lg">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
              Updating...
            </div>
          )}
          <span className="text-xs text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <StatCard
            key={card.key}
            title={card.title}
            currentValue={card.current}
            configuredValue={card.configured}
            icon={card.icon}
            isLoading={isLoading}
          />
        ))}

        <HealthStatusCard status={stats.healthy} isLoading={isLoading} />
      </div>

      {/* Optional: Add summary section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Total Active</p>
              <p className="text-2xl font-bold">
                {Object.values(stats.real).reduce((a, b) => a + b, 0)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Total Configured</p>
              <p className="text-2xl font-bold">
                {Object.values(stats.config).reduce((a, b) => a + b, 0)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">HTTP Resources</p>
              <p className="text-2xl font-bold">
                {stats.real.services +
                  stats.real.routers +
                  stats.real.middlewares}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">TCP/UDP Resources</p>
              <p className="text-2xl font-bold">
                {stats.real.tcpRouters +
                  stats.real.tcpServices +
                  stats.real.udpRouters +
                  stats.real.udpServices}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
