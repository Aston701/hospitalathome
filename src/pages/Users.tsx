import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, User, Shield, Stethoscope, Radio, Pencil, UserX, UserCheck } from "lucide-react";

type AppRole = Database["public"]["Enums"]["app_role"];

const Users = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    email: string;
    password: string;
    full_name: string;
    role: AppRole;
    phone: string;
    sendWelcomeEmail: boolean;
  }>({
    email: "",
    password: "",
    full_name: "",
    role: "nurse",
    phone: "",
    sendWelcomeEmail: false
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingUserId) {
        // Update existing user
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            full_name: formData.full_name,
            phone: formData.phone || null,
            role: formData.role
          })
          .eq("id", editingUserId);

        if (profileError) throw profileError;

        // Delete existing role and insert new one to ensure consistency
        const { error: deleteRoleError } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", editingUserId);

        if (deleteRoleError) throw deleteRoleError;

        // Insert the new role
        const { error: insertRoleError } = await supabase
          .from("user_roles")
          .insert({ 
            user_id: editingUserId,
            role: formData.role 
          });

        if (insertRoleError) throw insertRoleError;

        toast({
          title: "User updated",
          description: `${formData.full_name}'s role has been changed to ${formData.role}.`
        });
      } else {
        // Create new user
        const { data, error } = await supabase.functions.invoke('create-user', {
          body: {
            email: formData.email,
            password: formData.password,
            full_name: formData.full_name,
            role: formData.role,
            phone: formData.phone,
            sendWelcomeEmail: formData.sendWelcomeEmail
          }
        });

        console.log('Create user response:', { data, error });

        if (error) {
          console.error('Edge function error:', error);
          // Try to get more detailed error from the response
          throw new Error(error.message || 'Failed to create user');
        }
        
        // Check for function execution errors in the response
        if (data?.error) {
          console.error('Function returned error:', data.error);
          throw new Error(data.error);
        }

        // Verify the user was actually created
        if (!data?.user) {
          console.error('No user data returned:', data);
          throw new Error('User creation failed - no user data returned');
        }

        const successMessage = formData.sendWelcomeEmail 
          ? `${formData.full_name} has been added and welcome email sent.`
          : `${formData.full_name} has been added successfully.`;

        toast({
          title: "User created",
          description: successMessage
        });
      }

      setDialogOpen(false);
      setEditingUserId(null);
      setFormData({
        email: "",
        password: "",
        full_name: "",
        role: "nurse",
        phone: "",
        sendWelcomeEmail: false
      });
      fetchUsers();
    } catch (error: any) {
      console.error('User creation/update error:', error);
      
      // Extract the most useful error message
      let errorMessage = 'An unexpected error occurred';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUserId(user.id);
    setFormData({
      email: "", // Email can't be edited
      password: "", // Password not needed for edit
      full_name: user.full_name,
      role: user.role,
      phone: user.phone || "",
      sendWelcomeEmail: false
    });
    setDialogOpen(true);
  };


  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: !currentStatus })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: currentStatus ? "User disabled" : "User enabled",
        description: `User has been ${currentStatus ? "disabled" : "enabled"} successfully.`
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const handleAddUser = () => {
    setEditingUserId(null);
    setFormData({
      email: "",
      password: "",
      full_name: "",
      role: "nurse",
      phone: "",
      sendWelcomeEmail: false
    });
    setDialogOpen(true);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Shield className="h-4 w-4" />;
      case "doctor": return <Stethoscope className="h-4 w-4" />;
      case "nurse": return <User className="h-4 w-4" />;
      case "control_room": return <Radio className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-destructive/10 text-destructive border-destructive/20";
      case "doctor": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "nurse": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "control_room": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getRoleLabel = (role: string) => {
    return role.replace(/_/g, " ").split(" ").map(w => 
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(" ");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">
            Manage system users and their roles
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddUser}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingUserId ? "Edit User" : "Create New User"}</DialogTitle>
              <DialogDescription>
                {editingUserId 
                  ? "Update user information and role."
                  : "Add a new user to the system and assign their role."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  required
                />
              </div>
              {!editingUserId && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      required
                      minLength={6}
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as AppRole }))}
                  required
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nurse">Nurse</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="control_room">Control Room</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!editingUserId && (
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="sendWelcomeEmail"
                    checked={formData.sendWelcomeEmail}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, sendWelcomeEmail: checked as boolean }))
                    }
                  />
                  <Label 
                    htmlFor="sendWelcomeEmail" 
                    className="text-sm font-normal cursor-pointer"
                  >
                    Send welcome email with login credentials
                  </Label>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {editingUserId ? "Update User" : "Create User"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      {getRoleIcon(user.role)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{user.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{user.phone || "No phone"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant={user.is_active ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleToggleActive(user.id, user.is_active)}
                    >
                      {user.is_active ? (
                        <>
                          <UserX className="h-4 w-4 mr-1" />
                          Disable
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 mr-1" />
                          Enable
                        </>
                      )}
                    </Button>
                    <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                    {!user.is_active && (
                      <Badge variant="outline" className="bg-secondary">
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Users;