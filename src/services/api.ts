/**
 * Centralized API client for Fermes du Bélier SaaS
 * Handles authentication, organization scoping (X-Organization-Id),
 * error normalization, and session persistence.
 */

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  isEmailVerified: boolean;
}

export interface UserOrganization {
  id: string;
  name: string;
  slug: string;
  role: 'owner' | 'admin' | 'manager' | 'operator' | 'viewer';
  farmCount?: number;
  batchCount?: number;
}

export interface FarmRecord {
  id: string;
  organizationId: string;
  name: string;
  location?: string | null;
  surfaceM2: number;
  buildingCount?: number;
  batchCount?: number;
  buildings?: Array<{ id: string; name: string; capacity: number }>;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

const STORAGE_KEY_AUTH = 'belier_saas_auth_v1';
const STORAGE_KEY_ACTIVE_ORG = 'belier_saas_active_org_id_v1';

class ApiService {
  private token: string | null = null;
  private user: AuthUser | null = null;
  private activeOrgId: string | null = null;
  private authListeners: Array<(user: AuthUser | null) => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUTH);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.token = parsed.token || null;
        this.user = parsed.user || null;
      }
      this.activeOrgId = localStorage.getItem(STORAGE_KEY_ACTIVE_ORG);
    } catch (e) {
      console.warn('[API] Could not restore session from storage:', e);
    }
  }

  private saveToStorage() {
    try {
      if (this.token && this.user) {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify({ token: this.token, user: this.user }));
      } else {
        localStorage.removeItem(STORAGE_KEY_AUTH);
      }

      if (this.activeOrgId) {
        localStorage.setItem(STORAGE_KEY_ACTIVE_ORG, this.activeOrgId);
      } else {
        localStorage.removeItem(STORAGE_KEY_ACTIVE_ORG);
      }
    } catch (e) {
      console.warn('[API] Could not save session to storage:', e);
    }
  }

  public getToken() {
    return this.token;
  }

  public getUser() {
    return this.user;
  }

  public getActiveOrgId() {
    return this.activeOrgId;
  }

  public setActiveOrgId(orgId: string | null) {
    this.activeOrgId = orgId;
    this.saveToStorage();
  }

  public onAuthChange(listener: (user: AuthUser | null) => void) {
    this.authListeners.push(listener);
    return () => {
      this.authListeners = this.authListeners.filter(l => l !== listener);
    };
  }

  private notifyAuthChange() {
    this.authListeners.forEach(cb => cb(this.user));
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (this.activeOrgId) {
      headers['X-Organization-Id'] = this.activeOrgId;
    }

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers
      });

      const isJson = response.headers.get('content-type')?.includes('application/json');
      const body = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        // If 401 Unauthorized, automatically handle session expiry
        if (response.status === 401 && this.token) {
          console.warn('[API] Session expired or invalid. Clearing credentials.');
          this.token = null;
          this.user = null;
          this.saveToStorage();
          this.notifyAuthChange();
        }

        return {
          error: (typeof body === 'object' && body?.error) || response.statusText || 'Erreur requête API',
          status: response.status
        };
      }

      return {
        data: body as T,
        status: response.status
      };
    } catch (err: any) {
      return {
        error: err.message || 'Impossible de joindre le serveur API.',
        status: 0
      };
    }
  }

  // --- HEALTH CHECK ---
  public async checkHealth() {
    return this.request<{ status: string; database: any }>('/api/health');
  }

  // --- AUTHENTICATION ---
  public async register(email: string, password: string, fullName: string) {
    const res = await this.request<{
      token: string;
      user: AuthUser;
      simulatedVerificationToken?: string;
    }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName })
    });

    if (res.data) {
      this.token = res.data.token;
      this.user = res.data.user;
      this.saveToStorage();
      this.notifyAuthChange();
    }
    return res;
  }

  public async login(email: string, password: string) {
    const res = await this.request<{
      token: string;
      user: AuthUser;
      organizations: UserOrganization[];
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (res.data) {
      this.token = res.data.token;
      this.user = res.data.user;
      // Auto-select first org if none selected or not in list
      if (res.data.organizations && res.data.organizations.length > 0) {
        if (!this.activeOrgId || !res.data.organizations.some(o => o.id === this.activeOrgId)) {
          this.activeOrgId = res.data.organizations[0].id;
        }
      } else {
        this.activeOrgId = null;
      }
      this.saveToStorage();
      this.notifyAuthChange();
    }
    return res;
  }

  public async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    this.token = null;
    this.user = null;
    this.activeOrgId = null;
    this.saveToStorage();
    this.notifyAuthChange();
  }

  public async getMe() {
    const res = await this.request<{ user: AuthUser; organizations: UserOrganization[] }>('/api/auth/me');
    if (res.data) {
      this.user = res.data.user;
      this.saveToStorage();
    }
    return res;
  }

  public async verifyEmail(token: string) {
    return this.request<{ message: string; user: AuthUser }>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
  }

  public async requestPasswordReset(email: string) {
    return this.request<{ message: string; simulatedResetToken?: string }>('/api/auth/request-password-reset', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  public async resetPassword(token: string, newPassword: string) {
    return this.request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    });
  }

  public async getDevMailbox() {
    return this.request<{ messages: any[] }>('/api/auth/dev-mailbox');
  }

  // --- ORGANIZATIONS ---
  public async getOrganizations() {
    return this.request<{ organizations: UserOrganization[] }>('/api/organizations');
  }

  public async createOrganization(name: string, defaultFarmName?: string) {
    const res = await this.request<{
      organization: UserOrganization;
      defaultFarm: { id: string; name: string };
    }>('/api/organizations', {
      method: 'POST',
      body: JSON.stringify({ name, defaultFarmName })
    });

    if (res.data?.organization) {
      this.activeOrgId = res.data.organization.id;
      this.saveToStorage();
    }
    return res;
  }

  public async getOrganizationMembers(orgId: string) {
    return this.request<{ members: any[] }>(`/api/organizations/${orgId}/members`);
  }

  public async inviteMember(orgId: string, email: string, role: string) {
    return this.request<{ message: string; member: any }>(`/api/organizations/${orgId}/members/invite`, {
      method: 'POST',
      body: JSON.stringify({ email, role })
    });
  }

  // --- FARMS ---
  public async getFarms(orgId: string) {
    return this.request<{ farms: FarmRecord[] }>(`/api/organizations/${orgId}/farms`);
  }

  public async createFarm(orgId: string, data: { name: string; location?: string; surfaceM2?: number }) {
    return this.request<{ message: string; farm: FarmRecord }>(`/api/organizations/${orgId}/farms`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async deleteFarm(orgId: string, farmId: string) {
    return this.request<{ message: string }>(`/api/organizations/${orgId}/farms/${farmId}`, {
      method: 'DELETE'
    });
  }

  // --- BATCHES ---
  public async getBatches(orgId: string, filters?: { status?: string; farmId?: string }) {
    let url = `/api/organizations/${orgId}/batches`;
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.farmId) params.append('farmId', filters.farmId);
    if (params.toString()) url += `?${params.toString()}`;
    return this.request<{ batches: any[] }>(url);
  }

  public async getBatch(orgId: string, batchId: string) {
    return this.request<{ batch: any }>(`/api/organizations/${orgId}/batches/${batchId}`);
  }

  public async createBatch(orgId: string, batchData: any) {
    return this.request<{ message: string; batch: any }>(`/api/organizations/${orgId}/batches`, {
      method: 'POST',
      body: JSON.stringify(batchData)
    });
  }

  public async updateBatch(orgId: string, batchId: string, batchData: any) {
    return this.request<{ message: string }>(`/api/organizations/${orgId}/batches/${batchId}`, {
      method: 'PUT',
      body: JSON.stringify(batchData)
    });
  }

  public async deleteBatch(orgId: string, batchId: string) {
    return this.request<{ message: string }>(`/api/organizations/${orgId}/batches/${batchId}`, {
      method: 'DELETE'
    });
  }

  public async getOrganizationStats(orgId: string) {
    return this.request<any>(`/api/organizations/${orgId}/batches/kpi/summary`);
  }
}

export const api = new ApiService();
