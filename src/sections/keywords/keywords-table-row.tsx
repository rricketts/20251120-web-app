import { useState } from 'react';

import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import MenuItem from '@mui/material/MenuItem';

import { Iconify } from 'src/components/iconify';

type KeywordsTableRowProps = {
  row: {
    id: string;
    keyword: string;
    google_rank: number;
    visibility: number;
    kei: number;
    expected_traffic: number;
  };
  onEdit: () => void;
  onDelete: () => void;
};

export function KeywordsTableRow({ row, onEdit, onDelete }: KeywordsTableRowProps) {
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
        <TableCell>{row.keyword}</TableCell>
        <TableCell align="center">{row.google_rank}</TableCell>
        <TableCell align="center">{row.visibility.toFixed(2)}%</TableCell>
        <TableCell align="center">{row.kei.toFixed(2)}</TableCell>
        <TableCell align="center">{row.expected_traffic.toLocaleString()}</TableCell>
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
