package measuringinstrument

import (
	"context"
	"errors"
	"testing"

	"backend/internal/auth/bootstrap"

	"github.com/google/uuid"
)

type standardScopeRepository struct {
	scopes map[string]StandardScope
}

func (r *standardScopeRepository) Create(context.Context, MeasuringInstrument) (*MeasuringInstrument, error) {
	return nil, errors.New("not implemented")
}

func (r *standardScopeRepository) GetByID(context.Context, uuid.UUID) (*MeasuringInstrument, error) {
	return nil, errors.New("not implemented")
}

func (r *standardScopeRepository) ListByOrganization(context.Context, uuid.UUID, bool) ([]MeasuringInstrument, error) {
	return nil, errors.New("not implemented")
}

func (r *standardScopeRepository) Update(context.Context, MeasuringInstrument) (*MeasuringInstrument, error) {
	return nil, errors.New("not implemented")
}

func (r *standardScopeRepository) Archive(context.Context, uuid.UUID) (*MeasuringInstrument, error) {
	return nil, errors.New("not implemented")
}

func (r *standardScopeRepository) ReplaceStandardLinks(context.Context, uuid.UUID, []uuid.UUID) error {
	return errors.New("not implemented")
}

func (r *standardScopeRepository) ListStandardLinksByOrganization(context.Context, uuid.UUID) (map[string][]LinkedStandard, error) {
	return nil, errors.New("not implemented")
}

func (r *standardScopeRepository) GetStandardScopes(
	_ context.Context,
	_ uuid.UUID,
	standardIDs []uuid.UUID,
) (map[string]StandardScope, error) {
	result := make(map[string]StandardScope, len(standardIDs))
	for _, id := range standardIDs {
		if scope, ok := r.scopes[id.String()]; ok {
			result[id.String()] = scope
		}
	}
	return result, nil
}

func (r *standardScopeRepository) GetEquipmentSummary(context.Context, uuid.UUID) (*EquipmentSummary, string, string, error) {
	return nil, "", "", errors.New("not implemented")
}

func equipmentTestSession(organizationID string, unitID string) *bootstrap.SessionSummaryResponse {
	return &bootstrap.SessionSummaryResponse{
		Organization: bootstrap.SessionOrganizationResponse{
			ID:          organizationID,
			RoleTitle:   "customer",
			Name:        "ВРК Тест",
			LaunchState: "active",
		},
		Workspace: bootstrap.SessionWorkspaceResponse{
			ScopeType: "organization",
		},
		Units: []bootstrap.UnitResponse{
			{
				ID:     unitID,
				Type:   "ВРД",
				Name:   "Юнит",
				Status: "active",
			},
		},
	}
}

func TestValidateStandardIDsRejectsOwnedStandardFromAnotherDiagnosticEquipment(t *testing.T) {
	organizationID := uuid.NewString()
	unitID := uuid.NewString()
	currentDiagnosticID := uuid.NewString()
	otherDiagnosticID := uuid.NewString()
	standardID := uuid.New()
	repository := &standardScopeRepository{
		scopes: map[string]StandardScope{
			standardID.String(): {
				UnitID:                &unitID,
				DiagnosticEquipmentID: &otherDiagnosticID,
			},
		},
	}
	service := &measuringInstrumentService{repository: repository}

	_, err := service.validateStandardIDs(
		context.Background(),
		equipmentTestSession(organizationID, unitID),
		currentDiagnosticID,
		[]string{standardID.String()},
	)
	if !errors.Is(err, ErrStandardInvalid) {
		t.Fatalf("expected ErrStandardInvalid, got %v", err)
	}
}

func TestValidateStandardIDsAllowsOwnedStandardForSameDiagnosticEquipment(t *testing.T) {
	organizationID := uuid.NewString()
	unitID := uuid.NewString()
	currentDiagnosticID := uuid.NewString()
	standardID := uuid.New()
	repository := &standardScopeRepository{
		scopes: map[string]StandardScope{
			standardID.String(): {
				UnitID:                &unitID,
				DiagnosticEquipmentID: &currentDiagnosticID,
			},
		},
	}
	service := &measuringInstrumentService{repository: repository}

	ids, err := service.validateStandardIDs(
		context.Background(),
		equipmentTestSession(organizationID, unitID),
		currentDiagnosticID,
		[]string{standardID.String()},
	)
	if err != nil {
		t.Fatalf("expected owned standard to be accepted, got %v", err)
	}
	if len(ids) != 1 || ids[0] != standardID {
		t.Fatalf("expected %s, got %v", standardID, ids)
	}
}
