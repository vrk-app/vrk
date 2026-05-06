package usageclassification

import (
    "encoding/json"
    "net/http"
    "strconv"

    "github.com/go-chi/chi/v5"
)

type Handler struct {
    service Service
}

func NewHandler(service Service) *Handler {
    return &Handler{service: service}
}

// Create создает новую классификацию использования
// @Summary      Создать классификацию использования
// @Tags         equipment
// @Accept       json
// @Produce      json
// @Param        request body CreateRequest true "Данные классификации"
// @Success      201  {object}  Response{data=UsageClassificationResponse}
// @Failure      400  {object}  Response
// @Failure      500  {object}  Response
// @Router       /usage-classifications [post]
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
    var req CreateRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        sendError(w, http.StatusBadRequest, "Invalid request body")
        return
    }
    resp, err := h.service.Create(r.Context(), req)
    if err != nil {
        switch err {
        case ErrClassificationRequired, ErrClassificationTooLong:
            sendError(w, http.StatusBadRequest, err.Error())
        case ErrDuplicateClassification:
            sendError(w, http.StatusConflict, err.Error())
        default:
            sendError(w, http.StatusInternalServerError, err.Error())
        }
        return
    }
    sendSuccess(w, http.StatusCreated, resp, nil)
}

// GetByID возвращает классификацию по ID
// @Summary      Получить классификацию использования по ID
// @Tags         equipment
// @Produce      json
// @Param        id   path      int  true  "ID классификации"
// @Success      200  {object}  Response{data=UsageClassificationResponse}
// @Failure      404  {object}  Response
// @Router       /usage-classifications/{id} [get]
func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
    idStr := chi.URLParam(r, "id")
    if idStr == "" {
        sendError(w, http.StatusBadRequest, "ID is required")
        return
    }
    id, err := strconv.ParseInt(idStr, 10, 32)
    if err != nil {
        sendError(w, http.StatusBadRequest, "Invalid ID format: must be an integer")
        return
    }
    resp, err := h.service.GetByID(r.Context(), id)
    if err != nil {
        sendError(w, http.StatusNotFound, err.Error())
        return
    }
    sendSuccess(w, http.StatusOK, resp, nil)
}

// Delete удаляет классификацию
// @Summary      Удалить классификацию использования
// @Tags         equipment
// @Param        id   path      int  true  "ID классификации"
// @Success      204
// @Failure      404  {object}  Response
// @Router       /usage-classifications/{id} [delete]
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
    idStr := chi.URLParam(r, "id")
    if idStr == "" {
        sendError(w, http.StatusBadRequest, "ID is required")
        return
    }
    id, err := strconv.ParseInt(idStr, 10, 32)
    if err != nil {
        sendError(w, http.StatusBadRequest, "Invalid ID format: must be an integer")
        return
    }
    if err := h.service.Delete(r.Context(), id); err != nil {
        sendError(w, http.StatusInternalServerError, err.Error())
        return
    }
    sendSuccess(w, http.StatusNoContent, nil, nil)
}

// List возвращает список классификаций
// @Summary      Получить список классификаций использования
// @Tags         equipment
// @Produce      json
// @Param        limit   query     int  false  "Количество записей на странице"  default(10)
// @Param        offset  query     int  false  "Смещение"                        default(0)
// @Success      200     {object}  Response{data=[]UsageClassificationResponse,meta=Meta}
// @Router       /usage-classifications [get]
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
    limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
    offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
    pg := toPagination(int32(limit), int32(offset))

    items, total, err := h.service.List(r.Context(), pg)
    if err != nil {
        sendError(w, http.StatusInternalServerError, err.Error())
        return
    }
    sendSuccess(w, http.StatusOK, items, &Meta{
        Total:  total,
        Limit:  pg.Limit,
        Offset: pg.Offset,
    })
}

func toPagination(limit, offset int32) Pagination {
    if limit <= 0 {
        limit = 1000
    }
    if limit > 1000 {
        limit = 1000
    }
    if offset < 0 {
        offset = 0
    }
    return Pagination{Limit: limit, Offset: offset}
}

func sendSuccess(w http.ResponseWriter, status int, data interface{}, meta *Meta) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(Response{
        Success: true,
        Data:    data,
        Meta:    meta,
    })
}

func sendError(w http.ResponseWriter, status int, message string) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(Response{
        Success: false,
        Error:   message,
    })
}

