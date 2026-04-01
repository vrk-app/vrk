package organization

import (
	"time"

	"github.com/google/uuid"
)

type Organization struct {
    ID                    uuid.UUID
    PropertyTypeID        uuid.UUID
    Name                  string
    Inn                   string
    Kpp                   string
    Address               string
    RoleID                uuid.UUID
    DirectorID            uuid.UUID
    ParentID              *uuid.UUID
    ShortName             *string
    PowerOfAttorneyNumber *string
    PoaIssueDate          *time.Time
    PoaExpirationDate     *time.Time
    Logo                  *string
    CreatedAt             time.Time
    UpdatedAt             time.Time
}

type CreateRequest struct {
    PropertyTypeID          string  `json:"propertyTypeId" validate:"required"`
    Name                    string  `json:"name" validate:"required,max=200"`
    ShortName               *string `json:"shortName,omitempty"`
    INN                     string  `json:"inn" validate:"required,len=10"`
    KPP                     string  `json:"kpp" validate:"required,len=9"`
    Address                 string  `json:"address" validate:"required,max=100"`
    ParentID                *string `json:"parentId,omitempty"`
    RoleID                  string  `json:"roleId" validate:"required"`
    DirectorID              string  `json:"directorId" validate:"required"`
    PowerOfAttorneyNumber   *string `json:"powerOfAttorneyNumber,omitempty"`
    POAIssueDate            *string `json :"poaIssueDate,omitempty"`
    POAExpirationDate       *string `json:"poaExpirationDate,omitempty"`
    Logo                    *string `json:"logo,omitempty"`
}

type UpdateRequest struct {
    PropertyTypeID          *string `json:"propertyTypeId,omitempty"`
    RoleID                  *string `json:"roleId,omitempty"`
    Name                    *string `json:"name,omitempty"`
    ShortName               *string `json:"shortName,omitempty"`
    INN                     *string `json:"inn,omitempty"`
    KPP                     *string `json:"kpp,omitempty"`
    Address                 *string `json:"address,omitempty"`
    ParentID                *string `json:"parentId,omitempty"`
    DirectorID              *string `json:"directorId,omitempty"`
    PowerOfAttorneyNumber   *string `json:"powerOfAttorneyNumber,omitempty"`
    POAIssueDate            *string `json:"poaIssueDate,omitempty"`
    POAExpirationDate       *string `json:"poaExpirationDate,omitempty"`
    Logo                    *string `json:"logo,omitempty"`
}

type OrganizationResponse struct {
    ID                      string  `json:"id"`
    PropertyTypeID          string  `json:"propertyTypeId"`
    Name                    string  `json:"name"`
    ShortName               *string `json:"shortName,omitempty"`
    INN                     string  `json:"inn"`
    KPP                     string  `json:"kpp"`
    Address                 string  `json:"address"`
    ParentID                *string `json:"parentId,omitempty"`
    RoleID                  string  `json:"roleId"`
    DirectorID              string  `json:"directorId"`
    PowerOfAttorneyNumber   *string `json:"powerOfAttorneyNumber,omitempty"`
    POAIssueDate            *string `json:"poaIssueDate,omitempty"`
    POAExpirationDate       *string `json:"poaExpirationDate,omitempty"`
    Logo                    *string `json:"logo,omitempty"`
    CreatedAt               string  `json:"createdAt"`
    UpdatedAt               string  `json:"updatedAt"`
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