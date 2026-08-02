export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface VideoQualityOption {
  label: string;
  height: number;
  width: number | null;
  url: string;
  isOriginal?: boolean;
}

export interface Video {
  id: string;
  uuid: string;
  title: string;
  slug: string;
  description: string | null;
  summary: string | null;
  status: string;
  visibility: string;
  duration: number | null;
  width: number | null;
  height: number | null;
  thumbnailUrl: string | null;
  posterUrl: string | null;
  cdnUrl: string | null;
  qualities?: VideoQualityOption[];
  mimeType?: string | null;
  views: number;
  likes: number;
  publishedAt: string | null;
  createdAt: string;
  categoryId?: string | null;
  subCategory: string | null;
  contentType: string | null;
  language: string | null;
  ageRating: string | null;
  keywords: string[] | null;
  category?: Category | null;
  videoTags?: { tag: Tag }[];
}

export interface NearbyVideos {
  before: Video[];
  after: Video[];
}

export interface UpdateVideoInput {
  title?: string;
  description?: string;
  summary?: string;
  subCategory?: string;
  contentType?: string;
  language?: string;
  ageRating?: string;
  visibility?: string;
  categoryId?: string;
  slug?: string;
  keywords?: string[];
  tags?: string[];
}

export interface GeneratedVideoMetadata {
  title: string;
  description: string;
  category: string;
  subCategory: string;
  contentType: string;
  language: string;
  ageRating: string;
  tags: string[];
  keywords: string[];
  slug: string;
  summary: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface SubCategory {
  name: string;
  slug: string;
  videoCount: number;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  avatarUrl: string | null;
  telegramChatId?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface DashboardStats {
  totalVideos: number;
  publishedVideos: number;
  failedUploads: number;
  pendingUploads: number;
  totalViews: number;
}

export interface UploadTask {
  id: string;
  videoId: string;
  status: string;
  progress: number;
  error: string | null;
  video?: Video;
  createdAt: string;
}

export interface UploadTempDirStats {
  path: string;
  exists: boolean;
  bytes: number;
  fileCount: number;
  directoryCount: number;
}

export interface B2StorageKey {
  id: string;
  name: string;
  endpoint: string;
  region: string;
  bucket: string;
  bucketId: string | null;
  accessKey: string;
  secretKeyPreview: string;
  publicUrl: string | null;
  usageBytes: number;
  quotaBytes: number;
  usagePercent: number;
  isActive: boolean;
  isWritable: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface CloudflareBucketConfigureResult {
  id: string;
  name: string;
  bucket: string;
  status: 'updated' | 'skipped' | 'failed';
  message: string;
}

export interface CreateB2StorageKeyInput {
  name: string;
  endpoint: string;
  region: string;
  bucket: string;
  bucketId?: string;
  accessKey: string;
  secretKey: string;
  publicUrl?: string;
  priority?: number;
  quotaBytes?: number;
}

export interface UpdateB2StorageKeyInput {
  name?: string;
  endpoint?: string;
  region?: string;
  bucket?: string;
  bucketId?: string;
  accessKey?: string;
  secretKey?: string;
  publicUrl?: string;
  priority?: number;
  quotaBytes?: number;
  isActive?: boolean;
}

export interface AdminInvitation {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  inviteUrl: string;
  invitedByEmail: string | null;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export interface CreateInvitationResult extends AdminInvitation {
  emailSent: boolean;
}

export interface InvitationPreview {
  email: string;
  role: string;
  expiresAt: string;
  invitedByName: string | null;
}

export interface StorageObject {
  key: string;
  size: number;
  lastModified: string | null;
}

export interface StorageObjectsResponse {
  objects: StorageObject[];
  nextContinuationToken: string | null;
  keyCount: number;
}

export interface TeraboxSettings {
  configured: boolean;
  cookiePreview: string | null;
  updatedAt: string | null;
}

export interface TeraboxTestResult {
  ok: boolean;
  fileName?: string | null;
  size?: number | null;
  error?: string;
}
