package metrologicaltype

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

// Create создает новый тип метрологической операции
// @Summary      Создать тип метрологической операции
// @Tags         metrological-types
// @Accept       json
// @Produce      json
// @Param        request body CreateRequest true "Данные типа"
// @Success      201  {object}  Response{data=MetrologicalTypeResponse}
// @Failure      400  {object}  Response
// @Failure      500  {object}  Response
// @Router       /metrological-types [post]
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
    var req CreateRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        sendError(w, http.StatusBadRequest, "Invalid request body")
        return
    }
    resp, err := h.service.Create(r.Context(), req)
    if err != nil {
        sendError(w, http.StatusInternalServerError, err.Error())
        return
    }
    sendSuccess(w, http.StatusCreated, resp, nil)
}

// GetByID возвращает тип по ID
// @Summary      Получить тип метрологической операции по ID
// @Tags         metrological-types
// @Produce      json
// @Param        id   path      int  true  "ID типа"
// @Success      200  {object}  Response{data=MetrologicalTypeResponse}
// @Failure      404  {object}  Response
// @Router       /metrological-types/{id} [get]
func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    if id == "" {
        sendError(w, http.StatusBadRequest, "ID is required")
        return
    }
    resp, err := h.service.GetByID(r.Context(), id)
    if err != nil {
        sendError(w, http.StatusNotFound, err.Error())
        return
    }
    sendSuccess(w, http.StatusOK, resp, nil)
}

// Delete удаляет тип
// @Summary      Удалить тип метрологической операции
// @Tags         metrological-types
// @Param        id   path      int  true  "ID типа"
// @Success      204
// @Failure      404  {object}  Response
// @Router       /metrological-types/{id} [delete]
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    if id == "" {
        sendError(w, http.StatusBadRequest, "ID is required")
        return
    }
    if err := h.service.Delete(r.Context(), id); err != nil {
        sendError(w, http.StatusInternalServerError, err.Error())
        return
    }
    sendSuccess(w, http.StatusNoContent, nil, nil)
}

// List возвращает список типов
// @Summary      Получить список типов метрологических операций
// @Tags         metrological-types
// @Produce      json
// @Param        limit   query     int  false  "Количество записей на странице"  default(10)
// @Param        offset  query     int  false  "Смещение"                        default(0)
// @Success      200     {object}  Response{data=[]MetrologicalTypeResponse,meta=Meta}
// @Router       /metrological-types [get]
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
    limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
    offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
    items, total, err := h.service.List(r.Context(), int32(limit), int32(offset))
    if err != nil {
        sendError(w, http.StatusInternalServerError, err.Error())
        return
    }
    sendSuccess(w, http.StatusOK, items, &Meta{
        Total:  total,
        Limit:  int32(limit),
        Offset: int32(offset),
    })
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
