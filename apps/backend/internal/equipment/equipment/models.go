package equipment

import (
    "time"

    "github.com/google/uuid"
)

type Equipment struct {
    ID                    uuid.UUID
    FactoryNumber         string
    InventoryNumber       *string
    ManufactureYear       time.Time
    RegistrationYear      *time.Time
    EquipmentDictionaryID uuid.UUID
    OrganizationID        uuid.UUID
    StatusID              int16
}

type EquipmentWithDetails struct {
    ID                    uuid.UUID
    FactoryNumber         string
    InventoryNumber       *string
    ManufactureYear       time.Time
    RegistrationYear      *time.Time
    EquipmentDictionaryID uuid.UUID
    EquipmentName         string  // full_name
    Model                 string
    Manufacturer          string
    UsageClassification   string
    OrganizationID        uuid.UUID
    OrganizationName      string
    StatusID              int16
    StatusName            string
    CreatedAt             time.Time
    UpdatedAt             time.Time
}

type CreateRequest struct {
    FactoryNumber        string  `json:"factoryNumber" validate:"required,max=50"`
    InventoryNumber      *string `json:"inventoryNumber,omitempty"`
    ManufactureYear      string  `json:"manufactureYear" validate:"required"`
    RegistrationYear     *string `json:"registrationYear,omitempty"`
    EquipmentDictionaryID string `json:"equipmentDictionaryId" validate:"required"`
    OrganizationID       string  `json:"organizationId" validate:"required"`
    StatusID             int16   `json:"statusId" validate:"required,min=1,max=5"`
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
    FactoryNumber        string  `json:"factoryNumber"`
    InventoryNumber      *string `json:"inventoryNumber,omitempty"`
    ManufactureYear      string  `json:"manufactureYear"`
    RegistrationYear     *string `json:"registrationYear,omitempty"`
    EquipmentName        string  `json:"equipmentName"`
    Model                string  `json:"model"`
    Manufacturer         string  `json:"manufacturer"`
    UsageClassification  string  `json:"usageClassification"`
    OrganizationName     string  `json:"organizationName"`
    StatusID             int16   `json:"statusId"`
    StatusName           string  `json:"statusName"`
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