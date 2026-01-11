import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Plus, Edit, Trash2, Users, Search, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { managementActions } from '@/features/management/store';
import { logAdded } from '@/features/audit-logs/store';
import type { ManagementTeam } from '../types';

export function TeamManagement() {
  const { t } = useTranslation('management');
  const dispatch = useAppDispatch();
  const teams = useAppSelector((s) => s.management.teams);
  const roles = useAppSelector((s) => s.management.roles);
  const roleGroups = useAppSelector((s) => s.management.roleGroups);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<ManagementTeam | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department: '',
    serviceAccount: '',
    teamLeader: '',
    contactEmail: '',
    assignedRoles: [] as string[],
    assignedGroups: [] as string[],
  });

  const filteredTeams = teams.filter((t) => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (t.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (team?: ManagementTeam) => {
    if (team) {
      setEditingTeam(team);
      setFormData({
        name: team.name,
        description: team.description || '',
        department: team.department || '',
        serviceAccount: team.serviceAccount || '',
        teamLeader: team.teamLeader || '',
        contactEmail: team.contactEmail || '',
        assignedRoles: team.roles || [],
        assignedGroups: team.roleGroups || [],
      });
    } else {
      setEditingTeam(null);
      setFormData({
        name: '',
        description: '',
        department: '',
        serviceAccount: '',
        teamLeader: '',
        contactEmail: '',
        assignedRoles: [],
        assignedGroups: [],
      });
    }
    setIsDialogOpen(true);
  };

  const validateForm = () => {
    if (!formData.name) return 'Team name is required';
    if (!formData.department) return 'Department is required';
    if (!formData.serviceAccount) return 'Service Account is required';
    if (!formData.teamLeader) return 'Team Leader is required';
    if (!formData.contactEmail) return 'Contact Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) return 'Invalid email format';
    return null;
  };

  const handleSave = () => {
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    const teamData = {
      name: formData.name,
      description: formData.description,
      department: formData.department,
      serviceAccount: formData.serviceAccount,
      teamLeader: formData.teamLeader,
      contactEmail: formData.contactEmail,
      roles: formData.assignedRoles,
      roleGroups: formData.assignedGroups,
      // Preserve existing fields
      members: editingTeam?.members ?? 0,
      apis: editingTeam?.apis ?? 0,
      code: editingTeam?.code ?? formData.name.substring(0, 3).toUpperCase(),
      color: editingTeam?.color ?? 'bg-blue-500',
      lastVerifiedAt: editingTeam?.lastVerifiedAt ?? new Date().toISOString(),
    };

    if (editingTeam) {
      dispatch(managementActions.teamUpdated({ id: editingTeam.id, patch: teamData }));
      dispatch(logAdded({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        operator: 'Current User',
        action: 'UPDATE_TEAM',
        target: editingTeam.name,
        details: 'Updated team details',
        status: 'success'
      }));
      toast.success(t('teams.updated', { defaultValue: 'Team updated' }));
    } else {
      const newTeam: ManagementTeam = {
        ...teamData,
        id: Date.now().toString(),
      };
      dispatch(managementActions.teamAdded(newTeam));
      dispatch(logAdded({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        operator: 'Current User',
        action: 'CREATE_TEAM',
        target: newTeam.name,
        details: 'Created new team',
        status: 'success'
      }));
      toast.success(t('teams.created', { defaultValue: 'Team created' }));
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(t('teams.confirmDelete', { defaultValue: 'Are you sure you want to delete this team?' }))) {
      dispatch(managementActions.teamRemoved(id));
      dispatch(logAdded({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        operator: 'Current User',
        action: 'DELETE_TEAM',
        target: name,
        details: 'Deleted team',
        status: 'success'
      }));
      toast.success(t('teams.deleted', { defaultValue: 'Team deleted' }));
    }
  };

  const handleVerify = (team: ManagementTeam) => {
    dispatch(managementActions.teamUpdated({
      id: team.id,
      patch: { lastVerifiedAt: new Date().toISOString() }
    }));
    toast.success('Contact information verified successfully');
    dispatch(logAdded({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      operator: 'Current User',
      action: 'VERIFY_TEAM_CONTACT',
      target: team.name,
      details: 'Verified team contact info',
      status: 'success'
    }));
  };

  const isVerificationOverdue = (dateStr?: string) => {
    if (!dateStr) return true;
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 90; // 90 days = ~3 months
  };

  const toggleAssignedRole = (roleId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedRoles: prev.assignedRoles.includes(roleId)
        ? prev.assignedRoles.filter(r => r !== roleId)
        : [...prev.assignedRoles, roleId]
    }));
  };

  const toggleAssignedGroup = (groupId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedGroups: prev.assignedGroups.includes(groupId)
        ? prev.assignedGroups.filter(g => g !== groupId)
        : [...prev.assignedGroups, groupId]
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('teams.searchPlaceholder', { defaultValue: 'Search teams...' })}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          {t('teams.create', { defaultValue: 'Create Team' })}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredTeams.map((team) => {
          const overdue = isVerificationOverdue(team.lastVerifiedAt);
          return (
            <Card key={team.id} className="p-4">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-2 flex-grow">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">{team.name}</h3>
                    <Badge variant="outline">{team.department || 'No Dept'}</Badge>
                    {overdue && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Verification Overdue
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{team.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-2">
                    <div>
                      <span className="font-medium text-muted-foreground block">Team Leader</span>
                      {team.teamLeader || '-'}
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground block">Service Account</span>
                      {team.serviceAccount || '-'}
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground block">Contact</span>
                      {team.contactEmail || '-'}
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground block">Last Verified</span>
                      {team.lastVerifiedAt ? new Date(team.lastVerifiedAt).toLocaleDateString() : 'Never'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col gap-2 justify-start md:justify-center min-w-[120px]">
                  <Button variant="outline" size="sm" onClick={() => handleOpenDialog(team)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </Button>
                  {overdue ? (
                     <Button variant="default" size="sm" onClick={() => handleVerify(team)} className="bg-amber-600 hover:bg-amber-700">
                       <CheckCircle className="mr-2 h-4 w-4" /> Verify Info
                     </Button>
                  ) : (
                    <Button variant="ghost" size="sm" disabled>
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Verified
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(team.id, team.name)} className="text-destructive hover:text-destructive/90">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTeam ? t('teams.edit', { defaultValue: 'Edit Team' }) : t('teams.create', { defaultValue: 'Create Team' })}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Team Name *</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Payment Squad"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Department *</Label>
              <Input 
                value={formData.department} 
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                placeholder="e.g., Engineering"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Team responsibilities..."
              />
            </div>

            <div className="space-y-2">
              <Label>Service Account *</Label>
              <Input 
                value={formData.serviceAccount} 
                onChange={(e) => setFormData({...formData, serviceAccount: e.target.value})}
                placeholder="e.g., sa-payment@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Team Leader *</Label>
              <Input 
                value={formData.teamLeader} 
                onChange={(e) => setFormData({...formData, teamLeader: e.target.value})}
                placeholder="User Name or ID"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Contact Email *</Label>
              <Input 
                value={formData.contactEmail} 
                onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                placeholder="e.g., payment-team@company.com"
              />
            </div>

            <div className="space-y-2 md:col-span-2 border rounded-md p-4">
              <Label className="text-base mb-2 block">Permission Assignment</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2 text-sm">Roles</h4>
                  <div className="border rounded-md p-2 h-40 overflow-y-auto space-y-2 bg-muted/30">
                    {roles.map((role) => (
                      <div key={role.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`team-role-${role.id}`}
                          checked={formData.assignedRoles.includes(role.id)}
                          onCheckedChange={() => toggleAssignedRole(role.id)}
                        />
                        <label htmlFor={`team-role-${role.id}`} className="text-sm cursor-pointer">
                          {role.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2 text-sm">Role Groups</h4>
                  <div className="border rounded-md p-2 h-40 overflow-y-auto space-y-2 bg-muted/30">
                    {roleGroups.map((group) => (
                      <div key={group.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`team-group-${group.id}`}
                          checked={formData.assignedGroups.includes(group.id)}
                          onCheckedChange={() => toggleAssignedGroup(group.id)}
                        />
                        <label htmlFor={`team-group-${group.id}`} className="text-sm cursor-pointer">
                          {group.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
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
