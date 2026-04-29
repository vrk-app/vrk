package measuringinstrument

import "time"

type LinkedStandard struct {
	ID           string  `json:"id"`
	StandardType string  `json:"standardType"`
	Model        string  `json:"model"`
	Identifier   string  `json:"identifier"`
	SerialNumber *string `json:"serialNumber,omitempty"`
	Status       string  `json:"status"`
	ScopeLabel   string  `json:"scopeLabel"`
}

type MeasuringInstrument struct {
	ID                 string
	OrganizationID     string
	UnitID             string
	UnitName           string
	DivisionID      *string
	DivisionName    *string
	EquipmentID        *string
	EquipmentFullName  *string
	Name               string
	InstrumentType     string
	Model              string
	RegistrationNumber string
	SerialNumber       string
	Status             string
	PlacementKind      string
	Comment            *string
	DocumentURL        *string
	Standards          []LinkedStandard
	ArchivedAt         *time.Time
	CreatedAt          time.Time
	UpdatedAt          time.Time
}

type CreateRequest struct {
	UnitID             string   `json:"unitId"`
	EquipmentID        *string  `json:"equipmentId,omitempty"`
	Name               string   `json:"name"`
	InstrumentType     string   `json:"instrumentType"`
	Model              string   `json:"model"`
	RegistrationNumber string   `json:"registrationNumber"`
	SerialNumber       string   `json:"serialNumber"`
	PlacementKind      string   `json:"placementKind"`
	StandardIDs        []string `json:"standardIds,omitempty"`
	Comment            *string  `json:"comment,omitempty"`
	DocumentURL        *string  `json:"documentUrl,omitempty"`
}

type UpdateRequest struct {
	UnitID             *string  `json:"unitId,omitempty"`
	EquipmentID        *string  `json:"equipmentId,omitempty"`
	Name               *string  `json:"name,omitempty"`
	InstrumentType     *string  `json:"instrumentType,omitempty"`
	Model              *string  `json:"model,omitempty"`
	RegistrationNumber *string  `json:"registrationNumber,omitempty"`
	SerialNumber       *string  `json:"serialNumber,omitempty"`
	PlacementKind      *string  `json:"placementKind,omitempty"`
	StandardIDs        []string `json:"standardIds,omitempty"`
	Comment            *string  `json:"comment,omitempty"`
	DocumentURL        *string  `json:"documentUrl,omitempty"`
}

type CreateJournalRequest struct {
	OperationType        string  `json:"operationType"`
	OperationDate        string  `json:"operationDate"`
	DocumentNumber       string  `json:"documentNumber"`
	ValidUntil           *string `json:"validUntil,omitempty"`
	ExecutorOrganization string  `json:"executorOrganization"`
	AttachmentURL        *string `json:"attachmentUrl,omitempty"`
	Comment              *string `json:"comment,omitempty"`
}

type JournalResponse struct {
	ID                   string  `json:"id"`
	OperationType        string  `json:"operationType"`
	OperationDate        string  `json:"operationDate"`
	DocumentNumber       string  `json:"documentNumber"`
	ValidUntil           *string `json:"validUntil,omitempty"`
	ExecutorOrganization string  `json:"executorOrganization"`
	AttachmentURL        *string `json:"attachmentUrl,omitempty"`
	Comment              *string `json:"comment,omitempty"`
	CreatedAt            string  `json:"createdAt"`
}

type UnitSummary struct {
	ID              string  `json:"id"`
	Name            string  `json:"name"`
	DivisionID   *string `json:"divisionId,omitempty"`
	DivisionName *string `json:"divisionName,omitempty"`
}

type EquipmentSummary struct {
	ID       string `json:"id"`
	FullName string `json:"fullName"`
}

type MeasuringInstrumentResponse struct {
	ID                 string            `json:"id"`
	OrganizationID     string            `json:"organizationId"`
	Unit               UnitSummary       `json:"unit"`
	Equipment          *EquipmentSummary `json:"equipment,omitempty"`
	Name               string            `json:"name"`
	InstrumentType     string            `json:"instrumentType"`
	Model              string            `json:"model"`
	RegistrationNumber string            `json:"registrationNumber"`
	SerialNumber       string            `json:"serialNumber"`
	Status             string            `json:"status"`
	PlacementKind      string            `json:"placementKind"`
	Comment            *string           `json:"comment,omitempty"`
	DocumentURL        *string           `json:"documentUrl,omitempty"`
	Standards          []LinkedStandard  `json:"standards"`
	JournalCount       int               `json:"journalCount"`
	NextDueDate        *string           `json:"nextDueDate,omitempty"`
	LatestJournal      *JournalResponse  `json:"latestJournal,omitempty"`
	ArchivedAt         *string           `json:"archivedAt,omitempty"`
	CreatedAt          string            `json:"createdAt"`
	UpdatedAt          string            `json:"updatedAt"`
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
