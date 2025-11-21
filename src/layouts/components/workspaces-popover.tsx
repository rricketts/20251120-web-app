import type { ButtonBaseProps } from '@mui/material/ButtonBase';

import { useState, useCallback } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Popover from '@mui/material/Popover';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import ButtonBase from '@mui/material/ButtonBase';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';

import { useRouter } from 'src/routes/hooks';

import { useProject } from 'src/contexts/project-context';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type WorkspacesPopoverProps = ButtonBaseProps & {
  data?: {
    id: string;
    name: string;
    logo: string;
    plan: string;
  }[];
};

export function WorkspacesPopover({ data = [], sx, ...other }: WorkspacesPopoverProps) {
  const router = useRouter();
  const { projects: rawProjects, selectedProject, setSelectedProject } = useProject();
  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);

  const projects = rawProjects.map((project) => ({
    id: project.id,
    name: project.name,
    logo: project.logo_url,
    plan: project.plan,
  }));

  const workspace = selectedProject
    ? {
        id: selectedProject.id,
        name: selectedProject.name,
        logo: selectedProject.logo_url,
        plan: selectedProject.plan,
      }
    : null;

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  const handleChangeWorkspace = useCallback(
    (newValue: (typeof data)[number]) => {
      const project = rawProjects.find((p) => p.id === newValue.id);
      if (project) {
        setSelectedProject(project);
      }
      handleClosePopover();
    },
    [handleClosePopover, rawProjects, setSelectedProject]
  );

  const handleManageProjects = useCallback(() => {
    handleClosePopover();
    router.push('/user/projects');
  }, [handleClosePopover, router]);

  const getDefaultColor = (name: string) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7B731', '#5F27CD', '#00D2D3', '#FF9FF3', '#54A0FF'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const renderAvatar = (name: string, logoUrl?: string | null) => {
    if (logoUrl) {
      return (
        <Box component="img" alt={name} src={logoUrl} sx={{ width: 24, height: 24, borderRadius: '50%' }} />
      );
    }

    return (
      <Box
        sx={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          bgcolor: getDefaultColor(name),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {name.charAt(0).toUpperCase()}
      </Box>
    );
  };

  const renderLabel = (plan: string) => (
    <Label color={plan === 'Free' ? 'default' : 'info'}>{plan}</Label>
  );

  if (!workspace && projects.length === 0) {
    return (
      <ButtonBase
        disableRipple
        onClick={handleManageProjects}
        sx={{
          pl: 2,
          py: 3,
          gap: 1.5,
          pr: 1.5,
          width: 1,
          borderRadius: 1.5,
          textAlign: 'left',
          justifyContent: 'flex-start',
          bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
          ...sx,
        }}
        {...other}
      >
        <Iconify icon="solar:add-circle-bold-duotone" width={24} sx={{ color: 'primary.main' }} />
        <Box
          sx={{
            gap: 1,
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            typography: 'body2',
            fontWeight: 'fontWeightSemiBold',
          }}
        >
          Create project
        </Box>
      </ButtonBase>
    );
  }

  return (
    <>
      <ButtonBase
        disableRipple
        onClick={handleOpenPopover}
        sx={{
          pl: 2,
          py: 3,
          gap: 1.5,
          pr: 1.5,
          width: 1,
          borderRadius: 1.5,
          textAlign: 'left',
          justifyContent: 'flex-start',
          bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
          ...sx,
        }}
        {...other}
      >
        {renderAvatar(workspace?.name || '', workspace?.logo)}

        <Box
          sx={{
            gap: 1,
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            typography: 'body2',
            fontWeight: 'fontWeightSemiBold',
          }}
        >
          {workspace?.name}
          {workspace?.plan && renderLabel(workspace.plan)}
        </Box>

        <Iconify width={16} icon="carbon:chevron-sort" sx={{ color: 'text.disabled' }} />
      </ButtonBase>

      <Popover open={!!openPopover} anchorEl={openPopover} onClose={handleClosePopover}>
        <MenuList
          disablePadding
          sx={{
            p: 0.5,
            gap: 0.5,
            width: 260,
            display: 'flex',
            flexDirection: 'column',
            [`& .${menuItemClasses.root}`]: {
              p: 1.5,
              gap: 1.5,
              borderRadius: 0.75,
              [`&.${menuItemClasses.selected}`]: {
                bgcolor: 'action.selected',
                fontWeight: 'fontWeightSemiBold',
              },
            },
          }}
        >
          {projects.map((option) => (
            <MenuItem
              key={option.id}
              selected={option.id === workspace?.id}
              onClick={() => handleChangeWorkspace(option)}
            >
              {renderAvatar(option.name, option.logo)}

              <Box component="span" sx={{ flexGrow: 1 }}>
                {option.name}
              </Box>

              {renderLabel(option.plan)}
            </MenuItem>
          ))}

          <Divider sx={{ my: 0.5 }} />

          <MenuItem onClick={handleManageProjects}>
            <Iconify icon="solar:settings-bold-duotone" width={24} />
            <Box component="span" sx={{ flexGrow: 1 }}>
              Manage projects
            </Box>
          </MenuItem>
        </MenuList>
      </Popover>
    </>
  );
}
