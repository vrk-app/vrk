package equipment

import (
	"context"
	"io"
	"testing"
	"time"

	"backend/internal/auth/bootstrap"
	"backend/internal/equipment/metrologyjournal"

	"github.com/google/uuid"
)

type testEquipmentRepository struct {
	getByIDFn            func(ctx context.Context, id uuid.UUID) (*Equipment, error)
	listByOrganizationFn func(ctx context.Context, organizationID uuid.UUID, includeArchived bool) ([]Equipment, error)
	updateFn             func(ctx context.Context, item Equipment) (*Equipment, error)
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
	if r.listByOrganizationFn == nil {
		panic("unexpected call to ListByOrganization")
	}
	return r.listByOrganizationFn(ctx, organizationID, includeArchived)
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

type testJournalRepository struct {
	createFn             func(ctx context.Context, entry metrologyjournal.Entry) (*metrologyjournal.Entry, error)
	listBySubjectFn      func(ctx context.Context, organizationID uuid.UUID, subjectType metrologyjournal.SubjectType, subjectID uuid.UUID) ([]metrologyjournal.Entry, error)
	listByOrganizationFn func(ctx context.Context, organizationID uuid.UUID, subjectType metrologyjournal.SubjectType) (map[string][]metrologyjournal.Entry, error)
}

func (r *testJournalRepository) Create(ctx context.Context, entry metrologyjournal.Entry) (*metrologyjournal.Entry, error) {
	if r.createFn == nil {
		panic("unexpected call to Create")
	}
	return r.createFn(ctx, entry)
}

func (r *testJournalRepository) ListBySubject(
	ctx context.Context,
	organizationID uuid.UUID,
	subjectType metrologyjournal.SubjectType,
	subjectID uuid.UUID,
) ([]metrologyjournal.Entry, error) {
	if r.listBySubjectFn == nil {
		panic("unexpected call to ListBySubject")
	}
	return r.listBySubjectFn(ctx, organizationID, subjectType, subjectID)
}

func (r *testJournalRepository) ListByOrganization(
	ctx context.Context,
	organizationID uuid.UUID,
	subjectType metrologyjournal.SubjectType,
) (map[string][]metrologyjournal.Entry, error) {
	if r.listByOrganizationFn == nil {
		panic("unexpected call to ListByOrganization")
	}
	return r.listByOrganizationFn(ctx, organizationID, subjectType)
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

func (s *testBootstrapService) ListEmployees(ctx context.Context, token string) ([]bootstrap.EmployeeAccessResponse, error) {
	panic("unexpected call to ListEmployees")
}

func (s *testBootstrapService) UpdateEmployeeAccess(ctx context.Context, token string, accessID string, req bootstrap.UpdateEmployeeAccessRequest) (*bootstrap.EmployeeAccessResponse, error) {
	panic("unexpected call to UpdateEmployeeAccess")
}

func (s *testBootstrapService) DeactivateEmployee(ctx context.Context, token string, accessID string) (*bootstrap.EmployeeAccessResponse, error) {
	panic("unexpected call to DeactivateEmployee")
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

func (s *testBootstrapService) UploadCompanyLogo(ctx context.Context, token string, fileName string, contentType string, body io.Reader) (*bootstrap.SessionSummaryResponse, error) {
	panic("unexpected call to UploadCompanyLogo")
}

func (s *testBootstrapService) GetCompanyLogo(ctx context.Context, token string) (*bootstrap.CompanyLogoObject, error) {
	panic("unexpected call to GetCompanyLogo")
}

func (s *testBootstrapService) DeleteCompanyLogo(ctx context.Context, token string) (*bootstrap.SessionSummaryResponse, error) {
	panic("unexpected call to DeleteCompanyLogo")
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
	}, nil, testCustomerSession("org-1", "unit-1", bootstrap.RoleOrganizationAdmin), nil)

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

func TestCreateJournalPersistsTechnicalSubjectAndUpdatesDerivedStatus(t *testing.T) {
	t.Parallel()

	orgID := uuid.New()
	equipmentID := uuid.New()
	unitID := uuid.New()
	validUntil := time.Date(2026, 11, 30, 0, 0, 0, 0, time.UTC)
	operationDate := time.Date(2026, 3, 12, 0, 0, 0, 0, time.UTC)
	createdAt := time.Date(2026, 3, 12, 8, 0, 0, 0, time.UTC)
	createdEntry := metrologyjournal.Entry{
		ID:                   uuid.New().String(),
		OrganizationID:       orgID.String(),
		SubjectType:          metrologyjournal.SubjectTypeTechnicalEquipment,
		SubjectID:            equipmentID.String(),
		OperationType:        metrologyjournal.OperationTypeVerification,
		OperationDate:        operationDate,
		DocumentNumber:       "TECH-2026-001",
		ValidUntil:           &validUntil,
		ExecutorOrganization: "ФБУ Ростест-Москва",
		CreatedAt:            createdAt,
	}

	updateCalled := false
	service := NewService(&testEquipmentRepository{
		getByIDFn: func(ctx context.Context, id uuid.UUID) (*Equipment, error) {
			if id != equipmentID {
				t.Fatalf("unexpected id: %s", id)
			}
			return testEquipmentRecord(orgID, unitID, equipmentID, "inactive", nil), nil
		},
		updateFn: func(ctx context.Context, item Equipment) (*Equipment, error) {
			updateCalled = true
			if item.Status != "active" {
				t.Fatalf("expected derived status active, got %s", item.Status)
			}
			return &item, nil
		},
	}, &testJournalRepository{
		createFn: func(ctx context.Context, entry metrologyjournal.Entry) (*metrologyjournal.Entry, error) {
			if entry.SubjectType != metrologyjournal.SubjectTypeTechnicalEquipment {
				t.Fatalf("expected technical subject, got %s", entry.SubjectType)
			}
			if entry.SubjectID != equipmentID.String() {
				t.Fatalf("unexpected subject id: %s", entry.SubjectID)
			}
			return &createdEntry, nil
		},
		listBySubjectFn: func(ctx context.Context, organizationID uuid.UUID, subjectType metrologyjournal.SubjectType, subjectID uuid.UUID) ([]metrologyjournal.Entry, error) {
			if organizationID != orgID || subjectType != metrologyjournal.SubjectTypeTechnicalEquipment || subjectID != equipmentID {
				t.Fatalf("unexpected list subject args: %s %s %s", organizationID, subjectType, subjectID)
			}
			return []metrologyjournal.Entry{createdEntry}, nil
		},
	}, testCustomerSession(orgID.String(), unitID.String(), bootstrap.RoleOrganizationAdmin), nil)

	response, err := service.CreateJournal(context.Background(), "session-token", equipmentID.String(), CreateJournalRequest{
		OperationType:        "verification",
		OperationDate:        "2026-03-12",
		DocumentNumber:       "TECH-2026-001",
		ValidUntil:           ptrString("2026-11-30"),
		ExecutorOrganization: "ФБУ Ростест-Москва",
	})
	if err != nil {
		t.Fatalf("CreateJournal returned error: %v", err)
	}
	if !updateCalled {
		t.Fatal("repository.Update was not called")
	}
	if response.DocumentNumber != "TECH-2026-001" || response.ValidUntil == nil || *response.ValidUntil != "2026-11-30" {
		t.Fatalf("unexpected journal response: %+v", response)
	}

	listed, err := service.ListJournals(context.Background(), "session-token", equipmentID.String())
	if err != nil {
		t.Fatalf("ListJournals returned error: %v", err)
	}
	if len(listed) != 1 || listed[0].DocumentNumber != "TECH-2026-001" {
		t.Fatalf("unexpected listed journals: %+v", listed)
	}
}

func TestListAppliesTechnicalJournalDerivedState(t *testing.T) {
	t.Parallel()

	orgID := uuid.New()
	equipmentID := uuid.New()
	unitID := uuid.New()
	validUntil := time.Date(2026, 11, 30, 0, 0, 0, 0, time.UTC)
	entry := metrologyjournal.Entry{
		ID:                   uuid.New().String(),
		OrganizationID:       orgID.String(),
		SubjectType:          metrologyjournal.SubjectTypeTechnicalEquipment,
		SubjectID:            equipmentID.String(),
		OperationType:        metrologyjournal.OperationTypeVerification,
		OperationDate:        time.Date(2026, 3, 12, 0, 0, 0, 0, time.UTC),
		DocumentNumber:       "TECH-2026-002",
		ValidUntil:           &validUntil,
		ExecutorOrganization: "ФБУ Ростест-Москва",
		CreatedAt:            time.Date(2026, 3, 12, 8, 0, 0, 0, time.UTC),
	}

	service := NewService(&testEquipmentRepository{
		listByOrganizationFn: func(ctx context.Context, organizationID uuid.UUID, includeArchived bool) ([]Equipment, error) {
			if organizationID != orgID {
				t.Fatalf("unexpected organization id: %s", organizationID)
			}
			return []Equipment{*testEquipmentRecord(orgID, unitID, equipmentID, "inactive", nil)}, nil
		},
	}, &testJournalRepository{
		listByOrganizationFn: func(ctx context.Context, organizationID uuid.UUID, subjectType metrologyjournal.SubjectType) (map[string][]metrologyjournal.Entry, error) {
			if organizationID != orgID || subjectType != metrologyjournal.SubjectTypeTechnicalEquipment {
				t.Fatalf("unexpected list organization args: %s %s", organizationID, subjectType)
			}
			return map[string][]metrologyjournal.Entry{
				equipmentID.String(): []metrologyjournal.Entry{entry},
			}, nil
		},
	}, testCustomerSession(orgID.String(), unitID.String(), bootstrap.RoleOrganizationAdmin), nil)

	items, total, err := service.List(context.Background(), "session-token", false, 20, 0)
	if err != nil {
		t.Fatalf("List returned error: %v", err)
	}
	if total != 1 || len(items) != 1 {
		t.Fatalf("unexpected list size: total=%d items=%d", total, len(items))
	}
	if items[0].Status != "active" {
		t.Fatalf("expected derived active status, got %s", items[0].Status)
	}
	if items[0].NextDueDate == nil || *items[0].NextDueDate != "2026-11-30" {
		t.Fatalf("expected next due date, got %+v", items[0].NextDueDate)
	}
	if items[0].JournalCount != 1 || items[0].LatestJournal == nil {
		t.Fatalf("expected journal summary, got count=%d latest=%+v", items[0].JournalCount, items[0].LatestJournal)
	}
}

func TestCreateJournalRejectsArchivedTechnicalEquipment(t *testing.T) {
	t.Parallel()

	orgID := uuid.New()
	equipmentID := uuid.New()
	unitID := uuid.New()
	archivedAt := time.Now()
	createCalled := false
	updateCalled := false

	service := NewService(&testEquipmentRepository{
		getByIDFn: func(ctx context.Context, id uuid.UUID) (*Equipment, error) {
			return testEquipmentRecord(orgID, unitID, equipmentID, "active", &archivedAt), nil
		},
		updateFn: func(ctx context.Context, item Equipment) (*Equipment, error) {
			updateCalled = true
			return &item, nil
		},
	}, &testJournalRepository{
		createFn: func(ctx context.Context, entry metrologyjournal.Entry) (*metrologyjournal.Entry, error) {
			createCalled = true
			return &entry, nil
		},
	}, testCustomerSession(orgID.String(), unitID.String(), bootstrap.RoleOrganizationAdmin), nil)

	_, err := service.CreateJournal(context.Background(), "session-token", equipmentID.String(), CreateJournalRequest{
		OperationType:        "verification",
		OperationDate:        "2026-03-12",
		DocumentNumber:       "TECH-2026-003",
		ExecutorOrganization: "ФБУ Ростест-Москва",
	})
	if err != ErrAlreadyArchived {
		t.Fatalf("expected ErrAlreadyArchived, got %v", err)
	}
	if createCalled {
		t.Fatal("journal Create was called for archived equipment")
	}
	if updateCalled {
		t.Fatal("repository.Update was called for archived equipment")
	}
}

func TestListJournalsRejectsEquipmentOutsideVisibleScope(t *testing.T) {
	t.Parallel()

	orgID := uuid.New()
	equipmentID := uuid.New()
	hiddenUnitID := uuid.New()
	visibleUnitID := uuid.New()
	listCalled := false

	service := NewService(&testEquipmentRepository{
		getByIDFn: func(ctx context.Context, id uuid.UUID) (*Equipment, error) {
			return testEquipmentRecord(orgID, hiddenUnitID, equipmentID, "active", nil), nil
		},
	}, &testJournalRepository{
		listBySubjectFn: func(ctx context.Context, organizationID uuid.UUID, subjectType metrologyjournal.SubjectType, subjectID uuid.UUID) ([]metrologyjournal.Entry, error) {
			listCalled = true
			return nil, nil
		},
	}, testCustomerSession(orgID.String(), visibleUnitID.String(), bootstrap.RoleOrganizationAdmin), nil)

	_, err := service.ListJournals(context.Background(), "session-token", equipmentID.String())
	if err != ErrForbidden {
		t.Fatalf("expected ErrForbidden, got %v", err)
	}
	if listCalled {
		t.Fatal("journal ListBySubject was called for hidden equipment")
	}
}

func testCustomerSession(organizationID string, unitID string, role string) *testBootstrapService {
	return &testBootstrapService{
		session: &bootstrap.SessionSummaryResponse{
			Organization: bootstrap.SessionOrganizationResponse{
				ID:          organizationID,
				RoleTitle:   "customer",
				Name:        "Org 1",
				LaunchState: "active",
			},
			Grant: &bootstrap.SessionGrantResponse{
				ID:           "grant-1",
				RoleTemplate: role,
				ScopeType:    "organization",
				ScopeID:      organizationID,
			},
			Workspace: bootstrap.SessionWorkspaceResponse{
				ScopeType: "organization",
				ScopeID:   organizationID,
			},
			Units: []bootstrap.UnitResponse{
				{
					ID:   unitID,
					Type: "laboratory",
					Name: "Unit 1",
				},
			},
		},
	}
}

func testEquipmentRecord(organizationID uuid.UUID, unitID uuid.UUID, equipmentID uuid.UUID, status string, archivedAt *time.Time) *Equipment {
	return &Equipment{
		ID:              equipmentID.String(),
		OrganizationID:  organizationID.String(),
		UnitID:          unitID.String(),
		UnitName:        "Unit 1",
		Manufacturer:    "Acme",
		Classification:  "sensor",
		Model:           "X1",
		FullName:        "Technical equipment",
		FactoryNumber:   "FN-1",
		ManufactureYear: 2024,
		Status:          status,
		ArchivedAt:      archivedAt,
		CreatedAt:       time.Date(2026, 1, 1, 8, 0, 0, 0, time.UTC),
		UpdatedAt:       time.Date(2026, 1, 1, 8, 0, 0, 0, time.UTC),
	}
}

func ptrString(value string) *string {
	return &value
}
