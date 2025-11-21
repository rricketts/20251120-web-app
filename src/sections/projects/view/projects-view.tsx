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
import { useAuth } from 'src/contexts/auth-context';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { ProjectFormDialog } from '../project-form-dialog';

type Project = {
  id: string;
  name: string;
  plan: string;
  logo_url: string | null;
  owner_id: string;
  created_at: string;
  member_count?: number;
};

export function ProjectsView() {
  const navigate = useNavigate();
  const router = useRouter();
  const { userRole } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user?.email);

      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Projects query result:', { projectsData, projectsError });

      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
        setProjects([]);
        return;
      }

      const projectsWithCounts = await Promise.all(
        (projectsData || []).map(async (project) => {
          const { count } = await supabase
            .from('project_members')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id);

          return { ...project, member_count: count || 0 };
        })
      );

      console.log('Final projects with counts:', projectsWithCounts);
      setProjects(projectsWithCounts);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleOpenDialog = useCallback(() => {
    setEditingProject(null);
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setEditingProject(null);
  }, []);

  const handleEditProject = useCallback((project: Project) => {
    setEditingProject(project);
    setOpenDialog(true);
  }, []);

  const handleDeleteProject = useCallback(
    async (projectId: string) => {
      if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
        return;
      }

      try {
        const { error } = await supabase.from('projects').delete().eq('id', projectId);

        if (error) throw error;

        await fetchProjects();
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project. Please try again.');
      }
    },
    [fetchProjects]
  );

  const handleSaveProject = useCallback(
    async (values: { name: string; plan: string; managerId: string }) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error('User not authenticated');

        if (editingProject) {
          const { error: updateError } = await supabase
            .from('projects')
            .update({
              name: values.name,
              plan: values.plan,
            })
            .eq('id', editingProject.id);

          if (updateError) throw updateError;
        } else {
          const ownerId = userRole === 'admin' && values.managerId ? values.managerId : user.id;

          const { data: newProject, error: insertError } = await supabase
            .from('projects')
            .insert({
              name: values.name,
              plan: values.plan,
              logo_url: null,
              owner_id: ownerId,
            })
            .select()
            .single();

          if (insertError) throw insertError;

          if (newProject) {
            const { error: memberError } = await supabase.from('project_members').insert({
              project_id: newProject.id,
              user_id: ownerId,
              role: 'owner',
            });

            if (memberError) throw memberError;
          }
        }

        await fetchProjects();
        handleCloseDialog();
      } catch (error) {
        console.error('Error saving project:', error);
        throw error;
      }
    },
    [editingProject, fetchProjects, handleCloseDialog, userRole]
  );

  const getDefaultLogo = (name: string) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <DashboardContent>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Projects</Typography>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleOpenDialog}
        >
          New project
        </Button>
      </Stack>

      {loading ? (
        <Card sx={{ p: 3 }}>
          <Typography>Loading projects...</Typography>
        </Card>
      ) : projects.length === 0 ? (
        <Card sx={{ p: 5, textAlign: 'center' }}>
          <Iconify
            icon="solar:folder-with-files-bold-duotone"
            width={80}
            sx={{ mb: 2, color: 'text.disabled', mx: 'auto' }}
          />
          <Typography variant="h6" sx={{ mb: 1 }}>
            No projects yet
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Create your first project to get started
          </Typography>
          <Button
            variant="contained"
            color="inherit"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={handleOpenDialog}
          >
            Create project
          </Button>
        </Card>
      ) : (
        <Stack spacing={2}>
          {projects.map((project) => (
            <Card key={project.id}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{ p: 3 }}
              >
                <Avatar
                  src={project.logo_url || undefined}
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: project.logo_url ? 'transparent' : getDefaultLogo(project.name),
                  }}
                >
                  {!project.logo_url && project.name.charAt(0).toUpperCase()}
                </Avatar>

                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="h6" noWrap>
                    {project.name}
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {project.plan} plan
                    </Typography>
                    <Divider orientation="vertical" flexItem />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {project.member_count} {project.member_count === 1 ? 'member' : 'members'}
                    </Typography>
                  </Stack>
                </Box>

                <Stack direction="row" spacing={1}>
                  <IconButton
                    size="small"
                    onClick={() => handleEditProject(project)}
                    sx={{ color: 'text.secondary' }}
                  >
                    <Iconify icon="solar:pen-bold" width={20} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteProject(project.id)}
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

      <ProjectFormDialog
        open={openDialog}
        project={editingProject}
        onClose={handleCloseDialog}
        onSave={handleSaveProject}
        currentUserRole={userRole}
      />
    </DashboardContent>
  );
}
