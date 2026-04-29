package measuringinstrument

import (
	"context"
	"strings"
	"time"

	"backend/internal/auth/bootstrap"
	"backend/internal/equipment/metrologyjournal"
	"backend/internal/equipment/registryaccess"

	"github.com/google/uuid"
)

type MeasuringInstrumentService interface {
	Create(ctx context.Context, token string, req CreateRequest) (*MeasuringInstrumentResponse, error)
	List(ctx context.Context, token string, includeArchived bool, limit, offset int32) ([]*MeasuringInstrumentResponse, int64, error)
	GetByID(ctx context.Context, token string, id string) (*MeasuringInstrumentResponse, error)
	Update(ctx context.Context, token string, id string, req UpdateRequest) (*MeasuringInstrumentResponse, error)
	Archive(ctx context.Context, token string, id string) (*MeasuringInstrumentResponse, error)
	ListJournals(ctx context.Context, token string, id string) ([]*JournalResponse, error)
	CreateJournal(ctx context.Context, token string, id string, req CreateJournalRequest) (*JournalResponse, error)
}

type measuringInstrumentService struct {
	repository        MeasuringInstrumentRepository
	journalRepository metrologyjournal.Repository
	authService       bootstrap.Service
}

func NewService(
	repository MeasuringInstrumentRepository,
	journalRepository metrologyjournal.Repository,
	authService bootstrap.Service,
) MeasuringInstrumentService {
	return &measuringInstrumentService{
		repository:        repository,
		journalRepository: journalRepository,
		authService:       authService,
	}
}

var allowedPlacementKinds = map[string]struct{}{
	"standalone": {},
	"built_in":   {},
}

func (s *measuringInstrumentService) Create(ctx context.Context, token string, req CreateRequest) (*MeasuringInstrumentResponse, error) {
	session, err := registryaccess.RequireRegistryManager(ctx, s.authService, token)
	if err != nil {
		return nil, mapAccessError(err)
	}

	item, standardIDs, err := s.buildCreateModel(ctx, session, req)
	if err != nil {
		return nil, err
	}

	created, err := s.repository.Create(ctx, item)
	if err != nil {
		return nil, err
	}
	if err := s.repository.ReplaceStandardLinks(ctx, uuid.MustParse(created.ID), standardIDs); err != nil {
		return nil, err
	}

	return s.GetByID(ctx, token, created.ID)
}

func (s *measuringInstrumentService) List(ctx context.Context, token string, includeArchived bool, limit, offset int32) ([]*MeasuringInstrumentResponse, int64, error) {
	session, err := registryaccess.RequireCustomerSession(ctx, s.authService, token)
	if err != nil {
		return nil, 0, mapAccessError(err)
	}

	items, err := s.repository.ListByOrganization(ctx, uuid.MustParse(session.Organization.ID), includeArchived)
	if err != nil {
		return nil, 0, err
	}
	standardsByInstrument, err := s.repository.ListStandardLinksByOrganization(ctx, uuid.MustParse(session.Organization.ID))
	if err != nil {
		return nil, 0, err
	}
	journalsByInstrument, err := s.journalRepository.ListByOrganization(
		ctx,
		uuid.MustParse(session.Organization.ID),
		metrologyjournal.SubjectTypeMeasuringInstrument,
	)
	if err != nil {
		return nil, 0, err
	}

	filtered := make([]MeasuringInstrument, 0, len(items))
	visibleUnits := registryaccess.VisibleUnitMap(session)
	for _, item := range items {
		if _, visible := visibleUnits[item.UnitID]; !visible {
			continue
		}
		item.Standards = standardsByInstrument[item.ID]
		filtered = append(filtered, item)
	}

	paged := paginate(filtered, limit, offset)
	result := make([]*MeasuringInstrumentResponse, 0, len(paged))
	for index := range paged {
		derived := metrologyjournal.DeriveState(journalsByInstrument[paged[index].ID], paged[index].Status)
		result = append(result, toResponse(&paged[index], derived))
	}

	return result, int64(len(filtered)), nil
}

func (s *measuringInstrumentService) GetByID(ctx context.Context, token string, id string) (*MeasuringInstrumentResponse, error) {
	session, err := registryaccess.RequireCustomerSession(ctx, s.authService, token)
	if err != nil {
		return nil, mapAccessError(err)
	}

	measuringInstrumentID, err := uuid.Parse(strings.TrimSpace(id))
	if err != nil {
		return nil, ErrInvalidID
	}

	item, err := s.repository.GetByID(ctx, measuringInstrumentID)
	if err != nil {
		return nil, err
	}
	if item.OrganizationID != session.Organization.ID {
		return nil, ErrForbidden
	}
	if _, visible := registryaccess.VisibleUnitMap(session)[item.UnitID]; !visible {
		return nil, ErrForbidden
	}

	standardsByInstrument, err := s.repository.ListStandardLinksByOrganization(ctx, uuid.MustParse(session.Organization.ID))
	if err != nil {
		return nil, err
	}
	item.Standards = standardsByInstrument[item.ID]
	journals, err := s.journalRepository.ListBySubject(
		ctx,
		uuid.MustParse(session.Organization.ID),
		metrologyjournal.SubjectTypeMeasuringInstrument,
		measuringInstrumentID,
	)
	if err != nil {
		return nil, err
	}

	return toResponse(item, metrologyjournal.DeriveState(journals, item.Status)), nil
}

func (s *measuringInstrumentService) Update(ctx context.Context, token string, id string, req UpdateRequest) (*MeasuringInstrumentResponse, error) {
	session, err := registryaccess.RequireRegistryManager(ctx, s.authService, token)
	if err != nil {
		return nil, mapAccessError(err)
	}

	measuringInstrumentID, err := uuid.Parse(strings.TrimSpace(id))
	if err != nil {
		return nil, ErrInvalidID
	}

	current, err := s.repository.GetByID(ctx, measuringInstrumentID)
	if err != nil {
		return nil, err
	}
	if current.OrganizationID != session.Organization.ID {
		return nil, ErrForbidden
	}
	if current.ArchivedAt != nil {
		return nil, ErrArchivedTarget
	}

	updated, standardIDs, err := s.buildUpdatedModel(ctx, session, current, req)
	if err != nil {
		return nil, err
	}

	item, err := s.repository.Update(ctx, *updated)
	if err != nil {
		return nil, err
	}
	if err := s.repository.ReplaceStandardLinks(ctx, measuringInstrumentID, standardIDs); err != nil {
		return nil, err
	}

	return s.GetByID(ctx, token, item.ID)
}

func (s *measuringInstrumentService) Archive(ctx context.Context, token string, id string) (*MeasuringInstrumentResponse, error) {
	session, err := registryaccess.RequireRegistryManager(ctx, s.authService, token)
	if err != nil {
		return nil, mapAccessError(err)
	}

	measuringInstrumentID, err := uuid.Parse(strings.TrimSpace(id))
	if err != nil {
		return nil, ErrInvalidID
	}

	current, err := s.repository.GetByID(ctx, measuringInstrumentID)
	if err != nil {
		return nil, err
	}
	if current.OrganizationID != session.Organization.ID {
		return nil, ErrForbidden
	}
	if current.ArchivedAt != nil {
		return nil, ErrAlreadyArchived
	}
	if _, visible := registryaccess.VisibleUnitMap(session)[current.UnitID]; !visible {
		return nil, ErrForbidden
	}

	item, err := s.repository.Archive(ctx, measuringInstrumentID)
	if err != nil {
		return nil, err
	}

	journals, err := s.journalRepository.ListBySubject(
		ctx,
		uuid.MustParse(session.Organization.ID),
		metrologyjournal.SubjectTypeMeasuringInstrument,
		measuringInstrumentID,
	)
	if err != nil {
		return nil, err
	}

	return toResponse(item, metrologyjournal.DeriveState(journals, item.Status)), nil
}

func (s *measuringInstrumentService) ListJournals(ctx context.Context, token string, id string) ([]*JournalResponse, error) {
	session, err := registryaccess.RequireCustomerSession(ctx, s.authService, token)
	if err != nil {
		return nil, mapAccessError(err)
	}

	measuringInstrumentID, current, err := s.visibleInstrument(ctx, session, id)
	if err != nil {
		return nil, err
	}
	_ = current

	journals, err := s.journalRepository.ListBySubject(
		ctx,
		uuid.MustParse(session.Organization.ID),
		metrologyjournal.SubjectTypeMeasuringInstrument,
		measuringInstrumentID,
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

func (s *measuringInstrumentService) CreateJournal(ctx context.Context, token string, id string, req CreateJournalRequest) (*JournalResponse, error) {
	session, err := registryaccess.RequireRegistryManager(ctx, s.authService, token)
	if err != nil {
		return nil, mapAccessError(err)
	}

	measuringInstrumentID, current, err := s.visibleInstrument(ctx, session, id)
	if err != nil {
		return nil, err
	}
	if current.ArchivedAt != nil {
		return nil, ErrArchivedTarget
	}

	entry, err := s.buildJournalEntry(session.Organization.ID, measuringInstrumentID.String(), req)
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
		metrologyjournal.SubjectTypeMeasuringInstrument,
		measuringInstrumentID,
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

func (s *measuringInstrumentService) buildCreateModel(
	ctx context.Context,
	session *bootstrap.SessionSummaryResponse,
	req CreateRequest,
) (MeasuringInstrument, []uuid.UUID, error) {
	req.UnitID = strings.TrimSpace(req.UnitID)
	req.Name = strings.TrimSpace(req.Name)
	req.InstrumentType = strings.TrimSpace(req.InstrumentType)
	req.Model = strings.TrimSpace(req.Model)
	req.RegistrationNumber = strings.TrimSpace(req.RegistrationNumber)
	req.SerialNumber = strings.TrimSpace(req.SerialNumber)
	req.PlacementKind = normalizePlacementKind(req.PlacementKind)
	req.Comment = normalizeOptional(req.Comment)
	req.DocumentURL = normalizeOptional(req.DocumentURL)

	if req.Name == "" {
		return MeasuringInstrument{}, nil, ErrNameRequired
	}
	if req.InstrumentType == "" {
		return MeasuringInstrument{}, nil, ErrTypeRequired
	}
	if req.Model == "" {
		return MeasuringInstrument{}, nil, ErrModelRequired
	}
	if req.RegistrationNumber == "" {
		return MeasuringInstrument{}, nil, ErrRegistrationNumberRequired
	}
	if req.SerialNumber == "" {
		return MeasuringInstrument{}, nil, ErrSerialNumberRequired
	}
	if req.UnitID == "" {
		return MeasuringInstrument{}, nil, ErrUnitRequired
	}
	if req.PlacementKind == "" {
		return MeasuringInstrument{}, nil, ErrPlacementKindRequired
	}
	if !isValidPlacementKind(req.PlacementKind) {
		return MeasuringInstrument{}, nil, ErrPlacementKindInvalid
	}

	unit, err := registryaccess.ResolveVisibleUnit(session, req.UnitID)
	if err != nil {
		return MeasuringInstrument{}, nil, mapAccessError(err)
	}

	equipmentID, err := s.validateEquipment(ctx, session, req.EquipmentID, req.PlacementKind, unit.ID)
	if err != nil {
		return MeasuringInstrument{}, nil, err
	}
	standardIDs, err := s.validateStandardIDs(ctx, session, req.StandardIDs)
	if err != nil {
		return MeasuringInstrument{}, nil, err
	}

	item := MeasuringInstrument{
		OrganizationID:     session.Organization.ID,
		UnitID:             unit.ID,
		EquipmentID:        equipmentID,
		Name:               req.Name,
		InstrumentType:     req.InstrumentType,
		Model:              req.Model,
		RegistrationNumber: req.RegistrationNumber,
		SerialNumber:       req.SerialNumber,
		Status:             "inactive",
		PlacementKind:      req.PlacementKind,
		Comment:            req.Comment,
		DocumentURL:        req.DocumentURL,
	}

	return item, standardIDs, nil
}

func (s *measuringInstrumentService) buildUpdatedModel(
	ctx context.Context,
	session *bootstrap.SessionSummaryResponse,
	current *MeasuringInstrument,
	req UpdateRequest,
) (*MeasuringInstrument, []uuid.UUID, error) {
	updated := *current
	if current.ArchivedAt != nil {
		return nil, nil, ErrArchivedTarget
	}
	standardIDs, err := s.currentStandardIDs(ctx, session.Organization.ID, current.ID)
	if err != nil {
		return nil, nil, err
	}

	if req.UnitID != nil {
		unit, resolveErr := registryaccess.ResolveVisibleUnit(session, *req.UnitID)
		if resolveErr != nil {
			return nil, nil, mapAccessError(resolveErr)
		}
		updated.UnitID = unit.ID
	}
	if req.Name != nil {
		value := strings.TrimSpace(*req.Name)
		if value == "" {
			return nil, nil, ErrNameRequired
		}
		updated.Name = value
	}
	if req.InstrumentType != nil {
		value := strings.TrimSpace(*req.InstrumentType)
		if value == "" {
			return nil, nil, ErrTypeRequired
		}
		updated.InstrumentType = value
	}
	if req.Model != nil {
		value := strings.TrimSpace(*req.Model)
		if value == "" {
			return nil, nil, ErrModelRequired
		}
		updated.Model = value
	}
	if req.RegistrationNumber != nil {
		value := strings.TrimSpace(*req.RegistrationNumber)
		if value == "" {
			return nil, nil, ErrRegistrationNumberRequired
		}
		updated.RegistrationNumber = value
	}
	if req.SerialNumber != nil {
		value := strings.TrimSpace(*req.SerialNumber)
		if value == "" {
			return nil, nil, ErrSerialNumberRequired
		}
		updated.SerialNumber = value
	}
	if req.PlacementKind != nil {
		value := normalizePlacementKind(*req.PlacementKind)
		if value == "" {
			return nil, nil, ErrPlacementKindRequired
		}
		if !isValidPlacementKind(value) {
			return nil, nil, ErrPlacementKindInvalid
		}
		updated.PlacementKind = value
	}
	if req.Comment != nil {
		updated.Comment = normalizeOptional(req.Comment)
	}
	if req.DocumentURL != nil {
		updated.DocumentURL = normalizeOptional(req.DocumentURL)
	}
	if req.StandardIDs != nil {
		standardIDs, err = s.validateStandardIDs(ctx, session, req.StandardIDs)
		if err != nil {
			return nil, nil, err
		}
	}

	equipmentValue := updated.EquipmentID
	if req.EquipmentID != nil {
		equipmentValue = normalizeOptional(req.EquipmentID)
	}
	equipmentID, err := s.validateEquipment(ctx, session, equipmentValue, updated.PlacementKind, updated.UnitID)
	if err != nil {
		return nil, nil, err
	}
	updated.EquipmentID = equipmentID

	return &updated, standardIDs, nil
}

func (s *measuringInstrumentService) validateEquipment(
	ctx context.Context,
	session *bootstrap.SessionSummaryResponse,
	equipmentID *string,
	placementKind string,
	unitID string,
) (*string, error) {
	if placementKind == "built_in" {
		if equipmentID == nil || strings.TrimSpace(*equipmentID) == "" {
			return nil, ErrEquipmentRequired
		}
	}
	if placementKind == "standalone" {
		return nil, nil
	}

	parsed, err := uuid.Parse(strings.TrimSpace(*equipmentID))
	if err != nil {
		return nil, ErrEquipmentInvalid
	}

	summary, organizationID, equipmentUnitID, err := s.repository.GetEquipmentSummary(ctx, parsed)
	if err != nil {
		return nil, ErrEquipmentInvalid
	}
	if organizationID != session.Organization.ID {
		return nil, ErrEquipmentInvalid
	}
	if summary == nil {
		return nil, ErrEquipmentInvalid
	}
	if unitID == "" {
		return nil, ErrEquipmentInvalid
	}
	if equipmentUnitID != unitID {
		return nil, ErrEquipmentInvalid
	}

	value := summary.ID
	return &value, nil
}

func (s *measuringInstrumentService) validateStandardIDs(
	ctx context.Context,
	session *bootstrap.SessionSummaryResponse,
	standardIDs []string,
) ([]uuid.UUID, error) {
	if len(standardIDs) == 0 {
		return []uuid.UUID{}, nil
	}

	parsed := make([]uuid.UUID, 0, len(standardIDs))
	for _, value := range standardIDs {
		id, err := uuid.Parse(strings.TrimSpace(value))
		if err != nil {
			return nil, ErrStandardInvalid
		}
		parsed = append(parsed, id)
	}

	scopes, err := s.repository.GetStandardScopes(ctx, uuid.MustParse(session.Organization.ID), parsed)
	if err != nil {
		return nil, ErrStandardInvalid
	}
	if len(scopes) != len(parsed) {
		return nil, ErrStandardInvalid
	}
	for _, id := range parsed {
		scope := scopes[id.String()]
		var divisionID *uuid.UUID
		var unitID *uuid.UUID
		if scope.DivisionID != nil {
			value := uuid.MustParse(*scope.DivisionID)
			divisionID = &value
		}
		if scope.UnitID != nil {
			value := uuid.MustParse(*scope.UnitID)
			unitID = &value
		}
		if !registryaccess.CanSeeStandard(session, divisionID, unitID) {
			return nil, ErrStandardInvalid
		}
	}

	return parsed, nil
}

func (s *measuringInstrumentService) currentStandardIDs(ctx context.Context, organizationID string, measuringInstrumentID string) ([]uuid.UUID, error) {
	links, err := s.repository.ListStandardLinksByOrganization(ctx, uuid.MustParse(organizationID))
	if err != nil {
		return nil, err
	}

	result := make([]uuid.UUID, 0, len(links[measuringInstrumentID]))
	for _, link := range links[measuringInstrumentID] {
		result = append(result, uuid.MustParse(link.ID))
	}
	return result, nil
}

func toResponse(item *MeasuringInstrument, derived metrologyjournal.DerivedState) *MeasuringInstrumentResponse {
	var equipment *EquipmentSummary
	standards := item.Standards
	if item.EquipmentID != nil && item.EquipmentFullName != nil {
		equipment = &EquipmentSummary{
			ID:       *item.EquipmentID,
			FullName: *item.EquipmentFullName,
		}
	}
	if standards == nil {
		standards = []LinkedStandard{}
	}
	var archivedAt *string
	if item.ArchivedAt != nil {
		value := item.ArchivedAt.Format(time.RFC3339)
		archivedAt = &value
	}

	return &MeasuringInstrumentResponse{
		ID:             item.ID,
		OrganizationID: item.OrganizationID,
		Unit: UnitSummary{
			ID:              item.UnitID,
			Name:            item.UnitName,
			DivisionID:   item.DivisionID,
			DivisionName: item.DivisionName,
		},
		Equipment:          equipment,
		Name:               item.Name,
		InstrumentType:     item.InstrumentType,
		Model:              item.Model,
		RegistrationNumber: item.RegistrationNumber,
		SerialNumber:       item.SerialNumber,
		Status:             derived.Status,
		PlacementKind:      item.PlacementKind,
		Comment:            item.Comment,
		DocumentURL:        item.DocumentURL,
		Standards:          standards,
		JournalCount:       derived.JournalCount,
		NextDueDate:        derived.NextDueDate,
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

func paginate(items []MeasuringInstrument, limit, offset int32) []MeasuringInstrument {
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
		return []MeasuringInstrument{}
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

func normalizePlacementKind(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

func isValidPlacementKind(value string) bool {
	_, ok := allowedPlacementKinds[value]
	return ok
}

func (s *measuringInstrumentService) visibleInstrument(
	ctx context.Context,
	session *bootstrap.SessionSummaryResponse,
	id string,
) (uuid.UUID, *MeasuringInstrument, error) {
	measuringInstrumentID, err := uuid.Parse(strings.TrimSpace(id))
	if err != nil {
		return uuid.Nil, nil, ErrInvalidID
	}

	current, err := s.repository.GetByID(ctx, measuringInstrumentID)
	if err != nil {
		return uuid.Nil, nil, err
	}
	if current.OrganizationID != session.Organization.ID {
		return uuid.Nil, nil, ErrForbidden
	}
	if _, visible := registryaccess.VisibleUnitMap(session)[current.UnitID]; !visible {
		return uuid.Nil, nil, ErrForbidden
	}

	return measuringInstrumentID, current, nil
}

func (s *measuringInstrumentService) buildJournalEntry(
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
		SubjectType:          metrologyjournal.SubjectTypeMeasuringInstrument,
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
	case registryaccess.ErrInvalidUnit:
		return ErrUnitRequired
	default:
		return err
	}
}
