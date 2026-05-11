package bootstrap

import (
	"backend/internal/db/generated"
	"context"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/google/uuid"
)

type stubBootstrapService struct {
	createSession func(ctx context.Context, req CreateSessionRequest) (*SessionSummaryResponse, error)
}

func (s stubBootstrapService) CreateOrganizationShell(ctx context.Context, req CreateOrganizationShellRequest) (*OrganizationShellResponse, error) {
	return nil, errors.New("unexpected call")
}

func (s stubBootstrapService) InspectInvite(ctx context.Context, token string) (*InviteInspectionResponse, error) {
	return nil, errors.New("unexpected call")
}

func (s stubBootstrapService) AcceptInvite(ctx context.Context, token string, req AcceptInviteRequest) (*SessionSummaryResponse, error) {
	return nil, errors.New("unexpected call")
}

func (s stubBootstrapService) InspectPublicInvite(ctx context.Context, token string) (*PublicInviteInspectionResponse, error) {
	return nil, errors.New("unexpected call")
}

func (s stubBootstrapService) AcceptPublicInvite(ctx context.Context, token string, req AcceptInviteRequest) (*SessionSummaryResponse, error) {
	return nil, errors.New("unexpected call")
}

func (s stubBootstrapService) CreateEmployeeInvite(ctx context.Context, token string, req CreateEmployeeInviteRequest) (*EmployeeInviteResponse, error) {
	return nil, errors.New("unexpected call")
}

func (s stubBootstrapService) ListEmployeeInvites(ctx context.Context, token string) ([]EmployeeInviteResponse, error) {
	return nil, errors.New("unexpected call")
}

func (s stubBootstrapService) SendEmployeeInvite(ctx context.Context, token string, inviteID string) (*EmployeeInviteResponse, error) {
	return nil, errors.New("unexpected call")
}

func (s stubBootstrapService) RevokeEmployeeInvite(ctx context.Context, token string, inviteID string) (*EmployeeInviteResponse, error) {
	return nil, errors.New("unexpected call")
}

func (s stubBootstrapService) ListEmployees(ctx context.Context, token string) ([]EmployeeAccessResponse, error) {
	return nil, errors.New("unexpected call")
}

func (s stubBootstrapService) UpdateEmployeeAccess(ctx context.Context, token string, accessID string, req UpdateEmployeeAccessRequest) (*EmployeeAccessResponse, error) {
	return nil, errors.New("unexpected call")
}

func (s stubBootstrapService) DeactivateEmployee(ctx context.Context, token string, accessID string) (*EmployeeAccessResponse, error) {
	return nil, errors.New("unexpected call")
}

func (s stubBootstrapService) CreateSession(ctx context.Context, req CreateSessionRequest) (*SessionSummaryResponse, error) {
	return s.createSession(ctx, req)
}

func (s stubBootstrapService) GetSession(ctx context.Context, token string) (*SessionSummaryResponse, error) {
	return nil, errors.New("unexpected call")
}

func (s stubBootstrapService) DeleteSession(ctx context.Context, token string) error {
	return errors.New("unexpected call")
}

func (s stubBootstrapService) CompleteLaunch(ctx context.Context, token string, req CompleteLaunchRequest) (*SessionSummaryResponse, error) {
	return nil, errors.New("unexpected call")
}

func (s stubBootstrapService) UpdateCompanyProfile(ctx context.Context, token string, req CompanyProfileRequest) (*SessionSummaryResponse, error) {
	return nil, errors.New("unexpected call")
}

func (s stubBootstrapService) UploadCompanyLogo(ctx context.Context, token string, fileName string, contentType string, body io.Reader) (*SessionSummaryResponse, error) {
	return nil, errors.New("unexpected call")
}

func (s stubBootstrapService) GetCompanyLogo(ctx context.Context, token string) (*CompanyLogoObject, error) {
	return nil, errors.New("unexpected call")
}

func (s stubBootstrapService) DeleteCompanyLogo(ctx context.Context, token string) (*SessionSummaryResponse, error) {
	return nil, errors.New("unexpected call")
}

func (s stubBootstrapService) CreateDivision(ctx context.Context, token string, req StructureNodeRequest) (*SessionSummaryResponse, error) {
	return nil, errors.New("unexpected call")
}

func (s stubBootstrapService) UpdateDivision(ctx context.Context, token string, divisionID string, req StructureNodeRequest) (*SessionSummaryResponse, error) {
	return nil, errors.New("unexpected call")
}

func (s stubBootstrapService) ArchiveDivision(ctx context.Context, token string, divisionID string) (*SessionSummaryResponse, error) {
	return nil, errors.New("unexpected call")
}

func (s stubBootstrapService) CreateUnit(ctx context.Context, token string, req StructureNodeRequest) (*SessionSummaryResponse, error) {
	return nil, errors.New("unexpected call")
}

func (s stubBootstrapService) UpdateUnit(ctx context.Context, token string, unitID string, req StructureNodeRequest) (*SessionSummaryResponse, error) {
	return nil, errors.New("unexpected call")
}

func (s stubBootstrapService) ArchiveUnit(ctx context.Context, token string, unitID string) (*SessionSummaryResponse, error) {
	return nil, errors.New("unexpected call")
}

func TestCreateSessionClassifiesAccessSelectionConflict(t *testing.T) {
	t.Parallel()

	handler := NewHandler(stubBootstrapService{
		createSession: func(ctx context.Context, req CreateSessionRequest) (*SessionSummaryResponse, error) {
			return nil, ErrAccessSelectionRequired
		},
	})

	req := httptest.NewRequest(http.MethodPost, "/sessions", strings.NewReader(`{"email":"test@vrk.local","password":"secret"}`))
	rec := httptest.NewRecorder()

	handler.CreateSession(rec, req)

	if rec.Code != http.StatusConflict {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusConflict)
	}
	if !strings.Contains(rec.Body.String(), ErrAccessSelectionRequired.Error()) {
		t.Fatalf("expected response to include conflict message, got %s", rec.Body.String())
	}
}

func TestNormalizeCompanyProfilePropertyType(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name     string
		req      CompanyProfileRequest
		wantType string
		wantErr  error
	}{
		{
			name: "accepts current ООО property type",
			req: CompanyProfileRequest{
				PropertyType: stringPointer("ООО"),
				Name:         "VRK Customer",
			},
			wantType: "ООО",
		},
		{
			name: "maps legacy ОАО to ПАО",
			req: CompanyProfileRequest{
				Type: "ОАО",
				Name: "VRK Customer",
			},
			wantType: "ПАО",
		},
		{
			name: "maps legacy ЗАО to НАО",
			req: CompanyProfileRequest{
				Type: "ЗАО",
				Name: "VRK Customer",
			},
			wantType: "НАО",
		},
		{
			name: "maps legacy АО to НАО",
			req: CompanyProfileRequest{
				Type: "АО",
				Name: "VRK Customer",
			},
			wantType: "НАО",
		},
		{
			name: "accepts current ИП property type and clears kpp",
			req: CompanyProfileRequest{
				Type: "ИП",
				Name: "VRK Customer",
				Inn:  stringPointer("123456789012"),
				Kpp:  stringPointer("123456789"),
				Ogrn: stringPointer("123456789012345"),
			},
			wantType: "ИП",
		},
		{
			name: "maps legacy LLC to ООО",
			req: CompanyProfileRequest{
				Type: "LLC",
				Name: "VRK Customer",
			},
			wantType: "ООО",
		},
		{
			name: "rejects operational unit type as organization legal form",
			req: CompanyProfileRequest{
				Type: "ВРД",
				Name: "VRK Customer",
			},
			wantErr: ErrPropertyTypeInvalid,
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			err := normalizeCompanyProfileRequest(&tt.req)
			if tt.wantErr != nil {
				if !errors.Is(err, tt.wantErr) {
					t.Fatalf("error = %v, want %v", err, tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if tt.req.Type != tt.wantType {
				t.Fatalf("type = %q, want %q", tt.req.Type, tt.wantType)
			}
			if tt.req.PropertyType == nil || *tt.req.PropertyType != tt.wantType {
				t.Fatalf("propertyType = %v, want %q", tt.req.PropertyType, tt.wantType)
			}
			if tt.wantType == "ИП" && tt.req.Kpp != nil {
				t.Fatalf("kpp = %v, want nil for ИП", tt.req.Kpp)
			}
		})
	}
}

func TestNormalizeCompanyProfileRequisitesValidation(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name    string
		req     CompanyProfileRequest
		wantErr error
	}{
		{
			name: "accepts legal entity requisites",
			req: CompanyProfileRequest{
				Type:                 "НАО",
				Name:                 "VRK Customer",
				Inn:                  stringPointer("1234567890"),
				Kpp:                  stringPointer("123456789"),
				Ogrn:                 stringPointer("1234567890123"),
				SettlementAccount:    stringPointer("40702810900000000001"),
				CorrespondentAccount: stringPointer("30101810400000000225"),
				Bik:                  stringPointer("044525225"),
			},
		},
		{
			name: "rejects wrong IP inn length",
			req: CompanyProfileRequest{
				Type: "ИП",
				Name: "VRK Customer",
				Inn:  stringPointer("1234567890"),
			},
			wantErr: ErrInnInvalid,
		},
		{
			name: "rejects non-digit settlement account",
			req: CompanyProfileRequest{
				Type:              "ООО",
				Name:              "VRK Customer",
				SettlementAccount: stringPointer("4070281090000000000A"),
			},
			wantErr: ErrBankAccountInvalid,
		},
		{
			name: "rejects wrong bik length",
			req: CompanyProfileRequest{
				Type: "ООО",
				Name: "VRK Customer",
				Bik:  stringPointer("04452522"),
			},
			wantErr: ErrBikInvalid,
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			err := normalizeCompanyProfileRequest(&tt.req)
			if tt.wantErr != nil {
				if !errors.Is(err, tt.wantErr) {
					t.Fatalf("error = %v, want %v", err, tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
		})
	}
}

func TestHashInvitePasswordPolicy(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name     string
		password string
		wantErr  error
	}{
		{name: "accepts eight characters", password: "password"},
		{name: "accepts digits only", password: "12345678"},
		{name: "accepts symbols only", password: "________"},
		{name: "rejects too short", password: "Vrk_26", wantErr: ErrPasswordTooShort},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			_, err := hashInvitePassword(tt.password)
			if tt.wantErr != nil {
				if !errors.Is(err, tt.wantErr) {
					t.Fatalf("error = %v, want %v", err, tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
		})
	}
}

func TestNormalizeLogoContentType(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name        string
		fileName    string
		contentType string
		payload     []byte
		want        string
	}{
		{
			name:        "accepts detected png",
			fileName:    "logo.bin",
			contentType: "application/octet-stream",
			payload:     []byte{0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a},
			want:        "image/png",
		},
		{
			name:        "accepts declared svg",
			fileName:    "logo.svg",
			contentType: "image/svg+xml; charset=utf-8",
			payload:     []byte("<svg xmlns=\"http://www.w3.org/2000/svg\"/>"),
			want:        "image/svg+xml",
		},
		{
			name:        "rejects plain text",
			fileName:    "logo.txt",
			contentType: "text/plain",
			payload:     []byte("not an image"),
			want:        "",
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			if got := normalizeLogoContentType(tt.fileName, tt.contentType, tt.payload); got != tt.want {
				t.Fatalf("content type = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestNormalizeStructureNodeTypeRules(t *testing.T) {
	t.Parallel()

	divisionReq := StructureNodeRequest{Name: "Division"}
	if err := normalizeStructureNodeRequest(&divisionReq, false, &sessionSnapshot{}, ErrDivisionNameRequired); err != nil {
		t.Fatalf("division without type returned error: %v", err)
	}
	if divisionReq.Type != defaultDivisionType {
		t.Fatalf("division type = %q, want %q", divisionReq.Type, defaultDivisionType)
	}

	unitReq := StructureNodeRequest{Name: "Unit", Type: "ВУ"}
	if err := normalizeStructureNodeRequest(&unitReq, true, &sessionSnapshot{}, ErrUnitNameRequired); err != nil {
		t.Fatalf("unit with valid type returned error: %v", err)
	}

	missingUnitType := StructureNodeRequest{Name: "Unit"}
	if err := normalizeStructureNodeRequest(&missingUnitType, true, &sessionSnapshot{}, ErrUnitNameRequired); !errors.Is(err, ErrUnitTypeRequired) {
		t.Fatalf("unit without type error = %v, want %v", err, ErrUnitTypeRequired)
	}

	invalidUnitType := StructureNodeRequest{Name: "Unit", Type: "ООО"}
	if err := normalizeStructureNodeRequest(&invalidUnitType, true, &sessionSnapshot{}, ErrUnitNameRequired); !errors.Is(err, ErrStructureTypeInvalid) {
		t.Fatalf("unit with invalid type error = %v, want %v", err, ErrStructureTypeInvalid)
	}
}

func TestEmployeeCapabilityRules(t *testing.T) {
	t.Parallel()

	scopeID := toPGUUID(uuid.MustParse("11111111-1111-1111-1111-111111111111"))
	tests := []struct {
		name         string
		roleTemplate string
		scopeType    string
		orgRole      string
		wantView     bool
		wantManage   bool
		wantInvite   bool
	}{
		{
			name:         "customer organization admin can view and manage",
			roleTemplate: RoleOrganizationAdmin,
			scopeType:    ScopeOrganization,
			orgRole:      "customer",
			wantView:     true,
			wantManage:   true,
			wantInvite:   true,
		},
		{
			name:         "organization head can view only",
			roleTemplate: RoleOrganizationHead,
			scopeType:    ScopeOrganization,
			orgRole:      "customer",
			wantView:     true,
		},
		{
			name:         "division head can view own subtree",
			roleTemplate: RoleDivisionHead,
			scopeType:    ScopeDivision,
			orgRole:      "customer",
			wantView:     true,
		},
		{
			name:         "division admin can view, invite and manage own subtree",
			roleTemplate: RoleDivisionAdmin,
			scopeType:    ScopeDivision,
			orgRole:      "customer",
			wantView:     true,
			wantManage:   true,
			wantInvite:   true,
		},
		{
			name:         "unit head can view own unit",
			roleTemplate: RoleUnitHead,
			scopeType:    ScopeUnit,
			orgRole:      "customer",
			wantView:     true,
		},
		{
			name:         "unit admin can view, invite and manage own unit",
			roleTemplate: RoleUnitAdmin,
			scopeType:    ScopeUnit,
			orgRole:      "customer",
			wantView:     true,
			wantManage:   true,
			wantInvite:   true,
		},
		{
			name:         "auditor can view by its own scope",
			roleTemplate: RoleAuditor,
			scopeType:    ScopeDivision,
			orgRole:      "customer",
			wantView:     true,
		},
		{
			name:         "division operator cannot view employees",
			roleTemplate: RoleDivisionOperator,
			scopeType:    ScopeDivision,
			orgRole:      "customer",
		},
		{
			name:         "contractor organization admin cannot view customer employees",
			roleTemplate: RoleOrganizationAdmin,
			scopeType:    ScopeOrganization,
			orgRole:      "contractor",
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			snapshot := &sessionSnapshot{
				SessionRow: generated.GetCurrentSessionRow{
					OrganizationLaunchState: "active",
					OrganizationRoleTitle:   tt.orgRole,
					GrantRoleTemplate:       tt.roleTemplate,
					GrantScopeType:          tt.scopeType,
					GrantScopeID:            scopeID,
				},
			}

			if got := canViewEmployees(snapshot); got != tt.wantView {
				t.Fatalf("canViewEmployees = %v, want %v", got, tt.wantView)
			}
			if got := canManageEmployees(snapshot); got != tt.wantManage {
				t.Fatalf("canManageEmployees = %v, want %v", got, tt.wantManage)
			}
			if got := canManageEmployeeInvites(snapshot); got != tt.wantInvite {
				t.Fatalf("canManageEmployeeInvites = %v, want %v", got, tt.wantInvite)
			}
		})
	}
}

func TestNormalizeEmployeeAccessUpdateRequest(t *testing.T) {
	t.Parallel()

	organizationID := uuid.MustParse("00000000-0000-0000-0000-000000000001")
	divisionID := uuid.MustParse("00000000-0000-0000-0000-000000000002")
	unitID := uuid.MustParse("00000000-0000-0000-0000-000000000003")
	invisibleUnitID := uuid.MustParse("00000000-0000-0000-0000-000000000004")
	snapshot := &sessionSnapshot{
		SessionRow: generated.GetCurrentSessionRow{
			OrganizationID: toPGUUID(organizationID),
			GrantScopeType: ScopeOrganization,
		},
		Divisions: []generated.AuthDivision{{ID: toPGUUID(divisionID)}},
		Units:     []generated.AuthUnit{{ID: toPGUUID(unitID), DivisionID: toPGUUID(divisionID)}},
	}

	tests := []struct {
		name    string
		req     UpdateEmployeeAccessRequest
		wantErr error
	}{
		{
			name: "accepts compatible visible unit scope",
			req: UpdateEmployeeAccessRequest{
				RoleTemplate: RoleUnitHead,
				ScopeType:    ScopeUnit,
				ScopeID:      unitID.String(),
			},
		},
		{
			name: "accepts organization auditor",
			req: UpdateEmployeeAccessRequest{
				RoleTemplate: RoleAuditor,
				ScopeType:    ScopeOrganization,
				ScopeID:      organizationID.String(),
			},
		},
		{
			name: "rejects incompatible role and scope",
			req: UpdateEmployeeAccessRequest{
				RoleTemplate: RoleDivisionHead,
				ScopeType:    ScopeUnit,
				ScopeID:      unitID.String(),
			},
			wantErr: ErrInviteRoleScopeInvalid,
		},
		{
			name: "rejects invisible target scope",
			req: UpdateEmployeeAccessRequest{
				RoleTemplate: RoleUnitHead,
				ScopeType:    ScopeUnit,
				ScopeID:      invisibleUnitID.String(),
			},
			wantErr: ErrInviteScopeTargetInvalid,
		},
		{
			name: "rejects malformed scope id",
			req: UpdateEmployeeAccessRequest{
				RoleTemplate: RoleAuditor,
				ScopeType:    ScopeOrganization,
				ScopeID:      "not-a-uuid",
			},
			wantErr: ErrInviteScopeTargetInvalid,
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			err := normalizeEmployeeAccessUpdateRequest(snapshot, &tt.req)
			if tt.wantErr != nil {
				if !errors.Is(err, tt.wantErr) {
					t.Fatalf("error = %v, want %v", err, tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
		})
	}
}

func TestNormalizeEmployeeAccessUpdateRejectsBroaderScopeForScopedAdmin(t *testing.T) {
	t.Parallel()

	organizationID := uuid.MustParse("00000000-0000-0000-0000-000000000001")
	divisionID := uuid.MustParse("00000000-0000-0000-0000-000000000002")
	unitID := uuid.MustParse("00000000-0000-0000-0000-000000000003")
	snapshot := &sessionSnapshot{
		SessionRow: generated.GetCurrentSessionRow{
			OrganizationID: toPGUUID(organizationID),
			GrantScopeType: ScopeDivision,
			GrantScopeID:   toPGUUID(divisionID),
		},
		Divisions: []generated.AuthDivision{{ID: toPGUUID(divisionID)}},
		Units:     []generated.AuthUnit{{ID: toPGUUID(unitID), DivisionID: toPGUUID(divisionID)}},
	}

	organizationReq := UpdateEmployeeAccessRequest{
		RoleTemplate: RoleOrganizationHead,
		ScopeType:    ScopeOrganization,
		ScopeID:      organizationID.String(),
	}
	if err := normalizeEmployeeAccessUpdateRequest(snapshot, &organizationReq); !errors.Is(err, ErrInviteScopeTargetInvalid) {
		t.Fatalf("organization-scope update error = %v, want %v", err, ErrInviteScopeTargetInvalid)
	}

	unitReq := UpdateEmployeeAccessRequest{
		RoleTemplate: RoleUnitAdmin,
		ScopeType:    ScopeUnit,
		ScopeID:      unitID.String(),
	}
	if err := normalizeEmployeeAccessUpdateRequest(snapshot, &unitReq); err != nil {
		t.Fatalf("child unit update returned error: %v", err)
	}
}

func TestCurrentSessionAccessGuard(t *testing.T) {
	t.Parallel()

	currentAccessID := uuid.MustParse("22222222-2222-2222-2222-222222222222")
	otherAccessID := uuid.MustParse("33333333-3333-3333-3333-333333333333")
	snapshot := &sessionSnapshot{
		SessionRow: generated.GetCurrentSessionRow{
			GrantID: toPGUUID(currentAccessID),
		},
	}

	if !isCurrentSessionAccess(snapshot, currentAccessID) {
		t.Fatal("expected current access id to be protected")
	}
	if isCurrentSessionAccess(snapshot, otherAccessID) {
		t.Fatal("expected other access id to be mutable")
	}
}
