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
import api from "@/lib/api";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Resolver {
  acme?: {
    email: string;
    storage: string;
    httpChallenge?: {
      entryPoint: string;
    };
  };
}

export default function CertificatesResolversPage() {
  const [resolvers, setResolvers] = useState<Record<string, Resolver>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [storage, setStorage] = useState("acme.json");
  const [entryPoint, setEntryPoint] = useState("web");

  const fetchResolvers = async () => {
    try {
      const response = await api.get("/traefik/certificates-resolvers");
      setResolvers(response.data);
    } catch (error) {
      toast.error("Error fetching certificate resolvers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResolvers();
  }, []);

  const openAddModal = () => {
    setEditingName(null);
    setName("");
    setEmail("");
    setStorage("acme.json");
    setEntryPoint("web");
    setIsModalOpen(true);
  };

  const handleEdit = (resolverName: string, config: Resolver) => {
    setEditingName(resolverName);
    setName(resolverName);
    if (config.acme) {
      setEmail(config.acme.email || "");
      setStorage(config.acme.storage || "acme.json");
      setEntryPoint(config.acme.httpChallenge?.entryPoint || "web");
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (resolverName: string) => {
    if (!confirm(`Are you sure you want to delete resolver ${resolverName}?`))
      return;
    try {
      await api.delete(`/traefik/certificates-resolvers/${resolverName}`);
      toast.success("Resolver deleted");
      fetchResolvers();
    } catch (error) {
      toast.error("Error deleting resolver");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        acme: {
          email,
          storage,
          httpChallenge: {
            entryPoint,
          },
        },
      };

      await api.post(`/traefik/certificates-resolvers/${name}`, payload);
      toast.success("Resolver saved");
      setIsModalOpen(false);
      fetchResolvers();
    } catch (error) {
      toast.error("Error saving resolver");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Certificate Resolvers</h1>
        <Button onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" /> Add Resolver
        </Button>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingName ? "Edit Resolver" : "Add New Resolver"}
              </DialogTitle>
              <DialogDescription>
                {editingName
                  ? "Update existing certificate resolver configuration."
                  : "Create a new certificate resolver."}
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
              <div className="grid gap-2">
                <Label htmlFor="storage">Storage</Label>
                <Input
                  id="storage"
                  value={storage}
                  onChange={(e) => setStorage(e.target.value)}
                  required
                  placeholder="acme.json"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="entryPoint">HTTP Challenge EntryPoint</Label>
                <Input
                  id="entryPoint"
                  value={entryPoint}
                  onChange={(e) => setEntryPoint(e.target.value)}
                  required
                  placeholder="web"
                />
              </div>
              <DialogFooter>
                <Button type="submit">Save Resolver</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Storage</TableHead>
              <TableHead>Challenge</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(resolvers).map(([resolverName, config]) => (
              <TableRow key={resolverName}>
                <TableCell className="font-medium">{resolverName}</TableCell>
                <TableCell>{config.acme?.email}</TableCell>
                <TableCell>{config.acme?.storage}</TableCell>
                <TableCell>
                  {config.acme?.httpChallenge
                    ? `HTTP (${config.acme.httpChallenge.entryPoint})`
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(resolverName, config)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(resolverName)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {Object.keys(resolvers).length === 0 && !isLoading && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  No resolvers found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
