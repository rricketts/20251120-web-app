import { useState } from 'react';

import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';

import { Iconify } from 'src/components/iconify';

type BacklinksTableRowProps = {
  row: {
    id: string;
    backlink: string;
    nofollow: boolean;
    anchor_text: string;
    anchor_url: string;
    google_pr: number;
    alexa_rank: number;
  };
  onEdit: () => void;
  onDelete: () => void;
};

export function BacklinksTableRow({ row, onEdit, onDelete }: BacklinksTableRowProps) {
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
        <TableCell>
          <Link href={row.backlink} target="_blank" rel="noopener noreferrer" underline="hover">
            {row.backlink.length > 50 ? `${row.backlink.substring(0, 50)}...` : row.backlink}
          </Link>
        </TableCell>
        <TableCell align="center">
          {row.nofollow ? (
            <Chip label="Yes" size="small" color="default" />
          ) : (
            <Chip label="No" size="small" color="success" />
          )}
        </TableCell>
        <TableCell>{row.anchor_text}</TableCell>
        <TableCell>
          <Link href={row.anchor_url} target="_blank" rel="noopener noreferrer" underline="hover">
            {row.anchor_url.length > 40 ? `${row.anchor_url.substring(0, 40)}...` : row.anchor_url}
          </Link>
        </TableCell>
        <TableCell align="center">{row.google_pr}</TableCell>
        <TableCell align="center">{row.alexa_rank.toLocaleString()}</TableCell>
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
