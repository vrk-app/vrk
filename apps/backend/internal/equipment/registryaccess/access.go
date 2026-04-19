package registryaccess

import (
	"context"
	"errors"
	"strings"

	"backend/internal/auth/bootstrap"

	"github.com/google/uuid"
)

var (
	ErrUnauthorized       = errors.New("unauthorized")
	ErrForbidden          = errors.New("forbidden")
	ErrInvalidUnit        = errors.New("invalid unit scope")
	ErrInvalidSubdivision = errors.New("invalid subdivision scope")
	ErrInvalidScope       = errors.New("invalid ownership scope")
)

func RequireCustomerSession(ctx context.Context, authService bootstrap.Service, token string) (*bootstrap.SessionSummaryResponse, error) {
	session, err := authService.GetSession(ctx, strings.TrimSpace(token))
	if err != nil {
		return nil, ErrUnauthorized
	}
	if session.RequiresLaunchWizard || session.Organization.LaunchState != "active" {
		return nil, ErrForbidden
	}
	if session.Organization.RoleTitle != "customer" {
		return nil, ErrForbidden
	}
	return session, nil
}

func RequireRegistryManager(ctx context.Context, authService bootstrap.Service, token string) (*bootstrap.SessionSummaryResponse, error) {
	session, err := RequireCustomerSession(ctx, authService, token)
	if err != nil {
		return nil, err
	}
	if !CanManageRegistry(session) {
		return nil, ErrForbidden
	}
	return session, nil
}

func CanManageRegistry(session *bootstrap.SessionSummaryResponse) bool {
	return session != nil &&
		session.Grant != nil &&
		session.Grant.RoleTemplate == "organization_admin" &&
		session.Workspace.ScopeType == "organization"
}

func VisibleUnitMap(session *bootstrap.SessionSummaryResponse) map[string]bootstrap.UnitResponse {
	result := make(map[string]bootstrap.UnitResponse, len(session.Units))
	for _, unit := range session.Units {
		result[unit.ID] = unit
	}
	return result
}

func VisibleSubdivisionMap(session *bootstrap.SessionSummaryResponse) map[string]bootstrap.SubdivisionResponse {
	result := make(map[string]bootstrap.SubdivisionResponse, len(session.Subdivisions))
	for _, subdivision := range session.Subdivisions {
		result[subdivision.ID] = subdivision
	}
	return result
}

func ResolveVisibleUnit(session *bootstrap.SessionSummaryResponse, unitID string) (*bootstrap.UnitResponse, error) {
	unitID = strings.TrimSpace(unitID)
	if unitID == "" {
		return nil, ErrInvalidUnit
	}

	unit, ok := VisibleUnitMap(session)[unitID]
	if !ok {
		return nil, ErrInvalidUnit
	}

	return &unit, nil
}

func CanSeeStandard(session *bootstrap.SessionSummaryResponse, subdivisionID *uuid.UUID, unitID *uuid.UUID) bool {
	if unitID != nil {
		_, ok := VisibleUnitMap(session)[unitID.String()]
		return ok
	}

	if subdivisionID != nil {
		_, ok := VisibleSubdivisionMap(session)[subdivisionID.String()]
		return ok
	}

	return session != nil && session.Workspace.ScopeType == "organization"
}

func ResolveScopeLabel(session *bootstrap.SessionSummaryResponse, subdivisionID *uuid.UUID, unitID *uuid.UUID, ownerLabel *string) string {
	if ownerLabel != nil && strings.TrimSpace(*ownerLabel) != "" {
		return *ownerLabel
	}

	if unitID != nil {
		if unit, ok := VisibleUnitMap(session)[unitID.String()]; ok {
			return unit.Name
		}
		return "Юнит"
	}

	if subdivisionID != nil {
		if subdivision, ok := VisibleSubdivisionMap(session)[subdivisionID.String()]; ok {
			return subdivision.Name
		}
		return "Подразделение"
	}

	return session.Organization.Name
}

func ValidateStandardScope(
	session *bootstrap.SessionSummaryResponse,
	subdivisionValue *string,
	unitValue *string,
	ownerLabel *string,
) (*uuid.UUID, *uuid.UUID, *string, error) {
	if subdivisionValue != nil && unitValue != nil &&
		strings.TrimSpace(*subdivisionValue) != "" && strings.TrimSpace(*unitValue) != "" {
		return nil, nil, nil, ErrInvalidScope
	}

	if unitValue != nil && strings.TrimSpace(*unitValue) != "" {
		unit, err := ResolveVisibleUnit(session, *unitValue)
		if err != nil {
			return nil, nil, nil, err
		}
		parsed := uuid.MustParse(unit.ID)
		if ownerLabel == nil || strings.TrimSpace(*ownerLabel) == "" {
			label := unit.Name
			ownerLabel = &label
		}
		return nil, &parsed, ownerLabel, nil
	}

	if subdivisionValue != nil && strings.TrimSpace(*subdivisionValue) != "" {
		subdivisionID := strings.TrimSpace(*subdivisionValue)
		subdivision, ok := VisibleSubdivisionMap(session)[subdivisionID]
		if !ok {
			return nil, nil, nil, ErrInvalidSubdivision
		}
		parsed := uuid.MustParse(subdivisionID)
		if ownerLabel == nil || strings.TrimSpace(*ownerLabel) == "" {
			label := subdivision.Name
			ownerLabel = &label
		}
		return &parsed, nil, ownerLabel, nil
	}

	if session.Workspace.ScopeType != "organization" {
		return nil, nil, nil, ErrInvalidScope
	}

	if ownerLabel == nil || strings.TrimSpace(*ownerLabel) == "" {
		label := session.Organization.Name
		ownerLabel = &label
	}

	return nil, nil, ownerLabel, nil
}
