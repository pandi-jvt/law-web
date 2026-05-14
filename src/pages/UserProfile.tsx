import MainCard from 'components/MainCard';
import React, { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import BankOutlined from '@ant-design/icons/BankOutlined';
import CalendarOutlined from '@ant-design/icons/CalendarOutlined';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import EditOutlined from '@ant-design/icons/EditOutlined';
import IdcardOutlined from '@ant-design/icons/IdcardOutlined';
import MailOutlined from '@ant-design/icons/MailOutlined';
import PhoneOutlined from '@ant-design/icons/PhoneOutlined';
import LockOutlined from '@ant-design/icons/LockOutlined';
import SafetyCertificateOutlined from '@ant-design/icons/SafetyCertificateOutlined';
import TeamOutlined from '@ant-design/icons/TeamOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';
import { useAuth } from 'contexts/AuthContext';
import { apiService } from 'services/api';
import { User } from 'types';

const formatLabel = (value?: string | null) => {
  if (!value) {
    return 'Not set';
  }

  return String(value)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDate = (value?: string) => (value ? new Date(value).toLocaleString() : 'Not set');

const getFullName = (user?: User | null) => user?.fullName ?? user?.full_name ?? user?.username ?? 'User';
const getRole = (user?: User | null) => formatLabel(user?.groupRole ?? user?.group_role ?? user?.role);
const getAccountType = (user?: User | null) => formatLabel(user?.accountType ?? user?.account_type);
const getPhone = (user?: User | null) => user?.phoneNumber ?? user?.phone_number ?? 'Not set';
const getCreatedAt = (user?: User | null) => user?.createdAt ?? user?.created_at;
const getLastLogin = (user?: User | null) => user?.lastLoginAt ?? user?.last_login_at;
const getLawFirmId = (user?: User | null) => user?.lawFirmInternalId ?? user?.law_firm_internal_id;
const isActive = (user?: User | null) => String(user?.isActive ?? user?.is_active ?? '').toLowerCase() === 'true';
const isVerified = (user?: User | null) => Boolean(user?.isVerified ?? user?.is_verified);
const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const initialProfileForm = {
  fullName: '',
  username: '',
  email: '',
  phoneNumber: ''
};

const initialPasswordForm = {
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
};

const validateProfileForm = (form: typeof initialProfileForm) => {
  if (!form.fullName.trim()) {
    return 'Full name is required.';
  }
  if (!form.username.trim() || form.username.trim().length < 3) {
    return 'Username must be at least 3 characters.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    return 'Enter a valid email address.';
  }
  if (form.phoneNumber.trim() && (form.phoneNumber.trim().length < 10 || form.phoneNumber.trim().length > 20)) {
    return 'Phone number must be between 10 and 20 characters.';
  }
  return '';
};

const validatePasswordForm = (form: typeof initialPasswordForm) => {
  if (!form.oldPassword) {
    return 'Old password is required.';
  }
  if (!form.newPassword) {
    return 'New password is required.';
  }
  if (form.newPassword.length < 8) {
    return 'New password must be at least 8 characters long.';
  }
  if (form.newPassword !== form.newPassword.trim()) {
    return 'New password cannot start or end with spaces.';
  }
  if (form.newPassword !== form.confirmPassword) {
    return 'New password and confirm password must match.';
  }
  return '';
};

type ProfileInfoProps = {
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
};

const ProfileInfo = ({ icon, label, value }: ProfileInfoProps) => (
  <Stack direction="row" spacing={1.5} alignItems="center">
    <Box sx={{ color: 'primary.dark', display: 'flex', fontSize: 22 }}>{icon}</Box>
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography color="text.primary" fontWeight={700}>
        {value || 'Not set'}
      </Typography>
    </Box>
  </Stack>
);

type ProfileCardProps = {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
};

const ProfileCard = ({ title, icon, children }: ProfileCardProps) => (
  <Paper
    variant="outlined"
    sx={{
      bgcolor: 'background.paper',
      borderColor: 'grey.200',
      borderRadius: 0,
      boxShadow: '0 1px 4px rgba(15, 23, 42, 0.06)',
      p: 3
    }}
  >
    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 3 }}>
      <Box sx={{ color: 'primary.dark', display: 'flex', fontSize: 24 }}>{icon}</Box>
      <Typography variant="h4" color="primary.dark" fontWeight={800}>
        {title}
      </Typography>
    </Stack>
    {children}
  </Paper>
);

export const UserProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(user);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [passwordDrawerOpen, setPasswordDrawerOpen] = useState(false);
  const [error, setError] = useState('');
  const [profileFormError, setProfileFormError] = useState('');
  const [passwordFormError, setPasswordFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [profileForm, setProfileForm] = useState(initialProfileForm);
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError('');
        const currentUser = await apiService.getCurrentUser();
        setProfile(currentUser);
      } catch (err: any) {
        setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const currentUser = profile ?? user;

  const handleOpenProfileDrawer = () => {
    setProfileForm({
      fullName: getFullName(currentUser),
      username: currentUser?.username ?? '',
      email: currentUser?.email ?? '',
      phoneNumber: currentUser?.phoneNumber ?? currentUser?.phone_number ?? ''
    });
    setProfileFormError('');
    setSuccessMessage('');
    setProfileDrawerOpen(true);
  };

  const handleCloseProfileDrawer = () => {
    if (savingProfile) {
      return;
    }
    setProfileDrawerOpen(false);
    setProfileFormError('');
  };

  const handleOpenPasswordDrawer = () => {
    setPasswordForm(initialPasswordForm);
    setPasswordFormError('');
    setSuccessMessage('');
    setPasswordDrawerOpen(true);
  };

  const handleClosePasswordDrawer = () => {
    if (savingPassword) {
      return;
    }
    setPasswordDrawerOpen(false);
    setPasswordFormError('');
    setPasswordForm(initialPasswordForm);
  };

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateProfileForm(profileForm);
    if (validationError) {
      setProfileFormError(validationError);
      return;
    }

    try {
      setSavingProfile(true);
      setProfileFormError('');
      const updated = await apiService.updateProfile({
        full_name: profileForm.fullName.trim(),
        username: profileForm.username.trim(),
        email: profileForm.email.trim(),
        ...(profileForm.phoneNumber.trim() ? { phone_number: profileForm.phoneNumber.trim() } : {})
      });
      setProfile(updated);
      await refreshUser();
      setProfileDrawerOpen(false);
      setSuccessMessage('Profile updated successfully.');
    } catch (err: any) {
      setProfileFormError(err.response?.data?.detail || err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validatePasswordForm(passwordForm);
    if (validationError) {
      setPasswordFormError(validationError);
      return;
    }

    try {
      setSavingPassword(true);
      setPasswordFormError('');
      await apiService.changePassword(passwordForm.oldPassword, passwordForm.newPassword);
      setPasswordDrawerOpen(false);
      setPasswordForm(initialPasswordForm);
      setSuccessMessage('Password changed successfully.');
    } catch (err: any) {
      setPasswordFormError(err.response?.data?.detail || err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading && !currentUser) {
    return (
      <MainCard title="Profile">
        <Typography>Loading profile...</Typography>
      </MainCard>
    );
  }

  return (
    <MainCard title="Profile">
      <Stack spacing={2.5}>
        {error && <Alert severity="error">{error}</Alert>}
        {successMessage && <Alert severity="success">{successMessage}</Alert>}

        <Paper
          variant="outlined"
          sx={{
            bgcolor: 'background.paper',
            borderColor: 'grey.200',
            borderRadius: 0,
            boxShadow: '0 1px 4px rgba(15, 23, 42, 0.06)',
            p: 3
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', md: 'center' }}>
            <Box
              sx={{
                alignItems: 'center',
                bgcolor: 'primary.dark',
                borderRadius: 0.5,
                color: 'common.white',
                display: 'flex',
                flexShrink: 0,
                fontSize: 42,
                fontWeight: 900,
                height: 164,
                justifyContent: 'center',
                letterSpacing: 1,
                width: 164
              }}
            >
              {getInitials(getFullName(currentUser)) || <UserOutlined />}
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
                <Box>
                  <Typography variant="h1" color="primary.dark" sx={{ fontWeight: 900, lineHeight: 1.05 }}>
                    {getFullName(currentUser)}
                  </Typography>
                  <Typography variant="h4" color="text.secondary" sx={{ mt: 0.75 }}>
                    {getRole(currentUser)}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1.25}>
                  <Button onClick={handleOpenProfileDrawer} variant="contained" startIcon={<EditOutlined />} sx={{ bgcolor: 'primary.dark', borderRadius: 0, fontWeight: 800, letterSpacing: 1 }}>
                    Edit Profile
                  </Button>
                  <Button onClick={handleOpenPasswordDrawer} variant="outlined" startIcon={<LockOutlined />} sx={{ borderRadius: 0, fontWeight: 800, letterSpacing: 1 }}>
                    Change Password
                  </Button>
                </Stack>
              </Stack>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                <ProfileInfo icon={<MailOutlined />} label="Email Address" value={currentUser?.email} />
                <ProfileInfo icon={<PhoneOutlined />} label="Direct Phone" value={getPhone(currentUser)} />
                <ProfileInfo icon={<BankOutlined />} label="Office / Account" value={getAccountType(currentUser)} />
              </Box>
            </Box>
          </Stack>
        </Paper>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5 }}>
          <ProfileCard title="Professional Credentials" icon={<SafetyCertificateOutlined />}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: 1.25, textTransform: 'uppercase' }}>
                  User Identifiers
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                  <Chip label={`ID ${currentUser?.id ?? 'Not set'}`} sx={{ borderRadius: 0, fontWeight: 800 }} />
                  <Chip label={`Username ${currentUser?.username ?? 'Not set'}`} sx={{ borderRadius: 0, fontWeight: 800 }} />
                </Stack>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: 1.25, textTransform: 'uppercase' }}>
                  Access Roles
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                  <Chip label={getRole(currentUser)} variant="outlined" sx={{ borderRadius: 0, color: 'primary.dark', fontWeight: 800 }} />
                  <Chip label={getAccountType(currentUser)} variant="outlined" sx={{ borderRadius: 0, color: 'primary.dark', fontWeight: 800 }} />
                </Stack>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: 1.25, textTransform: 'uppercase' }}>
                  Account Status
                </Typography>
                <Typography sx={{ mt: 0.75 }} fontWeight={700}>
                  {isActive(currentUser) ? 'Active' : 'Inactive'} account, {isVerified(currentUser) ? 'verified' : 'not verified'}.
                </Typography>
              </Box>
            </Stack>
          </ProfileCard>

          <ProfileCard title="Organization History" icon={<TeamOutlined />}>
            <Stack spacing={2.5}>
              <ProfileInfo icon={<IdcardOutlined />} label="Group Role" value={getRole(currentUser)} />
              <ProfileInfo icon={<BankOutlined />} label="Law Firm ID" value={getLawFirmId(currentUser) || 'Individual account'} />
              <ProfileInfo icon={<CheckCircleOutlined />} label="Verification" value={isVerified(currentUser) ? 'Verified' : 'Pending verification'} />
            </Stack>
          </ProfileCard>
        </Box>

        <ProfileCard title="Account Timeline" icon={<CalendarOutlined />}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            <ProfileInfo icon={<UserOutlined />} label="Created At" value={formatDate(getCreatedAt(currentUser))} />
            <ProfileInfo icon={<CalendarOutlined />} label="Last Login" value={formatDate(getLastLogin(currentUser))} />
            <ProfileInfo icon={<CheckCircleOutlined />} label="Current State" value={isActive(currentUser) ? 'Active' : 'Inactive'} />
          </Box>
        </ProfileCard>
      </Stack>

      <Drawer
        anchor="right"
        open={profileDrawerOpen}
        onClose={handleCloseProfileDrawer}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 420 },
            borderTopLeftRadius: { xs: 0, sm: 16 },
            borderBottomLeftRadius: { xs: 0, sm: 16 },
            boxShadow: 24
          }
        }}
      >
        <Box component="form" onSubmit={handleProfileSubmit} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
            <Typography variant="h4">Edit profile</Typography>
            <IconButton aria-label="Close edit profile drawer" onClick={handleCloseProfileDrawer} disabled={savingProfile}>
              <CloseOutlined />
            </IconButton>
          </Stack>
          <Divider />

          <Stack spacing={2} sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
            {profileFormError && <Alert severity="error">{profileFormError}</Alert>}
            <TextField
              label="Full name"
              value={profileForm.fullName}
              onChange={(event) => setProfileForm((current) => ({ ...current, fullName: event.target.value }))}
              required
              fullWidth
              inputProps={{ maxLength: 255 }}
            />
            <TextField
              label="Username"
              value={profileForm.username}
              onChange={(event) => setProfileForm((current) => ({ ...current, username: event.target.value }))}
              required
              fullWidth
              inputProps={{ minLength: 3, maxLength: 100 }}
            />
            <TextField
              label="Email"
              type="email"
              value={profileForm.email}
              onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="Phone number"
              value={profileForm.phoneNumber}
              onChange={(event) => setProfileForm((current) => ({ ...current, phoneNumber: event.target.value }))}
              fullWidth
              inputProps={{ minLength: 10, maxLength: 20 }}
            />
            <FormHelperText>Phone number is optional. If provided, use 10 to 20 characters.</FormHelperText>
          </Stack>

          <Divider />
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ p: 2 }}>
            <Button onClick={handleCloseProfileDrawer} variant="outlined" disabled={savingProfile}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={savingProfile} sx={{ bgcolor: 'primary.dark' }}>
              {savingProfile ? 'Saving...' : 'Save changes'}
            </Button>
          </Stack>
        </Box>
      </Drawer>

      <Drawer
        anchor="right"
        open={passwordDrawerOpen}
        onClose={handleClosePasswordDrawer}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 420 },
            borderTopLeftRadius: { xs: 0, sm: 16 },
            borderBottomLeftRadius: { xs: 0, sm: 16 },
            boxShadow: 24
          }
        }}
      >
        <Box component="form" onSubmit={handlePasswordSubmit} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
            <Typography variant="h4">Change password</Typography>
            <IconButton aria-label="Close change password drawer" onClick={handleClosePasswordDrawer} disabled={savingPassword}>
              <CloseOutlined />
            </IconButton>
          </Stack>
          <Divider />

          <Stack spacing={2} sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
            {passwordFormError && <Alert severity="error">{passwordFormError}</Alert>}
            <TextField
              label="Old password"
              type="password"
              value={passwordForm.oldPassword}
              onChange={(event) => setPasswordForm((current) => ({ ...current, oldPassword: event.target.value }))}
              required
              fullWidth
              autoComplete="current-password"
            />
            <TextField
              label="New password"
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
              required
              fullWidth
              autoComplete="new-password"
              helperText="Minimum 8 characters. Cannot start or end with spaces."
            />
            <TextField
              label="Confirm password"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
              required
              fullWidth
              autoComplete="new-password"
            />
          </Stack>

          <Divider />
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ p: 2 }}>
            <Button onClick={handleClosePasswordDrawer} variant="outlined" disabled={savingPassword}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={savingPassword} sx={{ bgcolor: 'primary.dark' }}>
              {savingPassword ? 'Saving...' : 'Change password'}
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </MainCard>
  );
};

export default UserProfile;
