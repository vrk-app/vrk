export const SESSION_COOKIE_NAME = "vrk_session";

export type OrganizationShellPayload = {
  organizationName: string;
  organizationRole: "customer" | "contractor";
  firstAdminName: string;
  firstAdminEmail: string;
};

export type OrganizationShellResponse = {
  organizationId: string;
  organizationName: string;
  organizationRole: string;
  inviteId: string;
  inviteEmail: string;
  inviteStatus: string;
  inviteToken: string;
  inviteExpiresAt: string;
};

export type InviteInspectionResponse = {
  organizationId: string;
  organizationName: string;
  organizationRole: string;
  inviteStatus: string;
  firstAdminName: string;
  inviteEmail: string;
  inviteExpiresAt: string;
  launchState: string;
};

export type PublicInviteInspectionResponse = {
  inviteKind: "first_admin" | "employee";
  organizationId: string;
  organizationName: string;
  organizationRole: string;
  inviteStatus: string;
  inviteeName: string;
  inviteEmail: string;
  inviteExpiresAt: string;
  roleTemplate?: string;
  scopeType?: string;
  scopeLabel?: string;
  launchState: string;
};

export type CreateEmployeeInvitePayload = {
  fullName: string;
  email: string;
  roleTemplate: string;
  scopeType: "organization" | "subdivision" | "unit";
  scopeId: string;
  expiresAt: string;
};

export type EmployeeInviteResponse = {
  id: string;
  fullName: string;
  email: string;
  roleTemplate: string;
  scopeType: "organization" | "subdivision" | "unit";
  scopeId: string;
  scopeLabel: string;
  status: "draft" | "sent" | "opened" | "accepted" | "expired" | "revoked";
  inviteToken?: string;
  acceptPath?: string;
  expiresAt: string;
  sentAt?: string;
  openedAt?: string;
  acceptedAt?: string;
  revokedAt?: string;
};

export type LaunchSubdivisionInput = {
  type: string;
  name: string;
  code?: string;
  region?: string;
  address?: string;
  managerName?: string;
  contacts?: string;
};

export type LaunchUnitInput = {
  type: string;
  name: string;
  code?: string;
  address?: string;
  managerName?: string;
  contacts?: string;
};

export type LaunchWizardPayload = {
  organizationName: string;
  shortName?: string;
  propertyType: string;
  inn: string;
  kpp: string;
  legalAddress: string;
  contactEmail: string;
  contactPhone: string;
  structureMode: "subdivision" | "unit";
  subdivision?: LaunchSubdivisionInput;
  unit: LaunchUnitInput;
};

export type SessionSummaryResponse = {
  sessionToken: string;
  requiresLaunchWizard: boolean;
  membershipId: string;
  membershipStatus: string;
  account: {
    id: string;
    fullName: string;
    email: string;
  };
  organization: {
    id: string;
    roleTitle: string;
    name: string;
    shortName?: string;
    propertyType?: string;
    inn?: string;
    kpp?: string;
    legalAddress?: string;
    contactEmail?: string;
    contactPhone?: string;
    launchState: string;
  };
  grant?: {
    id: string;
    roleTemplate: string;
    scopeType: string;
    scopeId: string;
  };
  workspace: {
    scopeType: "organization" | "subdivision" | "unit";
    scopeId: string;
    scopeName: string;
    landingTitle: string;
    landingSubtitle: string;
    landingPath: string;
    canManageEmployeeInvites: boolean;
  };
  subdivisions: Array<{
    id: string;
    type: string;
    name: string;
    code?: string;
  }>;
  units: Array<{
    id: string;
    type: string;
    name: string;
    code?: string;
    subdivisionId?: string;
  }>;
};

export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export function resolveSessionLandingPath(session: SessionSummaryResponse) {
  if (session.requiresLaunchWizard) {
    return "/company/setup";
  }

  return session.workspace.landingPath || "/company";
}
