import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

// material-ui
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// third-party
import * as Yup from 'yup';
import { Formik } from 'formik';

// project imports
import { useAuth } from 'contexts/AuthContext';
import IconButton from 'components/@extended/IconButton';
import AnimateButton from 'components/@extended/AnimateButton';
import { AccountType } from 'types';

import { strengthColor, strengthIndicator } from 'utils/password-strength';
import { extractTenDigitMobile, INDIA_COUNTRY_CODE } from 'utils/phone';

// assets
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import EyeInvisibleOutlined from '@ant-design/icons/EyeInvisibleOutlined';

// ============================|| JWT - REGISTER ||============================ //

export default function AuthRegister() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [level, setLevel] = useState();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const changePassword = (value) => {
    const temp = strengthIndicator(value);
    setLevel(strengthColor(temp));
  };

  useEffect(() => {
    changePassword('');
  }, []);

  return (
    <>
      <Formik
        initialValues={{
          accountType: AccountType.INDIVIDUAL,
          groupName: '',
          email: '',
          fullName: '',
          phoneNumber: '',
          password: '',
          confirmPassword: '',
          submit: null
        }}
        validationSchema={Yup.object().shape({
          accountType: Yup.string().oneOf([AccountType.INDIVIDUAL, AccountType.GROUP]).required('Account type is required'),
          groupName: Yup.string().when('accountType', {
            is: AccountType.GROUP,
            then: (schema) => schema.max(255).required('Group name is required for group accounts'),
            otherwise: (schema) => schema.max(255)
          }),
          email: Yup.string().email('Must be a valid email').max(255).required('Email is required'),
          fullName: Yup.string().max(255).required('Full Name is required'),
          phoneNumber: Yup.string()
            .required('Phone number is required')
            .matches(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
          password: Yup.string()
            .required('Password is required')
            .min(8, 'Password must be at least 8 characters long')
            .test('no-leading-trailing-whitespace', 'Password cannot start or end with spaces', (value) => value === value?.trim()),
          confirmPassword: Yup.string()
            .required('Confirm Password is required')
            .oneOf([Yup.ref('password')], 'Passwords do not match')
        })}
        onSubmit={async (values, { setErrors, setSubmitting }) => {
          try {
            // Email doubles as the username; the dedicated username field has been removed
            // from this form and the backend column is populated from `values.email`.
            await register(
              values.accountType === AccountType.GROUP ? values.groupName : values.email,
              values.accountType,
              values.accountType === AccountType.GROUP ? values.groupName : undefined,
              values.email,
              values.email,
              values.fullName,
              values.password,
              values.phoneNumber || undefined
            );
            navigate('/dashboard/default');
          } catch (err) {
            setSubmitting(false);
            setErrors({
              submit: err?.response?.data?.detail || err?.message || 'Registration failed. Please try again.'
            });
          }
        }}
      >
        {({ errors, handleBlur, handleChange, handleSubmit, setFieldTouched, setFieldValue, touched, values, isSubmitting }) => (
          <form noValidate onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid size={12}>
                <Stack sx={{ gap: 1 }}>
                  <InputLabel id="accountType-signup-label">Account Type*</InputLabel>
                  <Select
                    fullWidth
                    labelId="accountType-signup-label"
                    id="accountType-signup"
                    value={values.accountType}
                    name="accountType"
                    onBlur={handleBlur}
                    onChange={handleChange}
                  >
                    <MenuItem value={AccountType.INDIVIDUAL}>Individual</MenuItem>
                    <MenuItem value={AccountType.GROUP}>Law Firm / Group</MenuItem>
                  </Select>
                </Stack>
                {touched.accountType && errors.accountType && (
                  <FormHelperText error id="helper-text-accountType-signup">
                    {errors.accountType}
                  </FormHelperText>
                )}
              </Grid>
              {values.accountType === AccountType.GROUP && (
                <Grid size={12}>
                  <Stack sx={{ gap: 1 }}>
                    <InputLabel htmlFor="groupName-signup">Group Name*</InputLabel>
                    <OutlinedInput
                      fullWidth
                      error={Boolean(touched.groupName && errors.groupName)}
                      id="groupName-signup"
                      type="text"
                      value={values.groupName}
                      name="groupName"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      placeholder="Sterling Law Group"
                    />
                  </Stack>
                  {touched.groupName && errors.groupName && (
                    <FormHelperText error id="helper-text-groupName-signup">
                      {errors.groupName}
                    </FormHelperText>
                  )}
                </Grid>
              )}
              <Grid size={12}>
                <Stack sx={{ gap: 1 }}>
                  <InputLabel htmlFor="email-signup">Email Address*</InputLabel>
                  <OutlinedInput
                    fullWidth
                    error={Boolean(touched.email && errors.email)}
                    id="email-signup"
                    type="email"
                    value={values.email}
                    name="email"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="demo@company.com"
                    autoComplete="email"
                  />
                </Stack>
                {touched.email && errors.email && (
                  <FormHelperText error id="helper-text-email-signup">
                    {errors.email}
                  </FormHelperText>
                )}
              </Grid>
              <Grid size={12}>
                <Stack sx={{ gap: 1 }}>
                  <InputLabel htmlFor="fullName-signup">Full Name*</InputLabel>
                  <OutlinedInput
                    fullWidth
                    error={Boolean(touched.fullName && errors.fullName)}
                    id="fullName-signup"
                    type="text"
                    value={values.fullName}
                    name="fullName"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="John Doe"
                  />
                </Stack>
                {touched.fullName && errors.fullName && (
                  <FormHelperText error id="helper-text-fullName-signup">
                    {errors.fullName}
                  </FormHelperText>
                )}
              </Grid>
              <Grid size={12}>
                <Stack sx={{ gap: 1 }}>
                  <InputLabel htmlFor="phoneNumber-signup">Phone Number*</InputLabel>
                  <OutlinedInput
                    fullWidth
                    error={Boolean(touched.phoneNumber && errors.phoneNumber)}
                    id="phoneNumber-signup"
                    type="tel"
                    value={values.phoneNumber}
                    name="phoneNumber"
                    onBlur={handleBlur}
                    onChange={(event) => {
                      const digitsOnly = extractTenDigitMobile(event.target.value);
                      setFieldValue('phoneNumber', digitsOnly);
                      setFieldTouched('phoneNumber', true, false);
                    }}
                    placeholder="9876543210"
                    autoComplete="tel"
                    startAdornment={<InputAdornment position="start">{INDIA_COUNTRY_CODE}</InputAdornment>}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 10 }}
                  />
                </Stack>
                {touched.phoneNumber && errors.phoneNumber && (
                  <FormHelperText error id="helper-text-phoneNumber-signup">
                    {errors.phoneNumber}
                  </FormHelperText>
                )}
              </Grid>
              <Grid size={12}>
                <Stack sx={{ gap: 1 }}>
                  <InputLabel htmlFor="password-signup">Password*</InputLabel>
                  <OutlinedInput
                    fullWidth
                    error={Boolean(touched.password && errors.password)}
                    id="password-signup"
                    type={showPassword ? 'text' : 'password'}
                    value={values.password}
                    name="password"
                    onBlur={handleBlur}
                    onChange={(e) => {
                      handleChange(e);
                      changePassword(e.target.value);
                    }}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                          color="secondary"
                        >
                          {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                        </IconButton>
                      </InputAdornment>
                    }
                    placeholder="******"
                    autoComplete="new-password"
                  />
                </Stack>
                {touched.password && errors.password && (
                  <FormHelperText error id="helper-text-password-signup">
                    {errors.password}
                  </FormHelperText>
                )}
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid>
                      <Box sx={{ bgcolor: level?.color, width: 85, height: 8, borderRadius: '7px' }} />
                    </Grid>
                    <Grid>
                      <Typography variant="subtitle1" fontSize="0.75rem">
                        {level?.label}
                      </Typography>
                    </Grid>
                  </Grid>
                </FormControl>
              </Grid>
              <Grid size={12}>
                <Stack sx={{ gap: 1 }}>
                  <InputLabel htmlFor="confirmPassword-signup">Confirm Password*</InputLabel>
                  <OutlinedInput
                    fullWidth
                    error={Boolean(touched.confirmPassword && errors.confirmPassword)}
                    id="confirmPassword-signup"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={values.confirmPassword}
                    name="confirmPassword"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle confirm password visibility"
                          onClick={handleClickShowConfirmPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                          color="secondary"
                        >
                          {showConfirmPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                        </IconButton>
                      </InputAdornment>
                    }
                    placeholder="******"
                    autoComplete="new-password"
                  />
                </Stack>
                {touched.confirmPassword && errors.confirmPassword && (
                  <FormHelperText error id="helper-text-confirmPassword-signup">
                    {errors.confirmPassword}
                  </FormHelperText>
                )}
              </Grid>
              <Grid size={12}>
                <Typography variant="body2">
                  By Signing up, you agree to our &nbsp;
                  <Link variant="subtitle2" component={RouterLink} to="#">
                    Terms of Service
                  </Link>
                  &nbsp; and &nbsp;
                  <Link variant="subtitle2" component={RouterLink} to="#">
                    Privacy Policy
                  </Link>
                </Typography>
              </Grid>
              {errors.submit && (
                <Grid size={12}>
                  <FormHelperText error>{errors.submit}</FormHelperText>
                </Grid>
              )}
              <Grid size={12}>
                <AnimateButton>
                  <Button
                    fullWidth
                    size="large"
                    variant="contained"
                    color="primary"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Registering…' : 'Create Account'}
                  </Button>
                </AnimateButton>
              </Grid>
            </Grid>
          </form>
        )}
      </Formik>
    </>
  );
}
