package standard

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
)

type StandardHandler struct {
	service StandardService
}

func NewHandler(service StandardService) *StandardHandler {
	return &StandardHandler{service: service}
}

// @Summary      Create standard registry record
// @Description  Creates one standard registry record inside the authenticated customer organization.
// @Tags         equipment
// @Accept       json
// @Produce      json
// @Param        request body CreateRequest true "Standard payload"
// @Success      201  {object}  Response{data=StandardResponse}
// @Failure      400  {object}  Response
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Router       /standards [post]
func (h *StandardHandler) Create(w http.ResponseWriter, r *http.Request) {
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

	resp, err := h.service.Create(r.Context(), token, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	sendSuccess(w, http.StatusCreated, resp, nil)
}

// @Summary      List standards registry
// @Description  Returns standard records visible inside the authenticated customer session scope.
// @Tags         equipment
// @Produce      json
// @Param        limit   query     int  false  "Page size"  default(20)  minimum(1)  maximum(100)
// @Param        offset  query     int  false  "Offset"     default(0)   minimum(0)
// @Success      200     {object}  Response{data=[]StandardResponse,meta=Meta}
// @Failure      401     {object}  Response
// @Failure      403     {object}  Response
// @Router       /standards [get]
func (h *StandardHandler) List(w http.ResponseWriter, r *http.Request) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	includeArchived := r.URL.Query().Get("includeArchived") == "true" || r.URL.Query().Get("includeArchived") == "1"
	items, total, err := h.service.List(r.Context(), token, includeArchived, int32(limit), int32(offset))
	if err != nil {
		writeServiceError(w, err)
		return
	}
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}

	sendSuccess(w, http.StatusOK, items, &Meta{
		Total:  total,
		Limit:  int32(limit),
		Offset: int32(offset),
	})
}

// @Summary      Get standard registry record
// @Description  Returns one standard record visible inside the authenticated customer session scope.
// @Tags         equipment
// @Produce      json
// @Param        id path string true "Standard ID"
// @Success      200  {object}  Response{data=StandardResponse}
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Failure      404  {object}  Response
// @Router       /standards/{id} [get]
func (h *StandardHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	resp, err := h.service.GetByID(r.Context(), token, chi.URLParam(r, "id"))
	if err != nil {
		writeServiceError(w, err)
		return
	}

	sendSuccess(w, http.StatusOK, resp, nil)
}

// @Summary      Update standard registry record
// @Description  Updates one standard record inside the authenticated customer organization.
// @Tags         equipment
// @Accept       json
// @Produce      json
// @Param        id path string true "Standard ID"
// @Param        request body UpdateRequest true "Standard patch payload"
// @Success      200  {object}  Response{data=StandardResponse}
// @Failure      400  {object}  Response
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Failure      404  {object}  Response
// @Router       /standards/{id} [patch]
func (h *StandardHandler) Update(w http.ResponseWriter, r *http.Request) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	var req UpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	resp, err := h.service.Update(r.Context(), token, chi.URLParam(r, "id"), req)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	sendSuccess(w, http.StatusOK, resp, nil)
}

// @Summary      List standard journal
// @Description  Returns metrology journal entries for one standard visible inside the authenticated customer session scope.
// @Tags         equipment
// @Produce      json
// @Param        id path string true "Standard ID"
// @Success      200  {object}  Response{data=[]JournalResponse}
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Failure      404  {object}  Response
// @Router       /standards/{id}/journals [get]
func (h *StandardHandler) ListJournals(w http.ResponseWriter, r *http.Request) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	resp, err := h.service.ListJournals(r.Context(), token, chi.URLParam(r, "id"))
	if err != nil {
		writeServiceError(w, err)
		return
	}

	sendSuccess(w, http.StatusOK, resp, nil)
}

// @Summary      Create standard journal entry
// @Description  Appends one metrology journal entry to the standard visible inside the authenticated customer organization.
// @Tags         equipment
// @Accept       json
// @Produce      json
// @Param        id path string true "Standard ID"
// @Param        request body CreateJournalRequest true "Journal payload"
// @Success      201  {object}  Response{data=JournalResponse}
// @Failure      400  {object}  Response
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Failure      404  {object}  Response
// @Router       /standards/{id}/journals [post]
func (h *StandardHandler) CreateJournal(w http.ResponseWriter, r *http.Request) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	var req CreateJournalRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	resp, err := h.service.CreateJournal(r.Context(), token, chi.URLParam(r, "id"), req)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	sendSuccess(w, http.StatusCreated, resp, nil)
}

// @Summary      Archive standard registry record
// @Description  Archives one standard record inside the authenticated customer organization/session scope.
// @Tags         equipment
// @Produce      json
// @Param        id path string true "Standard ID"
// @Success      200  {object}  Response{data=StandardResponse}
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Failure      404  {object}  Response
// @Router       /standards/{id}/archive [post]
func (h *StandardHandler) Archive(w http.ResponseWriter, r *http.Request) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	resp, err := h.service.Archive(r.Context(), token, chi.URLParam(r, "id"))
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
