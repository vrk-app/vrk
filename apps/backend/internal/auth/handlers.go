package auth

import (
	"encoding/json"
	"net/http"
	"time"
)

type Handler struct {

}

func NewHandler() *Handler {
	return &Handler{}
}

func (h *Handler) PingHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "healthy",
		"time":   time.Now().UTC().String(),
	})
}