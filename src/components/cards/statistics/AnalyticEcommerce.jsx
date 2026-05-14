import PropTypes from 'prop-types';
// material-ui
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project imports
import MainCard from 'components/MainCard';

// assets
import RiseOutlined from '@ant-design/icons/RiseOutlined';
import FallOutlined from '@ant-design/icons/FallOutlined';
import MinusOutlined from '@ant-design/icons/MinusOutlined';

const iconSX = { fontSize: '0.75rem', color: 'inherit', marginLeft: 0, marginRight: 0 };

const formatInt = (n) => (typeof n === 'number' ? n.toLocaleString() : '0');

/**
 * @param {object} props
 * @param {'primary'|'success'|'error'|'warning'|'secondary'} props.color
 * @param {string} props.title
 * @param {string} [props.count] — legacy static count string
 * @param {number} [props.percentage] — legacy chip %
 * @param {boolean} [props.isLoss]
 * @param {string} [props.extra] — legacy footer line fragment
 * @param {boolean} [props.loading]
 * @param {{ total: number, changePercent30d?: number | null, change_percent_30d?: number | null, delta30d?: number, delta_30d?: number, trend?: string }} [props.dashboardMetric]
 * @param {string} [props.periodCaption]
 * @param {string} [props.dataAsOf] — latest rollup bucket date (from dashboard response)
 */
export default function AnalyticEcommerce({
  color = 'primary',
  title,
  count,
  percentage,
  isLoss,
  extra,
  loading = false,
  dashboardMetric,
  periodCaption = 'Last 30 days vs prior snapshot',
  dataAsOf
}) {
  const useDashboard = dashboardMetric != null;

  const trend = useDashboard ? String(dashboardMetric.trend || 'NEUTRAL').toUpperCase() : null;
  const pctRaw = useDashboard ? (dashboardMetric.changePercent30d ?? dashboardMetric.change_percent_30d) : null;
  const delta = useDashboard ? (dashboardMetric.delta30d ?? dashboardMetric.delta_30d ?? 0) : 0;

  const chipColor =
    useDashboard && trend === 'UP' ? 'success' : useDashboard && trend === 'DOWN' ? 'error' : useDashboard ? 'default' : color;

  const DashboardTrendIcon =
    useDashboard && trend === 'DOWN' ? FallOutlined : useDashboard && trend === 'NEUTRAL' ? MinusOutlined : RiseOutlined;

  const pctLabel =
    useDashboard && (pctRaw === null || pctRaw === undefined)
      ? '—'
      : useDashboard
        ? `${pctRaw > 0 ? '+' : ''}${pctRaw}%`
        : percentage != null
          ? `${percentage}%`
          : null;

  const countDisplay = useDashboard ? formatInt(dashboardMetric.total) : count;

  const dashboardFooter = (
    <>
      <Typography variant="caption" color="text.secondary" component="span">
        {trend === 'UP' ? '↑' : trend === 'DOWN' ? '↓' : '•'}{' '}
        <Typography
          variant="caption"
          sx={{
            color:
              trend === 'UP' ? 'success.main' : trend === 'DOWN' ? 'error.main' : 'text.secondary',
            fontWeight: 700
          }}
          component="span"
        >
          {delta > 0 ? '+' : ''}
          {formatInt(delta)}
        </Typography>{' '}
        vs prior snapshot
      </Typography>
      {dataAsOf ? (
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.75 }}>
          Rollup date: {dataAsOf}
        </Typography>
      ) : null}
    </>
  );

  const legacyFooter = (
    <Typography variant="caption" color="text.secondary">
      You made an extra{' '}
      <Typography variant="caption" sx={{ color: `${color || 'primary'}.main` }} component="span">
        {extra}
      </Typography>{' '}
      this year
    </Typography>
  );

  return (
    <MainCard contentSX={{ p: 2.25 }}>
      {loading ? (
        <Stack sx={{ gap: 1.25 }}>
          <Skeleton variant="text" width="45%" height={28} />
          <Skeleton variant="text" width="70%" height={40} />
          <Skeleton variant="text" width="55%" height={24} />
          <Skeleton variant="text" width="90%" height={20} />
        </Stack>
      ) : (
        <>
          <Stack sx={{ gap: 0.5 }}>
            <Typography variant="h6" color="text.secondary">
              {title}
            </Typography>
            <Grid container sx={{ alignItems: 'center' }}>
              <Grid>
                <Typography variant="h4" color="inherit">
                  {countDisplay}
                </Typography>
              </Grid>
              {useDashboard && pctLabel != null ? (
                <Grid>
                  <Chip
                    variant="combined"
                    color={chipColor}
                    icon={<DashboardTrendIcon style={iconSX} />}
                    label={pctLabel}
                    sx={{ ml: 1.25, pl: 1 }}
                    size="small"
                  />
                </Grid>
              ) : null}
              {!useDashboard && percentage != null ? (
                <Grid>
                  <Chip
                    variant="combined"
                    color={color}
                    icon={isLoss ? <FallOutlined style={iconSX} /> : <RiseOutlined style={iconSX} />}
                    label={`${percentage}%`}
                    sx={{ ml: 1.25, pl: 1 }}
                    size="small"
                  />
                </Grid>
              ) : null}
            </Grid>
            {useDashboard ? (
              <Typography variant="caption" color="text.disabled" sx={{ mt: 0.25, letterSpacing: 0.3 }}>
                {periodCaption}
              </Typography>
            ) : null}
          </Stack>
          <Box sx={{ pt: 2.25 }}>{useDashboard ? dashboardFooter : legacyFooter}</Box>
        </>
      )}
    </MainCard>
  );
}

AnalyticEcommerce.propTypes = {
  color: PropTypes.string,
  title: PropTypes.string,
  count: PropTypes.string,
  percentage: PropTypes.number,
  isLoss: PropTypes.bool,
  extra: PropTypes.string,
  loading: PropTypes.bool,
  dashboardMetric: PropTypes.object,
  periodCaption: PropTypes.string,
  dataAsOf: PropTypes.string
};
