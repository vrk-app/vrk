package agreement

import (
	"context"
	"errors"
	"testing"
	"time"

	"backend/internal/auth/bootstrap"

	"github.com/google/uuid"
)

type stubAgreementRepository struct {
	getByID func(ctx context.Context, id uuid.UUID) (*Agreement, error)
	update  func(ctx context.Context, agreement Agreement) (*Agreement, error)
}

func (r stubAgreementRepository) Create(ctx context.Context, m Agreement) (*Agreement, error) {
	return nil, errors.New("unexpected Create call")
}

func (r stubAgreementRepository) GetByID(ctx context.Context, id uuid.UUID) (*Agreement, error) {
	return r.getByID(ctx, id)
}

func (r stubAgreementRepository) ListByCustomerOrganization(ctx context.Context, organizationID uuid.UUID) ([]Agreement, error) {
	return nil, errors.New("unexpected ListByCustomerOrganization call")
}

func (r stubAgreementRepository) ListByContractorOrganization(ctx context.Context, organizationID uuid.UUID) ([]Agreement, error) {
	return nil, errors.New("unexpected ListByContractorOrganization call")
}

func (r stubAgreementRepository) Update(ctx context.Context, agreement Agreement) (*Agreement, error) {
	return r.update(ctx, agreement)
}

func (r stubAgreementRepository) ListActiveContractors(ctx context.Context) ([]ContractorOption, error) {
	return nil, errors.New("unexpected ListActiveContractors call")
}

func (r stubAgreementRepository) GetActiveContractorByID(ctx context.Context, id uuid.UUID) (*ContractorOption, error) {
	return nil, errors.New("unexpected GetActiveContractorByID call")
}

type stubBootstrapService struct {
	bootstrap.Service
	getSession func(ctx context.Context, token string) (*bootstrap.SessionSummaryResponse, error)
}

func (s stubBootstrapService) GetSession(ctx context.Context, token string) (*bootstrap.SessionSummaryResponse, error) {
	return s.getSession(ctx, token)
}

func TestAgreementUpdateRejectsContractOutsideVisibleScope(t *testing.T) {
	t.Parallel()

	organizationID := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	agreementID := uuid.MustParse("22222222-2222-2222-2222-222222222222")
	divisionID := uuid.MustParse("33333333-3333-3333-3333-333333333333")
	contractorID := uuid.MustParse("44444444-4444-4444-4444-444444444444")
	nextStatus := ContractStatusActive
	updateCalled := false

	service := agreementService{
		repository: stubAgreementRepository{
			getByID: func(ctx context.Context, id uuid.UUID) (*Agreement, error) {
				if id != agreementID {
					t.Fatalf("agreement id = %s, want %s", id, agreementID)
				}
				return &Agreement{
					ID:                         agreementID,
					CustomerOrganizationID:     organizationID,
					CustomerOrganizationName:   "Заказчик",
					ContractorOrganizationID:   contractorID,
					ContractorOrganizationName: "Подрядчик",
					ContractNumber:             "C-001",
					ContractStatus:             ContractStatusInactive,
					StartDate:                  time.Date(2026, 4, 1, 0, 0, 0, 0, time.UTC),
					EndDate:                    time.Date(2026, 12, 31, 0, 0, 0, 0, time.UTC),
					WorkType:                   WorkTypeRepair,
					EquipmentType:              "Насос",
					Region:                     "Москва",
				}, nil
			},
			update: func(ctx context.Context, agreement Agreement) (*Agreement, error) {
				updateCalled = true
				return &agreement, nil
			},
		},
		authService: stubBootstrapService{
			getSession: func(ctx context.Context, token string) (*bootstrap.SessionSummaryResponse, error) {
				if token != "session-token" {
					t.Fatalf("token = %q, want session-token", token)
				}
				return &bootstrap.SessionSummaryResponse{
					SessionToken: "session-token",
					Organization: bootstrap.SessionOrganizationResponse{
						ID:          organizationID.String(),
						RoleTitle:   "customer",
						Name:        "Заказчик",
						LaunchState: "active",
					},
					Grant: &bootstrap.SessionGrantResponse{
						ID:           "grant-id",
						RoleTemplate: bootstrap.RoleDivisionAdmin,
						ScopeType:    bootstrap.ScopeDivision,
						ScopeID:      divisionID.String(),
					},
					Workspace: bootstrap.SessionWorkspaceResponse{
						ScopeType: bootstrap.ScopeDivision,
						ScopeID:   divisionID.String(),
						ScopeName: "Дивизион",
					},
					Divisions: []bootstrap.DivisionResponse{
						{
							ID:     divisionID.String(),
							Type:   "division",
							Name:   "Дивизион",
							Status: "active",
						},
					},
				}, nil
			},
		},
	}

	_, err := service.Update(context.Background(), "session-token", agreementID.String(), UpdateRequest{
		ContractStatus: &nextStatus,
	})
	if !errors.Is(err, ErrForbidden) {
		t.Fatalf("Update error = %v, want %v", err, ErrForbidden)
	}
	if updateCalled {
		t.Fatal("repository.Update was called for a contract outside visible scope")
	}
}
