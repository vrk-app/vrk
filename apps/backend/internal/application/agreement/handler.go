package agreement

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
)

type AgreementHandler struct {
	service AgreementService
}

func NewHandler(service AgreementService) *AgreementHandler {
	return &AgreementHandler{service: service}
}

// Create creates a Stage 03 contract record behind the legacy agreements endpoint.
// @Summary      Create contract
// @Description  Creates a Stage 03 contract bound to a customer organization and contractor organization while preserving the backend agreements adapter boundary.
// @Tags         agreements
// @Accept       json
// @Produce      json
// @Param        request body CreateRequest true "Contract payload"
// @Success      201  {object}  Response{data=AgreementResponse}
// @Failure      400  {object}  Response
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Failure      404  {object}  Response
// @Failure      409  {object}  Response
// @Router       /agreements [post]
func (h *AgreementHandler) Create(w http.ResponseWriter, r *http.Request) {
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
	sendSuccess(w, http.StatusCreated, resp)
}

// List returns the authenticated contract registry for customer or contractor contour.
// @Summary      List contracts
// @Description  Returns contracts visible to the authenticated customer or contractor organization through the agreements adapter boundary.
// @Tags         agreements
// @Produce      json
// @Success      200  {object}  Response{data=[]AgreementResponse}
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Router       /agreements [get]
func (h *AgreementHandler) List(w http.ResponseWriter, r *http.Request) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	resp, err := h.service.List(r.Context(), token)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	sendSuccess(w, http.StatusOK, resp)
}

// GetByID returns one visible contract from the agreements adapter boundary.
// @Summary      Get contract by ID
// @Description  Returns one contract visible to the authenticated customer or contractor organization.
// @Tags         agreements
// @Produce      json
// @Param        id path string true "Contract ID"
// @Success      200  {object}  Response{data=AgreementResponse}
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Failure      404  {object}  Response
// @Router       /agreements/{id} [get]
func (h *AgreementHandler) GetByID(w http.ResponseWriter, r *http.Request) {
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
	sendSuccess(w, http.StatusOK, resp)
}

// Update updates one customer-owned contract.
// @Summary      Update contract
// @Description  Updates one customer-owned contract through the legacy agreements path while keeping the public web contour named contracts.
// @Tags         agreements
// @Accept       json
// @Produce      json
// @Param        id path string true "Contract ID"
// @Param        request body UpdateRequest true "Contract update payload"
// @Success      200  {object}  Response{data=AgreementResponse}
// @Failure      400  {object}  Response
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Failure      404  {object}  Response
// @Failure      409  {object}  Response
// @Router       /agreements/{id} [put]
func (h *AgreementHandler) Update(w http.ResponseWriter, r *http.Request) {
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
	sendSuccess(w, http.StatusOK, resp)
}

// ListActiveContractors returns available contractor organizations for the customer contract registry.
// @Summary      List active contractor organizations
// @Description  Returns active contractor organizations that can be bound to a customer contract.
// @Tags         agreements
// @Produce      json
// @Success      200  {object}  Response{data=[]ContractorOptionResponse}
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Router       /agreements/contractors [get]
func (h *AgreementHandler) ListActiveContractors(w http.ResponseWriter, r *http.Request) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	resp, err := h.service.ListActiveContractors(r.Context(), token)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	sendSuccess(w, http.StatusOK, resp)
}

// ResolveRouting resolves eligible contractor contracts for the future request-routing baseline.
// @Summary      Resolve contract routing
// @Description  Resolves routing-eligible contracts and the allowed contractor from customer contract context without enabling live Stage 04 request creation.
// @Tags         agreements
// @Accept       json
// @Produce      json
// @Param        request body RoutingResolveRequest true "Routing resolve payload"
// @Success      200  {object}  Response{data=RoutingResolveResponse}
// @Failure      400  {object}  Response
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Router       /agreements/routing/resolve [post]
func (h *AgreementHandler) ResolveRouting(w http.ResponseWriter, r *http.Request) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	var req RoutingResolveRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	resp, err := h.service.ResolveRouting(r.Context(), token, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	sendSuccess(w, http.StatusOK, resp)
}

func sendSuccess(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(Response{
		Success: true,
		Data:    data,
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
		errors.Is(err, ErrInvalidUUID),
		errors.Is(err, ErrInvalidDate),
		errors.Is(err, ErrInvalidDateRange),
		errors.Is(err, ErrContractorOrganizationRequired),
		errors.Is(err, ErrContractorOrganizationInvalid),
		errors.Is(err, ErrContractNumberRequired),
		errors.Is(err, ErrContractStatusRequired),
		errors.Is(err, ErrContractStatusInvalid),
		errors.Is(err, ErrWorkTypeRequired),
		errors.Is(err, ErrWorkTypeInvalid),
		errors.Is(err, ErrEquipmentTypeRequired),
		errors.Is(err, ErrRegionRequired),
		errors.Is(err, ErrScopeConflict),
		errors.Is(err, ErrScopeInvalid),
		errors.Is(err, ErrRoutingUnitRequired),
		errors.Is(err, ErrRoutingUnitInvalid),
		errors.Is(err, ErrRoutingWorkTypeRequired),
		errors.Is(err, ErrRoutingEquipmentTypeRequired),
		errors.Is(err, ErrRoutingRegionRequired):
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
