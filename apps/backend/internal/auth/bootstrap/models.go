package bootstrap

import "io"

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

type LaunchDivisionInput struct {
	Type        string  `json:"type,omitempty"`
	Name        string  `json:"name"`
	Region      *string `json:"region,omitempty"`
	Address     *string `json:"address,omitempty"`
	ManagerName *string `json:"managerName,omitempty"`
	Contacts    *string `json:"contacts,omitempty"`
}

type LaunchUnitInput struct {
	Type        string  `json:"type"`
	Name        string  `json:"name"`
	Address     *string `json:"address,omitempty"`
	ManagerName *string `json:"managerName,omitempty"`
	Contacts    *string `json:"contacts,omitempty"`
}

type CompleteLaunchRequest struct {
	OrganizationName string               `json:"organizationName"`
	ShortName        *string              `json:"shortName,omitempty"`
	PropertyType     string               `json:"propertyType"`
	Inn              string               `json:"inn"`
	Kpp              string               `json:"kpp"`
	LegalAddress     string               `json:"legalAddress"`
	ContactEmail     string               `json:"contactEmail"`
	ContactPhone     string               `json:"contactPhone"`
	StructureMode    string               `json:"structureMode"`
	Division         *LaunchDivisionInput `json:"division,omitempty"`
	Unit             LaunchUnitInput      `json:"unit"`
}

type CompanyProfileRequest struct {
	Type                 string  `json:"type"`
	PropertyType         *string `json:"propertyType,omitempty"`
	Name                 string  `json:"name"`
	ShortName            *string `json:"shortName,omitempty"`
	Inn                  *string `json:"inn,omitempty"`
	Kpp                  *string `json:"kpp,omitempty"`
	PostalAddress        *string `json:"postalAddress,omitempty"`
	RegisteredAddress    *string `json:"registeredAddress,omitempty"`
	Address              *string `json:"address,omitempty"`
	Ogrn                 *string `json:"ogrn,omitempty"`
	SettlementAccount    *string `json:"settlementAccount,omitempty"`
	BankName             *string `json:"bankName,omitempty"`
	CorrespondentAccount *string `json:"correspondentAccount,omitempty"`
	Bik                  *string `json:"bik,omitempty"`
	LeaderFullName       *string `json:"leaderFullName,omitempty"`
	ManagerName          *string `json:"managerName,omitempty"`
	LeaderPosition       *string `json:"leaderPosition,omitempty"`
	ContractPhone        *string `json:"contractPhone,omitempty"`
	ContractEmail        *string `json:"contractEmail,omitempty"`
	ActingBasis          *string `json:"actingBasis,omitempty"`
}

type StructureNodeRequest struct {
	Type              string  `json:"type,omitempty"`
	Name              string  `json:"name"`
	Region            *string `json:"region,omitempty"`
	Address           *string `json:"address,omitempty"`
	RegisteredAddress *string `json:"registeredAddress,omitempty"`
	LeaderFullName    *string `json:"leaderFullName,omitempty"`
	ManagerName       *string `json:"managerName,omitempty"`
	LeaderPosition    *string `json:"leaderPosition,omitempty"`
	ContractPhone     *string `json:"contractPhone,omitempty"`
	ContractEmail     *string `json:"contractEmail,omitempty"`
	ActingBasis       *string `json:"actingBasis,omitempty"`
	Contacts          *string `json:"contacts,omitempty"`
	Comment           *string `json:"comment,omitempty"`
	DivisionID        *string `json:"divisionId,omitempty"`
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

type UpdateEmployeeAccessRequest struct {
	RoleTemplate string `json:"roleTemplate"`
	ScopeType    string `json:"scopeType"`
	ScopeID      string `json:"scopeId"`
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

type EmployeeAccessResponse struct {
	AccessID         string `json:"accessId"`
	MembershipID     string `json:"membershipId"`
	AccountID        string `json:"accountId"`
	FullName         string `json:"fullName"`
	Email            string `json:"email"`
	RoleTemplate     string `json:"roleTemplate"`
	ScopeType        string `json:"scopeType"`
	ScopeID          string `json:"scopeId"`
	ScopeLabel       string `json:"scopeLabel"`
	MembershipStatus string `json:"membershipStatus"`
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
	CanViewEmployees         bool   `json:"canViewEmployees"`
	CanManageEmployees       bool   `json:"canManageEmployees"`
}

type SessionOrganizationResponse struct {
	ID                   string               `json:"id"`
	RoleTitle            string               `json:"roleTitle"`
	Type                 *string              `json:"type,omitempty"`
	Name                 string               `json:"name"`
	ShortName            *string              `json:"shortName,omitempty"`
	PropertyType         *string              `json:"propertyType,omitempty"`
	Logo                 *CompanyLogoResponse `json:"logo,omitempty"`
	Inn                  *string              `json:"inn,omitempty"`
	Kpp                  *string              `json:"kpp,omitempty"`
	LegalAddress         *string              `json:"legalAddress,omitempty"`
	PostalAddress        *string              `json:"postalAddress,omitempty"`
	RegisteredAddress    *string              `json:"registeredAddress,omitempty"`
	Address              *string              `json:"address,omitempty"`
	Ogrn                 *string              `json:"ogrn,omitempty"`
	SettlementAccount    *string              `json:"settlementAccount,omitempty"`
	BankName             *string              `json:"bankName,omitempty"`
	CorrespondentAccount *string              `json:"correspondentAccount,omitempty"`
	Bik                  *string              `json:"bik,omitempty"`
	ContactEmail         *string              `json:"contactEmail,omitempty"`
	ContactPhone         *string              `json:"contactPhone,omitempty"`
	LeaderFullName       *string              `json:"leaderFullName,omitempty"`
	ManagerName          *string              `json:"managerName,omitempty"`
	LeaderPosition       *string              `json:"leaderPosition,omitempty"`
	ContractPhone        *string              `json:"contractPhone,omitempty"`
	ContractEmail        *string              `json:"contractEmail,omitempty"`
	ActingBasis          *string              `json:"actingBasis,omitempty"`
	LaunchState          string               `json:"launchState"`
}

type CompanyLogoResponse struct {
	FileName    string `json:"fileName"`
	ContentType string `json:"contentType"`
	SizeBytes   int64  `json:"sizeBytes"`
	UpdatedAt   string `json:"updatedAt"`
	URL         string `json:"url"`
}

type CompanyLogoObject struct {
	Body        io.ReadCloser
	ContentType string
	Size        int64
	FileName    string
}

type DivisionResponse struct {
	ID                string  `json:"id"`
	Type              string  `json:"type"`
	Name              string  `json:"name"`
	Region            *string `json:"region,omitempty"`
	Address           *string `json:"address,omitempty"`
	RegisteredAddress *string `json:"registeredAddress,omitempty"`
	ManagerName       *string `json:"managerName,omitempty"`
	LeaderFullName    *string `json:"leaderFullName,omitempty"`
	Contacts          *string `json:"contacts,omitempty"`
	LeaderPosition    *string `json:"leaderPosition,omitempty"`
	ContractPhone     *string `json:"contractPhone,omitempty"`
	ContractEmail     *string `json:"contractEmail,omitempty"`
	ActingBasis       *string `json:"actingBasis,omitempty"`
	Status            string  `json:"status"`
	Comment           *string `json:"comment,omitempty"`
}

type UnitResponse struct {
	ID                string  `json:"id"`
	Type              string  `json:"type"`
	Name              string  `json:"name"`
	Region            *string `json:"region,omitempty"`
	DivisionID        *string `json:"divisionId,omitempty"`
	Address           *string `json:"address,omitempty"`
	RegisteredAddress *string `json:"registeredAddress,omitempty"`
	ManagerName       *string `json:"managerName,omitempty"`
	LeaderFullName    *string `json:"leaderFullName,omitempty"`
	Contacts          *string `json:"contacts,omitempty"`
	LeaderPosition    *string `json:"leaderPosition,omitempty"`
	ContractPhone     *string `json:"contractPhone,omitempty"`
	ContractEmail     *string `json:"contractEmail,omitempty"`
	ActingBasis       *string `json:"actingBasis,omitempty"`
	Status            string  `json:"status"`
	Comment           *string `json:"comment,omitempty"`
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
	Divisions            []DivisionResponse          `json:"divisions"`
	Units                []UnitResponse              `json:"units"`
}

type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}
