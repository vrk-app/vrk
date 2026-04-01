package measuringinstrument

import (
    "time"

    "github.com/google/uuid"
)

// MeasuringInstrument — модель для работы со средствами измерения
type MeasuringInstrument struct {
    ID                          uuid.UUID
    RegistryNumber              string
    MetrologicalOperationTypeID uuid.UUID
    CertificateNumber           string
    LastOperationDate           *time.Time
    NextOperationDate           *time.Time
    DocumentProviderOrganization string
    DocumentURL                 string
    StandardID                  *uuid.UUID
    OrganizationID              uuid.UUID
    CreatedAt                   time.Time
    UpdatedAt                   time.Time
}

// CreateRequest DTO для создания средства измерения
type CreateRequest struct {
    RegistryNumber                string  `json:"registryNumber" validate:"required,max=50"`
    MetrologicalOperationTypeID   string  `json:"metrologicalOperationTypeId" validate:"required"`
    CertificateNumber             string  `json:"certificateNumber" validate:"required,max=100"`
    LastOperationDate             *string `json:"lastOperationDate,omitempty"`
    NextOperationDate             *string `json:"nextOperationDate,omitempty"`
    DocumentProviderOrganization  string  `json:"documentProviderOrganization" validate:"required,max=100"`
    DocumentURL                   string  `json:"documentUrl" validate:"required,max=255"`
    StandardID                    *string `json:"standardId,omitempty"`
    OrganizationID                string  `json:"organizationId" validate:"required"`
}

// UpdateRequest DTO для обновления средства измерения
type UpdateRequest struct {
    RegistryNumber                *string `json:"registryNumber,omitempty"`
    MetrologicalOperationTypeID   *string `json:"metrologicalOperationTypeId,omitempty"`
    CertificateNumber             *string `json:"certificateNumber,omitempty"`
    LastOperationDate             *string `json:"lastOperationDate,omitempty"`
    NextOperationDate             *string `json:"nextOperationDate,omitempty"`
    DocumentProviderOrganization  *string `json:"documentProviderOrganization,omitempty"`
    DocumentURL                   *string `json:"documentUrl,omitempty"`
    StandardID                    *string `json:"standardId,omitempty"`
    OrganizationID                *string `json:"organizationId,omitempty"`
}

// MeasuringInstrumentResponse DTO для ответа
type MeasuringInstrumentResponse struct {
    ID                            string  `json:"id"`
    RegistryNumber                string  `json:"registryNumber"`
    MetrologicalOperationTypeID   string  `json:"metrologicalOperationTypeId"`
    CertificateNumber             string  `json:"certificateNumber"`
    LastOperationDate             *string `json:"lastOperationDate,omitempty"`
    NextOperationDate             *string `json:"nextOperationDate,omitempty"`
    DocumentProviderOrganization  string  `json:"documentProviderOrganization"`
    DocumentURL                   string  `json:"documentUrl"`
    StandardID                    *string `json:"standardId,omitempty"`
    OrganizationID                string  `json:"organizationId"`
    CreatedAt                     string  `json:"createdAt"`
    UpdatedAt                     string  `json:"updatedAt"`
}

// ListFilter для пагинации
type ListFilter struct {
    Limit  int32
    Offset int32
}

// Meta пагинация
type Meta struct {
    Total  int64 `json:"total"`
    Limit  int32 `json:"limit"`
    Offset int32 `json:"offset"`
}

// Response стандартный ответ
type Response struct {
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
    Error   string      `json:"error,omitempty"`
    Meta    *Meta       `json:"meta,omitempty"`
}