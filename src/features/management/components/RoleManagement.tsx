import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Textarea } from '@/app/components/ui/textarea';
import { Plus, Edit, Trash2, Shield, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { managementActions } from '@/features/management/store';
import { logAdded } from '@/features/audit-logs/store';
import { PERMISSION_MODULES } from '../constants';
import type { ManagementRole } from '../types';

export function RoleManagement() {
  const { t } = useTranslation('management');
  const dispatch = useAppDispatch();
  const roles = useAppSelector((s) => s.management.roles);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<ManagementRole | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  });

  const filteredRoles = roles.filter((r) => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (role?: ManagementRole) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description,
        permissions: [...role.permissions],
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        description: '',
        permissions: [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) {
      toast.error(t('roles.errors.nameRequired', { defaultValue: 'Role name is required' }));
      return;
    }

    const roleData = {
      name: formData.name,
      description: formData.description,
      permissions: formData.permissions,
      type: (editingRole?.type ?? 'custom') as 'custom' | 'system',
      userCount: editingRole?.userCount ?? 0,
    };

    if (editingRole) {
      dispatch(managementActions.roleUpdated({ id: editingRole.id, patch: roleData }));
      dispatch(logAdded({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        operator: 'Current User', // TODO: Get actual user
        action: 'UPDATE_ROLE',
        target: editingRole.name,
        details: 'Updated role permissions/details',
        status: 'success'
      }));
      toast.success(t('roles.updated', { defaultValue: 'Role updated' }));
    } else {
      const newRole: ManagementRole = {
        ...roleData,
        id: Date.now().toString(),
      };
      dispatch(managementActions.roleAdded(newRole));
      dispatch(logAdded({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        operator: 'Current User',
        action: 'CREATE_ROLE',
        target: newRole.name,
        details: 'Created new role',
        status: 'success'
      }));
      toast.success(t('roles.created', { defaultValue: 'Role created' }));
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(t('roles.confirmDelete', { defaultValue: 'Are you sure you want to delete this role?' }))) {
      dispatch(managementActions.roleRemoved(id));
      dispatch(logAdded({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        operator: 'Current User',
        action: 'DELETE_ROLE',
        target: name,
        details: 'Deleted role',
        status: 'success'
      }));
      toast.success(t('roles.deleted', { defaultValue: 'Role deleted' }));
    }
  };

  const togglePermission = (id: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(id)
        ? prev.permissions.filter(p => p !== id)
        : [...prev.permissions, id]
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('roles.searchPlaceholder', { defaultValue: 'Search roles...' })}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          {t('roles.create', { defaultValue: 'Create Role' })}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRoles.map((role) => (
          <Card key={role.id} className="p-4 flex flex-col h-full">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{role.name}</h3>
                {role.type === 'system' && (
                  <Badge variant="secondary" className="text-xs">System</Badge>
                )}
              </div>
              {role.type === 'custom' && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(role)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(role.id, role.name)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-grow">
              {role.description}
            </p>

            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Permissions:</div>
              <div className="flex flex-wrap gap-1">
                {role.permissions.slice(0, 5).map(p => (
                  <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                ))}
                {role.permissions.length > 5 && (
                  <Badge variant="outline" className="text-xs">+{role.permissions.length - 5}</Badge>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? t('roles.edit', { defaultValue: 'Edit Role' }) : t('roles.create', { defaultValue: 'Create Role' })}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role Name</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Data Analyst"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe the role's responsibilities..."
              />
            </div>

            <div className="space-y-4 border rounded-md p-4">
              <Label className="text-base">Permissions</Label>
              {PERMISSION_MODULES.map((module) => (
                <div key={module.id} className="space-y-2">
                  <div className="font-medium text-sm text-primary border-b pb-1">
                    {module.name}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {module.functions.map((func) => (
                      <div key={func.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={func.id} 
                          checked={formData.permissions.includes(func.id)}
                          onCheckedChange={() => togglePermission(func.id)}
                        />
                        <label 
                          htmlFor={func.id} 
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {func.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('actions.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button onClick={handleSave}>
              {t('actions.save', { defaultValue: 'Save' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
