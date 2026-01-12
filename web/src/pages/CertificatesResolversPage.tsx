import ManualCertificateModal from "@/components/ManualCertificateModal";
import ManualCertificatesTable from "@/components/ManualCertificatesTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";
import {
  Cpu,
  Globe,
  Lock,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type ChallengeType = "httpChallenge" | "tlsChallenge" | "dnsChallenge";

interface Resolver {
  acme?: {
    email?: string;
    storage?: string;
    httpChallenge?: { entryPoint: string };
    tlsChallenge?: {};
    dnsChallenge?: { provider: string; delayBeforeCheck?: number };
  };
}

interface ManualCertificate {
  domain: string;
  cert_path: string;
  key_path: string;
}

export default function CertificatesResolversPage() {
  const [resolvers, setResolvers] = useState<Record<string, Resolver>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("resolvers");
  const [manualCerts, setManualCerts] = useState<ManualCertificate[]>([]);

  const [isModalCertOpen, setIsModalCertOpen] = useState(false);
  const [editingCertificate, setEditingCertificate] =
    useState<ManualCertificate | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [challengeType, setChallengeType] =
    useState<ChallengeType>("httpChallenge");
  const [entryPoint, setEntryPoint] = useState("web");
  const [dnsProvider, setDnsProvider] = useState("");
  const [dnsDelay, setDnsDelay] = useState(0);

  // Fetch resolvers from backend
  const fetchResolvers = async () => {
    try {
      const response = await api.get("/traefik/certificates-resolvers");
      setResolvers(response.data || {});
    } catch {
      toast.error("Error fetching resolvers");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchManualCerts = async () => {
    const res = await api.get("/traefik/certificates/manual");
    setManualCerts(res.data || []);
  };

  const loadAll = async () =>
    Promise.all([fetchResolvers(), fetchManualCerts()]);

  useEffect(() => {
    loadAll();
  }, []);

  // Open modal for add
  const openAddResolverModal = () => {
    setEditingName(null);
    setName("");
    setEmail("");
    setChallengeType("httpChallenge");
    setEntryPoint("web");
    setDnsProvider("");
    setDnsDelay(0);
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleEditResolver = (resolverName: string, config: Resolver) => {
    setEditingName(resolverName);
    setName(resolverName);
    const acme = config.acme;
    if (!acme) return;

    setEmail(acme.email || "");
    if (acme.httpChallenge) {
      setChallengeType("httpChallenge");
      setEntryPoint(acme.httpChallenge.entryPoint || "web");
    } else if (acme.tlsChallenge) {
      setChallengeType("tlsChallenge");
    } else if (acme.dnsChallenge) {
      setChallengeType("dnsChallenge");
      setDnsProvider(acme.dnsChallenge.provider || "");
      setDnsDelay(acme.dnsChallenge.delayBeforeCheck || 0);
    }
    setIsModalOpen(true);
  };

  const handleDeleteResolver = async (resolverName: string) => {
    if (!confirm(`Delete resolver ${resolverName}?`)) return;
    try {
      await api.delete(`/traefik/certificates-resolvers/${resolverName}`);
      toast.success("Deleted");
      fetchResolvers();
    } catch {
      toast.error("Error deleting resolver");
    }
  };

  const handleSubmitResolver = async (e: React.FormEvent) => {
    e.preventDefault();

    const acme: any = { email };
    if (challengeType === "httpChallenge") acme.httpChallenge = { entryPoint };
    if (challengeType === "tlsChallenge") acme.tlsChallenge = {};
    if (challengeType === "dnsChallenge")
      acme.dnsChallenge = { provider: dnsProvider, delayBeforeCheck: dnsDelay };

    try {
      await api.post(`/traefik/certificates-resolvers/${name}`, { acme });
      toast.success("Saved");
      setIsModalOpen(false);
      fetchResolvers();
    } catch {
      toast.error("Error saving resolver");
    }
  };

  const handleDeleteCert = async (certName: string) => {
    if (!confirm(`Delete resolver ${certName}?`)) return;
    try {
      await api.delete(`/traefik/certificates/manual/${certName}`);
      toast.success("Deleted");
      fetchResolvers();
    } catch {
      toast.error("Error deleting resolver");
    }
  };
  handleDeleteCert;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Certificate Resolvers</h1>
          <p className="text-muted-foreground">
            Manage your ACME certificate resolvers.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 ">
          <Button onClick={openAddResolverModal}>
            <Plus className="mr-2 h-4 w-4" /> Add Resolver
          </Button>
          <Button
            onClick={() => {
              setEditingCertificate(null);
              setIsModalCertOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Certificate
          </Button>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="resolvers">Resolvers</TabsTrigger>
          <TabsTrigger value="manual">Manual Certificates</TabsTrigger>
        </TabsList>
        <div className="rounded-md border p-2 my-2 bg-white">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <TriangleAlert className="text-sm" />
            {activeTab === "resolvers"
              ? "Changes here require Traefik restart, which you will need to do it manually."
              : "Changes here take effect immediately"}
          </p>
        </div>

        <TabsContent value="resolvers">
          {/* Resolvers table */}
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Challenge</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(resolvers).map(([resolverName, config]) => {
                  const acme = config.acme;
                  let challengeLabel = "-";
                  if (acme?.httpChallenge)
                    challengeLabel = `HTTP (${acme.httpChallenge.entryPoint})`;
                  else if (acme?.tlsChallenge) challengeLabel = "TLS";
                  else if (acme?.dnsChallenge)
                    challengeLabel = `DNS (${
                      acme.dnsChallenge.provider
                    }, delay: ${acme.dnsChallenge.delayBeforeCheck ?? 0})`;

                  return (
                    <TableRow key={resolverName}>
                      <TableCell className="font-medium">
                        {resolverName}
                      </TableCell>
                      <TableCell>{acme?.email}</TableCell>
                      <TableCell>{challengeLabel}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleEditResolver(resolverName, config)
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteResolver(resolverName)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {Object.keys(resolvers).length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      No resolvers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="manual">
          {/* Resolvers table */}
          <div className="rounded-md border bg-white">
            <ManualCertificatesTable
              certificates={manualCerts}
              onEdit={(cert) => {
                setEditingCertificate(cert);
                setIsModalCertOpen(true);
              }}
              onDelete={(cert) => handleDeleteCert(cert.domain)}
              isLoading={isLoading}
            />
          </div>
        </TabsContent>
      </Tabs>

      <ManualCertificateModal
        isOpen={isModalCertOpen}
        onOpenChange={setIsModalCertOpen}
        certificate={editingCertificate || undefined}
        onSaved={fetchManualCerts}
      />

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>
              {editingName ? "Edit Resolver" : "Add New Resolver"}
            </DialogTitle>
            <DialogDescription>
              {editingName
                ? "Update existing resolver."
                : "Create a new certificate resolver."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitResolver} className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={!!editingName}
              />
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="user@example.com"
              />
            </div>

            {/* Challenge type */}
            <div className="grid gap-2">
              <Label>Challenge Type</Label>
              <div className="flex  items-center gap-4 flex-wrap">
                <Tabs
                  className="flex-1 "
                  value={challengeType}
                  onValueChange={(v) => setChallengeType(v as any)}
                >
                  <TabsList className="flex justify-stretch ">
                    {[
                      {
                        type: "httpChallenge",
                        title: "HTTP",
                        description: "ACME HTTP challenge via HTTP-01",
                        icon: Cpu,
                      },
                      {
                        type: "tlsChallenge",
                        title: "TLS",
                        description: "ACME TLS challenge via TLS-ALPN-01",
                        icon: Lock,
                      },
                      {
                        type: "dnsChallenge",
                        title: "DNS",
                        description:
                          "ACME DNS challenge (requires DNS provider)",
                        icon: Globe,
                      },
                    ].map((c) => (
                      <TabsTrigger
                        className="flex-1"
                        value={c.type}
                        key={c.type}
                      >
                        {c.title}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Dynamic fields */}
            {challengeType === "httpChallenge" && (
              <div className="grid gap-2">
                <Label htmlFor="entryPoint">HTTP Challenge EntryPoint</Label>
                <Input
                  id="entryPoint"
                  value={entryPoint}
                  onChange={(e) => setEntryPoint(e.target.value)}
                  required
                  placeholder="web"
                />
                <div className="flex flex-wrap gap-2 mt-1">
                  {["web", "websecure", "traefik"].map((entryPoint) => (
                    <Badge
                      variant={"secondary"}
                      className="cursor-pointer "
                      key={entryPoint}
                      onClick={() => setEntryPoint(entryPoint)}
                    >
                      {entryPoint}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {challengeType === "dnsChallenge" && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="dnsProvider">DNS Provider</Label>
                  <Input
                    id="dnsProvider"
                    value={dnsProvider}
                    onChange={(e) => setDnsProvider(e.target.value)}
                    required
                    placeholder="cloudflare"
                  />
                  <div className="flex flex-wrap gap-2 mt-1">
                    {[
                      "cloudflare",
                      "route53",
                      "digitalocean",
                      "gandi",
                      "googlecloud",
                    ].map((provider) => (
                      <Badge
                        variant={"secondary"}
                        className="cursor-pointer "
                        key={provider}
                        onClick={() => setDnsProvider(provider)}
                      >
                        {provider}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dnsDelay">Delay Before Check (seconds)</Label>
                  <Input
                    id="dnsDelay"
                    type="number"
                    value={dnsDelay}
                    onChange={(e) => setDnsDelay(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
              </>
            )}

            {/* TLS has no fields */}

            <DialogFooter>
              <Button type="submit">Save Resolver</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
