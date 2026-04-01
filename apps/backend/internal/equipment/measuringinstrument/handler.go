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