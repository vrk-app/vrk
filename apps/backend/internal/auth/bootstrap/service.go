package bootstrap

import (
	"context"
	"strings"
	"time"

	"backend/internal/db/generated"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"golang.org/x/crypto/bcrypt"
)

const (
	defaultOrganizationRole = "customer"
	defaultDivisionType     = "division"
	inviteLifetime          = 7 * 24 * time.Hour
	sessionLifetime         = 24 * time.Hour
)

var allowedOrganizationPropertyTypes = map[string]struct{}{
	"ООО": {},
	"АО":  {},
	"ПАО": {},
}

var allowedUnitTypes = map[string]struct{}{
	"ВРД": {},
	"ВРЗ": {},
	"ВУ":  {},
	"ВРП": {},
}

type Service interface {
	CreateOrganizationShell(ctx context.Context, req CreateOrganizationShellRequest) (*OrganizationShellResponse, error)
	InspectInvite(ctx context.Context, token string) (*InviteInspectionResponse, error)
	AcceptInvite(ctx context.Context, token string, req AcceptInviteRequest) (*SessionSummaryResponse, error)
	InspectPublicInvite(ctx context.Context, token string) (*PublicInviteInspectionResponse, error)
	AcceptPublicInvite(ctx context.Context, token string, req AcceptInviteRequest) (*SessionSummaryResponse, error)
	CreateEmployeeInvite(ctx context.Context, token string, req CreateEmployeeInviteRequest) (*EmployeeInviteResponse, error)
	ListEmployeeInvites(ctx context.Context, token string) ([]EmployeeInviteResponse, error)
	SendEmployeeInvite(ctx context.Context, token string, inviteID string) (*EmployeeInviteResponse, error)
	RevokeEmployeeInvite(ctx context.Context, token string, inviteID string) (*EmployeeInviteResponse, error)
	ListEmployees(ctx context.Context, token string) ([]EmployeeAccessResponse, error)
	UpdateEmployeeAccess(ctx context.Context, token string, accessID string, req UpdateEmployeeAccessRequest) (*EmployeeAccessResponse, error)
	DeactivateEmployee(ctx context.Context, token string, accessID string) (*EmployeeAccessResponse, error)
	CreateSession(ctx context.Context, req CreateSessionRequest) (*SessionSummaryResponse, error)
	GetSession(ctx context.Context, token string) (*SessionSummaryResponse, error)
	DeleteSession(ctx context.Context, token string) error
	CompleteLaunch(ctx context.Context, token string, req CompleteLaunchRequest) (*SessionSummaryResponse, error)
	UpdateCompanyProfile(ctx context.Context, token string, req CompanyProfileRequest) (*SessionSummaryResponse, error)
	CreateDivision(ctx context.Context, token string, req StructureNodeRequest) (*SessionSummaryResponse, error)
	UpdateDivision(ctx context.Context, token string, divisionID string, req StructureNodeRequest) (*SessionSummaryResponse, error)
	ArchiveDivision(ctx context.Context, token string, divisionID string) (*SessionSummaryResponse, error)
	CreateUnit(ctx context.Context, token string, req StructureNodeRequest) (*SessionSummaryResponse, error)
	UpdateUnit(ctx context.Context, token string, unitID string, req StructureNodeRequest) (*SessionSummaryResponse, error)
	ArchiveUnit(ctx context.Context, token string, unitID string) (*SessionSummaryResponse, error)
}

type service struct {
	repository Repository
	queries    *generated.Queries
}

func NewService(repository Repository, queries *generated.Queries) Service {
	return &service{repository: repository, queries: queries}
}

func (s *service) CreateOrganizationShell(ctx context.Context, req CreateOrganizationShellRequest) (*OrganizationShellResponse, error) {
	req.OrganizationName = strings.TrimSpace(req.OrganizationName)
	req.FirstAdminName = strings.TrimSpace(req.FirstAdminName)
	req.FirstAdminEmail = strings.ToLower(strings.TrimSpace(req.FirstAdminEmail))
	req.OrganizationRole = strings.TrimSpace(req.OrganizationRole)
	if req.OrganizationRole == "" {
		req.OrganizationRole = defaultOrganizationRole
	}

	if req.OrganizationName == "" {
		return nil, ErrOrganizationNameRequired
	}
	if req.FirstAdminName == "" {
		return nil, ErrFirstAdminNameRequired
	}
	if req.FirstAdminEmail == "" {
		return nil, ErrEmailRequired
	}
	if !looksLikeEmail(req.FirstAdminEmail) {
		return nil, ErrInvalidEmail
	}
	if req.OrganizationRole != "customer" && req.OrganizationRole != "contractor" {
		return nil, ErrInvalidOrganizationRole
	}

	inviteToken := uuid.NewString()
	bundle, err := s.repository.CreateOrganizationShell(ctx, req, inviteToken, time.Now().Add(inviteLifetime))
	if err != nil {
		return nil, err
	}

	return &OrganizationShellResponse{
		OrganizationID:   uuidFromPG(bundle.Organization.ID).String(),
		OrganizationName: bundle.Organization.ShellName,
		OrganizationRole: bundle.Organization.RoleTitle,
		InviteID:         uuidFromPG(bundle.Invite.ID).String(),
		InviteEmail:      bundle.Invite.Email,
		InviteStatus:     bundle.Invite.Status,
		InviteToken:      bundle.Invite.InviteToken,
		InviteExpiresAt:  bundle.Invite.ExpiresAt.Time.UTC().Format(time.RFC3339),
	}, nil
}

func (s *service) InspectInvite(ctx context.Context, token string) (*InviteInspectionResponse, error) {
	invite, err := s.repository.GetInviteByToken(ctx, strings.TrimSpace(token))
	if err != nil {
		return nil, err
	}

	if invite.ExpiresAt.Valid && invite.ExpiresAt.Time.Before(time.Now()) && invite.Status != "accepted" {
		_ = s.repository.MarkInviteExpired(ctx, uuidFromPG(invite.ID))
		invite.Status = "expired"
	}

	switch invite.Status {
	case "accepted":
		return nil, ErrInviteAlreadyAccepted
	case "expired":
		return nil, ErrInviteExpired
	case "revoked":
		return nil, ErrInviteRevoked
	case "sent":
		if err := s.repository.MarkInviteOpened(ctx, uuidFromPG(invite.ID)); err == nil {
			invite.Status = "opened"
		}
	}

	return &InviteInspectionResponse{
		OrganizationID:   uuidFromPG(invite.OrganizationID).String(),
		OrganizationName: invite.OrganizationShellName,
		OrganizationRole: invite.OrganizationRoleTitle,
		InviteStatus:     invite.Status,
		FirstAdminName:   invite.FullName,
		InviteEmail:      invite.Email,
		InviteExpiresAt:  invite.ExpiresAt.Time.UTC().Format(time.RFC3339),
		LaunchState:      invite.OrganizationLaunchState,
	}, nil
}

func (s *service) AcceptInvite(ctx context.Context, token string, req AcceptInviteRequest) (*SessionSummaryResponse, error) {
	passwordHash, err := hashInvitePassword(req.Password)
	if err != nil {
		return nil, err
	}

	invite, err := s.repository.GetInviteByToken(ctx, strings.TrimSpace(token))
	if err != nil {
		return nil, err
	}

	if invite.ExpiresAt.Valid && invite.ExpiresAt.Time.Before(time.Now()) && invite.Status != "accepted" {
		_ = s.repository.MarkInviteExpired(ctx, uuidFromPG(invite.ID))
		return nil, ErrInviteExpired
	}

	switch invite.Status {
	case "accepted":
		return nil, ErrInviteAlreadyAccepted
	case "expired":
		return nil, ErrInviteExpired
	case "revoked":
		return nil, ErrInviteRevoked
	}

	snapshot, err := s.repository.AcceptInvite(ctx, invite, string(passwordHash), uuid.NewString(), time.Now().Add(sessionLifetime))
	if err != nil {
		return nil, err
	}

	return mapSessionSummary(snapshot), nil
}

func (s *service) InspectPublicInvite(ctx context.Context, token string) (*PublicInviteInspectionResponse, error) {
	token = strings.TrimSpace(token)
	if token == "" {
		return nil, ErrInviteNotFound
	}

	employeeInvite, err := s.repository.GetEmployeeInviteByToken(ctx, token)
	if err == nil {
		return s.inspectEmployeeInvite(ctx, employeeInvite)
	}
	if err != ErrInviteNotFound {
		return nil, err
	}

	firstAdminInvite, err := s.repository.GetInviteByToken(ctx, token)
	if err != nil {
		return nil, err
	}

	inspection, err := s.InspectInvite(ctx, token)
	if err != nil {
		return nil, err
	}

	return &PublicInviteInspectionResponse{
		InviteKind:       "first_admin",
		OrganizationID:   inspection.OrganizationID,
		OrganizationName: inspection.OrganizationName,
		OrganizationRole: inspection.OrganizationRole,
		InviteStatus:     inspection.InviteStatus,
		InviteeName:      inspection.FirstAdminName,
		InviteEmail:      inspection.InviteEmail,
		InviteExpiresAt:  inspection.InviteExpiresAt,
		LaunchState:      firstAdminInvite.OrganizationLaunchState,
	}, nil
}

func (s *service) AcceptPublicInvite(ctx context.Context, token string, req AcceptInviteRequest) (*SessionSummaryResponse, error) {
	token = strings.TrimSpace(token)
	if token == "" {
		return nil, ErrInviteNotFound
	}

	passwordHash, err := hashInvitePassword(req.Password)
	if err != nil {
		return nil, err
	}

	employeeInvite, err := s.repository.GetEmployeeInviteByToken(ctx, token)
	if err == nil {
		if employeeInvite.ExpiresAt.Valid && employeeInvite.ExpiresAt.Time.Before(time.Now()) && employeeInvite.Status != "accepted" {
			_ = s.repository.MarkEmployeeInviteExpired(ctx, uuidFromPG(employeeInvite.ID))
			return nil, ErrInviteExpired
		}

		switch employeeInvite.Status {
		case "draft":
			return nil, ErrInviteDraftRequired
		case "accepted":
			return nil, ErrInviteAlreadyAccepted
		case "expired":
			return nil, ErrInviteExpired
		case "revoked":
			return nil, ErrInviteRevoked
		}

		snapshot, err := s.repository.AcceptEmployeeInvite(ctx, employeeInvite, string(passwordHash), uuid.NewString(), time.Now().Add(sessionLifetime))
		if err != nil {
			return nil, err
		}
		return mapSessionSummary(snapshot), nil
	}
	if err != ErrInviteNotFound {
		return nil, err
	}

	return s.AcceptInvite(ctx, token, req)
}

func (s *service) CreateEmployeeInvite(ctx context.Context, token string, req CreateEmployeeInviteRequest) (*EmployeeInviteResponse, error) {
	snapshot, err := s.authorizeInviteManager(ctx, token)
	if err != nil {
		return nil, err
	}

	expiresAt, err := s.normalizeEmployeeInviteRequest(snapshot, &req)
	if err != nil {
		return nil, err
	}

	invite, err := s.repository.CreateEmployeeInviteDraft(ctx, snapshot, req, expiresAt)
	if err != nil {
		return nil, err
	}

	return s.mapEmployeeInvite(ctx, snapshot, invite), nil
}

func (s *service) ListEmployeeInvites(ctx context.Context, token string) ([]EmployeeInviteResponse, error) {
	snapshot, err := s.authorizeInviteManager(ctx, token)
	if err != nil {
		return nil, err
	}

	invites, err := s.repository.ListEmployeeInvites(ctx, snapshot)
	if err != nil {
		return nil, err
	}

	result := make([]EmployeeInviteResponse, 0, len(invites))
	now := time.Now()
	for _, invite := range invites {
		if invite.ExpiresAt.Valid && invite.ExpiresAt.Time.Before(now) && (invite.Status == "sent" || invite.Status == "opened") {
			_ = s.repository.MarkEmployeeInviteExpired(ctx, uuidFromPG(invite.ID))
			invite.Status = "expired"
		}
		result = append(result, *s.mapEmployeeInvite(ctx, snapshot, &invite))
	}

	return result, nil
}

func (s *service) SendEmployeeInvite(ctx context.Context, token string, inviteID string) (*EmployeeInviteResponse, error) {
	snapshot, err := s.authorizeInviteManager(ctx, token)
	if err != nil {
		return nil, err
	}

	id, err := uuid.Parse(strings.TrimSpace(inviteID))
	if err != nil {
		return nil, ErrInviteNotFound
	}

	invite, err := s.repository.GetEmployeeInviteByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if !samePGUUID(invite.OrganizationID, snapshot.SessionRow.OrganizationID) {
		return nil, ErrForbidden
	}
	if invite.Status != "draft" {
		return nil, ErrInviteSendNotAllowed
	}
	if invite.ExpiresAt.Valid && !invite.ExpiresAt.Time.After(time.Now()) {
		return nil, ErrInviteExpiryInvalid
	}

	invite, err = s.repository.SendEmployeeInvite(ctx, id, uuid.NewString())
	if err != nil {
		return nil, err
	}

	return s.mapEmployeeInvite(ctx, snapshot, invite), nil
}

func (s *service) RevokeEmployeeInvite(ctx context.Context, token string, inviteID string) (*EmployeeInviteResponse, error) {
	snapshot, err := s.authorizeInviteManager(ctx, token)
	if err != nil {
		return nil, err
	}

	id, err := uuid.Parse(strings.TrimSpace(inviteID))
	if err != nil {
		return nil, ErrInviteNotFound
	}

	invite, err := s.repository.GetEmployeeInviteByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if !samePGUUID(invite.OrganizationID, snapshot.SessionRow.OrganizationID) {
		return nil, ErrForbidden
	}
	if invite.Status != "draft" && invite.Status != "sent" && invite.Status != "opened" {
		return nil, ErrInviteRevokeNotAllowed
	}

	invite, err = s.repository.RevokeEmployeeInvite(ctx, id)
	if err != nil {
		return nil, err
	}

	return s.mapEmployeeInvite(ctx, snapshot, invite), nil
}

func (s *service) ListEmployees(ctx context.Context, token string) ([]EmployeeAccessResponse, error) {
	snapshot, err := s.authorizeEmployeeViewer(ctx, token)
	if err != nil {
		return nil, err
	}

	records, err := s.repository.ListEmployeeAccessRows(ctx, snapshot)
	if err != nil {
		return nil, err
	}

	result := make([]EmployeeAccessResponse, 0, len(records))
	for _, record := range records {
		result = append(result, *s.mapEmployeeAccess(ctx, snapshot, record))
	}
	return result, nil
}

func (s *service) UpdateEmployeeAccess(ctx context.Context, token string, accessID string, req UpdateEmployeeAccessRequest) (*EmployeeAccessResponse, error) {
	snapshot, err := s.authorizeEmployeeManager(ctx, token)
	if err != nil {
		return nil, err
	}

	id, err := parseRequiredUUID(accessID)
	if err != nil {
		return nil, err
	}
	if isCurrentSessionAccess(snapshot, id) {
		return nil, ErrEmployeeAccessSelfMutation
	}
	if err := normalizeEmployeeAccessUpdateRequest(snapshot, &req); err != nil {
		return nil, err
	}

	record, err := s.repository.UpdateEmployeeAccess(ctx, snapshot, id, req)
	if err != nil {
		return nil, err
	}
	return s.mapEmployeeAccess(ctx, snapshot, *record), nil
}

func (s *service) DeactivateEmployee(ctx context.Context, token string, accessID string) (*EmployeeAccessResponse, error) {
	snapshot, err := s.authorizeEmployeeManager(ctx, token)
	if err != nil {
		return nil, err
	}

	id, err := parseRequiredUUID(accessID)
	if err != nil {
		return nil, err
	}
	if isCurrentSessionAccess(snapshot, id) {
		return nil, ErrEmployeeAccessSelfMutation
	}

	record, err := s.repository.DeactivateEmployeeAccess(ctx, snapshot, id)
	if err != nil {
		return nil, err
	}
	return s.mapEmployeeAccess(ctx, snapshot, *record), nil
}

func (s *service) CreateSession(ctx context.Context, req CreateSessionRequest) (*SessionSummaryResponse, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))
	password := strings.TrimSpace(req.Password)
	if email == "" || password == "" {
		return nil, ErrInvalidCredentials
	}

	account, err := s.queries.GetAuthAccountByEmail(ctx, email)
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(account.PasswordHash), []byte(password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	snapshot, err := s.repository.CreateSession(ctx, uuidFromPG(account.ID), uuid.NewString(), time.Now().Add(sessionLifetime))
	if err != nil {
		return nil, err
	}

	return mapSessionSummary(snapshot), nil
}

func (s *service) GetSession(ctx context.Context, token string) (*SessionSummaryResponse, error) {
	snapshot, err := s.repository.GetSession(ctx, strings.TrimSpace(token))
	if err != nil {
		return nil, err
	}

	return mapSessionSummary(snapshot), nil
}

func (s *service) DeleteSession(ctx context.Context, token string) error {
	if strings.TrimSpace(token) == "" {
		return nil
	}

	return s.repository.DeleteSession(ctx, strings.TrimSpace(token))
}

func (s *service) CompleteLaunch(ctx context.Context, token string, req CompleteLaunchRequest) (*SessionSummaryResponse, error) {
	req.OrganizationName = strings.TrimSpace(req.OrganizationName)
	req.PropertyType = strings.TrimSpace(req.PropertyType)
	req.Inn = strings.TrimSpace(req.Inn)
	req.Kpp = strings.TrimSpace(req.Kpp)
	req.LegalAddress = strings.TrimSpace(req.LegalAddress)
	req.ContactEmail = strings.ToLower(strings.TrimSpace(req.ContactEmail))
	req.ContactPhone = strings.TrimSpace(req.ContactPhone)
	req.StructureMode = strings.TrimSpace(req.StructureMode)
	req.Unit.Name = strings.TrimSpace(req.Unit.Name)
	req.Unit.Type = strings.TrimSpace(req.Unit.Type)
	if req.Division != nil {
		req.Division.Name = strings.TrimSpace(req.Division.Name)
		req.Division.Type = strings.TrimSpace(req.Division.Type)
	}

	if req.OrganizationName == "" {
		return nil, ErrOrganizationNameRequired
	}
	if req.PropertyType == "" {
		return nil, ErrPropertyTypeRequired
	}
	propertyType, err := normalizeOrganizationPropertyType(req.PropertyType)
	if err != nil {
		return nil, err
	}
	req.PropertyType = propertyType
	if req.Inn == "" {
		return nil, ErrInnRequired
	}
	if req.Kpp == "" {
		return nil, ErrKppRequired
	}
	if req.LegalAddress == "" {
		return nil, ErrLegalAddressRequired
	}
	if req.ContactEmail == "" || !looksLikeEmail(req.ContactEmail) {
		return nil, ErrInvalidEmail
	}
	if req.ContactPhone == "" {
		return nil, ErrContactPhoneRequired
	}
	if req.Unit.Name == "" {
		return nil, ErrUnitNameRequired
	}
	if req.Unit.Type == "" {
		return nil, ErrUnitTypeRequired
	}
	if _, ok := allowedUnitTypes[req.Unit.Type]; !ok {
		return nil, ErrStructureTypeInvalid
	}
	if req.StructureMode != "division" && req.StructureMode != "unit" {
		return nil, ErrStructureModeInvalid
	}
	if req.StructureMode == "division" {
		if req.Division == nil {
			return nil, ErrDivisionNameRequired
		}
		if req.Division.Name == "" {
			return nil, ErrDivisionNameRequired
		}
		req.Division.Type = defaultDivisionType
	}

	snapshot, err := s.repository.GetSession(ctx, strings.TrimSpace(token))
	if err != nil {
		return nil, err
	}
	if snapshot.SessionRow.OrganizationLaunchState == "active" &&
		!snapshotHasCapability(snapshot, CapabilityManageStructure) {
		return nil, ErrForbidden
	}

	updated, err := s.repository.CompleteLaunch(ctx, snapshot, req)
	if err != nil {
		return nil, err
	}

	return mapSessionSummary(updated), nil
}

func (s *service) UpdateCompanyProfile(ctx context.Context, token string, req CompanyProfileRequest) (*SessionSummaryResponse, error) {
	snapshot, err := s.authorizeCompanyStructureManager(ctx, token)
	if err != nil {
		return nil, err
	}
	if err := normalizeCompanyProfileRequest(&req); err != nil {
		return nil, err
	}

	updated, err := s.repository.UpdateCompanyProfile(ctx, snapshot, req)
	if err != nil {
		return nil, err
	}
	return mapSessionSummary(updated), nil
}

func (s *service) CreateDivision(ctx context.Context, token string, req StructureNodeRequest) (*SessionSummaryResponse, error) {
	snapshot, err := s.authorizeCompanyStructureManager(ctx, token)
	if err != nil {
		return nil, err
	}
	if err := normalizeStructureNodeRequest(&req, false, snapshot, ErrDivisionNameRequired); err != nil {
		return nil, err
	}

	updated, err := s.repository.CreateDivision(ctx, snapshot, req)
	if err != nil {
		return nil, err
	}
	return mapSessionSummary(updated), nil
}

func (s *service) UpdateDivision(ctx context.Context, token string, divisionID string, req StructureNodeRequest) (*SessionSummaryResponse, error) {
	snapshot, err := s.authorizeCompanyStructureManager(ctx, token)
	if err != nil {
		return nil, err
	}
	id, err := parseRequiredUUID(divisionID)
	if err != nil {
		return nil, err
	}
	if err := normalizeStructureNodeRequest(&req, false, snapshot, ErrDivisionNameRequired); err != nil {
		return nil, err
	}

	updated, err := s.repository.UpdateDivision(ctx, snapshot, id, req)
	if err != nil {
		return nil, err
	}
	return mapSessionSummary(updated), nil
}

func (s *service) ArchiveDivision(ctx context.Context, token string, divisionID string) (*SessionSummaryResponse, error) {
	snapshot, err := s.authorizeCompanyStructureManager(ctx, token)
	if err != nil {
		return nil, err
	}
	id, err := parseRequiredUUID(divisionID)
	if err != nil {
		return nil, err
	}

	updated, err := s.repository.ArchiveDivision(ctx, snapshot, id)
	if err != nil {
		return nil, err
	}
	return mapSessionSummary(updated), nil
}

func (s *service) CreateUnit(ctx context.Context, token string, req StructureNodeRequest) (*SessionSummaryResponse, error) {
	snapshot, err := s.authorizeCompanyStructureManager(ctx, token)
	if err != nil {
		return nil, err
	}
	if err := normalizeStructureNodeRequest(&req, true, snapshot, ErrUnitNameRequired); err != nil {
		return nil, err
	}

	updated, err := s.repository.CreateUnit(ctx, snapshot, req)
	if err != nil {
		return nil, err
	}
	return mapSessionSummary(updated), nil
}

func (s *service) UpdateUnit(ctx context.Context, token string, unitID string, req StructureNodeRequest) (*SessionSummaryResponse, error) {
	snapshot, err := s.authorizeCompanyStructureManager(ctx, token)
	if err != nil {
		return nil, err
	}
	id, err := parseRequiredUUID(unitID)
	if err != nil {
		return nil, err
	}
	if err := normalizeStructureNodeRequest(&req, true, snapshot, ErrUnitNameRequired); err != nil {
		return nil, err
	}

	updated, err := s.repository.UpdateUnit(ctx, snapshot, id, req)
	if err != nil {
		return nil, err
	}
	return mapSessionSummary(updated), nil
}

func (s *service) ArchiveUnit(ctx context.Context, token string, unitID string) (*SessionSummaryResponse, error) {
	snapshot, err := s.authorizeCompanyStructureManager(ctx, token)
	if err != nil {
		return nil, err
	}
	id, err := parseRequiredUUID(unitID)
	if err != nil {
		return nil, err
	}

	updated, err := s.repository.ArchiveUnit(ctx, snapshot, id)
	if err != nil {
		return nil, err
	}
	return mapSessionSummary(updated), nil
}

func (s *service) authorizeCompanyStructureManager(ctx context.Context, token string) (*sessionSnapshot, error) {
	snapshot, err := s.repository.GetSession(ctx, strings.TrimSpace(token))
	if err != nil {
		return nil, err
	}
	if snapshot.SessionRow.OrganizationLaunchState != "active" {
		return nil, ErrLaunchRequired
	}
	if snapshot.SessionRow.OrganizationRoleTitle != "customer" ||
		!snapshotHasCapability(snapshot, CapabilityManageStructure) {
		return nil, ErrForbidden
	}
	return snapshot, nil
}

func (s *service) authorizeInviteManager(ctx context.Context, token string) (*sessionSnapshot, error) {
	snapshot, err := s.repository.GetSession(ctx, strings.TrimSpace(token))
	if err != nil {
		return nil, err
	}
	if snapshot.SessionRow.OrganizationLaunchState != "active" {
		return nil, ErrLaunchRequired
	}
	if !canManageEmployeeInvites(snapshot) {
		return nil, ErrForbidden
	}
	return snapshot, nil
}

func (s *service) authorizeEmployeeViewer(ctx context.Context, token string) (*sessionSnapshot, error) {
	snapshot, err := s.repository.GetSession(ctx, strings.TrimSpace(token))
	if err != nil {
		return nil, err
	}
	if snapshot.SessionRow.OrganizationLaunchState != "active" {
		return nil, ErrLaunchRequired
	}
	if snapshot.SessionRow.OrganizationRoleTitle != "customer" || !canViewEmployees(snapshot) {
		return nil, ErrForbidden
	}
	return snapshot, nil
}

func (s *service) authorizeEmployeeManager(ctx context.Context, token string) (*sessionSnapshot, error) {
	snapshot, err := s.repository.GetSession(ctx, strings.TrimSpace(token))
	if err != nil {
		return nil, err
	}
	if snapshot.SessionRow.OrganizationLaunchState != "active" {
		return nil, ErrLaunchRequired
	}
	if snapshot.SessionRow.OrganizationRoleTitle != "customer" || !canManageEmployees(snapshot) {
		return nil, ErrForbidden
	}
	return snapshot, nil
}

func (s *service) normalizeEmployeeInviteRequest(snapshot *sessionSnapshot, req *CreateEmployeeInviteRequest) (time.Time, error) {
	req.FullName = strings.TrimSpace(req.FullName)
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.RoleTemplate = strings.TrimSpace(req.RoleTemplate)
	req.ScopeType = strings.TrimSpace(req.ScopeType)
	req.ScopeID = strings.TrimSpace(req.ScopeID)
	req.ExpiresAt = strings.TrimSpace(req.ExpiresAt)

	if req.FullName == "" {
		return time.Time{}, ErrEmployeeNameRequired
	}
	if req.Email == "" {
		return time.Time{}, ErrEmailRequired
	}
	if !looksLikeEmail(req.Email) {
		return time.Time{}, ErrInvalidEmail
	}
	if req.RoleTemplate == "" {
		return time.Time{}, ErrInviteRoleTemplateRequired
	}
	if _, ok := allowedRoleTemplates[req.RoleTemplate]; !ok {
		return time.Time{}, ErrInviteRoleTemplateInvalid
	}
	if req.ScopeType != ScopeOrganization && req.ScopeType != ScopeDivision && req.ScopeType != ScopeUnit {
		return time.Time{}, ErrInviteScopeTypeInvalid
	}
	if !IsRoleScopeCompatible(req.RoleTemplate, req.ScopeType) {
		return time.Time{}, ErrInviteRoleScopeInvalid
	}
	if req.ScopeID == "" {
		return time.Time{}, ErrInviteScopeTargetRequired
	}
	if !scopeExistsInSnapshot(snapshot, req.ScopeType, req.ScopeID) {
		return time.Time{}, ErrInviteScopeTargetInvalid
	}
	if req.ExpiresAt == "" {
		return time.Time{}, ErrInviteExpiryRequired
	}

	expiresAt, err := time.Parse(time.RFC3339, req.ExpiresAt)
	if err != nil || !expiresAt.After(time.Now()) {
		return time.Time{}, ErrInviteExpiryInvalid
	}

	return expiresAt, nil
}

func normalizeEmployeeAccessUpdateRequest(snapshot *sessionSnapshot, req *UpdateEmployeeAccessRequest) error {
	req.RoleTemplate = strings.TrimSpace(req.RoleTemplate)
	req.ScopeType = strings.TrimSpace(req.ScopeType)
	req.ScopeID = strings.TrimSpace(req.ScopeID)

	if req.RoleTemplate == "" {
		return ErrInviteRoleTemplateRequired
	}
	if _, ok := allowedRoleTemplates[req.RoleTemplate]; !ok {
		return ErrInviteRoleTemplateInvalid
	}
	if req.ScopeType != ScopeOrganization && req.ScopeType != ScopeDivision && req.ScopeType != ScopeUnit {
		return ErrInviteScopeTypeInvalid
	}
	if !IsRoleScopeCompatible(req.RoleTemplate, req.ScopeType) {
		return ErrInviteRoleScopeInvalid
	}
	if req.ScopeID == "" {
		return ErrInviteScopeTargetRequired
	}
	if _, err := uuid.Parse(req.ScopeID); err != nil {
		return ErrInviteScopeTargetInvalid
	}
	if !scopeExistsInSnapshot(snapshot, req.ScopeType, req.ScopeID) {
		return ErrInviteScopeTargetInvalid
	}

	return nil
}

func (s *service) inspectEmployeeInvite(ctx context.Context, invite *generated.GetEmployeeInviteByTokenRow) (*PublicInviteInspectionResponse, error) {
	if invite.ExpiresAt.Valid && invite.ExpiresAt.Time.Before(time.Now()) && invite.Status != "accepted" {
		_ = s.repository.MarkEmployeeInviteExpired(ctx, uuidFromPG(invite.ID))
		invite.Status = "expired"
	}

	switch invite.Status {
	case "draft":
		return nil, ErrInviteDraftRequired
	case "accepted":
		return nil, ErrInviteAlreadyAccepted
	case "expired":
		return nil, ErrInviteExpired
	case "revoked":
		return nil, ErrInviteRevoked
	case "sent":
		if err := s.repository.MarkEmployeeInviteOpened(ctx, uuidFromPG(invite.ID)); err == nil {
			invite.Status = "opened"
		}
	}

	scopeLabel := s.resolveScopeLabel(ctx, invite.OrganizationID, invite.ScopeType, invite.ScopeID, invite.OrganizationShellName, nil)

	return &PublicInviteInspectionResponse{
		InviteKind:       "employee",
		OrganizationID:   uuidFromPG(invite.OrganizationID).String(),
		OrganizationName: invite.OrganizationShellName,
		OrganizationRole: invite.OrganizationRoleTitle,
		InviteStatus:     invite.Status,
		InviteeName:      invite.FullName,
		InviteEmail:      invite.Email,
		InviteExpiresAt:  invite.ExpiresAt.Time.UTC().Format(time.RFC3339),
		RoleTemplate:     stringPointer(invite.RoleTemplate),
		ScopeType:        stringPointer(invite.ScopeType),
		ScopeLabel:       stringPointer(scopeLabel),
		LaunchState:      invite.OrganizationLaunchState,
	}, nil
}

func mapSessionSummary(snapshot *sessionSnapshot) *SessionSummaryResponse {
	session := snapshot.SessionRow

	response := &SessionSummaryResponse{
		SessionToken:         session.SessionToken,
		RequiresLaunchWizard: session.OrganizationLaunchState != "active",
		Account: SessionAccountResponse{
			ID:       uuidFromPG(session.AccountID).String(),
			FullName: session.AccountFullName,
			Email:    session.AccountEmail,
		},
		MembershipID:     uuidFromPG(session.MembershipID).String(),
		MembershipStatus: session.MembershipStatus,
		Organization: SessionOrganizationResponse{
			ID:                uuidFromPG(session.OrganizationID).String(),
			RoleTitle:         session.OrganizationRoleTitle,
			Type:              session.OrganizationPropertyType,
			Name:              session.OrganizationShellName,
			ShortName:         session.OrganizationShortName,
			PropertyType:      session.OrganizationPropertyType,
			Inn:               session.OrganizationInn,
			Kpp:               session.OrganizationKpp,
			LegalAddress:      session.OrganizationLegalAddress,
			RegisteredAddress: session.OrganizationLegalAddress,
			Address:           session.OrganizationLegalAddress,
			ContactEmail:      session.OrganizationContactEmail,
			ContactPhone:      session.OrganizationContactPhone,
			LeaderFullName:    session.OrganizationLeaderFullName,
			ManagerName:       session.OrganizationLeaderFullName,
			LeaderPosition:    session.OrganizationLeaderPosition,
			ContractPhone:     coalesceStringPointer(session.OrganizationContractPhone, session.OrganizationContactPhone),
			ContractEmail:     coalesceStringPointer(session.OrganizationContractEmail, session.OrganizationContactEmail),
			ActingBasis:       session.OrganizationActingBasis,
			LaunchState:       session.OrganizationLaunchState,
		},
		Divisions: []DivisionResponse{},
		Units:     []UnitResponse{},
	}

	if session.GrantID.Valid && session.GrantScopeID.Valid {
		response.Grant = &SessionGrantResponse{
			ID:           uuidFromPG(session.GrantID).String(),
			RoleTemplate: session.GrantRoleTemplate,
			ScopeType:    session.GrantScopeType,
			ScopeID:      uuidFromPG(session.GrantScopeID).String(),
		}
	}

	for _, division := range snapshot.Divisions {
		response.Divisions = append(response.Divisions, DivisionResponse{
			ID:                uuidFromPG(division.ID).String(),
			Type:              division.DivisionType,
			Name:              division.Name,
			Code:              division.Code,
			Region:            division.Region,
			Address:           division.Address,
			RegisteredAddress: division.Address,
			ManagerName:       division.ManagerName,
			LeaderFullName:    division.ManagerName,
			Contacts:          division.Contacts,
			LeaderPosition:    division.LeaderPosition,
			ContractPhone:     division.ContractPhone,
			ContractEmail:     division.ContractEmail,
			ActingBasis:       division.ActingBasis,
			Status:            division.Status,
			Comment:           division.Comment,
		})
	}

	for _, unit := range snapshot.Units {
		var divisionID *string
		if unit.DivisionID.Valid {
			value := uuidFromPG(unit.DivisionID).String()
			divisionID = &value
		}

		response.Units = append(response.Units, UnitResponse{
			ID:                uuidFromPG(unit.ID).String(),
			Type:              unit.UnitType,
			Name:              unit.Name,
			Code:              unit.Code,
			Region:            unit.Region,
			DivisionID:        divisionID,
			Address:           unit.Address,
			RegisteredAddress: unit.Address,
			ManagerName:       unit.ManagerName,
			LeaderFullName:    unit.ManagerName,
			Contacts:          unit.Contacts,
			LeaderPosition:    unit.LeaderPosition,
			ContractPhone:     unit.ContractPhone,
			ContractEmail:     unit.ContractEmail,
			ActingBasis:       unit.ActingBasis,
			Status:            unit.Status,
			Comment:           unit.Comment,
		})
	}

	response.Workspace = resolveWorkspace(snapshot)

	return response
}

func resolveWorkspace(snapshot *sessionSnapshot) SessionWorkspaceResponse {
	session := snapshot.SessionRow
	roleTemplate := session.GrantRoleTemplate
	scopeType := ScopeOrganization
	scopeID := uuid.Nil.String()
	if session.GrantScopeType != "" {
		scopeType = session.GrantScopeType
	}
	if session.GrantScopeID.Valid {
		scopeID = uuidFromPG(session.GrantScopeID).String()
	}

	workspace := SessionWorkspaceResponse{
		ScopeType:                scopeType,
		ScopeID:                  scopeID,
		ScopeName:                session.OrganizationShellName,
		LandingTitle:             session.OrganizationShellName,
		LandingSubtitle:          "Доступ уровня organization: доступны подразделения и юниты организации.",
		LandingPath:              "/company",
		CanManageEmployeeInvites: canManageEmployeeInvites(snapshot),
		CanViewEmployees:         canViewEmployees(snapshot),
		CanManageEmployees:       canManageEmployees(snapshot),
	}

	if session.OrganizationRoleTitle == "contractor" && session.OrganizationLaunchState == "active" {
		workspace.LandingPath = "/contracts"
		workspace.LandingSubtitle = "После входа открывается договорный контур подрядчика без раскрытия broader customer graph."
	}

	switch scopeType {
	case ScopeDivision:
		if len(snapshot.Divisions) > 0 {
			workspace.ScopeName = snapshot.Divisions[0].Name
			workspace.LandingTitle = snapshot.Divisions[0].Name
		} else {
			workspace.ScopeName = "Подразделение"
			workspace.LandingTitle = "Подразделение"
		}
		workspace.LandingSubtitle = "Доступ ограничен выбранным подразделением и его дочерними юнитами."
	case ScopeUnit:
		if len(snapshot.Units) > 0 {
			workspace.ScopeName = snapshot.Units[0].Name
			workspace.LandingTitle = snapshot.Units[0].Name
		} else {
			workspace.ScopeName = "Юнит"
			workspace.LandingTitle = "Юнит"
		}
		workspace.LandingSubtitle = "Доступ ограничен выбранным юнитом без расширения вверх по иерархии."
	default:
		if roleTemplate == RoleOrganizationAdmin {
			workspace.LandingSubtitle = "Администратор организации видит полный org graph и может управлять приглашениями сотрудников."
		}
	}

	return workspace
}

func canManageEmployeeInvites(snapshot *sessionSnapshot) bool {
	return snapshot != nil &&
		snapshot.SessionRow.OrganizationRoleTitle == "customer" &&
		snapshotHasCapability(snapshot, CapabilityManageAccess)
}

func canViewEmployees(snapshot *sessionSnapshot) bool {
	return snapshot != nil &&
		snapshot.SessionRow.OrganizationRoleTitle == "customer" &&
		snapshotHasCapability(snapshot, CapabilityViewEmployees)
}

func canManageEmployees(snapshot *sessionSnapshot) bool {
	return snapshot != nil &&
		snapshot.SessionRow.OrganizationRoleTitle == "customer" &&
		snapshotHasCapability(snapshot, CapabilityManageEmployees)
}

func isCurrentSessionAccess(snapshot *sessionSnapshot, accessID uuid.UUID) bool {
	return snapshot != nil && samePGUUID(toPGUUID(accessID), snapshot.SessionRow.GrantID)
}

func scopeExistsInSnapshot(snapshot *sessionSnapshot, scopeType string, scopeID string) bool {
	switch scopeType {
	case ScopeOrganization:
		return snapshot.SessionRow.OrganizationID.Valid && uuidFromPG(snapshot.SessionRow.OrganizationID).String() == scopeID
	case ScopeDivision:
		for _, division := range snapshot.Divisions {
			if uuidFromPG(division.ID).String() == scopeID {
				return true
			}
		}
	case ScopeUnit:
		for _, unit := range snapshot.Units {
			if uuidFromPG(unit.ID).String() == scopeID {
				return true
			}
		}
	}

	return false
}

func normalizeCompanyProfileRequest(req *CompanyProfileRequest) error {
	req.Type = strings.TrimSpace(req.Type)
	req.PropertyType = trimStringPointer(req.PropertyType)
	req.Name = strings.TrimSpace(req.Name)
	req.ShortName = trimStringPointer(req.ShortName)
	req.Inn = trimStringPointer(req.Inn)
	req.Kpp = trimStringPointer(req.Kpp)
	req.RegisteredAddress = trimStringPointer(req.RegisteredAddress)
	req.Address = trimStringPointer(req.Address)
	req.LeaderFullName = trimStringPointer(req.LeaderFullName)
	req.ManagerName = trimStringPointer(req.ManagerName)
	req.LeaderPosition = trimStringPointer(req.LeaderPosition)
	req.ContractPhone = trimStringPointer(req.ContractPhone)
	req.ContractEmail = trimStringPointer(req.ContractEmail)
	req.ActingBasis = trimStringPointer(req.ActingBasis)

	if req.Name == "" {
		return ErrOrganizationNameRequired
	}

	propertyType, err := normalizeOrganizationPropertyType(firstNonEmptyStringPointer(req.PropertyType, req.Type))
	if err != nil {
		return err
	}
	req.Type = propertyType
	req.PropertyType = stringPointer(propertyType)

	if req.ContractEmail != nil && !looksLikeEmail(*req.ContractEmail) {
		return ErrInvalidEmail
	}

	return nil
}

func normalizeStructureNodeRequest(req *StructureNodeRequest, allowDivision bool, snapshot *sessionSnapshot, nameRequiredErr error) error {
	req.Type = strings.TrimSpace(req.Type)
	req.Name = strings.TrimSpace(req.Name)
	req.Code = trimStringPointer(req.Code)
	req.Region = trimStringPointer(req.Region)
	req.Address = trimStringPointer(req.Address)
	req.RegisteredAddress = trimStringPointer(req.RegisteredAddress)
	req.LeaderFullName = trimStringPointer(req.LeaderFullName)
	req.ManagerName = trimStringPointer(req.ManagerName)
	req.LeaderPosition = trimStringPointer(req.LeaderPosition)
	req.ContractPhone = trimStringPointer(req.ContractPhone)
	req.ContractEmail = trimStringPointer(req.ContractEmail)
	req.ActingBasis = trimStringPointer(req.ActingBasis)
	req.Contacts = trimStringPointer(req.Contacts)
	req.Comment = trimStringPointer(req.Comment)
	req.DivisionID = trimStringPointer(req.DivisionID)

	if req.Name == "" {
		return nameRequiredErr
	}

	if allowDivision {
		if req.Type == "" {
			return ErrUnitTypeRequired
		}
		if _, ok := allowedUnitTypes[req.Type]; !ok {
			return ErrStructureTypeInvalid
		}
	} else {
		req.Type = defaultDivisionType
	}

	if req.ContractEmail != nil && !looksLikeEmail(*req.ContractEmail) {
		return ErrInvalidEmail
	}
	if req.DivisionID != nil {
		if !allowDivision {
			return ErrDivisionTargetInvalid
		}
		if _, err := uuid.Parse(*req.DivisionID); err != nil {
			return ErrDivisionTargetInvalid
		}
		if !scopeExistsInSnapshot(snapshot, "division", *req.DivisionID) {
			return ErrDivisionTargetInvalid
		}
	}

	return nil
}

func normalizeOrganizationPropertyType(value string) (string, error) {
	normalized := strings.ToUpper(strings.TrimSpace(value))
	switch normalized {
	case "":
		return "", ErrPropertyTypeRequired
	case "LLC":
		normalized = "ООО"
	case "ОАО":
		normalized = "ПАО"
	case "ЗАО":
		normalized = "АО"
	}
	if _, ok := allowedOrganizationPropertyTypes[normalized]; !ok {
		return "", ErrPropertyTypeInvalid
	}
	return normalized, nil
}

func firstNonEmptyStringPointer(value *string, fallback string) string {
	if value != nil && strings.TrimSpace(*value) != "" {
		return *value
	}
	return fallback
}

func parseRequiredUUID(value string) (uuid.UUID, error) {
	parsed, err := uuid.Parse(strings.TrimSpace(value))
	if err != nil {
		return uuid.Nil, ErrInvalidID
	}
	return parsed, nil
}

func trimStringPointer(value *string) *string {
	if value == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func coalesceStringPointer(primary *string, fallback *string) *string {
	if primary != nil && strings.TrimSpace(*primary) != "" {
		return primary
	}
	return fallback
}

func (s *service) mapEmployeeAccess(ctx context.Context, snapshot *sessionSnapshot, record employeeAccessRecord) *EmployeeAccessResponse {
	scopeLabel := s.resolveScopeLabel(
		ctx,
		snapshot.SessionRow.OrganizationID,
		record.ScopeType,
		record.ScopeID,
		snapshot.SessionRow.OrganizationShellName,
		snapshot,
	)
	return &EmployeeAccessResponse{
		AccessID:         uuidFromPG(record.AccessID).String(),
		MembershipID:     uuidFromPG(record.MembershipID).String(),
		AccountID:        uuidFromPG(record.AccountID).String(),
		FullName:         record.FullName,
		Email:            record.Email,
		RoleTemplate:     record.RoleTemplate,
		ScopeType:        record.ScopeType,
		ScopeID:          uuidFromPG(record.ScopeID).String(),
		ScopeLabel:       scopeLabel,
		MembershipStatus: record.MembershipStatus,
	}
}

func (s *service) mapEmployeeInvite(ctx context.Context, snapshot *sessionSnapshot, invite *generated.AuthEmployeeInvite) *EmployeeInviteResponse {
	scopeLabel := s.resolveScopeLabel(ctx, invite.OrganizationID, invite.ScopeType, invite.ScopeID, snapshot.SessionRow.OrganizationShellName, snapshot)
	response := &EmployeeInviteResponse{
		ID:           uuidFromPG(invite.ID).String(),
		FullName:     invite.FullName,
		Email:        invite.Email,
		RoleTemplate: invite.RoleTemplate,
		ScopeType:    invite.ScopeType,
		ScopeID:      uuidFromPG(invite.ScopeID).String(),
		ScopeLabel:   scopeLabel,
		Status:       invite.Status,
		ExpiresAt:    invite.ExpiresAt.Time.UTC().Format(time.RFC3339),
		SentAt:       formatOptionalTime(invite.SentAt),
		OpenedAt:     formatOptionalTime(invite.OpenedAt),
		AcceptedAt:   formatOptionalTime(invite.AcceptedAt),
		RevokedAt:    formatOptionalTime(invite.RevokedAt),
	}
	if invite.InviteToken != nil {
		response.InviteToken = invite.InviteToken
		path := "/register/" + *invite.InviteToken
		response.AcceptPath = &path
	}
	return response
}

func (s *service) resolveScopeLabel(ctx context.Context, organizationID pgtype.UUID, scopeType string, scopeID pgtype.UUID, organizationName string, snapshot *sessionSnapshot) string {
	switch scopeType {
	case "organization":
		return organizationName
	case "division":
		if snapshot != nil {
			for _, division := range snapshot.Divisions {
				if samePGUUID(division.ID, scopeID) {
					return division.Name
				}
			}
		}
		divisions, err := s.queries.ListAuthDivisionsByOrganization(ctx, organizationID)
		if err == nil {
			for _, division := range divisions {
				if samePGUUID(division.ID, scopeID) {
					return division.Name
				}
			}
		}
	case "unit":
		if snapshot != nil {
			for _, unit := range snapshot.Units {
				if samePGUUID(unit.ID, scopeID) {
					return unit.Name
				}
			}
		}
		units, err := s.queries.ListAuthUnitsByOrganization(ctx, organizationID)
		if err == nil {
			for _, unit := range units {
				if samePGUUID(unit.ID, scopeID) {
					return unit.Name
				}
			}
		}
	}

	return organizationName
}

func hashInvitePassword(password string) ([]byte, error) {
	password = strings.TrimSpace(password)
	if len(password) < 8 {
		return nil, ErrPasswordTooShort
	}
	return bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
}

func looksLikeEmail(value string) bool {
	return strings.Contains(value, "@") && strings.Contains(value, ".")
}

func formatOptionalTime(value pgtype.Timestamptz) *string {
	if !value.Valid {
		return nil
	}

	formatted := value.Time.UTC().Format(time.RFC3339)
	return &formatted
}

func stringPointer(value string) *string {
	return &value
}
