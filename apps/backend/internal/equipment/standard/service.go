package standard

import (
	"context"
	"strings"
	"time"

	"backend/internal/auth/bootstrap"
	"backend/internal/equipment/metrologyjournal"
	"backend/internal/equipment/registryaccess"

	"github.com/google/uuid"
)

type StandardService interface {
	Create(ctx context.Context, token string, req CreateRequest) (*StandardResponse, error)
	List(ctx context.Context, token string, includeArchived bool, limit, offset int32) ([]*StandardResponse, int64, error)
	GetByID(ctx context.Context, token string, id string) (*StandardResponse, error)
	Update(ctx context.Context, token string, id string, req UpdateRequest) (*StandardResponse, error)
	Archive(ctx context.Context, token string, id string) (*StandardResponse, error)
	ListJournals(ctx context.Context, token string, id string) ([]*JournalResponse, error)
	CreateJournal(ctx context.Context, token string, id string, req CreateJournalRequest) (*JournalResponse, error)
}

type standardService struct {
	repository        StandardRepository
	journalRepository metrologyjournal.Repository
	authService       bootstrap.Service
}

func NewService(
	repository StandardRepository,
	journalRepository metrologyjournal.Repository,
	authService bootstrap.Service,
) StandardService {
	return &standardService{
		repository:        repository,
		journalRepository: journalRepository,
		authService:       authService,
	}
}

func (s *standardService) Create(ctx context.Context, token string, req CreateRequest) (*StandardResponse, error) {
	session, err := registryaccess.RequireRegistryManager(ctx, s.authService, token)
	if err != nil {
		return nil, mapAccessError(err)
	}

	item, err := s.buildCreateModel(session, req)
	if err != nil {
		return nil, err
	}

	created, err := s.repository.Create(ctx, item)
	if err != nil {
		return nil, err
	}

	return toResponse(session, created, metrologyjournal.DeriveState(nil, created.Status)), nil
}

func (s *standardService) List(ctx context.Context, token string, includeArchived bool, limit, offset int32) ([]*StandardResponse, int64, error) {
	session, err := registryaccess.RequireCustomerSession(ctx, s.authService, token)
	if err != nil {
		return nil, 0, mapAccessError(err)
	}

	items, err := s.repository.ListByOrganization(ctx, uuid.MustParse(session.Organization.ID), includeArchived)
	if err != nil {
		return nil, 0, err
	}
	journalsByStandard, err := s.journalRepository.ListByOrganization(
		ctx,
		uuid.MustParse(session.Organization.ID),
		metrologyjournal.SubjectTypeStandard,
	)
	if err != nil {
		return nil, 0, err
	}

	filtered := make([]Standard, 0, len(items))
	for _, item := range items {
		var divisionID *uuid.UUID
		var unitID *uuid.UUID
		if item.DivisionID != nil {
			value := uuid.MustParse(*item.DivisionID)
			divisionID = &value
		}
		if item.UnitID != nil {
			value := uuid.MustParse(*item.UnitID)
			unitID = &value
		}
		if !registryaccess.CanSeeStandard(session, divisionID, unitID) {
			continue
		}
		filtered = append(filtered, item)
	}

	paged := paginate(filtered, limit, offset)
	result := make([]*StandardResponse, 0, len(paged))
	for index := range paged {
		derived := metrologyjournal.DeriveState(journalsByStandard[paged[index].ID], paged[index].Status)
		result = append(result, toResponse(session, &paged[index], derived))
	}

	return result, int64(len(filtered)), nil
}

func (s *standardService) GetByID(ctx context.Context, token string, id string) (*StandardResponse, error) {
	session, err := registryaccess.RequireCustomerSession(ctx, s.authService, token)
	if err != nil {
		return nil, mapAccessError(err)
	}

	standardID, err := uuid.Parse(strings.TrimSpace(id))
	if err != nil {
		return nil, ErrInvalidID
	}

	item, err := s.repository.GetByID(ctx, standardID)
	if err != nil {
		return nil, err
	}
	if item.OrganizationID != session.Organization.ID {
		return nil, ErrForbidden
	}
	var divisionID *uuid.UUID
	var unitID *uuid.UUID
	if item.DivisionID != nil {
		value := uuid.MustParse(*item.DivisionID)
		divisionID = &value
	}
	if item.UnitID != nil {
		value := uuid.MustParse(*item.UnitID)
		unitID = &value
	}
	if !registryaccess.CanSeeStandard(session, divisionID, unitID) {
		return nil, ErrForbidden
	}

	journals, err := s.journalRepository.ListBySubject(
		ctx,
		uuid.MustParse(session.Organization.ID),
		metrologyjournal.SubjectTypeStandard,
		standardID,
	)
	if err != nil {
		return nil, err
	}

	return toResponse(session, item, metrologyjournal.DeriveState(journals, item.Status)), nil
}

func (s *standardService) Update(ctx context.Context, token string, id string, req UpdateRequest) (*StandardResponse, error) {
	session, err := registryaccess.RequireRegistryManager(ctx, s.authService, token)
	if err != nil {
		return nil, mapAccessError(err)
	}

	standardID, err := uuid.Parse(strings.TrimSpace(id))
	if err != nil {
		return nil, ErrInvalidID
	}

	current, err := s.repository.GetByID(ctx, standardID)
	if err != nil {
		return nil, err
	}
	if current.OrganizationID != session.Organization.ID {
		return nil, ErrForbidden
	}
	if current.ArchivedAt != nil {
		return nil, ErrArchivedTarget
	}

	updated, err := s.buildUpdatedModel(session, current, req)
	if err != nil {
		return nil, err
	}

	item, err := s.repository.Update(ctx, *updated)
	if err != nil {
		return nil, err
	}

	journals, err := s.journalRepository.ListBySubject(
		ctx,
		uuid.MustParse(session.Organization.ID),
		metrologyjournal.SubjectTypeStandard,
		standardID,
	)
	if err != nil {
		return nil, err
	}

	return toResponse(session, item, metrologyjournal.DeriveState(journals, item.Status)), nil
}

func (s *standardService) Archive(ctx context.Context, token string, id string) (*StandardResponse, error) {
	session, err := registryaccess.RequireRegistryManager(ctx, s.authService, token)
	if err != nil {
		return nil, mapAccessError(err)
	}

	standardID, current, err := s.visibleStandard(ctx, session, id)
	if err != nil {
		return nil, err
	}
	if current.ArchivedAt != nil {
		return nil, ErrAlreadyArchived
	}

	item, err := s.repository.Archive(ctx, standardID)
	if err != nil {
		return nil, err
	}

	journals, err := s.journalRepository.ListBySubject(
		ctx,
		uuid.MustParse(session.Organization.ID),
		metrologyjournal.SubjectTypeStandard,
		standardID,
	)
	if err != nil {
		return nil, err
	}

	return toResponse(session, item, metrologyjournal.DeriveState(journals, item.Status)), nil
}

func (s *standardService) ListJournals(ctx context.Context, token string, id string) ([]*JournalResponse, error) {
	session, err := registryaccess.RequireCustomerSession(ctx, s.authService, token)
	if err != nil {
		return nil, mapAccessError(err)
	}

	standardID, _, err := s.visibleStandard(ctx, session, id)
	if err != nil {
		return nil, err
	}

	journals, err := s.journalRepository.ListBySubject(
		ctx,
		uuid.MustParse(session.Organization.ID),
		metrologyjournal.SubjectTypeStandard,
		standardID,
	)
	if err != nil {
		return nil, err
	}

	result := make([]*JournalResponse, 0, len(journals))
	for _, entry := range journals {
		result = append(result, toJournalResponse(entry))
	}

	return result, nil
}

func (s *standardService) CreateJournal(ctx context.Context, token string, id string, req CreateJournalRequest) (*JournalResponse, error) {
	session, err := registryaccess.RequireRegistryManager(ctx, s.authService, token)
	if err != nil {
		return nil, mapAccessError(err)
	}

	standardID, current, err := s.visibleStandard(ctx, session, id)
	if err != nil {
		return nil, err
	}
	if current.ArchivedAt != nil {
		return nil, ErrArchivedTarget
	}

	entry, err := s.buildJournalEntry(session.Organization.ID, standardID.String(), req)
	if err != nil {
		return nil, err
	}

	created, err := s.journalRepository.Create(ctx, entry)
	if err != nil {
		return nil, err
	}

	journals, err := s.journalRepository.ListBySubject(
		ctx,
		uuid.MustParse(session.Organization.ID),
		metrologyjournal.SubjectTypeStandard,
		standardID,
	)
	if err != nil {
		return nil, err
	}

	derived := metrologyjournal.DeriveState(journals, current.Status)
	current.Status = derived.Status
	if _, err := s.repository.Update(ctx, *current); err != nil {
		return nil, err
	}

	return toJournalResponse(*created), nil
}

func (s *standardService) buildCreateModel(session *bootstrap.SessionSummaryResponse, req CreateRequest) (Standard, error) {
	req.StandardType = strings.TrimSpace(req.StandardType)
	req.Model = strings.TrimSpace(req.Model)
	req.Identifier = strings.TrimSpace(req.Identifier)
	req.SerialNumber = normalizeOptional(req.SerialNumber)
	req.MetrologicalCharacteristics = strings.TrimSpace(req.MetrologicalCharacteristics)
	req.Comment = normalizeOptional(req.Comment)
	req.DocumentURL = normalizeOptional(req.DocumentURL)
	req.OwnerLabel = normalizeOptional(req.OwnerLabel)

	if req.StandardType == "" {
		return Standard{}, ErrTypeRequired
	}
	if req.Model == "" {
		return Standard{}, ErrModelRequired
	}
	if req.Identifier == "" {
		return Standard{}, ErrIdentifierRequired
	}
	if req.MetrologicalCharacteristics == "" {
		return Standard{}, ErrMetrologicalCharRequired
	}

	divisionID, unitID, ownerLabel, err := registryaccess.ValidateStandardScope(session, req.DivisionID, req.UnitID, req.OwnerLabel)
	if err != nil {
		return Standard{}, mapScopeError(err)
	}

	item := Standard{
		OrganizationID:              session.Organization.ID,
		OwnerLabel:                  ownerLabel,
		StandardType:                req.StandardType,
		Model:                       req.Model,
		Identifier:                  req.Identifier,
		SerialNumber:                req.SerialNumber,
		MetrologicalCharacteristics: req.MetrologicalCharacteristics,
		Status:                      "inactive",
		Comment:                     req.Comment,
		DocumentURL:                 req.DocumentURL,
	}
	if divisionID != nil {
		value := divisionID.String()
		item.DivisionID = &value
	}
	if unitID != nil {
		value := unitID.String()
		item.UnitID = &value
	}

	return item, nil
}

func (s *standardService) buildUpdatedModel(session *bootstrap.SessionSummaryResponse, current *Standard, req UpdateRequest) (*Standard, error) {
	updated := *current
	if current.ArchivedAt != nil {
		return nil, ErrArchivedTarget
	}

	if req.StandardType != nil {
		value := strings.TrimSpace(*req.StandardType)
		if value == "" {
			return nil, ErrTypeRequired
		}
		updated.StandardType = value
	}
	if req.Model != nil {
		value := strings.TrimSpace(*req.Model)
		if value == "" {
			return nil, ErrModelRequired
		}
		updated.Model = value
	}
	if req.Identifier != nil {
		value := strings.TrimSpace(*req.Identifier)
		if value == "" {
			return nil, ErrIdentifierRequired
		}
		updated.Identifier = value
	}
	if req.SerialNumber != nil {
		updated.SerialNumber = normalizeOptional(req.SerialNumber)
	}
	if req.MetrologicalCharacteristics != nil {
		value := strings.TrimSpace(*req.MetrologicalCharacteristics)
		if value == "" {
			return nil, ErrMetrologicalCharRequired
		}
		updated.MetrologicalCharacteristics = value
	}
	if req.Comment != nil {
		updated.Comment = normalizeOptional(req.Comment)
	}
	if req.DocumentURL != nil {
		updated.DocumentURL = normalizeOptional(req.DocumentURL)
	}

	divisionValue := req.DivisionID
	unitValue := req.UnitID
	ownerLabel := req.OwnerLabel
	if divisionValue == nil && unitValue == nil && ownerLabel == nil {
		divisionValue = updated.DivisionID
		unitValue = updated.UnitID
		ownerLabel = updated.OwnerLabel
	}
	divisionID, unitID, resolvedOwnerLabel, err := registryaccess.ValidateStandardScope(session, divisionValue, unitValue, ownerLabel)
	if err != nil {
		return nil, mapScopeError(err)
	}
	updated.DivisionID = nil
	updated.UnitID = nil
	updated.OwnerLabel = resolvedOwnerLabel
	if divisionID != nil {
		value := divisionID.String()
		updated.DivisionID = &value
	}
	if unitID != nil {
		value := unitID.String()
		updated.UnitID = &value
	}

	return &updated, nil
}

func toResponse(
	session *bootstrap.SessionSummaryResponse,
	item *Standard,
	derived metrologyjournal.DerivedState,
) *StandardResponse {
	scopeType := "organization"
	scopeLabel := registryaccess.ResolveScopeLabel(session, mustUUID(item.DivisionID), mustUUID(item.UnitID), item.OwnerLabel)
	var scopeID *string
	if item.DivisionID != nil {
		scopeType = "division"
		scopeID = item.DivisionID
	}
	if item.UnitID != nil {
		scopeType = "unit"
		scopeID = item.UnitID
	}
	var archivedAt *string
	if item.ArchivedAt != nil {
		value := item.ArchivedAt.Format(time.RFC3339)
		archivedAt = &value
	}

	return &StandardResponse{
		ID:             item.ID,
		OrganizationID: item.OrganizationID,
		OwnershipScope: OwnershipScopeResponse{
			ScopeType: scopeType,
			ScopeID:   scopeID,
			Label:     scopeLabel,
		},
		StandardType:                item.StandardType,
		Model:                       item.Model,
		Identifier:                  item.Identifier,
		SerialNumber:                item.SerialNumber,
		MetrologicalCharacteristics: item.MetrologicalCharacteristics,
		Status:                      derived.Status,
		Comment:                     item.Comment,
		DocumentURL:                 item.DocumentURL,
		LinkedMeasuringInstruments:  item.LinkedMeasuringInstruments,
		JournalCount:                derived.JournalCount,
		NextDueDate:                 derived.NextDueDate,
		LatestJournal: func() *JournalResponse {
			if derived.LatestJournal == nil {
				return nil
			}
			return toJournalResponse(*derived.LatestJournal)
		}(),
		ArchivedAt: archivedAt,
		CreatedAt:  item.CreatedAt.Format(time.RFC3339),
		UpdatedAt:  item.UpdatedAt.Format(time.RFC3339),
	}
}

func paginate(items []Standard, limit, offset int32) []Standard {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}

	start := int(offset)
	if start >= len(items) {
		return []Standard{}
	}
	end := start + int(limit)
	if end > len(items) {
		end = len(items)
	}
	return items[start:end]
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

func mustUUID(value *string) *uuid.UUID {
	if value == nil {
		return nil
	}
	parsed := uuid.MustParse(*value)
	return &parsed
}

func (s *standardService) visibleStandard(
	ctx context.Context,
	session *bootstrap.SessionSummaryResponse,
	id string,
) (uuid.UUID, *Standard, error) {
	standardID, err := uuid.Parse(strings.TrimSpace(id))
	if err != nil {
		return uuid.Nil, nil, ErrInvalidID
	}

	item, err := s.repository.GetByID(ctx, standardID)
	if err != nil {
		return uuid.Nil, nil, err
	}
	if item.OrganizationID != session.Organization.ID {
		return uuid.Nil, nil, ErrForbidden
	}

	var divisionID *uuid.UUID
	var unitID *uuid.UUID
	if item.DivisionID != nil {
		value := uuid.MustParse(*item.DivisionID)
		divisionID = &value
	}
	if item.UnitID != nil {
		value := uuid.MustParse(*item.UnitID)
		unitID = &value
	}
	if !registryaccess.CanSeeStandard(session, divisionID, unitID) {
		return uuid.Nil, nil, ErrForbidden
	}

	return standardID, item, nil
}

func (s *standardService) buildJournalEntry(
	organizationID string,
	subjectID string,
	req CreateJournalRequest,
) (metrologyjournal.Entry, error) {
	operationType := metrologyjournal.OperationType(strings.ToLower(strings.TrimSpace(req.OperationType)))
	if operationType == "" {
		return metrologyjournal.Entry{}, ErrOperationTypeRequired
	}
	switch operationType {
	case metrologyjournal.OperationTypeVerification,
		metrologyjournal.OperationTypeCalibration,
		metrologyjournal.OperationTypeMaintenance,
		metrologyjournal.OperationTypeSuspension,
		metrologyjournal.OperationTypeDecommission:
	default:
		return metrologyjournal.Entry{}, ErrOperationTypeInvalid
	}

	operationDateValue := strings.TrimSpace(req.OperationDate)
	if operationDateValue == "" {
		return metrologyjournal.Entry{}, ErrOperationDateRequired
	}
	operationDate, err := time.Parse("2006-01-02", operationDateValue)
	if err != nil {
		return metrologyjournal.Entry{}, ErrOperationDateInvalid
	}

	documentNumber := strings.TrimSpace(req.DocumentNumber)
	if documentNumber == "" {
		return metrologyjournal.Entry{}, ErrDocumentNumberRequired
	}
	executorOrganization := strings.TrimSpace(req.ExecutorOrganization)
	if executorOrganization == "" {
		return metrologyjournal.Entry{}, ErrExecutorRequired
	}

	var validUntil *time.Time
	if req.ValidUntil != nil && strings.TrimSpace(*req.ValidUntil) != "" {
		value, parseErr := time.Parse("2006-01-02", strings.TrimSpace(*req.ValidUntil))
		if parseErr != nil {
			return metrologyjournal.Entry{}, ErrValidUntilInvalid
		}
		validUntil = &value
	}

	return metrologyjournal.Entry{
		OrganizationID:       organizationID,
		SubjectType:          metrologyjournal.SubjectTypeStandard,
		SubjectID:            subjectID,
		OperationType:        operationType,
		OperationDate:        operationDate,
		DocumentNumber:       documentNumber,
		ValidUntil:           validUntil,
		ExecutorOrganization: executorOrganization,
		AttachmentURL:        normalizeOptional(req.AttachmentURL),
		Comment:              normalizeOptional(req.Comment),
	}, nil
}

func toJournalResponse(entry metrologyjournal.Entry) *JournalResponse {
	var validUntil *string
	if entry.ValidUntil != nil {
		value := entry.ValidUntil.UTC().Format("2006-01-02")
		validUntil = &value
	}

	return &JournalResponse{
		ID:                   entry.ID,
		OperationType:        string(entry.OperationType),
		OperationDate:        entry.OperationDate.UTC().Format("2006-01-02"),
		DocumentNumber:       entry.DocumentNumber,
		ValidUntil:           validUntil,
		ExecutorOrganization: entry.ExecutorOrganization,
		AttachmentURL:        entry.AttachmentURL,
		Comment:              entry.Comment,
		CreatedAt:            entry.CreatedAt.Format(time.RFC3339),
	}
}

func mapAccessError(err error) error {
	switch err {
	case nil:
		return nil
	case registryaccess.ErrUnauthorized:
		return ErrUnauthorized
	case registryaccess.ErrForbidden:
		return ErrForbidden
	default:
		return err
	}
}

func mapScopeError(err error) error {
	switch err {
	case registryaccess.ErrInvalidScope, registryaccess.ErrInvalidDivision, registryaccess.ErrInvalidUnit:
		return ErrScopeInvalid
	default:
		return mapAccessError(err)
	}
}
