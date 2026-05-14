import MainCard from 'components/MainCard';
import React, { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
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
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import WarningOutlined from '@ant-design/icons/WarningOutlined';
import { apiService, TaskPayload } from 'services/api';
import { Case, Task, TaskAssigneeRef, TaskPageResult, TaskPriority, TaskStatus, User } from 'types';

const initialTaskForm = {
  name: '',
  code: '',
  description: '',
  priority: TaskPriority.MEDIUM,
  status: TaskStatus.OPEN,
  dueDate: '',
  taskType: '',
  caseInternalId: '',
  assigneeInternalIds: [] as string[]
};

type TaskForm = typeof initialTaskForm;

type Order = 'asc' | 'desc';
type SortableColumn = 'name' | 'code' | 'priority' | 'status' | 'due_date' | 'created_at';

const getUserName = (user: User) => user.fullName ?? user.full_name ?? user.username;
const getCaseLabel = (caseRecord: Case) => `${caseRecord.title} (${caseRecord.caseNumber ?? caseRecord.case_number})`;
const getTaskCaseLabel = (task: Task) => {
  const title = task.caseTitle ?? task.case_title;
  const num = task.caseNumber ?? task.case_number;
  if (!title && !num) {
    return '—';
  }
  return `${title ?? 'Case'} (${num ?? 'N/A'})`;
};

const getAssigneeRefs = (task: Task): TaskAssigneeRef[] => {
  if (task.assignees?.length) {
    return task.assignees;
  }
  const legacyId = task.assigneeInternalId ?? task.assignee_internal_id;
  const legacyName = task.assigneeName ?? task.assignee_name;
  if (legacyId) {
    return [{ id: legacyId, fullName: legacyName ?? undefined, full_name: legacyName ?? undefined }];
  }
  return [];
};

const isTaskUnassigned = (task: Task) =>
  task.unassigned === true || (getAssigneeRefs(task).length === 0 && !(task.assigneeInternalId ?? task.assignee_internal_id));

const getDueDate = (task: Task) => task.dueDate ?? task.due_date;
const getTaskType = (task: Task) => task.taskType ?? task.task_type;
const getCreatedByName = (task: Task) => task.createdByName ?? task.created_by_name ?? '—';

const getTaskCreatedAt = (task: Task) => task.createdAt ?? task.created_at;

const pageTotal = (p: TaskPageResult) => p.total_elements ?? p.totalElements ?? 0;

const initials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const assigneeDisplayName = (a: TaskAssigneeRef) => a.fullName ?? a.full_name ?? 'User';

const MAX_VISIBLE_ASSIGNEE_NAMES = 3;

const taskStatusChipProps = (status: TaskStatus): ChipProps => {
  const label = status.replace(/_/g, ' ');
  switch (status) {
    case TaskStatus.OPEN:
      return { label, color: 'info', size: 'small' as const };
    case TaskStatus.IN_PROGRESS:
      return { label, color: 'warning', size: 'small' as const };
    case TaskStatus.ON_HOLD:
      return {
        label,
        size: 'small' as const,
        color: 'warning',
        variant: 'outlined',
        sx: { borderColor: 'warning.dark', color: 'warning.dark', bgcolor: 'warning.lighter' }
      };
    case TaskStatus.COMPLETED:
      return { label, color: 'success', size: 'small' as const };
    default:
      return { label, size: 'small' as const };
  }
};

const validateForm = (form: TaskForm) => {
  if (!form.name.trim()) {
    return 'Name is required.';
  }
  if (!form.code.trim()) {
    return 'Code is required.';
  }
  if (!form.taskType.trim()) {
    return 'Task type is required.';
  }
  return '';
};

const toDateTimeLocal = (value?: string) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const toIsoDate = (value: string) => (value ? new Date(value).toISOString() : undefined);

export const TaskPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState<TaskForm>(initialTaskForm);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');
  const [orderBy, setOrderBy] = useState<SortableColumn>('created_at');
  const [order, setOrder] = useState<Order>('desc');

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const loadRefs = async () => {
      try {
        const [caseData, userData] = await Promise.all([
          apiService.getCases({ page: 0, size: 200 }),
          apiService.getUsers({ page: 0, size: 200 })
        ]);
        setCases(caseData.content ?? []);
        setUsers(userData.content ?? []);
      } catch (err: any) {
        setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to load reference data');
      }
    };
    loadRefs();
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const sortKey =
        orderBy === 'due_date' ? 'due_date' : orderBy === 'created_at' ? 'created_at' : (orderBy as string);
      const data = await apiService.getTasks({
        page,
        size: rowsPerPage,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        sort: [`${sortKey},${order}`]
      });
      setTasks(data.content ?? []);
      setTotalElements(pageTotal(data));
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch, statusFilter, priorityFilter, orderBy, order]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, statusFilter, priorityFilter, rowsPerPage]);

  const handleOpenCreate = () => {
    setEditingTask(null);
    setTaskForm(initialTaskForm);
    setFormError('');
    setSuccess('');
    setDrawerOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    const refs = getAssigneeRefs(task);
    setTaskForm({
      name: task.name,
      code: task.code,
      description: task.description ?? '',
      priority: task.priority,
      status: task.status,
      dueDate: toDateTimeLocal(getDueDate(task)),
      taskType: getTaskType(task) ?? '',
      caseInternalId: task.caseInternalId ?? task.case_internal_id ?? '',
      assigneeInternalIds: refs.map((r) => r.id)
    });
    setFormError('');
    setSuccess('');
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    if (saving) {
      return;
    }
    setDrawerOpen(false);
    setEditingTask(null);
    setTaskForm(initialTaskForm);
    setFormError('');
  };

  const handleFormChange = (field: keyof TaskForm, value: string | TaskPriority | TaskStatus | string[]) => {
    setTaskForm((current) => ({ ...current, [field]: value }));
  };

  const handleRequestSort = (property: SortableColumn) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateForm(taskForm);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setSaving(true);
      setFormError('');
      const payload: TaskPayload = {
        name: taskForm.name.trim(),
        code: taskForm.code.trim(),
        ...(taskForm.description.trim() ? { description: taskForm.description.trim() } : {}),
        priority: taskForm.priority,
        status: taskForm.status,
        ...(taskForm.dueDate ? { due_date: toIsoDate(taskForm.dueDate) } : {}),
        task_type: taskForm.taskType.trim(),
        assignee_internal_ids: taskForm.assigneeInternalIds
      };
      if (taskForm.caseInternalId) {
        payload.case_internal_id = taskForm.caseInternalId;
      }
      if (editingTask) {
        await apiService.updateTask(editingTask.id, payload);
        setSuccess('Task updated successfully.');
      } else {
        await apiService.createTask(payload);
        setSuccess('Task created successfully.');
      }
      setDrawerOpen(false);
      setEditingTask(null);
      setTaskForm(initialTaskForm);
      await fetchTasks();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || err.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (task: Task) => {
    if (!window.confirm(`Delete task "${task.name}"?`)) {
      return;
    }
    try {
      setError('');
      await apiService.deleteTask(task.id);
      setSuccess('Task deleted successfully.');
      await fetchTasks();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to delete task');
    }
  };

  const selectedUsersForForm = users.filter((u) => taskForm.assigneeInternalIds.includes(u.id));

  return (
    <MainCard title="Tasks">
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2}>
          <Box>
            <Typography variant="h4">Tasks</Typography>
            <Typography color="text.secondary">Create and manage tasks you are allowed to access.</Typography>
          </Box>
          <Button onClick={handleOpenCreate} variant="contained" sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}>
            Create Task
          </Button>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
          <TextField
            label="Search"
            placeholder="Name, code, or requirements"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            size="small"
            sx={{ minWidth: { md: 280 }, flex: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="task-filter-status">Status</InputLabel>
            <Select
              labelId="task-filter-status"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter((e.target.value as TaskStatus | '') || '')}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value={TaskStatus.OPEN}>Open</MenuItem>
              <MenuItem value={TaskStatus.IN_PROGRESS}>In progress</MenuItem>
              <MenuItem value={TaskStatus.ON_HOLD}>On hold</MenuItem>
              <MenuItem value={TaskStatus.COMPLETED}>Completed</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="task-filter-priority">Priority</InputLabel>
            <Select
              labelId="task-filter-priority"
              label="Priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter((e.target.value as TaskPriority | '') || '')}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value={TaskPriority.LOW}>Low</MenuItem>
              <MenuItem value={TaskPriority.MEDIUM}>Medium</MenuItem>
              <MenuItem value={TaskPriority.HIGH}>High</MenuItem>
              <MenuItem value={TaskPriority.URGENT}>Urgent</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        {loading ? (
          <Typography>Loading tasks...</Typography>
        ) : tasks.length === 0 ? (
          <Alert severity="info">No tasks found. Create a task or adjust filters.</Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width={48} />
                  <TableCell sortDirection={orderBy === 'name' ? order : false}>
                    <TableSortLabel active={orderBy === 'name'} direction={orderBy === 'name' ? order : 'asc'} onClick={() => handleRequestSort('name')}>
                      Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === 'code' ? order : false}>
                    <TableSortLabel active={orderBy === 'code'} direction={orderBy === 'code' ? order : 'asc'} onClick={() => handleRequestSort('code')}>
                      Code
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === 'priority' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'priority'}
                      direction={orderBy === 'priority' ? order : 'asc'}
                      onClick={() => handleRequestSort('priority')}
                    >
                      Priority
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
                  <TableCell>Assignees</TableCell>
                  <TableCell>Case</TableCell>
                  <TableCell sortDirection={orderBy === 'due_date' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'due_date'}
                      direction={orderBy === 'due_date' ? order : 'asc'}
                      onClick={() => handleRequestSort('due_date')}
                    >
                      Due date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === 'created_at' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'created_at'}
                      direction={orderBy === 'created_at' ? order : 'asc'}
                      onClick={() => handleRequestSort('created_at')}
                      title="Sort by task created date"
                    >
                      Created by
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((task) => {
                  const unassigned = isTaskUnassigned(task);
                  const refs = getAssigneeRefs(task);
                  const names = refs.map(assigneeDisplayName);
                  const extra = Math.max(0, names.length - MAX_VISIBLE_ASSIGNEE_NAMES);
                  const visibleNames = names.slice(0, MAX_VISIBLE_ASSIGNEE_NAMES);
                  return (
                    <TableRow
                      key={task.id}
                      hover
                      sx={unassigned ? { bgcolor: 'warning.lighter', '&:hover': { bgcolor: 'warning.light' } } : undefined}
                    >
                      <TableCell>
                        {unassigned ? (
                          <Tooltip title="No assignee">
                            <WarningOutlined style={{ color: 'var(--mui-palette-warning-dark)' }} />
                          </Tooltip>
                        ) : null}
                      </TableCell>
                      <TableCell>{task.name}</TableCell>
                      <TableCell>{task.code}</TableCell>
                      <TableCell>
                        <Chip label={task.priority} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip {...taskStatusChipProps(task.status)} />
                      </TableCell>
                      <TableCell>
                        {refs.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        ) : (
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: 12 } }}>
                              {refs.map((a) => (
                                <Tooltip key={a.id} title={assigneeDisplayName(a)}>
                                  <Avatar alt={assigneeDisplayName(a)}>{initials(assigneeDisplayName(a))}</Avatar>
                                </Tooltip>
                              ))}
                            </AvatarGroup>
                            <Typography variant="body2" color="text.secondary">
                              {visibleNames.join(', ')}
                              {extra > 0 ? ` +${extra} more` : ''}
                            </Typography>
                          </Stack>
                        )}
                      </TableCell>
                      <TableCell>{getTaskCaseLabel(task)}</TableCell>
                      <TableCell>{getDueDate(task) ? new Date(getDueDate(task) as string).toLocaleString() : '—'}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{getCreatedByName(task)}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {getTaskCreatedAt(task) ? new Date(getTaskCreatedAt(task) as string).toLocaleString() : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button onClick={() => handleOpenEdit(task)} variant="outlined" size="small">
                            Edit
                          </Button>
                          <Button onClick={() => handleDelete(task)} color="error" variant="outlined" size="small">
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
        PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, borderTopLeftRadius: { xs: 0, sm: 16 }, borderBottomLeftRadius: { xs: 0, sm: 16 }, boxShadow: 24 } }}
      >
        <Box component="form" onSubmit={handleSubmit} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
            <Typography variant="h4">{editingTask ? 'Edit task' : 'Create task'}</Typography>
            <IconButton aria-label="Close task drawer" onClick={handleCloseDrawer} disabled={saving}>
              <CloseOutlined />
            </IconButton>
          </Stack>
          <Divider />

          <Stack spacing={2} sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField label="Name" value={taskForm.name} onChange={(event) => handleFormChange('name', event.target.value)} required fullWidth inputProps={{ maxLength: 255 }} />
            <TextField label="Code" value={taskForm.code} onChange={(event) => handleFormChange('code', event.target.value)} required fullWidth inputProps={{ maxLength: 100 }} />
            <TextField label="Description" value={taskForm.description} onChange={(event) => handleFormChange('description', event.target.value)} fullWidth multiline minRows={3} />
            <FormControl fullWidth>
              <InputLabel id="task-priority-label">Priority</InputLabel>
              <Select labelId="task-priority-label" label="Priority" value={taskForm.priority} onChange={(event) => handleFormChange('priority', event.target.value as TaskPriority)}>
                <MenuItem value={TaskPriority.LOW}>Low</MenuItem>
                <MenuItem value={TaskPriority.MEDIUM}>Medium</MenuItem>
                <MenuItem value={TaskPriority.HIGH}>High</MenuItem>
                <MenuItem value={TaskPriority.URGENT}>Urgent</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="task-status-label">Status</InputLabel>
              <Select labelId="task-status-label" label="Status" value={taskForm.status} onChange={(event) => handleFormChange('status', event.target.value as TaskStatus)}>
                <MenuItem value={TaskStatus.OPEN}>Open</MenuItem>
                <MenuItem value={TaskStatus.IN_PROGRESS}>In Progress</MenuItem>
                <MenuItem value={TaskStatus.ON_HOLD}>On Hold</MenuItem>
                <MenuItem value={TaskStatus.COMPLETED}>Completed</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="task-case-label">Case (optional)</InputLabel>
              <Select
                labelId="task-case-label"
                label="Case (optional)"
                value={taskForm.caseInternalId || ''}
                onChange={(event) => handleFormChange('caseInternalId', event.target.value as string)}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {cases.map((caseRecord) => (
                  <MenuItem key={caseRecord.id} value={caseRecord.id}>
                    {getCaseLabel(caseRecord)}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Link an optional case you can edit.</FormHelperText>
            </FormControl>
            <Autocomplete
              multiple
              options={users}
              getOptionLabel={(option) => getUserName(option)}
              value={selectedUsersForForm}
              onChange={(_, value) => handleFormChange('assigneeInternalIds', value.map((u) => u.id))}
              filterSelectedOptions
              renderInput={(params) => <TextField {...params} label="Assignees (optional)" placeholder="Search users" />}
              isOptionEqualToValue={(a, b) => a.id === b.id}
            />
            <FormHelperText sx={{ mt: -1 }}>Leave empty for an unassigned task. Only users you can access are listed.</FormHelperText>
            <TextField label="Due date" type="datetime-local" value={taskForm.dueDate} onChange={(event) => handleFormChange('dueDate', event.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Task type" value={taskForm.taskType} onChange={(event) => handleFormChange('taskType', event.target.value)} required fullWidth inputProps={{ maxLength: 100 }} />
          </Stack>

          <Divider />
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ p: 2 }}>
            <Button onClick={handleCloseDrawer} variant="outlined" disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving} sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}>
              {saving ? 'Saving...' : editingTask ? 'Save changes' : 'Create task'}
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </MainCard>
  );
};

export default TaskPage;
