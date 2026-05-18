import MainCard from 'components/MainCard';
import React, { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
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
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import { useAuth } from 'contexts/AuthContext';
import { apiService } from 'services/api';
import { GroupRole, User, UserPageResult } from 'types';
import { isGroupAdmin } from 'utils/permissions';
import { extractTenDigitMobile, INDIA_COUNTRY_CODE, isValidIndianMobile10 } from 'utils/phone';

const initialUserForm = {
  fullName: '',
  email: '',
  phoneNumber: '',
  groupRole: GroupRole.LAWYER
};

type UserForm = typeof initialUserForm;

const formatLabel = (value?: string | null) =>
  value ? String(value).replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) : 'Not set';

const getName = (user: User) => user.fullName ?? user.full_name ?? user.username;
const getPhone = (user: User) => user.phoneNumber ?? user.phone_number ?? 'Not set';
const getRole = (user: User) => formatLabel(user.groupRole ?? user.group_role ?? user.role);
const getCreatedAt = (user: User) => user.createdAt ?? user.created_at;

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

type Order = 'asc' | 'desc';
type UserSortCol = 'full_name' | 'email' | 'username' | 'created_at';

const pageTotal = (p: UserPageResult) => p.total_elements ?? p.totalElements ?? 0;

const validateForm = (form: UserForm) => {
  if (!form.fullName.trim()) {
    return 'Full name is required.';
  }
  if (!validateEmail(form.email.trim())) {
    return 'Enter a valid email address.';
  }
  if (!isValidIndianMobile10(form.phoneNumber)) {
    return 'Phone number must be exactly 10 digits.';
  }
  if (!form.groupRole) {
    return 'Role is required.';
  }
  return '';
};

export const AccountSettings: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [userForm, setUserForm] = useState<UserForm>(initialUserForm);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [orderBy, setOrderBy] = useState<UserSortCol>('full_name');
  const [order, setOrder] = useState<Order>('asc');

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, rowsPerPage]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiService.getUsers({
        page,
        size: rowsPerPage,
        search: debouncedSearch || undefined,
        sort: [`${orderBy},${order}`]
      });
      setUsers(data.content ?? []);
      setTotalElements(pageTotal(data));
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch, orderBy, order]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRequestSort = (property: UserSortCol) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleOpenDrawer = () => {
    setUserForm(initialUserForm);
    setFormError('');
    setTemporaryPassword('');
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    if (saving) {
      return;
    }
    setDrawerOpen(false);
    setFormError('');
  };

  const handleFormChange = (field: keyof UserForm, value: string | GroupRole) => {
    setUserForm((current) => ({ ...current, [field]: value }));
  };

  // Real-time phone error: only surface once the user has typed something so the
  // field doesn't show red the instant the drawer opens.
  const phoneError =
    userForm.phoneNumber.length > 0 && !isValidIndianMobile10(userForm.phoneNumber)
      ? 'Phone number must be exactly 10 digits.'
      : '';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateForm(userForm);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setSaving(true);
      setFormError('');
      const trimmedEmail = userForm.email.trim();
      // The dedicated username field was removed from the Add user form; the backend
      // `username` column is populated from the email so existing API contracts keep
      // working without schema changes.
      const created = await apiService.createAccountUser({
        full_name: userForm.fullName.trim(),
        username: trimmedEmail,
        email: trimmedEmail,
        ...(userForm.phoneNumber.trim() ? { phone_number: userForm.phoneNumber.trim() } : {}),
        group_role: userForm.groupRole
      });
      setTemporaryPassword(created.temporaryPassword ?? created.temporary_password);
      setUserForm(initialUserForm);
      await fetchUsers();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || err.response?.data?.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainCard title="Account Settings">
      <Stack spacing={2.5}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2}>
          <Box>
            <Typography variant="h4">Account Users</Typography>
            <Typography color="text.secondary">Users that belong to your current account.</Typography>
          </Box>
          {isGroupAdmin(user) && (
            <Button onClick={handleOpenDrawer} variant="contained" startIcon={<PlusOutlined />} sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}>
              Add User
            </Button>
          )}
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}
        {!isGroupAdmin(user) && <Alert severity="info">Only group admins can add users. You can still view users available to your account.</Alert>}

        <TextField
          label="Search"
          placeholder="Name, email, username"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          size="small"
          sx={{ maxWidth: 400 }}
        />

        {loading ? (
          <Typography>Loading users...</Typography>
        ) : users.length === 0 ? (
          <Alert severity="info">No users found.</Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sortDirection={orderBy === 'full_name' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'full_name'}
                      direction={orderBy === 'full_name' ? order : 'asc'}
                      onClick={() => handleRequestSort('full_name')}
                    >
                      Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === 'email' ? order : false}>
                    <TableSortLabel active={orderBy === 'email'} direction={orderBy === 'email' ? order : 'asc'} onClick={() => handleRequestSort('email')}>
                      Email
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === 'username' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'username'}
                      direction={orderBy === 'username' ? order : 'asc'}
                      onClick={() => handleRequestSort('username')}
                    >
                      Username
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell sortDirection={orderBy === 'created_at' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'created_at'}
                      direction={orderBy === 'created_at' ? order : 'asc'}
                      onClick={() => handleRequestSort('created_at')}
                    >
                      Created
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((accountUser) => (
                  <TableRow key={accountUser.id}>
                    <TableCell>{getName(accountUser)}</TableCell>
                    <TableCell>{accountUser.email}</TableCell>
                    <TableCell>{accountUser.username}</TableCell>
                    <TableCell>{getPhone(accountUser)}</TableCell>
                    <TableCell>{getRole(accountUser)}</TableCell>
                    <TableCell>{getCreatedAt(accountUser) ? new Date(getCreatedAt(accountUser) as string).toLocaleDateString() : 'Not set'}</TableCell>
                  </TableRow>
                ))}
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
            width: { xs: '100%', sm: 420 },
            borderTopLeftRadius: { xs: 0, sm: 16 },
            borderBottomLeftRadius: { xs: 0, sm: 16 },
            boxShadow: 24
          }
        }}
      >
        <Box component="form" onSubmit={handleSubmit} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
            <Typography variant="h4">Add user</Typography>
            <IconButton aria-label="Close add user drawer" onClick={handleCloseDrawer} disabled={saving}>
              <CloseOutlined />
            </IconButton>
          </Stack>
          <Divider />

          <Stack spacing={2} sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            {temporaryPassword && (
              <Alert severity="success">
                User created. Temporary password: <strong>{temporaryPassword}</strong>
              </Alert>
            )}
            <TextField
              label="Full name"
              value={userForm.fullName}
              onChange={(event) => handleFormChange('fullName', event.target.value)}
              required
              fullWidth
              inputProps={{ maxLength: 255 }}
            />
            <TextField
              label="Email"
              type="email"
              value={userForm.email}
              onChange={(event) => handleFormChange('email', event.target.value)}
              required
              fullWidth
              helperText="The email address is used as the username for sign-in."
            />
            <TextField
              label="Phone number"
              type="tel"
              value={userForm.phoneNumber}
              onChange={(event) =>
                handleFormChange('phoneNumber', extractTenDigitMobile(event.target.value))
              }
              required
              fullWidth
              error={Boolean(phoneError)}
              helperText={phoneError || 'Enter 10 digit mobile number (without country code).'}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>{INDIA_COUNTRY_CODE}</Typography>
              }}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 10 }}
            />
            <FormControl fullWidth required>
              <InputLabel id="add-user-role-label">Role</InputLabel>
              <Select
                labelId="add-user-role-label"
                label="Role"
                value={userForm.groupRole}
                onChange={(event) => handleFormChange('groupRole', event.target.value as GroupRole)}
              >
                <MenuItem value={GroupRole.LAWYER}>Lawyer</MenuItem>
                <MenuItem value={GroupRole.JUNIOR}>Junior</MenuItem>
                <MenuItem value={GroupRole.CLERK}>Clerk</MenuItem>
              </Select>
              <FormHelperText>Password is generated by the backend and shown once after creation.</FormHelperText>
            </FormControl>
          </Stack>

          <Divider />
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ p: 2 }}>
            <Button onClick={handleCloseDrawer} variant="outlined" disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving} sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}>
              {saving ? 'Creating...' : 'Create user'}
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </MainCard>
  );
};

export default AccountSettings;
