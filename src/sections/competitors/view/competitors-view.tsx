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

import { DashboardContent } from 'src/layouts/dashboard';
import { supabase } from 'src/lib/supabase';
import { useAuth } from 'src/contexts/auth-context';
import { useProject } from 'src/contexts/project-context';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { CompetitorFormDialog } from '../competitor-form-dialog';
import { CompetitorsTableHead } from '../competitors-table-head';
import { CompetitorsTableRow } from '../competitors-table-row';
import { CompetitorsTableToolbar } from '../competitors-table-toolbar';
import { emptyRows, applyFilter, getComparator } from '../utils';
import { TableEmptyRows } from '../table-empty-rows';
import { TableNoData } from '../table-no-data';

type Competitor = {
  id: string;
  domain: string;
  google_pr: number;
  alexa_rank: number;
  age: string;
  pages_in_google: number;
  backlinks: number;
  visibility: number;
  created_at: string;
  updated_at: string;
};

export function CompetitorsView() {
  const { user } = useAuth();
  const { selectedProject } = useProject();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [orderBy, setOrderBy] = useState('domain');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Competitor | null>(null);

  const fetchCompetitors = useCallback(async () => {
    if (!selectedProject?.id) {
      setCompetitors([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('competitors')
        .select('*')
        .eq('project_id', selectedProject.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompetitors(data || []);
    } catch (err) {
      console.error('Error fetching competitors:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedProject?.id]);

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

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
      const { error } = await supabase.from('competitors').delete().eq('id', id);
      if (error) throw error;
      fetchCompetitors();
    } catch (err) {
      console.error('Error deleting competitor:', err);
    }
  };

  const handleEdit = (competitor: Competitor) => {
    setEditData(competitor);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditData(null);
  };

  const dataFiltered = applyFilter({
    inputData: competitors,
    comparator: getComparator(order, orderBy),
    filterName,
  });

  const notFound = !dataFiltered.length && !!filterName;

  return (
    <DashboardContent>
      <Box display="flex" alignItems="center" mb={5}>
        <Typography variant="h4" flexGrow={1}>
          Competitors
        </Typography>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => setDialogOpen(true)}
          disabled={!selectedProject}
        >
          New Competitor
        </Button>
      </Box>

      <Card>
        <CompetitorsTableToolbar filterName={filterName} onFilterName={handleFilterByName} />

        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <CompetitorsTableHead
                order={order}
                orderBy={orderBy}
                onSort={handleSort}
                headLabel={[
                  { id: 'domain', label: 'Domain' },
                  { id: 'google_pr', label: 'Google PR', align: 'center' },
                  { id: 'alexa_rank', label: 'Alexa Rank', align: 'center' },
                  { id: 'age', label: 'Age', align: 'center' },
                  { id: 'pages_in_google', label: 'Pages in Google', align: 'center' },
                  { id: 'backlinks', label: 'Backlinks', align: 'center' },
                  { id: 'visibility', label: 'Visibility', align: 'center' },
                  { id: 'actions', label: 'Actions', align: 'right' },
                ]}
              />
              <TableBody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                      <CircularProgress />
                    </td>
                  </tr>
                ) : (
                  <>
                    {dataFiltered
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((row) => (
                        <CompetitorsTableRow
                          key={row.id}
                          row={row}
                          onEdit={() => handleEdit(row)}
                          onDelete={() => handleDelete(row.id)}
                        />
                      ))}

                    <TableEmptyRows
                      height={68}
                      emptyRows={emptyRows(page, rowsPerPage, competitors.length)}
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

      <CompetitorFormDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSuccess={fetchCompetitors}
        editData={editData}
        projectId={selectedProject?.id}
      />
    </DashboardContent>
  );
}
