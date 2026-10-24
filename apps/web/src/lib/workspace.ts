export interface WorkspaceProfile {
  tenantId?: string;
  agencyName?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
}

const PROFILE_KEY = 'manpower_workspace_profile';

export function getWorkspaceProfile(): WorkspaceProfile {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}') as WorkspaceProfile;
  } catch {
    return {};
  }
}

export function saveWorkspaceProfile(profile: WorkspaceProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
