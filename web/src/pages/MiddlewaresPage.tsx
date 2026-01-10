import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  ArrowRightLeft,
  Code,
  ExternalLink,
  Eye,
  Lock,
  Pencil,
  Plus,
  PlusSquare,
  Scissors,
  Shield,
  Trash2,
  Wand2,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

type MiddlewareType =
  | "BasicAuth"
  | "Headers"
  | "RateLimit"
  | "RedirectScheme"
  | "StripPrefix"
  | "AddPrefix"
  | "Chain";

interface MiddlewareConfig {
  type: MiddlewareType;
  options: Record<string, any>;
}

/* ===========================
   Type Icons Map
=========================== */
const typeIcons: Record<MiddlewareType, React.ReactNode> = {
  BasicAuth: <Lock className="h-4 w-4" />,
  Headers: <Shield className="h-4 w-4" />,
  RateLimit: <AlertCircle className="h-4 w-4" />,
  RedirectScheme: <ArrowRightLeft className="h-4 w-4" />,
  StripPrefix: <Scissors className="h-4 w-4" />,
  AddPrefix: <PlusSquare className="h-4 w-4" />,
  Chain: <Eye className="h-4 w-4" />,
};

/* ===========================
   Configuration Preview Component
=========================== */
function ConfigPreview({
  config,
  type,
}: {
  config: any;
  type: MiddlewareType;
}) {
  const renderConfig = () => {
    switch (type) {
      case "BasicAuth":
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Users
              </Badge>
              <span className="text-sm">
                {config.users?.length || 0} user(s)
              </span>
            </div>
            {config.users?.map((user: string, i: number) => (
              <code key={i} className="block text-xs text-muted-foreground">
                {user.replace(/:.*/, ":*****")}
              </code>
            ))}
          </div>
        );
      case "Headers":
        return (
          <div className="space-y-1">
            {config.customRequestHeaders && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Request Headers
                </Badge>
                <span className="text-sm">
                  {Object.keys(config.customRequestHeaders).length}
                </span>
              </div>
            )}
            {config.customResponseHeaders && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Response Headers
                </Badge>
                <span className="text-sm">
                  {Object.keys(config.customResponseHeaders).length}
                </span>
              </div>
            )}
          </div>
        );
      case "RateLimit":
        return (
          <div className="space-y-1">
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                Avg: {config.average || "0"}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Burst: {config.burst || "0"}
              </Badge>
            </div>
          </div>
        );
      case "RedirectScheme":
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Scheme
              </Badge>
              <span className="text-sm">{config.scheme || "https"}</span>
            </div>
            {config.port && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Port
                </Badge>
                <span className="text-sm">{config.port}</span>
              </div>
            )}
          </div>
        );
      case "StripPrefix":
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Prefixes
              </Badge>
              <span className="text-sm">{config.prefixes?.length || 0}</span>
            </div>
            {config.prefixes?.map((prefix: string, i: number) => (
              <code key={i} className="block text-xs text-muted-foreground">
                {prefix}
              </code>
            ))}
          </div>
        );
      case "AddPrefix":
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Prefix
              </Badge>
              <span className="text-sm">{config.prefix}</span>
            </div>
          </div>
        );
      default:
        return (
          <span className="text-sm text-muted-foreground">Custom config</span>
        );
    }
  };
  return JSON.stringify(config, null, 2);
  return <div className="text-sm">{renderConfig()}</div>;
}

/* ===========================
   YAML Preview Component
=========================== */
function YAMLPreview({
  name,
  type,
  options,
}: {
  name: string;
  type: MiddlewareType;
  options: any;
}) {
  const formatValue = (value: any): string => {
    if (Array.isArray(value)) {
      return `[${value.map((v) => `"${v}"`).join(", ")}]`;
    }
    if (typeof value === "object" && value !== null) {
      const entries = Object.entries(value)
        .map(([k, v]) => `  ${k}: "${v}"`)
        .join("\n");
      return `\n${entries}`;
    }
    if (typeof value === "number") {
      return value.toString();
    }
    return `"${value}"`;
  };

  const yamlContent = `# Middleware Configuration Preview
http:
  middlewares:
    ${name}:
      ${type.toLowerCase()}:
${Object.entries(options)
  .map(([key, value]) => `        ${key}: ${formatValue(value)}`)
  .join("\n")}`;

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Code className="h-4 w-4" />
          YAML Configuration Preview
        </Label>
        <Badge variant="outline" className="font-mono text-xs">
          {name || "middleware-name"}
        </Badge>
      </div>
      <pre className="text-sm bg-muted/30 p-3 rounded-md overflow-x-auto font-mono whitespace-pre-wrap">
        {yamlContent}
      </pre>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ExternalLink className="h-3 w-3" />
        <span>
          This is how the middleware will appear in your Traefik configuration
          file
        </span>
      </div>
    </div>
  );
}

/* ===========================
   Configuration Builder Component
=========================== */
function ConfigBuilder({
  type,
  options,
  setOptions,
  simpleMode,
  onTypeChange,
}: {
  type: MiddlewareType;
  options: any;
  setOptions: (options: any) => void;
  simpleMode: boolean;
  onTypeChange: (type: MiddlewareType) => void;
}) {
  const renderSimpleOptions = () => {
    const commonClasses = "space-y-4 rounded-lg border p-4";

    switch (type) {
      case "BasicAuth":
        return (
          <div className={commonClasses}>
            <div className="space-y-2">
              <Label htmlFor="users" className="flex items-center gap-2">
                Users
                <Badge variant="outline" className="text-xs">
                  Required
                </Badge>
              </Label>
              <Textarea
                id="users"
                value={options.users?.join("\n") || ""}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    users: e.target.value.split("\n").filter(Boolean),
                  })
                }
                placeholder="user1:$apr1$hashedpassword1&#10;user2:$apr1$hashedpassword2"
                className="font-mono text-sm min-h-[100px]"
              />
              <div className="flex items-start gap-2 text-sm text-amber-600">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  Use htpasswd to generate hashed passwords:{" "}
                  <code className="text-xs">htpasswd -nb user password</code>
                </span>
              </div>
            </div>
          </div>
        );

      case "Headers":
        return (
          <div className={commonClasses}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Request Headers</Label>
                <Textarea
                  value={
                    options.customRequestHeaders
                      ? Object.entries(options.customRequestHeaders)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join("\n")
                      : ""
                  }
                  onChange={(e) => {
                    const headers: Record<string, string> = {};
                    e.target.value
                      .split("\n")
                      .filter(Boolean)
                      .forEach((line) => {
                        const [key, ...value] = line.split(":");
                        if (key && value.length > 0) {
                          headers[key.trim()] = value.join(":").trim();
                        }
                      });
                    setOptions({
                      ...options,
                      customRequestHeaders: Object.keys(headers).length
                        ? headers
                        : undefined,
                    });
                  }}
                  placeholder="X-Frame-Options: DENY&#10;X-Content-Type-Options: nosniff"
                  className="font-mono text-sm min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Response Headers</Label>
                <Textarea
                  value={
                    options.customResponseHeaders
                      ? Object.entries(options.customResponseHeaders)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join("\n")
                      : ""
                  }
                  onChange={(e) => {
                    const headers: Record<string, string> = {};
                    e.target.value
                      .split("\n")
                      .filter(Boolean)
                      .forEach((line) => {
                        const [key, ...value] = line.split(":");
                        if (key && value.length > 0) {
                          headers[key.trim()] = value.join(":").trim();
                        }
                      });
                    setOptions({
                      ...options,
                      customResponseHeaders: Object.keys(headers).length
                        ? headers
                        : undefined,
                    });
                  }}
                  placeholder="X-Custom-Header: value"
                  className="font-mono text-sm min-h-[100px]"
                />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Add one header per line in format: <code>Header-Name: value</code>
            </div>
          </div>
        );

      case "RateLimit":
        return (
          <div className={commonClasses}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="average">Average Requests</Label>
                <Input
                  id="average"
                  type="number"
                  min="1"
                  value={options.average || ""}
                  onChange={(e) =>
                    setOptions({ ...options, average: Number(e.target.value) })
                  }
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="burst">Burst Requests</Label>
                <Input
                  id="burst"
                  type="number"
                  min="1"
                  value={options.burst || ""}
                  onChange={(e) =>
                    setOptions({ ...options, burst: Number(e.target.value) })
                  }
                  placeholder="50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="period">Period (seconds)</Label>
              <Select
                value={options.period || "1s"}
                onValueChange={(v) => setOptions({ ...options, period: v })}
              >
                <SelectTrigger id="period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1s">1 second</SelectItem>
                  <SelectItem value="10s">10 seconds</SelectItem>
                  <SelectItem value="1m">1 minute</SelectItem>
                  <SelectItem value="10m">10 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "RedirectScheme":
        return (
          <div className={commonClasses}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheme">Scheme</Label>
                <Select
                  value={options.scheme || "https"}
                  onValueChange={(v) => setOptions({ ...options, scheme: v })}
                >
                  <SelectTrigger id="scheme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="https">HTTP → HTTPS</SelectItem>
                    <SelectItem value="http">HTTPS → HTTP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Port (optional)</Label>
                <Input
                  id="port"
                  type="number"
                  value={options.port || ""}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      port: e.target.value ? e.target.value : undefined,
                    })
                  }
                  placeholder="443"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Checkbox
                  checked={options.permanent || false}
                  onCheckedChange={(v) =>
                    setOptions({ ...options, permanent: !!v })
                  }
                />
                Permanent Redirect (301)
              </Label>
            </div>
          </div>
        );

      case "StripPrefix":
        return (
          <div className={commonClasses}>
            <div className="space-y-2">
              <Label htmlFor="prefixes">Prefixes to Strip</Label>
              <Textarea
                id="prefixes"
                value={options.prefixes?.join("\n") || ""}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    prefixes: e.target.value.split("\n").filter(Boolean),
                  })
                }
                placeholder="/api/v1&#10;/admin"
                className="font-mono text-sm min-h-[100px]"
              />
              <div className="text-sm text-muted-foreground">
                Add one prefix per line. Example: <code>/api</code> will strip
                /api from requests
              </div>
            </div>
          </div>
        );

      case "AddPrefix":
        return (
          <div className={commonClasses}>
            <div className="space-y-2">
              <Label htmlFor="prefix">Prefix to Add</Label>
              <Input
                id="prefix"
                value={options.prefix || ""}
                onChange={(e) =>
                  setOptions({ ...options, prefix: e.target.value })
                }
                placeholder="/api/v1"
                className="font-mono"
              />
              <div className="text-sm text-muted-foreground">
                Example: <code>/api</code> will add /api to all requests
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className={commonClasses}>
            <div className="text-center text-muted-foreground">
              Use advanced mode for custom middleware configuration
            </div>
          </div>
        );
    }
  };

  const exampleConfigs: Record<MiddlewareType, string> = {
    BasicAuth: JSON.stringify(
      {
        basicAuth: {
          users: ["user1:$apr1$hashedpassword1", "user2:$apr1$hashedpassword2"],
        },
      },
      null,
      2
    ),
    Headers: JSON.stringify(
      {
        headers: {
          customRequestHeaders: {
            "X-Custom-Request": "value",
          },
          customResponseHeaders: {
            "X-Custom-Response": "value",
          },
        },
      },
      null,
      2
    ),
    RateLimit: JSON.stringify(
      {
        rateLimit: {
          average: 100,
          burst: 50,
          period: "1s",
        },
      },
      null,
      2
    ),
    RedirectScheme: JSON.stringify(
      {
        redirectScheme: {
          scheme: "https",
          permanent: true,
        },
      },
      null,
      2
    ),
    StripPrefix: JSON.stringify(
      {
        stripPrefix: {
          prefixes: ["/api", "/v1"],
        },
      },
      null,
      2
    ),
    AddPrefix: JSON.stringify(
      {
        addPrefix: {
          prefix: "/api",
        },
      },
      null,
      2
    ),
    Chain: JSON.stringify(
      {
        chain: {
          middlewares: ["auth", "rate-limit"],
        },
      },
      null,
      2
    ),
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Configuration</Label>
        <Tabs
          value={simpleMode ? "simple" : "advanced"}
          onValueChange={() => {}}
          className="w-auto"
        >
          <TabsList>
            <TabsTrigger value="simple" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Simple
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Advanced
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {simpleMode ? (
        renderSimpleOptions()
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Raw JSON Configuration</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    try {
                      const config = { [type.toLowerCase()]: options };
                      navigator.clipboard.writeText(
                        JSON.stringify(config, null, 2)
                      );
                      toast.success("Configuration copied to clipboard");
                    } catch {
                      toast.error("Failed to copy configuration");
                    }
                  }}
                >
                  Copy Config
                </Button>
              </div>
              <Textarea
                value={JSON.stringify(
                  { [type.toLowerCase()]: options },
                  null,
                  2
                )}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    const newType = Object.keys(parsed)[0] as MiddlewareType;
                    onTypeChange(
                      (newType.charAt(0).toUpperCase() +
                        newType.slice(1)) as MiddlewareType
                    );
                    setOptions(parsed[newType.toLowerCase()] || {});
                  } catch {
                    // Keep raw text if invalid JSON
                  }
                }}
                className="min-h-[200px] font-mono text-sm"
                spellCheck={false}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Examples:</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(exampleConfigs).map(([t, config]) => (
                <Button
                  key={t}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(config);
                      const newType = Object.keys(parsed)[0] as MiddlewareType;
                      onTypeChange(
                        (newType.charAt(0).toUpperCase() +
                          newType.slice(1)) as MiddlewareType
                      );
                      setOptions(parsed[newType.toLowerCase()] || {});
                    } catch {
                      toast.error("Failed to load example");
                    }
                  }}
                  className="h-auto py-2 px-3 text-xs justify-start"
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{t}</span>
                    <span className="text-muted-foreground truncate w-full">
                      {config.split("\n")[1]}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===========================
   Main Page Component
=========================== */
export default function MiddlewaresPage() {
  const [middlewares, setMiddlewares] = useState<
    Record<string, MiddlewareConfig>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [simpleMode, setSimpleMode] = useState(true);
  const [type, setType] = useState<MiddlewareType>("BasicAuth");
  const [options, setOptions] = useState<any>({});

  const token = localStorage.getItem("access_token");
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const fetchMiddlewares = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/traefik/middlewares`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch middlewares");
      const data = await response.json();
      setMiddlewares(data);
    } catch {
      toast.error("Error fetching middlewares");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMiddlewares();
  }, []);

  const openAddModal = () => {
    setEditingName(null);
    setName("");
    setSimpleMode(true);
    setType("BasicAuth");
    setOptions({});
    setIsModalOpen(true);
  };

  const handleEdit = (name: string, data: MiddlewareConfig) => {
    setEditingName(name);
    setName(name);

    // Extract type and options from data
    const extractedType = Object.keys(data)[0] as MiddlewareType;
    if (extractedType) {
      setSimpleMode(true);
      setType(extractedType);
      setOptions(
        data[extractedType.toLowerCase() as keyof MiddlewareConfig] || {}
      );
    } else {
      setSimpleMode(false);
      setType("BasicAuth");
      setOptions({});
    }

    setIsModalOpen(true);
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete middleware "${name}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/traefik/middlewares/${name}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      toast.success("Middleware deleted");
      fetchMiddlewares();
    } catch {
      toast.error("Failed to delete middleware");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Middleware name is required");
      return;
    }

    if (simpleMode && !type) {
      toast.error("Middleware type is required");
      return;
    }

    const payload: Record<string, any> = {};
    if (simpleMode) {
      payload[type.toLowerCase()] = options;
    } else {
      try {
        // For advanced mode, we already have the structure
        payload[type.toLowerCase()] = options;
      } catch {
        toast.error("Invalid configuration");
        return;
      }
    }

    try {
      const res = await fetch(`${API_URL}/traefik/middlewares/${name}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();
      toast.success("Middleware saved successfully");
      setIsModalOpen(false);
      fetchMiddlewares();
    } catch {
      toast.error("Failed to save middleware");
    }
  };

  const renderModal = () => {
    return (
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editingName ? (
              <>
                <Pencil className="h-5 w-5" />
                Edit Middleware: <Badge variant="outline">{editingName}</Badge>
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Create New Middleware
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form className="grid gap-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 rounded-lg border p-4">
            <Label className="text-base font-semibold">Basic Information</Label>
            <div className="grid gap-3">
              <div>
                <Label htmlFor="middlewareName" className="mb-2 block">
                  Middleware Name
                </Label>
                <Input
                  id="middlewareName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={!!editingName}
                  placeholder="auth-middleware"
                  className="font-mono"
                />
              </div>
              <div>
                <Label htmlFor="type" className="mb-2 block">
                  Middleware Type
                </Label>
                <Select
                  value={type}
                  onValueChange={(v) => {
                    setType(v as MiddlewareType);
                    setOptions({});
                  }}
                  disabled={!simpleMode}
                >
                  <SelectTrigger id="type">
                    <div className="flex items-center gap-2">
                      <SelectValue placeholder="Select type" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeIcons).map(([t, icon]) => (
                      <SelectItem key={t} value={t}>
                        <div className="flex items-center gap-2">
                          {icon}
                          {t}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-2">
                  <Label className="flex items-center gap-2">
                    <Checkbox
                      checked={simpleMode}
                      onCheckedChange={(v) => {
                        setSimpleMode(!!v);
                        if (!!v) {
                          setOptions({});
                        }
                      }}
                    />
                    Use Simple Configuration Mode
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <ConfigBuilder
            type={type}
            options={options}
            setOptions={setOptions}
            simpleMode={simpleMode}
            onTypeChange={setType}
          />

          {name && <YAMLPreview name={name} type={type} options={options} />}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingName ? "Update Middleware" : "Create Middleware"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    );
  };

  return (
    <div className="space-y-6">
      <div className=" flex justify-between  items-center flex-wrap gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Middlewares</h1>
          <p className="text-muted-foreground">
            Add security, routing, and transformation rules to your traffic
          </p>
        </div>
        <div>
          <Button onClick={openAddModal} className="flex-1">
            <Plus className="mr-2 h-4 w-4" /> Add Middleware
          </Button>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {renderModal()}
      </Dialog>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading middlewares...</p>
        </div>
      ) : Object.keys(middlewares).length === 0 ? (
        <div className="text-center py-12 rounded-lg border-2 border-dashed">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">
            No middlewares configured
          </h3>
          <p className="text-muted-foreground mt-2">
            Add middlewares to enhance security and control traffic flow
          </p>
          <Button onClick={openAddModal} className="mt-4">
            <Plus className="mr-2 h-4 w-4" /> Create Middleware
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Configuration</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(middlewares).map(([name, data]) => {
                const type =
                  (Object.keys(data)[0] as MiddlewareType) || "Unknown";
                const config =
                  data[type.toLowerCase() as keyof MiddlewareConfig] || {};
                const Icon = typeIcons[type] || <Shield className="h-4 w-4" />;

                return (
                  <TableRow key={name} className="group">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {Icon as ReactNode}
                        {name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">
                        {type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ConfigPreview config={config} type={type} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(name, data)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(name)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
