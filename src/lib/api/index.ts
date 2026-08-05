import { apiClient, unwrap } from './client';
import type {
  Video,
  PaginatedResponse,
  Category,
  SubCategory,
  AuthResponse,
  DashboardStats,
  UploadTask,
  UploadTempDirStats,
  B2StorageKey,
  CreateB2StorageKeyInput,
  UpdateB2StorageKeyInput,
  AdminInvitation,
  InvitationPreview,
  StorageObjectsResponse,
  CreateInvitationResult,
  User,
  TelegramLinkCodeResponse,
  TeraboxSettings,
  TeraboxTestResult,
  UpdateVideoInput,
  GeneratedVideoMetadata,
  NearbyVideos,
  CloudflareBucketConfigureResult,
} from './types';

export interface VideoQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  subCategory?: string;
  tag?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export const videosApi = {
  list: async (params?: VideoQueryParams): Promise<PaginatedResponse<Video>> => {
    const response = await apiClient.get('/videos', { params });
    return unwrap(response);
  },

  trending: async (limit = 20): Promise<Video[]> => {
    const response = await apiClient.get('/videos/trending', { params: { limit } });
    return unwrap(response);
  },

  latest: async (limit = 20): Promise<Video[]> => {
    const response = await apiClient.get('/videos/latest', { params: { limit } });
    return unwrap(response);
  },

  getBySlug: async (slug: string): Promise<Video> => {
    const response = await apiClient.get(`/watch/${slug}`);
    return unwrap(response);
  },

  nearby: async (slug: string, limit = 8): Promise<NearbyVideos> => {
    const response = await apiClient.get(`/watch/${slug}/nearby`, { params: { limit } });
    return unwrap(response);
  },

  listMine: async (params?: VideoQueryParams): Promise<PaginatedResponse<Video>> => {
    const response = await apiClient.get('/videos/mine', { params });
    return unwrap(response);
  },

  updateVideo: async (id: string, input: UpdateVideoInput): Promise<Video> => {
    const response = await apiClient.patch(`/videos/${id}`, input);
    return unwrap(response);
  },

  deleteVideo: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/videos/${id}`);
    unwrap(response);
  },

  retryUpload: async (id: string): Promise<UploadTask> => {
    const response = await apiClient.post(`/videos/${id}/retry-upload`);
    return unwrap(response);
  },

  search: async (params: VideoQueryParams): Promise<PaginatedResponse<Video>> => {
    const response = await apiClient.get('/search', { params });
    return unwrap(response);
  },
};

export const categoriesApi = {
  list: async (): Promise<Category[]> => {
    const response = await apiClient.get('/categories');
    return unwrap(response);
  },

  getBySlug: async (slug: string): Promise<Category> => {
    const response = await apiClient.get(`/categories/${slug}`);
    return unwrap(response);
  },

  listSubcategories: async (slug: string, search?: string): Promise<SubCategory[]> => {
    const response = await apiClient.get(`/categories/${slug}/subcategories`, {
      params: search ? { search } : undefined,
    });
    return unwrap(response);
  },
};

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', { email, password });
    return unwrap(response);
  },

  register: async (
    email: string,
    password: string,
    displayName: string,
  ): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', { email, password, displayName });
    return unwrap(response);
  },

  logout: async (): Promise<void> => {
    const response = await apiClient.post('/auth/logout');
    unwrap(response);
  },

  me: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return unwrap(response);
  },

  updateProfile: async (input: {
    displayName?: string;
  }): Promise<User> => {
    const response = await apiClient.patch('/auth/me', input);
    return unwrap(response);
  },

  createTelegramLinkCode: async (): Promise<TelegramLinkCodeResponse> => {
    const response = await apiClient.post('/auth/telegram-link-code');
    return unwrap(response);
  },

  unlinkTelegram: async (): Promise<User> => {
    const response = await apiClient.delete('/auth/telegram-link');
    return unwrap(response);
  },

  previewInvitation: async (token: string): Promise<InvitationPreview> => {
    const response = await apiClient.get(`/auth/invitations/${token}`);
    return unwrap(response);
  },

  acceptInvitation: async (
    token: string,
    displayName: string,
    password: string,
  ): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/accept-invitation', {
      token,
      displayName,
      password,
    });
    return unwrap(response);
  },
};

export const adminApi = {
  listUsers: async (): Promise<User[]> => {
    const response = await apiClient.get('/admin/users');
    return unwrap(response);
  },

  dashboard: async (): Promise<DashboardStats> => {
    const response = await apiClient.get('/admin/dashboard');
    return unwrap(response);
  },

  uploads: async (): Promise<UploadTask[]> => {
    const response = await apiClient.get('/admin/uploads');
    return unwrap(response);
  },

  failedUploads: async (): Promise<UploadTask[]> => {
    const response = await apiClient.get('/admin/uploads/failed');
    return unwrap(response);
  },

  uploadTempDirStats: async (): Promise<UploadTempDirStats> => {
    const response = await apiClient.get('/admin/upload-temp');
    return unwrap(response);
  },

  clearUploadTempDir: async (): Promise<UploadTempDirStats & { message: string }> => {
    const response = await apiClient.post('/admin/upload-temp/clear');
    return unwrap(response);
  },

  videos: async (): Promise<Video[]> => {
    const response = await apiClient.get('/admin/videos');
    return unwrap(response);
  },

  updateVideo: async (id: string, input: UpdateVideoInput): Promise<Video> => {
    const response = await apiClient.patch(`/admin/videos/${id}`, input);
    return unwrap(response);
  },

  regenerateVideoMetadata: async (id: string): Promise<GeneratedVideoMetadata | null> => {
    const response = await apiClient.post(`/admin/videos/${id}/regenerate-metadata`);
    return unwrap(response);
  },

  publish: async (id: string): Promise<void> => {
    const response = await apiClient.post(`/admin/videos/${id}/publish`);
    unwrap(response);
  },

  unpublish: async (id: string): Promise<void> => {
    const response = await apiClient.post(`/admin/videos/${id}/unpublish`);
    unwrap(response);
  },

  deleteVideo: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/admin/videos/${id}`);
    unwrap(response);
  },

  bulkDeleteVideos: async (ids: string[]): Promise<{ deleted: number }> => {
    const response = await apiClient.post('/admin/videos/bulk-delete', { ids });
    return unwrap(response);
  },

  storageKeys: async (): Promise<B2StorageKey[]> => {
    const response = await apiClient.get('/admin/storage-keys');
    return unwrap(response);
  },

  createStorageKey: async (input: CreateB2StorageKeyInput): Promise<B2StorageKey> => {
    const response = await apiClient.post('/admin/storage-keys', input);
    return unwrap(response);
  },

  testStorageKey: async (input: CreateB2StorageKeyInput): Promise<{ ok: boolean }> => {
    const response = await apiClient.post('/admin/storage-keys/test', input);
    return unwrap(response);
  },

  testStorageKeyById: async (
    id: string,
    input: UpdateB2StorageKeyInput,
  ): Promise<{ ok: boolean }> => {
    const response = await apiClient.post(`/admin/storage-keys/${id}/test`, input);
    return unwrap(response);
  },

  updateStorageKey: async (
    id: string,
    data: UpdateB2StorageKeyInput,
  ): Promise<B2StorageKey> => {
    const response = await apiClient.patch(`/admin/storage-keys/${id}`, data);
    return unwrap(response);
  },

  syncStorageKeyUsage: async (id: string): Promise<B2StorageKey> => {
    const response = await apiClient.post(`/admin/storage-keys/${id}/sync-usage`);
    return unwrap(response);
  },

  syncAllStorageKeyUsage: async (): Promise<B2StorageKey[]> => {
    const response = await apiClient.post('/admin/storage-keys/sync-all-usage');
    return unwrap(response);
  },

  configureCloudflareCaching: async (): Promise<CloudflareBucketConfigureResult[]> => {
    const response = await apiClient.post('/admin/storage-keys/configure-cloudflare');
    return unwrap(response);
  },

  deactivateStorageKey: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/admin/storage-keys/${id}`);
    return unwrap(response);
  },

  invitations: async (): Promise<AdminInvitation[]> => {
    const response = await apiClient.get('/admin/invitations');
    return unwrap(response);
  },

  createInvitation: async (email: string): Promise<CreateInvitationResult> => {
    const response = await apiClient.post('/admin/invitations', { email });
    return unwrap(response);
  },

  resendInvitation: async (id: string): Promise<CreateInvitationResult> => {
    const response = await apiClient.post(`/admin/invitations/${id}/resend`);
    return unwrap(response);
  },

  revokeInvitation: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/admin/invitations/${id}`);
    return unwrap(response);
  },

  listStorageObjects: async (
    keyId: string,
    params?: { continuationToken?: string; prefix?: string },
  ): Promise<StorageObjectsResponse> => {
    const response = await apiClient.get(`/admin/storage-keys/${keyId}/objects`, { params });
    return unwrap(response);
  },

  getStorageObjectUrl: async (keyId: string, objectKey: string): Promise<{ url: string }> => {
    const response = await apiClient.get(`/admin/storage-keys/${keyId}/objects/signed-url`, {
      params: { key: objectKey },
    });
    return unwrap(response);
  },

  deleteStorageObject: async (
    keyId: string,
    objectKey: string,
  ): Promise<{ deleted: boolean }> => {
    const response = await apiClient.post(`/admin/storage-keys/${keyId}/objects/delete`, {
      key: objectKey,
    });
    return unwrap(response);
  },

  bulkDeleteStorageObjects: async (
    keyId: string,
    keys: string[],
  ): Promise<{ deleted: number; failed: string[] }> => {
    const response = await apiClient.post(`/admin/storage-keys/${keyId}/objects/bulk-delete`, {
      keys,
    });
    return unwrap(response);
  },

  wipeStorageKey: async (
    keyId: string,
  ): Promise<{ deleted: number; failed: string[]; message: string }> => {
    const response = await apiClient.post(`/admin/storage-keys/${keyId}/wipe`);
    return unwrap(response);
  },

  teraboxSettings: async (): Promise<TeraboxSettings> => {
    const response = await apiClient.get('/admin/terabox');
    return unwrap(response);
  },

  saveTeraboxCookie: async (cookie: string): Promise<TeraboxSettings> => {
    const response = await apiClient.patch('/admin/terabox', { cookie });
    return unwrap(response);
  },

  testTeraboxLink: async (input: {
    url?: string;
    cookie?: string;
  }): Promise<TeraboxTestResult> => {
    const response = await apiClient.post('/admin/terabox/test', input);
    return unwrap(response);
  },
};
