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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import {
  AlertCircle,
  ArrowRightLeft,
  Code,
  ExternalLink,
  Eye,
  Lock,
  Pencil,
  Plus,
  Scissors,
  Shield,
  Trash2,
  Wand2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Define all middleware types from your API
type MiddlewareType =
  | "basicauth"
  | "headers"
  | "digestauth"
  | "chain"
  | "compress"
  | "errorpage"
  | "ipwhitelist"
  | "ratelimit"
  | "redirectregex"
  | "redirectscheme"
  | "replacepath"
  | "replacepathregex"
  | "stripprefix"
  | "stripprefixregex"
  | "retry"
  | "requestheader";

interface MiddlewareConfig {
  [key: string]: Record<string, any>;
}

/* ===========================
   Type Icons Map
=========================== */
const typeIcons: Record<MiddlewareType, React.ReactNode> = {
  basicauth: <Lock className="h-4 w-4" />,
  headers: <Shield className="h-4 w-4" />,
  digestauth: <Lock className="h-4 w-4" />,
  chain: <Eye className="h-4 w-4" />,
  compress: <Scissors className="h-4 w-4" />,
  errorpage: <AlertCircle className="h-4 w-4" />,
  ipwhitelist: <Shield className="h-4 w-4" />,
  ratelimit: <AlertCircle className="h-4 w-4" />,
  redirectregex: <ArrowRightLeft className="h-4 w-4" />,
  redirectscheme: <ArrowRightLeft className="h-4 w-4" />,
  replacepath: <ArrowRightLeft className="h-4 w-4" />,
  replacepathregex: <ArrowRightLeft className="h-4 w-4" />,
  stripprefix: <Scissors className="h-4 w-4" />,
  stripprefixregex: <Scissors className="h-4 w-4" />,
  retry: <AlertCircle className="h-4 w-4" />,
  requestheader: <Shield className="h-4 w-4" />,
};

const typeLabels: Record<MiddlewareType, string> = {
  basicauth: "Basic Auth",
  headers: "Headers",
  digestauth: "Digest Auth",
  chain: "Chain",
  compress: "Compress",
  errorpage: "Error Page",
  ipwhitelist: "IP Whitelist",
  ratelimit: "Rate Limit",
  redirectregex: "Redirect Regex",
  redirectscheme: "Redirect Scheme",
  replacepath: "Replace Path",
  replacepathregex: "Replace Path Regex",
  stripprefix: "Strip Prefix",
  stripprefixregex: "Strip Prefix Regex",
  retry: "Retry",
  requestheader: "Request Header",
};

/* ===========================
   Configuration Preview Component
=========================== */
function ConfigPreview({ config }: { config: MiddlewareConfig }) {
  if (!config) {
    return (
      <span className="text-sm text-muted-foreground">No configuration</span>
    );
  }

  const renderConfig = (type: MiddlewareType, options: any) => {
    switch (type) {
      case "basicauth":
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Users
              </Badge>
              <span className="text-sm">
                {options.users?.length || 0} user(s)
              </span>
            </div>
            {options.users?.map((user: string, i: number) => (
              <code key={i} className="block text-xs text-muted-foreground">
                {user.replace(/:.*/, ":*****")}
              </code>
            ))}
          </div>
        );
      case "headers":
        return (
          <div className="space-y-1">
            {options.customRequestHeaders && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Request Headers
                </Badge>
                <span className="text-sm">
                  {Object.keys(options.customRequestHeaders).length}
                </span>
              </div>
            )}
            {options.customResponseHeaders && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Response Headers
                </Badge>
                <span className="text-sm">
                  {Object.keys(options.customResponseHeaders).length}
                </span>
              </div>
            )}
          </div>
        );
      case "ratelimit":
        return (
          <div className="space-y-1">
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                Avg: {options.average || "0"}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Burst: {options.burst || "0"}
              </Badge>
            </div>
          </div>
        );
      case "redirectscheme":
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Scheme
              </Badge>
              <span className="text-sm">{options.scheme || "https"}</span>
            </div>
            {options.port && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Port
                </Badge>
                <span className="text-sm">{options.port}</span>
              </div>
            )}
          </div>
        );
      case "stripprefix":
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Prefixes
              </Badge>
              <span className="text-sm">{options.prefixes?.length || 0}</span>
            </div>
            {options.prefixes?.map((prefix: string, i: number) => (
              <code key={i} className="block text-xs text-muted-foreground">
                {prefix}
              </code>
            ))}
          </div>
        );
      case "requestheader":
        return (
          <div className="space-y-1">
            {options.headers && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Headers
                </Badge>
                <span className="text-sm">
                  {Object.keys(options.headers).length}
                </span>
              </div>
            )}
          </div>
        );
      default:
        return (
          <span className="text-sm text-muted-foreground">
            {Object.keys(options).length} configuration items
          </span>
        );
    }
  };

  return (
    <div className="space-y-2">
      {Object.entries(config).map(([type, options]) => (
        <div key={type} className="space-y-1">
          <div className="flex items-center gap-2">
            {typeIcons[type as MiddlewareType] || (
              <Shield className="h-3 w-3" />
            )}
            <span className="text-xs font-medium">
              {typeLabels[type as MiddlewareType] || type}
            </span>
          </div>
          {renderConfig(type as MiddlewareType, options)}
        </div>
      ))}
    </div>
  );
}

/* ===========================
   YAML Preview Component
=========================== */
function YAMLPreview({
  name,
  config,
}: {
  name: string;
  config: MiddlewareConfig;
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
    if (typeof value === "number" || typeof value === "boolean") {
      return value.toString();
    }
    return `"${value}"`;
  };

  const yamlContent = `# Middleware Configuration Preview
http:
  middlewares:
    ${name}:
${Object.entries(config)
  .map(
    ([type, options]) =>
      `      ${type}:\n${Object.entries(options)
        .map(([key, value]) => `        ${key}: ${formatValue(value)}`)
        .join("\n")}`
  )
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
   Enhanced Multi-Type Configuration Builder
=========================== */
function EnhancedConfigBuilder({
  enabledTypes,
  rawConfigs,
  setEnabledTypes,
  setRawConfigs,
  simpleMode,
}: {
  enabledTypes: MiddlewareType[];
  rawConfigs: Record<MiddlewareType, string>;
  setEnabledTypes: (types: MiddlewareType[]) => void;
  setRawConfigs: (configs: Record<MiddlewareType, string>) => void;
  simpleMode: boolean;
}) {
  const exampleConfigs: Partial<Record<MiddlewareType, string>> = {
    basicauth: JSON.stringify(
      {
        users: ["user1:$apr1$hashedpassword1", "user2:$apr1$hashedpassword2"],
      },
      null,
      2
    ),
    headers: JSON.stringify(
      {
        customRequestHeaders: {
          "X-Frame-Options": "DENY",
          "X-Content-Type-Options": "nosniff",
        },
        customResponseHeaders: {
          "X-Custom-Response": "value",
        },
      },
      null,
      2
    ),
    ratelimit: JSON.stringify(
      {
        average: 100,
        burst: 50,
        period: "1s",
      },
      null,
      2
    ),
    redirectscheme: JSON.stringify(
      {
        scheme: "https",
        permanent: true,
      },
      null,
      2
    ),
    stripprefix: JSON.stringify(
      {
        prefixes: ["/api", "/v1"],
      },
      null,
      2
    ),
    requestheader: JSON.stringify(
      {
        headers: {
          "X-Custom-Header": "value",
          Authorization: "Bearer token",
        },
      },
      null,
      2
    ),
    chain: JSON.stringify(
      {
        middlewares: ["auth", "rate-limit"],
      },
      null,
      2
    ),
    ipwhitelist: JSON.stringify(
      {
        sourceRange: ["192.168.1.0/24", "10.0.0.0/8"],
      },
      null,
      2
    ),
  };

  const toggleType = (type: MiddlewareType) => {
    if (enabledTypes.includes(type)) {
      setEnabledTypes(enabledTypes.filter((t) => t !== type));
      // Clear config when disabled
      const newConfigs = { ...rawConfigs };
      delete newConfigs[type];
      setRawConfigs(newConfigs);
    } else {
      setEnabledTypes([...enabledTypes, type]);
      // Initialize with example config if available
      const newConfigs = { ...rawConfigs };
      newConfigs[type] = exampleConfigs[type] || "{}";
      setRawConfigs(newConfigs);
    }
  };

  const handleConfigChange = (type: MiddlewareType, value: string) => {
    setRawConfigs({
      ...rawConfigs,
      [type]: value,
    });
  };

  const loadExample = (type: MiddlewareType) => {
    if (exampleConfigs[type]) {
      setRawConfigs({
        ...rawConfigs,
        [type]: exampleConfigs[type]!,
      });
    }
  };

  const allMiddlewareTypes: MiddlewareType[] = [
    "basicauth",
    "headers",
    "digestauth",
    "chain",
    "compress",
    "errorpage",
    "ipwhitelist",
    "ratelimit",
    "redirectregex",
    "redirectscheme",
    "replacepath",
    "replacepathregex",
    "stripprefix",
    "stripprefixregex",
    "retry",
    "requestheader",
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Middleware Types</Label>
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
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <Label className="mb-4 block">Select Middleware Types</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {allMiddlewareTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={enabledTypes.includes(type)}
                    onCheckedChange={() => toggleType(type)}
                  />
                  <Label
                    htmlFor={`type-${type}`}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    {typeIcons[type]}
                    {typeLabels[type]}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {enabledTypes.length > 0 && (
            <div className="space-y-4">
              <Label className="text-base font-semibold">Configurations</Label>
              {enabledTypes.map((type) => (
                <div key={type} className="space-y-2 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {typeIcons[type]}
                      <span className="font-medium">{typeLabels[type]}</span>
                      <Badge variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => loadExample(type)}
                    >
                      Load Example
                    </Button>
                  </div>
                  <Textarea
                    value={rawConfigs[type] || ""}
                    onChange={(e) => handleConfigChange(type, e.target.value)}
                    className="min-h-[150px] font-mono text-sm"
                    placeholder={`Enter JSON configuration for ${type}`}
                    spellCheck={false}
                  />
                  <div className="text-xs text-muted-foreground">
                    Enter valid JSON configuration for {typeLabels[type]}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
                      const config = enabledTypes.reduce((acc, type) => {
                        try {
                          acc[type] = JSON.parse(rawConfigs[type] || "{}");
                        } catch {
                          acc[type] = {};
                        }
                        return acc;
                      }, {} as MiddlewareConfig);
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
                  enabledTypes.reduce((acc, type) => {
                    try {
                      acc[type] = JSON.parse(rawConfigs[type] || "{}");
                    } catch {
                      acc[type] = {};
                    }
                    return acc;
                  }, {} as MiddlewareConfig),
                  null,
                  2
                )}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    // Extract enabled types from parsed object
                    const newTypes = Object.keys(parsed) as MiddlewareType[];
                    setEnabledTypes(newTypes);
                    const newConfigs: Record<MiddlewareType | any, string> = {};
                    newTypes.forEach((type) => {
                      newConfigs[type] = JSON.stringify(parsed[type], null, 2);
                    });
                    setRawConfigs(newConfigs);
                  } catch {
                    // Keep raw text if invalid JSON
                  }
                }}
                className="min-h-[300px] font-mono text-sm"
                spellCheck={false}
                placeholder='{
  "basicauth": {
    "users": ["user:hashedpassword"]
  },
  "headers": {
    "customRequestHeaders": {
      "X-Custom": "value"
    }
  }
}'
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Common Examples:</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(exampleConfigs).map(([type, config]) => (
                <Button
                  key={type}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const middlewareType = type as MiddlewareType;
                    if (!enabledTypes.includes(middlewareType)) {
                      setEnabledTypes([...enabledTypes, middlewareType]);
                    }
                    setRawConfigs({
                      ...rawConfigs,
                      [middlewareType]: config,
                    });
                  }}
                  className="h-auto py-2 px-3 text-xs justify-start"
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">
                      {typeLabels[type as MiddlewareType]}
                    </span>
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
  const [enabledTypes, setEnabledTypes] = useState<MiddlewareType[]>([]);
  const [rawConfigs, setRawConfigs] = useState<
    Record<MiddlewareType | any, string>
  >({});

  const fetchMiddlewares = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/traefik/middlewares`);
      const data = await response.data;
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
    setEnabledTypes([]);
    setRawConfigs({});
    setIsModalOpen(true);
  };

  const handleEdit = (name: string, data: MiddlewareConfig) => {
    setEditingName(name);
    setName(name);
    setSimpleMode(false); // Always use advanced mode for editing existing configs

    // Extract types and configs from data
    const types = Object.keys(data) as MiddlewareType[];
    setEnabledTypes(types);

    const configs: Record<MiddlewareType | any, string> = {};
    types.forEach((type) => {
      configs[type] = JSON.stringify(data[type], null, 2);
    });
    setRawConfigs(configs);

    setIsModalOpen(true);
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete middleware "${name}"?`)) return;
    try {
      await api.delete(`/traefik/middlewares/${name}`);
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

    if (enabledTypes.length === 0) {
      toast.error("At least one middleware type must be enabled");
      return;
    }

    // Build payload by parsing all configs
    const payload: MiddlewareConfig = {};
    let hasError = false;

    enabledTypes.forEach((type) => {
      try {
        const config = JSON.parse(rawConfigs[type] || "{}");
        if (Object.keys(config).length > 0) {
          payload[type] = config;
        }
      } catch (error) {
        toast.error(`Invalid JSON configuration for ${typeLabels[type]}`);
        hasError = true;
      }
    });

    if (hasError || Object.keys(payload).length === 0) {
      toast.error(
        "Valid configuration required for at least one middleware type"
      );
      return;
    }

    try {
      await api.post(`/traefik/middlewares/${name}`, payload);

      toast.success("Middleware saved successfully");
      setIsModalOpen(false);
      fetchMiddlewares();
    } catch (error: any) {
      toast.error(`Failed to save middleware: ${error.message}`);
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
                <Label className="text-base font-semibold">
                  Configuration Mode
                </Label>
                <div className="flex items-center gap-4">
                  <Label className="flex items-center gap-2">
                    <Checkbox
                      checked={simpleMode}
                      onCheckedChange={(v) => {
                        setSimpleMode(!!v);
                        if (!!v) {
                          // Clear configs when switching to simple mode
                          setEnabledTypes([]);
                          setRawConfigs({});
                        }
                      }}
                    />
                    Use Simple Configuration Mode
                  </Label>
                  <Badge variant="outline">
                    {enabledTypes.length} type(s) selected
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <EnhancedConfigBuilder
            enabledTypes={enabledTypes}
            rawConfigs={rawConfigs}
            setEnabledTypes={setEnabledTypes}
            setRawConfigs={setRawConfigs}
            simpleMode={simpleMode}
          />

          {name && enabledTypes.length > 0 && (
            <YAMLPreview
              name={name}
              config={enabledTypes.reduce((acc, type) => {
                try {
                  acc[type] = JSON.parse(rawConfigs[type] || "{}");
                } catch {
                  acc[type] = {};
                }
                return acc;
              }, {} as MiddlewareConfig)}
            />
          )}

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
      <div className="flex justify-between items-center flex-wrap gap-4">
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
                <TableHead>Types</TableHead>
                <TableHead>Configuration</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(middlewares).map(([name, data]) => {
                const types = Object.keys(data) as MiddlewareType[];

                return (
                  <TableRow key={name} className="group">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {types.map((type) => (
                          <Badge
                            key={type}
                            variant="secondary"
                            className="font-mono text-xs"
                          >
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ConfigPreview config={data} />
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
