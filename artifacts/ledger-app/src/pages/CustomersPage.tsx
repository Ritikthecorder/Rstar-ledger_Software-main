import { useState } from "react";
import { Link } from "wouter";
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from "@/hooks/useCustomers";
import { useSettingsStore } from "@/store/settings";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash2, User, Phone, Mail } from "lucide-react";
import type { Customer } from "@/types/database";

interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  opening_balance: number;
}

function CustomerForm({
  defaultValues,
  onSubmit,
  loading,
}: {
  defaultValues?: Partial<CustomerFormData>;
  onSubmit: (data: CustomerFormData) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<CustomerFormData>({
    name: defaultValues?.name ?? "",
    phone: defaultValues?.phone ?? "",
    email: defaultValues?.email ?? "",
    address: defaultValues?.address ?? "",
    opening_balance: defaultValues?.opening_balance ?? 0,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-4"
    >
      <div className="space-y-1">
        <Label>Name *</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Phone</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Address</Label>
        <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label>Opening Balance</Label>
        <Input
          type="number"
          step="0.01"
          value={form.opening_balance}
          onChange={(e) => setForm({ ...form, opening_balance: parseFloat(e.target.value) || 0 })}
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function CustomersPage() {
  const { toast } = useToast();
  const settings = useSettingsStore((s) => s.settings);
  const currency = settings?.currency ?? "INR";
  const { data: customers, isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = (customers ?? []).filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? "").includes(search) ||
    (c.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (data: CustomerFormData) => {
    try {
      await createCustomer.mutateAsync(data);
      toast({ title: "Customer added" });
      setShowCreate(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleUpdate = async (data: CustomerFormData) => {
    if (!editingCustomer) return;
    try {
      await updateCustomer.mutateAsync({ id: editingCustomer.id, ...data });
      toast({ title: "Customer updated" });
      setEditingCustomer(null);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteCustomer.mutateAsync(deletingId);
      toast({ title: "Customer deleted" });
      setDeletingId(null);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground text-sm mt-1">{customers?.length ?? 0} customers</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <User className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No customers found</p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>Add your first customer</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((customer) => (
            <Card key={customer.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <Link href={`/customers/${customer.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary font-semibold text-sm">
                          {customer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate hover:text-primary transition-colors">
                          {customer.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {customer.phone && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />{customer.phone}
                            </span>
                          )}
                        </div>
                        {customer.email && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Mail className="h-3 w-3" />{customer.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        Opening: {new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(customer.opening_balance ?? 0)}
                      </Badge>
                    </div>
                  </Link>
                  <div className="flex gap-1 ml-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingCustomer(customer)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeletingId(customer.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
          </DialogHeader>
          <CustomerForm onSubmit={handleCreate} loading={createCustomer.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingCustomer} onOpenChange={() => setEditingCustomer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          {editingCustomer && (
            <CustomerForm
              defaultValues={{
                name: editingCustomer.name,
                phone: editingCustomer.phone ?? "",
                email: editingCustomer.email ?? "",
                address: editingCustomer.address ?? "",
                opening_balance: editingCustomer.opening_balance ?? 0,
              }}
              onSubmit={handleUpdate}
              loading={updateCustomer.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this customer and all their transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
