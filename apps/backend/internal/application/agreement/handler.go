package agreement

import (
    "encoding/json"
    "net/http"
    "strconv"

    "github.com/go-chi/chi/v5"
)

type AgreementHandler struct {
    service AgreementService
}

func NewHandler(service AgreementService) *AgreementHandler {
    return &AgreementHandler{service: service}
}

// Create создает новый договор
// @Summary      Создать договор
// @Description  Создает новый договор между заказчиком и подрядчиком
// @Tags         agreements
// @Accept       json
// @Produce      json
// @Param        request body CreateRequest true "Данные договора"
// @Success      201  {object}  Response{data=AgreementResponse}  "Договор создан"
// @Failure      400  {object}  Response  "Неверный запрос"
// @Failure      500  {object}  Response  "Внутренняя ошибка сервера"
// @Router       /agreements [post]
func (h *AgreementHandler) Create(w http.ResponseWriter, r *http.Request) {
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

// GetByID возвращает договор по ID
// @Summary      Получить договор по ID
// @Description  Возвращает информацию о договоре
// @Tags         agreements
// @Produce      json
// @Param        id   path      string  true  "ID договора"
// @Success      200  {object}  Response{data=AgreementResponse}  "Успешный ответ"
// @Failure      404  {object}  Response  "Договор не найден"
// @Failure      500  {object}  Response  "Внутренняя ошибка сервера"
// @Router       /agreements/{id} [get]
func (h *AgreementHandler) GetByID(w http.ResponseWriter, r *http.Request) {
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

// Update обновляет договор
// @Summary      Обновить договор
// @Description  Обновляет данные существующего договора
// @Tags         agreements
// @Accept       json
// @Produce      json
// @Param        id       path      string         true  "ID договора"
// @Param        request  body      UpdateRequest  true  "Данные для обновления"
// @Success      200      {object}  Response{data=AgreementResponse}  "Успешное обновление"
// @Failure      400      {object}  Response  "Неверный запрос"
// @Failure      404      {object}  Response  "Договор не найден"
// @Failure      500      {object}  Response  "Внутренняя ошибка сервера"
// @Router       /agreements/{id} [put]
func (h *AgreementHandler) Update(w http.ResponseWriter, r *http.Request) {
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

// Delete удаляет договор
// @Summary      Удалить договор
// @Description  Удаляет договор по ID
// @Tags         agreements
// @Param        id   path      string  true  "ID договора"
// @Success      204  "Успешное удаление"
// @Failure      404  {object}  Response  "Договор не найден"
// @Failure      500  {object}  Response  "Внутренняя ошибка сервера"
// @Router       /agreements/{id} [delete]
func (h *AgreementHandler) Delete(w http.ResponseWriter, r *http.Request) {
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

// List возвращает список договоров
// @Summary      Получить список договоров
// @Description  Возвращает список договоров с пагинацией
// @Tags         agreements
// @Produce      json
// @Param        limit   query     int  false  "Количество записей на странице"  default(10)  minimum(1)  maximum(100)
// @Param        offset  query     int  false  "Смещение"                        default(0)   minimum(0)
// @Success      200     {object}  Response{data=[]AgreementResponse,meta=Meta}  "Успешный ответ"
// @Failure      500     {object}  Response  "Внутренняя ошибка сервера"
// @Router       /agreements [get]
func (h *AgreementHandler) List(w http.ResponseWriter, r *http.Request) {
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