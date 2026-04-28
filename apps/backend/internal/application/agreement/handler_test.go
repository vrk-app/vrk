package agreement

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/go-chi/chi/v5"
)

type stubAgreementService struct {
	update func(ctx context.Context, token string, id string, req UpdateRequest) (*AgreementResponse, error)
}

func (s stubAgreementService) Create(ctx context.Context, token string, req CreateRequest) (*AgreementResponse, error) {
	return nil, errors.New("unexpected call")
}

func (s stubAgreementService) List(ctx context.Context, token string) ([]AgreementResponse, error) {
	return nil, errors.New("unexpected call")
}

func (s stubAgreementService) GetByID(ctx context.Context, token string, id string) (*AgreementResponse, error) {
	return nil, errors.New("unexpected call")
}

func (s stubAgreementService) Update(ctx context.Context, token string, id string, req UpdateRequest) (*AgreementResponse, error) {
	return s.update(ctx, token, id, req)
}

func (s stubAgreementService) ListActiveContractors(ctx context.Context, token string) ([]ContractorOptionResponse, error) {
	return nil, errors.New("unexpected call")
}

func (s stubAgreementService) ResolveRouting(ctx context.Context, token string, req RoutingResolveRequest) (*RoutingResolveResponse, error) {
	return nil, errors.New("unexpected call")
}

func TestAgreementHandlerUpdateClassifiesServiceErrors(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name       string
		serviceErr error
		wantStatus int
	}{
		{
			name:       "conflict becomes 409",
			serviceErr: ErrConflict,
			wantStatus: http.StatusConflict,
		},
		{
			name:       "validation becomes 400",
			serviceErr: ErrScopeInvalid,
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "unexpected errors become sanitized 500",
			serviceErr: errors.New("pq: duplicate key"),
			wantStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			handler := NewHandler(stubAgreementService{
				update: func(ctx context.Context, token string, id string, req UpdateRequest) (*AgreementResponse, error) {
					return nil, tt.serviceErr
				},
			})

			req := withAgreementIDParam(
				httptest.NewRequest(http.MethodPut, "/agreements/test-id", strings.NewReader(`{}`)),
				"test-id",
			)
			req.Header.Set("Authorization", "Bearer test-token")
			rec := httptest.NewRecorder()

			handler.Update(rec, req)

			if rec.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d", rec.Code, tt.wantStatus)
			}
			if tt.wantStatus == http.StatusInternalServerError {
				body := rec.Body.String()
				if strings.Contains(body, "pq: duplicate key") {
					t.Fatalf("response leaked raw internal error: %s", body)
				}
				if !strings.Contains(body, "internal server error") {
					t.Fatalf("expected sanitized internal error message, got %s", body)
				}
			}
		})
	}
}

func withAgreementIDParam(req *http.Request, id string) *http.Request {
	routeCtx := chi.NewRouteContext()
	routeCtx.URLParams.Add("id", id)

	return req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, routeCtx))
}
