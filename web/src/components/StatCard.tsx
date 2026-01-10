import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export interface StatCardProps {
  title: string;
  currentValue: number;
  configuredValue: number;
  icon: React.ReactNode;
  trend?: number;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  currentValue,
  configuredValue,
  icon,
  trend,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <div className="h-8 w-16 animate-pulse bg-muted rounded" />
          <div className="h-4 w-24 mt-2 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const diff = currentValue - configuredValue;
  const hasDiff = diff !== 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold flex items-center gap-2">
          {currentValue}
          {hasDiff && (
            <span
              className={`text-xs ${
                diff > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {diff > 0 ? "↑" : "↓"} {Math.abs(diff)}
            </span>
          )}
          {trend !== undefined && (
            <span
              className={`text-xs ${
                trend > 0
                  ? "text-green-600"
                  : trend < 0
                  ? "text-red-600"
                  : "text-muted-foreground"
              }`}
            >
              {trend > 0 ? "↗" : trend < 0 ? "↘" : "→"} {Math.abs(trend)}%
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {configuredValue} configured
        </p>
      </CardContent>
    </Card>
  );
};

export default StatCard;
