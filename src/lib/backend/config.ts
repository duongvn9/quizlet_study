export interface BackendConfig {
  authEnabled: boolean;
  remoteProgressEnabled: boolean;
  adminImportEnabled: boolean;
}

export function getBackendConfig(env: Record<string, string | undefined> = process.env): BackendConfig {
  return {
    authEnabled: env.NEXT_PUBLIC_AUTH_ENABLED === "true",
    remoteProgressEnabled: env.NEXT_PUBLIC_REMOTE_PROGRESS_ENABLED === "true",
    adminImportEnabled: env.NEXT_PUBLIC_ADMIN_IMPORT_ENABLED === "true",
  };
}
