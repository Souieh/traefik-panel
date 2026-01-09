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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Service {
  loadBalancer: {
    servers: { url?: string; address?: string }[];
  };
}

export default function ServicesPage() {
  const [services, setServices] = useState<Record<string, Service>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [protocol, setProtocol] = useState<"http" | "tcp" | "udp">("http");

  const [name, setName] = useState("");
  const [serverUrl, setServerUrl] = useState("");

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const endpoint =
        protocol === "http"
          ? "/traefik/services"
          : `/traefik/${protocol}/services`;
      const res = await api.get(endpoint);
      setServices(res.data);
    } catch {
      toast.error("Error fetching services");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [protocol]);

  const openAddModal = () => {
    setEditingName(null);
    setName("");
    setServerUrl("");
    setIsModalOpen(true);
  };

  const handleEdit = (serviceName: string, config: Service) => {
    setEditingName(serviceName);
    setName(serviceName);
    const server = config.loadBalancer?.servers?.[0];
    setServerUrl(server?.url || server?.address || "");
    setIsModalOpen(true);
  };

  const handleDelete = async (serviceName: string) => {
    if (!confirm(`Delete service "${serviceName}"?`)) return;
    try {
      const endpoint =
        protocol === "http"
          ? "/traefik/services"
          : `/traefik/${protocol}/services`;
      await api.delete(`${endpoint}/${serviceName}`);
      toast.success("Service deleted");
      fetchServices();
    } catch {
      toast.error("Error deleting service");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      loadBalancer: {
        servers: [
          protocol === "http" ? { url: serverUrl } : { address: serverUrl },
        ],
      },
    };

    try {
      const endpoint =
        protocol === "http"
          ? "/traefik/services"
          : `/traefik/${protocol}/services`;
      await api.post(`${endpoint}/${name}`, payload);
      toast.success("Service saved");
      setIsModalOpen(false);
      fetchServices();
    } catch {
      toast.error("Error saving service");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Services</h1>
          <Tabs value={protocol} onValueChange={(v) => setProtocol(v as any)}>
            <TabsList>
              <TabsTrigger value="http">HTTP</TabsTrigger>
              <TabsTrigger value="tcp">TCP</TabsTrigger>
              <TabsTrigger value="udp">UDP</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" /> Add Service
        </Button>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingName ? "Edit Service" : "Add Service"}
            </DialogTitle>
            <DialogDescription>
              {editingName
                ? "Update existing service configuration."
                : "Create a new service configuration."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
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
            <div className="grid gap-2">
              <Label htmlFor="url">
                {protocol === "http" ? "Server URL" : "Server Address"}
              </Label>
              <Input
                id="url"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder={
                  protocol === "http"
                    ? "http://127.0.0.1:3000"
                    : "127.0.0.1:9000"
                }
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit">Save Service</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Servers</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(services).map(([serviceName, config]) => (
              <TableRow key={serviceName}>
                <TableCell className="font-medium">{serviceName}</TableCell>
                <TableCell>
                  {config.loadBalancer?.servers?.map((s, i) => (
                    <div key={i}>{s.url || s.address}</div>
                  ))}
                </TableCell>
                <TableCell className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(serviceName, config)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(serviceName)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {Object.keys(services).length === 0 && !isLoading && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground"
                >
                  No services found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
