package agreement

import (
	"time"

	"github.com/google/uuid"
)

const (
	ContractStatusInactive = "inactive"
	ContractStatusActive   = "active"
	ContractStatusExpired  = "expired"

	WorkTypeRepair       = "repair"
	WorkTypeMaintenance  = "maintenance"
	WorkTypeVerification = "verification"
)

type Agreement struct {
	ID                         uuid.UUID
	CustomerOrganizationID     uuid.UUID
	CustomerOrganizationName   string
	ContractorOrganizationID   uuid.UUID
	ContractorOrganizationName string
	ContractNumber             string
	ContractStatus             string
	StartDate                  time.Time
	EndDate                    time.Time
	WorkType                   string
	EquipmentType              string
	Region                     string
	DivisionID                 *uuid.UUID
	DivisionName               *string
	UnitID                     *uuid.UUID
	UnitName                   *string
	LocationScopeLabel         *string
	Source                     *string
	SubjectOfAgreement         *string
	CreatedAt                  time.Time
	UpdatedAt                  time.Time
}

type ContractorOption struct {
	ID        uuid.UUID
	Name      string
	ShortName *string
}

type CreateRequest struct {
	ContractorOrganizationID string  `json:"contractorOrganizationId"`
	ContractNumber           string  `json:"contractNumber"`
	ContractStatus           string  `json:"contractStatus"`
	StartDate                string  `json:"startDate"`
	EndDate                  string  `json:"endDate"`
	WorkType                 string  `json:"workType"`
	EquipmentType            string  `json:"equipmentType"`
	Region                   string  `json:"region"`
	DivisionID               *string `json:"divisionId,omitempty"`
	UnitID                   *string `json:"unitId,omitempty"`
	LocationScopeLabel       *string `json:"locationScopeLabel,omitempty"`
	Source                   *string `json:"source,omitempty"`
	SubjectOfAgreement       *string `json:"subjectOfAgreement,omitempty"`
}

type UpdateRequest struct {
	ContractorOrganizationID *string `json:"contractorOrganizationId,omitempty"`
	ContractNumber           *string `json:"contractNumber,omitempty"`
	ContractStatus           *string `json:"contractStatus,omitempty"`
	StartDate                *string `json:"startDate,omitempty"`
	EndDate                  *string `json:"endDate,omitempty"`
	WorkType                 *string `json:"workType,omitempty"`
	EquipmentType            *string `json:"equipmentType,omitempty"`
	Region                   *string `json:"region,omitempty"`
	DivisionID               *string `json:"divisionId,omitempty"`
	UnitID                   *string `json:"unitId,omitempty"`
	LocationScopeLabel       *string `json:"locationScopeLabel,omitempty"`
	Source                   *string `json:"source,omitempty"`
	SubjectOfAgreement       *string `json:"subjectOfAgreement,omitempty"`
}

type AgreementLocationScopeResponse struct {
	ScopeType string  `json:"scopeType"`
	ScopeID   *string `json:"scopeId,omitempty"`
	Label     string  `json:"label"`
}

type AgreementResponse struct {
	ID                         string                         `json:"id"`
	CustomerOrganizationID     string                         `json:"customerOrganizationId"`
	CustomerOrganizationName   string                         `json:"customerOrganizationName"`
	ContractorOrganizationID   string                         `json:"contractorOrganizationId"`
	ContractorOrganizationName string                         `json:"contractorOrganizationName"`
	ContractNumber             string                         `json:"contractNumber"`
	ContractStatus             string                         `json:"contractStatus"`
	StartDate                  string                         `json:"startDate"`
	EndDate                    string                         `json:"endDate"`
	WorkType                   string                         `json:"workType"`
	EquipmentType              string                         `json:"equipmentType"`
	Region                     string                         `json:"region"`
	LocationScope              AgreementLocationScopeResponse `json:"locationScope"`
	Source                     *string                        `json:"source,omitempty"`
	SubjectOfAgreement         *string                        `json:"subjectOfAgreement,omitempty"`
	RoutingEligible            bool                           `json:"routingEligible"`
}

type ContractorOptionResponse struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	ShortName *string `json:"shortName,omitempty"`
}

type RoutingResolveRequest struct {
	UnitID        string `json:"unitId"`
	WorkType      string `json:"workType"`
	EquipmentType string `json:"equipmentType"`
	Region        string `json:"region"`
}

type RoutingResolutionItem struct {
	Contract   AgreementResponse        `json:"contract"`
	Contractor ContractorOptionResponse `json:"contractor"`
}

type RoutingResolveResponse struct {
	UnitID        string                  `json:"unitId"`
	WorkType      string                  `json:"workType"`
	EquipmentType string                  `json:"equipmentType"`
	Region        string                  `json:"region"`
	Matches       []RoutingResolutionItem `json:"matches"`
}

type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}
