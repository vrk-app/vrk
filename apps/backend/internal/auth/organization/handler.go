package organization

import (
    "encoding/json"
    "net/http"
    "strconv"

    "github.com/go-chi/chi/v5"
)

type OrganizationHandler struct {
    organizationService OrganizationService
}

func NewHandler(organizationService OrganizationService) *OrganizationHandler {
    return &OrganizationHandler{organizationService: organizationService}
}

// Create создает новую организацию
// @Summary      Создать организацию
// @Description  Создает новую организацию (заказчика или подрядчика)
// @Tags         organizations
// @Accept       json
// @Produce      json
// @Param        request body CreateRequest true "Данные организации"
// @Success      201  {object}  Response{data=OrganizationResponse}  "Организация создана"
// @Failure      400  {object}  Response  "Неверный запрос"
// @Failure      500  {object}  Response  "Внутренняя ошибка сервера"
// @Router       /organizations [post]
func (organizationHandler *OrganizationHandler) Create(w http.ResponseWriter, r *http.Request) {
    var req CreateRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        sendError(w, http.StatusBadRequest, "Invalid request body")
        return
    }

    resp, err := organizationHandler.organizationService.Create(r.Context(), req)
    if err != nil {
        sendError(w, http.StatusInternalServerError, err.Error())
        return
    }

    sendSuccess(w, http.StatusCreated, resp, nil)
}

// List возвращает список организаций
// @Summary      Получить список организаций
// @Description  Возвращает список организаций с пагинацией
// @Tags         organizations
// @Produce      json
// @Param        limit   query     int  false  "Количество записей на странице"  default(10)  minimum(1)  maximum(100)
// @Param        offset  query     int  false  "Смещение"                        default(0)   minimum(0)
// @Success      200     {object}  Response{data=[]OrganizationResponse,meta=Meta}  "Успешный ответ"
// @Failure      500     {object}  Response  "Внутренняя ошибка сервера"
// @Router       /organizations [get]
func (organizationHandler *OrganizationHandler) List(w http.ResponseWriter, r *http.Request) {
    limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
    offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

    items, total, err := organizationHandler.organizationService.List(r.Context(), int32(limit), int32(offset))
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

// GetByID возвращает организацию по ID
// @Summary      Получить организацию по ID
// @Description  Возвращает информацию об организации
// @Tags         organizations
// @Produce      json
// @Param        id   path      string  true  "ID организации"
// @Success      200  {object}  Response{data=OrganizationResponse}  "Успешный ответ"
// @Failure      404  {object}  Response  "Организация не найдена"
// @Failure      500  {object}  Response  "Внутренняя ошибка сервера"
// @Router       /organizations/{id} [get]
func (h *OrganizationHandler) GetByID(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    if id == "" {
        sendError(w, http.StatusBadRequest, "ID is required")
        return
    }

    resp, err := h.organizationService.GetByID(r.Context(), id)
    if err != nil {
        sendError(w, http.StatusNotFound, err.Error())
        return
    }

    sendSuccess(w, http.StatusOK, resp, nil)
}

// Update обновляет организацию
// @Summary      Обновить организацию
// @Description  Обновляет данные организации
// @Tags         organizations
// @Accept       json
// @Produce      json
// @Param        id       path      string         true  "ID организации"
// @Param        request  body      UpdateRequest  true  "Данные для обновления"
// @Success      200      {object}  Response{data=OrganizationResponse}  "Успешное обновление"
// @Failure      400      {object}  Response  "Неверный запрос"
// @Failure      404      {object}  Response  "Организация не найдена"
// @Failure      500      {object}  Response  "Внутренняя ошибка сервера"
// @Router       /organizations/{id} [put]
func (h *OrganizationHandler) Update(w http.ResponseWriter, r *http.Request) {
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

    resp, err := h.organizationService.Update(r.Context(), id, req)
    if err != nil {
        sendError(w, http.StatusInternalServerError, err.Error())
        return
    }

    sendSuccess(w, http.StatusOK, resp, nil)
}

// Delete удаляет организацию
// @Summary      Удалить организацию
// @Description  Удаляет организацию по ID
// @Tags         organizations
// @Param        id   path      string  true  "ID организации"
// @Success      204  "Успешное удаление"
// @Failure      404  {object}  Response  "Организация не найдена"
// @Failure      500  {object}  Response  "Внутренняя ошибка сервера"
// @Router       /organizations/{id} [delete]
func (h *OrganizationHandler) Delete(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    if id == "" {
        sendError(w, http.StatusBadRequest, "ID is required")
        return
    }

    if err := h.organizationService.Delete(r.Context(), id); err != nil {
        sendError(w, http.StatusInternalServerError, err.Error())
        return
    }

    sendSuccess(w, http.StatusNoContent, nil, nil)
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