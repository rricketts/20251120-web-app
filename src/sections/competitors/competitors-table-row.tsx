import { useState } from 'react';

import Popover from '@mui/material/Popover';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

type CompetitorsTableRowProps = {
  row: {
    id: string;
    domain: string;
    google_pr: number;
    alexa_rank: number;
    age: string;
    pages_in_google: number;
    backlinks: number;
    visibility: number;
  };
  onEdit: () => void;
  onDelete: () => void;
};

export function CompetitorsTableRow({ row, onEdit, onDelete }: CompetitorsTableRowProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    onEdit();
    handleCloseMenu();
  };

  const handleDelete = () => {
    onDelete();
    handleCloseMenu();
  };

  return (
    <>
      <TableRow hover tabIndex={-1}>
        <TableCell>{row.domain}</TableCell>
        <TableCell align="center">{row.google_pr}</TableCell>
        <TableCell align="center">{row.alexa_rank.toLocaleString()}</TableCell>
        <TableCell align="center">{row.age}</TableCell>
        <TableCell align="center">{row.pages_in_google.toLocaleString()}</TableCell>
        <TableCell align="center">{row.backlinks.toLocaleString()}</TableCell>
        <TableCell align="center">{row.visibility.toFixed(2)}%</TableCell>
        <TableCell align="right">
          <IconButton onClick={handleOpenMenu}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <Popover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleEdit}>
          <Iconify icon="solar:pen-bold" sx={{ mr: 2 }} />
          Edit
        </MenuItem>

        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Iconify icon="solar:trash-bin-trash-bold" sx={{ mr: 2 }} />
          Delete
        </MenuItem>
      </Popover>
    </>
  );
}
