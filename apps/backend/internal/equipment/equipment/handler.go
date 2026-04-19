package equipment

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
)

type EquipmentHandler struct {
	service EquipmentService
}

func NewHandler(service EquipmentService) *EquipmentHandler {
	return &EquipmentHandler{service: service}
}

// @Summary      Create equipment registry record
// @Description  Creates one equipment registry record inside the authenticated customer organization and visible unit contour.
// @Tags         equipment
// @Accept       json
// @Produce      json
// @Param        request body CreateRequest true "Equipment payload"
// @Success      201  {object}  Response{data=EquipmentResponse}
// @Failure      400  {object}  Response
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Router       /equipment [post]
func (h *EquipmentHandler) Create(w http.ResponseWriter, r *http.Request) {
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

// @Summary      List equipment registry
// @Description  Returns equipment records visible inside the authenticated customer organization/session scope.
// @Tags         equipment
// @Produce      json
// @Param        limit   query     int  false  "Page size"  default(20)  minimum(1)  maximum(100)
// @Param        offset  query     int  false  "Offset"     default(0)   minimum(0)
// @Success      200     {object}  Response{data=[]EquipmentResponse,meta=Meta}
// @Failure      401     {object}  Response
// @Failure      403     {object}  Response
// @Router       /equipment [get]
func (h *EquipmentHandler) List(w http.ResponseWriter, r *http.Request) {
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

	sendSuccess(w, http.StatusOK, items, &Meta{
		Total:  total,
		Limit:  int32(limit),
		Offset: int32(offset),
	})
}

// @Summary      Get equipment registry record
// @Description  Returns one equipment record visible inside the authenticated customer organization/session scope.
// @Tags         equipment
// @Produce      json
// @Param        id path string true "Equipment ID"
// @Success      200  {object}  Response{data=EquipmentResponse}
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Failure      404  {object}  Response
// @Router       /equipment/{id} [get]
func (h *EquipmentHandler) GetByID(w http.ResponseWriter, r *http.Request) {
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

// @Summary      Update equipment registry record
// @Description  Updates one equipment record inside the authenticated customer organization/session scope.
// @Tags         equipment
// @Accept       json
// @Produce      json
// @Param        id path string true "Equipment ID"
// @Param        request body UpdateRequest true "Equipment patch payload"
// @Success      200  {object}  Response{data=EquipmentResponse}
// @Failure      400  {object}  Response
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Failure      404  {object}  Response
// @Router       /equipment/{id} [patch]
func (h *EquipmentHandler) Update(w http.ResponseWriter, r *http.Request) {
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

// @Summary      Archive equipment registry record
// @Description  Archives one equipment record inside the authenticated customer organization/session scope.
// @Tags         equipment
// @Produce      json
// @Param        id path string true "Equipment ID"
// @Success      200  {object}  Response{data=EquipmentResponse}
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Failure      404  {object}  Response
// @Router       /equipment/{id}/archive [post]
func (h *EquipmentHandler) Archive(w http.ResponseWriter, r *http.Request) {
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
		errors.Is(err, ErrManufacturerRequired),
		errors.Is(err, ErrClassificationRequired),
		errors.Is(err, ErrModelRequired),
		errors.Is(err, ErrFullNameRequired),
		errors.Is(err, ErrFactoryNumberRequired),
		errors.Is(err, ErrUnitRequired),
		errors.Is(err, ErrManufactureYearInvalid),
		errors.Is(err, ErrStatusRequired),
		errors.Is(err, ErrStatusInvalid),
		errors.Is(err, ErrAlreadyArchived):
		sendError(w, http.StatusBadRequest, err.Error())
	default:
		sendError(w, http.StatusInternalServerError, err.Error())
	}
}

func readBearerToken(r *http.Request) (string, error) {
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
