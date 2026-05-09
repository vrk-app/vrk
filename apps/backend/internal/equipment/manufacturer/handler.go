package manufacturer

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type ManufacturerHandler struct {
	service ManufacturerService
}

func NewHandler(service ManufacturerService) *ManufacturerHandler {
	return &ManufacturerHandler{service: service}
}

// Create создает нового производителя
// @Summary      Создать производителя
// @Description  Создает нового производителя оборудования
// @Tags         equipment
// @Accept       json
// @Produce      json
// @Param        request body CreateRequest true "Данные производителя"
// @Success      201  {object}  Response{data=ManufacturerResponse}  "Производитель создан"
// @Failure      400  {object}  Response  "Неверный запрос"
// @Failure      500  {object}  Response  "Внутренняя ошибка сервера"
// @Router       /manufacturers [post]
func (h *ManufacturerHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	resp, err := h.service.Create(r.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, ErrNameRequired), errors.Is(err, ErrNameTooLong), errors.Is(err, ErrClassificationRequired):
			sendError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, ErrDuplicateName):
			sendError(w, http.StatusConflict, err.Error())
		case errors.Is(err, ErrClassificationNotFound):
			sendError(w, http.StatusNotFound, err.Error())
		default:
			sendError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}
	sendSuccess(w, http.StatusCreated, resp, nil)
}

// GetByID возвращает производителя по ID
// @Summary      Получить производителя по ID
// @Description  Возвращает информацию о производителе
// @Tags         equipment
// @Produce      json
// @Param        id   path      string  true  "ID производителя"
// @Success      200  {object}  Response{data=ManufacturerResponse}  "Успешный ответ"
// @Failure      404  {object}  Response  "Производитель не найден"
// @Failure      500  {object}  Response  "Внутренняя ошибка сервера"
// @Router       /manufacturers/{id} [get]
func (h *ManufacturerHandler) GetByID(w http.ResponseWriter, r *http.Request) {
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

// Update обновляет производителя
// @Summary      Обновить производителя
// @Description  Обновляет данные производителя
// @Tags         equipment
// @Accept       json
// @Produce      json
// @Param        id       path      string         true  "ID производителя"
// @Param        request  body      UpdateRequest  true  "Данные для обновления"
// @Success      200      {object}  Response{data=ManufacturerResponse}  "Успешное обновление"
// @Failure      400      {object}  Response  "Неверный запрос"
// @Failure      404      {object}  Response  "Производитель не найден"
// @Failure      500      {object}  Response  "Внутренняя ошибка сервера"
// @Router       /manufacturers/{id} [patch]
func (h *ManufacturerHandler) Update(w http.ResponseWriter, r *http.Request) {
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
		switch {
		case errors.Is(err, ErrNameTooLong):
			sendError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, ErrDuplicateName):
			sendError(w, http.StatusConflict, err.Error())
		case errors.Is(err, ErrClassificationNotFound):
			sendError(w, http.StatusNotFound, err.Error())
		default:
			sendError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}
	sendSuccess(w, http.StatusOK, resp, nil)
}

// Delete удаляет производителя
// @Summary      Удалить производителя
// @Description  Удаляет производителя по ID
// @Tags         equipment
// @Param        id   path      string  true  "ID производителя"
// @Success      204  "Успешное удаление"
// @Failure      404  {object}  Response  "Производитель не найден"
// @Failure      500  {object}  Response  "Внутренняя ошибка сервера"
// @Router       /manufacturers/{id} [delete]
func (h *ManufacturerHandler) Delete(w http.ResponseWriter, r *http.Request) {
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

// List возвращает список производителей
// @Summary      Получить список производителей
// @Description  Возвращает список производителей с пагинацией
// @Tags         equipment
// @Produce      json
// @Param        limit   query     int  false  "Количество записей на странице"  default(10)  minimum(1)  maximum(100)
// @Param        offset  query     int  false  "Смещение"                        default(0)   minimum(0)
// @Success      200     {object}  Response{data=[]ManufacturerResponse,meta=Meta}  "Успешный ответ"
// @Failure      500     {object}  Response  "Внутренняя ошибка сервера"
// @Router       /manufacturers [get]
func (h *ManufacturerHandler) List(w http.ResponseWriter, r *http.Request) {
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
		Limit:  int32(limit),
		Offset: int32(offset),
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
