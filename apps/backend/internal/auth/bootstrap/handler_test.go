package bootstrap

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
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
			name: "maps legacy ЗАО to АО",
			req: CompanyProfileRequest{
				Type: "ЗАО",
				Name: "VRK Customer",
			},
			wantType: "АО",
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
		})
	}
}

func TestNormalizeStructureNodeTypeRules(t *testing.T) {
	t.Parallel()

	divisionReq := StructureNodeRequest{Name: "Branch"}
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
