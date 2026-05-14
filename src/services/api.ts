/**
 * Centralized API service layer using Axios.
 * Handles authentication, request/response interceptors, and API calls.
 */
import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  User,
  Client,
  Case,
  Document,
  Task,
  TaskPageResult,
  CaseActivity,
  CaseActivityPageResult,
  Hearing,
  HearingPageResult,
  CasePageResult,
  ClientPageResult,
  UserPageResult,
  LawFirm,
  LoginCredentials,
  RegisterData,
  TokenResponse,
  CaseStatus,
  TaskPriority,
  TaskStatus,
  DashboardAnalyticsResponse,
  DashboardUpcomingResponse,
  DashboardTimeseriesResponse,
  DashboardRecentActivityResponse,
} from '../types';

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL as string) || 'http://localhost:9000';

type PagedListQuery = {
  page?: number;
  size?: number;
  skip?: number;
  limit?: number;
  search?: string;
  sort?: string[];
  extra?: Record<string, string | undefined>;
};

function buildPagedListQuerySuffix(q: PagedListQuery): string {
  const params = new URLSearchParams();
  if (q.page !== undefined) {
    params.set('page', String(q.page));
  }
  if (q.size !== undefined) {
    params.set('size', String(q.size));
  }
  if (q.skip !== undefined) {
    params.set('skip', String(q.skip));
  }
  if (q.limit !== undefined) {
    params.set('limit', String(q.limit));
  }
  if (q.search) {
    params.set('search', q.search);
  }
  (q.sort ?? []).forEach((s) => params.append('sort', s));
  if (q.extra) {
    Object.entries(q.extra).forEach(([k, v]) => {
      if (v != null && String(v).length > 0) {
        params.set(k, String(v));
      }
    });
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}

type ResourceId = number | string;
type CasePayload = {
  title: string;
  description?: string;
  case_number: string;
  client_internal_id: string;
  status?: CaseStatus;
  file_no?: string | null;
  file_date?: string | null;
  court_no?: string | null;
  court_name?: string | null;
  opposite_party?: string | null;
  police_station?: string | null;
  under_section?: string | null;
  fir_no?: string | null;
  next_hearing_date?: string | null;
};
export type CaseActivityPayload = {
  activity_title: string;
  activity_description?: string | null;
  activity_date: string;
  activity_type?: string | null;
  case_internal_id: string;
  assignee_internal_ids?: string[];
};
export type HearingPayload = {
  hearing_date: string;
  purpose_of_hearing: string;
  judge_name?: string | null;
  result?: string | null;
  status?: string;
  case_internal_id: string;
  assignee_internal_ids?: string[];
};
export type TaskPayload = {
  name: string;
  code: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  due_date?: string;
  task_type: string;
  case_internal_id?: string | null;
  assignee_internal_ids?: string[];
  /** @deprecated prefer assignee_internal_ids */
  assignee_internal_id?: string | null;
};
type ClientPayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  company?: string;
  notes?: string;
};
type UpdateProfilePayload = {
  email: string;
  username: string;
  full_name: string;
  phone_number?: string;
};
type CreateAccountUserPayload = {
  email: string;
  username: string;
  full_name: string;
  phone_number?: string;
  group_role: string;
};
type CreateAccountUserResponse = {
  user: User;
  temporary_password: string;
  temporaryPassword?: string;
};

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token and fix Content-Type for FormData
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        // Let the browser set Content-Type (with boundary) for FormData; avoid sending application/json
        if (config.data instanceof FormData && config.headers) {
          const headers = config.headers as Record<string, unknown>;
          delete headers['Content-Type'];
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // If 401 and not already retrying, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await axios.post<TokenResponse>(
                `${API_BASE_URL}/api/auth/refresh`,
                { refresh_token: refreshToken }
              );

              const { access_token, refresh_token } = response.data;
              localStorage.setItem('access_token', access_token);
              localStorage.setItem('refresh_token', refresh_token);

              originalRequest.headers.Authorization = `Bearer ${access_token}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            this.logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // ==================== Authentication ====================

  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    const response = await this.api.post<TokenResponse>('/api/auth/login', {
      username: credentials.username,
      password: credentials.password,
    });

    // Store tokens
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('refresh_token', response.data.refresh_token);

    return response.data;
  }

  async register(data: RegisterData): Promise<User> {
    const payload = {
      account_name: data.account_name,
      account_type: data.account_type,
      ...(data.group_name ? { group_name: data.group_name } : {}),
      email: data.email,
      username: data.username,
      full_name: data.full_name,
      password: data.password,
      ...(data.phone_number ? { phone_number: data.phone_number } : {}),
    };
    const response = await this.api.post<User>('/api/auth/register', payload);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.api.get<User>('/api/auth/me');
    return response.data;
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  async forgotPassword(phoneNumber: string): Promise<void> {
    await this.api.post('/api/auth/forgot-password', { phoneNumber });
  }

  async resetPassword(phoneNumber: string, otp: string, newPassword: string): Promise<void> {
    await this.api.post('/api/auth/reset-password', {
      phoneNumber,
      otp,
      newPassword,
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.api.post('/api/users/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }

  async updateProfile(data: UpdateProfilePayload): Promise<User> {
    const response = await this.api.put<User>('/api/users/me', data);
    return response.data;
  }

  async getUsers(query: PagedListQuery = {}): Promise<UserPageResult> {
    const response = await this.api.get<UserPageResult>(`/api/users${buildPagedListQuerySuffix(query)}`);
    return response.data;
  }

  async createAccountUser(data: CreateAccountUserPayload): Promise<CreateAccountUserResponse> {
    const response = await this.api.post<CreateAccountUserResponse>('/api/users', data);
    return response.data;
  }

  // ==================== Clients ====================

  async getClients(query: PagedListQuery = {}): Promise<ClientPageResult> {
    const response = await this.api.get<ClientPageResult>(`/api/clients${buildPagedListQuerySuffix(query)}`);
    return response.data;
  }

  async getClient(id: ResourceId): Promise<Client> {
    const response = await this.api.get<Client>(`/api/clients/${id}`);
    return response.data;
  }

  async createClient(data: ClientPayload): Promise<Client> {
    const response = await this.api.post<Client>('/api/clients', data);
    return response.data;
  }

  async updateClient(id: ResourceId, data: ClientPayload): Promise<Client> {
    console.log('updateClient', id, data);
    const response = await this.api.put<Client>(`/api/clients/${id}`, data);
    return response.data;
  }

  async deleteClient(id: ResourceId): Promise<void> {
    await this.api.delete(`/api/clients/${id}`);
  }

  async getClientAssignments(clientId: number): Promise<{ user_ids: number[] }> {
    const response = await this.api.get<{ user_ids: number[] }>(`/api/clients/${clientId}/assignments`);
    return response.data;
  }

  async assignUsersToClient(clientId: number, userIds: number[]): Promise<Client> {
    const response = await this.api.post<Client>(`/api/clients/${clientId}/assign`, {
      user_ids: userIds,
    });
    return response.data;
  }

  // ==================== Cases ====================

  async getCases(
    query: PagedListQuery & {
      status?: CaseStatus;
      client_internal_id?: string;
    } = {}
  ): Promise<CasePageResult> {
    const extra: Record<string, string | undefined> = {};
    if (query.status) {
      extra.status = query.status;
    }
    if (query.client_internal_id) {
      extra.client_internal_id = query.client_internal_id;
    }
    const { status: _s, client_internal_id: _c, ...rest } = query;
    const response = await this.api.get<CasePageResult>(
      `/api/cases${buildPagedListQuerySuffix({ ...rest, extra: { ...rest.extra, ...extra } })}`
    );
    return response.data;
  }

  async getCase(id: ResourceId): Promise<Case> {
    const response = await this.api.get<Case>(`/api/cases/${id}`);
    return response.data;
  }

  async createCase(data: CasePayload): Promise<Case> {
    const response = await this.api.post<Case>('/api/cases', data);
    return response.data;
  }

  async updateCase(id: ResourceId, data: CasePayload): Promise<Case> {
    const response = await this.api.put<Case>(`/api/cases/${id}`, data);
    return response.data;
  }

  async deleteCase(id: ResourceId): Promise<void> {
    await this.api.delete(`/api/cases/${id}`);
  }

  async getCaseAssignments(caseId: ResourceId): Promise<{ user_internal_ids?: string[]; userInternalIds?: string[] }> {
    const response = await this.api.get<{ user_internal_ids?: string[]; userInternalIds?: string[] }>(`/api/cases/${caseId}/assignments`);
    return response.data;
  }

  async assignUsersToCase(caseId: ResourceId, userIds: string[]): Promise<void> {
    await this.api.post<void>(`/api/cases/${caseId}/assign`, {
      user_internal_ids: userIds,
    });
  }

  // ==================== Case activities (timeline) ====================

  async getCaseActivities(
    query: PagedListQuery = {}
  ): Promise<CaseActivityPageResult> {
    const response = await this.api.get<CaseActivityPageResult>(
      `/api/case-activities${buildPagedListQuerySuffix(query)}`
    );
    return response.data;
  }

  async getCaseActivitiesForCase(
    caseInternalId: ResourceId,
    query: PagedListQuery = {}
  ): Promise<CaseActivityPageResult> {
    const response = await this.api.get<CaseActivityPageResult>(
      `/api/case-activities/case/${caseInternalId}${buildPagedListQuerySuffix(query)}`
    );
    return response.data;
  }

  async getCaseActivity(id: ResourceId): Promise<CaseActivity> {
    const response = await this.api.get<CaseActivity>(`/api/case-activities/${id}`);
    return response.data;
  }

  async createCaseActivity(data: CaseActivityPayload): Promise<CaseActivity> {
    const response = await this.api.post<CaseActivity>('/api/case-activities', data);
    return response.data;
  }

  async updateCaseActivity(id: ResourceId, data: CaseActivityPayload): Promise<CaseActivity> {
    const response = await this.api.put<CaseActivity>(`/api/case-activities/${id}`, data);
    return response.data;
  }

  async deleteCaseActivity(id: ResourceId): Promise<void> {
    await this.api.delete(`/api/case-activities/${id}`);
  }

  // ==================== Hearings ====================

  async getHearings(query: PagedListQuery = {}): Promise<HearingPageResult> {
    const response = await this.api.get<HearingPageResult>(`/api/hearings${buildPagedListQuerySuffix(query)}`);
    return response.data;
  }

  async getHearingsForCase(caseInternalId: ResourceId, query: PagedListQuery = {}): Promise<HearingPageResult> {
    const response = await this.api.get<HearingPageResult>(
      `/api/hearings/case/${caseInternalId}${buildPagedListQuerySuffix(query)}`
    );
    return response.data;
  }

  async getHearing(id: ResourceId): Promise<Hearing> {
    const response = await this.api.get<Hearing>(`/api/hearings/${id}`);
    return response.data;
  }

  async createHearing(data: HearingPayload): Promise<Hearing> {
    const response = await this.api.post<Hearing>('/api/hearings', data);
    return response.data;
  }

  async updateHearing(id: ResourceId, data: HearingPayload): Promise<Hearing> {
    const response = await this.api.put<Hearing>(`/api/hearings/${id}`, data);
    return response.data;
  }

  async deleteHearing(id: ResourceId): Promise<void> {
    await this.api.delete(`/api/hearings/${id}`);
  }

  // ==================== Tasks ====================

  async getTasks(
    query: PagedListQuery & {
      status?: TaskStatus;
      priority?: TaskPriority;
      case_internal_id?: string;
    } = {}
  ): Promise<TaskPageResult> {
    const extra: Record<string, string | undefined> = {};
    if (query.status) {
      extra.status = query.status;
    }
    if (query.priority) {
      extra.priority = query.priority;
    }
    if (query.case_internal_id) {
      extra.case_internal_id = query.case_internal_id;
    }
    const { status: _st, priority: _pr, case_internal_id: _ci, ...rest } = query;
    const response = await this.api.get<TaskPageResult>(
      `/api/tasks${buildPagedListQuerySuffix({ ...rest, extra: { ...rest.extra, ...extra } })}`
    );
    return response.data;
  }

  async getTask(id: ResourceId): Promise<Task> {
    const response = await this.api.get<Task>(`/api/tasks/${id}`);
    return response.data;
  }

  async createTask(data: TaskPayload): Promise<Task> {
    const response = await this.api.post<Task>('/api/tasks', data);
    return response.data;
  }

  async updateTask(id: ResourceId, data: TaskPayload): Promise<Task> {
    const response = await this.api.put<Task>(`/api/tasks/${id}`, data);
    return response.data;
  }

  async deleteTask(id: ResourceId): Promise<void> {
    await this.api.delete(`/api/tasks/${id}`);
  }

  // ==================== Law Firms ====================

  async getMyLawFirm(): Promise<LawFirm | null> {
    try {
      const response = await this.api.get<LawFirm>('/api/law-firms/my');
      return response.data;
    } catch {
      return null;
    }
  }

  async createLawFirm(name: string): Promise<LawFirm> {
    const response = await this.api.post<LawFirm>('/api/law-firms/', { name });
    return response.data;
  }

  async getFirmMembers(firmId: number): Promise<User[]> {
    const response = await this.api.get<User[]>(`/api/law-firms/${firmId}/members`);
    return response.data;
  }

  async addUserToFirm(
    firmId: number,
    data: { user_id?: number; email?: string; username?: string; full_name?: string; password?: string; group_role: string }
  ): Promise<User> {
    const response = await this.api.post<User>(`/api/law-firms/${firmId}/add-user`, data);
    return response.data;
  }

  // ==================== Documents ====================

  async getDocuments(caseId?: ResourceId, skip = 0, limit = 100): Promise<Document[]> {
    const response = await this.api.get<Document[]>('/api/documents', {
      params: { case_internal_id: caseId, skip, limit },
    });
    return response.data;
  }

  async getDocument(id: ResourceId): Promise<Document> {
    const response = await this.api.get<Document>(`/api/documents/${id}`);
    return response.data;
  }

  async uploadDocument(
    caseId: ResourceId,
    file: File,
    description?: string
  ): Promise<Document> {
    const formData = new FormData();
    formData.append('case_internal_id', String(caseId));
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    const response = await this.api.post<Document>(
      '/api/documents',
      formData
    );
    return response.data;
  }

  getDocumentDownloadUrl(id: ResourceId): string {
    return `${API_BASE_URL}/api/documents/${id}/download`;
  }

  async downloadDocument(id: ResourceId): Promise<Blob> {
    const response = await this.api.get<Blob>(`/api/documents/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async deleteDocument(id: ResourceId): Promise<void> {
    await this.api.delete(`/api/documents/${id}`);
  }

  // ==================== Analytics (pre-aggregated dashboard) ====================

  async getDashboardAnalytics(): Promise<DashboardAnalyticsResponse> {
    const response = await this.api.get<DashboardAnalyticsResponse>('/api/analytics/dashboard');
    return response.data;
  }

  async getDashboardTimeseriesMonthly(year: number): Promise<DashboardTimeseriesResponse> {
    const response = await this.api.get<DashboardTimeseriesResponse>('/api/dashboard/timeseries/monthly', {
      params: { year }
    });
    return response.data;
  }

  async getDashboardTimeseriesWeekly(isoWeek: string): Promise<DashboardTimeseriesResponse> {
    const response = await this.api.get<DashboardTimeseriesResponse>('/api/dashboard/timeseries/weekly', {
      params: { iso_week: isoWeek }
    });
    return response.data;
  }

  async getDashboardRecentActivity(): Promise<DashboardRecentActivityResponse> {
    const response = await this.api.get<DashboardRecentActivityResponse>('/api/dashboard/recent-activity');
    return response.data;
  }

  async getDashboardUpcoming(params?: {
    task_limit?: number;
    hearing_limit?: number;
    days_ahead?: number;
  }): Promise<DashboardUpcomingResponse> {
    const search = new URLSearchParams();
    if (params?.task_limit != null) search.set('task_limit', String(params.task_limit));
    if (params?.hearing_limit != null) search.set('hearing_limit', String(params.hearing_limit));
    if (params?.days_ahead != null) search.set('days_ahead', String(params.days_ahead));
    const q = search.toString();
    const response = await this.api.get<DashboardUpcomingResponse>(`/api/dashboard/upcoming${q ? `?${q}` : ''}`);
    return response.data;
  }
}

// Export singleton instance
export const apiService = new ApiService();
