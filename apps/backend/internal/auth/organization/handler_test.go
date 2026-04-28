package organization

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/go-chi/chi/v5"
)

type stubOrganizationService struct {
	create  func(ctx context.Context, req CreateRequest) (*OrganizationResponse, error)
	delete  func(ctx context.Context, id string) error
	getByID func(ctx context.Context, id string) (*OrganizationResponse, error)
	update  func(ctx context.Context, id string, req UpdateRequest) (*OrganizationResponse, error)
}

func (s stubOrganizationService) Create(ctx context.Context, req CreateRequest) (*OrganizationResponse, error) {
	return s.create(ctx, req)
}

func (s stubOrganizationService) List(ctx context.Context, limit, offset int32) ([]*OrganizationResponse, int64, error) {
	return nil, 0, errors.New("unexpected call")
}

func (s stubOrganizationService) GetByID(ctx context.Context, id string) (*OrganizationResponse, error) {
	return s.getByID(ctx, id)
}

func (s stubOrganizationService) Update(ctx context.Context, id string, req UpdateRequest) (*OrganizationResponse, error) {
	return s.update(ctx, id, req)
}

func (s stubOrganizationService) Delete(ctx context.Context, id string) error {
	return s.delete(ctx, id)
}

func TestOrganizationHandlerGetByIDClassifiesServiceErrors(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name       string
		serviceErr error
		wantStatus int
	}{
		{
			name:       "not found stays 404",
			serviceErr: ErrNotFound,
			wantStatus: http.StatusNotFound,
		},
		{
			name:       "invalid id becomes 400",
			serviceErr: ErrInvalidID,
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "unexpected errors become 500",
			serviceErr: errors.New("db unavailable"),
			wantStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			handler := NewHandler(stubOrganizationService{
				getByID: func(ctx context.Context, id string) (*OrganizationResponse, error) {
					return nil, tt.serviceErr
				},
				create: func(ctx context.Context, req CreateRequest) (*OrganizationResponse, error) {
					return nil, errors.New("unexpected call")
				},
				delete: func(ctx context.Context, id string) error {
					return errors.New("unexpected call")
				},
				update: func(ctx context.Context, id string, req UpdateRequest) (*OrganizationResponse, error) {
					return nil, errors.New("unexpected call")
				},
			})

			req := withOrganizationIDParam(httptest.NewRequest(http.MethodGet, "/organizations/test-id", nil), "test-id")
			rec := httptest.NewRecorder()

			handler.GetByID(rec, req)

			if rec.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d", rec.Code, tt.wantStatus)
			}
			if tt.wantStatus == http.StatusInternalServerError && strings.Contains(rec.Body.String(), "db unavailable") {
				t.Fatalf("response leaked raw internal error: %s", rec.Body.String())
			}
		})
	}
}

func TestOrganizationHandlerUpdateClassifiesServiceErrors(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name       string
		serviceErr error
		wantStatus int
	}{
		{
			name:       "not found stays 404",
			serviceErr: ErrNotFound,
			wantStatus: http.StatusNotFound,
		},
		{
			name:       "invalid id becomes 400",
			serviceErr: ErrInvalidID,
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "conflict becomes 409",
			serviceErr: ErrConflict,
			wantStatus: http.StatusConflict,
		},
		{
			name:       "unexpected errors become 500",
			serviceErr: errors.New("db unavailable"),
			wantStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			handler := NewHandler(stubOrganizationService{
				getByID: func(ctx context.Context, id string) (*OrganizationResponse, error) {
					return nil, errors.New("unexpected call")
				},
				create: func(ctx context.Context, req CreateRequest) (*OrganizationResponse, error) {
					return nil, errors.New("unexpected call")
				},
				delete: func(ctx context.Context, id string) error {
					return errors.New("unexpected call")
				},
				update: func(ctx context.Context, id string, req UpdateRequest) (*OrganizationResponse, error) {
					return nil, tt.serviceErr
				},
			})

			req := withOrganizationIDParam(
				httptest.NewRequest(http.MethodPut, "/organizations/test-id", strings.NewReader(`{}`)),
				"test-id",
			)
			rec := httptest.NewRecorder()

			handler.Update(rec, req)

			if rec.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d", rec.Code, tt.wantStatus)
			}
			if tt.wantStatus == http.StatusInternalServerError && strings.Contains(rec.Body.String(), "db unavailable") {
				t.Fatalf("response leaked raw internal error: %s", rec.Body.String())
			}
		})
	}
}

func TestOrganizationHandlerDeleteClassifiesServiceErrors(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name       string
		serviceErr error
		wantStatus int
	}{
		{
			name:       "invalid id becomes 400",
			serviceErr: ErrInvalidID,
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "not found stays 404",
			serviceErr: ErrNotFound,
			wantStatus: http.StatusNotFound,
		},
		{
			name:       "unexpected errors become 500",
			serviceErr: errors.New("delete failed"),
			wantStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			handler := NewHandler(stubOrganizationService{
				create: func(ctx context.Context, req CreateRequest) (*OrganizationResponse, error) {
					return nil, errors.New("unexpected call")
				},
				delete: func(ctx context.Context, id string) error {
					return tt.serviceErr
				},
				getByID: func(ctx context.Context, id string) (*OrganizationResponse, error) {
					return nil, errors.New("unexpected call")
				},
				update: func(ctx context.Context, id string, req UpdateRequest) (*OrganizationResponse, error) {
					return nil, errors.New("unexpected call")
				},
			})

			req := withOrganizationIDParam(httptest.NewRequest(http.MethodDelete, "/organizations/test-id", nil), "test-id")
			rec := httptest.NewRecorder()

			handler.Delete(rec, req)

			if rec.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d", rec.Code, tt.wantStatus)
			}
			if tt.wantStatus == http.StatusInternalServerError && strings.Contains(rec.Body.String(), "delete failed") {
				t.Fatalf("response leaked raw internal error: %s", rec.Body.String())
			}
		})
	}
}

func withOrganizationIDParam(req *http.Request, id string) *http.Request {
	routeCtx := chi.NewRouteContext()
	routeCtx.URLParams.Add("id", id)

	return req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, routeCtx))
}
