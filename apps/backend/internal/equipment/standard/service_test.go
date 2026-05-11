package standard

import (
	"context"
	"errors"
	"testing"

	"backend/internal/auth/bootstrap"

	"github.com/google/uuid"
)

type diagnosticScopeRepository struct {
	scope      *DiagnosticEquipmentScope
	standard   *Standard
	deletedID  uuid.UUID
	deleteErr  error
	getByIDErr error
}

func (r *diagnosticScopeRepository) Create(context.Context, Standard) (*Standard, error) {
	return nil, errors.New("not implemented")
}

func (r *diagnosticScopeRepository) GetByID(_ context.Context, id uuid.UUID) (*Standard, error) {
	if r.getByIDErr != nil {
		return nil, r.getByIDErr
	}
	if r.standard == nil || r.standard.ID != id.String() {
		return nil, ErrNotFound
	}
	return r.standard, nil
}

func (r *diagnosticScopeRepository) ListByOrganization(context.Context, uuid.UUID, bool) ([]Standard, error) {
	return nil, errors.New("not implemented")
}

func (r *diagnosticScopeRepository) Update(context.Context, Standard) (*Standard, error) {
	return nil, errors.New("not implemented")
}

func (r *diagnosticScopeRepository) Archive(context.Context, uuid.UUID) (*Standard, error) {
	return nil, errors.New("not implemented")
}

func (r *diagnosticScopeRepository) Delete(_ context.Context, id uuid.UUID) error {
	if r.deleteErr != nil {
		return r.deleteErr
	}
	r.deletedID = id
	return nil
}

func (r *diagnosticScopeRepository) GetDiagnosticEquipmentScope(context.Context, uuid.UUID) (*DiagnosticEquipmentScope, error) {
	if r.scope == nil {
		return nil, ErrDiagnosticEquipmentInvalid
	}
	return r.scope, nil
}

func standardTestSession(organizationID string, unitID string) *bootstrap.SessionSummaryResponse {
	return &bootstrap.SessionSummaryResponse{
		Organization: bootstrap.SessionOrganizationResponse{
			ID:          organizationID,
			RoleTitle:   "customer",
			Name:        "ВРК Тест",
			LaunchState: "active",
		},
		Grant: &bootstrap.SessionGrantResponse{
			ID:           "grant-1",
			RoleTemplate: bootstrap.RoleOrganizationAdmin,
			ScopeType:    "organization",
			ScopeID:      organizationID,
		},
		Workspace: bootstrap.SessionWorkspaceResponse{
			ScopeType: "organization",
			ScopeID:   organizationID,
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

type standardBootstrapService struct {
	bootstrap.Service
	session *bootstrap.SessionSummaryResponse
	err     error
}

func (s *standardBootstrapService) GetSession(context.Context, string) (*bootstrap.SessionSummaryResponse, error) {
	return s.session, s.err
}

func TestBuildCreateModelRequiresDiagnosticEquipment(t *testing.T) {
	service := &standardService{repository: &diagnosticScopeRepository{}}

	_, err := service.buildCreateModel(context.Background(), standardTestSession(uuid.NewString(), uuid.NewString()), CreateRequest{
		StandardType:                "Установочная мера",
		Model:                       "КУ-25",
		Identifier:                  "STD-1",
		MetrologicalCharacteristics: "25 мм",
	})
	if !errors.Is(err, ErrDiagnosticEquipmentRequired) {
		t.Fatalf("expected ErrDiagnosticEquipmentRequired, got %v", err)
	}
}

func TestBuildCreateModelBindsStandardToDiagnosticEquipment(t *testing.T) {
	organizationID := uuid.NewString()
	unitID := uuid.NewString()
	diagnosticEquipmentID := uuid.NewString()
	service := &standardService{
		repository: &diagnosticScopeRepository{
			scope: &DiagnosticEquipmentScope{
				ID:             diagnosticEquipmentID,
				Name:           "Манометр диагностический",
				OrganizationID: organizationID,
				UnitID:         unitID,
				UnitName:       "Юнит",
			},
		},
	}

	item, err := service.buildCreateModel(context.Background(), standardTestSession(organizationID, unitID), CreateRequest{
		DiagnosticEquipmentID:       &diagnosticEquipmentID,
		StandardType:                "Установочная мера",
		Model:                       "КУ-25",
		Identifier:                  "STD-1",
		MetrologicalCharacteristics: "25 мм",
	})
	if err != nil {
		t.Fatalf("expected owned standard model, got %v", err)
	}
	if item.DiagnosticEquipmentID == nil || *item.DiagnosticEquipmentID != diagnosticEquipmentID {
		t.Fatalf("expected diagnostic parent %s, got %v", diagnosticEquipmentID, item.DiagnosticEquipmentID)
	}
	if item.UnitID == nil || *item.UnitID != unitID {
		t.Fatalf("expected unit %s, got %v", unitID, item.UnitID)
	}
	if item.OwnerLabel == nil || *item.OwnerLabel != "Юнит" {
		t.Fatalf("expected owner label Юнит, got %v", item.OwnerLabel)
	}
}

func TestResolveDiagnosticEquipmentRejectsArchivedParent(t *testing.T) {
	organizationID := uuid.NewString()
	unitID := uuid.NewString()
	diagnosticEquipmentID := uuid.NewString()
	service := &standardService{
		repository: &diagnosticScopeRepository{
			scope: &DiagnosticEquipmentScope{
				ID:             diagnosticEquipmentID,
				Name:           "Манометр диагностический",
				OrganizationID: organizationID,
				UnitID:         unitID,
				UnitName:       "Юнит",
				Archived:       true,
			},
		},
	}

	_, err := service.resolveDiagnosticEquipment(
		context.Background(),
		standardTestSession(organizationID, unitID),
		diagnosticEquipmentID,
	)
	if !errors.Is(err, ErrArchivedTarget) {
		t.Fatalf("expected ErrArchivedTarget, got %v", err)
	}
}

func TestDeleteFromDiagnosticDeletesOwnedStandard(t *testing.T) {
	organizationID := uuid.NewString()
	unitID := uuid.NewString()
	diagnosticEquipmentID := uuid.NewString()
	standardID := uuid.New()
	repository := &diagnosticScopeRepository{
		scope: &DiagnosticEquipmentScope{
			ID:             diagnosticEquipmentID,
			Name:           "Манометр диагностический",
			OrganizationID: organizationID,
			UnitID:         unitID,
			UnitName:       "Юнит",
		},
		standard: &Standard{
			ID:                    standardID.String(),
			OrganizationID:        organizationID,
			UnitID:                &unitID,
			DiagnosticEquipmentID: &diagnosticEquipmentID,
			StandardType:          "Установочная мера",
			Model:                 "КУ-25",
			Identifier:            "STD-1",
			Status:                "active",
		},
	}
	service := &standardService{
		repository:  repository,
		authService: &standardBootstrapService{session: standardTestSession(organizationID, unitID)},
	}

	resp, err := service.DeleteFromDiagnostic(context.Background(), "session-token", diagnosticEquipmentID, standardID.String())
	if err != nil {
		t.Fatalf("expected owned standard deletion, got %v", err)
	}
	if resp.ID != standardID.String() {
		t.Fatalf("expected deleted id %s, got %s", standardID, resp.ID)
	}
	if repository.deletedID != standardID {
		t.Fatalf("expected repository.Delete(%s), got %s", standardID, repository.deletedID)
	}
}

func TestDeleteFromDiagnosticRejectsForeignOwnedStandard(t *testing.T) {
	organizationID := uuid.NewString()
	unitID := uuid.NewString()
	diagnosticEquipmentID := uuid.NewString()
	otherDiagnosticEquipmentID := uuid.NewString()
	standardID := uuid.New()
	repository := &diagnosticScopeRepository{
		scope: &DiagnosticEquipmentScope{
			ID:             diagnosticEquipmentID,
			Name:           "Манометр диагностический",
			OrganizationID: organizationID,
			UnitID:         unitID,
			UnitName:       "Юнит",
		},
		standard: &Standard{
			ID:                    standardID.String(),
			OrganizationID:        organizationID,
			UnitID:                &unitID,
			DiagnosticEquipmentID: &otherDiagnosticEquipmentID,
			StandardType:          "Установочная мера",
			Model:                 "КУ-25",
			Identifier:            "STD-1",
			Status:                "active",
		},
	}
	service := &standardService{
		repository:  repository,
		authService: &standardBootstrapService{session: standardTestSession(organizationID, unitID)},
	}

	_, err := service.DeleteFromDiagnostic(context.Background(), "session-token", diagnosticEquipmentID, standardID.String())
	if !errors.Is(err, ErrNotFound) {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
	if repository.deletedID != uuid.Nil {
		t.Fatalf("repository.Delete should not be called, got %s", repository.deletedID)
	}
}

func TestDeleteFromDiagnosticRejectsArchivedParent(t *testing.T) {
	organizationID := uuid.NewString()
	unitID := uuid.NewString()
	diagnosticEquipmentID := uuid.NewString()
	standardID := uuid.New()
	repository := &diagnosticScopeRepository{
		scope: &DiagnosticEquipmentScope{
			ID:             diagnosticEquipmentID,
			Name:           "Манометр диагностический",
			OrganizationID: organizationID,
			UnitID:         unitID,
			UnitName:       "Юнит",
			Archived:       true,
		},
		standard: &Standard{
			ID:                    standardID.String(),
			OrganizationID:        organizationID,
			UnitID:                &unitID,
			DiagnosticEquipmentID: &diagnosticEquipmentID,
			StandardType:          "Установочная мера",
			Model:                 "КУ-25",
			Identifier:            "STD-1",
			Status:                "active",
		},
	}
	service := &standardService{
		repository:  repository,
		authService: &standardBootstrapService{session: standardTestSession(organizationID, unitID)},
	}

	_, err := service.DeleteFromDiagnostic(context.Background(), "session-token", diagnosticEquipmentID, standardID.String())
	if !errors.Is(err, ErrArchivedTarget) {
		t.Fatalf("expected ErrArchivedTarget, got %v", err)
	}
	if repository.deletedID != uuid.Nil {
		t.Fatalf("repository.Delete should not be called, got %s", repository.deletedID)
	}
}

func TestDeleteFromDiagnosticRejectsReadonlySession(t *testing.T) {
	organizationID := uuid.NewString()
	unitID := uuid.NewString()
	diagnosticEquipmentID := uuid.NewString()
	standardID := uuid.New()
	session := standardTestSession(organizationID, unitID)
	session.Grant.RoleTemplate = bootstrap.RoleOrganizationHead
	repository := &diagnosticScopeRepository{
		scope: &DiagnosticEquipmentScope{
			ID:             diagnosticEquipmentID,
			Name:           "Манометр диагностический",
			OrganizationID: organizationID,
			UnitID:         unitID,
			UnitName:       "Юнит",
		},
		standard: &Standard{
			ID:                    standardID.String(),
			OrganizationID:        organizationID,
			UnitID:                &unitID,
			DiagnosticEquipmentID: &diagnosticEquipmentID,
			StandardType:          "Установочная мера",
			Model:                 "КУ-25",
			Identifier:            "STD-1",
			Status:                "active",
		},
	}
	service := &standardService{
		repository:  repository,
		authService: &standardBootstrapService{session: session},
	}

	_, err := service.DeleteFromDiagnostic(context.Background(), "session-token", diagnosticEquipmentID, standardID.String())
	if !errors.Is(err, ErrForbidden) {
		t.Fatalf("expected ErrForbidden, got %v", err)
	}
	if repository.deletedID != uuid.Nil {
		t.Fatalf("repository.Delete should not be called, got %s", repository.deletedID)
	}
}
