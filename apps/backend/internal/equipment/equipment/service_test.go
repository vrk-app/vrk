package equipment

import (
	"context"
	"testing"
	"time"

	"backend/internal/auth/bootstrap"

	"github.com/google/uuid"
)

type testEquipmentRepository struct {
	getByIDFn func(ctx context.Context, id uuid.UUID) (*Equipment, error)
	updateFn  func(ctx context.Context, item Equipment) (*Equipment, error)
}

func (r *testEquipmentRepository) Create(ctx context.Context, item Equipment) (*Equipment, error) {
	panic("unexpected call to Create")
}

func (r *testEquipmentRepository) GetByID(ctx context.Context, id uuid.UUID) (*Equipment, error) {
	if r.getByIDFn == nil {
		panic("unexpected call to GetByID")
	}
	return r.getByIDFn(ctx, id)
}

func (r *testEquipmentRepository) ListByOrganization(ctx context.Context, organizationID uuid.UUID, includeArchived bool) ([]Equipment, error) {
	panic("unexpected call to ListByOrganization")
}

func (r *testEquipmentRepository) Update(ctx context.Context, item Equipment) (*Equipment, error) {
	if r.updateFn == nil {
		panic("unexpected call to Update")
	}
	return r.updateFn(ctx, item)
}

func (r *testEquipmentRepository) Archive(ctx context.Context, id uuid.UUID) (*Equipment, error) {
	panic("unexpected call to Archive")
}

type testBootstrapService struct {
	session *bootstrap.SessionSummaryResponse
	err     error
}

func (s *testBootstrapService) CreateOrganizationShell(ctx context.Context, req bootstrap.CreateOrganizationShellRequest) (*bootstrap.OrganizationShellResponse, error) {
	panic("unexpected call to CreateOrganizationShell")
}

func (s *testBootstrapService) InspectInvite(ctx context.Context, token string) (*bootstrap.InviteInspectionResponse, error) {
	panic("unexpected call to InspectInvite")
}

func (s *testBootstrapService) AcceptInvite(ctx context.Context, token string, req bootstrap.AcceptInviteRequest) (*bootstrap.SessionSummaryResponse, error) {
	panic("unexpected call to AcceptInvite")
}

func (s *testBootstrapService) InspectPublicInvite(ctx context.Context, token string) (*bootstrap.PublicInviteInspectionResponse, error) {
	panic("unexpected call to InspectPublicInvite")
}

func (s *testBootstrapService) AcceptPublicInvite(ctx context.Context, token string, req bootstrap.AcceptInviteRequest) (*bootstrap.SessionSummaryResponse, error) {
	panic("unexpected call to AcceptPublicInvite")
}

func (s *testBootstrapService) CreateEmployeeInvite(ctx context.Context, token string, req bootstrap.CreateEmployeeInviteRequest) (*bootstrap.EmployeeInviteResponse, error) {
	panic("unexpected call to CreateEmployeeInvite")
}

func (s *testBootstrapService) ListEmployeeInvites(ctx context.Context, token string) ([]bootstrap.EmployeeInviteResponse, error) {
	panic("unexpected call to ListEmployeeInvites")
}

func (s *testBootstrapService) SendEmployeeInvite(ctx context.Context, token string, inviteID string) (*bootstrap.EmployeeInviteResponse, error) {
	panic("unexpected call to SendEmployeeInvite")
}

func (s *testBootstrapService) RevokeEmployeeInvite(ctx context.Context, token string, inviteID string) (*bootstrap.EmployeeInviteResponse, error) {
	panic("unexpected call to RevokeEmployeeInvite")
}

func (s *testBootstrapService) CreateSession(ctx context.Context, req bootstrap.CreateSessionRequest) (*bootstrap.SessionSummaryResponse, error) {
	panic("unexpected call to CreateSession")
}

func (s *testBootstrapService) GetSession(ctx context.Context, token string) (*bootstrap.SessionSummaryResponse, error) {
	return s.session, s.err
}

func (s *testBootstrapService) DeleteSession(ctx context.Context, token string) error {
	panic("unexpected call to DeleteSession")
}

func (s *testBootstrapService) CompleteLaunch(ctx context.Context, token string, req bootstrap.CompleteLaunchRequest) (*bootstrap.SessionSummaryResponse, error) {
	panic("unexpected call to CompleteLaunch")
}

func (s *testBootstrapService) UpdateCompanyProfile(ctx context.Context, token string, req bootstrap.CompanyProfileRequest) (*bootstrap.SessionSummaryResponse, error) {
	panic("unexpected call to UpdateCompanyProfile")
}

func (s *testBootstrapService) CreateDivision(ctx context.Context, token string, req bootstrap.StructureNodeRequest) (*bootstrap.SessionSummaryResponse, error) {
	panic("unexpected call to CreateDivision")
}

func (s *testBootstrapService) UpdateDivision(ctx context.Context, token string, divisionID string, req bootstrap.StructureNodeRequest) (*bootstrap.SessionSummaryResponse, error) {
	panic("unexpected call to UpdateDivision")
}

func (s *testBootstrapService) ArchiveDivision(ctx context.Context, token string, divisionID string) (*bootstrap.SessionSummaryResponse, error) {
	panic("unexpected call to ArchiveDivision")
}

func (s *testBootstrapService) CreateUnit(ctx context.Context, token string, req bootstrap.StructureNodeRequest) (*bootstrap.SessionSummaryResponse, error) {
	panic("unexpected call to CreateUnit")
}

func (s *testBootstrapService) UpdateUnit(ctx context.Context, token string, unitID string, req bootstrap.StructureNodeRequest) (*bootstrap.SessionSummaryResponse, error) {
	panic("unexpected call to UpdateUnit")
}

func (s *testBootstrapService) ArchiveUnit(ctx context.Context, token string, unitID string) (*bootstrap.SessionSummaryResponse, error) {
	panic("unexpected call to ArchiveUnit")
}

func TestUpdateRejectsArchivedEquipment(t *testing.T) {
	t.Parallel()

	equipmentID := uuid.New()
	now := time.Now()
	updateCalled := false

	service := NewService(&testEquipmentRepository{
		getByIDFn: func(ctx context.Context, id uuid.UUID) (*Equipment, error) {
			if id != equipmentID {
				t.Fatalf("unexpected id: %s", id)
			}

			return &Equipment{
				ID:              equipmentID.String(),
				OrganizationID:  "org-1",
				UnitID:          "unit-1",
				Manufacturer:    "Acme",
				Classification:  "sensor",
				Model:           "X1",
				FullName:        "Archived equipment",
				FactoryNumber:   "FN-1",
				ManufactureYear: 2024,
				Status:          "active",
				ArchivedAt:      &now,
			}, nil
		},
		updateFn: func(ctx context.Context, item Equipment) (*Equipment, error) {
			updateCalled = true
			return &item, nil
		},
	}, &testBootstrapService{
		session: &bootstrap.SessionSummaryResponse{
			Organization: bootstrap.SessionOrganizationResponse{
				ID:          "org-1",
				RoleTitle:   "customer",
				Name:        "Org 1",
				LaunchState: "active",
			},
			Grant: &bootstrap.SessionGrantResponse{
				ID:           "grant-1",
				RoleTemplate: bootstrap.RoleOrganizationAdmin,
				ScopeType:    "organization",
				ScopeID:      "org-1",
			},
			Workspace: bootstrap.SessionWorkspaceResponse{
				ScopeType: "organization",
				ScopeID:   "org-1",
			},
			Units: []bootstrap.UnitResponse{
				{
					ID:   "unit-1",
					Type: "laboratory",
					Name: "Unit 1",
				},
			},
		},
	})

	name := "Updated archived equipment"
	_, err := service.Update(context.Background(), "session-token", equipmentID.String(), UpdateRequest{
		FullName: &name,
	})
	if err != ErrAlreadyArchived {
		t.Fatalf("expected ErrAlreadyArchived, got %v", err)
	}
	if updateCalled {
		t.Fatal("repository.Update was called for archived equipment")
	}
}
