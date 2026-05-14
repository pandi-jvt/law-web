import { useEffect, useMemo, useState } from 'react';

// material-ui
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';

import { apiService } from 'services/api';

// project imports
import MainCard from 'components/MainCard';
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';
import MonthlyBarChart from 'sections/dashboard/default/MonthlyBarChart';
import ReportAreaChart from 'sections/dashboard/default/ReportAreaChart';
import UniqueVisitorCard from 'sections/dashboard/default/UniqueVisitorCard';
import SaleReportCard from 'sections/dashboard/default/SaleReportCard';
import UpcomingTasksHearings from 'sections/dashboard/default/UpcomingTasksHearings';

// assets
import EllipsisOutlined from '@ant-design/icons/EllipsisOutlined';
import GiftOutlined from '@ant-design/icons/GiftOutlined';
import MessageOutlined from '@ant-design/icons/MessageOutlined';
import SettingOutlined from '@ant-design/icons/SettingOutlined';

import avatar1 from 'assets/images/users/avatar-1.png';
import avatar2 from 'assets/images/users/avatar-2.png';
import avatar3 from 'assets/images/users/avatar-3.png';
import avatar4 from 'assets/images/users/avatar-4.png';

// avatar style
const avatarSX = {
  width: 36,
  height: 36,
  fontSize: '1rem'
};

// action style
const actionSX = {
  mt: 0.75,
  ml: 1,
  top: 'auto',
  right: 'auto',
  alignSelf: 'flex-start',
  transform: 'none'
};

function normalizeDashboardMetric(m) {
  if (!m) {
    return { total: 0, changePercent30d: null, delta30d: 0, trend: 'NEUTRAL' };
  }
  return {
    total: m.total ?? 0,
    changePercent30d: m.change_percent_30d ?? m.changePercent30d ?? null,
    delta30d: m.delta_30d ?? m.delta30d ?? 0,
    trend: m.trend ?? 'NEUTRAL'
  };
}

/** User-local date/time string from an ISO instant (e.g. API `lastModifiedAt`). */
function formatLocalDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function normalizeRecentItem(item) {
  if (!item) return null;
  const name = item.name ?? '';
  const detail = item.detail ?? '';
  const lastModifiedAt = item.lastModifiedAt ?? item.last_modified_at ?? '';
  const actorName = item.actorName ?? item.actor_name ?? '—';
  if (!name && !detail) return null;
  return { name, detail, lastModifiedAt, actorName };
}

// ==============================|| DASHBOARD - DEFAULT ||============================== //

export default function DashboardDefault() {
  const [analyticsMenuAnchor, setAnalyticsMenuAnchor] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [upcomingData, setUpcomingData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [upcomingLoading, setUpcomingLoading] = useState(true);
  const [recentActivityLoading, setRecentActivityLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');
  const [upcomingError, setUpcomingError] = useState('');
  const [recentActivity, setRecentActivity] = useState(null);
  const [recentActivityError, setRecentActivityError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setAnalyticsLoading(true);
      setUpcomingLoading(true);
      setRecentActivityLoading(true);
      setDashboardError('');
      setUpcomingError('');
      setRecentActivityError('');
      const [analyticsResult, upcomingResult, recentResult] = await Promise.allSettled([
        apiService.getDashboardAnalytics(),
        apiService.getDashboardUpcoming({ task_limit: 12, hearing_limit: 12, days_ahead: 180 }),
        apiService.getDashboardRecentActivity()
      ]);
      if (cancelled) {
        return;
      }
      if (analyticsResult.status === 'fulfilled') {
        setDashboardData(analyticsResult.value);
      } else {
        const err = analyticsResult.reason;
        setDashboardData(null);
        setDashboardError(err.response?.data?.detail || err.response?.data?.message || 'Failed to load dashboard analytics');
      }
      if (upcomingResult.status === 'fulfilled') {
        setUpcomingData(upcomingResult.value);
      } else {
        const err = upcomingResult.reason;
        setUpcomingData(null);
        setUpcomingError(err.response?.data?.detail || err.response?.data?.message || 'Failed to load upcoming tasks and hearings');
      }
      if (recentResult.status === 'fulfilled') {
        setRecentActivity(recentResult.value);
      } else {
        const err = recentResult.reason;
        setRecentActivity(null);
        setRecentActivityError(err.response?.data?.detail || err.response?.data?.message || 'Failed to load recent activity');
      }
      setAnalyticsLoading(false);
      setUpcomingLoading(false);
      setRecentActivityLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = useMemo(() => {
    const d = dashboardData;
    return {
      cases: normalizeDashboardMetric(d?.cases),
      clients: normalizeDashboardMetric(d?.clients),
      tasks: normalizeDashboardMetric(d?.tasks),
      hearings: normalizeDashboardMetric(d?.hearings),
      dataAsOf: d?.latest_bucket_date ?? d?.latestBucketDate ?? ''
    };
  }, [dashboardData]);

  const latestCase = useMemo(
    () => normalizeRecentItem(recentActivity?.latestCase ?? recentActivity?.latest_case),
    [recentActivity]
  );
  const latestClient = useMemo(
    () => normalizeRecentItem(recentActivity?.latestClient ?? recentActivity?.latest_client),
    [recentActivity]
  );
  const latestTask = useMemo(
    () => normalizeRecentItem(recentActivity?.latestTask ?? recentActivity?.latest_task),
    [recentActivity]
  );

  const handleAnalyticsMenuClick = (event) => {
    setAnalyticsMenuAnchor(event.currentTarget);
  };
  const handleAnalyticsMenuClose = () => {
    setAnalyticsMenuAnchor(null);
  };

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      {/* row 1 */}
      <Grid sx={{ mb: -2.25 }} size={12}>
        <Typography variant="h5">Dashboard</Typography>
      </Grid>
      {dashboardError ? (
        <Grid size={12}>
          <Alert severity="warning" onClose={() => setDashboardError('')}>
            {dashboardError}
          </Alert>
        </Grid>
      ) : null}
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalyticEcommerce
          title="Total Cases"
          loading={analyticsLoading}
          dashboardMetric={metrics.cases}
          dataAsOf={metrics.dataAsOf}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalyticEcommerce
          title="Total Clients"
          loading={analyticsLoading}
          dashboardMetric={metrics.clients}
          dataAsOf={metrics.dataAsOf}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalyticEcommerce
          title="Total Tasks"
          loading={analyticsLoading}
          dashboardMetric={metrics.tasks}
          dataAsOf={metrics.dataAsOf}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalyticEcommerce
          title="Total Hearings"
          loading={analyticsLoading}
          dashboardMetric={metrics.hearings}
          dataAsOf={metrics.dataAsOf}
        />
      </Grid>
      <Grid sx={{ display: { sm: 'none', md: 'block', lg: 'none' } }} size={{ md: 8 }} />
      {/* row 2 */}
      <Grid size={{ xs: 12, md: 7, lg: 8 }}>
        <UniqueVisitorCard />
      </Grid>
      <Grid size={{ xs: 12, md: 5, lg: 4 }}>
        <Grid container sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Grid>
            <Typography variant="h5">Recent activity</Typography>
          </Grid>
          <Grid />
        </Grid>
        {recentActivityError ? (
          <Alert severity="warning" sx={{ mt: 1 }} onClose={() => setRecentActivityError('')}>
            {recentActivityError}
          </Alert>
        ) : null}
        <MainCard sx={{ mt: 2 }} content={false}>
          <List
            component="nav"
            sx={{
              px: 0,
              py: 0,
              '& .MuiListItemButton-root': {
                py: 1.5,
                px: 2,
                '& .MuiAvatar-root': avatarSX,
                '& .MuiListItemSecondaryAction-root': { ...actionSX, position: 'relative' }
              }
            }}
          >
            <ListItem
              component={ListItemButton}
              divider
              disabled={recentActivityLoading}
              secondaryAction={
                <Stack sx={{ alignItems: 'flex-end' }}>
                  <Typography variant="subtitle1" noWrap>
                    {recentActivityLoading ? '…' : formatLocalDateTime(latestCase?.lastModifiedAt)}
                  </Typography>
                  <Typography variant="h6" color="secondary" noWrap>
                    {recentActivityLoading ? '…' : latestCase?.actorName ?? '—'}
                  </Typography>
                </Stack>
              }
            >
              <ListItemAvatar>
                <Avatar sx={{ color: 'success.main', bgcolor: 'success.lighter' }}>
                  <GiftOutlined />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="subtitle1" noWrap>
                    {recentActivityLoading
                      ? 'Loading…'
                      : latestCase
                        ? latestCase.detail
                          ? `Case #${latestCase.detail}`
                          : latestCase.name || 'Case'
                        : 'No recent cases'}
                  </Typography>
                }
                secondary={
                  latestCase?.name && latestCase.detail ? (
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {latestCase.name}
                    </Typography>
                  ) : null
                }
              />
            </ListItem>
            <ListItem
              component={ListItemButton}
              divider
              disabled={recentActivityLoading}
              secondaryAction={
                <Stack sx={{ alignItems: 'flex-end' }}>
                  <Typography variant="subtitle1" noWrap>
                    {recentActivityLoading ? '…' : formatLocalDateTime(latestClient?.lastModifiedAt)}
                  </Typography>
                  <Typography variant="h6" color="secondary" noWrap>
                    {recentActivityLoading ? '…' : latestClient?.actorName ?? '—'}
                  </Typography>
                </Stack>
              }
            >
              <ListItemAvatar>
                <Avatar sx={{ color: 'primary.main', bgcolor: 'primary.lighter' }}>
                  <MessageOutlined />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="subtitle1" noWrap>
                    {recentActivityLoading
                      ? 'Loading…'
                      : latestClient
                        ? `Client · ${latestClient.name}`
                        : 'No recent clients'}
                  </Typography>
                }
                secondary={
                  latestClient?.detail ? (
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {latestClient.detail}
                    </Typography>
                  ) : null
                }
              />
            </ListItem>
            <ListItem
              component={ListItemButton}
              disabled={recentActivityLoading}
              secondaryAction={
                <Stack sx={{ alignItems: 'flex-end' }}>
                  <Typography variant="subtitle1" noWrap>
                    {recentActivityLoading ? '…' : formatLocalDateTime(latestTask?.lastModifiedAt)}
                  </Typography>
                  <Typography variant="h6" color="secondary" noWrap>
                    {recentActivityLoading ? '…' : latestTask?.actorName ?? '—'}
                  </Typography>
                </Stack>
              }
            >
              <ListItemAvatar>
                <Avatar sx={{ color: 'error.main', bgcolor: 'error.lighter' }}>
                  <SettingOutlined />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="subtitle1" noWrap>
                    {recentActivityLoading
                      ? 'Loading…'
                      : latestTask
                        ? `Task · ${latestTask.name}`
                        : 'No recent tasks'}
                  </Typography>
                }
                secondary={
                  latestTask?.detail ? (
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {latestTask.detail}
                    </Typography>
                  ) : null
                }
              />
            </ListItem>
          </List>
        </MainCard>
        <MainCard sx={{ mt: 2 }}>
          <Stack sx={{ gap: 3 }}>
            <Grid container sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Grid>
                <Stack>
                  <Typography variant="h5" noWrap>
                    Help & Support Chat
                  </Typography>
                  <Typography variant="caption" color="secondary" noWrap>
                    Typical replay within 5 min
                  </Typography>
                </Stack>
              </Grid>
              <Grid>
                <AvatarGroup sx={{ '& .MuiAvatar-root': { width: 32, height: 32 } }}>
                  <Avatar alt="Remy Sharp" src={avatar1} />
                  <Avatar alt="Travis Howard" src={avatar2} />
                  <Avatar alt="Cindy Baker" src={avatar3} />
                  <Avatar alt="Agnes Walker" src={avatar4} />
                </AvatarGroup>
              </Grid>
            </Grid>
            <Button size="small" variant="contained" sx={{ textTransform: 'capitalize' }}>
              Need Help?
            </Button>
          </Stack>
        </MainCard>
      </Grid>
      {/* <Grid size={{ xs: 12, md: 5, lg: 4 }}>
        <Grid container sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Grid>
            <Typography variant="h5">Income Overview</Typography>
          </Grid>
          <Grid />
        </Grid>
        <MainCard sx={{ mt: 2 }} content={false}>
          <Box sx={{ p: 3, pb: 0 }}>
            <Stack sx={{ gap: 2 }}>
              <Typography variant="h6" color="text.secondary">
                This Week Statistics
              </Typography>
              <Typography variant="h3">$7,650</Typography>
            </Stack>
          </Box>
          <MonthlyBarChart />
        </MainCard>
      </Grid> */}
      {/* row 3 — upcoming tasks & hearings (single API, RBAC on server) */}
      <Grid size={12} sx={{ width: '100%' }}>
        <Typography variant="h5" sx={{ mb: 1.5 }}>
          Schedule
        </Typography>
        <UpcomingTasksHearings
          tasks={upcomingData?.tasks}
          hearings={upcomingData?.hearings}
          loading={upcomingLoading}
          error={upcomingError}
        />
      </Grid>
      {/* <Grid size={{ xs: 12, md: 5, lg: 4 }}>
        <Grid container sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Grid>
            <Typography variant="h5">Analytics Report</Typography>
          </Grid>
          <Grid>
            <IconButton onClick={handleAnalyticsMenuClick}>
              <EllipsisOutlined style={{ fontSize: '1.25rem' }} />
            </IconButton>
            <Menu
              id="fade-menu"
              slotProps={{ list: { 'aria-labelledby': 'fade-button' } }}
              anchorEl={analyticsMenuAnchor}
              open={Boolean(analyticsMenuAnchor)}
              onClose={handleAnalyticsMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem onClick={handleAnalyticsMenuClose}>Weekly</MenuItem>
              <MenuItem onClick={handleAnalyticsMenuClose}>Monthly</MenuItem>
              <MenuItem onClick={handleAnalyticsMenuClose}>Yearly</MenuItem>
            </Menu>
          </Grid>
        </Grid>
        <MainCard sx={{ mt: 2 }} content={false}>
          <List sx={{ p: 0, '& .MuiListItemButton-root': { py: 2 } }}>
            <ListItemButton divider>
              <ListItemText primary="Company Finance Growth" />
              <Typography variant="h5">+45.14%</Typography>
            </ListItemButton>
            <ListItemButton divider>
              <ListItemText primary="Company Expenses Ratio" />
              <Typography variant="h5">0.58%</Typography>
            </ListItemButton>
            <ListItemButton>
              <ListItemText primary="Business Risk Cases" />
              <Typography variant="h5">Low</Typography>
            </ListItemButton>
          </List>
          <ReportAreaChart />
        </MainCard>
      </Grid> */}
      {/* row 4 */}
      {/* <Grid size={{ xs: 12, md: 7, lg: 8 }}>
        <SaleReportCard />
      </Grid> */}
      {/* <Grid size={{ xs: 12, md: 5, lg: 4 }}>
        <Grid container sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Grid>
            <Typography variant="h5">Transaction History</Typography>
          </Grid>
          <Grid />
        </Grid>
        <MainCard sx={{ mt: 2 }} content={false}>
          <List
            component="nav"
            sx={{
              px: 0,
              py: 0,
              '& .MuiListItemButton-root': {
                py: 1.5,
                px: 2,
                '& .MuiAvatar-root': avatarSX,
                '& .MuiListItemSecondaryAction-root': { ...actionSX, position: 'relative' }
              }
            }}
          >
            <ListItem
              component={ListItemButton}
              divider
              secondaryAction={
                <Stack sx={{ alignItems: 'flex-end' }}>
                  <Typography variant="subtitle1" noWrap>
                    + $1,430
                  </Typography>
                  <Typography variant="h6" color="secondary" noWrap>
                    78%
                  </Typography>
                </Stack>
              }
            >
              <ListItemAvatar>
                <Avatar sx={{ color: 'success.main', bgcolor: 'success.lighter' }}>
                  <GiftOutlined />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={<Typography variant="subtitle1">Order #002434</Typography>} secondary="Today, 2:00 AM" />
            </ListItem>
            <ListItem
              component={ListItemButton}
              divider
              secondaryAction={
                <Stack sx={{ alignItems: 'flex-end' }}>
                  <Typography variant="subtitle1" noWrap>
                    + $302
                  </Typography>
                  <Typography variant="h6" color="secondary" noWrap>
                    8%
                  </Typography>
                </Stack>
              }
            >
              <ListItemAvatar>
                <Avatar sx={{ color: 'primary.main', bgcolor: 'primary.lighter' }}>
                  <MessageOutlined />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={<Typography variant="subtitle1">Order #984947</Typography>} secondary="5 August, 1:45 PM" />
            </ListItem>
            <ListItem
              component={ListItemButton}
              secondaryAction={
                <Stack sx={{ alignItems: 'flex-end' }}>
                  <Typography variant="subtitle1" noWrap>
                    + $682
                  </Typography>
                  <Typography variant="h6" color="secondary" noWrap>
                    16%
                  </Typography>
                </Stack>
              }
            >
              <ListItemAvatar>
                <Avatar sx={{ color: 'error.main', bgcolor: 'error.lighter' }}>
                  <SettingOutlined />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={<Typography variant="subtitle1">Order #988784</Typography>} secondary="7 hours ago" />
            </ListItem>
          </List>
        </MainCard>
        <MainCard sx={{ mt: 2 }}>
          <Stack sx={{ gap: 3 }}>
            <Grid container sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Grid>
                <Stack>
                  <Typography variant="h5" noWrap>
                    Help & Support Chat
                  </Typography>
                  <Typography variant="caption" color="secondary" noWrap>
                    Typical replay within 5 min
                  </Typography>
                </Stack>
              </Grid>
              <Grid>
                <AvatarGroup sx={{ '& .MuiAvatar-root': { width: 32, height: 32 } }}>
                  <Avatar alt="Remy Sharp" src={avatar1} />
                  <Avatar alt="Travis Howard" src={avatar2} />
                  <Avatar alt="Cindy Baker" src={avatar3} />
                  <Avatar alt="Agnes Walker" src={avatar4} />
                </AvatarGroup>
              </Grid>
            </Grid>
            <Button size="small" variant="contained" sx={{ textTransform: 'capitalize' }}>
              Need Help?
            </Button>
          </Stack>
        </MainCard>
      </Grid> */}
    </Grid>
  );
}
