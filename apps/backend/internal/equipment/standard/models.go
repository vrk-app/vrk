package standard

import "time"

type Standard struct {
	ID                          string
	OrganizationID              string
	OrganizationName            string
	DivisionID               *string
	DivisionName             *string
	UnitID                      *string
	UnitName                    *string
	OwnerLabel                  *string
	StandardType                string
	Model                       string
	Identifier                  string
	SerialNumber                *string
	MetrologicalCharacteristics string
	Status                      string
	Comment                     *string
	DocumentURL                 *string
	LinkedMeasuringInstruments  int
	ArchivedAt                  *time.Time
	CreatedAt                   time.Time
	UpdatedAt                   time.Time
}

type CreateRequest struct {
	DivisionID               *string `json:"divisionId,omitempty"`
	UnitID                      *string `json:"unitId,omitempty"`
	OwnerLabel                  *string `json:"ownerLabel,omitempty"`
	StandardType                string  `json:"standardType"`
	Model                       string  `json:"model"`
	Identifier                  string  `json:"identifier"`
	SerialNumber                *string `json:"serialNumber,omitempty"`
	MetrologicalCharacteristics string  `json:"metrologicalCharacteristics"`
	Comment                     *string `json:"comment,omitempty"`
	DocumentURL                 *string `json:"documentUrl,omitempty"`
}

type UpdateRequest struct {
	DivisionID               *string `json:"divisionId,omitempty"`
	UnitID                      *string `json:"unitId,omitempty"`
	OwnerLabel                  *string `json:"ownerLabel,omitempty"`
	StandardType                *string `json:"standardType,omitempty"`
	Model                       *string `json:"model,omitempty"`
	Identifier                  *string `json:"identifier,omitempty"`
	SerialNumber                *string `json:"serialNumber,omitempty"`
	MetrologicalCharacteristics *string `json:"metrologicalCharacteristics,omitempty"`
	Comment                     *string `json:"comment,omitempty"`
	DocumentURL                 *string `json:"documentUrl,omitempty"`
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

type OwnershipScopeResponse struct {
	ScopeType string  `json:"scopeType"`
	ScopeID   *string `json:"scopeId,omitempty"`
	Label     string  `json:"label"`
}

type StandardResponse struct {
	ID                          string                 `json:"id"`
	OrganizationID              string                 `json:"organizationId"`
	OwnershipScope              OwnershipScopeResponse `json:"ownershipScope"`
	StandardType                string                 `json:"standardType"`
	Model                       string                 `json:"model"`
	Identifier                  string                 `json:"identifier"`
	SerialNumber                *string                `json:"serialNumber,omitempty"`
	MetrologicalCharacteristics string                 `json:"metrologicalCharacteristics"`
	Status                      string                 `json:"status"`
	Comment                     *string                `json:"comment,omitempty"`
	DocumentURL                 *string                `json:"documentUrl,omitempty"`
	LinkedMeasuringInstruments  int                    `json:"linkedMeasuringInstruments"`
	JournalCount                int                    `json:"journalCount"`
	NextDueDate                 *string                `json:"nextDueDate,omitempty"`
	LatestJournal               *JournalResponse       `json:"latestJournal,omitempty"`
	ArchivedAt                  *string                `json:"archivedAt,omitempty"`
	CreatedAt                   string                 `json:"createdAt"`
	UpdatedAt                   string                 `json:"updatedAt"`
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
