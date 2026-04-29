export const SESSION_COOKIE_NAME = "vrk_session";

export type ScopeType = "organization" | "division" | "unit";

export type RoleTemplate =
  | "organization_admin"
  | "organization_head"
  | "division_head"
  | "division_operator"
  | "unit_head"
  | "unit_operator"
  | "auditor";

export type Capability = "manage_structure" | "manage_access" | "manage_contracts" | "manage_equipment";

export const roleTemplateLabels: Record<RoleTemplate, string> = {
  organization_admin: "Администратор организации",
  organization_head: "Руководитель организации",
  division_head: "Руководитель подразделения",
  division_operator: "Сотрудник подразделения",
  unit_head: "Руководитель юнита",
  unit_operator: "Сотрудник юнита",
  auditor: "Аудитор",
};

export const roleScopeOptions: Record<RoleTemplate, ScopeType[]> = {
  organization_admin: ["organization"],
  organization_head: ["organization"],
  division_head: ["division"],
  division_operator: ["division"],
  unit_head: ["unit"],
  unit_operator: ["unit"],
  auditor: ["organization", "division", "unit"],
};

const roleCapabilities: Record<RoleTemplate, Capability[]> = {
  organization_admin: ["manage_structure", "manage_access", "manage_contracts", "manage_equipment"],
  organization_head: [],
  division_head: [],
  division_operator: [],
  unit_head: [],
  unit_operator: [],
  auditor: [],
};

export function isRoleTemplate(value: string): value is RoleTemplate {
  return value in roleTemplateLabels;
}

export function isRoleScopeCompatible(roleTemplate: string, scopeType: ScopeType) {
  return isRoleTemplate(roleTemplate) && roleScopeOptions[roleTemplate].includes(scopeType);
}

export function roleTemplateLabel(value: string) {
  return isRoleTemplate(value) ? roleTemplateLabels[value] : value;
}

export function sessionHasCapability(session: SessionSummaryResponse, capability: Capability) {
  const roleTemplate = session.grant?.roleTemplate;
  if (!roleTemplate || !isRoleTemplate(roleTemplate) || session.organization.launchState !== "active") {
    return false;
  }
  return isRoleScopeCompatible(roleTemplate, session.workspace.scopeType) && roleCapabilities[roleTemplate].includes(capability);
}

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
  scopeType?: ScopeType;
  scopeLabel?: string;
  launchState: string;
};

export type CreateEmployeeInvitePayload = {
  fullName: string;
  email: string;
  roleTemplate: string;
  scopeType: ScopeType;
  scopeId: string;
  expiresAt: string;
};

export type EmployeeInviteResponse = {
  id: string;
  fullName: string;
  email: string;
  roleTemplate: string;
  scopeType: ScopeType;
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

export type CompanyProfilePayload = {
  propertyType: string;
  type?: string;
  name: string;
  shortName?: string;
  inn?: string;
  kpp?: string;
  registeredAddress?: string;
  address?: string;
  leaderFullName?: string;
  managerName?: string;
  leaderPosition?: string;
  contractPhone?: string;
  contractEmail?: string;
  actingBasis?: string;
};

export type StructureNodePayload = {
  type?: string;
  name: string;
  code?: string;
  region?: string;
  address?: string;
  registeredAddress?: string;
  leaderFullName?: string;
  managerName?: string;
  leaderPosition?: string;
  contractPhone?: string;
  contractEmail?: string;
  actingBasis?: string;
  contacts?: string;
  comment?: string;
  divisionId?: string;
};

export type LaunchDivisionInput = {
  type?: string;
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
  structureMode: "division" | "unit";
  division?: LaunchDivisionInput;
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
    type?: string;
    name: string;
    shortName?: string;
    propertyType?: string;
    inn?: string;
    kpp?: string;
    legalAddress?: string;
    registeredAddress?: string;
    address?: string;
    contactEmail?: string;
    contactPhone?: string;
    leaderFullName?: string;
    managerName?: string;
    leaderPosition?: string;
    contractPhone?: string;
    contractEmail?: string;
    actingBasis?: string;
    launchState: string;
  };
  grant?: {
    id: string;
    roleTemplate: string;
    scopeType: string;
    scopeId: string;
  };
  workspace: {
    scopeType: ScopeType;
    scopeId: string;
    scopeName: string;
    landingTitle: string;
    landingSubtitle: string;
    landingPath: string;
    canManageEmployeeInvites: boolean;
  };
  divisions: Array<{
    id: string;
    type: string;
    name: string;
    code?: string;
    region?: string;
    address?: string;
    registeredAddress?: string;
    managerName?: string;
    leaderFullName?: string;
    contacts?: string;
    leaderPosition?: string;
    contractPhone?: string;
    contractEmail?: string;
    actingBasis?: string;
    status: string;
    comment?: string;
  }>;
  units: Array<{
    id: string;
    type: string;
    name: string;
    code?: string;
    region?: string;
    divisionId?: string;
    address?: string;
    registeredAddress?: string;
    managerName?: string;
    leaderFullName?: string;
    contacts?: string;
    leaderPosition?: string;
    contractPhone?: string;
    contractEmail?: string;
    actingBasis?: string;
    status: string;
    comment?: string;
  }>;
};

export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
  meta?: ApiMeta;
};

export type ApiMeta = {
  total: number;
  limit: number;
  offset: number;
};

export function resolveSessionLandingPath(session: SessionSummaryResponse) {
  return session.workspace.landingPath || "/company";
}
