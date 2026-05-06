package equipment

import (
    "time"

    "github.com/google/uuid"
)

type Equipment struct {
    ID                    uuid.UUID
    ManufacturerID        uuid.UUID
    EquipmentDictionaryID uuid.UUID
    FactoryNumber         string
    InventoryNumber       *string
    ManufactureYear       time.Time
    OrganizationID        uuid.UUID
    StatusID              int16
}

type MeasuringInstrument struct {
    ID                           *uuid.UUID
    EquipmentID                  uuid.UUID
    MetrologicalOperationTypeID  *int32
    CertificateNumber            *string
    LastOperationDate            *time.Time
    NextOperationDate            *time.Time
    DocumentProviderOrganization *string
    DocumentURL                  *string
    StandardID                   *uuid.UUID
}

type Standard struct {
    ID                           *uuid.UUID
    EquipmentID                  uuid.UUID
    CertificateNumber            *string
    LastOperationDate            *time.Time
    NextOperationDate            *time.Time
    DocumentProviderOrganization *string
    DocumentURL                  *string
    MetrologicalCharacteristics  *string
}

type EquipmentWithDetails struct {
    ID                           uuid.UUID
    ManufacturerID               uuid.UUID
    ManufacturerName             string
    UsageClassification          string
    EquipmentDictionaryID        uuid.UUID
    EquipmentName                string
    Model                        string
    MeasuringInstrumentsDictID   *uuid.UUID
    FactoryNumber                string
    InventoryNumber              *string
    ManufactureYear              time.Time
    OrganizationID               uuid.UUID
    OrganizationName             string
    StatusID                     int16
    StatusName                   string
    MeasuringInstrument *MeasuringInstrumentInfo
   Standards           []StandardInfo
}

type EquipmentDictionaryInfo struct {
    ID                           uuid.UUID
    FullName                     string
    Model                        string
    MeasuringInstrumentsDictionaryID   *uuid.UUID
    MeasuringInstrumentInfo      *MeasuringInstrumentInfo
}

type CreateRequest struct {
    ManufacturerID       string  `json:"manufacturerId" validate:"required"`
    EquipmentDictionaryID string `json:"equipmentDictionaryId" validate:"required"`
    FactoryNumber        string  `json:"factoryNumber" validate:"required,max=50"`
    InventoryNumber      *string `json:"inventoryNumber,omitempty"`
    ManufactureYear      string  `json:"manufactureYear" validate:"required"`
    OrganizationID       string  `json:"organizationId" validate:"required"`
    StatusID             int16   `json:"statusId" validate:"required,min=1,max=5"`
    // Для средств измерения
    MetrologicalOperationTypeID *int32 `json:"metrologicalOperationTypeId,omitempty"`
    CertificateNumber           *string `json:"certificateNumber,omitempty"`
    LastOperationDate           *string `json:"lastOperationDate,omitempty"`
    NextOperationDate           *string `json:"nextOperationDate,omitempty"`
    DocumentProviderOrganization *string `json:"documentProviderOrganization,omitempty"`
    DocumentURL                 *string `json:"documentUrl,omitempty"`
    StandardID                  *string `json:"standardId,omitempty"`
    // Для эталонов 
    StandardMetrologicalCharacteristics *string `json:"metrologicalCharacteristics,omitempty"`
    StandardCertificateNumber           *string `json:"certificateNumber,omitempty"`
    StandardLastOperationDate           *string `json:"lastOperationDate,omitempty"`
    StandardNextOperationDate           *string `json:"nextOperationDate,omitempty"`
    StandardDocumentProviderOrganization *string `json:"documentProviderOrganization,omitempty"`
    StandardDocumentURL                 *string `json:"documentUrl,omitempty"`
}

type MeasuringInstrumentInfo struct {
    ID                           *uuid.UUID `json:"id,omitempty"`
    CertificateNumber            *string    `json:"certificateNumber,omitempty"`
    LastOperationDate            *string    `json:"lastOperationDate,omitempty"`
    NextOperationDate            *string    `json:"nextOperationDate,omitempty"`
    DocumentProviderOrganization *string    `json:"documentProviderOrganization,omitempty"`
    DocumentURL                  *string    `json:"documentUrl,omitempty"`
    StandardID                   *uuid.UUID `json:"standardId,omitempty"`
    RegistryNumber               *string    `json:"registryNumber,omitempty"`
    MetrologicalOperationTypeID  *int32    `json:"metrologicalOperationTypeId,omitempty"`
    MetrologicalOperationType    *string    `json:"metrologicalOperationType,omitempty"`
}

type StandardInfo struct {
    ID                           *uuid.UUID `json:"id,omitempty"`
    CertificateNumber            *string    `json:"certificateNumber,omitempty"`
    LastOperationDate            *string    `json:"lastOperationDate,omitempty"`
    NextOperationDate            *string    `json:"nextOperationDate,omitempty"`
    DocumentProviderOrganization *string    `json:"documentProviderOrganization,omitempty"`
    DocumentURL                  *string    `json:"documentUrl,omitempty"`
    MetrologicalCharacteristics  *string    `json:"metrologicalCharacteristics,omitempty"`
}

type UpdateRequest struct {
    FactoryNumber        *string `json:"factoryNumber,omitempty"`
    InventoryNumber      *string `json:"inventoryNumber,omitempty"`
    ManufactureYear      *string `json:"manufactureYear,omitempty"`
    RegistrationYear     *string `json:"registrationYear,omitempty"`
    EquipmentDictionaryID *string `json:"equipmentDictionaryId,omitempty"`
    OrganizationID       *string `json:"organizationId,omitempty"`
    StatusID             *int16  `json:"statusId,omitempty"`
}

type EquipmentResponse struct {
    ID                   string  `json:"id"`
    ManufacturerName     string  `json:"manufacturerName"`
    UsageClassification  string  `json:"usageClassification"`
    EquipmentName        string  `json:"equipmentName"`
    Model                string  `json:"model"`
    FactoryNumber        string  `json:"factoryNumber"`
    InventoryNumber      *string `json:"inventoryNumber,omitempty"`
    ManufactureYear      string  `json:"manufactureYear"`
    OrganizationName     string  `json:"organizationName"`
    StatusID             int16   `json:"statusId"`
    StatusName           string  `json:"statusName"`
    CreatedAt            string  `json:"createdAt"`
    UpdatedAt            string  `json:"updatedAt"`
    MeasuringInstrument  *MeasuringInstrumentInfo `json:"measuringInstrument,omitempty"`
    Standards            []StandardInfo            `json:"standard,omitempty"`
}

type Pagination struct {
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