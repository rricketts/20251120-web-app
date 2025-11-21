import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { supabase } from 'src/lib/supabase';
import { useAuth } from 'src/contexts/auth-context';
import { DashboardContent } from 'src/layouts/dashboard';
import { useProject } from 'src/contexts/project-context';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { TableNoData } from '../table-no-data';
import { TableEmptyRows } from '../table-empty-rows';
import { BacklinksTableRow } from '../backlinks-table-row';
import { BacklinkFormDialog } from '../backlink-form-dialog';
import { BacklinksTableHead } from '../backlinks-table-head';
import { emptyRows, applyFilter, getComparator } from '../utils';
import { BacklinksTableToolbar } from '../backlinks-table-toolbar';

type Backlink = {
  id: string;
  backlink: string;
  nofollow: boolean;
  anchor_text: string;
  anchor_url: string;
  google_pr: number;
  alexa_rank: number;
  created_at: string;
  updated_at: string;
};

export function BacklinksView() {
  useAuth();
  const { selectedProject } = useProject();
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [orderBy, setOrderBy] = useState('backlink');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Backlink | null>(null);

  const fetchBacklinks = useCallback(async () => {
    if (!selectedProject?.id) {
      setBacklinks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('backlinks')
        .select('*')
        .eq('project_id', selectedProject.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBacklinks(data || []);
    } catch (err) {
      console.error('Error fetching backlinks:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedProject?.id]);

  useEffect(() => {
    fetchBacklinks();
  }, [fetchBacklinks]);

  const handleSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterByName = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPage(0);
    setFilterName(event.target.value);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('backlinks').delete().eq('id', id);
      if (error) throw error;
      fetchBacklinks();
    } catch (err) {
      console.error('Error deleting backlink:', err);
    }
  };

  const handleEdit = (backlink: Backlink) => {
    setEditData(backlink);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditData(null);
  };

  const dataFiltered = applyFilter({
    inputData: backlinks,
    comparator: getComparator(order, orderBy),
    filterName,
  });

  const notFound = !dataFiltered.length && !!filterName;

  return (
    <DashboardContent>
      <Box display="flex" alignItems="center" mb={5}>
        <Typography variant="h4" flexGrow={1}>
          Backlinks
        </Typography>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => setDialogOpen(true)}
          disabled={!selectedProject}
        >
          New Backlink
        </Button>
      </Box>

      <Card>
        <BacklinksTableToolbar filterName={filterName} onFilterName={handleFilterByName} />

        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <BacklinksTableHead
                order={order}
                orderBy={orderBy}
                onSort={handleSort}
                headLabel={[
                  { id: 'backlink', label: 'Backlink' },
                  { id: 'nofollow', label: 'Nofollow', align: 'center' },
                  { id: 'anchor_text', label: 'Anchor Text' },
                  { id: 'anchor_url', label: 'Anchor URL' },
                  { id: 'google_pr', label: 'Google PR', align: 'center' },
                  { id: 'alexa_rank', label: 'Alexa Rank', align: 'center' },
                  { id: 'actions', label: 'Actions', align: 'right' },
                ]}
              />
              <TableBody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                      <CircularProgress />
                    </td>
                  </tr>
                ) : (
                  <>
                    {dataFiltered
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((row) => (
                        <BacklinksTableRow
                          key={row.id}
                          row={row}
                          onEdit={() => handleEdit(row)}
                          onDelete={() => handleDelete(row.id)}
                        />
                      ))}

                    <TableEmptyRows
                      height={68}
                      emptyRows={emptyRows(page, rowsPerPage, backlinks.length)}
                    />

                    {notFound && <TableNoData searchQuery={filterName} />}
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        <TablePagination
          component="div"
          page={page}
          count={dataFiltered.length}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      <BacklinkFormDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSuccess={fetchBacklinks}
        editData={editData}
        projectId={selectedProject?.id}
      />
    </DashboardContent>
  );
}
