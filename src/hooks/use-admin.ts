'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import type { CreateB2StorageKeyInput, UpdateB2StorageKeyInput, UpdateVideoInput } from '@/lib/api/types';

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminApi.dashboard(),
  });
}

export function useAdminUploads() {
  return useQuery({
    queryKey: ['admin', 'uploads'],
    queryFn: () => adminApi.uploads(),
  });
}

export function useAdminVideos() {
  return useQuery({
    queryKey: ['admin', 'videos'],
    queryFn: () => adminApi.videos(),
  });
}

export function useUpdateVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateVideoInput }) =>
      adminApi.updateVideo(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'videos'] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['video'] });
    },
  });
}

export function useRegenerateVideoMetadata() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.regenerateVideoMetadata(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'videos'] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['video'] });
    },
  });
}

export function useFailedUploads() {
  return useQuery({
    queryKey: ['admin', 'uploads', 'failed'],
    queryFn: () => adminApi.failedUploads(),
  });
}

export function useUploadTempDirStats() {
  return useQuery({
    queryKey: ['admin', 'upload-temp'],
    queryFn: () => adminApi.uploadTempDirStats(),
    refetchInterval: 30_000,
  });
}

export function useClearUploadTempDir() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => adminApi.clearUploadTempDir(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'upload-temp'] });
    },
  });
}

export function useStorageKeys() {
  return useQuery({
    queryKey: ['admin', 'storage-keys'],
    queryFn: () => adminApi.storageKeys(),
  });
}

export function useCreateStorageKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateB2StorageKeyInput) => adminApi.createStorageKey(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'storage-keys'] });
    },
  });
}

export function useUpdateStorageKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateB2StorageKeyInput }) =>
      adminApi.updateStorageKey(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'storage-keys'] });
    },
  });
}

export function useTestStorageKey() {
  return useMutation({
    mutationFn: (input: CreateB2StorageKeyInput) => adminApi.testStorageKey(input),
  });
}

export function useTestStorageKeyById() {
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateB2StorageKeyInput }) =>
      adminApi.testStorageKeyById(id, input),
  });
}

export function useSyncStorageKeyUsage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.syncStorageKeyUsage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'storage-keys'] });
    },
  });
}

export function useSyncAllStorageKeyUsage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => adminApi.syncAllStorageKeyUsage(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'storage-keys'] });
    },
  });
}

export function useConfigureCloudflareCaching() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => adminApi.configureCloudflareCaching(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'storage-keys'] });
    },
  });
}

export function useDeactivateStorageKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deactivateStorageKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'storage-keys'] });
    },
  });
}

export function useAdminInvitations() {
  return useQuery({
    queryKey: ['admin', 'invitations'],
    queryFn: () => adminApi.invitations(),
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => adminApi.createInvitation(email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'invitations'] });
    },
  });
}

export function useResendInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.resendInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'invitations'] });
    },
  });
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.revokeInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'invitations'] });
    },
  });
}

export function useTeraboxSettings() {
  return useQuery({
    queryKey: ['admin', 'terabox'],
    queryFn: () => adminApi.teraboxSettings(),
  });
}

export function useSaveTeraboxCookie() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cookie: string) => adminApi.saveTeraboxCookie(cookie),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'terabox'] });
    },
  });
}

export function useTestTeraboxLink() {
  return useMutation({
    mutationFn: (input: { url?: string; cookie?: string }) => adminApi.testTeraboxLink(input),
  });
}
