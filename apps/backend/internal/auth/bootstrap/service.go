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
	inviteLifetime          = 7 * 24 * time.Hour
	sessionLifetime         = 24 * time.Hour
)

var allowedRoleTemplates = map[string]string{
	"organization_admin":  "Администратор организации",
	"subdivision_manager": "Руководитель подразделения",
	"unit_operator":       "Администратор юнита",
	"observer":            "Наблюдатель",
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
	CreateSession(ctx context.Context, req CreateSessionRequest) (*SessionSummaryResponse, error)
	GetSession(ctx context.Context, token string) (*SessionSummaryResponse, error)
	DeleteSession(ctx context.Context, token string) error
	CompleteLaunch(ctx context.Context, token string, req CompleteLaunchRequest) (*SessionSummaryResponse, error)
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
	if req.Subdivision != nil {
		req.Subdivision.Name = strings.TrimSpace(req.Subdivision.Name)
		req.Subdivision.Type = strings.TrimSpace(req.Subdivision.Type)
	}

	if req.OrganizationName == "" {
		return nil, ErrOrganizationNameRequired
	}
	if req.PropertyType == "" {
		return nil, ErrPropertyTypeRequired
	}
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
	if req.StructureMode != "subdivision" && req.StructureMode != "unit" {
		return nil, ErrStructureModeInvalid
	}
	if req.StructureMode == "subdivision" {
		if req.Subdivision == nil {
			return nil, ErrSubdivisionNameRequired
		}
		if req.Subdivision.Name == "" {
			return nil, ErrSubdivisionNameRequired
		}
		if req.Subdivision.Type == "" {
			return nil, ErrSubdivisionTypeRequired
		}
	}

	snapshot, err := s.repository.GetSession(ctx, strings.TrimSpace(token))
	if err != nil {
		return nil, err
	}
	if snapshot.SessionRow.OrganizationLaunchState == "active" {
		return nil, ErrLaunchAlreadyCompleted
	}

	updated, err := s.repository.CompleteLaunch(ctx, snapshot, req)
	if err != nil {
		return nil, err
	}

	return mapSessionSummary(updated), nil
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
	if req.ScopeType != "organization" && req.ScopeType != "subdivision" && req.ScopeType != "unit" {
		return time.Time{}, ErrInviteScopeTypeInvalid
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
			ID:           uuidFromPG(session.OrganizationID).String(),
			RoleTitle:    session.OrganizationRoleTitle,
			Name:         session.OrganizationShellName,
			ShortName:    session.OrganizationShortName,
			PropertyType: session.OrganizationPropertyType,
			Inn:          session.OrganizationInn,
			Kpp:          session.OrganizationKpp,
			LegalAddress: session.OrganizationLegalAddress,
			ContactEmail: session.OrganizationContactEmail,
			ContactPhone: session.OrganizationContactPhone,
			LaunchState:  session.OrganizationLaunchState,
		},
		Subdivisions: []SubdivisionResponse{},
		Units:        []UnitResponse{},
	}

	if session.GrantID.Valid && session.GrantScopeID.Valid {
		response.Grant = &SessionGrantResponse{
			ID:           uuidFromPG(session.GrantID).String(),
			RoleTemplate: session.GrantRoleTemplate,
			ScopeType:    session.GrantScopeType,
			ScopeID:      uuidFromPG(session.GrantScopeID).String(),
		}
	}

	for _, subdivision := range snapshot.Subdivisions {
		response.Subdivisions = append(response.Subdivisions, SubdivisionResponse{
			ID:   uuidFromPG(subdivision.ID).String(),
			Type: subdivision.SubdivisionType,
			Name: subdivision.Name,
			Code: subdivision.Code,
		})
	}

	for _, unit := range snapshot.Units {
		var subdivisionID *string
		if unit.SubdivisionID.Valid {
			value := uuidFromPG(unit.SubdivisionID).String()
			subdivisionID = &value
		}

		response.Units = append(response.Units, UnitResponse{
			ID:            uuidFromPG(unit.ID).String(),
			Type:          unit.UnitType,
			Name:          unit.Name,
			Code:          unit.Code,
			SubdivisionID: subdivisionID,
		})
	}

	response.Workspace = resolveWorkspace(snapshot)

	return response
}

func resolveWorkspace(snapshot *sessionSnapshot) SessionWorkspaceResponse {
	session := snapshot.SessionRow
	roleTemplate := session.GrantRoleTemplate
	scopeType := "organization"
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
	}

	if session.OrganizationRoleTitle == "contractor" && session.OrganizationLaunchState == "active" {
		workspace.LandingPath = "/contracts"
		workspace.LandingSubtitle = "После входа открывается договорный контур подрядчика без раскрытия broader customer graph."
	}

	switch scopeType {
	case "subdivision":
		if len(snapshot.Subdivisions) > 0 {
			workspace.ScopeName = snapshot.Subdivisions[0].Name
			workspace.LandingTitle = snapshot.Subdivisions[0].Name
		} else {
			workspace.ScopeName = "Подразделение"
			workspace.LandingTitle = "Подразделение"
		}
		workspace.LandingSubtitle = "Доступ ограничен выбранным подразделением и его дочерними юнитами."
	case "unit":
		if len(snapshot.Units) > 0 {
			workspace.ScopeName = snapshot.Units[0].Name
			workspace.LandingTitle = snapshot.Units[0].Name
		} else {
			workspace.ScopeName = "Юнит"
			workspace.LandingTitle = "Юнит"
		}
		workspace.LandingSubtitle = "Доступ ограничен выбранным юнитом без расширения вверх по иерархии."
	default:
		if roleTemplate == "organization_admin" {
			workspace.LandingSubtitle = "Администратор организации видит полный org graph и может управлять приглашениями сотрудников."
		}
	}

	return workspace
}

func canManageEmployeeInvites(snapshot *sessionSnapshot) bool {
	session := snapshot.SessionRow
	return session.OrganizationLaunchState == "active" &&
		session.GrantRoleTemplate == "organization_admin" &&
		session.GrantScopeType == "organization"
}

func scopeExistsInSnapshot(snapshot *sessionSnapshot, scopeType string, scopeID string) bool {
	switch scopeType {
	case "organization":
		return snapshot.SessionRow.OrganizationID.Valid && uuidFromPG(snapshot.SessionRow.OrganizationID).String() == scopeID
	case "subdivision":
		for _, subdivision := range snapshot.Subdivisions {
			if uuidFromPG(subdivision.ID).String() == scopeID {
				return true
			}
		}
	case "unit":
		for _, unit := range snapshot.Units {
			if uuidFromPG(unit.ID).String() == scopeID {
				return true
			}
		}
	}

	return false
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
	case "subdivision":
		if snapshot != nil {
			for _, subdivision := range snapshot.Subdivisions {
				if samePGUUID(subdivision.ID, scopeID) {
					return subdivision.Name
				}
			}
		}
		subdivisions, err := s.queries.ListAuthSubdivisionsByOrganization(ctx, organizationID)
		if err == nil {
			for _, subdivision := range subdivisions {
				if samePGUUID(subdivision.ID, scopeID) {
					return subdivision.Name
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
