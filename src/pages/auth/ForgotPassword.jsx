import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

// material-ui
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import LinkMui from '@mui/material/Link';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import * as Yup from 'yup';
import { Formik } from 'formik';

// project imports
import AnimateButton from 'components/@extended/AnimateButton';
import IconButton from 'components/@extended/IconButton';
import AuthWrapper from 'sections/auth/AuthWrapper';
import { apiService } from 'services/api';

// assets
import EyeInvisibleOutlined from '@ant-design/icons/EyeInvisibleOutlined';
import EyeOutlined from '@ant-design/icons/EyeOutlined';

// ================================|| FORGOT PASSWORD ||================================ //

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [otpSent, setOtpSent] = useState(false);
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const requestSchema = Yup.object().shape({
    phoneNumber: Yup.string().min(10, 'Phone number must be at least 10 characters').max(20).required('Phone number is required')
  });

  const resetSchema = Yup.object().shape({
    phoneNumber: Yup.string().min(10, 'Phone number must be at least 10 characters').max(20).required('Phone number is required'),
    otp: Yup.string().matches(/^\d{6}$/, 'Enter the 6 digit OTP').required('OTP is required'),
    newPassword: Yup.string()
      .required('New password is required')
      .min(8, 'Password must be at least 8 characters long')
      .test('no-leading-trailing-whitespace', 'Password cannot start or end with spaces', (value) => value === value?.trim()),
    confirmPassword: Yup.string()
      .required('Confirm password is required')
      .oneOf([Yup.ref('newPassword')], 'Passwords do not match')
  });

  return (
    <AuthWrapper>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between', mb: { xs: -0.5, sm: 0.5 } }}>
            <Typography variant="h3">Forgot Password</Typography>
            <Typography component={Link} to="/login" variant="body1" sx={{ textDecoration: 'none' }} color="primary">
              Back to login
            </Typography>
          </Stack>
        </Grid>
        <Grid size={12}>
          <Typography color="text.secondary">
            Enter your registered phone number. We will send a 6 digit OTP, then you can set a new password.
          </Typography>
        </Grid>
        {success && (
          <Grid size={12}>
            <Alert severity={otpSent ? 'info' : 'success'}>{success}</Alert>
          </Grid>
        )}
        <Grid size={12}>
          <Formik
            initialValues={{
              phoneNumber: '',
              otp: '',
              newPassword: '',
              confirmPassword: '',
              submit: null
            }}
            validationSchema={otpSent ? resetSchema : requestSchema}
            onSubmit={async (values, { setErrors, setSubmitting }) => {
              try {
                const phoneNumber = values.phoneNumber.trim();
                if (!otpSent) {
                  await apiService.forgotPassword(phoneNumber);
                  setOtpSent(true);
                  setSuccess('If an account exists for this phone number, an OTP has been sent.');
                  return;
                }

                await apiService.resetPassword(phoneNumber, values.otp.trim(), values.newPassword);
                setSuccess('Your password has been reset. You can now log in with your new password.');
                setTimeout(() => navigate('/login'), 1200);
              } catch (err) {
                setErrors({
                  submit: err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Password reset failed. Please try again.'
                });
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ errors, handleBlur, handleChange, handleSubmit, touched, values, isSubmitting }) => (
              <form noValidate onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid size={12}>
                    <Stack sx={{ gap: 1 }}>
                      <InputLabel htmlFor="phone-forgot-password">Phone Number</InputLabel>
                      <OutlinedInput
                        id="phone-forgot-password"
                        type="tel"
                        name="phoneNumber"
                        value={values.phoneNumber}
                        onBlur={handleBlur}
                        onChange={handleChange}
                        placeholder="+15551234567"
                        fullWidth
                        error={Boolean(touched.phoneNumber && errors.phoneNumber)}
                        disabled={otpSent || isSubmitting}
                      />
                    </Stack>
                    {touched.phoneNumber && errors.phoneNumber && (
                      <FormHelperText error id="helper-text-phone-forgot-password">
                        {errors.phoneNumber}
                      </FormHelperText>
                    )}
                  </Grid>

                  {otpSent && (
                    <>
                      <Grid size={12}>
                        <Stack sx={{ gap: 1 }}>
                          <InputLabel htmlFor="otp-reset-password">OTP</InputLabel>
                          <OutlinedInput
                            id="otp-reset-password"
                            type="text"
                            name="otp"
                            value={values.otp}
                            onBlur={handleBlur}
                            onChange={handleChange}
                            placeholder="Enter 6 digit OTP"
                            fullWidth
                            inputProps={{ maxLength: 6 }}
                            error={Boolean(touched.otp && errors.otp)}
                          />
                        </Stack>
                        {touched.otp && errors.otp && (
                          <FormHelperText error id="helper-text-otp-reset-password">
                            {errors.otp}
                          </FormHelperText>
                        )}
                      </Grid>
                      <Grid size={12}>
                        <Stack sx={{ gap: 1 }}>
                          <InputLabel htmlFor="new-password-reset">New Password</InputLabel>
                          <OutlinedInput
                            id="new-password-reset"
                            type={showPassword ? 'text' : 'password'}
                            name="newPassword"
                            value={values.newPassword}
                            onBlur={handleBlur}
                            onChange={handleChange}
                            placeholder="Enter new password"
                            fullWidth
                            error={Boolean(touched.newPassword && errors.newPassword)}
                            endAdornment={
                              <InputAdornment position="end">
                                <IconButton
                                  aria-label="toggle new password visibility"
                                  onClick={() => setShowPassword((current) => !current)}
                                  onMouseDown={(event) => event.preventDefault()}
                                  edge="end"
                                  color="secondary"
                                >
                                  {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                                </IconButton>
                              </InputAdornment>
                            }
                          />
                        </Stack>
                        {touched.newPassword && errors.newPassword && (
                          <FormHelperText error id="helper-text-new-password-reset">
                            {errors.newPassword}
                          </FormHelperText>
                        )}
                      </Grid>
                      <Grid size={12}>
                        <Stack sx={{ gap: 1 }}>
                          <InputLabel htmlFor="confirm-password-reset">Confirm Password</InputLabel>
                          <OutlinedInput
                            id="confirm-password-reset"
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            value={values.confirmPassword}
                            onBlur={handleBlur}
                            onChange={handleChange}
                            placeholder="Confirm new password"
                            fullWidth
                            error={Boolean(touched.confirmPassword && errors.confirmPassword)}
                            endAdornment={
                              <InputAdornment position="end">
                                <IconButton
                                  aria-label="toggle confirm password visibility"
                                  onClick={() => setShowConfirmPassword((current) => !current)}
                                  onMouseDown={(event) => event.preventDefault()}
                                  edge="end"
                                  color="secondary"
                                >
                                  {showConfirmPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                                </IconButton>
                              </InputAdornment>
                            }
                          />
                        </Stack>
                        {touched.confirmPassword && errors.confirmPassword && (
                          <FormHelperText error id="helper-text-confirm-password-reset">
                            {errors.confirmPassword}
                          </FormHelperText>
                        )}
                      </Grid>
                    </>
                  )}

                  {errors.submit && (
                    <Grid size={12}>
                      <FormHelperText error>{errors.submit}</FormHelperText>
                    </Grid>
                  )}
                  <Grid size={12}>
                    <AnimateButton>
                      <Button fullWidth size="large" variant="contained" color="primary" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Please wait...' : otpSent ? 'Reset Password' : 'Send OTP'}
                      </Button>
                    </AnimateButton>
                  </Grid>
                  {otpSent && (
                    <Grid size={12}>
                      <LinkMui
                        component="button"
                        type="button"
                        variant="body2"
                        onClick={() => {
                          setOtpSent(false);
                          setSuccess('');
                        }}
                      >
                        Use a different phone number
                      </LinkMui>
                    </Grid>
                  )}
                </Grid>
              </form>
            )}
          </Formik>
        </Grid>
      </Grid>
    </AuthWrapper>
  );
}
