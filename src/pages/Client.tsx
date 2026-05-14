import MainCard from 'components/MainCard';
import React, { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
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
import { apiService } from 'services/api';
import { Client as ClientRecord, ClientPageResult } from 'types';

const initialClientForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  company: '',
  notes: ''
};

type ClientForm = typeof initialClientForm;

const getClientId = (client: ClientRecord) => client.id;

const getClientName = (client: ClientRecord) =>
  `${client.firstName ?? client.first_name ?? ''} ${client.lastName ?? client.last_name ?? ''}`.trim();

const getClientCreatedAt = (client: ClientRecord) => client.createdAt ?? client.created_at;

const toClientForm = (client: ClientRecord): ClientForm => ({
  firstName: client.firstName ?? client.first_name ?? '',
  lastName: client.lastName ?? client.last_name ?? '',
  email: client.email ?? '',
  phone: client.phone ?? '',
  address: client.address ?? '',
  company: client.company ?? '',
  notes: client.notes ?? ''
});

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

type Order = 'asc' | 'desc';
type ClientSortCol = 'last_name' | 'email' | 'company' | 'created_at';

const pageTotal = (p: ClientPageResult) => p.total_elements ?? p.totalElements ?? 0;

export const Client: React.FC = () => {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);
  const [clientForm, setClientForm] = useState<ClientForm>(initialClientForm);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [orderBy, setOrderBy] = useState<ClientSortCol>('created_at');
  const [order, setOrder] = useState<Order>('desc');

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, rowsPerPage]);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiService.getClients({
        page,
        size: rowsPerPage,
        search: debouncedSearch || undefined,
        sort: [`${orderBy},${order}`]
      });
      setClients(data.content ?? []);
      setTotalElements(pageTotal(data));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch, orderBy, order]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleRequestSort = (property: ClientSortCol) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleOpenCreate = () => {
    setEditingClient(null);
    setClientForm(initialClientForm);
    setFormError('');
    setDrawerOpen(true);
  };

  const handleOpenEdit = (client: ClientRecord) => {
    setEditingClient(client);
    setClientForm(toClientForm(client));
    setFormError('');
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    if (saving) {
      return;
    }
    setDrawerOpen(false);
    setEditingClient(null);
    setClientForm(initialClientForm);
    setFormError('');
  };

  const handleClientFormChange = (field: keyof ClientForm, value: string) => {
    setClientForm((current) => ({ ...current, [field]: value }));
  };

  const validateForm = () => {
    if (!clientForm.firstName.trim() || !clientForm.lastName.trim() || !clientForm.email.trim()) {
      return 'First name, last name, and email are required.';
    }
    if (!validateEmail(clientForm.email.trim())) {
      return 'Enter a valid email address.';
    }
    if (clientForm.phone.trim().length > 20) {
      return 'Phone must be 20 characters or less.';
    }
    if (clientForm.company.trim().length > 255) {
      return 'Company must be 255 characters or less.';
    }
    return '';
  };

  const buildPayload = () => ({
    first_name: clientForm.firstName.trim(),
    last_name: clientForm.lastName.trim(),
    email: clientForm.email.trim(),
    ...(clientForm.phone.trim() ? { phone: clientForm.phone.trim() } : {}),
    ...(clientForm.address.trim() ? { address: clientForm.address.trim() } : {}),
    ...(clientForm.company.trim() ? { company: clientForm.company.trim() } : {}),
    ...(clientForm.notes.trim() ? { notes: clientForm.notes.trim() } : {})
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setSaving(true);
      setFormError('');
      if (editingClient) {
        await apiService.updateClient(getClientId(editingClient), buildPayload());
      } else {
        await apiService.createClient(buildPayload());
      }
      setDrawerOpen(false);
      setEditingClient(null);
      setClientForm(initialClientForm);
      await fetchClients();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || err.response?.data?.message || 'Failed to save client');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (client: ClientRecord) => {
    if (!window.confirm(`Delete client "${getClientName(client) || client.email}"?`)) {
      return;
    }

    try {
      await apiService.deleteClient(getClientId(client));
      await fetchClients();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete client');
    }
  };

  return (
    <MainCard title="Clients">
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2}>
          <Box>
            <Typography variant="h4">Clients</Typography>
            <Typography color="text.secondary">View and manage clients you are allowed to access.</Typography>
          </Box>
          <Button onClick={handleOpenCreate} variant="contained" sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}>
            Create New Client
          </Button>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          label="Search"
          placeholder="Name, email, company, phone, notes"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          size="small"
          sx={{ maxWidth: 400 }}
        />

        {loading ? (
          <Typography>Loading clients...</Typography>
        ) : clients.length === 0 ? (
          <Alert severity="info">No clients found. Create your first client to get started.</Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sortDirection={orderBy === 'last_name' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'last_name'}
                      direction={orderBy === 'last_name' ? order : 'asc'}
                      onClick={() => handleRequestSort('last_name')}
                    >
                      Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === 'email' ? order : false}>
                    <TableSortLabel active={orderBy === 'email'} direction={orderBy === 'email' ? order : 'asc'} onClick={() => handleRequestSort('email')}>
                      Email
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell sortDirection={orderBy === 'company' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'company'}
                      direction={orderBy === 'company' ? order : 'asc'}
                      onClick={() => handleRequestSort('company')}
                    >
                      Company
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === 'created_at' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'created_at'}
                      direction={orderBy === 'created_at' ? order : 'asc'}
                      onClick={() => handleRequestSort('created_at')}
                    >
                      Created
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clients.map((client) => {
                  const resourceId = getClientId(client);
                  const createdAt = getClientCreatedAt(client);

                  return (
                    <TableRow key={resourceId}>
                      <TableCell>{getClientName(client) || 'N/A'}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.phone || 'N/A'}</TableCell>
                      <TableCell>{client.company || 'N/A'}</TableCell>
                      <TableCell>{createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button onClick={() => handleOpenEdit(client)} variant="outlined" size="small">
                            Edit
                          </Button>
                          <Button onClick={() => handleDelete(client)} color="error" variant="outlined" size="small">
                            Delete
                          </Button>
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
            width: { xs: '100%', sm: 400 },
            borderTopLeftRadius: { xs: 0, sm: 16 },
            borderBottomLeftRadius: { xs: 0, sm: 16 },
            boxShadow: 24
          }
        }}
        ModalProps={{ keepMounted: true }}
      >
        <Box component="form" onSubmit={handleSubmit} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
            <Typography variant="h4">{editingClient ? 'Edit client' : 'Create client'}</Typography>
            <IconButton aria-label="Close client drawer" onClick={handleCloseDrawer} disabled={saving}>
              <CloseOutlined />
            </IconButton>
          </Stack>
          <Divider />

          <Stack spacing={2} sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              label="First name"
              value={clientForm.firstName}
              onChange={(event) => handleClientFormChange('firstName', event.target.value)}
              required
              fullWidth
              inputProps={{ maxLength: 100 }}
            />

            <TextField
              label="Last name"
              value={clientForm.lastName}
              onChange={(event) => handleClientFormChange('lastName', event.target.value)}
              required
              fullWidth
              inputProps={{ maxLength: 100 }}
            />

            <TextField
              label="Email"
              type="email"
              value={clientForm.email}
              onChange={(event) => handleClientFormChange('email', event.target.value)}
              required
              fullWidth
            />

            <TextField
              label="Phone"
              value={clientForm.phone}
              onChange={(event) => handleClientFormChange('phone', event.target.value)}
              fullWidth
              inputProps={{ maxLength: 20 }}
              helperText="Optional. Maximum 20 characters."
            />

            <TextField
              label="Company"
              value={clientForm.company}
              onChange={(event) => handleClientFormChange('company', event.target.value)}
              fullWidth
              inputProps={{ maxLength: 255 }}
            />

            <TextField
              label="Address"
              value={clientForm.address}
              onChange={(event) => handleClientFormChange('address', event.target.value)}
              fullWidth
              multiline
              minRows={3}
            />

            <TextField
              label="Notes"
              value={clientForm.notes}
              onChange={(event) => handleClientFormChange('notes', event.target.value)}
              fullWidth
              multiline
              minRows={4}
            />

            <FormHelperText>Required fields match the backend client schema: first name, last name, and email.</FormHelperText>
          </Stack>

          <Divider />
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ p: 2 }}>
            <Button onClick={handleCloseDrawer} variant="outlined" color="inherit" disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving} sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}>
              {saving ? 'Saving...' : editingClient ? 'Update Client' : 'Create Client'}
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </MainCard>
  );
};
