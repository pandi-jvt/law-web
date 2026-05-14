import PropTypes from 'prop-types';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

import { LineChart } from '@mui/x-charts/LineChart';

// project imports
import { withAlpha } from 'utils/colorUtils';
import { apiService } from 'services/api';

// ==============================|| HELPERS ||============================== //

/** ISO week string YYYY-Www for the week containing `date` (local calendar). */
function toIsoWeekString(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const year = d.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${year}-W${String(weekNo).padStart(2, '0')}`;
}

function Legend({ items, onToggle }) {
  return (
    <Stack direction="row" sx={{ gap: 2, alignItems: 'center', justifyContent: 'center', mt: 2.5, mb: 1.5 }}>
      {items.map((item) => (
        <Stack
          key={item.label}
          direction="row"
          sx={{ gap: 1.25, alignItems: 'center', cursor: 'pointer' }}
          onClick={() => onToggle(item.label)}
        >
          <Box sx={{ width: 12, height: 12, bgcolor: item.visible ? item.color : 'text.secondary', borderRadius: '50%' }} />
          <Typography variant="body2" color="text.primary">
            {item.label}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

// ==============================|| INCOME AREA CHART ||============================== //

export default function IncomeAreaChart({ view }) {
  const theme = useTheme();
  const gradientId = useId().replace(/:/g, '');

  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => [currentYear, currentYear - 1, currentYear - 2], [currentYear]);

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isoWeek, setIsoWeek] = useState(() => toIsoWeekString(new Date()));

  const [labels, setLabels] = useState([]);
  const [caseCounts, setCaseCounts] = useState([]);
  const [clientCounts, setClientCounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [visibility, setVisibility] = useState({
    Cases: true,
    Clients: true
  });

  const line = theme.vars.palette.divider;

  const normalizeCounts = (payload) => {
    const cases = payload.case_counts ?? payload.caseCounts ?? [];
    const clients = payload.client_counts ?? payload.clientCounts ?? [];
    return { cases, clients };
  };

  const loadMonthly = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getDashboardTimeseriesMonthly(selectedYear);
      setLabels(data.labels ?? []);
      const { cases, clients } = normalizeCounts(data);
      setCaseCounts(cases);
      setClientCounts(clients);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load monthly data');
      setLabels([]);
      setCaseCounts([]);
      setClientCounts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  const loadWeekly = useCallback(async () => {
    if (!isoWeek) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getDashboardTimeseriesWeekly(isoWeek);
      setLabels(data.labels ?? []);
      const { cases, clients } = normalizeCounts(data);
      setCaseCounts(cases);
      setClientCounts(clients);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load weekly data');
      setLabels([]);
      setCaseCounts([]);
      setClientCounts([]);
    } finally {
      setLoading(false);
    }
  }, [isoWeek]);

  useEffect(() => {
    if (view === 'monthly') {
      loadMonthly();
    } else {
      loadWeekly();
    }
  }, [view, loadMonthly, loadWeekly]);

  const toggleVisibility = (label) => {
    setVisibility((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const visibleSeries = [
    {
      data: caseCounts,
      label: 'Cases',
      showMark: false,
      area: true,
      id: 'cases',
      color: theme.vars.palette.primary.main || '',
      visible: visibility.Cases
    },
    {
      data: clientCounts,
      label: 'Clients',
      showMark: false,
      area: true,
      id: 'clients',
      color: theme.vars.palette.primary[700] || '',
      visible: visibility.Clients
    }
  ];

  const g1 = `${gradientId}-g1`;
  const g2 = `${gradientId}-g2`;

  return (
    <>
      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 1, px: 0.5 }}>
        {view === 'monthly' ? (
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="income-chart-year-label">Year</InputLabel>
            <Select
              labelId="income-chart-year-label"
              label="Year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {yearOptions.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Typography component="label" variant="caption" sx={{ display: 'block', mb: 0.5 }}>
              Week
            </Typography>
            <Box
              component="input"
              type="week"
              value={isoWeek}
              onChange={(e) => setIsoWeek(e.target.value)}
              sx={{
                width: '100%',
                py: 1,
                px: 1.5,
                borderRadius: 1,
                border: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
                color: 'text.primary',
                fontFamily: 'inherit',
                fontSize: '0.875rem',
                '&:focus': { outline: 'none', borderColor: 'primary.main' }
              }}
            />
          </FormControl>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ position: 'relative', minHeight: 450 }}>
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'background.paper',
              opacity: 0.7,
              zIndex: 1
            }}
          >
            <CircularProgress size={40} />
          </Box>
        )}
        <LineChart
          hideLegend
          grid={{ horizontal: true, vertical: false }}
          xAxis={[{ scaleType: 'point', data: labels.length ? labels : ['—'], tickSize: 7, disableLine: true }]}
          yAxis={[{ tickSize: 7, disableLine: true }]}
          height={450}
          margin={{ top: 40, bottom: -5, right: 20, left: 5 }}
          series={visibleSeries
            .filter((series) => series.visible)
            .map((series) => ({
              type: 'line',
              data: labels.length ? series.data : [0],
              label: series.label,
              showMark: series.showMark,
              area: series.area,
              id: series.id,
              color: series.color,
              stroke: series.color,
              strokeWidth: 2
            }))}
          sx={{
            '& .MuiChartsGrid-line': { strokeDasharray: '4 4', stroke: line },
            '& .MuiAreaElement-series-cases': { fill: `url(#${g1})`, strokeWidth: 2, opacity: 0.8 },
            '& .MuiAreaElement-series-clients': { fill: `url(#${g2})`, strokeWidth: 2, opacity: 0.8 },
            '& .MuiChartsAxis-root.MuiChartsAxis-directionX .MuiChartsAxis-tick': { stroke: 'transparent' },
            '& .MuiChartsAxis-root.MuiChartsAxis-directionY .MuiChartsAxis-tick': { stroke: 'transparent' }
          }}
        >
          <defs>
            <linearGradient id={g1} gradientTransform="rotate(90)">
              <stop offset="10%" stopColor={withAlpha(theme.vars.palette.primary.main, 0.4)} />
              <stop offset="90%" stopColor={withAlpha(theme.vars.palette.background.default, 0.4)} />
            </linearGradient>
            <linearGradient id={g2} gradientTransform="rotate(90)">
              <stop offset="10%" stopColor={withAlpha(theme.vars.palette.primary[700], 0.4)} />
              <stop offset="90%" stopColor={withAlpha(theme.vars.palette.background.default, 0.4)} />
            </linearGradient>
          </defs>
        </LineChart>
      </Box>
      <Legend items={visibleSeries} onToggle={toggleVisibility} />
    </>
  );
}

Legend.propTypes = { items: PropTypes.array, onToggle: PropTypes.func };

IncomeAreaChart.propTypes = { view: PropTypes.oneOf(['monthly', 'weekly']) };
