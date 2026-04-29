package equipment

import "time"

type Equipment struct {
	ID                       string
	OrganizationID           string
	UnitID                   string
	UnitName                 string
	DivisionID               *string
	DivisionName             *string
	Manufacturer             string
	Classification           string
	Model                    string
	FullName                 string
	FactoryNumber            string
	InventoryNumber          *string
	ManufactureYear          int
	Status                   string
	Comment                  *string
	DocumentURL              *string
	MeasuringInstrumentCount int
	ArchivedAt               *time.Time
	CreatedAt                time.Time
	UpdatedAt                time.Time
}

type CreateRequest struct {
	UnitID          string  `json:"unitId"`
	Manufacturer    string  `json:"manufacturer"`
	Classification  string  `json:"classification"`
	Model           string  `json:"model"`
	FullName        string  `json:"fullName"`
	FactoryNumber   string  `json:"factoryNumber"`
	InventoryNumber *string `json:"inventoryNumber,omitempty"`
	ManufactureYear int     `json:"manufactureYear"`
	Status          string  `json:"status"`
	Comment         *string `json:"comment,omitempty"`
	DocumentURL     *string `json:"documentUrl,omitempty"`
}

type UpdateRequest struct {
	UnitID          *string `json:"unitId,omitempty"`
	Manufacturer    *string `json:"manufacturer,omitempty"`
	Classification  *string `json:"classification,omitempty"`
	Model           *string `json:"model,omitempty"`
	FullName        *string `json:"fullName,omitempty"`
	FactoryNumber   *string `json:"factoryNumber,omitempty"`
	InventoryNumber *string `json:"inventoryNumber,omitempty"`
	ManufactureYear *int    `json:"manufactureYear,omitempty"`
	Status          *string `json:"status,omitempty"`
	Comment         *string `json:"comment,omitempty"`
	DocumentURL     *string `json:"documentUrl,omitempty"`
}

type UnitSummary struct {
	ID           string  `json:"id"`
	Name         string  `json:"name"`
	DivisionID   *string `json:"divisionId,omitempty"`
	DivisionName *string `json:"divisionName,omitempty"`
}

type EquipmentResponse struct {
	ID                       string      `json:"id"`
	OrganizationID           string      `json:"organizationId"`
	Unit                     UnitSummary `json:"unit"`
	Manufacturer             string      `json:"manufacturer"`
	Classification           string      `json:"classification"`
	Model                    string      `json:"model"`
	FullName                 string      `json:"fullName"`
	FactoryNumber            string      `json:"factoryNumber"`
	InventoryNumber          *string     `json:"inventoryNumber,omitempty"`
	ManufactureYear          int         `json:"manufactureYear"`
	Status                   string      `json:"status"`
	Comment                  *string     `json:"comment,omitempty"`
	DocumentURL              *string     `json:"documentUrl,omitempty"`
	MeasuringInstrumentCount int         `json:"measuringInstrumentCount"`
	ArchivedAt               *string     `json:"archivedAt,omitempty"`
	CreatedAt                string      `json:"createdAt"`
	UpdatedAt                string      `json:"updatedAt"`
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
