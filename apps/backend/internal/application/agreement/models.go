package agreement

import (
    "time"

    "github.com/google/uuid"
)

type Agreement struct {
    ID                 uuid.UUID
    Source             string
    FactoryID          uuid.UUID
    OrganizationID     uuid.UUID
    Number             int64
    StartDate          time.Time
    EndDate            time.Time
    SubjectOfAgreement string
    ScheduleID         uuid.UUID
    CreatedAt          time.Time
    UpdatedAt          time.Time
}

type CreateRequest struct {
    Source             string `json:"source" validate:"required"`
    FactoryID          string `json:"factoryId" validate:"required"`
    OrganizationID     string `json:"organizationId" validate:"required"`
    Number             int64  `json:"number" validate:"required"`
    StartDate          string `json:"startDate" validate:"required"` // формат "2006-01-02"
    EndDate            string `json:"endDate" validate:"required"`   // формат "2006-01-02"
    SubjectOfAgreement string `json:"subjectOfAgreement" validate:"required"`
    ScheduleID         string `json:"scheduleId" validate:"required"`
}

type UpdateRequest struct {
    Source             *string `json:"source,omitempty"`
    FactoryID          *string `json:"factoryId,omitempty"`
    OrganizationID     *string `json:"organizationId,omitempty"`
    Number             *int64  `json:"number,omitempty"`
    StartDate          *string `json:"startDate,omitempty"`
    EndDate            *string `json:"endDate,omitempty"`
    SubjectOfAgreement *string `json:"subjectOfAgreement,omitempty"`
    ScheduleID         *string `json:"scheduleId,omitempty"`
}

type AgreementResponse struct {
    ID                 string `json:"id"`
    Source             string `json:"source"`
    FactoryID          string `json:"factoryId"`
    OrganizationID     string `json:"organizationId"`
    Number             int64  `json:"number"`
    StartDate          string `json:"startDate"`
    EndDate            string `json:"endDate"`
    SubjectOfAgreement string `json:"subjectOfAgreement"`
    ScheduleID         string `json:"scheduleId"`
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