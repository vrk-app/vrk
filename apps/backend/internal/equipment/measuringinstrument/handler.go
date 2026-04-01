package measuringinstrument

import (
    "encoding/json"
    "net/http"
    "strconv"

    "github.com/go-chi/chi/v5"
)

type MeasuringInstrumentHandler struct {
    service MeasuringInstrumentService
}

func NewHandler(service MeasuringInstrumentService) *MeasuringInstrumentHandler {
    return &MeasuringInstrumentHandler{service: service}
}

// Create создает новое средство измерения
// @Summary      Создать средство измерения
// @Description  Создает новое средство измерения (СИ)
// @Tags         equipment
// @Accept       json
// @Produce      json
// @Param        request body CreateRequest true "Данные средства измерения"
// @Success      201  {object}  Response{data=MeasuringInstrumentResponse}  "Средство измерения создано"
// @Failure      400  {object}  Response  "Неверный запрос"
// @Failure      500  {object}  Response  "Внутренняя ошибка сервера"
// @Router       /measuring-instruments [post]
func (h *MeasuringInstrumentHandler) Create(w http.ResponseWriter, r *http.Request) {
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

// GetByID возвращает средство измерения по ID
// @Summary      Получить средство измерения по ID
// @Description  Возвращает информацию о средстве измерения
// @Tags         equipment
// @Produce      json
// @Param        id   path      string  true  "ID средства измерения"
// @Success      200  {object}  Response{data=MeasuringInstrumentResponse}  "Успешный ответ"
// @Failure      404  {object}  Response  "Средство измерения не найдено"
// @Failure      500  {object}  Response  "Внутренняя ошибка сервера"
// @Router       /measuring-instruments/{id} [get]
func (h *MeasuringInstrumentHandler) GetByID(w http.ResponseWriter, r *http.Request) {
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

// Update обновляет средство измерения
// @Summary      Обновить средство измерения
// @Description  Обновляет данные средства измерения
// @Tags         equipment
// @Accept       json
// @Produce      json
// @Param        id       path      string         true  "ID средства измерения"
// @Param        request  body      UpdateRequest  true  "Данные для обновления"
// @Success      200      {object}  Response{data=MeasuringInstrumentResponse}  "Успешное обновление"
// @Failure      400      {object}  Response  "Неверный запрос"
// @Failure      404      {object}  Response  "Средство измерения не найдено"
// @Failure      500      {object}  Response  "Внутренняя ошибка сервера"
// @Router       /measuring-instruments/{id} [put]
func (h *MeasuringInstrumentHandler) Update(w http.ResponseWriter, r *http.Request) {
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

// Delete удаляет средство измерения
// @Summary      Удалить средство измерения
// @Description  Удаляет средство измерения по ID
// @Tags         equipment
// @Param        id   path      string  true  "ID средства измерения"
// @Success      204  "Успешное удаление"
// @Failure      404  {object}  Response  "Средство измерения не найдено"
// @Failure      500  {object}  Response  "Внутренняя ошибка сервера"
// @Router       /measuring-instruments/{id} [delete]

func (h *MeasuringInstrumentHandler) Delete(w http.ResponseWriter, r *http.Request) {
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

// List возвращает список средств измерения
// @Summary      Получить список средств измерения
// @Description  Возвращает список средств измерения с пагинацией
// @Tags         equipment
// @Produce      json
// @Param        limit   query     int  false  "Количество записей на странице"  default(10)  minimum(1)  maximum(100)
// @Param        offset  query     int  false  "Смещение"                        default(0)   minimum(0)
// @Success      200     {object}  Response{data=[]MeasuringInstrumentResponse,meta=Meta}  "Успешный ответ"
// @Failure      500     {object}  Response  "Внутренняя ошибка сервера"
// @Router       /measuring-instruments [get]
func (h *MeasuringInstrumentHandler) List(w http.ResponseWriter, r *http.Request) {
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