package app

import (
	"crypto/subtle"
	"encoding/json"
	"net/http"
	"strings"
)

const platformAdminHeaderName = "X-VRK-Platform-Admin-Secret"

type platformAdminErrorResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error"`
}

func platformAdminMiddleware(expectedSecret string) func(http.Handler) http.Handler {
	trimmedSecret := strings.TrimSpace(expectedSecret)

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			headerValue := strings.TrimSpace(r.Header.Get(platformAdminHeaderName))
			if trimmedSecret == "" || subtle.ConstantTimeCompare([]byte(headerValue), []byte(trimmedSecret)) != 1 {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				_ = json.NewEncoder(w).Encode(platformAdminErrorResponse{
					Success: false,
					Error:   "unauthorized",
				})
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
