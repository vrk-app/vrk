package bootstrap

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"backend/internal/db/generated"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	CreateOrganizationShell(ctx context.Context, req CreateOrganizationShellRequest, inviteToken string, expiresAt time.Time) (*organizationShellBundle, error)
	GetInviteByToken(ctx context.Context, token string) (*generated.GetFirstAdminInviteByTokenRow, error)
	MarkInviteOpened(ctx context.Context, inviteID uuid.UUID) error
	MarkInviteExpired(ctx context.Context, inviteID uuid.UUID) error
	AcceptInvite(ctx context.Context, invite *generated.GetFirstAdminInviteByTokenRow, passwordHash string, sessionToken string, sessionExpiresAt time.Time) (*sessionSnapshot, error)
	CreateSession(ctx context.Context, accountID uuid.UUID, sessionToken string, sessionExpiresAt time.Time) (*sessionSnapshot, error)
	GetSession(ctx context.Context, sessionToken string) (*sessionSnapshot, error)
	DeleteSession(ctx context.Context, sessionToken string) error
	CompleteLaunch(ctx context.Context, snapshot *sessionSnapshot, req CompleteLaunchRequest) (*sessionSnapshot, error)
	UpdateCompanyProfile(ctx context.Context, snapshot *sessionSnapshot, req CompanyProfileRequest) (*sessionSnapshot, error)
	CreateDivision(ctx context.Context, snapshot *sessionSnapshot, req StructureNodeRequest) (*sessionSnapshot, error)
	UpdateDivision(ctx context.Context, snapshot *sessionSnapshot, divisionID uuid.UUID, req StructureNodeRequest) (*sessionSnapshot, error)
	ArchiveDivision(ctx context.Context, snapshot *sessionSnapshot, divisionID uuid.UUID) (*sessionSnapshot, error)
	CreateUnit(ctx context.Context, snapshot *sessionSnapshot, req StructureNodeRequest) (*sessionSnapshot, error)
	UpdateUnit(ctx context.Context, snapshot *sessionSnapshot, unitID uuid.UUID, req StructureNodeRequest) (*sessionSnapshot, error)
	ArchiveUnit(ctx context.Context, snapshot *sessionSnapshot, unitID uuid.UUID) (*sessionSnapshot, error)
	CreateEmployeeInviteDraft(ctx context.Context, snapshot *sessionSnapshot, req CreateEmployeeInviteRequest, expiresAt time.Time) (*generated.AuthEmployeeInvite, error)
	ListEmployeeInvites(ctx context.Context, snapshot *sessionSnapshot) ([]generated.AuthEmployeeInvite, error)
	GetEmployeeInviteByID(ctx context.Context, inviteID uuid.UUID) (*generated.AuthEmployeeInvite, error)
	SendEmployeeInvite(ctx context.Context, inviteID uuid.UUID, inviteToken string) (*generated.AuthEmployeeInvite, error)
	RevokeEmployeeInvite(ctx context.Context, inviteID uuid.UUID) (*generated.AuthEmployeeInvite, error)
	GetEmployeeInviteByToken(ctx context.Context, token string) (*generated.GetEmployeeInviteByTokenRow, error)
	MarkEmployeeInviteOpened(ctx context.Context, inviteID uuid.UUID) error
	MarkEmployeeInviteExpired(ctx context.Context, inviteID uuid.UUID) error
	AcceptEmployeeInvite(ctx context.Context, invite *generated.GetEmployeeInviteByTokenRow, passwordHash string, sessionToken string, sessionExpiresAt time.Time) (*sessionSnapshot, error)
}

type organizationShellBundle struct {
	Organization generated.AuthBootstrapOrganization
	Invite       generated.AuthFirstAdminInvite
}

type sessionSnapshot struct {
	SessionRow generated.GetCurrentSessionRow
	Divisions  []generated.AuthDivision
	Units      []generated.AuthUnit
}

type repository struct {
	db *pgxpool.Pool
	q  *generated.Queries
}

func NewRepository(db *pgxpool.Pool, q *generated.Queries) Repository {
	return &repository{db: db, q: q}
}

func (r *repository) CreateOrganizationShell(ctx context.Context, req CreateOrganizationShellRequest, inviteToken string, expiresAt time.Time) (*organizationShellBundle, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer rollbackOnExit(ctx, tx)

	qtx := r.q.WithTx(tx)
	org, err := qtx.CreateBootstrapOrganizationShell(ctx, generated.CreateBootstrapOrganizationShellParams{
		RoleTitle: req.OrganizationRole,
		ShellName: req.OrganizationName,
	})
	if err != nil {
		return nil, err
	}

	invite, err := qtx.CreateFirstAdminInvite(ctx, generated.CreateFirstAdminInviteParams{
		OrganizationID: toPGUUID(uuidFromPG(org.ID)),
		FullName:       req.FirstAdminName,
		Email:          req.FirstAdminEmail,
		InviteToken:    inviteToken,
		ExpiresAt:      toPGTime(expiresAt),
	})
	if err != nil {
		if isUniqueViolation(err) {
			return nil, fmt.Errorf("%w: %v", ErrEmailRequired, err)
		}
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &organizationShellBundle{
		Organization: org,
		Invite:       invite,
	}, nil
}

func (r *repository) GetInviteByToken(ctx context.Context, token string) (*generated.GetFirstAdminInviteByTokenRow, error) {
	row, err := r.q.GetFirstAdminInviteByToken(ctx, token)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrInviteNotFound
		}
		return nil, err
	}

	return &row, nil
}

func (r *repository) MarkInviteOpened(ctx context.Context, inviteID uuid.UUID) error {
	_, err := r.q.UpdateFirstAdminInviteOpened(ctx, toPGUUID(inviteID))
	return err
}

func (r *repository) MarkInviteExpired(ctx context.Context, inviteID uuid.UUID) error {
	_, err := r.q.MarkFirstAdminInviteExpired(ctx, toPGUUID(inviteID))
	return err
}

func (r *repository) AcceptInvite(ctx context.Context, invite *generated.GetFirstAdminInviteByTokenRow, passwordHash string, sessionToken string, sessionExpiresAt time.Time) (*sessionSnapshot, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer rollbackOnExit(ctx, tx)

	qtx := r.q.WithTx(tx)

	account, err := qtx.CreateAuthAccount(ctx, generated.CreateAuthAccountParams{
		FullName:     invite.FullName,
		Email:        invite.Email,
		PasswordHash: passwordHash,
	})
	if err != nil {
		return nil, err
	}

	if err := qtx.UpdateBootstrapOrganizationFirstAdmin(ctx, generated.UpdateBootstrapOrganizationFirstAdminParams{
		ID:                  invite.OrganizationID,
		FirstAdminAccountID: account.ID,
	}); err != nil {
		return nil, err
	}

	membership, err := qtx.CreateAuthMembership(ctx, generated.CreateAuthMembershipParams{
		OrganizationID: invite.OrganizationID,
		AccountID:      account.ID,
	})
	if err != nil {
		return nil, err
	}

	grant, err := qtx.CreateAuthScopedGrant(ctx, generated.CreateAuthScopedGrantParams{
		MembershipID: membership.ID,
		RoleTemplate: RoleOrganizationAdmin,
		ScopeType:    "organization",
		ScopeID:      invite.OrganizationID,
	})
	if err != nil {
		return nil, err
	}

	if _, err := qtx.MarkFirstAdminInviteAccepted(ctx, generated.MarkFirstAdminInviteAcceptedParams{
		ID:        invite.ID,
		AccountID: account.ID,
	}); err != nil {
		return nil, err
	}

	if _, err := qtx.MarkBootstrapOrganizationLaunched(ctx, invite.OrganizationID); err != nil {
		return nil, err
	}

	if _, err := qtx.CreateAuthSession(ctx, generated.CreateAuthSessionParams{
		AccountID:    account.ID,
		MembershipID: membership.ID,
		GrantID:      grant.ID,
		SessionToken: sessionToken,
		ExpiresAt:    toPGTime(sessionExpiresAt),
	}); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return r.GetSession(ctx, sessionToken)
}

func (r *repository) CreateSession(ctx context.Context, accountID uuid.UUID, sessionToken string, sessionExpiresAt time.Time) (*sessionSnapshot, error) {
	accessPaths, err := r.q.ListAccountAccessPathsByAccountID(ctx, toPGUUID(accountID))
	if err != nil {
		return nil, err
	}

	access, err := selectSingleAccess(accessPaths)
	if err != nil {
		return nil, err
	}

	if _, err := r.q.CreateAuthSession(ctx, generated.CreateAuthSessionParams{
		AccountID:    toPGUUID(accountID),
		MembershipID: access.MembershipID,
		GrantID:      access.GrantID,
		SessionToken: sessionToken,
		ExpiresAt:    toPGTime(sessionExpiresAt),
	}); err != nil {
		return nil, err
	}

	return r.GetSession(ctx, sessionToken)
}

func (r *repository) GetSession(ctx context.Context, sessionToken string) (*sessionSnapshot, error) {
	row, err := r.q.GetCurrentSession(ctx, sessionToken)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUnauthorized
		}
		return nil, err
	}

	if row.ExpiresAt.Valid && row.ExpiresAt.Time.Before(time.Now()) {
		_ = r.DeleteSession(ctx, sessionToken)
		return nil, ErrUnauthorized
	}

	_ = r.q.TouchAuthSession(ctx, row.ID)

	divisions, units, err := r.loadOrganizationGraph(ctx, r.q, row.OrganizationID)
	if err != nil {
		return nil, err
	}

	filteredDivisions, filteredUnits := restrictOrganizationGraph(row, divisions, units)

	return &sessionSnapshot{
		SessionRow: row,
		Divisions:  filteredDivisions,
		Units:      filteredUnits,
	}, nil
}

func (r *repository) DeleteSession(ctx context.Context, sessionToken string) error {
	return r.q.DeleteAuthSessionByToken(ctx, sessionToken)
}

func (r *repository) CompleteLaunch(ctx context.Context, snapshot *sessionSnapshot, req CompleteLaunchRequest) (*sessionSnapshot, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer rollbackOnExit(ctx, tx)

	qtx := r.q.WithTx(tx)
	updatedOrg, err := qtx.UpdateBootstrapOrganizationCore(ctx, generated.UpdateBootstrapOrganizationCoreParams{
		ID:             snapshot.SessionRow.OrganizationID,
		ShellName:      req.OrganizationName,
		ShortName:      trimOptional(req.ShortName),
		PropertyType:   trimOptionalString(req.PropertyType),
		Inn:            trimOptionalString(req.Inn),
		Kpp:            trimOptionalString(req.Kpp),
		LegalAddress:   trimOptionalString(req.LegalAddress),
		ContactEmail:   trimOptionalString(req.ContactEmail),
		ContactPhone:   trimOptionalString(req.ContactPhone),
		LeaderFullName: nil,
		LeaderPosition: nil,
		ContractPhone:  nil,
		ContractEmail:  nil,
		ActingBasis:    nil,
	})
	if err != nil {
		return nil, err
	}

	var divisionID pgtype.UUID
	if req.StructureMode == "division" && req.Division != nil {
		division, err := qtx.CreateAuthDivision(ctx, generated.CreateAuthDivisionParams{
			OrganizationID: updatedOrg.ID,
			DivisionType:   req.Division.Type,
			Name:           req.Division.Name,
			Code:           trimOptional(req.Division.Code),
			Region:         trimOptional(req.Division.Region),
			Address:        trimOptional(req.Division.Address),
			ManagerName:    trimOptional(req.Division.ManagerName),
			Contacts:       trimOptional(req.Division.Contacts),
			LeaderPosition: nil,
			ContractPhone:  nil,
			ContractEmail:  nil,
			ActingBasis:    nil,
			Comment:        nil,
		})
		if err != nil {
			return nil, err
		}
		divisionID = division.ID
	}

	if _, err := qtx.CreateAuthUnit(ctx, generated.CreateAuthUnitParams{
		OrganizationID: updatedOrg.ID,
		DivisionID:     divisionID,
		UnitType:       req.Unit.Type,
		Name:           req.Unit.Name,
		Code:           trimOptional(req.Unit.Code),
		Region:         nil,
		Address:        trimOptional(req.Unit.Address),
		ManagerName:    trimOptional(req.Unit.ManagerName),
		Contacts:       trimOptional(req.Unit.Contacts),
		LeaderPosition: nil,
		ContractPhone:  nil,
		ContractEmail:  nil,
		ActingBasis:    nil,
		Comment:        nil,
	}); err != nil {
		return nil, err
	}

	if _, err := qtx.MarkBootstrapOrganizationLaunched(ctx, updatedOrg.ID); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return r.GetSession(ctx, snapshot.SessionRow.SessionToken)
}

func (r *repository) UpdateCompanyProfile(ctx context.Context, snapshot *sessionSnapshot, req CompanyProfileRequest) (*sessionSnapshot, error) {
	if _, err := r.q.UpdateBootstrapOrganizationCore(ctx, generated.UpdateBootstrapOrganizationCoreParams{
		ID:             snapshot.SessionRow.OrganizationID,
		ShellName:      req.Name,
		ShortName:      trimOptional(req.ShortName),
		PropertyType:   trimOptionalString(req.Type),
		Inn:            trimOptional(req.Inn),
		Kpp:            trimOptional(req.Kpp),
		LegalAddress:   trimOptional(resolveAddressAlias(req.RegisteredAddress, req.Address)),
		ContactEmail:   trimOptional(req.ContractEmail),
		ContactPhone:   trimOptional(req.ContractPhone),
		LeaderFullName: trimOptional(resolveLeaderAlias(req.LeaderFullName, req.ManagerName)),
		LeaderPosition: trimOptional(req.LeaderPosition),
		ContractPhone:  trimOptional(req.ContractPhone),
		ContractEmail:  trimOptional(req.ContractEmail),
		ActingBasis:    trimOptional(req.ActingBasis),
	}); err != nil {
		return nil, err
	}

	return r.GetSession(ctx, snapshot.SessionRow.SessionToken)
}

func (r *repository) CreateDivision(ctx context.Context, snapshot *sessionSnapshot, req StructureNodeRequest) (*sessionSnapshot, error) {
	if _, err := r.q.CreateAuthDivision(ctx, generated.CreateAuthDivisionParams{
		OrganizationID: snapshot.SessionRow.OrganizationID,
		DivisionType:   req.Type,
		Name:           req.Name,
		Code:           trimOptional(req.Code),
		Region:         trimOptional(req.Region),
		Address:        trimOptional(resolveAddressAlias(req.RegisteredAddress, req.Address)),
		ManagerName:    trimOptional(resolveLeaderAlias(req.LeaderFullName, req.ManagerName)),
		Contacts:       trimOptional(req.Contacts),
		LeaderPosition: trimOptional(req.LeaderPosition),
		ContractPhone:  trimOptional(req.ContractPhone),
		ContractEmail:  trimOptional(req.ContractEmail),
		ActingBasis:    trimOptional(req.ActingBasis),
		Comment:        trimOptional(req.Comment),
	}); err != nil {
		return nil, err
	}

	return r.GetSession(ctx, snapshot.SessionRow.SessionToken)
}

func (r *repository) UpdateDivision(ctx context.Context, snapshot *sessionSnapshot, divisionID uuid.UUID, req StructureNodeRequest) (*sessionSnapshot, error) {
	if _, err := r.q.UpdateAuthDivision(ctx, generated.UpdateAuthDivisionParams{
		ID:             toPGUUID(divisionID),
		OrganizationID: snapshot.SessionRow.OrganizationID,
		DivisionType:   req.Type,
		Name:           req.Name,
		Code:           trimOptional(req.Code),
		Region:         trimOptional(req.Region),
		Address:        trimOptional(resolveAddressAlias(req.RegisteredAddress, req.Address)),
		ManagerName:    trimOptional(resolveLeaderAlias(req.LeaderFullName, req.ManagerName)),
		Contacts:       trimOptional(req.Contacts),
		LeaderPosition: trimOptional(req.LeaderPosition),
		ContractPhone:  trimOptional(req.ContractPhone),
		ContractEmail:  trimOptional(req.ContractEmail),
		ActingBasis:    trimOptional(req.ActingBasis),
		Comment:        trimOptional(req.Comment),
	}); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrDivisionNotFound
		}
		return nil, err
	}

	return r.GetSession(ctx, snapshot.SessionRow.SessionToken)
}

func (r *repository) ArchiveDivision(ctx context.Context, snapshot *sessionSnapshot, divisionID uuid.UUID) (*sessionSnapshot, error) {
	current, err := r.q.GetAuthDivisionByID(ctx, toPGUUID(divisionID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrDivisionNotFound
		}
		return nil, err
	}
	if !samePGUUID(current.OrganizationID, snapshot.SessionRow.OrganizationID) || current.Status != "active" {
		return nil, ErrDivisionNotFound
	}

	blockers, err := r.q.CountAuthDivisionArchiveBlockers(ctx, generated.CountAuthDivisionArchiveBlockersParams{
		OrganizationID: snapshot.SessionRow.OrganizationID,
		ScopeID:        toPGUUID(divisionID),
	})
	if err != nil {
		return nil, err
	}
	if blockers > 0 {
		return nil, ErrArchiveBlocked
	}

	if _, err := r.q.ArchiveAuthDivision(ctx, generated.ArchiveAuthDivisionParams{
		ID:             toPGUUID(divisionID),
		OrganizationID: snapshot.SessionRow.OrganizationID,
	}); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrDivisionNotFound
		}
		return nil, err
	}

	return r.GetSession(ctx, snapshot.SessionRow.SessionToken)
}

func (r *repository) CreateUnit(ctx context.Context, snapshot *sessionSnapshot, req StructureNodeRequest) (*sessionSnapshot, error) {
	divisionID, err := optionalDivisionPGUUID(req.DivisionID)
	if err != nil {
		return nil, err
	}

	if _, err := r.q.CreateAuthUnit(ctx, generated.CreateAuthUnitParams{
		OrganizationID: snapshot.SessionRow.OrganizationID,
		DivisionID:     divisionID,
		UnitType:       req.Type,
		Name:           req.Name,
		Code:           trimOptional(req.Code),
		Region:         trimOptional(req.Region),
		Address:        trimOptional(resolveAddressAlias(req.RegisteredAddress, req.Address)),
		ManagerName:    trimOptional(resolveLeaderAlias(req.LeaderFullName, req.ManagerName)),
		Contacts:       trimOptional(req.Contacts),
		LeaderPosition: trimOptional(req.LeaderPosition),
		ContractPhone:  trimOptional(req.ContractPhone),
		ContractEmail:  trimOptional(req.ContractEmail),
		ActingBasis:    trimOptional(req.ActingBasis),
		Comment:        trimOptional(req.Comment),
	}); err != nil {
		return nil, err
	}

	return r.GetSession(ctx, snapshot.SessionRow.SessionToken)
}

func (r *repository) UpdateUnit(ctx context.Context, snapshot *sessionSnapshot, unitID uuid.UUID, req StructureNodeRequest) (*sessionSnapshot, error) {
	divisionID, err := optionalDivisionPGUUID(req.DivisionID)
	if err != nil {
		return nil, err
	}

	if _, err := r.q.UpdateAuthUnit(ctx, generated.UpdateAuthUnitParams{
		ID:             toPGUUID(unitID),
		OrganizationID: snapshot.SessionRow.OrganizationID,
		DivisionID:     divisionID,
		UnitType:       req.Type,
		Name:           req.Name,
		Code:           trimOptional(req.Code),
		Region:         trimOptional(req.Region),
		Address:        trimOptional(resolveAddressAlias(req.RegisteredAddress, req.Address)),
		ManagerName:    trimOptional(resolveLeaderAlias(req.LeaderFullName, req.ManagerName)),
		Contacts:       trimOptional(req.Contacts),
		LeaderPosition: trimOptional(req.LeaderPosition),
		ContractPhone:  trimOptional(req.ContractPhone),
		ContractEmail:  trimOptional(req.ContractEmail),
		ActingBasis:    trimOptional(req.ActingBasis),
		Comment:        trimOptional(req.Comment),
	}); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUnitNotFound
		}
		return nil, err
	}

	return r.GetSession(ctx, snapshot.SessionRow.SessionToken)
}

func (r *repository) ArchiveUnit(ctx context.Context, snapshot *sessionSnapshot, unitID uuid.UUID) (*sessionSnapshot, error) {
	current, err := r.q.GetAuthUnitByID(ctx, toPGUUID(unitID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUnitNotFound
		}
		return nil, err
	}
	if !samePGUUID(current.OrganizationID, snapshot.SessionRow.OrganizationID) || current.Status != "active" {
		return nil, ErrUnitNotFound
	}

	blockers, err := r.q.CountAuthUnitArchiveBlockers(ctx, generated.CountAuthUnitArchiveBlockersParams{
		OrganizationID: snapshot.SessionRow.OrganizationID,
		ScopeID:        toPGUUID(unitID),
	})
	if err != nil {
		return nil, err
	}
	if blockers > 0 {
		return nil, ErrArchiveBlocked
	}

	if _, err := r.q.ArchiveAuthUnit(ctx, generated.ArchiveAuthUnitParams{
		ID:             toPGUUID(unitID),
		OrganizationID: snapshot.SessionRow.OrganizationID,
	}); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUnitNotFound
		}
		return nil, err
	}

	return r.GetSession(ctx, snapshot.SessionRow.SessionToken)
}

func (r *repository) CreateEmployeeInviteDraft(ctx context.Context, snapshot *sessionSnapshot, req CreateEmployeeInviteRequest, expiresAt time.Time) (*generated.AuthEmployeeInvite, error) {
	invite, err := r.q.CreateEmployeeInviteDraft(ctx, generated.CreateEmployeeInviteDraftParams{
		OrganizationID:     snapshot.SessionRow.OrganizationID,
		FullName:           req.FullName,
		Email:              req.Email,
		RoleTemplate:       req.RoleTemplate,
		ScopeType:          req.ScopeType,
		ScopeID:            toPGUUID(uuid.MustParse(req.ScopeID)),
		ExpiresAt:          toPGTime(expiresAt),
		CreatedByAccountID: snapshot.SessionRow.AccountID,
	})
	if err != nil {
		if isUniqueViolation(err) {
			return nil, fmt.Errorf("%w: %v", ErrEmailRequired, err)
		}
		return nil, err
	}

	return &invite, nil
}

func (r *repository) ListEmployeeInvites(ctx context.Context, snapshot *sessionSnapshot) ([]generated.AuthEmployeeInvite, error) {
	return r.q.ListEmployeeInvitesByOrganization(ctx, snapshot.SessionRow.OrganizationID)
}

func (r *repository) GetEmployeeInviteByID(ctx context.Context, inviteID uuid.UUID) (*generated.AuthEmployeeInvite, error) {
	invite, err := r.q.GetEmployeeInviteByID(ctx, toPGUUID(inviteID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrInviteNotFound
		}
		return nil, err
	}

	return &invite, nil
}

func (r *repository) SendEmployeeInvite(ctx context.Context, inviteID uuid.UUID, inviteToken string) (*generated.AuthEmployeeInvite, error) {
	invite, err := r.q.SendEmployeeInvite(ctx, generated.SendEmployeeInviteParams{
		ID:          toPGUUID(inviteID),
		InviteToken: &inviteToken,
	})
	if err != nil {
		return nil, err
	}

	return &invite, nil
}

func (r *repository) RevokeEmployeeInvite(ctx context.Context, inviteID uuid.UUID) (*generated.AuthEmployeeInvite, error) {
	invite, err := r.q.RevokeEmployeeInvite(ctx, toPGUUID(inviteID))
	if err != nil {
		return nil, err
	}

	return &invite, nil
}

func (r *repository) GetEmployeeInviteByToken(ctx context.Context, token string) (*generated.GetEmployeeInviteByTokenRow, error) {
	invite, err := r.q.GetEmployeeInviteByToken(ctx, &token)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrInviteNotFound
		}
		return nil, err
	}

	return &invite, nil
}

func (r *repository) MarkEmployeeInviteOpened(ctx context.Context, inviteID uuid.UUID) error {
	_, err := r.q.MarkEmployeeInviteOpened(ctx, toPGUUID(inviteID))
	return err
}

func (r *repository) MarkEmployeeInviteExpired(ctx context.Context, inviteID uuid.UUID) error {
	_, err := r.q.MarkEmployeeInviteExpired(ctx, toPGUUID(inviteID))
	return err
}

func (r *repository) AcceptEmployeeInvite(ctx context.Context, invite *generated.GetEmployeeInviteByTokenRow, passwordHash string, sessionToken string, sessionExpiresAt time.Time) (*sessionSnapshot, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer rollbackOnExit(ctx, tx)

	qtx := r.q.WithTx(tx)

	account, err := qtx.GetAuthAccountByEmail(ctx, invite.Email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			account, err = qtx.CreateAuthAccount(ctx, generated.CreateAuthAccountParams{
				FullName:     invite.FullName,
				Email:        invite.Email,
				PasswordHash: passwordHash,
			})
			if err != nil {
				return nil, err
			}
		} else {
			return nil, err
		}
	} else {
		account, err = qtx.UpdateAuthAccountPassword(ctx, generated.UpdateAuthAccountPasswordParams{
			ID:           account.ID,
			FullName:     invite.FullName,
			PasswordHash: passwordHash,
		})
		if err != nil {
			return nil, err
		}
	}

	membership, err := qtx.UpsertAuthMembership(ctx, generated.UpsertAuthMembershipParams{
		OrganizationID: invite.OrganizationID,
		AccountID:      account.ID,
	})
	if err != nil {
		return nil, err
	}

	grant, err := qtx.UpsertAuthScopedGrant(ctx, generated.UpsertAuthScopedGrantParams{
		MembershipID: membership.ID,
		RoleTemplate: invite.RoleTemplate,
		ScopeType:    invite.ScopeType,
		ScopeID:      invite.ScopeID,
	})
	if err != nil {
		return nil, err
	}

	if _, err := qtx.MarkEmployeeInviteAccepted(ctx, generated.MarkEmployeeInviteAcceptedParams{
		ID:        invite.ID,
		AccountID: account.ID,
	}); err != nil {
		return nil, err
	}

	if _, err := qtx.CreateAuthSession(ctx, generated.CreateAuthSessionParams{
		AccountID:    account.ID,
		MembershipID: membership.ID,
		GrantID:      grant.ID,
		SessionToken: sessionToken,
		ExpiresAt:    toPGTime(sessionExpiresAt),
	}); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return r.GetSession(ctx, sessionToken)
}

func (r *repository) loadOrganizationGraph(ctx context.Context, q graphReader, organizationID pgtype.UUID) ([]generated.AuthDivision, []generated.AuthUnit, error) {
	divisions, err := q.ListAuthDivisionsByOrganization(ctx, organizationID)
	if err != nil {
		return nil, nil, err
	}

	units, err := q.ListAuthUnitsByOrganization(ctx, organizationID)
	if err != nil {
		return nil, nil, err
	}

	return divisions, units, nil
}

type graphReader interface {
	ListAuthDivisionsByOrganization(ctx context.Context, organizationID pgtype.UUID) ([]generated.AuthDivision, error)
	ListAuthUnitsByOrganization(ctx context.Context, organizationID pgtype.UUID) ([]generated.AuthUnit, error)
}

func selectSingleAccess(rows []generated.ListAccountAccessPathsByAccountIDRow) (*generated.ListAccountAccessPathsByAccountIDRow, error) {
	switch len(rows) {
	case 0:
		return nil, ErrUnauthorized
	case 1:
		return &rows[0], nil
	default:
		return nil, ErrAccessSelectionRequired
	}
}

func restrictOrganizationGraph(row generated.GetCurrentSessionRow, divisions []generated.AuthDivision, units []generated.AuthUnit) ([]generated.AuthDivision, []generated.AuthUnit) {
	if !row.GrantScopeID.Valid {
		return []generated.AuthDivision{}, []generated.AuthUnit{}
	}

	switch row.GrantScopeType {
	case "organization":
		return divisions, units
	case "division":
		filteredDivisions := make([]generated.AuthDivision, 0, len(divisions))
		filteredUnits := make([]generated.AuthUnit, 0, len(units))
		for _, division := range divisions {
			if samePGUUID(division.ID, row.GrantScopeID) {
				filteredDivisions = append(filteredDivisions, division)
				break
			}
		}
		for _, unit := range units {
			if samePGUUID(unit.DivisionID, row.GrantScopeID) {
				filteredUnits = append(filteredUnits, unit)
			}
		}
		return filteredDivisions, filteredUnits
	case "unit":
		filteredUnits := make([]generated.AuthUnit, 0, 1)
		for _, unit := range units {
			if samePGUUID(unit.ID, row.GrantScopeID) {
				filteredUnits = append(filteredUnits, unit)
				break
			}
		}
		return []generated.AuthDivision{}, filteredUnits
	default:
		return []generated.AuthDivision{}, []generated.AuthUnit{}
	}
}

func samePGUUID(left pgtype.UUID, right pgtype.UUID) bool {
	return left.Valid && right.Valid && left.Bytes == right.Bytes
}

func rollbackOnExit(ctx context.Context, tx pgx.Tx) {
	_ = tx.Rollback(ctx)
}

func toPGUUID(id uuid.UUID) pgtype.UUID {
	return pgtype.UUID{Bytes: id, Valid: true}
}

func uuidFromPG(id pgtype.UUID) uuid.UUID {
	return uuid.UUID(id.Bytes)
}

func toPGTime(value time.Time) pgtype.Timestamptz {
	return pgtype.Timestamptz{Time: value, Valid: true}
}

func trimOptional(value *string) *string {
	if value == nil {
		return nil
	}

	trimmed := *value
	if trimmed == "" {
		return nil
	}

	return &trimmed
}

func resolveAddressAlias(registeredAddress *string, address *string) *string {
	if registeredAddress != nil && strings.TrimSpace(*registeredAddress) != "" {
		return registeredAddress
	}
	return address
}

func resolveLeaderAlias(leaderFullName *string, managerName *string) *string {
	if leaderFullName != nil && strings.TrimSpace(*leaderFullName) != "" {
		return leaderFullName
	}
	return managerName
}

func optionalDivisionPGUUID(value *string) (pgtype.UUID, error) {
	if value == nil || strings.TrimSpace(*value) == "" {
		return pgtype.UUID{}, nil
	}

	parsed, err := uuid.Parse(strings.TrimSpace(*value))
	if err != nil {
		return pgtype.UUID{}, ErrDivisionTargetInvalid
	}

	return toPGUUID(parsed), nil
}

func trimOptionalString(value string) *string {
	if value == "" {
		return nil
	}

	return &value
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}
