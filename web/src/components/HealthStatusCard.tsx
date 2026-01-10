import type { HealthStatus } from "@/hooks/use-dashboard-stats";
import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export interface HealthStatusCardProps {
  status: HealthStatus;
  isLoading?: boolean;
}

const HealthStatusCard: React.FC<HealthStatusCardProps> = ({
  status,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Status</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-20 animate-pulse bg-muted rounded" />
          <div className="h-4 w-full mt-2 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const statusConfig = {
    RUNNING: {
      color: "text-green-600",
      bgColor: "bg-green-100",
      message: "All systems operational",
    },
    DOWN: {
      color: "text-red-600",
      bgColor: "bg-red-100",
      message: status.details,
    },
    BROKEN: {
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      message: status.error,
    },
    Checking: {
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      message: "Checking system status",
    },
    Uknown: {
      color: "text-neutral-600",
      bgColor: "bg-neutal-100",
      message: "Uknown status",
    },
  };

  const config = statusConfig[status.status] || statusConfig.Uknown;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">System Status</CardTitle>
        <div className={`p-2 rounded-full ${config.bgColor}`}>
          <Activity className={`h-4 w-4 ${config.color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${config.color}`}>
          {status.status}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {JSON.stringify(config.message)}
        </p>
      </CardContent>
    </Card>
  );
};

export default HealthStatusCard;
