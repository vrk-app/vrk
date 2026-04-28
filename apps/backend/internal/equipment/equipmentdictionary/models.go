package equipmentdictionary

import (
    "time"
    "github.com/google/uuid"
)

// EquipmentDictionary – основная модель (без связей)
type EquipmentDictionary struct {
    ID                               uuid.UUID
    FullName                         string
    Model                            string
    MeasuringInstrumentsDictionaryID *uuid.UUID
    CreatedAt                        time.Time
    UpdatedAt                        time.Time
}

// MeasuringInstrumentDictionary – модель MID
type MeasuringInstrumentsDictionary struct {
    ID                           uuid.UUID
    RegistryNumber               string
    MetrologicalOperationTypeID  *int32
    CreatedAt                    time.Time
    UpdatedAt                    time.Time
}

// StandardDictionary – модель эталонного словаря
type StandardsDictionary struct {
    ID                           uuid.UUID
    MeasuringInstrumentsDictionaryID uuid.UUID
    Model                        string
}

type EquipmentDictionaryWithDetails struct {
    ID                         uuid.UUID
    FullName                   string
    Model                      string
    MeasuringInstrumentsDictionaryID *uuid.UUID
    RegistryNumber             *string
    MetrologicalOperationTypeID  *int32
    MetrologicalOperationType    *string
}

// EquipmentDictionaryFull – для ответа (с вложенными MID и стандартами)
type EquipmentDictionaryFull struct {
    ID          string
    FullName    string
    Model       string
    CreatedAt   string
    UpdatedAt   string
    MID         *MeasuringInstrumentsDictionaryFull
}

type MeasuringInstrumentsDictionaryFull struct {
    ID                         string
    RegistryNumber             string
    MetrologicalOperationTypeID *int32
    MetrologicalOperationType   *string
    Standards                  []StandardsDictionaryFull
}

type StandardsDictionaryFull struct {
    ID    string
    Model string
}

// Запросы на создание/обновление
type CreateEquipmentDictionaryRequest struct {
    FullName    string `json:"fullName"`
    Model       string `json:"model"`
    MeasuringInstrument             *MeasuringInstrumentInput   `json:"measuringInstrument,omitempty"`
}

type MeasuringInstrumentInput struct {
    RegistryNumber             string   `json:"registryNumber"`
    MetrologicalOperationTypeID *int32    `json:"metrologicalOperationTypeId,omitempty"`
    Standards                  []string `json:"standards" example:"standardModel"`
}

type UpdateEquipmentDictionaryRequest struct {
    FullName    *string `json:"fullName,omitempty"`
    Model       *string `json:"model,omitempty"`
    MeasuringInstrumentsDictionaryID *string `json:"measuringInstrumentDictionaryId,omitempty"`
    MeasuringInstrument             *MeasuringInstrumentInput `json:"measuringInstrument,omitempty"`
}

// Ответ API
type ApiResponse struct {
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
    Error   string      `json:"error,omitempty"`
    Meta    *Meta       `json:"meta,omitempty"`
}

type Meta struct {
    Total  int64 `json:"total"`
    Limit  int32 `json:"limit"`
    Offset int32 `json:"offset"`
}