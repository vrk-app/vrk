package standard

import (
    "time"

    "github.com/google/uuid"
)

type Standard struct {
    ID                          uuid.UUID
    Model                       string
    CertificateNumber           string
    LastOperationDate           *time.Time
    NextOperationDate           *time.Time
    DocumentProviderOrganization string
    DocumentURL                 string
    MetrologicalCharacteristics string
    CreatedAt                   time.Time
    UpdatedAt                   time.Time
}

type CreateRequest struct {
    Model                         string  `json:"model" validate:"required,max=50"`
    CertificateNumber             string  `json:"certificateNumber" validate:"required,max=100"`
    LastOperationDate             *string `json:"lastOperationDate,omitempty"`
    NextOperationDate             *string `json:"nextOperationDate,omitempty"`
    DocumentProviderOrganization  string  `json:"documentProviderOrganization" validate:"required,max=100"`
    DocumentURL                   string  `json:"documentUrl" validate:"required,max=255"`
    MetrologicalCharacteristics   string  `json:"metrologicalCharacteristics" validate:"required"`
}

type UpdateRequest struct {
    Model                         *string `json:"model,omitempty"`
    CertificateNumber             *string `json:"certificateNumber,omitempty"`
    LastOperationDate             *string `json:"lastOperationDate,omitempty"`
    NextOperationDate             *string `json:"nextOperationDate,omitempty"`
    DocumentProviderOrganization  *string `json:"documentProviderOrganization,omitempty"`
    DocumentURL                   *string `json:"documentUrl,omitempty"`
    MetrologicalCharacteristics   *string `json:"metrologicalCharacteristics,omitempty"`
}

type StandardResponse struct {
    ID                            string  `json:"id"`
    Model                         string  `json:"model"`
    CertificateNumber             string  `json:"certificateNumber"`
    LastOperationDate             *string `json:"lastOperationDate,omitempty"`
    NextOperationDate             *string `json:"nextOperationDate,omitempty"`
    DocumentProviderOrganization  string  `json:"documentProviderOrganization"`
    DocumentURL                   string  `json:"documentUrl"`
    MetrologicalCharacteristics   string  `json:"metrologicalCharacteristics"`
    CreatedAt                     string  `json:"createdAt"`
    UpdatedAt                     string  `json:"updatedAt"`
}

type ListFilter struct {
    Limit  int32
    Offset int32
}

type Meta struct {
    Total  int64 `json:"total"`
    Limit  int32 `json:"limit"`
    Offset int32 `json:"offset"`
}

type Response struct {
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
    Error   string      `json:"error,omitempty"`
    Meta    *Meta       `json:"meta,omitempty"`
}