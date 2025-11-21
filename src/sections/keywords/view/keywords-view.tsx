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
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { KeywordFormDialog } from '../keyword-form-dialog';
import { KeywordsTableHead } from '../keywords-table-head';
import { KeywordsTableRow } from '../keywords-table-row';
import { KeywordsTableToolbar } from '../keywords-table-toolbar';
import { emptyRows, applyFilter, getComparator } from '../utils';
import { TableEmptyRows } from '../table-empty-rows';
import { TableNoData } from '../table-no-data';

type Keyword = {
  id: string;
  keyword: string;
  google_rank: number;
  visibility: number;
  kei: number;
  expected_traffic: number;
  created_at: string;
  updated_at: string;
};

export function KeywordsView() {
  const { user } = useAuth();
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [orderBy, setOrderBy] = useState('keyword');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Keyword | null>(null);

  const fetchKeywords = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('keywords')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKeywords(data || []);
    } catch (err) {
      console.error('Error fetching keywords:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchKeywords();
  }, [fetchKeywords]);

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
      const { error } = await supabase.from('keywords').delete().eq('id', id);
      if (error) throw error;
      fetchKeywords();
    } catch (err) {
      console.error('Error deleting keyword:', err);
    }
  };

  const handleEdit = (keyword: Keyword) => {
    setEditData(keyword);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditData(null);
  };

  const dataFiltered = applyFilter({
    inputData: keywords,
    comparator: getComparator(order, orderBy),
    filterName,
  });

  const notFound = !dataFiltered.length && !!filterName;

  return (
    <DashboardContent>
      <Box display="flex" alignItems="center" mb={5}>
        <Typography variant="h4" flexGrow={1}>
          Keywords
        </Typography>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => setDialogOpen(true)}
        >
          New Keyword
        </Button>
      </Box>

      <Card>
        <KeywordsTableToolbar filterName={filterName} onFilterName={handleFilterByName} />

        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <KeywordsTableHead
                order={order}
                orderBy={orderBy}
                onSort={handleSort}
                headLabel={[
                  { id: 'keyword', label: 'Keyword' },
                  { id: 'google_rank', label: 'Google Rank', align: 'center' },
                  { id: 'visibility', label: 'Visibility', align: 'center' },
                  { id: 'kei', label: 'KEI', align: 'center' },
                  { id: 'expected_traffic', label: 'Expected Traffic', align: 'center' },
                  { id: 'actions', label: 'Actions', align: 'right' },
                ]}
              />
              <TableBody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                      <CircularProgress />
                    </td>
                  </tr>
                ) : (
                  <>
                    {dataFiltered
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((row) => (
                        <KeywordsTableRow
                          key={row.id}
                          row={row}
                          onEdit={() => handleEdit(row)}
                          onDelete={() => handleDelete(row.id)}
                        />
                      ))}

                    <TableEmptyRows
                      height={68}
                      emptyRows={emptyRows(page, rowsPerPage, keywords.length)}
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

      <KeywordFormDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSuccess={fetchKeywords}
        editData={editData}
      />
    </DashboardContent>
  );
}
