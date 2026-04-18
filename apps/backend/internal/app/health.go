package app

import (
	"context"
	"encoding/json"
	"net/http"
	"time"
)

type healthResponse struct {
	CheckedAt   string `json:"checkedAt"`
	Environment string `json:"environment"`
	Service     string `json:"service"`
	Status      string `json:"status"`
}

type readinessResponse struct {
	CheckedAt   string `json:"checkedAt"`
	Environment string `json:"environment"`
	Error       string `json:"error,omitempty"`
	Service     string `json:"service"`
	Status      string `json:"status"`
}

func (a *App) handleHealth(w http.ResponseWriter, _ *http.Request) {
	// healthz отвечает только за liveness HTTP-процесса: endpoint должен
	// оставаться зеленым даже в момент, когда readyz еще ждет БД.
	writeJSON(w, http.StatusOK, healthResponse{
		CheckedAt:   time.Now().UTC().Format(time.RFC3339),
		Environment: a.cfg.Server.Environment,
		Service:     "backend",
		Status:      "ok",
	})
}

func (a *App) handleReady(w http.ResponseWriter, r *http.Request) {
	// readyz делает короткий ping в БД, чтобы compose/CI различали "процесс
	// backend поднялся" и "runtime реально готов обслуживать seeded requests".
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	response := readinessResponse{
		CheckedAt:   time.Now().UTC().Format(time.RFC3339),
		Environment: a.cfg.Server.Environment,
		Service:     "backend",
		Status:      "ready",
	}

	if err := a.db.Ping(ctx); err != nil {
		response.Error = err.Error()
		response.Status = "degraded"

		writeJSON(w, http.StatusServiceUnavailable, response)
		return
	}

	writeJSON(w, http.StatusOK, response)
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	// Health/readiness намеренно остаются маленькими и независимыми от domain
	// handlers, поэтому для них достаточно локального best-effort JSON writer.
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
