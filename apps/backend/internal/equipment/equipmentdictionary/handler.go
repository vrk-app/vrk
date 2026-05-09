package equipmentdictionary

import (
	"encoding/json"
	"errors"
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

// CreateEquipmentDictionary создаёт новый equipment_dictionary с вложенными MID и стандартами
// @Summary      Создать словарь оборудования
// @Description  Создаёт equipment_dictionary, при необходимости создаёт measuring_instruments_dictionary и стандарты
// @Tags         equipment
// @Accept       json
// @Produce      json
// @Param        request body CreateEquipmentDictionaryRequest true "Данные"
// @Success      201  {object}  ApiResponse{data=EquipmentDictionaryFull}
// @Failure      400  {object}  ApiResponse
// @Failure      500  {object}  ApiResponse
// @Router       /equipment-dictionaries [post]
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateEquipmentDictionaryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	resp, err := h.service.Create(r.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, ErrRegistryNumberRequired), errors.Is(err, ErrRegistryNumberTooLong), errors.Is(err, ErrStandardModelTooLong):
			sendError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, ErrMetrologicalTypeNotFound):
			sendError(w, http.StatusNotFound, err.Error())
		case errors.Is(err, ErrRegistryNumberNotUnique):
			sendError(w, http.StatusConflict, err.Error())
		default:
			sendError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}
	sendSuccess(w, http.StatusCreated, resp, nil)
}

// GetByID возвращает equipment_dictionary с полной информацией
// @Summary      Получить словарь оборудования по ID
// @Tags         equipment
// @Produce      json
// @Param        id   path      string  true  "ID"
// @Success      200  {object}  ApiResponse{data=EquipmentDictionaryFull}
// @Failure      404  {object}  ApiResponse
// @Router       /equipment-dictionaries/{id} [get]
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

// UpdateEquipmentDictionary обновляет dictionary
// @Summary      Обновить словарь оборудования
// @Tags         equipment
// @Accept       json
// @Produce      json
// @Param        id       path      string                         true  "ID"
// @Param        request  body      UpdateEquipmentDictionaryRequest true  "Данные"
// @Success      200      {object}  ApiResponse{data=EquipmentDictionaryFull}
// @Failure      400      {object}  ApiResponse
// @Failure      404      {object}  ApiResponse
// @Router       /equipment-dictionaries/{id} [patch]
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		sendError(w, http.StatusBadRequest, "ID is required")
		return
	}
	var req UpdateEquipmentDictionaryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	resp, err := h.service.Update(r.Context(), id, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrRegistryNumberTooLong), errors.Is(err, ErrStandardModelTooLong):
			sendError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, ErrMetrologicalTypeNotFound), errors.Is(err, ErrMIDNotFound):
			sendError(w, http.StatusNotFound, err.Error())
		case errors.Is(err, ErrRegistryNumberNotUnique):
			sendError(w, http.StatusConflict, err.Error())
		default:
			sendError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}
	sendSuccess(w, http.StatusOK, resp, nil)
}

// Delete удаляет equipment_dictionary и связанные данные
// @Summary      Удалить словарь оборудования
// @Tags         equipment
// @Param        id   path      string  true  "ID"
// @Success      204
// @Failure      404  {object}  ApiResponse
// @Router       /equipment-dictionaries/{id} [delete]
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

// List возвращает список equipment_dictionaries
// @Summary      Получить список словарей оборудования
// @Tags         equipment
// @Produce      json
// @Param        limit   query     int  false  "Количество записей"  default(10)
// @Param        offset  query     int  false  "Смещение"            default(0)
// @Success      200     {object}  ApiResponse{data=[]EquipmentDictionaryFull,meta=Meta}
// @Router       /equipment-dictionaries [get]
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
	json.NewEncoder(w).Encode(ApiResponse{
		Success: true,
		Data:    data,
		Meta:    meta,
	})
}

func sendError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(ApiResponse{
		Success: false,
		Error:   message,
	})
}
