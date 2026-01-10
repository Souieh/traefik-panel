import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
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
import { authService } from "@/services/auth";
import type { User } from "@/types/auth";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Filter,
  Key,
  Mail,
  Pencil,
  Search,
  Shield,
  Trash2,
  User as UserIcon,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface UserWithRole extends User {
  role: string;
  isDisabled?: boolean;
  lastLogin?: string;
  createdAt?: string;
}

interface RolePermission {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

const rolePermissions: Record<string, RolePermission> = {
  operator: {
    id: "operator",
    name: "Operator",
    description: "Can view and manage configurations, but cannot manage users",
    permissions: [
      "View all configurations",
      "Create/edit routers",
      "Create/edit services",
      "Create/edit middlewares",
      "Manage certificate resolvers",
    ],
  },
  admin: {
    id: "admin",
    name: "Admin",
    description: "Full system access including user management",
    permissions: [
      "All Operator permissions",
      "Create/edit/delete users",
      "Manage user roles",
      "System configuration",
      "View audit logs",
    ],
  },
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [currentUser, setCurrentUser] = useState<UserWithRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("all");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("operator");
  const [isDisabled, setisDisabled] = useState(true);

  useEffect(() => {
    authService
      .getProfile()
      .then((u) => setCurrentUser(u as UserWithRole))
      .catch(() => {});
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/users");
      setUsers(response.data);
    } catch (error) {
      toast.error("Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingUser(null);
    setUsername("");
    setEmail("");
    setPassword("");
    setRole("operator");
    setisDisabled(true);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleEdit = (user: UserWithRole) => {
    setEditingUser(user);
    setUsername(user.username);
    setEmail(user.email);
    setPassword("");
    setRole(user.role);
    setisDisabled(!!user.isDisabled);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleDelete = async (username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) return;
    try {
      await api.delete(`/users/${username}`);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const handleToggleStatus = async (user: UserWithRole) => {
    const newStatus = !user.isDisabled;
    const action = newStatus ? "activate" : "deactivate";

    if (!confirm(`Are you sure you want to ${action} user "${user.username}"?`))
      return;

    try {
      await api.put(`/users/${user.username}`, {
        ...user,
        isDisabled: newStatus,
      });
      toast.success(`User ${action}d successfully`);
      fetchUsers();
    } catch (error) {
      toast.error(`Failed to ${action} user`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      toast.error("Username is required");
      return;
    }

    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    if (!editingUser && !password) {
      toast.error("Password is required for new users");
      return;
    }

    try {
      const payload: any = {
        username,
        email,
        role,
        isDisabled,
      };

      if (password) payload.password = password;

      if (editingUser) {
        await api.put(`/users/${editingUser.username}`, payload);
        toast.success("User updated successfully");
      } else {
        await api.post("/users", payload);
        toast.success("User created successfully");
      }

      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(
        editingUser ? "Failed to update user" : "Failed to create user"
      );
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = selectedRole === "all" || user.role === selectedRole;

    return matchesSearch && matchesRole;
  });

  const isAdmin = currentUser?.role === "admin";
  const isOwnAccount = (user: UserWithRole) =>
    currentUser && user.username === currentUser.username;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderModal = () => {
    const selectedRoleInfo = rolePermissions[role];

    return (
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editingUser ? (
              <>
                <Pencil className="h-5 w-5" />
                Edit User:{" "}
                <Badge variant="outline">{editingUser.username}</Badge>
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                Create New User
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="permissions">Role & Permissions</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    Username
                    <Badge variant="outline" className="text-xs">
                      Required
                    </Badge>
                  </Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={!!editingUser}
                    placeholder="johndoe"
                    className="font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                    <Badge variant="outline" className="text-xs">
                      Required
                    </Badge>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Password
                  {editingUser && (
                    <Badge variant="outline" className="text-xs">
                      Optional
                    </Badge>
                  )}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!editingUser}
                    placeholder={
                      editingUser
                        ? "Leave blank to keep current"
                        : "Enter password"
                    }
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {editingUser
                    ? "Leave blank to keep current password"
                    : "Minimum 8 characters with letters and numbers"}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Switch
                    checked={isDisabled}
                    onCheckedChange={setisDisabled}
                  />
                  Active Account
                </Label>
                <p className="text-sm text-muted-foreground">
                  {isDisabled
                    ? "User can log in and access the system"
                    : "User account is disabled and cannot log in"}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  User Role
                </Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <SelectValue placeholder="Select role" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operator">
                      <div className="flex flex-col">
                        <span className="font-medium">Operator</span>
                        <span className="text-xs text-muted-foreground">
                          Manage configurations
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex flex-col">
                        <span className="font-medium">Admin</span>
                        <span className="text-xs text-muted-foreground">
                          Full system access
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedRoleInfo && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      {selectedRoleInfo.name} Permissions
                    </CardTitle>
                    <CardDescription>
                      {selectedRoleInfo.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedRoleInfo.permissions.map((permission, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{permission}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingUser ? "Update User" : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" /> User Management
          </h1>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openAddModal}>
            <UserPlus className="mr-2 h-4 w-4" /> Add User
          </Button>
        )}
      </div>

      <Card className=" overflow-x-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex flex-wrap gap-2">
              <CardTitle>Users</CardTitle>
              <CardDescription>
                {users.length} user{users.length !== 1 ? "s" : ""} in the system
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 flex-wrap ">
              <div className="relative min-w-46 flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-40">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Filter by role" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="operator">Operators</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            {renderModal()}
          </Dialog>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No users found</h3>
              <p className="text-muted-foreground mt-2">
                {searchTerm || selectedRole !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by creating your first user"}
              </p>
              {isAdmin && !searchTerm && selectedRole === "all" && (
                <Button onClick={openAddModal} className="mt-4">
                  <UserPlus className="mr-2 h-4 w-4" /> Create User
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Created</TableHead>
                    {isAdmin && (
                      <TableHead className="w-[120px]">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const isCurrentUser = isOwnAccount(user);
                    const isDisabledUser = !user.isDisabled;

                    return (
                      <TableRow key={user.username} className="group">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                              <UserIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{user.username}</div>
                              <div className="text-sm text-muted-foreground">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.role === "admin" ? "default" : "secondary"
                            }
                            className="gap-1"
                          >
                            <Shield className="h-3 w-3" />
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={isDisabledUser ? "outline" : "secondary"}
                            className="gap-1"
                          >
                            {isDisabledUser ? (
                              <>
                                <CheckCircle className="h-3 w-3" />
                                Active
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3 w-3" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {formatDate(user.lastLogin)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(user.createdAt)}
                          </div>
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!isCurrentUser && (
                                <>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleToggleStatus(user)}
                                    title={
                                      isDisabledUser ? "Deactivate" : "Activate"
                                    }
                                  >
                                    {isDisabledUser ? (
                                      <AlertCircle className="h-4 w-4" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleEdit(user)}
                                    title="Edit"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleDelete(user.username)}
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </>
                              )}
                              {isCurrentUser && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleEdit(user)}
                                  title="Edit Profile"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <div className="grid md:grid-cols-2  gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                User Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Users
                  </span>
                  <span className="font-semibold">{users.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Active Users
                  </span>
                  <span className="font-semibold">
                    {users.filter((u) => !u.isDisabled).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Admins</span>
                  <span className="font-semibold">
                    {users.filter((u) => u.role === "admin").length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Operators
                  </span>
                  <span className="font-semibold">
                    {users.filter((u) => u.role === "operator").length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Role Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.values(rolePermissions).map((roleInfo) => (
                  <div key={roleInfo.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{roleInfo.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {users.filter((u) => u.role === roleInfo.id).length}{" "}
                        users
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {roleInfo.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
