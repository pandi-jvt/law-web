/**
 * TypeScript type definitions for the Case Management application.
 * Aligned with backend: multi-tenant, assignments, no assigned_lawyer_id on Case.
 */

export enum UserRole {
  ADMIN = "admin",
  GROUP_ADMIN = "GROUP_ADMIN",
  LAWYER = "lawyer",
  PARALEGAL = "paralegal",
  CLIENT = "client",
}

export enum AccountType {
  INDIVIDUAL = "individual",
  GROUP = "group",
}

export enum GroupRole {
  GROUP_ADMIN = "group_admin",
  LAWYER = "lawyer",
  JUNIOR = "junior",
  CLERK = "clerk",
}

export enum CaseStatus {
  OPEN = "open",
  IN_PROGRESS = "in_progress",
  CLOSED = "closed",
  ON_HOLD = "on_hold",
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum TaskStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  ON_HOLD = "ON_HOLD",
  COMPLETED = "COMPLETED",
}

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  fullName?: string;
  role: UserRole;
  is_active: string;
  isActive?: string;
  created_at: string;
  createdAt?: string;
  phone_number?: string;
  phoneNumber?: string;
  is_verified?: boolean;
  isVerified?: boolean;
  account_type?: AccountType;
  accountType?: AccountType;
  account_id?: string;
  accountId?: string;
  group_id?: number;
  groupId?: number;
  law_firm_id?: number;
  law_firm_internal_id?: string;
  lawFirmInternalId?: string;
  group_role?: GroupRole;
  groupRole?: GroupRole;
  last_login_at?: string;
  lastLoginAt?: string;
}

export interface LawFirm {
  id: string;
  name: string;
  created_by: number;
  created_by_internal_id?: string;
  createdByInternalId?: string;
  created_at: string;
  createdAt?: string;
}

export interface Client {
  id: string;
  first_name: string;
  firstName?: string;
  last_name: string;
  lastName?: string;
  email: string;
  phone?: string;
  address?: string;
  company?: string;
  notes?: string;
  created_by: number;
  created_by_internal_id?: string;
  createdByInternalId?: string;
  law_firm_id?: number;
  law_firm_internal_id?: string;
  lawFirmInternalId?: string;
  created_at: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface Case {
  id: string;
  title: string;
  description?: string;
  status: CaseStatus;
  case_number: string;
  caseNumber?: string;
  client_id: number;
  client_internal_id?: string;
  clientInternalId?: string;
  created_by?: number;
  created_by_internal_id?: string;
  createdByInternalId?: string;
  law_firm_id?: number;
  law_firm_internal_id?: string;
  lawFirmInternalId?: string;
  opened_date: string;
  openedDate?: string;
  closed_date?: string;
  closedDate?: string;
  file_no?: string | null;
  fileNo?: string | null;
  file_date?: string | null;
  fileDate?: string | null;
  court_no?: string | null;
  courtNo?: string | null;
  court_name?: string | null;
  courtName?: string | null;
  opposite_party?: string | null;
  oppositeParty?: string | null;
  police_station?: string | null;
  policeStation?: string | null;
  under_section?: string | null;
  underSection?: string | null;
  fir_no?: string | null;
  firNo?: string | null;
  next_hearing_date?: string | null;
  nextHearingDate?: string | null;
  created_at: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  client?: Client;
}

export interface Document {
  id: string;
  filename: string;
  original_filename: string;
  originalFilename?: string;
  file_path: string;
  filePath?: string;
  file_size: number;
  fileSize?: number;
  file_type: string;
  fileType?: string;
  case_id: number;
  case_internal_id?: string;
  caseInternalId?: string;
  uploaded_by: number;
  uploaded_by_internal_id?: string;
  uploadedByInternalId?: string;
  description?: string;
  created_at: string;
  createdAt?: string;
  case?: Case;
  uploaded_by_user?: User;
}

export interface TaskAssigneeRef {
  id: string;
  full_name?: string;
  fullName?: string;
}

export interface Task {
  id: string;
  name: string;
  code: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string;
  dueDate?: string;
  task_type: string;
  taskType?: string;
  case_internal_id?: string | null;
  caseInternalId?: string | null;
  case_title?: string | null;
  caseTitle?: string | null;
  case_number?: string | null;
  caseNumber?: string | null;
  /** True when there are no assignees. */
  unassigned?: boolean;
  assignees?: TaskAssigneeRef[];
  /** Legacy single assignee (mirrors first assignee when present). */
  assignee_internal_id?: string | null;
  assigneeInternalId?: string | null;
  assignee_name?: string | null;
  assigneeName?: string | null;
  created_by_internal_id?: string;
  createdByInternalId?: string;
  created_by_name?: string;
  createdByName?: string;
  created_at: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

/** Spring Data Page JSON (snake_case from API). */
export interface PageResult<T> {
  content: T[];
  total_elements?: number;
  totalElements?: number;
  total_pages?: number;
  totalPages?: number;
  number: number;
  size: number;
}

export interface CaseActivityAssigneeRef {
  internal_id?: string;
  internalId?: string;
  full_name?: string;
  fullName?: string;
}

export interface CaseActivity {
  id?: string;
  internal_id?: string;
  internalId?: string;
  activity_title?: string;
  activityTitle?: string;
  activity_description?: string | null;
  activityDescription?: string | null;
  activity_date?: string;
  activityDate?: string;
  activity_type?: string | null;
  activityType?: string | null;
  case_internal_id?: string;
  caseInternalId?: string;
  case_title?: string | null;
  caseTitle?: string | null;
  case_number?: string | null;
  caseNumber?: string | null;
  assignees?: CaseActivityAssigneeRef[];
  created_by_internal_id?: string;
  createdByInternalId?: string;
  created_by_name?: string;
  createdByName?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string | null;
  updatedAt?: string | null;
}

export type TaskPageResult = PageResult<Task>;
export type CasePageResult = PageResult<Case>;
export type CaseActivityPageResult = PageResult<CaseActivity>;
export type ClientPageResult = PageResult<Client>;
export type UserPageResult = PageResult<User>;

export enum HearingStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  ADJOURNED = 'ADJOURNED',
  CANCELLED = 'CANCELLED',
}

export interface HearingAssigneeRef {
  internal_id?: string;
  internalId?: string;
  full_name?: string;
  fullName?: string;
}

export interface Hearing {
  internal_id?: string;
  internalId?: string;
  hearing_date?: string;
  hearingDate?: string;
  purpose_of_hearing?: string;
  purposeOfHearing?: string;
  judge_name?: string | null;
  judgeName?: string | null;
  result?: string | null;
  status?: HearingStatus | string;
  case_internal_id?: string;
  caseInternalId?: string;
  case_title?: string | null;
  caseTitle?: string | null;
  case_number?: string | null;
  caseNumber?: string | null;
  assignees?: HearingAssigneeRef[];
  created_by_internal_id?: string;
  createdByInternalId?: string;
  created_by_name?: string;
  createdByName?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string | null;
  updatedAt?: string | null;
}

export type HearingPageResult = PageResult<Hearing>;

/** Dashboard analytics (snake_case from API; camelCase optional for resilience). */
export interface DashboardMetricDto {
  total: number;
  change_percent_30d?: number | null;
  changePercent30d?: number | null;
  delta_30d?: number;
  delta30d?: number;
  trend: string;
}

export interface DashboardAnalyticsResponse {
  cases: DashboardMetricDto;
  clients: DashboardMetricDto;
  tasks: DashboardMetricDto;
  hearings: DashboardMetricDto;
  as_of?: string | null;
  asOf?: string | null;
  latest_bucket_date?: string | null;
  latestBucketDate?: string | null;
}

export interface DashboardUpcomingResponse {
  tasks: Task[];
  hearings: Hearing[];
  generated_at?: string;
  generatedAt?: string;
  days_ahead?: number;
  daysAhead?: number;
}

export interface DashboardTimeseriesResponse {
  labels: string[];
  case_counts?: number[];
  caseCounts?: number[];
  client_counts?: number[];
  clientCounts?: number[];
  year?: number | null;
  week_start?: string | null;
  weekStart?: string | null;
}

export interface DashboardRecentItem {
  entity_type?: string;
  entityType?: string;
  internal_id?: string;
  internalId?: string;
  name?: string;
  detail?: string;
  last_modified_at?: string;
  lastModifiedAt?: string;
  actor_name?: string;
  actorName?: string;
}

export interface DashboardRecentActivityResponse {
  latest_case?: DashboardRecentItem | null;
  latestCase?: DashboardRecentItem | null;
  latest_client?: DashboardRecentItem | null;
  latestClient?: DashboardRecentItem | null;
  latest_task?: DashboardRecentItem | null;
  latestTask?: DashboardRecentItem | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  account_name: string;
  account_type: AccountType;
  group_name?: string;
  email: string;
  username: string;
  full_name: string;
  password: string;
  phone_number?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
