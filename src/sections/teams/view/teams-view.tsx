import type { SelectChangeEvent } from '@mui/material/Select';

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import { useRouter } from 'src/routes/hooks';

import { supabase } from 'src/lib/supabase';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { TeamFormDialog } from '../team-form-dialog';

type Team = {
  id: string;
  name: string;
  plan: string;
  logo_url: string | null;
  owner_id: string;
  created_at: string;
  member_count?: number;
};

export function TeamsView() {
  const navigate = useNavigate();
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState('teams');
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    if (newValue === 'users') {
      navigate('/user');
    } else {
      setCurrentTab(newValue);
    }
  };

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);

      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (teamsError) {
        console.error('Error fetching teams:', teamsError);
        setTeams([]);
        return;
      }

      const teamsWithCounts = await Promise.all(
        (teamsData || []).map(async (team) => {
          const { count } = await supabase
            .from('team_members')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', team.id);

          return { ...team, member_count: count || 0 };
        })
      );

      setTeams(teamsWithCounts);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleOpenDialog = useCallback(() => {
    setEditingTeam(null);
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setEditingTeam(null);
  }, []);

  const handleEditTeam = useCallback((team: Team) => {
    setEditingTeam(team);
    setOpenDialog(true);
  }, []);

  const handleDeleteTeam = useCallback(
    async (teamId: string) => {
      if (!window.confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
        return;
      }

      try {
        const { error } = await supabase.from('teams').delete().eq('id', teamId);

        if (error) throw error;

        await fetchTeams();
      } catch (error) {
        console.error('Error deleting team:', error);
        alert('Failed to delete team. Please try again.');
      }
    },
    [fetchTeams]
  );

  const handleSaveTeam = useCallback(
    async (values: { name: string; plan: string }) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error('User not authenticated');

        if (editingTeam) {
          const { error: updateError } = await supabase
            .from('teams')
            .update({
              name: values.name,
              plan: values.plan,
            })
            .eq('id', editingTeam.id);

          if (updateError) throw updateError;
        } else {
          const { data: newTeam, error: insertError } = await supabase
            .from('teams')
            .insert({
              name: values.name,
              plan: values.plan,
              logo_url: null,
              owner_id: user.id,
            })
            .select()
            .single();

          if (insertError) throw insertError;

          if (newTeam) {
            const { error: memberError } = await supabase.from('team_members').insert({
              team_id: newTeam.id,
              user_id: user.id,
              role: 'owner',
            });

            if (memberError) throw memberError;
          }
        }

        await fetchTeams();
        handleCloseDialog();
      } catch (error) {
        console.error('Error saving team:', error);
        throw error;
      }
    },
    [editingTeam, fetchTeams, handleCloseDialog]
  );

  const getDefaultLogo = (name: string) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <DashboardContent>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Users & Teams</Typography>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleOpenDialog}
        >
          New team
        </Button>
      </Stack>

      <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Users" value="users" />
        <Tab label="Teams" value="teams" />
      </Tabs>

      {loading ? (
        <Card sx={{ p: 3 }}>
          <Typography>Loading teams...</Typography>
        </Card>
      ) : teams.length === 0 ? (
        <Card sx={{ p: 5, textAlign: 'center' }}>
          <Iconify
            icon="solar:users-group-two-rounded-bold-duotone"
            width={80}
            sx={{ mb: 2, color: 'text.disabled', mx: 'auto' }}
          />
          <Typography variant="h6" sx={{ mb: 1 }}>
            No teams yet
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Create your first team to get started
          </Typography>
          <Button
            variant="contained"
            color="inherit"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={handleOpenDialog}
          >
            Create team
          </Button>
        </Card>
      ) : (
        <Stack spacing={2}>
          {teams.map((team) => (
            <Card key={team.id}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{ p: 3 }}
              >
                <Avatar
                  src={team.logo_url || undefined}
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: team.logo_url ? 'transparent' : getDefaultLogo(team.name),
                  }}
                >
                  {!team.logo_url && team.name.charAt(0).toUpperCase()}
                </Avatar>

                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="h6" noWrap>
                    {team.name}
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {team.plan} plan
                    </Typography>
                    <Divider orientation="vertical" flexItem />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {team.member_count} {team.member_count === 1 ? 'member' : 'members'}
                    </Typography>
                  </Stack>
                </Box>

                <Stack direction="row" spacing={1}>
                  <IconButton
                    size="small"
                    onClick={() => handleEditTeam(team)}
                    sx={{ color: 'text.secondary' }}
                  >
                    <Iconify icon="solar:pen-bold" width={20} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteTeam(team.id)}
                    sx={{ color: 'error.main' }}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" width={20} />
                  </IconButton>
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}

      <TeamFormDialog
        open={openDialog}
        team={editingTeam}
        onClose={handleCloseDialog}
        onSave={handleSaveTeam}
      />
    </DashboardContent>
  );
}
