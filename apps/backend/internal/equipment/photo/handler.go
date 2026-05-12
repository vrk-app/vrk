package photo

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

// UploadTechnicalPhoto stores a private photo for a technical equipment record.
// @Summary      Upload technical equipment photo
// @Description  Stores one private photo for a visible non-archived technical equipment record.
// @Tags         equipment
// @Accept       multipart/form-data
// @Produce      json
// @Param        id path string true "Equipment ID"
// @Param        photo formData file true "Photo file"
// @Success      201  {object}  Response{data=EquipmentPhotoResponse}
// @Failure      400  {object}  Response
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Failure      404  {object}  Response
// @Failure      503  {object}  Response
// @Router       /equipment/{id}/photos [post]
func (h *Handler) UploadTechnicalPhoto(w http.ResponseWriter, r *http.Request) {
	h.upload(w, r, SubjectTechnicalEquipment, chi.URLParam(r, "id"))
}

// GetTechnicalPhoto streams a private photo for a technical equipment record.
// @Summary      Stream technical equipment photo
// @Description  Streams one private photo for a visible technical equipment record.
// @Tags         equipment
// @Produce      octet-stream
// @Param        id path string true "Equipment ID"
// @Param        photoId path string true "Photo ID"
// @Success      200
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Failure      404  {object}  Response
// @Failure      503  {object}  Response
// @Router       /equipment/{id}/photos/{photoId} [get]
func (h *Handler) GetTechnicalPhoto(w http.ResponseWriter, r *http.Request) {
	h.get(w, r, SubjectTechnicalEquipment, chi.URLParam(r, "id"), chi.URLParam(r, "photoId"))
}

// DeleteTechnicalPhoto deletes a private photo for a technical equipment record.
// @Summary      Delete technical equipment photo
// @Description  Deletes one private photo from a visible non-archived technical equipment record.
// @Tags         equipment
// @Produce      json
// @Param        id path string true "Equipment ID"
// @Param        photoId path string true "Photo ID"
// @Success      200  {object}  Response{data=EquipmentPhotoResponse}
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Failure      404  {object}  Response
// @Failure      503  {object}  Response
// @Router       /equipment/{id}/photos/{photoId} [delete]
func (h *Handler) DeleteTechnicalPhoto(w http.ResponseWriter, r *http.Request) {
	h.delete(w, r, SubjectTechnicalEquipment, chi.URLParam(r, "id"), chi.URLParam(r, "photoId"))
}

// UploadDiagnosticPhoto stores a private photo for a diagnostic equipment record.
// @Summary      Upload diagnostic equipment photo
// @Description  Stores one private photo for a visible non-archived diagnostic equipment record.
// @Tags         equipment
// @Accept       multipart/form-data
// @Produce      json
// @Param        id path string true "Measuring instrument ID"
// @Param        photo formData file true "Photo file"
// @Success      201  {object}  Response{data=EquipmentPhotoResponse}
// @Failure      400  {object}  Response
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Failure      404  {object}  Response
// @Failure      503  {object}  Response
// @Router       /measuring-instruments/{id}/photos [post]
func (h *Handler) UploadDiagnosticPhoto(w http.ResponseWriter, r *http.Request) {
	h.upload(w, r, SubjectDiagnosticEquipment, chi.URLParam(r, "id"))
}

// GetDiagnosticPhoto streams a private photo for a diagnostic equipment record.
// @Summary      Stream diagnostic equipment photo
// @Description  Streams one private photo for a visible diagnostic equipment record.
// @Tags         equipment
// @Produce      octet-stream
// @Param        id path string true "Measuring instrument ID"
// @Param        photoId path string true "Photo ID"
// @Success      200
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Failure      404  {object}  Response
// @Failure      503  {object}  Response
// @Router       /measuring-instruments/{id}/photos/{photoId} [get]
func (h *Handler) GetDiagnosticPhoto(w http.ResponseWriter, r *http.Request) {
	h.get(w, r, SubjectDiagnosticEquipment, chi.URLParam(r, "id"), chi.URLParam(r, "photoId"))
}

// DeleteDiagnosticPhoto deletes a private photo for a diagnostic equipment record.
// @Summary      Delete diagnostic equipment photo
// @Description  Deletes one private photo from a visible non-archived diagnostic equipment record.
// @Tags         equipment
// @Produce      json
// @Param        id path string true "Measuring instrument ID"
// @Param        photoId path string true "Photo ID"
// @Success      200  {object}  Response{data=EquipmentPhotoResponse}
// @Failure      401  {object}  Response
// @Failure      403  {object}  Response
// @Failure      404  {object}  Response
// @Failure      503  {object}  Response
// @Router       /measuring-instruments/{id}/photos/{photoId} [delete]
func (h *Handler) DeleteDiagnosticPhoto(w http.ResponseWriter, r *http.Request) {
	h.delete(w, r, SubjectDiagnosticEquipment, chi.URLParam(r, "id"), chi.URLParam(r, "photoId"))
}

func (h *Handler) upload(w http.ResponseWriter, r *http.Request, subjectType SubjectType, subjectID string) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxPhotoSizeBytes+(512*1024))
	file, header, err := r.FormFile("photo")
	if err != nil {
		sendError(w, http.StatusBadRequest, ErrPhotoRequired.Error())
		return
	}
	defer file.Close()

	resp, err := h.service.Upload(r.Context(), token, subjectType, subjectID, header.Filename, header.Header.Get("Content-Type"), file)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	sendSuccess(w, http.StatusCreated, resp)
}

func (h *Handler) get(w http.ResponseWriter, r *http.Request, subjectType SubjectType, subjectID string, photoID string) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	object, err := h.service.Get(r.Context(), token, subjectType, subjectID, photoID)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	defer object.Body.Close()

	if object.ContentType != "" {
		w.Header().Set("Content-Type", object.ContentType)
	}
	if object.Size > 0 {
		w.Header().Set("Content-Length", strconv.FormatInt(object.Size, 10))
	}
	if object.FileName != "" {
		w.Header().Set("Content-Disposition", mime.FormatMediaType("inline", map[string]string{"filename": object.FileName}))
	}
	w.WriteHeader(http.StatusOK)
	_, _ = io.Copy(w, object.Body)
}

func (h *Handler) delete(w http.ResponseWriter, r *http.Request, subjectType SubjectType, subjectID string, photoID string) {
	token, err := readBearerToken(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, "missing bearer token")
		return
	}

	resp, err := h.service.Delete(r.Context(), token, subjectType, subjectID, photoID)
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
	case errors.Is(err, ErrPhotoNotFound):
		sendError(w, http.StatusNotFound, err.Error())
	case errors.Is(err, ErrInvalidID),
		errors.Is(err, ErrInvalidSubject),
		errors.Is(err, ErrPhotoRequired),
		errors.Is(err, ErrPhotoInvalidContentType),
		errors.Is(err, ErrPhotoTooLarge),
		errors.Is(err, ErrPhotoLimitExceeded),
		errors.Is(err, ErrArchivedSubject):
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
