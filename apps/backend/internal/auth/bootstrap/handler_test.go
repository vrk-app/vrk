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
