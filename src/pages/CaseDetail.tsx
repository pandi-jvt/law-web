import MainCard from 'components/MainCard';
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip, { ChipProps } from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Drawer from '@mui/material/Drawer';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import UserAddOutlined from '@ant-design/icons/UserAddOutlined';
import ArrowLeftOutlined from '@ant-design/icons/ArrowLeftOutlined';
import CloudUploadOutlined from '@ant-design/icons/CloudUploadOutlined';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import DownloadOutlined from '@ant-design/icons/DownloadOutlined';
import EditOutlined from '@ant-design/icons/EditOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import FileImageOutlined from '@ant-design/icons/FileImageOutlined';
import FilePdfOutlined from '@ant-design/icons/FilePdfOutlined';
import FileTextOutlined from '@ant-design/icons/FileTextOutlined';
import FilterOutlined from '@ant-design/icons/FilterOutlined';
import { useAuth } from 'contexts/AuthContext';
import { apiService, type CaseActivityPayload, type HearingPayload } from 'services/api';
import { Case, CaseStatus, Client, Document as CaseDocument, Hearing, HearingStatus, Task, User } from 'types';
import { canDeleteCase, canManageAssignments, canUploadDocument } from 'utils/permissions';

const statusLabel = (status: CaseStatus | string) => status.replace(/_/g, ' ');

const statusColor = (status: CaseStatus | string): ChipProps['color'] => {
  if (status === CaseStatus.OPEN) {
    return 'success';
  }
  if (status === CaseStatus.CLOSED) {
    return 'error';
  }
  if (status === CaseStatus.IN_PROGRESS) {
    return 'warning';
  }
  return 'default';
};

const initialCaseForm = {
  title: '',
  caseNumber: '',
  clientInternalId: '',
  status: CaseStatus.OPEN,
  description: '',
  fileNo: '',
  fileDate: '',
  courtNo: '',
  courtName: '',
  oppositeParty: '',
  policeStation: '',
  underSection: '',
  firNo: '',
  nextHearingDate: ''
};

const initialActivityForm = {
  activityTitle: '',
  activityDescription: '',
  activityDate: '',
  activityType: '',
  assigneeInternalIds: [] as string[]
};

const initialHearingForm = {
  hearingDate: '',
  purposeOfHearing: '',
  judgeName: '',
  result: '',
  status: HearingStatus.SCHEDULED as string,
  assigneeInternalIds: [] as string[]
};

const toDateTimeLocal = (value?: string | null) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const toIsoFromLocal = (value: string) => (value ? new Date(value).toISOString() : undefined);

const formatDate = (value?: string) => (value ? new Date(value).toLocaleString() : 'Not set');

const formatHearingDateOnly = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

// const formatActivityTimelineWhen = (value?: string | null) => {
//   if (!value) {
//     return '—';
//   }
//   const d = new Date(value);
//   const today = new Date();
//   const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
//   const startD = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
//   const diffDays = Math.round((startToday - startD) / 86400000);
//   if (diffDays === 0) {
//     return `Today, ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`.toUpperCase();
//   }
//   if (diffDays === 1) {
//     return 'YESTERDAY';
//   }
//   return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
// };

// const pickActivityTimelineIcon = (title: string) => {
//   const t = title.toLowerCase();
//   if (t.includes('email') || t.includes('correspondence')) {
//     return <MailOutlined />;
//   }
//   if (t.includes('review') || t.includes('complet')) {
//     return <CheckCircleOutlined />;
//   }
//   return <FileTextOutlined />;
// };

const hearingStatusChipColor = (status: string): ChipProps['color'] => {
  switch (status) {
    case HearingStatus.COMPLETED:
      return 'success';
    case HearingStatus.SCHEDULED:
      return 'primary';
    case HearingStatus.ADJOURNED:
      return 'warning';
    case HearingStatus.CANCELLED:
      return 'error';
    default:
      return 'default';
  }
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) {
    return '0 B';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getClientName = (client?: Client) => {
  if (!client) {
    return 'Not set';
  }
  return `${client.firstName ?? client.first_name ?? ''} ${client.lastName ?? client.last_name ?? ''}`.trim() || 'Not set';
};

const getUserName = (user: User) => user.fullName ?? user.full_name ?? user.username;
const getUserInitials = (user: User) =>
  getUserName(user)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
const getUserRoleLabel = (user: User) =>
  String(user.groupRole ?? user.group_role ?? user.role ?? 'member')
    .replace(/_/g, ' ')
    .toUpperCase();

const getDocumentName = (document: CaseDocument) => document.originalFilename ?? document.original_filename ?? document.filename;
const getDocumentType = (document: CaseDocument) => document.fileType ?? document.file_type ?? 'application/octet-stream';
const getDocumentSize = (document: CaseDocument) => document.fileSize ?? document.file_size;
const getDocumentCreatedAt = (document: CaseDocument) => document.createdAt ?? document.created_at;
const isPdfDocument = (document: CaseDocument) => getDocumentType(document).includes('pdf') || getDocumentName(document).toLowerCase().endsWith('.pdf');
const isImageDocument = (document: CaseDocument) => getDocumentType(document).startsWith('image/');

const DocumentIcon = ({ document }: { document: CaseDocument }) => {
  if (isPdfDocument(document)) {
    return <FilePdfOutlined />;
  }
  if (isImageDocument(document)) {
    return <FileImageOutlined />;
  }
  return <FileTextOutlined />;
};

type DetailFieldProps = {
  label: string;
  value?: React.ReactNode;
};

const DetailField = ({ label, value }: DetailFieldProps) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
      {label}
    </Typography>
    <Typography variant="body1" fontWeight={700} color="primary.dark" sx={{ overflowWrap: 'anywhere' }}>
      {value || 'Not set'}
    </Typography>
  </Box>
);

type CaseCardProps = {
  children: React.ReactNode;
  sx?: any;
};

const CaseCard = ({ children, sx }: CaseCardProps) => (
  <Paper
    variant="outlined"
    sx={{
      bgcolor: 'background.paper',
      borderColor: 'grey.200',
      borderRadius: 0,
      boxShadow: '0 1px 4px rgba(15, 23, 42, 0.06)',
      p: { xs: 2.5, md: 3 },
      ...sx
    }}
  >
    {children}
  </Paper>
);

export const CaseDetail: React.FC = () => {
  const { caseId } = useParams();
  const { user } = useAuth();
  const [caseRecord, setCaseRecord] = useState<Case | null>(null);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [accountUsers, setAccountUsers] = useState<User[]>([]);
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingAssignments, setSavingAssignments] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [assignmentDrawerOpen, setAssignmentDrawerOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerDocument, setViewerDocument] = useState<CaseDocument | null>(null);
  const [viewerUrl, setViewerUrl] = useState('');
  const [error, setError] = useState('');
  const [documentError, setDocumentError] = useState('');
  const [assignmentError, setAssignmentError] = useState('');
  const [formError, setFormError] = useState('');
  const [caseForm, setCaseForm] = useState(initialCaseForm);
  const [assignmentForm, setAssignmentForm] = useState<string[]>([]);
  // Hide case activities for now
  // const [caseActivities, setCaseActivities] = useState<CaseActivity[]>([]);
  // const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState('');
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [activitySaving, setActivitySaving] = useState(false);
  const [activityForm, setActivityForm] = useState(initialActivityForm);
  const [editingActivityInternalId, setEditingActivityInternalId] = useState<string | null>(null);
  const [caseTasks, setCaseTasks] = useState<Task[]>([]);
  const [caseTasksLoading, setCaseTasksLoading] = useState(false);
  const [caseTasksError, setCaseTasksError] = useState('');
  const [caseHearings, setCaseHearings] = useState<Hearing[]>([]);
  const [hearingsLoading, setHearingsLoading] = useState(false);
  const [hearingsError, setHearingsError] = useState('');
  const [hearingDialogOpen, setHearingDialogOpen] = useState(false);
  const [hearingSaving, setHearingSaving] = useState(false);
  const [hearingForm, setHearingForm] = useState(initialHearingForm);
  const [editingHearingInternalId, setEditingHearingInternalId] = useState<string | null>(null);

  useEffect(() => {
    fetchCase();
    fetchDocuments();
    fetchAssignments();
    // fetchCaseActivities();
    fetchCaseHearings();
    fetchCaseTasks();
  }, [caseId]);

  useEffect(() => {
    return () => {
      if (viewerUrl) {
        URL.revokeObjectURL(viewerUrl);
      }
    };
  }, [viewerUrl]);

  useEffect(() => {
    if (drawerOpen) {
      fetchClients();
    }
  }, [drawerOpen]);

  const fetchCase = async () => {
    if (!caseId) {
      setError('Case id is missing.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await apiService.getCase(caseId);
      setCaseRecord(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to load case');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      setClientsLoading(true);
      const data = await apiService.getClients({ page: 0, size: 200 });
      setClients(data.content ?? []);
    } catch (err: any) {
      setFormError(err.response?.data?.detail || err.response?.data?.message || 'Failed to load clients');
    } finally {
      setClientsLoading(false);
    }
  };

  const fetchDocuments = async () => {
    if (!caseId) {
      return;
    }

    try {
      setDocumentsLoading(true);
      setDocumentError('');
      const data = await apiService.getDocuments(caseId, 0, 100);
      setDocuments(data);
    } catch (err: any) {
      setDocumentError(err.response?.data?.detail || err.response?.data?.message || 'Failed to load documents');
    } finally {
      setDocumentsLoading(false);
    }
  };

  // Hide case activities for now
  // const fetchCaseActivities = async () => {
  //   if (!caseId) {
  //     return;
  //   }
  //   try {
  //     setActivitiesLoading(true);
  //     setActivitiesError('');
  //     const page = await apiService.getCaseActivitiesForCase(caseId, { page: 0, size: 100, sort: ['-activity_date'] });
  //     setCaseActivities(page.content ?? []);
  //   } catch (err: any) {
  //     setActivitiesError(err.response?.data?.detail || err.response?.data?.message || 'Failed to load case activities');
  //   } finally {
  //     setActivitiesLoading(false);
  //   }
  // };

  const fetchCaseHearings = async () => {
    if (!caseId) {
      return;
    }
    try {
      setHearingsLoading(true);
      setHearingsError('');
      const page = await apiService.getHearingsForCase(caseId, { page: 0, size: 100, sort: ['hearingDate,desc'] });
      setCaseHearings(page.content ?? []);
    } catch (err: any) {
      setHearingsError(err.response?.data?.detail || err.response?.data?.message || 'Failed to load hearings');
    } finally {
      setHearingsLoading(false);
    }
  };

  const fetchCaseTasks = async () => {
    if (!caseId) {
      return;
    }
    try {
      setCaseTasksLoading(true);
      setCaseTasksError('');
      const page = await apiService.getTasks({
        page: 0,
        size: 50,
        sort: ['due_date,asc'],
        case_internal_id: String(caseId)
      });
      setCaseTasks(page.content ?? []);
    } catch (err: any) {
      setCaseTasksError(err.response?.data?.detail || err.response?.data?.message || 'Failed to load tasks for this case');
    } finally {
      setCaseTasksLoading(false);
    }
  };

  const fetchAssignments = async () => {
    if (!caseId) {
      return;
    }

    try {
      setAssignmentsLoading(true);
      setAssignmentError('');
      const [assignmentData, usersData] = await Promise.all([
        apiService.getCaseAssignments(caseId),
        apiService.getUsers({ page: 0, size: 200 })
      ]);
      setAssignedUserIds(assignmentData.userInternalIds ?? assignmentData.user_internal_ids ?? []);
      setAccountUsers(usersData.content ?? []);
    } catch (err: any) {
      setAssignmentError(err.response?.data?.detail || err.response?.data?.message || 'Failed to load case assignments');
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const handleOpenAssignmentDrawer = () => {
    setAssignmentForm(assignedUserIds);
    setAssignmentError('');
    setAssignmentDrawerOpen(true);
  };

  const handleCloseAssignmentDrawer = () => {
    if (savingAssignments) {
      return;
    }
    setAssignmentDrawerOpen(false);
  };

  const handleSaveAssignments = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!caseId) {
      return;
    }

    try {
      setSavingAssignments(true);
      setAssignmentError('');
      await apiService.assignUsersToCase(caseId, assignmentForm);
      setAssignedUserIds(assignmentForm);
      setAssignmentDrawerOpen(false);
      await fetchAssignments();
    } catch (err: any) {
      setAssignmentError(err.response?.data?.detail || err.response?.data?.message || 'Failed to save assignments');
    } finally {
      setSavingAssignments(false);
    }
  };

  // Hide case activities for now
  // const getActivityInternalId = (a: CaseActivity) => a.internalId ?? a.internal_id ?? '';
  const getHearingInternalId = (h: Hearing) => h.internalId ?? h.internal_id ?? '';

  const handleOpenHearingDialog = () => {
    if (!caseId) {
      return;
    }
    setEditingHearingInternalId(null);
    setHearingForm({
      ...initialHearingForm,
      hearingDate: toDateTimeLocal(new Date().toISOString())
    });
    setHearingsError('');
    setHearingDialogOpen(true);
  };

  const handleCloseHearingDialog = () => {
    if (hearingSaving) {
      return;
    }
    setHearingDialogOpen(false);
    setEditingHearingInternalId(null);
  };

  const handleEditHearing = (hearing: Hearing) => {
    const id = getHearingInternalId(hearing);
    const when = hearing.hearingDate ?? hearing.hearing_date ?? '';
    const purpose = hearing.purposeOfHearing ?? hearing.purpose_of_hearing ?? '';
    const judge = hearing.judgeName ?? hearing.judge_name ?? '';
    const result = hearing.result ?? '';
    const status = String(hearing.status ?? HearingStatus.SCHEDULED);
    const assignees = (hearing.assignees ?? [])
      .map((x) => x.internalId ?? x.internal_id)
      .filter(Boolean) as string[];
    setEditingHearingInternalId(id || null);
    setHearingForm({
      hearingDate: toDateTimeLocal(when),
      purposeOfHearing: purpose,
      judgeName: judge,
      result,
      status,
      assigneeInternalIds: assignees
    });
    setHearingsError('');
    setHearingDialogOpen(true);
  };

  const handleSaveHearing = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!caseId) {
      return;
    }
    const purpose = hearingForm.purposeOfHearing.trim();
    if (!purpose) {
      setHearingsError('Purpose of hearing is required.');
      return;
    }
    const hearingDateIso = toIsoFromLocal(hearingForm.hearingDate);
    if (!hearingDateIso) {
      setHearingsError('Hearing date is required.');
      return;
    }
    const payload: HearingPayload = {
      hearing_date: hearingDateIso,
      purpose_of_hearing: purpose,
      judge_name: hearingForm.judgeName.trim() || null,
      result: hearingForm.result.trim() || null,
      status: hearingForm.status || undefined,
      case_internal_id: String(caseId),
      ...(hearingForm.assigneeInternalIds.length > 0 ? { assignee_internal_ids: hearingForm.assigneeInternalIds } : {})
    };
    try {
      setHearingSaving(true);
      setHearingsError('');
      if (editingHearingInternalId) {
        await apiService.updateHearing(editingHearingInternalId, payload);
      } else {
        await apiService.createHearing(payload);
      }
      setHearingDialogOpen(false);
      setEditingHearingInternalId(null);
      await fetchCaseHearings();
    } catch (err: any) {
      setHearingsError(err.response?.data?.detail || err.response?.data?.message || 'Failed to save hearing');
    } finally {
      setHearingSaving(false);
    }
  };

  const handleDeleteHearing = async (hearing: Hearing) => {
    const id = getHearingInternalId(hearing);
    if (!id || !window.confirm('Delete this hearing record?')) {
      return;
    }
    try {
      setHearingsError('');
      await apiService.deleteHearing(id);
      await fetchCaseHearings();
    } catch (err: any) {
      setHearingsError(err.response?.data?.detail || err.response?.data?.message || 'Failed to delete hearing');
    }
  };

  // Hide case activities for now
  // const handleOpenActivityDialog = () => {
  //   if (!caseId) {
  //     return;
  //   }
  //   setEditingActivityInternalId(null);
  //   setActivityForm({
  //     ...initialActivityForm,
  //     activityDate: toDateTimeLocal(new Date().toISOString())
  //   });
  //   setActivitiesError('');
  //   setActivityDialogOpen(true);
  // };

  const handleCloseActivityDialog = () => {
    if (activitySaving) {
      return;
    }
    setActivityDialogOpen(false);
    setEditingActivityInternalId(null);
  };

  // Hide case activities for now
  // const handleEditActivity = (activity: CaseActivity) => {
  //   const id = getActivityInternalId(activity);
  //   const title = activity.activityTitle ?? activity.activity_title ?? '';
  //   const desc = activity.activityDescription ?? activity.activity_description ?? '';
  //   const dateRaw = activity.activityDate ?? activity.activity_date ?? '';
  //   const type = activity.activityType ?? activity.activity_type ?? '';
  //   const assignees = (activity.assignees ?? [])
  //     .map((x) => x.internalId ?? x.internal_id)
  //     .filter(Boolean) as string[];
  //   setEditingActivityInternalId(id || null);
  //   setActivityForm({
  //     activityTitle: title,
  //     activityDescription: desc,
  //     activityDate: toDateTimeLocal(dateRaw),
  //     activityType: type,
  //     assigneeInternalIds: assignees
  //   });
  //   setActivitiesError('');
  //   setActivityDialogOpen(true);
  // };

  const handleSaveActivity = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!caseId) {
      return;
    }
    const title = activityForm.activityTitle.trim();
    if (!title) {
      setActivitiesError('Activity title is required.');
      return;
    }
    const activityDateIso = toIsoFromLocal(activityForm.activityDate);
    if (!activityDateIso) {
      setActivitiesError('Activity date is required.');
      return;
    }
    const payload: CaseActivityPayload = {
      activity_title: title,
      activity_description: activityForm.activityDescription.trim() || null,
      activity_date: activityDateIso,
      activity_type: activityForm.activityType.trim() || null,
      case_internal_id: String(caseId),
      ...(activityForm.assigneeInternalIds.length > 0
        ? { assignee_internal_ids: activityForm.assigneeInternalIds }
        : {})
    };
    try {
      setActivitySaving(true);
      setActivitiesError('');
      if (editingActivityInternalId) {
        await apiService.updateCaseActivity(editingActivityInternalId, payload);
      } else {
        await apiService.createCaseActivity(payload);
      }
      setActivityDialogOpen(false);
      setEditingActivityInternalId(null);
      // await fetchCaseActivities();
    } catch (err: any) {
      setActivitiesError(err.response?.data?.detail || err.response?.data?.message || 'Failed to save activity');
    } finally {
      setActivitySaving(false);
    }
  };

  // Hide case activities for now
  // const handleDeleteActivity = async (activity: CaseActivity) => {
  //   const id = getActivityInternalId(activity);
  //   if (!id || !window.confirm('Delete this case activity?')) {
  //     return;
  //   }
  //   try {
  //     setActivitiesError('');
  //     await apiService.deleteCaseActivity(id);
  //     await fetchCaseActivities();
  //   } catch (err: any) {
  //     setActivitiesError(err.response?.data?.detail || err.response?.data?.message || 'Failed to delete activity');
  //   }
  // };

  const handleRemoveAssignedUser = async (userId: string) => {
    if (!caseId) {
      return;
    }
    const nextAssignments = assignedUserIds.filter((id) => id !== userId);
    try {
      setSavingAssignments(true);
      setAssignmentError('');
      await apiService.assignUsersToCase(caseId, nextAssignments);
      setAssignedUserIds(nextAssignments);
    } catch (err: any) {
      setAssignmentError(err.response?.data?.detail || err.response?.data?.message || 'Failed to remove assignment');
    } finally {
      setSavingAssignments(false);
    }
  };

  const handleFilesUpload = async (files: FileList | File[]) => {
    if (!caseId || files.length === 0) {
      return;
    }

    try {
      setUploading(true);
      setDocumentError('');
      for (const file of Array.from(files)) {
        await apiService.uploadDocument(caseId, file);
      }
      await fetchDocuments();
    } catch (err: any) {
      setDocumentError(err.response?.data?.detail || err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleOpenDocument = async (document: CaseDocument) => {
    try {
      setDocumentError('');
      const blob = await apiService.downloadDocument(document.id);
      const typedBlob = new Blob([blob], { type: getDocumentType(document) });
      const url = URL.createObjectURL(typedBlob);
      if (isPdfDocument(document) || isImageDocument(document)) {
        setViewerDocument(document);
        setViewerUrl(url);
        setViewerOpen(true);
        return;
      }

      const link = window.document.createElement('a');
      link.href = url;
      link.download = getDocumentName(document);
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setDocumentError(err.response?.data?.detail || err.response?.data?.message || 'Failed to open document');
    }
  };

  const handleDownloadDocument = async (document: CaseDocument) => {
    try {
      setDocumentError('');
      const blob = await apiService.downloadDocument(document.id);
      const typedBlob = new Blob([blob], { type: getDocumentType(document) });
      const url = URL.createObjectURL(typedBlob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = getDocumentName(document);
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setDocumentError(err.response?.data?.detail || err.response?.data?.message || 'Failed to download document');
    }
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
    setViewerDocument(null);
    if (viewerUrl) {
      URL.revokeObjectURL(viewerUrl);
      setViewerUrl('');
    }
  };

  const handleDeleteDocument = async (document: CaseDocument) => {
    if (!window.confirm(`Delete ${getDocumentName(document)}?`)) {
      return;
    }

    try {
      setDocumentError('');
      await apiService.deleteDocument(document.id);
      setDocuments((current) => current.filter((item) => item.id !== document.id));
    } catch (err: any) {
      setDocumentError(err.response?.data?.detail || err.response?.data?.message || 'Failed to delete document');
    }
  };

  const handleOpenDrawer = () => {
    if (!caseRecord) {
      return;
    }

    setCaseForm({
      title: caseRecord.title ?? '',
      caseNumber: caseRecord.caseNumber ?? caseRecord.case_number ?? '',
      clientInternalId: caseRecord.clientInternalId ?? caseRecord.client_internal_id ?? caseRecord.client?.id ?? '',
      status: caseRecord.status ?? CaseStatus.OPEN,
      description: caseRecord.description ?? '',
      fileNo: caseRecord.fileNo ?? caseRecord.file_no ?? '',
      fileDate: toDateTimeLocal(caseRecord.fileDate ?? caseRecord.file_date),
      courtNo: caseRecord.courtNo ?? caseRecord.court_no ?? '',
      courtName: caseRecord.courtName ?? caseRecord.court_name ?? '',
      oppositeParty: caseRecord.oppositeParty ?? caseRecord.opposite_party ?? '',
      policeStation: caseRecord.policeStation ?? caseRecord.police_station ?? '',
      underSection: caseRecord.underSection ?? caseRecord.under_section ?? '',
      firNo: caseRecord.firNo ?? caseRecord.fir_no ?? '',
      nextHearingDate: toDateTimeLocal(caseRecord.nextHearingDate ?? caseRecord.next_hearing_date)
    });
    setFormError('');
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    if (saving) {
      return;
    }
    setDrawerOpen(false);
    setFormError('');
  };

  const handleCaseFormChange = (field: keyof typeof initialCaseForm, value: string | CaseStatus) => {
    setCaseForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!caseId || !caseForm.title.trim() || !caseForm.caseNumber.trim() || !caseForm.clientInternalId) {
      setFormError('Title, case number, and client are required.');
      return;
    }

    try {
      setSaving(true);
      setFormError('');
      const updated = await apiService.updateCase(caseId, {
        title: caseForm.title.trim(),
        case_number: caseForm.caseNumber.trim(),
        client_internal_id: caseForm.clientInternalId,
        status: caseForm.status,
        ...(caseForm.description.trim() ? { description: caseForm.description.trim() } : {}),
        ...(caseForm.fileNo.trim() ? { file_no: caseForm.fileNo.trim() } : { file_no: null }),
        ...(caseForm.fileDate ? { file_date: toIsoFromLocal(caseForm.fileDate) } : { file_date: null }),
        ...(caseForm.courtNo.trim() ? { court_no: caseForm.courtNo.trim() } : { court_no: null }),
        ...(caseForm.courtName.trim() ? { court_name: caseForm.courtName.trim() } : { court_name: null }),
        ...(caseForm.oppositeParty.trim() ? { opposite_party: caseForm.oppositeParty.trim() } : { opposite_party: null }),
        ...(caseForm.policeStation.trim() ? { police_station: caseForm.policeStation.trim() } : { police_station: null }),
        ...(caseForm.underSection.trim() ? { under_section: caseForm.underSection.trim() } : { under_section: null }),
        ...(caseForm.firNo.trim() ? { fir_no: caseForm.firNo.trim() } : { fir_no: null }),
        ...(caseForm.nextHearingDate ? { next_hearing_date: toIsoFromLocal(caseForm.nextHearingDate) } : { next_hearing_date: null })
      });
      setCaseRecord(updated);
      setDrawerOpen(false);
      await fetchCase();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || err.response?.data?.message || 'Failed to update case');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainCard title="Case Details">
        <Typography>Loading case...</Typography>
      </MainCard>
    );
  }

  if (error || !caseRecord) {
    return (
      <MainCard title="Case Details">
        <Stack spacing={2}>
          <Button component={Link} to="/cases" startIcon={<ArrowLeftOutlined />} sx={{ alignSelf: 'flex-start' }}>
            Back to cases
          </Button>
          <Alert severity="error">{error || 'Case not found'}</Alert>
        </Stack>
      </MainCard>
    );
  }

  const clientName = getClientName(caseRecord.client);
  const openedDate = caseRecord.openedDate ?? caseRecord.opened_date;
  const closedDate = caseRecord.closedDate ?? caseRecord.closed_date;
  const client = caseRecord.client;
  const caseNumber = caseRecord.caseNumber ?? caseRecord.case_number;
  const fileNoV = caseRecord.fileNo ?? caseRecord.file_no;
  const fileDateV = caseRecord.fileDate ?? caseRecord.file_date;
  const courtNoV = caseRecord.courtNo ?? caseRecord.court_no;
  const courtNameV = caseRecord.courtName ?? caseRecord.court_name;
  const oppositePartyV = caseRecord.oppositeParty ?? caseRecord.opposite_party;
  const policeStationV = caseRecord.policeStation ?? caseRecord.police_station;
  const underSectionV = caseRecord.underSection ?? caseRecord.under_section;
  const firNoV = caseRecord.firNo ?? caseRecord.fir_no;
  const nextHearingV = caseRecord.nextHearingDate ?? caseRecord.next_hearing_date;
  const assignedUsers = accountUsers.filter((accountUser) => assignedUserIds.includes(accountUser.id));

  return (
    <MainCard title="Case Details">
      <Stack spacing={2.5}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1.5}>
          <Button component={Link} to="/cases" startIcon={<ArrowLeftOutlined />} sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}>
            Back to cases
          </Button>
          {canDeleteCase(user) && (
            <Button
              onClick={handleOpenDrawer}
              variant="outlined"
              startIcon={<EditOutlined />}
              sx={{
                alignSelf: { xs: 'flex-start', sm: 'center' },
                borderColor: 'grey.300',
                borderRadius: 999,
                color: 'primary.dark',
                fontWeight: 700,
                letterSpacing: 1,
                px: 2.5,
                textTransform: 'uppercase'
              }}
            >
              Edit
            </Button>
          )}
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 2.5 }}>
          <CaseCard>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: 1.5 }}>
                  Case File
                </Typography>
                <Typography variant="h2" color="primary.dark" sx={{ fontWeight: 800, lineHeight: 1.1, mt: 0.5 }}>
                  {caseRecord.title}
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: 16, mt: 0.75 }}>
                  {caseNumber || 'No case number'} {clientName !== 'Not set' ? `• ${clientName}` : ''}
                </Typography>
              </Box>
              <Chip
                label={statusLabel(caseRecord.status)}
                color={statusColor(caseRecord.status)}
                sx={{ alignSelf: { xs: 'flex-start', md: 'flex-start' }, borderRadius: 0.5, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}
              />
            </Stack>

            <Typography color="text.secondary" sx={{ fontSize: 17, lineHeight: 1.7, maxWidth: 760, mt: 3 }}>
              {caseRecord.description || 'No case description has been added yet.'}
            </Typography>

            <Divider sx={{ my: 4 }} />

            <Typography variant="subtitle1" color="primary.dark" fontWeight={800} sx={{ mb: 2 }}>
              Filing, court & police
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mb: 3 }}>
              <DetailField label="File No." value={fileNoV} />
              <DetailField label="File date" value={formatDate(fileDateV ?? undefined)} />
              <DetailField label="Court No." value={courtNoV} />
              <DetailField label="Court" value={courtNameV} />
              {/* <DetailField label="Opposite Party" value={oppositePartyV} /> */}
              <DetailField label="Police Station" value={policeStationV} />
              <DetailField label="Under Section" value={underSectionV} />
              <DetailField label="FIR No." value={firNoV} />
              <DetailField label="Next Hearing Date" value={formatDate(nextHearingV ?? undefined)} />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
              <DetailField
                label="Client Details"
                value={
                  <Box component="span">
                    {clientName}
                    <Typography component="span" display="block" color="text.secondary" fontWeight={500}>
                      {client?.email || 'No email'}
                    </Typography>
                    <Typography component="span" display="block" color="text.secondary" fontWeight={500}>
                      {client?.phone || 'No phone'}
                    </Typography>
                  </Box>
                }
              />
              <DetailField
                label="Case Information"
                value={
                  <Box component="span">
                    {caseNumber || 'No case number'}
                    <Typography component="span" display="block" color="text.secondary" fontWeight={500}>
                      Opened: {formatDate(openedDate)}
                    </Typography>
                    <Typography component="span" display="block" color="text.secondary" fontWeight={500}>
                      Closed: {formatDate(closedDate)}
                    </Typography>
                    <Typography component="span" display="block" color="text.secondary" fontWeight={500}>
                      Next hearing: {formatDate(nextHearingV ?? undefined)}
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </CaseCard>

          <CaseCard>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: 1.5 }}>
              Related Party
            </Typography>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Box sx={{ bgcolor: 'grey.50', p: 2 }}>
                <DetailField label="Client" value={clientName} />
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  {client?.company || 'Individual client'}
                </Typography>
                <DetailField label="Contact" value={client?.email || 'No email'} />
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  {client?.phone || 'No phone number'}
                </Typography>
                <DetailField label="Address" value={client?.address || 'No address'} />
              </Box>

              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: 1.5 }}>
                Opposite Party
              </Typography>

              <Box sx={{ bgcolor: 'grey.50', p: 2 }}>
                <DetailField label="Opposite Party" value={oppositePartyV} />
              </Box>
              {/* <Button
                onClick={handleOpenDrawer}
                variant="outlined"
                disabled={!canDeleteCase(user)}
                sx={{ borderColor: 'primary.dark', borderRadius: 0, color: 'primary.dark', fontWeight: 800, letterSpacing: 1.5, py: 1.25 }}
              >
                Edit Case Details
              </Button> */}
            </Stack>
          </CaseCard>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.4fr 1fr' }, gap: 2.5, alignItems: 'stretch' }}>
          <CaseCard sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
              <Typography variant="h4" color="primary.dark" fontWeight={800}>
                Hearing History
              </Typography>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <IconButton size="small" aria-label="Filter (coming soon)" disabled sx={{ color: 'text.disabled' }}>
                  <FilterOutlined />
                </IconButton>
                {canDeleteCase(user) && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PlusOutlined />}
                    onClick={handleOpenHearingDialog}
                    sx={{ borderRadius: 0, fontWeight: 800, flexShrink: 0 }}
                  >
                    Add hearing
                  </Button>
                )}
              </Stack>
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: 14 }}>
              Scheduled and past court dates for this case (newest first).
            </Typography>
            {hearingsError && !hearingDialogOpen ? (
              <Alert severity="error" sx={{ mt: 2 }}>
                {hearingsError}
              </Alert>
            ) : null}
            <TableContainer sx={{ mt: 2, maxHeight: 440, border: '1px solid', borderColor: 'grey.200' }}>
              {hearingsLoading ? (
                <Box sx={{ p: 2 }}>
                  <Typography color="text.secondary">Loading hearings…</Typography>
                </Box>
              ) : caseHearings.length === 0 ? (
                <Box sx={{ p: 2 }}>
                  <Typography color="text.secondary">No hearings recorded yet.</Typography>
                </Box>
              ) : (
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      {['Date', 'Hearing type', 'Judge', 'Outcome', 'Actions'].map((h) => (
                        <TableCell
                          key={h}
                          align={h === 'Actions' ? 'right' : 'left'}
                          sx={{
                            borderBottom: '1px solid',
                            borderColor: 'grey.200',
                            color: 'text.secondary',
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: 0.8,
                            py: 1.25,
                            textTransform: 'uppercase',
                            whiteSpace: 'nowrap',
                            ...(h === 'Hearing type' ? { minWidth: 160 } : {}),
                            ...(h === 'Outcome' ? { minWidth: 120 } : {}),
                            ...(h === 'Actions' ? { width: 1 } : {})
                          }}
                          {...(h === 'Actions' ? { 'aria-label': 'Actions' } : {})}
                        >
                          {h === 'Actions' ? null : h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {caseHearings.map((item, index) => {
                      const when = item.hearingDate ?? item.hearing_date;
                      const purpose = item.purposeOfHearing ?? item.purpose_of_hearing ?? '—';
                      const judge = item.judgeName ?? item.judge_name ?? '—';
                      const resultText = (item.result ?? '').trim();
                      const statusStr = String(item.status ?? '');
                      const statusLabel = statusStr.replace(/_/g, ' ');
                      return (
                        <TableRow key={getHearingInternalId(item) || String(index)} hover sx={{ '&:last-of-type td': { borderBottom: 0 } }}>
                          <TableCell sx={{ verticalAlign: 'top', borderColor: 'grey.100', color: 'text.primary', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {formatHearingDateOnly(when)}
                          </TableCell>
                          <TableCell sx={{ verticalAlign: 'top', borderColor: 'grey.100' }}>
                            <Typography color="primary.dark" fontWeight={800} sx={{ fontSize: 15 }}>
                              {purpose}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ verticalAlign: 'top', borderColor: 'grey.100', color: 'text.secondary', fontWeight: 600 }}>
                            {judge || '—'}
                          </TableCell>
                          <TableCell sx={{ verticalAlign: 'top', borderColor: 'grey.100' }}>
                            <Stack spacing={0.5} alignItems="flex-start">
                              {resultText ? (
                                <Chip
                                  label={resultText.length > 40 ? `${resultText.slice(0, 40)}…` : resultText}
                                  size="small"
                                  sx={{ fontWeight: 700, borderRadius: 1, bgcolor: 'grey.100', color: 'text.primary' }}
                                />
                              ) : (
                                <Chip
                                  label={statusLabel}
                                  size="small"
                                  color={hearingStatusChipColor(statusStr)}
                                  variant={statusStr === HearingStatus.SCHEDULED ? 'filled' : 'outlined'}
                                  sx={{ fontWeight: 800, textTransform: 'uppercase' }}
                                />
                              )}
                              {resultText ? (
                                <Chip
                                  label={statusLabel}
                                  size="small"
                                  color={hearingStatusChipColor(statusStr)}
                                  variant="outlined"
                                  sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                                />
                              ) : null}
                            </Stack>
                          </TableCell>
                          <TableCell align="right" sx={{ verticalAlign: 'top', borderColor: 'grey.100', whiteSpace: 'nowrap', width: 1 }}>
                            {canDeleteCase(user) ? (
                              <Stack direction="row" spacing={0} justifyContent="flex-end">
                                <IconButton aria-label="Edit hearing" size="small" onClick={() => handleEditHearing(item)}>
                                  <EditOutlined />
                                </IconButton>
                                <IconButton aria-label="Delete hearing" size="small" color="error" onClick={() => handleDeleteHearing(item)}>
                                  <DeleteOutlined />
                                </IconButton>
                              </Stack>
                            ) : (
                              <Typography variant="caption" color="text.disabled">
                                —
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </TableContainer>
          </CaseCard>

          {/* <CaseCard sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, maxHeight: { lg: 560 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
              <Typography variant="h4" color="primary.dark" fontWeight={800}>
                Recent Activity
              </Typography>
              {canDeleteCase(user) && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PlusOutlined />}
                  onClick={handleOpenActivityDialog}
                  sx={{ borderRadius: 0, fontWeight: 800, flexShrink: 0 }}
                >
                  Log activity
                </Button>
              )}
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: 14 }}>
              Filings, correspondence, and notes (newest first).
            </Typography>
            {activitiesError ? (
              <Alert severity="error" sx={{ mt: 2 }}>
                {activitiesError}
              </Alert>
            ) : null}
            <Box sx={{ flex: 1, minHeight: 0, mt: 2, overflow: 'auto', position: 'relative', pl: 2.5 }}>
              {activitiesLoading ? (
                <Typography color="text.secondary">Loading activity…</Typography>
              ) : caseActivities.length === 0 ? (
                <Typography color="text.secondary">No activities logged yet.</Typography>
              ) : (
                <Box
                  component="ul"
                  sx={{
                    listStyle: 'none',
                    m: 0,
                    p: 0,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 11,
                      top: 8,
                      bottom: 8,
                      width: 2,
                      bgcolor: 'primary.light',
                      borderRadius: 1
                    }
                  }}
                >
                  {caseActivities.map((item, index) => {
                    const title = item.activityTitle ?? item.activity_title ?? 'Activity';
                    const when = item.activityDate ?? item.activity_date;
                    const desc = item.activityDescription ?? item.activity_description ?? '';
                    return (
                      <Box
                        component="li"
                        key={getActivityInternalId(item) || String(index)}
                        sx={{ display: 'flex', gap: 2, pb: 3, position: 'relative', pl: 0.5 }}
                      >
                        <Box
                          sx={{
                            alignItems: 'center',
                            bgcolor: 'background.paper',
                            border: '2px solid',
                            borderColor: 'primary.light',
                            borderRadius: '50%',
                            color: 'primary.dark',
                            display: 'flex',
                            flexShrink: 0,
                            height: 36,
                            justifyContent: 'center',
                            width: 36,
                            zIndex: 1
                          }}
                        >
                          {pickActivityTimelineIcon(title)}
                        </Box>
                        <Box sx={{ minWidth: 0, pt: 0.25 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: 0.6 }}>
                            {formatActivityTimelineWhen(when)}
                          </Typography>
                          <Typography color="primary.dark" fontWeight={800} sx={{ fontSize: 15, mt: 0.25, display: 'block' }}>
                            {title}
                          </Typography>
                          {desc ? (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.45 }}>
                              {desc}
                            </Typography>
                          ) : null}
                          {canDeleteCase(user) ? (
                            <Stack direction="row" spacing={0} sx={{ mt: 1 }}>
                              <Button size="small" onClick={() => handleEditActivity(item)} sx={{ minWidth: 0, fontWeight: 700 }}>
                                Edit
                              </Button>
                              <Button size="small" color="error" onClick={() => handleDeleteActivity(item)} sx={{ minWidth: 0, fontWeight: 700 }}>
                                Delete
                              </Button>
                            </Stack>
                          ) : null}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          </CaseCard> */}

          <CaseCard sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, maxHeight: { lg: 560 } }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'flex-start' }} spacing={2}>
              <Box>
                <Typography variant="h4" color="primary.dark" fontWeight={800}>
                  Assigned Legal Team
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Only assigned users can see this case, except account admins.
                </Typography>
              </Box>
              {canManageAssignments(user) && (
                <Button
                  onClick={handleOpenAssignmentDrawer}
                  variant="outlined"
                  startIcon={<UserAddOutlined />}
                  sx={{ borderColor: 'grey.300', borderRadius: 0, color: 'primary.dark', fontWeight: 800, letterSpacing: 1.25, textTransform: 'uppercase', flexShrink: 0 }}
                >
                  Assign Member
                </Button>
              )}
            </Stack>

            <Divider sx={{ my: 2.5 }} />
            {assignmentError && <Alert severity="error" sx={{ mb: 2 }}>{assignmentError}</Alert>}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {assignmentsLoading ? (
                <Typography color="text.secondary">Loading assignments...</Typography>
              ) : assignedUsers.length === 0 ? (
                <Alert severity="info">No users are assigned to this case yet.</Alert>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr' }, gap: 2 }}>
                  {assignedUsers.map((assignedUser) => (
                    <Paper
                      key={assignedUser.id}
                      variant="outlined"
                      sx={{ alignItems: 'center', borderColor: 'grey.100', borderRadius: 0, display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: 1.5, p: 2 }}
                    >
                      <Box sx={{ alignItems: 'center', bgcolor: 'primary.lighter', borderRadius: 2, color: 'primary.dark', display: 'flex', fontWeight: 900, height: 44, justifyContent: 'center', width: 44 }}>
                        {getUserInitials(assignedUser)}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography color="primary.dark" fontWeight={800} noWrap>
                          {getUserName(assignedUser)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: 0.75 }}>
                          {getUserRoleLabel(assignedUser)}
                        </Typography>
                      </Box>
                      {canManageAssignments(user) && (
                        <IconButton
                          aria-label={`Remove ${getUserName(assignedUser)} from case`}
                          color="error"
                          disabled={savingAssignments}
                          onClick={() => handleRemoveAssignedUser(assignedUser.id)}
                        >
                          <DeleteOutlined />
                        </IconButton>
                      )}
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          </CaseCard>
        </Box>

        <CaseCard>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'flex-start' }} spacing={2}>
            <Box>
              <Typography variant="h4" color="primary.dark" fontWeight={800}>
                Tasks for this case
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Tasks linked to this case file. Open the task workspace to create or edit tasks.
              </Typography>
            </Box>
            <Button
              component={Link}
              to="/task"
              variant="outlined"
              size="small"
              sx={{ flexShrink: 0, alignSelf: { xs: 'flex-start', sm: 'center' }, fontWeight: 700 }}
            >
              All tasks
            </Button>
          </Stack>
          {caseTasksError ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {caseTasksError}
            </Alert>
          ) : null}
          <TableContainer sx={{ mt: 2, border: '1px solid', borderColor: 'grey.200' }}>
            {caseTasksLoading ? (
              <Box sx={{ p: 2 }}>
                <Typography color="text.secondary">Loading tasks…</Typography>
              </Box>
            ) : caseTasks.length === 0 ? (
              <Box sx={{ p: 2 }}>
                <Typography color="text.secondary">No tasks are linked to this case yet.</Typography>
              </Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    {['Task', 'Code', 'Type', 'Status', 'Priority', 'Due', 'Assignees'].map((h) => (
                      <TableCell
                        key={h}
                        sx={{
                          borderBottom: '1px solid',
                          borderColor: 'grey.200',
                          color: 'text.secondary',
                          fontSize: 11,
                          fontWeight: 800,
                          letterSpacing: 0.8,
                          py: 1.25,
                          ...(h === 'Task' ? { minWidth: 160 } : {}),
                          ...(h === 'Assignees' ? { minWidth: 120 } : {})
                        }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {caseTasks.map((task) => {
                    const due = task.dueDate ?? task.due_date;
                    const assigneeStr =
                      (task.assignees ?? [])
                        .map((a) => a.fullName ?? a.full_name)
                        .filter(Boolean)
                        .join(', ') ||
                      task.assigneeName ||
                      task.assignee_name ||
                      (task.unassigned ? 'Unassigned' : '—');
                    const statusStr = String(task.status ?? '');
                    const priStr = String(task.priority ?? '');
                    return (
                      <TableRow key={task.id} hover sx={{ '&:last-of-type td': { borderBottom: 0 } }}>
                        <TableCell sx={{ borderColor: 'grey.100', verticalAlign: 'middle' }}>
                          <Typography color="primary.dark" fontWeight={800}>
                            {task.name}
                          </Typography>
                          {task.description ? (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                              {task.description.length > 80 ? `${task.description.slice(0, 80)}…` : task.description}
                            </Typography>
                          ) : null}
                        </TableCell>
                        <TableCell sx={{ borderColor: 'grey.100', color: 'text.secondary', verticalAlign: 'middle', fontWeight: 600 }}>
                          {task.code}
                        </TableCell>
                        <TableCell sx={{ borderColor: 'grey.100', color: 'text.secondary', verticalAlign: 'middle' }}>
                          {task.taskType ?? task.task_type ?? '—'}
                        </TableCell>
                        <TableCell sx={{ borderColor: 'grey.100', verticalAlign: 'middle' }}>
                          <Chip label={statusStr.replace(/_/g, ' ')} size="small" variant="outlined" sx={{ fontWeight: 700, textTransform: 'capitalize' }} />
                        </TableCell>
                        <TableCell sx={{ borderColor: 'grey.100', verticalAlign: 'middle' }}>
                          <Chip label={priStr.replace(/_/g, ' ')} size="small" variant="outlined" color="primary" sx={{ fontWeight: 700 }} />
                        </TableCell>
                        <TableCell sx={{ borderColor: 'grey.100', color: 'text.secondary', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          {due ? formatDate(due) : '—'}
                        </TableCell>
                        <TableCell sx={{ borderColor: 'grey.100', color: 'text.secondary', verticalAlign: 'middle', fontSize: 13 }}>
                          {assigneeStr}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        </CaseCard>

        <CaseCard sx={{ p: 0 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2} sx={{ p: 3 }}>
            <Typography variant="h4" color="primary.dark" fontWeight={800}>
              Document Management
            </Typography>
            <Button
              variant="text"
              startIcon={<DownloadOutlined />}
              disabled={documents.length === 0}
              onClick={() => documents.forEach((document) => handleDownloadDocument(document))}
              sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, color: 'primary.dark', fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase' }}
            >
              Export All
            </Button>
          </Stack>
          <Divider />

          <Stack spacing={3} sx={{ p: 3 }}>
            {documentError && <Alert severity="error">{documentError}</Alert>}

            {canUploadDocument(user) && (
              <Box
                component="label"
                onDragOver={(event) => {
                  event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  handleFilesUpload(event.dataTransfer.files);
                }}
                sx={{
                  alignItems: 'center',
                  bgcolor: 'grey.50',
                  border: '1px dashed',
                  borderColor: 'grey.300',
                  cursor: uploading ? 'default' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  justifyContent: 'center',
                  minHeight: 180,
                  opacity: uploading ? 0.7 : 1,
                  textAlign: 'center'
                }}
              >
                <input
                  hidden
                  multiple
                  type="file"
                  disabled={uploading}
                  onChange={(event) => {
                    if (event.target.files) {
                      handleFilesUpload(event.target.files);
                    }
                    event.target.value = '';
                  }}
                />
                <Box sx={{ alignItems: 'center', bgcolor: 'background.paper', borderRadius: 2, color: 'primary.dark', display: 'flex', fontSize: 32, height: 56, justifyContent: 'center', width: 56 }}>
                  <CloudUploadOutlined />
                </Box>
                <Typography color="primary.dark" fontWeight={800} sx={{ fontSize: 17 }}>
                  {uploading ? 'Uploading files...' : 'Drag files to upload'}
                </Typography>
                <Typography color="text.secondary">PDF, images, Office files, archives, and other file types up to the backend size limit</Typography>
              </Box>
            )}

            {documentsLoading ? (
              <Typography color="text.secondary">Loading documents...</Typography>
            ) : documents.length === 0 ? (
              <Alert severity="info">No documents have been uploaded for this case yet.</Alert>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }, gap: 2 }}>
                {documents.map((document) => (
                  <Paper
                    key={document.id}
                    variant="outlined"
                    sx={{
                      alignItems: 'center',
                      borderColor: 'grey.100',
                      borderRadius: 0,
                      cursor: 'pointer',
                      display: 'grid',
                      gridTemplateColumns: '48px 1fr auto',
                      gap: 1.5,
                      p: 2,
                      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                      '&:hover': { borderColor: 'primary.light', boxShadow: '0 1px 6px rgba(15, 23, 42, 0.08)' }
                    }}
                    onClick={() => handleOpenDocument(document)}
                  >
                    <Box sx={{ alignItems: 'center', bgcolor: isImageDocument(document) ? 'warning.lighter' : isPdfDocument(document) ? 'error.lighter' : 'primary.lighter', color: isImageDocument(document) ? 'warning.dark' : isPdfDocument(document) ? 'error.dark' : 'primary.dark', display: 'flex', fontSize: 24, height: 44, justifyContent: 'center', width: 44 }}>
                      <DocumentIcon document={document} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography color="primary.dark" fontWeight={800} noWrap>
                        {getDocumentName(document)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                        Added {formatDate(getDocumentCreatedAt(document))} • {formatFileSize(getDocumentSize(document))}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton
                        aria-label={`Download ${getDocumentName(document)}`}
                        size="small"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDownloadDocument(document);
                        }}
                      >
                        <DownloadOutlined />
                      </IconButton>
                      {canDeleteCase(user) && (
                        <IconButton
                          aria-label={`Delete ${getDocumentName(document)}`}
                          color="error"
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteDocument(document);
                          }}
                        >
                          <DeleteOutlined />
                        </IconButton>
                      )}
                    </Stack>
                  </Paper>
                ))}
              </Box>
            )}
          </Stack>
        </CaseCard>
      </Stack>

      <Dialog open={hearingDialogOpen} onClose={handleCloseHearingDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingHearingInternalId ? 'Edit hearing' : 'Schedule hearing'}</DialogTitle>
        <Box component="form" onSubmit={handleSaveHearing}>
          <DialogContent dividers>
            <Stack spacing={2}>
              {hearingsError && hearingDialogOpen ? <Alert severity="error">{hearingsError}</Alert> : null}
              <TextField
                label="Hearing date"
                type="datetime-local"
                value={hearingForm.hearingDate}
                onChange={(e) => setHearingForm((f) => ({ ...f, hearingDate: e.target.value }))}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Purpose / type of hearing"
                value={hearingForm.purposeOfHearing}
                onChange={(e) => setHearingForm((f) => ({ ...f, purposeOfHearing: e.target.value }))}
                required
                fullWidth
                placeholder="e.g. Bail hearing, Evidence hearing"
              />
              <TextField
                label="Judge (optional)"
                value={hearingForm.judgeName}
                onChange={(e) => setHearingForm((f) => ({ ...f, judgeName: e.target.value }))}
                fullWidth
                inputProps={{ maxLength: 255 }}
              />
              <TextField
                label="Result / notes (optional)"
                value={hearingForm.result}
                onChange={(e) => setHearingForm((f) => ({ ...f, result: e.target.value }))}
                fullWidth
                multiline
                minRows={2}
              />
              <FormControl fullWidth>
                <InputLabel id="hearing-status-label">Status</InputLabel>
                <Select
                  labelId="hearing-status-label"
                  label="Status"
                  value={hearingForm.status}
                  onChange={(e) => setHearingForm((f) => ({ ...f, status: String(e.target.value) }))}
                >
                  {[HearingStatus.SCHEDULED, HearingStatus.COMPLETED, HearingStatus.ADJOURNED, HearingStatus.CANCELLED].map((s) => (
                    <MenuItem key={s} value={s}>
                      {s.replace(/_/g, ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="hearing-assignees-label">Assignees (optional)</InputLabel>
                <Select
                  multiple
                  labelId="hearing-assignees-label"
                  label="Assignees (optional)"
                  value={hearingForm.assigneeInternalIds}
                  onChange={(event) => {
                    const value = event.target.value;
                    setHearingForm((f) => ({
                      ...f,
                      assigneeInternalIds: typeof value === 'string' ? value.split(',') : [...value]
                    }));
                  }}
                  renderValue={(selected) =>
                    accountUsers
                      .filter((u) => selected.includes(u.id))
                      .map((u) => getUserName(u))
                      .join(', ')
                  }
                >
                  {accountUsers.map((accountUser) => (
                    <MenuItem key={accountUser.id} value={accountUser.id}>
                      {getUserName(accountUser)}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>Team members responsible for this hearing date.</FormHelperText>
              </FormControl>
            </Stack>
          </DialogContent>
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ p: 2 }}>
            <Button onClick={handleCloseHearingDialog} variant="outlined" disabled={hearingSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={hearingSaving}>
              {hearingSaving ? 'Saving…' : editingHearingInternalId ? 'Save changes' : 'Add hearing'}
            </Button>
          </Stack>
        </Box>
      </Dialog>

      <Dialog open={activityDialogOpen} onClose={handleCloseActivityDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingActivityInternalId ? 'Edit case activity' : 'Log case activity'}</DialogTitle>
        <Box component="form" onSubmit={handleSaveActivity}>
          <DialogContent dividers>
            <Stack spacing={2}>
              {activitiesError && activityDialogOpen ? <Alert severity="error">{activitiesError}</Alert> : null}
              <TextField
                label="Activity title"
                value={activityForm.activityTitle}
                onChange={(e) => setActivityForm((f) => ({ ...f, activityTitle: e.target.value }))}
                required
                fullWidth
                inputProps={{ maxLength: 500 }}
              />
              <TextField
                label="Activity type (optional)"
                value={activityForm.activityType}
                onChange={(e) => setActivityForm((f) => ({ ...f, activityType: e.target.value }))}
                fullWidth
                placeholder="e.g. Court Hearing, Notice sent"
                inputProps={{ maxLength: 120 }}
              />
              <TextField
                label="Activity date"
                type="datetime-local"
                value={activityForm.activityDate}
                onChange={(e) => setActivityForm((f) => ({ ...f, activityDate: e.target.value }))}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Description (optional)"
                value={activityForm.activityDescription}
                onChange={(e) => setActivityForm((f) => ({ ...f, activityDescription: e.target.value }))}
                fullWidth
                multiline
                minRows={3}
              />
              <FormControl fullWidth>
                <InputLabel id="activity-assignees-label">Assignees (optional)</InputLabel>
                <Select
                  multiple
                  labelId="activity-assignees-label"
                  label="Assignees (optional)"
                  value={activityForm.assigneeInternalIds}
                  onChange={(event) => {
                    const value = event.target.value;
                    setActivityForm((f) => ({
                      ...f,
                      assigneeInternalIds: typeof value === 'string' ? value.split(',') : [...value]
                    }));
                  }}
                  renderValue={(selected) =>
                    accountUsers
                      .filter((u) => selected.includes(u.id))
                      .map((u) => getUserName(u))
                      .join(', ')
                  }
                >
                  {accountUsers.map((accountUser) => (
                    <MenuItem key={accountUser.id} value={accountUser.id}>
                      {getUserName(accountUser)}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>Users linked to this activity (same firm rules apply).</FormHelperText>
              </FormControl>
            </Stack>
          </DialogContent>
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ p: 2 }}>
            <Button onClick={handleCloseActivityDialog} variant="outlined" disabled={activitySaving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={activitySaving}>
              {activitySaving ? 'Saving…' : editingActivityInternalId ? 'Save changes' : 'Add activity'}
            </Button>
          </Stack>
        </Box>
      </Dialog>

      <Dialog open={viewerOpen} onClose={handleCloseViewer} fullWidth maxWidth="lg">
        <DialogTitle sx={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Typography color="primary.dark" fontWeight={800} noWrap>
            {viewerDocument ? getDocumentName(viewerDocument) : 'Document preview'}
          </Typography>
          <IconButton aria-label="Close document viewer" onClick={handleCloseViewer}>
            <CloseOutlined />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: 'grey.50', minHeight: { xs: 360, md: 640 }, p: 0 }}>
          {viewerDocument && isImageDocument(viewerDocument) && (
            <Box component="img" src={viewerUrl} alt={getDocumentName(viewerDocument)} sx={{ display: 'block', maxHeight: '75vh', maxWidth: '100%', mx: 'auto', objectFit: 'contain', p: 2 }} />
          )}
          {viewerDocument && isPdfDocument(viewerDocument) && (
            <Box component="iframe" src={viewerUrl} title={getDocumentName(viewerDocument)} sx={{ border: 0, height: '75vh', width: '100%' }} />
          )}
        </DialogContent>
      </Dialog>

      <Drawer
        anchor="right"
        open={assignmentDrawerOpen}
        onClose={handleCloseAssignmentDrawer}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 420 },
            borderTopLeftRadius: { xs: 0, sm: 16 },
            borderBottomLeftRadius: { xs: 0, sm: 16 },
            boxShadow: 24
          }
        }}
      >
        <Box component="form" onSubmit={handleSaveAssignments} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
            <Typography variant="h4">Assign legal team</Typography>
            <IconButton aria-label="Close assignment drawer" onClick={handleCloseAssignmentDrawer} disabled={savingAssignments}>
              <CloseOutlined />
            </IconButton>
          </Stack>
          <Divider />

          <Stack spacing={2} sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
            {assignmentError && <Alert severity="error">{assignmentError}</Alert>}
            <FormControl fullWidth>
              <InputLabel id="case-assignment-users-label">Account users</InputLabel>
              <Select
                multiple
                labelId="case-assignment-users-label"
                label="Account users"
                value={assignmentForm}
                onChange={(event) => {
                  const value = event.target.value;
                  setAssignmentForm(typeof value === 'string' ? value.split(',') : value);
                }}
                renderValue={(selected) =>
                  accountUsers
                    .filter((accountUser) => selected.includes(accountUser.id))
                    .map((accountUser) => getUserName(accountUser))
                    .join(', ')
                }
              >
                {accountUsers.map((accountUser) => (
                  <MenuItem key={accountUser.id} value={accountUser.id}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ alignItems: 'center', bgcolor: 'primary.lighter', borderRadius: 1.5, color: 'primary.dark', display: 'flex', fontWeight: 900, height: 32, justifyContent: 'center', width: 32 }}>
                        {getUserInitials(accountUser)}
                      </Box>
                      <Box>
                        <Typography fontWeight={700}>{getUserName(accountUser)}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {getUserRoleLabel(accountUser)}
                        </Typography>
                      </Box>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Select one or more users who should see and work on this case.</FormHelperText>
            </FormControl>
          </Stack>

          <Divider />
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ p: 2 }}>
            <Button onClick={handleCloseAssignmentDrawer} variant="outlined" disabled={savingAssignments}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={savingAssignments} sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}>
              {savingAssignments ? 'Saving...' : 'Save assignments'}
            </Button>
          </Stack>
        </Box>
      </Drawer>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 520 },
            borderTopLeftRadius: { xs: 0, sm: 16 },
            borderBottomLeftRadius: { xs: 0, sm: 16 },
            boxShadow: 24
          }
        }}
        ModalProps={{ keepMounted: true }}
      >
        <Box component="form" onSubmit={handleSubmit} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
            <Typography variant="h4">Edit case</Typography>
            <IconButton aria-label="Close edit case drawer" onClick={handleCloseDrawer} disabled={saving}>
              <CloseOutlined />
            </IconButton>
          </Stack>
          <Divider />

          <Stack spacing={2} sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              label="Case title"
              value={caseForm.title}
              onChange={(event) => handleCaseFormChange('title', event.target.value)}
              required
              fullWidth
              inputProps={{ maxLength: 255 }}
            />

            <TextField
              label="Case number"
              value={caseForm.caseNumber}
              onChange={(event) => handleCaseFormChange('caseNumber', event.target.value)}
              required
              fullWidth
              inputProps={{ maxLength: 100 }}
            />

            <FormControl fullWidth required error={!caseForm.clientInternalId && Boolean(formError)}>
              <InputLabel id="edit-case-client-label">Client</InputLabel>
              <Select
                labelId="edit-case-client-label"
                label="Client"
                value={caseForm.clientInternalId}
                onChange={(event) => handleCaseFormChange('clientInternalId', event.target.value)}
                disabled={clientsLoading}
              >
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {getClientName(client)}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {clientsLoading ? 'Loading clients...' : clients.length === 0 ? 'Create or assign a client before editing this case.' : 'Select the client this case belongs to.'}
              </FormHelperText>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="edit-case-status-label">Status</InputLabel>
              <Select
                labelId="edit-case-status-label"
                label="Status"
                value={caseForm.status}
                onChange={(event) => handleCaseFormChange('status', event.target.value as CaseStatus)}
              >
                <MenuItem value={CaseStatus.OPEN}>Open</MenuItem>
                <MenuItem value={CaseStatus.IN_PROGRESS}>In Progress</MenuItem>
                <MenuItem value={CaseStatus.CLOSED}>Closed</MenuItem>
                <MenuItem value={CaseStatus.ON_HOLD}>On Hold</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Description"
              value={caseForm.description}
              onChange={(event) => handleCaseFormChange('description', event.target.value)}
              fullWidth
              multiline
              minRows={4}
            />

            <Divider textAlign="left">Court & filing</Divider>

            <TextField
              label="File No."
              value={caseForm.fileNo}
              onChange={(event) => handleCaseFormChange('fileNo', event.target.value)}
              fullWidth
              inputProps={{ maxLength: 100 }}
            />
            <TextField
              label="File date"
              type="datetime-local"
              value={caseForm.fileDate}
              onChange={(event) => handleCaseFormChange('fileDate', event.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Court No."
              value={caseForm.courtNo}
              onChange={(event) => handleCaseFormChange('courtNo', event.target.value)}
              fullWidth
              inputProps={{ maxLength: 100 }}
            />
            <TextField
              label="Court"
              value={caseForm.courtName}
              onChange={(event) => handleCaseFormChange('courtName', event.target.value)}
              fullWidth
              inputProps={{ maxLength: 255 }}
            />
            <TextField
              label="Opposite Party"
              value={caseForm.oppositeParty}
              onChange={(event) => handleCaseFormChange('oppositeParty', event.target.value)}
              fullWidth
              inputProps={{ maxLength: 500 }}
            />
            <TextField
              label="Police Station"
              value={caseForm.policeStation}
              onChange={(event) => handleCaseFormChange('policeStation', event.target.value)}
              fullWidth
              inputProps={{ maxLength: 255 }}
            />
            <TextField
              label="Under Section"
              value={caseForm.underSection}
              onChange={(event) => handleCaseFormChange('underSection', event.target.value)}
              fullWidth
              inputProps={{ maxLength: 255 }}
            />
            <TextField
              label="FIR No."
              value={caseForm.firNo}
              onChange={(event) => handleCaseFormChange('firNo', event.target.value)}
              fullWidth
              inputProps={{ maxLength: 100 }}
            />
            <TextField
              label="Next Hearing Date"
              type="datetime-local"
              value={caseForm.nextHearingDate}
              onChange={(event) => handleCaseFormChange('nextHearingDate', event.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          <Divider />
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ p: 2 }}>
            <Button onClick={handleCloseDrawer} variant="outlined" disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving || clientsLoading || !caseForm.clientInternalId} sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}>
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </MainCard>
  );
};

export default CaseDetail;
