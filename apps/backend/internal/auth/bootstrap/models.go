package bootstrap

type CreateOrganizationShellRequest struct {
	OrganizationName string `json:"organizationName"`
	OrganizationRole string `json:"organizationRole"`
	FirstAdminName   string `json:"firstAdminName"`
	FirstAdminEmail  string `json:"firstAdminEmail"`
}

type AcceptInviteRequest struct {
	Password string `json:"password"`
}

type CreateSessionRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LaunchSubdivisionInput struct {
	Type        string  `json:"type"`
	Name        string  `json:"name"`
	Code        *string `json:"code,omitempty"`
	Region      *string `json:"region,omitempty"`
	Address     *string `json:"address,omitempty"`
	ManagerName *string `json:"managerName,omitempty"`
	Contacts    *string `json:"contacts,omitempty"`
}

type LaunchUnitInput struct {
	Type        string  `json:"type"`
	Name        string  `json:"name"`
	Code        *string `json:"code,omitempty"`
	Address     *string `json:"address,omitempty"`
	ManagerName *string `json:"managerName,omitempty"`
	Contacts    *string `json:"contacts,omitempty"`
}

type CompleteLaunchRequest struct {
	OrganizationName string                  `json:"organizationName"`
	ShortName        *string                 `json:"shortName,omitempty"`
	PropertyType     string                  `json:"propertyType"`
	Inn              string                  `json:"inn"`
	Kpp              string                  `json:"kpp"`
	LegalAddress     string                  `json:"legalAddress"`
	ContactEmail     string                  `json:"contactEmail"`
	ContactPhone     string                  `json:"contactPhone"`
	StructureMode    string                  `json:"structureMode"`
	Subdivision      *LaunchSubdivisionInput `json:"subdivision,omitempty"`
	Unit             LaunchUnitInput         `json:"unit"`
}

type OrganizationShellResponse struct {
	OrganizationID   string `json:"organizationId"`
	OrganizationName string `json:"organizationName"`
	OrganizationRole string `json:"organizationRole"`
	InviteID         string `json:"inviteId"`
	InviteEmail      string `json:"inviteEmail"`
	InviteStatus     string `json:"inviteStatus"`
	InviteToken      string `json:"inviteToken"`
	InviteExpiresAt  string `json:"inviteExpiresAt"`
}

type InviteInspectionResponse struct {
	OrganizationID   string `json:"organizationId"`
	OrganizationName string `json:"organizationName"`
	OrganizationRole string `json:"organizationRole"`
	InviteStatus     string `json:"inviteStatus"`
	FirstAdminName   string `json:"firstAdminName"`
	InviteEmail      string `json:"inviteEmail"`
	InviteExpiresAt  string `json:"inviteExpiresAt"`
	LaunchState      string `json:"launchState"`
}

type CreateEmployeeInviteRequest struct {
	FullName     string `json:"fullName"`
	Email        string `json:"email"`
	RoleTemplate string `json:"roleTemplate"`
	ScopeType    string `json:"scopeType"`
	ScopeID      string `json:"scopeId"`
	ExpiresAt    string `json:"expiresAt"`
}

type EmployeeInviteResponse struct {
	ID           string  `json:"id"`
	FullName     string  `json:"fullName"`
	Email        string  `json:"email"`
	RoleTemplate string  `json:"roleTemplate"`
	ScopeType    string  `json:"scopeType"`
	ScopeID      string  `json:"scopeId"`
	ScopeLabel   string  `json:"scopeLabel"`
	Status       string  `json:"status"`
	InviteToken  *string `json:"inviteToken,omitempty"`
	AcceptPath   *string `json:"acceptPath,omitempty"`
	ExpiresAt    string  `json:"expiresAt"`
	SentAt       *string `json:"sentAt,omitempty"`
	OpenedAt     *string `json:"openedAt,omitempty"`
	AcceptedAt   *string `json:"acceptedAt,omitempty"`
	RevokedAt    *string `json:"revokedAt,omitempty"`
}

type PublicInviteInspectionResponse struct {
	InviteKind       string  `json:"inviteKind"`
	OrganizationID   string  `json:"organizationId"`
	OrganizationName string  `json:"organizationName"`
	OrganizationRole string  `json:"organizationRole"`
	InviteStatus     string  `json:"inviteStatus"`
	InviteeName      string  `json:"inviteeName"`
	InviteEmail      string  `json:"inviteEmail"`
	InviteExpiresAt  string  `json:"inviteExpiresAt"`
	RoleTemplate     *string `json:"roleTemplate,omitempty"`
	ScopeType        *string `json:"scopeType,omitempty"`
	ScopeLabel       *string `json:"scopeLabel,omitempty"`
	LaunchState      string  `json:"launchState"`
}

type SessionAccountResponse struct {
	ID       string `json:"id"`
	FullName string `json:"fullName"`
	Email    string `json:"email"`
}

type SessionGrantResponse struct {
	ID           string `json:"id"`
	RoleTemplate string `json:"roleTemplate"`
	ScopeType    string `json:"scopeType"`
	ScopeID      string `json:"scopeId"`
}

type SessionWorkspaceResponse struct {
	ScopeType                string `json:"scopeType"`
	ScopeID                  string `json:"scopeId"`
	ScopeName                string `json:"scopeName"`
	LandingTitle             string `json:"landingTitle"`
	LandingSubtitle          string `json:"landingSubtitle"`
	LandingPath              string `json:"landingPath"`
	CanManageEmployeeInvites bool   `json:"canManageEmployeeInvites"`
}

type SessionOrganizationResponse struct {
	ID           string  `json:"id"`
	RoleTitle    string  `json:"roleTitle"`
	Name         string  `json:"name"`
	ShortName    *string `json:"shortName,omitempty"`
	PropertyType *string `json:"propertyType,omitempty"`
	Inn          *string `json:"inn,omitempty"`
	Kpp          *string `json:"kpp,omitempty"`
	LegalAddress *string `json:"legalAddress,omitempty"`
	ContactEmail *string `json:"contactEmail,omitempty"`
	ContactPhone *string `json:"contactPhone,omitempty"`
	LaunchState  string  `json:"launchState"`
}

type SubdivisionResponse struct {
	ID   string  `json:"id"`
	Type string  `json:"type"`
	Name string  `json:"name"`
	Code *string `json:"code,omitempty"`
}

type UnitResponse struct {
	ID            string  `json:"id"`
	Type          string  `json:"type"`
	Name          string  `json:"name"`
	Code          *string `json:"code,omitempty"`
	SubdivisionID *string `json:"subdivisionId,omitempty"`
}

type SessionSummaryResponse struct {
	SessionToken         string                      `json:"sessionToken"`
	RequiresLaunchWizard bool                        `json:"requiresLaunchWizard"`
	Account              SessionAccountResponse      `json:"account"`
	MembershipID         string                      `json:"membershipId"`
	MembershipStatus     string                      `json:"membershipStatus"`
	Organization         SessionOrganizationResponse `json:"organization"`
	Grant                *SessionGrantResponse       `json:"grant,omitempty"`
	Workspace            SessionWorkspaceResponse    `json:"workspace"`
	Subdivisions         []SubdivisionResponse       `json:"subdivisions"`
	Units                []UnitResponse              `json:"units"`
}

type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}
