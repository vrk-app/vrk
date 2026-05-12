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

type EquipmentPhotoResponse struct {
	ID          string `json:"id"`
	FileName    string `json:"fileName"`
	ContentType string `json:"contentType"`
	SizeBytes   int64  `json:"sizeBytes"`
	SortOrder   int    `json:"sortOrder"`
	URL         string `json:"url"`
	CreatedAt   string `json:"createdAt"`
	UpdatedAt   string `json:"updatedAt"`
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

type EquipmentResponse struct {
	ID                       string                   `json:"id"`
	OrganizationID           string                   `json:"organizationId"`
	Unit                     UnitSummary              `json:"unit"`
	Manufacturer             string                   `json:"manufacturer"`
	Classification           string                   `json:"classification"`
	Model                    string                   `json:"model"`
	FullName                 string                   `json:"fullName"`
	FactoryNumber            string                   `json:"factoryNumber"`
	InventoryNumber          *string                  `json:"inventoryNumber,omitempty"`
	ManufactureYear          int                      `json:"manufactureYear"`
	Status                   string                   `json:"status"`
	Comment                  *string                  `json:"comment,omitempty"`
	DocumentURL              *string                  `json:"documentUrl,omitempty"`
	Photos                   []EquipmentPhotoResponse `json:"photos"`
	JournalCount             int                      `json:"journalCount"`
	NextDueDate              *string                  `json:"nextDueDate,omitempty"`
	LatestJournal            *JournalResponse         `json:"latestJournal,omitempty"`
	MeasuringInstrumentCount int                      `json:"measuringInstrumentCount"`
	ArchivedAt               *string                  `json:"archivedAt,omitempty"`
	CreatedAt                string                   `json:"createdAt"`
	UpdatedAt                string                   `json:"updatedAt"`
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
