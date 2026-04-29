package bootstrap

import (
	"encoding/json"
	"errors"
	"io"
	"mime"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

// CreateOrganizationShell creates an organization shell and first-admin invite.
// @Summary      Create organization shell
// @Description  Platform admin creates an organization shell and issues the first-admin invite.
// @Tags         bootstrap
// @Accept       json
// @Produce      json
// @Param        X-VRK-Platform-Admin-Secret header string true "Deployment-scoped platform admin secret"
// @Param        request body CreateOrganizationShellRequest true "Organization shell data"
// @Success      201  {object}  Response{data=OrganizationShellResponse}
// @Failure      400  {object}  Response
// @Failure      401  {object}  Response
// @Failure      500  {object}  Response
// @Router       /platform/organization-shells [post]
func (h *Handler) CreateOrganizationShell(w http.ResponseWriter, r *http.Request) {
	var req CreateOrganizationShellRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	resp, err := h.service.CreateOrganizationShell(r.Context(), req)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	sendSuccess(w, http.StatusCreated, resp)
}

// InspectInvite loads first-admin invite details and marks it opened on first read.
// @Summary      Inspect first-admin invite
// @Description  Opens the first-admin invite link before password setup.
// @Tags         bootstrap
// @Produce      json
// @Param        token path string true "Invite token"
// @Success      200  {object}  Response{data=InviteInspectionResponse}
// @Failure      404  {object}  Response
// @Failure      409  {object}  Response
// @Router       /first-admin-invites/{token} [get]
func (h *Handler) InspectInvite(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	resp, err := h.service.InspectInvite(r.Context(), token)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	sendSuccess(w, http.StatusOK, resp)
}

// AcceptInvite accepts the first-admin invite and creates an authenticated session.
// @Summary      Accept first-admin invite
// @Description  Sets the invited admin password, creates membership and organization-admin grant, and starts a session.
// @Tags         bootstrap
// @Accept       json
// @Produce      json
// @Param        token path string true "Invite token"
// @Param        request body AcceptInviteRequest true "Password payload"
// @Success      200  {object}  Response{data=SessionSummaryResponse}
// @Failure      400  {object}  Response
// @Failure      404  {object}  Response
// @Failure      409  {object}  Response
// @Router       /first-admin-invites/{token}/accept [post]
func (h *Handler) AcceptInvite(w http.ResponseWriter, r *http.Request) {
	var req AcceptInviteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	token := chi.URLParam(r, "token")
	resp, err := h.service.AcceptInvite(r.Context(), token, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	sendSuccess(w, http.StatusOK, resp)
}

// InspectPublicInvite loads either a first-admin or employee invite by token.
// @Summary      Inspect public invite
// @Description  Opens a public invite link and returns the current invite state for first-admin and employee activation flows.
// @Tags         bootstrap
// @Produce      json
// @Param        token path string true "Invite token"
// @Success      200  {object}  Response{data=PublicInviteInspectionResponse}
// @Failure      404  {object}  Response
// @Failure      409  {object}  Response
// @Router       /invites/{token} [get]
func (h *Handler) InspectPublicInvite(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	resp, err := h.service.InspectPublicInvite(r.Context(), token)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	sendSuccess(w, http.StatusOK, resp)
}

// AcceptPublicInvite accepts either a first-admin or employee invite.
// @Summary      Accept public invite
// @Description  Sets the invited user's password, creates or links identity, provisions membership and scoped grant, and starts a session.
// @Tags         bootstrap
// @Accept       json
// @Produce      json
// @Param        token path string true "Invite token"
// @Param        request body AcceptInviteRequest true "Password payload"
// @Success      200  {object}  Response{data=SessionSummaryResponse}
// @Failure      400  {object}  Response
// @Failure      404  {object}  Response
// @Failure      409  {object}  Response
// @Router       /invites/{token}/accept [post]
func (h *Handler) AcceptPublicInvite(w http.ResponseWriter, r *http.Request) {
	var req AcceptInviteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	token := chi.URLParam(r, "token")
	resp, err := h.service.AcceptPublicInvite(r.Context(), token, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	sendSuccess(w, http.StatusOK, resp)
}

// ListEmployeeInvites returns the organization employee-invite registry.
// @Summary      List employee invites
// @Description  Returns the employee invite lifecycle visible to the active organization admin.
// @Tags         employee-invites
// @Produce      json
// @Success      200  {object}  Response{data=[]EmployeeInviteResponse}
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Router       /employee-invites [get]
func (h *Handler) ListEmployeeInvites(w http.ResponseWriter, r *http.Request) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	resp, err := h.service.ListEmployeeInvites(r.Context(), token)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	sendSuccess(w, http.StatusOK, resp)
}

// CreateEmployeeInvite creates a draft employee invite.
// @Summary      Create employee invite draft
// @Description  Creates a draft employee invite for the active organization admin with role template, scope, and expiry policy.
// @Tags         employee-invites
// @Accept       json
// @Produce      json
// @Param        request body CreateEmployeeInviteRequest true "Employee invite payload"
// @Success      201  {object}  Response{data=EmployeeInviteResponse}
// @Failure      400  {object}  Response
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Failure      409  {object}  Response
// @Router       /employee-invites [post]
func (h *Handler) CreateEmployeeInvite(w http.ResponseWriter, r *http.Request) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	var req CreateEmployeeInviteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	resp, err := h.service.CreateEmployeeInvite(r.Context(), token, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	sendSuccess(w, http.StatusCreated, resp)
}

// SendEmployeeInvite sends a previously created draft invite.
// @Summary      Send employee invite
// @Description  Transitions a draft employee invite to sent and issues a one-time token.
// @Tags         employee-invites
// @Produce      json
// @Param        inviteID path string true "Employee invite ID"
// @Success      200  {object}  Response{data=EmployeeInviteResponse}
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Failure      404  {object}  Response
// @Failure      409  {object}  Response
// @Router       /employee-invites/{inviteID}/send [post]
func (h *Handler) SendEmployeeInvite(w http.ResponseWriter, r *http.Request) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	resp, err := h.service.SendEmployeeInvite(r.Context(), token, chi.URLParam(r, "inviteID"))
	if err != nil {
		writeServiceError(w, err)
		return
	}

	sendSuccess(w, http.StatusOK, resp)
}

// RevokeEmployeeInvite revokes a draft or pending employee invite.
// @Summary      Revoke employee invite
// @Description  Revokes a draft, sent, or opened employee invite.
// @Tags         employee-invites
// @Produce      json
// @Param        inviteID path string true "Employee invite ID"
// @Success      200  {object}  Response{data=EmployeeInviteResponse}
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Failure      404  {object}  Response
// @Failure      409  {object}  Response
// @Router       /employee-invites/{inviteID}/revoke [post]
func (h *Handler) RevokeEmployeeInvite(w http.ResponseWriter, r *http.Request) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	resp, err := h.service.RevokeEmployeeInvite(r.Context(), token, chi.URLParam(r, "inviteID"))
	if err != nil {
		writeServiceError(w, err)
		return
	}

	sendSuccess(w, http.StatusOK, resp)
}

// ListEmployees returns active scoped employees visible to the current access grant.
// @Summary      List employees
// @Description  Returns active employee access rows filtered by the current organization, division, or unit scope.
// @Tags         employees
// @Produce      json
// @Success      200  {object}  Response{data=[]EmployeeAccessResponse}
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Router       /employees [get]
func (h *Handler) ListEmployees(w http.ResponseWriter, r *http.Request) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	resp, err := h.service.ListEmployees(r.Context(), token)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	sendSuccess(w, http.StatusOK, resp)
}

// UpdateEmployeeAccess updates role and scope for an active employee access row.
// @Summary      Update employee access
// @Description  Organization admins can update an employee role template and scope target.
// @Tags         employees
// @Accept       json
// @Produce      json
// @Param        accessID path string true "Scoped access ID"
// @Param        request body UpdateEmployeeAccessRequest true "Employee access update payload"
// @Success      200  {object}  Response{data=EmployeeAccessResponse}
// @Failure      400  {object}  Response
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Failure      404  {object}  Response
// @Failure      409  {object}  Response
// @Router       /employees/{accessID} [patch]
func (h *Handler) UpdateEmployeeAccess(w http.ResponseWriter, r *http.Request) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	var req UpdateEmployeeAccessRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	resp, err := h.service.UpdateEmployeeAccess(r.Context(), token, chi.URLParam(r, "accessID"), req)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	sendSuccess(w, http.StatusOK, resp)
}

// DeactivateEmployee deactivates an employee membership and invalidates its sessions.
// @Summary      Deactivate employee
// @Description  Organization admins can archive an employee membership through one of its active access rows.
// @Tags         employees
// @Produce      json
// @Param        accessID path string true "Scoped access ID"
// @Success      200  {object}  Response{data=EmployeeAccessResponse}
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Failure      404  {object}  Response
// @Failure      409  {object}  Response
// @Router       /employees/{accessID}/deactivate [post]
func (h *Handler) DeactivateEmployee(w http.ResponseWriter, r *http.Request) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	resp, err := h.service.DeactivateEmployee(r.Context(), token, chi.URLParam(r, "accessID"))
	if err != nil {
		writeServiceError(w, err)
		return
	}

	sendSuccess(w, http.StatusOK, resp)
}

// UpdateCompanyProfile updates the active customer organization profile.
// @Summary      Update company profile
// @Description  Updates the persistent Stage 03 company profile for an active organization-scope admin.
// @Tags         company
// @Accept       json
// @Produce      json
// @Param        request body CompanyProfileRequest true "Company profile payload"
// @Success      200  {object}  Response{data=SessionSummaryResponse}
// @Failure      400  {object}  Response
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Failure      409  {object}  Response
// @Router       /company/profile [patch]
func (h *Handler) UpdateCompanyProfile(w http.ResponseWriter, r *http.Request) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	var req CompanyProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	resp, err := h.service.UpdateCompanyProfile(r.Context(), token, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	sendSuccess(w, http.StatusOK, resp)
}

// UploadCompanyLogo replaces the current organization logo.
// @Summary      Upload company logo
// @Description  Stores the current organization logo in private object storage and keeps only object metadata in Postgres.
// @Tags         company
// @Accept       multipart/form-data
// @Produce      json
// @Param        logo formData file true "Logo file"
// @Success      200  {object}  Response{data=SessionSummaryResponse}
// @Failure      400  {object}  Response
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Failure      503  {object}  Response
// @Router       /company/logo [post]
func (h *Handler) UploadCompanyLogo(w http.ResponseWriter, r *http.Request) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxLogoSizeBytes+(512*1024))
	file, header, err := r.FormFile("logo")
	if err != nil {
		sendError(w, http.StatusBadRequest, ErrLogoRequired.Error())
		return
	}
	defer file.Close()

	resp, err := h.service.UploadCompanyLogo(r.Context(), token, header.Filename, header.Header.Get("Content-Type"), file)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	sendSuccess(w, http.StatusOK, resp)
}

// GetCompanyLogo streams the current organization logo.
// @Summary      Stream company logo
// @Description  Streams the private object-storage-backed logo for the authenticated current organization.
// @Tags         company
// @Produce      octet-stream
// @Success      200
// @Failure      401  {object}  Response
// @Failure      404  {object}  Response
// @Failure      503  {object}  Response
// @Router       /company/logo [get]
func (h *Handler) GetCompanyLogo(w http.ResponseWriter, r *http.Request) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	logo, err := h.service.GetCompanyLogo(r.Context(), token)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	defer logo.Body.Close()

	if logo.ContentType != "" {
		w.Header().Set("Content-Type", logo.ContentType)
	}
	if logo.Size > 0 {
		w.Header().Set("Content-Length", strconv.FormatInt(logo.Size, 10))
	}
	if logo.FileName != "" {
		w.Header().Set("Content-Disposition", mime.FormatMediaType("inline", map[string]string{"filename": logo.FileName}))
	}
	w.WriteHeader(http.StatusOK)
	_, _ = io.Copy(w, logo.Body)
}

// DeleteCompanyLogo deletes the current organization logo.
// @Summary      Delete company logo
// @Description  Removes logo object metadata from Postgres and deletes the private object when present.
// @Tags         company
// @Produce      json
// @Success      200  {object}  Response{data=SessionSummaryResponse}
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Failure      503  {object}  Response
// @Router       /company/logo [delete]
func (h *Handler) DeleteCompanyLogo(w http.ResponseWriter, r *http.Request) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	resp, err := h.service.DeleteCompanyLogo(r.Context(), token)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	sendSuccess(w, http.StatusOK, resp)
}

// CreateDivision creates a division at organization scope.
// @Summary      Create company division
// @Description  Creates the first or later active division from the persistent company management surface.
// @Tags         company
// @Accept       json
// @Produce      json
// @Param        request body StructureNodeRequest true "Division payload"
// @Success      201  {object}  Response{data=SessionSummaryResponse}
// @Failure      400  {object}  Response
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Router       /company/divisions [post]
func (h *Handler) CreateDivision(w http.ResponseWriter, r *http.Request) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	var req StructureNodeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	resp, err := h.service.CreateDivision(r.Context(), token, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	sendSuccess(w, http.StatusCreated, resp)
}

// UpdateDivision updates an active division.
// @Summary      Update company division
// @Description  Updates an active division visible to the organization-scope admin.
// @Tags         company
// @Accept       json
// @Produce      json
// @Param        divisionID path string true "Division ID"
// @Param        request body StructureNodeRequest true "Division payload"
// @Success      200  {object}  Response{data=SessionSummaryResponse}
// @Failure      400  {object}  Response
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Failure      404  {object}  Response
// @Router       /company/divisions/{divisionID} [patch]
func (h *Handler) UpdateDivision(w http.ResponseWriter, r *http.Request) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	var req StructureNodeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	resp, err := h.service.UpdateDivision(r.Context(), token, chi.URLParam(r, "divisionID"), req)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	sendSuccess(w, http.StatusOK, resp)
}

// ArchiveDivision archives an active division when no active references block it.
// @Summary      Archive company division
// @Description  Archives a division instead of physically deleting it.
// @Tags         company
// @Produce      json
// @Param        divisionID path string true "Division ID"
// @Success      200  {object}  Response{data=SessionSummaryResponse}
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Failure      404  {object}  Response
// @Failure      409  {object}  Response
// @Router       /company/divisions/{divisionID}/archive [post]
func (h *Handler) ArchiveDivision(w http.ResponseWriter, r *http.Request) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	resp, err := h.service.ArchiveDivision(r.Context(), token, chi.URLParam(r, "divisionID"))
	if err != nil {
		writeServiceError(w, err)
		return
	}

	sendSuccess(w, http.StatusOK, resp)
}

// CreateUnit creates a unit under organization or under an active division.
// @Summary      Create company unit
// @Description  Creates the first or later active unit, with optional division parent.
// @Tags         company
// @Accept       json
// @Produce      json
// @Param        request body StructureNodeRequest true "Unit payload"
// @Success      201  {object}  Response{data=SessionSummaryResponse}
// @Failure      400  {object}  Response
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Router       /company/units [post]
func (h *Handler) CreateUnit(w http.ResponseWriter, r *http.Request) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	var req StructureNodeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	resp, err := h.service.CreateUnit(r.Context(), token, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	sendSuccess(w, http.StatusCreated, resp)
}

// UpdateUnit updates an active unit.
// @Summary      Update company unit
// @Description  Updates an active unit and its optional division parent.
// @Tags         company
// @Accept       json
// @Produce      json
// @Param        unitID path string true "Unit ID"
// @Param        request body StructureNodeRequest true "Unit payload"
// @Success      200  {object}  Response{data=SessionSummaryResponse}
// @Failure      400  {object}  Response
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Failure      404  {object}  Response
// @Router       /company/units/{unitID} [patch]
func (h *Handler) UpdateUnit(w http.ResponseWriter, r *http.Request) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	var req StructureNodeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	resp, err := h.service.UpdateUnit(r.Context(), token, chi.URLParam(r, "unitID"), req)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	sendSuccess(w, http.StatusOK, resp)
}

// ArchiveUnit archives an active unit when no active references block it.
// @Summary      Archive company unit
// @Description  Archives a unit instead of physically deleting it.
// @Tags         company
// @Produce      json
// @Param        unitID path string true "Unit ID"
// @Success      200  {object}  Response{data=SessionSummaryResponse}
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Failure      404  {object}  Response
// @Failure      409  {object}  Response
// @Router       /company/units/{unitID}/archive [post]
func (h *Handler) ArchiveUnit(w http.ResponseWriter, r *http.Request) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	resp, err := h.service.ArchiveUnit(r.Context(), token, chi.URLParam(r, "unitID"))
	if err != nil {
		writeServiceError(w, err)
		return
	}

	sendSuccess(w, http.StatusOK, resp)
}

// CreateSession logs a user in by email/password.
// @Summary      Create auth session
// @Description  Logs the user in when exactly one eligible membership/grant path exists and returns the current session snapshot.
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        request body CreateSessionRequest true "Session credentials"
// @Success      200  {object}  Response{data=SessionSummaryResponse}
// @Failure      401  {object}  Response
// @Failure      409  {object}  Response
// @Failure      500  {object}  Response
// @Router       /sessions [post]
func (h *Handler) CreateSession(w http.ResponseWriter, r *http.Request) {
	var req CreateSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	resp, err := h.service.CreateSession(r.Context(), req)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	sendSuccess(w, http.StatusOK, resp)
}

// CurrentSession returns the active session snapshot.
// @Summary      Get current session
// @Description  Returns the authenticated admin session and launch-wizard state.
// @Tags         auth
// @Produce      json
// @Success      200  {object}  Response{data=SessionSummaryResponse}
// @Failure      401  {object}  Response
// @Router       /sessions/current [get]
func (h *Handler) CurrentSession(w http.ResponseWriter, r *http.Request) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	resp, err := h.service.GetSession(r.Context(), token)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	sendSuccess(w, http.StatusOK, resp)
}

// DeleteCurrentSession logs the current user out.
// @Summary      Delete current session
// @Description  Deletes the authenticated session token.
// @Tags         auth
// @Success      204  {object}  Response
// @Failure      401  {object}  Response
// @Router       /sessions/current [delete]
func (h *Handler) DeleteCurrentSession(w http.ResponseWriter, r *http.Request) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	if err := h.service.DeleteSession(r.Context(), token); err != nil {
		writeServiceError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// CompleteLaunchWizard saves organization data and the first division/unit.
// @Summary      Complete launch wizard
// @Description  Saves the core organization data and creates the first division or direct unit.
// @Tags         bootstrap
// @Accept       json
// @Produce      json
// @Param        request body CompleteLaunchRequest true "Launch wizard payload"
// @Success      200  {object}  Response{data=SessionSummaryResponse}
// @Failure      400  {object}  Response
// @Failure      401  {object}  Response
// @Failure      409  {object}  Response
// @Router       /launch-wizard [post]
func (h *Handler) CompleteLaunchWizard(w http.ResponseWriter, r *http.Request) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	var req CompleteLaunchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	resp, err := h.service.CompleteLaunch(r.Context(), token, req)
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
	case errors.Is(err, ErrInviteNotFound), errors.Is(err, ErrEmployeeAccessNotFound), errors.Is(err, ErrLogoNotFound):
		sendError(w, http.StatusNotFound, err.Error())
	case errors.Is(err, ErrDivisionNotFound), errors.Is(err, ErrUnitNotFound):
		sendError(w, http.StatusNotFound, err.Error())
	case errors.Is(err, ErrInvalidCredentials), errors.Is(err, ErrUnauthorized):
		sendError(w, http.StatusUnauthorized, err.Error())
	case errors.Is(err, ErrForbidden):
		sendError(w, http.StatusForbidden, err.Error())
	case errors.Is(err, ErrInviteAlreadyAccepted),
		errors.Is(err, ErrInviteExpired),
		errors.Is(err, ErrInviteRevoked),
		errors.Is(err, ErrAccessSelectionRequired),
		errors.Is(err, ErrLaunchAlreadyCompleted),
		errors.Is(err, ErrLaunchRequired),
		errors.Is(err, ErrInviteDraftRequired),
		errors.Is(err, ErrInviteSendNotAllowed),
		errors.Is(err, ErrInviteRevokeNotAllowed),
		errors.Is(err, ErrEmployeeAccessConflict),
		errors.Is(err, ErrEmployeeAccessSelfMutation),
		errors.Is(err, ErrArchiveBlocked):
		sendError(w, http.StatusConflict, err.Error())
	case errors.Is(err, ErrOrganizationNameRequired),
		errors.Is(err, ErrFirstAdminNameRequired),
		errors.Is(err, ErrEmployeeNameRequired),
		errors.Is(err, ErrEmailRequired),
		errors.Is(err, ErrInvalidEmail),
		errors.Is(err, ErrInvalidOrganizationRole),
		errors.Is(err, ErrInviteRoleTemplateRequired),
		errors.Is(err, ErrInviteRoleTemplateInvalid),
		errors.Is(err, ErrInviteRoleScopeInvalid),
		errors.Is(err, ErrInviteScopeTypeInvalid),
		errors.Is(err, ErrInviteScopeTargetRequired),
		errors.Is(err, ErrInviteScopeTargetInvalid),
		errors.Is(err, ErrInviteExpiryRequired),
		errors.Is(err, ErrInviteExpiryInvalid),
		errors.Is(err, ErrPasswordTooShort),
		errors.Is(err, ErrPropertyTypeRequired),
		errors.Is(err, ErrPropertyTypeInvalid),
		errors.Is(err, ErrInnRequired),
		errors.Is(err, ErrKppRequired),
		errors.Is(err, ErrInnInvalid),
		errors.Is(err, ErrKppInvalid),
		errors.Is(err, ErrOgrnInvalid),
		errors.Is(err, ErrBankAccountInvalid),
		errors.Is(err, ErrBikInvalid),
		errors.Is(err, ErrLegalAddressRequired),
		errors.Is(err, ErrContactPhoneRequired),
		errors.Is(err, ErrDivisionNameRequired),
		errors.Is(err, ErrDivisionTypeRequired),
		errors.Is(err, ErrUnitNameRequired),
		errors.Is(err, ErrUnitTypeRequired),
		errors.Is(err, ErrStructureModeInvalid),
		errors.Is(err, ErrPasswordWeak),
		errors.Is(err, ErrLogoRequired),
		errors.Is(err, ErrLogoInvalidContentType),
		errors.Is(err, ErrLogoTooLarge):
		sendError(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, ErrInvalidID),
		errors.Is(err, ErrStructureTypeInvalid),
		errors.Is(err, ErrDivisionTargetInvalid):
		sendError(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, ErrObjectStorageUnavailable):
		sendError(w, http.StatusServiceUnavailable, err.Error())
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
