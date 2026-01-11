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
import { Plus, Edit, Trash2, Users, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { managementActions } from '@/features/management/store';
import { logAdded } from '@/features/audit-logs/store';
import type { ManagementRoleGroup } from '../types';

export function RoleGroupManagement() {
  const { t } = useTranslation('management');
  const dispatch = useAppDispatch();
  const roleGroups = useAppSelector((s) => s.management.roleGroups);
  const roles = useAppSelector((s) => s.management.roles);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ManagementRoleGroup | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    roles: [] as string[],
  });

  const filteredGroups = roleGroups.filter((g) => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (group?: ManagementRoleGroup) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        name: group.name,
        description: group.description,
        roles: [...group.roles],
      });
    } else {
      setEditingGroup(null);
      setFormData({
        name: '',
        description: '',
        roles: [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) {
      toast.error(t('roleGroups.errors.nameRequired', { defaultValue: 'Group name is required' }));
      return;
    }

    const groupData = {
      name: formData.name,
      description: formData.description,
      roles: formData.roles,
      userCount: editingGroup?.userCount ?? 0,
    };

    if (editingGroup) {
      dispatch(managementActions.roleGroupUpdated({ id: editingGroup.id, patch: groupData }));
      dispatch(logAdded({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        operator: 'Current User',
        action: 'UPDATE_ROLE_GROUP',
        target: editingGroup.name,
        details: 'Updated role group',
        status: 'success'
      }));
      toast.success(t('roleGroups.updated', { defaultValue: 'Role group updated' }));
    } else {
      const newGroup: ManagementRoleGroup = {
        ...groupData,
        id: Date.now().toString(),
      };
      dispatch(managementActions.roleGroupAdded(newGroup));
      dispatch(logAdded({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        operator: 'Current User',
        action: 'CREATE_ROLE_GROUP',
        target: newGroup.name,
        details: 'Created new role group',
        status: 'success'
      }));
      toast.success(t('roleGroups.created', { defaultValue: 'Role group created' }));
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(t('roleGroups.confirmDelete', { defaultValue: 'Are you sure you want to delete this role group?' }))) {
      dispatch(managementActions.roleGroupRemoved(id));
      dispatch(logAdded({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        operator: 'Current User',
        action: 'DELETE_ROLE_GROUP',
        target: name,
        details: 'Deleted role group',
        status: 'success'
      }));
      toast.success(t('roleGroups.deleted', { defaultValue: 'Role group deleted' }));
    }
  };

  const toggleRole = (roleName: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(roleName)
        ? prev.roles.filter(r => r !== roleName)
        : [...prev.roles, roleName]
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('roleGroups.searchPlaceholder', { defaultValue: 'Search role groups...' })}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          {t('roleGroups.create', { defaultValue: 'Create Role Group' })}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGroups.map((group) => (
          <Card key={group.id} className="p-4 flex flex-col h-full">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{group.name}</h3>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(group)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(group.id, group.name)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-grow">
              {group.description}
            </p>

            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Included Roles:</div>
              <div className="flex flex-wrap gap-1">
                {group.roles.map(r => (
                  <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? t('roleGroups.edit', { defaultValue: 'Edit Role Group' }) : t('roleGroups.create', { defaultValue: 'Create Role Group' })}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Group Name</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Engineering Managers"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe the role group..."
              />
            </div>

            <div className="space-y-2">
              <Label>Select Roles</Label>
              <div className="border rounded-md p-2 max-h-48 overflow-y-auto space-y-2">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`role-${role.id}`}
                      checked={formData.roles.includes(role.name)}
                      onCheckedChange={() => toggleRole(role.name)}
                    />
                    <label 
                      htmlFor={`role-${role.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {role.name}
                    </label>
                  </div>
                ))}
              </div>
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
