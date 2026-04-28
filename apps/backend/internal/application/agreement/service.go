package agreement

import (
	"context"
	"strings"
	"time"

	"backend/internal/auth/bootstrap"

	"github.com/google/uuid"
)

type AgreementService interface {
	Create(ctx context.Context, token string, req CreateRequest) (*AgreementResponse, error)
	List(ctx context.Context, token string) ([]AgreementResponse, error)
	GetByID(ctx context.Context, token string, id string) (*AgreementResponse, error)
	Update(ctx context.Context, token string, id string, req UpdateRequest) (*AgreementResponse, error)
	ListActiveContractors(ctx context.Context, token string) ([]ContractorOptionResponse, error)
	ResolveRouting(ctx context.Context, token string, req RoutingResolveRequest) (*RoutingResolveResponse, error)
}

type agreementService struct {
	repository  AgreementRepository
	authService bootstrap.Service
}

func NewService(repository AgreementRepository, authService bootstrap.Service) AgreementService {
	return &agreementService{
		repository:  repository,
		authService: authService,
	}
}

func (s *agreementService) Create(ctx context.Context, token string, req CreateRequest) (*AgreementResponse, error) {
	session, err := s.requireCustomerContractsManager(ctx, token)
	if err != nil {
		return nil, err
	}

	model, err := s.buildCreateModel(ctx, session, req)
	if err != nil {
		return nil, err
	}

	agreement, err := s.repository.Create(ctx, model)
	if err != nil {
		return nil, err
	}

	return toResponse(agreement), nil
}

func (s *agreementService) List(ctx context.Context, token string) ([]AgreementResponse, error) {
	session, err := s.authService.GetSession(ctx, strings.TrimSpace(token))
	if err != nil {
		return nil, mapAuthError(err)
	}
	if err := requireActiveLaunch(session); err != nil {
		return nil, err
	}

	var items []Agreement
	switch session.Organization.RoleTitle {
	case "customer":
		if !canManageContracts(session) {
			return nil, ErrForbidden
		}
		items, err = s.repository.ListByCustomerOrganization(ctx, uuid.MustParse(session.Organization.ID))
	case "contractor":
		items, err = s.repository.ListByContractorOrganization(ctx, uuid.MustParse(session.Organization.ID))
	default:
		return nil, ErrForbidden
	}
	if err != nil {
		return nil, err
	}

	result := make([]AgreementResponse, 0, len(items))
	for index := range items {
		result = append(result, *toResponse(&items[index]))
	}
	return result, nil
}

func (s *agreementService) GetByID(ctx context.Context, token string, id string) (*AgreementResponse, error) {
	session, err := s.authService.GetSession(ctx, strings.TrimSpace(token))
	if err != nil {
		return nil, mapAuthError(err)
	}
	if err := requireActiveLaunch(session); err != nil {
		return nil, err
	}

	agreementID, err := uuid.Parse(strings.TrimSpace(id))
	if err != nil {
		return nil, ErrInvalidID
	}

	agreement, err := s.repository.GetByID(ctx, agreementID)
	if err != nil {
		return nil, err
	}
	if !canViewAgreement(session, agreement) {
		return nil, ErrForbidden
	}

	return toResponse(agreement), nil
}

func (s *agreementService) Update(ctx context.Context, token string, id string, req UpdateRequest) (*AgreementResponse, error) {
	session, err := s.requireCustomerContractsManager(ctx, token)
	if err != nil {
		return nil, err
	}

	agreementID, err := uuid.Parse(strings.TrimSpace(id))
	if err != nil {
		return nil, ErrInvalidID
	}

	current, err := s.repository.GetByID(ctx, agreementID)
	if err != nil {
		return nil, err
	}
	if current.CustomerOrganizationID.String() != session.Organization.ID {
		return nil, ErrForbidden
	}

	updated, err := s.buildUpdatedModel(ctx, session, current, req)
	if err != nil {
		return nil, err
	}

	agreement, err := s.repository.Update(ctx, *updated)
	if err != nil {
		return nil, err
	}

	return toResponse(agreement), nil
}

func (s *agreementService) ListActiveContractors(ctx context.Context, token string) ([]ContractorOptionResponse, error) {
	if _, err := s.requireCustomerContractsManager(ctx, token); err != nil {
		return nil, err
	}

	items, err := s.repository.ListActiveContractors(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]ContractorOptionResponse, 0, len(items))
	for _, item := range items {
		result = append(result, ContractorOptionResponse{
			ID:        item.ID.String(),
			Name:      item.Name,
			ShortName: item.ShortName,
		})
	}
	return result, nil
}

func (s *agreementService) ResolveRouting(ctx context.Context, token string, req RoutingResolveRequest) (*RoutingResolveResponse, error) {
	session, err := s.requireCustomerContractsManager(ctx, token)
	if err != nil {
		return nil, err
	}

	req.UnitID = strings.TrimSpace(req.UnitID)
	req.WorkType = normalizeWorkType(req.WorkType)
	req.EquipmentType = strings.TrimSpace(req.EquipmentType)
	req.Region = strings.TrimSpace(req.Region)

	if req.UnitID == "" {
		return nil, ErrRoutingUnitRequired
	}
	if req.WorkType == "" {
		return nil, ErrRoutingWorkTypeRequired
	}
	if req.EquipmentType == "" {
		return nil, ErrRoutingEquipmentTypeRequired
	}
	if req.Region == "" {
		return nil, ErrRoutingRegionRequired
	}

	unit, err := resolveUnitFromSession(session, req.UnitID)
	if err != nil {
		return nil, err
	}

	items, err := s.repository.ListByCustomerOrganization(ctx, uuid.MustParse(session.Organization.ID))
	if err != nil {
		return nil, err
	}

	response := &RoutingResolveResponse{
		UnitID:        req.UnitID,
		WorkType:      req.WorkType,
		EquipmentType: req.EquipmentType,
		Region:        req.Region,
		Matches:       []RoutingResolutionItem{},
	}

	now := time.Now().UTC()
	for index := range items {
		item := &items[index]
		if !isRoutingEligible(item, req, unit.SubdivisionID, now) {
			continue
		}

		response.Matches = append(response.Matches, RoutingResolutionItem{
			Contract: *toResponse(item),
			Contractor: ContractorOptionResponse{
				ID:        item.ContractorOrganizationID.String(),
				Name:      item.ContractorOrganizationName,
				ShortName: nil,
			},
		})
	}

	return response, nil
}

func (s *agreementService) buildCreateModel(ctx context.Context, session *bootstrap.SessionSummaryResponse, req CreateRequest) (Agreement, error) {
	req.ContractorOrganizationID = strings.TrimSpace(req.ContractorOrganizationID)
	req.ContractNumber = strings.TrimSpace(req.ContractNumber)
	req.ContractStatus = normalizeContractStatus(req.ContractStatus)
	req.StartDate = strings.TrimSpace(req.StartDate)
	req.EndDate = strings.TrimSpace(req.EndDate)
	req.WorkType = normalizeWorkType(req.WorkType)
	req.EquipmentType = strings.TrimSpace(req.EquipmentType)
	req.Region = strings.TrimSpace(req.Region)
	req.Source = normalizeOptional(req.Source)
	req.SubjectOfAgreement = normalizeOptional(req.SubjectOfAgreement)
	req.LocationScopeLabel = normalizeOptional(req.LocationScopeLabel)

	if req.ContractorOrganizationID == "" {
		return Agreement{}, ErrContractorOrganizationRequired
	}
	if req.ContractNumber == "" {
		return Agreement{}, ErrContractNumberRequired
	}
	if req.ContractStatus == "" {
		return Agreement{}, ErrContractStatusRequired
	}
	if !isValidContractStatus(req.ContractStatus) {
		return Agreement{}, ErrContractStatusInvalid
	}
	if req.StartDate == "" || req.EndDate == "" {
		return Agreement{}, ErrInvalidDate
	}
	if req.WorkType == "" {
		return Agreement{}, ErrWorkTypeRequired
	}
	if !isValidWorkType(req.WorkType) {
		return Agreement{}, ErrWorkTypeInvalid
	}
	if req.EquipmentType == "" {
		return Agreement{}, ErrEquipmentTypeRequired
	}
	if req.Region == "" {
		return Agreement{}, ErrRegionRequired
	}

	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		return Agreement{}, ErrInvalidDate
	}
	endDate, err := time.Parse("2006-01-02", req.EndDate)
	if err != nil {
		return Agreement{}, ErrInvalidDate
	}
	if endDate.Before(startDate) {
		return Agreement{}, ErrInvalidDateRange
	}

	contractorID, err := uuid.Parse(req.ContractorOrganizationID)
	if err != nil {
		return Agreement{}, ErrInvalidUUID
	}
	if _, err := s.repository.GetActiveContractorByID(ctx, contractorID); err != nil {
		return Agreement{}, err
	}

	subdivisionID, unitID, label, err := validateScopeForSession(session, req.SubdivisionID, req.UnitID, req.LocationScopeLabel)
	if err != nil {
		return Agreement{}, err
	}

	return Agreement{
		ID:                       uuid.New(),
		CustomerOrganizationID:   uuid.MustParse(session.Organization.ID),
		ContractorOrganizationID: contractorID,
		ContractNumber:           req.ContractNumber,
		ContractStatus:           req.ContractStatus,
		StartDate:                startDate,
		EndDate:                  endDate,
		WorkType:                 req.WorkType,
		EquipmentType:            req.EquipmentType,
		Region:                   req.Region,
		SubdivisionID:            subdivisionID,
		UnitID:                   unitID,
		LocationScopeLabel:       label,
		Source:                   req.Source,
		SubjectOfAgreement:       req.SubjectOfAgreement,
	}, nil
}

func (s *agreementService) buildUpdatedModel(ctx context.Context, session *bootstrap.SessionSummaryResponse, current *Agreement, req UpdateRequest) (*Agreement, error) {
	updated := *current

	if req.ContractorOrganizationID != nil {
		value := strings.TrimSpace(*req.ContractorOrganizationID)
		if value == "" {
			return nil, ErrContractorOrganizationRequired
		}
		contractorID, err := uuid.Parse(value)
		if err != nil {
			return nil, ErrInvalidUUID
		}
		if _, err := s.repository.GetActiveContractorByID(ctx, contractorID); err != nil {
			return nil, err
		}
		updated.ContractorOrganizationID = contractorID
	}
	if req.ContractNumber != nil {
		value := strings.TrimSpace(*req.ContractNumber)
		if value == "" {
			return nil, ErrContractNumberRequired
		}
		updated.ContractNumber = value
	}
	if req.ContractStatus != nil {
		value := normalizeContractStatus(*req.ContractStatus)
		if value == "" {
			return nil, ErrContractStatusRequired
		}
		if !isValidContractStatus(value) {
			return nil, ErrContractStatusInvalid
		}
		updated.ContractStatus = value
	}
	if req.StartDate != nil {
		parsed, err := time.Parse("2006-01-02", strings.TrimSpace(*req.StartDate))
		if err != nil {
			return nil, ErrInvalidDate
		}
		updated.StartDate = parsed
	}
	if req.EndDate != nil {
		parsed, err := time.Parse("2006-01-02", strings.TrimSpace(*req.EndDate))
		if err != nil {
			return nil, ErrInvalidDate
		}
		updated.EndDate = parsed
	}
	if updated.EndDate.Before(updated.StartDate) {
		return nil, ErrInvalidDateRange
	}
	if req.WorkType != nil {
		value := normalizeWorkType(*req.WorkType)
		if value == "" {
			return nil, ErrWorkTypeRequired
		}
		if !isValidWorkType(value) {
			return nil, ErrWorkTypeInvalid
		}
		updated.WorkType = value
	}
	if req.EquipmentType != nil {
		value := strings.TrimSpace(*req.EquipmentType)
		if value == "" {
			return nil, ErrEquipmentTypeRequired
		}
		updated.EquipmentType = value
	}
	if req.Region != nil {
		value := strings.TrimSpace(*req.Region)
		if value == "" {
			return nil, ErrRegionRequired
		}
		updated.Region = value
	}

	if req.Source != nil {
		updated.Source = normalizeOptional(req.Source)
	}
	if req.SubjectOfAgreement != nil {
		updated.SubjectOfAgreement = normalizeOptional(req.SubjectOfAgreement)
	}

	if req.SubdivisionID != nil || req.UnitID != nil || req.LocationScopeLabel != nil {
		subdivisionID, unitID, label, err := validateScopeForSession(
			session,
			req.SubdivisionID,
			req.UnitID,
			normalizeOptional(req.LocationScopeLabel),
		)
		if err != nil {
			return nil, err
		}
		updated.SubdivisionID = subdivisionID
		updated.UnitID = unitID
		updated.LocationScopeLabel = label
	}

	return &updated, nil
}

func requireActiveLaunch(session *bootstrap.SessionSummaryResponse) error {
	if session.RequiresLaunchWizard || session.Organization.LaunchState != "active" {
		return ErrForbidden
	}
	return nil
}

func (s *agreementService) requireCustomerContractsManager(ctx context.Context, token string) (*bootstrap.SessionSummaryResponse, error) {
	session, err := s.authService.GetSession(ctx, strings.TrimSpace(token))
	if err != nil {
		return nil, mapAuthError(err)
	}
	if err := requireActiveLaunch(session); err != nil {
		return nil, err
	}
	if session.Organization.RoleTitle != "customer" {
		return nil, ErrForbidden
	}
	if !canManageContracts(session) {
		return nil, ErrForbidden
	}
	return session, nil
}

func canManageContracts(session *bootstrap.SessionSummaryResponse) bool {
	if session == nil || session.Grant == nil {
		return false
	}
	return session.Organization.LaunchState == "active" &&
		session.Organization.RoleTitle == "customer" &&
		session.Grant.RoleTemplate == "organization_admin" &&
		session.Workspace.ScopeType == "organization"
}

func canViewAgreement(session *bootstrap.SessionSummaryResponse, agreement *Agreement) bool {
	if session == nil {
		return false
	}
	if session.Organization.RoleTitle == "customer" {
		return canManageContracts(session) && agreement.CustomerOrganizationID.String() == session.Organization.ID
	}
	if session.Organization.RoleTitle == "contractor" {
		return agreement.ContractorOrganizationID.String() == session.Organization.ID
	}
	return false
}

func toResponse(a *Agreement) *AgreementResponse {
	scopeType := "organization"
	scopeLabel := a.CustomerOrganizationName
	var scopeID *string
	if a.SubdivisionID != nil {
		scopeType = "subdivision"
		value := a.SubdivisionID.String()
		scopeID = &value
		if a.SubdivisionName != nil {
			scopeLabel = *a.SubdivisionName
		}
	}
	if a.UnitID != nil {
		scopeType = "unit"
		value := a.UnitID.String()
		scopeID = &value
		if a.UnitName != nil {
			scopeLabel = *a.UnitName
		}
	}
	if a.LocationScopeLabel != nil && strings.TrimSpace(*a.LocationScopeLabel) != "" {
		scopeLabel = *a.LocationScopeLabel
	}

	return &AgreementResponse{
		ID:                         a.ID.String(),
		CustomerOrganizationID:     a.CustomerOrganizationID.String(),
		CustomerOrganizationName:   a.CustomerOrganizationName,
		ContractorOrganizationID:   a.ContractorOrganizationID.String(),
		ContractorOrganizationName: a.ContractorOrganizationName,
		ContractNumber:             a.ContractNumber,
		ContractStatus:             a.ContractStatus,
		StartDate:                  a.StartDate.Format("2006-01-02"),
		EndDate:                    a.EndDate.Format("2006-01-02"),
		WorkType:                   a.WorkType,
		EquipmentType:              a.EquipmentType,
		Region:                     a.Region,
		LocationScope: AgreementLocationScopeResponse{
			ScopeType: scopeType,
			ScopeID:   scopeID,
			Label:     scopeLabel,
		},
		Source:             a.Source,
		SubjectOfAgreement: a.SubjectOfAgreement,
		RoutingEligible:    isCurrentlyEligible(a, time.Now().UTC()),
	}
}

func normalizeOptional(value *string) *string {
	if value == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func normalizeContractStatus(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

func normalizeWorkType(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

func isValidContractStatus(value string) bool {
	switch value {
	case ContractStatusInactive, ContractStatusActive, ContractStatusExpired:
		return true
	default:
		return false
	}
}

func isValidWorkType(value string) bool {
	switch value {
	case WorkTypeRepair, WorkTypeMaintenance, WorkTypeVerification:
		return true
	default:
		return false
	}
}

func validateScopeForSession(session *bootstrap.SessionSummaryResponse, subdivisionValue *string, unitValue *string, label *string) (*uuid.UUID, *uuid.UUID, *string, error) {
	if subdivisionValue != nil && unitValue != nil && strings.TrimSpace(*subdivisionValue) != "" && strings.TrimSpace(*unitValue) != "" {
		return nil, nil, nil, ErrScopeConflict
	}

	if unitValue != nil {
		unitID := strings.TrimSpace(*unitValue)
		if unitID == "" {
			return nil, nil, nil, ErrScopeInvalid
		}
		for _, unit := range session.Units {
			if unit.ID == unitID {
				parsed := uuid.MustParse(unitID)
				if label == nil {
					resolved := unit.Name
					label = &resolved
				}
				return nil, &parsed, label, nil
			}
		}
		return nil, nil, nil, ErrScopeInvalid
	}

	if subdivisionValue != nil {
		subdivisionID := strings.TrimSpace(*subdivisionValue)
		if subdivisionID == "" {
			return nil, nil, nil, ErrScopeInvalid
		}
		for _, subdivision := range session.Subdivisions {
			if subdivision.ID == subdivisionID {
				parsed := uuid.MustParse(subdivisionID)
				if label == nil {
					resolved := subdivision.Name
					label = &resolved
				}
				return &parsed, nil, label, nil
			}
		}
		return nil, nil, nil, ErrScopeInvalid
	}

	if label == nil {
		resolved := session.Organization.Name
		label = &resolved
	}
	return nil, nil, label, nil
}

func resolveUnitFromSession(session *bootstrap.SessionSummaryResponse, unitID string) (*bootstrap.UnitResponse, error) {
	for _, unit := range session.Units {
		if unit.ID == unitID {
			return &unit, nil
		}
	}
	return nil, ErrRoutingUnitInvalid
}

func isRoutingEligible(agreement *Agreement, req RoutingResolveRequest, unitSubdivisionID *string, now time.Time) bool {
	if !isCurrentlyEligible(agreement, now) {
		return false
	}
	if agreement.WorkType != req.WorkType {
		return false
	}
	if !strings.EqualFold(strings.TrimSpace(agreement.EquipmentType), strings.TrimSpace(req.EquipmentType)) {
		return false
	}
	if !strings.EqualFold(strings.TrimSpace(agreement.Region), strings.TrimSpace(req.Region)) {
		return false
	}
	if agreement.UnitID != nil {
		return agreement.UnitID.String() == req.UnitID
	}
	if agreement.SubdivisionID != nil {
		return unitSubdivisionID != nil && agreement.SubdivisionID.String() == *unitSubdivisionID
	}
	return true
}

func isCurrentlyEligible(agreement *Agreement, now time.Time) bool {
	if agreement.ContractStatus != ContractStatusActive {
		return false
	}
	date := now.Format("2006-01-02")
	current, _ := time.Parse("2006-01-02", date)
	start := time.Date(agreement.StartDate.Year(), agreement.StartDate.Month(), agreement.StartDate.Day(), 0, 0, 0, 0, time.UTC)
	end := time.Date(agreement.EndDate.Year(), agreement.EndDate.Month(), agreement.EndDate.Day(), 0, 0, 0, 0, time.UTC)
	return !current.Before(start) && !current.After(end)
}

func mapAuthError(err error) error {
	if err == nil {
		return nil
	}
	return ErrUnauthorized
}
