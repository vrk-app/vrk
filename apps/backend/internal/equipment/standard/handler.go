package standard

import (
    "encoding/json"
    "net/http"
    "strconv"

    "github.com/go-chi/chi/v5"
)

type StandardHandler struct {
    service StandardService
}

func NewHandler(service StandardService) *StandardHandler {
    return &StandardHandler{service: service}
}

// Create создает новый эталон
// @Summary      Создать эталон
// @Description  Создает новый эталон для метрологической поверки
// @Tags         equipment
// @Accept       json
// @Produce      json
// @Param        request body CreateRequest true "Данные эталона"
// @Success      201  {object}  Response{data=StandardResponse}  "Эталон создан"
// @Failure      400  {object}  Response  "Неверный запрос"
// @Failure      500  {object}  Response  "Внутренняя ошибка сервера"
// @Router       /standards [post]
func (h *StandardHandler) Create(w http.ResponseWriter, r *http.Request) {
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

// GetByID возвращает эталон по ID
// @Summary      Получить эталон по ID
// @Description  Возвращает информацию об эталоне
// @Tags         equipment
// @Produce      json
// @Param        id   path      string  true  "ID эталона"
// @Success      200  {object}  Response{data=StandardResponse}  "Успешный ответ"
// @Failure      404  {object}  Response  "Эталон не найден"
// @Failure      500  {object}  Response  "Внутренняя ошибка сервера"
// @Router       /standards/{id} [get]
func (h *StandardHandler) GetByID(w http.ResponseWriter, r *http.Request) {
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

// Update обновляет эталон
// @Summary      Обновить эталон
// @Description  Обновляет данные эталона
// @Tags         equipment
// @Accept       json
// @Produce      json
// @Param        id       path      string         true  "ID эталона"
// @Param        request  body      UpdateRequest  true  "Данные для обновления"
// @Success      200      {object}  Response{data=StandardResponse}  "Успешное обновление"
// @Failure      400      {object}  Response  "Неверный запрос"
// @Failure      404      {object}  Response  "Эталон не найден"
// @Failure      500      {object}  Response  "Внутренняя ошибка сервера"
// @Router       /standards/{id} [put]
func (h *StandardHandler) Update(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    if id == "" {
        sendError(w, http.StatusBadRequest, "ID is required")
        return
    }
    var req UpdateRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        sendError(w, http.StatusBadRequest, "Invalid request body")
        return
    }
    resp, err := h.service.Update(r.Context(), id, req)
    if err != nil {
        sendError(w, http.StatusInternalServerError, err.Error())
        return
    }
    sendSuccess(w, http.StatusOK, resp, nil)
}

// Delete удаляет эталон
// @Summary      Удалить эталон
// @Description  Удаляет эталон по ID
// @Tags         equipment
// @Param        id   path      string  true  "ID эталона"
// @Success      204  "Успешное удаление"
// @Failure      404  {object}  Response  "Эталон не найден"
// @Failure      500  {object}  Response  "Внутренняя ошибка сервера"
// @Router       /standards/{id} [delete]
func (h *StandardHandler) Delete(w http.ResponseWriter, r *http.Request) {
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

// List возвращает список эталонов
// @Summary      Получить список эталонов
// @Description  Возвращает список эталонов с пагинацией
// @Tags         equipment
// @Produce      json
// @Param        limit   query     int  false  "Количество записей на странице"  default(10)  minimum(1)  maximum(100)
// @Param        offset  query     int  false  "Смещение"                        default(0)   minimum(0)
// @Success      200     {object}  Response{data=[]StandardResponse,meta=Meta}  "Успешный ответ"
// @Failure      500     {object}  Response  "Внутренняя ошибка сервера"
// @Router       /standards [get]
func (h *StandardHandler) List(w http.ResponseWriter, r *http.Request) {
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