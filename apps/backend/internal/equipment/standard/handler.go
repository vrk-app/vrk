package standard

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
)

type StandardHandler struct {
	service StandardService
}

func NewHandler(service StandardService) *StandardHandler {
	return &StandardHandler{service: service}
}

// @Summary      Create diagnostic equipment standard
// @Description  Creates one standard/setup measure owned by the diagnostic equipment record.
// @Tags         equipment
// @Accept       json
// @Produce      json
// @Param        id path string true "Diagnostic equipment ID"
// @Param        request body CreateRequest true "Standard payload"
// @Success      201  {object}  Response{data=StandardResponse}
// @Failure      400  {object}  Response
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Router       /measuring-instruments/{id}/standards [post]
func (h *StandardHandler) CreateForDiagnostic(w http.ResponseWriter, r *http.Request) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	var req CreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	diagnosticEquipmentID := strings.TrimSpace(chi.URLParam(r, "id"))
	if diagnosticEquipmentID == "" {
		sendError(w, http.StatusBadRequest, ErrDiagnosticEquipmentRequired.Error())
		return
	}
	req.DiagnosticEquipmentID = &diagnosticEquipmentID

	resp, err := h.service.Create(r.Context(), token, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	sendSuccess(w, http.StatusCreated, resp, nil)
}

// @Summary      Delete diagnostic equipment standard
// @Description  Permanently deletes one standard/setup measure owned by the diagnostic equipment record.
// @Tags         equipment
// @Produce      json
// @Param        id path string true "Diagnostic equipment ID"
// @Param        standardId path string true "Standard ID"
// @Success      200  {object}  Response{data=DeleteResponse}
// @Failure      400  {object}  Response
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Failure      404  {object}  Response
// @Router       /measuring-instruments/{id}/standards/{standardId} [delete]
func (h *StandardHandler) DeleteFromDiagnostic(w http.ResponseWriter, r *http.Request) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	diagnosticEquipmentID := strings.TrimSpace(chi.URLParam(r, "id"))
	standardID := strings.TrimSpace(chi.URLParam(r, "standardId"))
	if diagnosticEquipmentID == "" {
		sendError(w, http.StatusBadRequest, ErrDiagnosticEquipmentRequired.Error())
		return
	}
	if standardID == "" {
		sendError(w, http.StatusBadRequest, ErrInvalidID.Error())
		return
	}

	resp, err := h.service.DeleteFromDiagnostic(r.Context(), token, diagnosticEquipmentID, standardID)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	sendSuccess(w, http.StatusOK, resp, nil)
}

func sendSuccess(w http.ResponseWriter, status int, data interface{}, meta *Meta) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(Response{
		Success: true,
		Data:    data,
		Meta:    meta,
	})
}

func sendError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(Response{
		Success: false,
		Error:   message,
	})
}

func writeServiceError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, ErrUnauthorized):
		sendError(w, http.StatusUnauthorized, err.Error())
	case errors.Is(err, ErrForbidden):
		sendError(w, http.StatusForbidden, err.Error())
	case errors.Is(err, ErrNotFound):
		sendError(w, http.StatusNotFound, err.Error())
	case errors.Is(err, ErrInvalidID),
		errors.Is(err, ErrTypeRequired),
		errors.Is(err, ErrModelRequired),
		errors.Is(err, ErrIdentifierRequired),
		errors.Is(err, ErrMetrologicalCharRequired),
		errors.Is(err, ErrDiagnosticEquipmentRequired),
		errors.Is(err, ErrDiagnosticEquipmentInvalid),
		errors.Is(err, ErrScopeInvalid),
		errors.Is(err, ErrOperationTypeRequired),
		errors.Is(err, ErrOperationTypeInvalid),
		errors.Is(err, ErrOperationDateRequired),
		errors.Is(err, ErrOperationDateInvalid),
		errors.Is(err, ErrDocumentNumberRequired),
		errors.Is(err, ErrExecutorRequired),
		errors.Is(err, ErrValidUntilInvalid),
		errors.Is(err, ErrArchivedTarget),
		errors.Is(err, ErrAlreadyArchived):
		sendError(w, http.StatusBadRequest, err.Error())
	default:
		sendError(w, http.StatusInternalServerError, err.Error())
	}
}

func readBearerToken(r *http.Request) (string, error) {
	const sessionTokenHeader = "X-VRK-Session-Token"
	if token := strings.TrimSpace(r.Header.Get(sessionTokenHeader)); token != "" {
		return token, nil
	}

	header := strings.TrimSpace(r.Header.Get("Authorization"))
	if header == "" {
		return "", ErrUnauthorized
	}

	const prefix = "Bearer "
	if !strings.HasPrefix(header, prefix) {
		return "", ErrUnauthorized
	}

	token := strings.TrimSpace(strings.TrimPrefix(header, prefix))
	if token == "" {
		return "", ErrUnauthorized
	}

	return token, nil
}
