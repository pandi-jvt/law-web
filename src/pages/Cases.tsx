import MainCard from 'components/MainCard';
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip, { ChipProps } from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import { useAuth } from 'contexts/AuthContext';
import { apiService } from 'services/api';
import { Case, CasePageResult, CaseStatus, Client } from 'types';
import { canCreateCase, canDeleteCase } from 'utils/permissions';

const statusLabel = (status: CaseStatus | string) => status.replace(/_/g, ' ');

const statusColor = (status: CaseStatus | string): ChipProps['color'] => {
  if (status === CaseStatus.OPEN) {
    return 'success';
  }
  if (status === CaseStatus.CLOSED) {
    return 'error';
  }
  if (status === CaseStatus.IN_PROGRESS) {
    return 'warning';
  }
  return 'default';
};

type Order = 'asc' | 'desc';
type CaseSortCol = 'case_number' | 'title' | 'status' | 'opened_date' | 'created_at' | 'next_hearing_date';

const pageTotal = (p: CasePageResult) => p.total_elements ?? p.totalElements ?? 0;

const initialCaseForm = {
  title: '',
  caseNumber: '',
  clientInternalId: '',
  status: CaseStatus.OPEN,
  description: '',
  fileNo: '',
  fileDate: '',
  courtNo: '',
  courtName: '',
  oppositeParty: '',
  policeStation: '',
  underSection: '',
  firNo: '',
  nextHearingDate: ''
};

const toIsoFromLocal = (value: string) => (value ? new Date(value).toISOString() : undefined);

const getCaseFileNo = (c: Case) => c.fileNo ?? c.file_no ?? '';
const getCaseNextHearing = (c: Case) => c.nextHearingDate ?? c.next_hearing_date;

export const Cases: React.FC = () => {
    const { user } = useAuth();
    const [cases, setCases] = useState<Case[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [clientsLoading, setClientsLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    const [createError, setCreateError] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [caseForm, setCaseForm] = useState(initialCaseForm);
    const [statusFilter, setStatusFilter] = useState<CaseStatus | undefined>(undefined);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [orderBy, setOrderBy] = useState<CaseSortCol>('created_at');
    const [order, setOrder] = useState<Order>('desc');

    useEffect(() => {
      const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
      return () => window.clearTimeout(t);
    }, [searchInput]);

    useEffect(() => {
      setPage(0);
    }, [debouncedSearch, statusFilter, rowsPerPage]);

    const fetchCases = useCallback(async () => {
      try {
        setLoading(true);
        setError('');
        const sortKey = orderBy;
        const data = await apiService.getCases({
          page,
          size: rowsPerPage,
          search: debouncedSearch || undefined,
          status: statusFilter,
          sort: [`${sortKey},${order}`]
        });
        setCases(data.content ?? []);
        setTotalElements(pageTotal(data));
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to fetch cases');
      } finally {
        setLoading(false);
      }
    }, [page, rowsPerPage, debouncedSearch, statusFilter, orderBy, order]);

    useEffect(() => {
      fetchCases();
    }, [fetchCases]);

    useEffect(() => {
      if (drawerOpen) {
        fetchClients();
      }
    }, [drawerOpen]);

    const fetchClients = async () => {
      try {
        setClientsLoading(true);
        const data = await apiService.getClients({ page: 0, size: 200 });
        setClients(data.content ?? []);
      } catch (err: any) {
        setCreateError(err.response?.data?.detail || 'Failed to load clients');
      } finally {
        setClientsLoading(false);
      }
    };

    const handleRequestSort = (property: CaseSortCol) => {
      const isAsc = orderBy === property && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(property);
    };

    const handleOpenDrawer = () => {
      setCreateError('');
      setDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
      if (creating) {
        return;
      }
      setDrawerOpen(false);
      setCreateError('');
      setCaseForm(initialCaseForm);
    };

    const handleCaseFormChange = (field: keyof typeof initialCaseForm, value: string | CaseStatus) => {
      setCaseForm((current) => ({ ...current, [field]: value }));
    };

    const handleCreateCase = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!caseForm.title.trim() || !caseForm.caseNumber.trim() || !caseForm.clientInternalId) {
        setCreateError('Title, case number, and client are required.');
        return;
      }

      try {
        setCreating(true);
        setCreateError('');
        await apiService.createCase({
          title: caseForm.title.trim(),
          case_number: caseForm.caseNumber.trim(),
          client_internal_id: caseForm.clientInternalId,
          status: caseForm.status,
          ...(caseForm.description.trim() ? { description: caseForm.description.trim() } : {}),
          ...(caseForm.fileNo.trim() ? { file_no: caseForm.fileNo.trim() } : {}),
          ...(caseForm.fileDate ? { file_date: toIsoFromLocal(caseForm.fileDate) } : {}),
          ...(caseForm.courtNo.trim() ? { court_no: caseForm.courtNo.trim() } : {}),
          ...(caseForm.courtName.trim() ? { court_name: caseForm.courtName.trim() } : {}),
          ...(caseForm.oppositeParty.trim() ? { opposite_party: caseForm.oppositeParty.trim() } : {}),
          ...(caseForm.policeStation.trim() ? { police_station: caseForm.policeStation.trim() } : {}),
          ...(caseForm.underSection.trim() ? { under_section: caseForm.underSection.trim() } : {}),
          ...(caseForm.firNo.trim() ? { fir_no: caseForm.firNo.trim() } : {}),
          ...(caseForm.nextHearingDate ? { next_hearing_date: toIsoFromLocal(caseForm.nextHearingDate) } : {})
        });
        setDrawerOpen(false);
        setCaseForm(initialCaseForm);
        await fetchCases();
      } catch (err: any) {
        setCreateError(err.response?.data?.detail || err.response?.data?.message || 'Failed to create case');
      } finally {
        setCreating(false);
      }
    };

    const handleDelete = async (id: number | string) => {
      if (!window.confirm('Are you sure you want to delete this case ?')) {
        return;
      }
  
      try {
        await apiService.deleteCase(id);
        await fetchCases();
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Failed to delete case');
      }
    };

    return (
      <MainCard title="Cases">
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2}>
            <Box>
              <Typography variant="h4">Cases</Typography>
              <Typography color="text.secondary">View and manage cases you are allowed to access.</Typography>
            </Box>
            {canCreateCase(user) && (
              <Button onClick={handleOpenDrawer} variant="contained" sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}>
                Create New Case
              </Button>
            )}
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
            <TextField
              label="Search"
              placeholder="Title, case number, description"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              size="small"
              sx={{ minWidth: { md: 280 }, flex: 1 }}
            />
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="case-status-filter-label">Filter by Status</InputLabel>
              <Select
                labelId="case-status-filter-label"
                label="Filter by Status"
                value={statusFilter || ''}
                onChange={(e) => setStatusFilter(e.target.value ? (e.target.value as CaseStatus) : undefined)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value={CaseStatus.OPEN}>Open</MenuItem>
                <MenuItem value={CaseStatus.IN_PROGRESS}>In Progress</MenuItem>
                <MenuItem value={CaseStatus.CLOSED}>Closed</MenuItem>
                <MenuItem value={CaseStatus.ON_HOLD}>On Hold</MenuItem>
              </Select>
            </FormControl>
          </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        {loading ? (
          <Typography>Loading cases...</Typography>
        ) : cases.length === 0 ? (
          <Alert severity="info">
            No cases found.
            {canCreateCase(user) ? ' Create your first case to get started.' : ' You do not currently have assigned cases.'}
          </Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sortDirection={orderBy === 'case_number' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'case_number'}
                      direction={orderBy === 'case_number' ? order : 'asc'}
                      onClick={() => handleRequestSort('case_number')}
                    >
                      Case Number
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === 'title' ? order : false}>
                    <TableSortLabel active={orderBy === 'title'} direction={orderBy === 'title' ? order : 'asc'} onClick={() => handleRequestSort('title')}>
                      Title
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === 'status' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'status'}
                      direction={orderBy === 'status' ? order : 'asc'}
                      onClick={() => handleRequestSort('status')}
                    >
                      Status
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell sortDirection={orderBy === 'opened_date' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'opened_date'}
                      direction={orderBy === 'opened_date' ? order : 'asc'}
                      onClick={() => handleRequestSort('opened_date')}
                    >
                      Opened Date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === 'next_hearing_date' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'next_hearing_date'}
                      direction={orderBy === 'next_hearing_date' ? order : 'asc'}
                      onClick={() => handleRequestSort('next_hearing_date')}
                    >
                      Next Hearing
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>File No.</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cases.map((caseItem) => {
                  const resourceId = caseItem.id;
                  const clientName = caseItem.client
                    ? `${caseItem.client.firstName ?? caseItem.client.first_name} ${caseItem.client.lastName ?? caseItem.client.last_name}`
                    : 'N/A';
                  const openedDate = caseItem.openedDate ?? caseItem.opened_date;
                  const nextH = getCaseNextHearing(caseItem);

                  return (
                    <TableRow key={resourceId}>
                      <TableCell>{caseItem.caseNumber ?? caseItem.case_number}</TableCell>
                      <TableCell>{caseItem.title}</TableCell>
                      <TableCell>
                        <Chip label={statusLabel(caseItem.status)} color={statusColor(caseItem.status)} size="small" />
                      </TableCell>
                      <TableCell>{clientName}</TableCell>
                      <TableCell>{openedDate ? new Date(openedDate).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>{nextH ? new Date(nextH).toLocaleString() : '—'}</TableCell>
                      <TableCell>{getCaseFileNo(caseItem) || '—'}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button component={Link} to={`/cases/${resourceId}`} variant="outlined" size="small">
                            View
                          </Button>
                          {canDeleteCase(user) && (
                            <Button onClick={() => handleDelete(resourceId)} color="error" variant="outlined" size="small">
                              Delete
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              rowsPerPageOptions={[5, 10, 25, 50]}
              count={totalElements}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </TableContainer>
        )}
        </Stack>
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={handleCloseDrawer}
          PaperProps={{
            sx: {
              width: { xs: '100%', sm: 480 },
              borderTopLeftRadius: { xs: 0, sm: 16 },
              borderBottomLeftRadius: { xs: 0, sm: 16 },
              boxShadow: 24
            }
          }}
          ModalProps={{ keepMounted: true }}
        >
          <Box component="form" onSubmit={handleCreateCase} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
              <Typography variant="h4">Create case</Typography>
              <IconButton aria-label="Close create case drawer" onClick={handleCloseDrawer} disabled={creating}>
                <CloseOutlined />
              </IconButton>
            </Stack>
            <Divider />

            <Stack spacing={2} sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
              {createError && <Alert severity="error">{createError}</Alert>}

              <TextField
                label="Case title"
                value={caseForm.title}
                onChange={(event) => handleCaseFormChange('title', event.target.value)}
                required
                fullWidth
                inputProps={{ maxLength: 255 }}
              />

              <TextField
                label="Case number"
                value={caseForm.caseNumber}
                onChange={(event) => handleCaseFormChange('caseNumber', event.target.value)}
                required
                fullWidth
                inputProps={{ maxLength: 100 }}
                helperText="Use your firm or court case reference."
              />

              <FormControl fullWidth required error={!caseForm.clientInternalId && Boolean(createError)}>
                <InputLabel id="create-case-client-label">Client</InputLabel>
                <Select
                  labelId="create-case-client-label"
                  label="Client"
                  value={caseForm.clientInternalId}
                  onChange={(event) => handleCaseFormChange('clientInternalId', event.target.value)}
                  disabled={clientsLoading}
                >
                  {clients.map((client) => {
                    const clientId = client.id;
                    const clientName = `${client.firstName ?? client.first_name} ${client.lastName ?? client.last_name}`;
                    return (
                      <MenuItem key={clientId ?? client.email} value={clientId ?? ''} disabled={!clientId}>
                        {clientName}
                      </MenuItem>
                    );
                  })}
                </Select>
                <FormHelperText>
                  {clientsLoading ? 'Loading clients...' : clients.length === 0 ? 'Create or assign a client before creating a case.' : 'Select the client this case belongs to.'}
                </FormHelperText>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel id="create-case-status-label">Status</InputLabel>
                <Select
                  labelId="create-case-status-label"
                  label="Status"
                  value={caseForm.status}
                  onChange={(event) => handleCaseFormChange('status', event.target.value as CaseStatus)}
                >
                  <MenuItem value={CaseStatus.OPEN}>Open</MenuItem>
                  <MenuItem value={CaseStatus.IN_PROGRESS}>In Progress</MenuItem>
                  <MenuItem value={CaseStatus.ON_HOLD}>On Hold</MenuItem>
                  <MenuItem value={CaseStatus.CLOSED}>Closed</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Description"
                value={caseForm.description}
                onChange={(event) => handleCaseFormChange('description', event.target.value)}
                fullWidth
                multiline
                minRows={4}
                placeholder="Add relevant case notes, scope, or filing details."
              />

              <Divider textAlign="left">Court & filing</Divider>

              <TextField
                label="File No."
                value={caseForm.fileNo}
                onChange={(event) => handleCaseFormChange('fileNo', event.target.value)}
                fullWidth
                inputProps={{ maxLength: 100 }}
              />
              <TextField
                label="File date"
                type="datetime-local"
                value={caseForm.fileDate}
                onChange={(event) => handleCaseFormChange('fileDate', event.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Court No."
                value={caseForm.courtNo}
                onChange={(event) => handleCaseFormChange('courtNo', event.target.value)}
                fullWidth
                inputProps={{ maxLength: 100 }}
              />
              <TextField
                label="Court"
                value={caseForm.courtName}
                onChange={(event) => handleCaseFormChange('courtName', event.target.value)}
                fullWidth
                inputProps={{ maxLength: 255 }}
              />
              <TextField
                label="Opposite Party"
                value={caseForm.oppositeParty}
                onChange={(event) => handleCaseFormChange('oppositeParty', event.target.value)}
                fullWidth
                inputProps={{ maxLength: 500 }}
              />
              <TextField
                label="Police Station"
                value={caseForm.policeStation}
                onChange={(event) => handleCaseFormChange('policeStation', event.target.value)}
                fullWidth
                inputProps={{ maxLength: 255 }}
              />
              <TextField
                label="Under Section"
                value={caseForm.underSection}
                onChange={(event) => handleCaseFormChange('underSection', event.target.value)}
                fullWidth
                inputProps={{ maxLength: 255 }}
              />
              <TextField
                label="FIR No."
                value={caseForm.firNo}
                onChange={(event) => handleCaseFormChange('firNo', event.target.value)}
                fullWidth
                inputProps={{ maxLength: 100 }}
              />
              <TextField
                label="Next Hearing Date"
                type="datetime-local"
                value={caseForm.nextHearingDate}
                onChange={(event) => handleCaseFormChange('nextHearingDate', event.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Stack>

            <Divider />
            <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ p: 2 }}>
              <Button onClick={handleCloseDrawer} variant="outlined" color="inherit" disabled={creating}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={creating || clientsLoading || !caseForm.clientInternalId}
                sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
              >
                {creating ? 'Creating...' : 'Create Case'}
              </Button>
            </Stack>
          </Box>
        </Drawer>
      </MainCard>
    );
  };