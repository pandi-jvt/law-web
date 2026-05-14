import PropTypes from 'prop-types';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import MainCard from 'components/MainCard';

const fmt = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return '—';
  }
};

const taskDue = (t) => t.dueDate ?? t.due_date;
const taskCaseId = (t) => t.caseInternalId ?? t.case_internal_id;
const taskCaseTitle = (t) => t.caseTitle ?? t.case_title ?? 'Case';
const hearingWhen = (h) => h.hearingDate ?? h.hearing_date;
const hearingPurpose = (h) => h.purposeOfHearing ?? h.purpose_of_hearing ?? '—';
const hearingCaseId = (h) => h.caseInternalId ?? h.case_internal_id;

export default function UpcomingTasksHearings({ tasks, hearings, loading, error }) {
  const taskRows = tasks ?? [];
  const hearingRows = hearings ?? [];

  const renderTableSkeleton = (colCount) => (
    <Table size="small">
      <TableBody>
        {[1, 2, 3, 4].map((i) => (
          <TableRow key={i}>
            {Array.from({ length: colCount }).map((_, j) => (
              <TableCell key={j}>
                <Skeleton variant="text" height={22} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <Stack direction="column" spacing={2} sx={{ width: '100%' }}>
      {error ? <Alert severity="warning">{error}</Alert> : null}
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.75} sx={{ width: '100%', alignItems: 'stretch' }}>
      <MainCard sx={{ flex: 1, width: '100%', minWidth: 0 }} content={false}>
        <Box sx={{ px: 2.5, pt: 2, pb: 1 }}>
          <Typography variant="h5" color="primary.dark" fontWeight={800}>
            Upcoming tasks
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Open work with due dates in the next window, soonest first.
          </Typography>
        </Box>
        <TableContainer sx={{ px: 0, pb: 2 }}>
          {loading ? (
            renderTableSkeleton(4)
          ) : taskRows.length === 0 ? (
            <Box sx={{ px: 2.5, py: 2 }}>
              <Typography color="text.secondary">No upcoming tasks with due dates.</Typography>
            </Box>
          ) : (
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['Due', 'Task', 'Case', 'Status'].map((h) => (
                    <TableCell
                      key={h}
                      sx={{
                        fontWeight: 800,
                        fontSize: 11,
                        letterSpacing: 0.6,
                        textTransform: 'uppercase',
                        color: 'text.secondary',
                        bgcolor: 'grey.50'
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {taskRows.map((t) => {
                  const cid = taskCaseId(t);
                  return (
                    <TableRow key={t.id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{fmt(taskDue(t))}</TableCell>
                      <TableCell>
                        <Typography fontWeight={700} color="primary.dark">
                          {t.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t.code}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {cid ? (
                          <Link component={RouterLink} to={`/cases/${cid}`} underline="hover" fontWeight={600}>
                            {taskCaseTitle(t)}
                          </Link>
                        ) : (
                          <Typography color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={String(t.status ?? '').replace(/_/g, ' ')} variant="outlined" sx={{ fontWeight: 700 }} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TableContainer>
        <Box sx={{ px: 2.5, pb: 2 }}>
          <Link component={RouterLink} to="/task" variant="body2" fontWeight={700}>
            View all tasks
          </Link>
        </Box>
      </MainCard>

      <MainCard sx={{ flex: 1, width: '100%', minWidth: 0 }} content={false}>
        <Box sx={{ px: 2.5, pt: 2, pb: 1 }}>
          <Typography variant="h5" color="primary.dark" fontWeight={800}>
            Upcoming hearings
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Scheduled court dates in the next window, soonest first.
          </Typography>
        </Box>
        <TableContainer sx={{ px: 0, pb: 2 }}>
          {loading ? (
            renderTableSkeleton(4)
          ) : hearingRows.length === 0 ? (
            <Box sx={{ px: 2.5, py: 2 }}>
              <Typography color="text.secondary">No upcoming hearings.</Typography>
            </Box>
          ) : (
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['Date', 'Hearing', 'Case', 'Status'].map((h) => (
                    <TableCell
                      key={h}
                      sx={{
                        fontWeight: 800,
                        fontSize: 11,
                        letterSpacing: 0.6,
                        textTransform: 'uppercase',
                        color: 'text.secondary',
                        bgcolor: 'grey.50'
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {hearingRows.map((h) => {
                  const cid = hearingCaseId(h);
                  return (
                    <TableRow key={h.internalId ?? h.internal_id ?? h.id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{fmt(hearingWhen(h))}</TableCell>
                      <TableCell>
                        <Typography fontWeight={700} color="primary.dark">
                          {hearingPurpose(h)}
                        </Typography>
                        {(h.judgeName ?? h.judge_name) ? (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {h.judgeName ?? h.judge_name}
                          </Typography>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {cid ? (
                          <Link component={RouterLink} to={`/cases/${cid}`} underline="hover" fontWeight={600}>
                            {h.caseTitle ?? h.case_title ?? 'Case'}
                          </Link>
                        ) : (
                          <Typography color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={String(h.status ?? '').replace(/_/g, ' ')}
                          color={String(h.status) === 'SCHEDULED' ? 'primary' : 'default'}
                          sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </MainCard>
      </Stack>
    </Stack>
  );
}

UpcomingTasksHearings.propTypes = {
  tasks: PropTypes.array,
  hearings: PropTypes.array,
  loading: PropTypes.bool,
  error: PropTypes.string
};
