package app

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestPlatformAdminMiddlewareRejectsMissingCredential(t *testing.T) {
	t.Parallel()

	handler := platformAdminMiddleware("stage03-platform-admin-secret")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))

	req := httptest.NewRequest(http.MethodGet, "/api/v1/organizations", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusUnauthorized)
	}
}

func TestPlatformAdminMiddlewareAcceptsMatchingCredential(t *testing.T) {
	t.Parallel()

	called := false
	handler := platformAdminMiddleware("stage03-platform-admin-secret")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusNoContent)
	}))

	req := httptest.NewRequest(http.MethodGet, "/api/v1/organizations", nil)
	req.Header.Set(platformAdminHeaderName, "stage03-platform-admin-secret")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusNoContent)
	}
	if !called {
		t.Fatal("expected wrapped handler to be called")
	}
}
