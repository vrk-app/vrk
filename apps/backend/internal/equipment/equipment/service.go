package equipment

import (
	"context"
	"strings"
	"time"

	"backend/internal/auth/bootstrap"
	"backend/internal/equipment/metrologyjournal"
	equipmentphoto "backend/internal/equipment/photo"
	"backend/internal/equipment/registryaccess"

	"github.com/google/uuid"
)

type EquipmentService interface {
	Create(ctx context.Context, token string, req CreateRequest) (*EquipmentResponse, error)
	List(ctx context.Context, token string, includeArchived bool, limit, offset int32) ([]*EquipmentResponse, int64, error)
	GetByID(ctx context.Context, token string, id string) (*EquipmentResponse, error)
	Update(ctx context.Context, token string, id string, req UpdateRequest) (*EquipmentResponse, error)
	Archive(ctx context.Context, token string, id string) (*EquipmentResponse, error)
	ListJournals(ctx context.Context, token string, id string) ([]*JournalResponse, error)
	CreateJournal(ctx context.Context, token string, id string, req CreateJournalRequest) (*JournalResponse, error)
}

type equipmentService struct {
	repository        EquipmentRepository
	journalRepository metrologyjournal.Repository
	authService       bootstrap.Service
	photos            equipmentphoto.Repository
}

func NewService(
	repository EquipmentRepository,
	journalRepository metrologyjournal.Repository,
	authService bootstrap.Service,
	photos equipmentphoto.Repository,
) EquipmentService {
	return &equipmentService{
		repository:        repository,
		journalRepository: journalRepository,
		authService:       authService,
		photos:            photos,
	}
}

var allowedStatuses = map[string]struct{}{
	"active":   {},
	"inactive": {},
	"retired":  {},
}

func (s *equipmentService) Create(ctx context.Context, token string, req CreateRequest) (*EquipmentResponse, error) {
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

	return toResponse(created, metrologyjournal.DeriveState(nil, created.Status), nil), nil
}

func (s *equipmentService) List(ctx context.Context, token string, includeArchived bool, limit, offset int32) ([]*EquipmentResponse, int64, error) {
	session, err := registryaccess.RequireCustomerSession(ctx, s.authService, token)
	if err != nil {
		return nil, 0, mapAccessError(err)
	}

	items, err := s.repository.ListByOrganization(ctx, uuid.MustParse(session.Organization.ID), includeArchived)
	if err != nil {
		return nil, 0, err
	}

	filtered := make([]Equipment, 0, len(items))
	for _, item := range items {
		if _, visible := registryaccess.VisibleUnitMap(session)[item.UnitID]; !visible {
			continue
		}
		filtered = append(filtered, item)
	}

	paged := paginate(filtered, limit, offset)
	photosByEquipment, err := s.photosByEquipment(ctx, session.Organization.ID, paged)
	if err != nil {
		return nil, 0, err
	}
	journalsByEquipment, err := s.journalsByEquipment(ctx, session.Organization.ID)
	if err != nil {
		return nil, 0, err
	}
	result := make([]*EquipmentResponse, 0, len(paged))
	for index := range paged {
		derived := metrologyjournal.DeriveState(journalsByEquipment[paged[index].ID], paged[index].Status)
		result = append(result, toResponse(&paged[index], derived, photosByEquipment[paged[index].ID]))
	}

	return result, int64(len(filtered)), nil
}

func (s *equipmentService) GetByID(ctx context.Context, token string, id string) (*EquipmentResponse, error) {
	session, err := registryaccess.RequireCustomerSession(ctx, s.authService, token)
	if err != nil {
		return nil, mapAccessError(err)
	}

	equipmentID, err := uuid.Parse(strings.TrimSpace(id))
	if err != nil {
		return nil, ErrInvalidID
	}

	item, err := s.repository.GetByID(ctx, equipmentID)
	if err != nil {
		return nil, err
	}
	if item.OrganizationID != session.Organization.ID {
		return nil, ErrForbidden
	}
	if _, visible := registryaccess.VisibleUnitMap(session)[item.UnitID]; !visible {
		return nil, ErrForbidden
	}

	photos, err := s.photosForEquipment(ctx, session.Organization.ID, item.ID)
	if err != nil {
		return nil, err
	}
	journals, err := s.journalsForEquipment(ctx, session.Organization.ID, item.ID)
	if err != nil {
		return nil, err
	}

	return toResponse(item, metrologyjournal.DeriveState(journals, item.Status), photos), nil
}

func (s *equipmentService) Update(ctx context.Context, token string, id string, req UpdateRequest) (*EquipmentResponse, error) {
	session, err := registryaccess.RequireRegistryManager(ctx, s.authService, token)
	if err != nil {
		return nil, mapAccessError(err)
	}

	equipmentID, err := uuid.Parse(strings.TrimSpace(id))
	if err != nil {
		return nil, ErrInvalidID
	}

	current, err := s.repository.GetByID(ctx, equipmentID)
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

	updated, err := s.buildUpdatedModel(session, current, req)
	if err != nil {
		return nil, err
	}

	item, err := s.repository.Update(ctx, *updated)
	if err != nil {
		return nil, err
	}

	photos, err := s.photosForEquipment(ctx, session.Organization.ID, item.ID)
	if err != nil {
		return nil, err
	}
	journals, err := s.journalsForEquipment(ctx, session.Organization.ID, item.ID)
	if err != nil {
		return nil, err
	}

	return toResponse(item, metrologyjournal.DeriveState(journals, item.Status), photos), nil
}

func (s *equipmentService) Archive(ctx context.Context, token string, id string) (*EquipmentResponse, error) {
	session, err := registryaccess.RequireRegistryManager(ctx, s.authService, token)
	if err != nil {
		return nil, mapAccessError(err)
	}

	equipmentID, err := uuid.Parse(strings.TrimSpace(id))
	if err != nil {
		return nil, ErrInvalidID
	}

	current, err := s.repository.GetByID(ctx, equipmentID)
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

	archived, err := s.repository.Archive(ctx, equipmentID)
	if err != nil {
		return nil, err
	}

	photos, err := s.photosForEquipment(ctx, session.Organization.ID, archived.ID)
	if err != nil {
		return nil, err
	}
	journals, err := s.journalsForEquipment(ctx, session.Organization.ID, archived.ID)
	if err != nil {
		return nil, err
	}

	return toResponse(archived, metrologyjournal.DeriveState(journals, archived.Status), photos), nil
}

func (s *equipmentService) ListJournals(ctx context.Context, token string, id string) ([]*JournalResponse, error) {
	session, err := registryaccess.RequireCustomerSession(ctx, s.authService, token)
	if err != nil {
		return nil, mapAccessError(err)
	}

	equipmentID, _, err := s.visibleEquipment(ctx, session, id)
	if err != nil {
		return nil, err
	}

	journals, err := s.journalRepository.ListBySubject(
		ctx,
		uuid.MustParse(session.Organization.ID),
		metrologyjournal.SubjectTypeTechnicalEquipment,
		equipmentID,
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

func (s *equipmentService) CreateJournal(ctx context.Context, token string, id string, req CreateJournalRequest) (*JournalResponse, error) {
	session, err := registryaccess.RequireRegistryManager(ctx, s.authService, token)
	if err != nil {
		return nil, mapAccessError(err)
	}

	equipmentID, current, err := s.visibleEquipment(ctx, session, id)
	if err != nil {
		return nil, err
	}
	if current.ArchivedAt != nil {
		return nil, ErrAlreadyArchived
	}

	entry, err := s.buildJournalEntry(session.Organization.ID, equipmentID.String(), req)
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
		metrologyjournal.SubjectTypeTechnicalEquipment,
		equipmentID,
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

func (s *equipmentService) buildCreateModel(session *bootstrap.SessionSummaryResponse, req CreateRequest) (Equipment, error) {
	req.UnitID = strings.TrimSpace(req.UnitID)
	req.Manufacturer = strings.TrimSpace(req.Manufacturer)
	req.Classification = strings.TrimSpace(req.Classification)
	req.Model = strings.TrimSpace(req.Model)
	req.FullName = strings.TrimSpace(req.FullName)
	req.FactoryNumber = strings.TrimSpace(req.FactoryNumber)
	req.Status = normalizeStatus(req.Status)
	req.InventoryNumber = normalizeOptional(req.InventoryNumber)
	req.Comment = normalizeOptional(req.Comment)
	req.DocumentURL = normalizeOptional(req.DocumentURL)

	if req.UnitID == "" {
		return Equipment{}, ErrUnitRequired
	}
	if req.Manufacturer == "" {
		return Equipment{}, ErrManufacturerRequired
	}
	if req.Classification == "" {
		return Equipment{}, ErrClassificationRequired
	}
	if req.Model == "" {
		return Equipment{}, ErrModelRequired
	}
	if req.FullName == "" {
		return Equipment{}, ErrFullNameRequired
	}
	if req.FactoryNumber == "" {
		return Equipment{}, ErrFactoryNumberRequired
	}
	if req.ManufactureYear < 1900 || req.ManufactureYear > time.Now().Year()+1 {
		return Equipment{}, ErrManufactureYearInvalid
	}
	if req.Status == "" {
		return Equipment{}, ErrStatusRequired
	}
	if !isValidStatus(req.Status) {
		return Equipment{}, ErrStatusInvalid
	}

	unit, err := registryaccess.ResolveVisibleUnit(session, req.UnitID)
	if err != nil {
		return Equipment{}, mapAccessError(err)
	}

	return Equipment{
		OrganizationID:  session.Organization.ID,
		UnitID:          unit.ID,
		Manufacturer:    req.Manufacturer,
		Classification:  req.Classification,
		Model:           req.Model,
		FullName:        req.FullName,
		FactoryNumber:   req.FactoryNumber,
		InventoryNumber: req.InventoryNumber,
		ManufactureYear: req.ManufactureYear,
		Status:          req.Status,
		Comment:         req.Comment,
		DocumentURL:     req.DocumentURL,
	}, nil
}

func (s *equipmentService) buildUpdatedModel(session *bootstrap.SessionSummaryResponse, current *Equipment, req UpdateRequest) (*Equipment, error) {
	updated := *current

	if req.UnitID != nil {
		unit, err := registryaccess.ResolveVisibleUnit(session, *req.UnitID)
		if err != nil {
			return nil, mapAccessError(err)
		}
		updated.UnitID = unit.ID
	}
	if req.Manufacturer != nil {
		value := strings.TrimSpace(*req.Manufacturer)
		if value == "" {
			return nil, ErrManufacturerRequired
		}
		updated.Manufacturer = value
	}
	if req.Classification != nil {
		value := strings.TrimSpace(*req.Classification)
		if value == "" {
			return nil, ErrClassificationRequired
		}
		updated.Classification = value
	}
	if req.Model != nil {
		value := strings.TrimSpace(*req.Model)
		if value == "" {
			return nil, ErrModelRequired
		}
		updated.Model = value
	}
	if req.FullName != nil {
		value := strings.TrimSpace(*req.FullName)
		if value == "" {
			return nil, ErrFullNameRequired
		}
		updated.FullName = value
	}
	if req.FactoryNumber != nil {
		value := strings.TrimSpace(*req.FactoryNumber)
		if value == "" {
			return nil, ErrFactoryNumberRequired
		}
		updated.FactoryNumber = value
	}
	if req.InventoryNumber != nil {
		updated.InventoryNumber = normalizeOptional(req.InventoryNumber)
	}
	if req.ManufactureYear != nil {
		if *req.ManufactureYear < 1900 || *req.ManufactureYear > time.Now().Year()+1 {
			return nil, ErrManufactureYearInvalid
		}
		updated.ManufactureYear = *req.ManufactureYear
	}
	if req.Status != nil {
		value := normalizeStatus(*req.Status)
		if value == "" {
			return nil, ErrStatusRequired
		}
		if !isValidStatus(value) {
			return nil, ErrStatusInvalid
		}
		updated.Status = value
	}
	if req.Comment != nil {
		updated.Comment = normalizeOptional(req.Comment)
	}
	if req.DocumentURL != nil {
		updated.DocumentURL = normalizeOptional(req.DocumentURL)
	}

	return &updated, nil
}

func (s *equipmentService) photosByEquipment(ctx context.Context, organizationID string, items []Equipment) (map[string][]equipmentphoto.EquipmentPhoto, error) {
	result := make(map[string][]equipmentphoto.EquipmentPhoto, len(items))
	if s.photos == nil || len(items) == 0 {
		return result, nil
	}

	ids := make([]uuid.UUID, 0, len(items))
	for _, item := range items {
		ids = append(ids, uuid.MustParse(item.ID))
	}

	return s.photos.ListBySubjects(ctx, uuid.MustParse(organizationID), equipmentphoto.SubjectTechnicalEquipment, ids)
}

func (s *equipmentService) photosForEquipment(ctx context.Context, organizationID string, equipmentID string) ([]equipmentphoto.EquipmentPhoto, error) {
	if s.photos == nil {
		return []equipmentphoto.EquipmentPhoto{}, nil
	}

	return s.photos.ListBySubject(
		ctx,
		uuid.MustParse(organizationID),
		equipmentphoto.SubjectTechnicalEquipment,
		uuid.MustParse(equipmentID),
	)
}

func (s *equipmentService) journalsByEquipment(ctx context.Context, organizationID string) (map[string][]metrologyjournal.Entry, error) {
	if s.journalRepository == nil {
		return map[string][]metrologyjournal.Entry{}, nil
	}

	return s.journalRepository.ListByOrganization(
		ctx,
		uuid.MustParse(organizationID),
		metrologyjournal.SubjectTypeTechnicalEquipment,
	)
}

func (s *equipmentService) journalsForEquipment(ctx context.Context, organizationID string, equipmentID string) ([]metrologyjournal.Entry, error) {
	if s.journalRepository == nil {
		return []metrologyjournal.Entry{}, nil
	}

	return s.journalRepository.ListBySubject(
		ctx,
		uuid.MustParse(organizationID),
		metrologyjournal.SubjectTypeTechnicalEquipment,
		uuid.MustParse(equipmentID),
	)
}

func (s *equipmentService) visibleEquipment(ctx context.Context, session *bootstrap.SessionSummaryResponse, id string) (uuid.UUID, *Equipment, error) {
	equipmentID, err := uuid.Parse(strings.TrimSpace(id))
	if err != nil {
		return uuid.Nil, nil, ErrInvalidID
	}

	current, err := s.repository.GetByID(ctx, equipmentID)
	if err != nil {
		return uuid.Nil, nil, err
	}
	if current.OrganizationID != session.Organization.ID {
		return uuid.Nil, nil, ErrForbidden
	}
	if _, visible := registryaccess.VisibleUnitMap(session)[current.UnitID]; !visible {
		return uuid.Nil, nil, ErrForbidden
	}

	return equipmentID, current, nil
}

func (s *equipmentService) buildJournalEntry(
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
		SubjectType:          metrologyjournal.SubjectTypeTechnicalEquipment,
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

func toResponse(item *Equipment, derived metrologyjournal.DerivedState, photos []equipmentphoto.EquipmentPhoto) *EquipmentResponse {
	var archivedAt *string
	if item.ArchivedAt != nil {
		value := item.ArchivedAt.Format(time.RFC3339)
		archivedAt = &value
	}

	return &EquipmentResponse{
		ID:             item.ID,
		OrganizationID: item.OrganizationID,
		Unit: UnitSummary{
			ID:           item.UnitID,
			Name:         item.UnitName,
			DivisionID:   item.DivisionID,
			DivisionName: item.DivisionName,
		},
		Manufacturer:             item.Manufacturer,
		Classification:           item.Classification,
		Model:                    item.Model,
		FullName:                 item.FullName,
		FactoryNumber:            item.FactoryNumber,
		InventoryNumber:          item.InventoryNumber,
		ManufactureYear:          item.ManufactureYear,
		Status:                   derived.Status,
		Comment:                  item.Comment,
		DocumentURL:              item.DocumentURL,
		Photos:                   photoResponses(photos),
		JournalCount:             derived.JournalCount,
		NextDueDate:              derived.NextDueDate,
		LatestJournal:            journalResponsePtr(derived.LatestJournal),
		MeasuringInstrumentCount: item.MeasuringInstrumentCount,
		ArchivedAt:               archivedAt,
		CreatedAt:                item.CreatedAt.Format(time.RFC3339),
		UpdatedAt:                item.UpdatedAt.Format(time.RFC3339),
	}
}

func journalResponsePtr(entry *metrologyjournal.Entry) *JournalResponse {
	if entry == nil {
		return nil
	}

	return toJournalResponse(*entry)
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

func photoResponses(photos []equipmentphoto.EquipmentPhoto) []EquipmentPhotoResponse {
	source := equipmentphoto.ToResponses(photos)
	result := make([]EquipmentPhotoResponse, 0, len(source))
	for _, item := range source {
		result = append(result, EquipmentPhotoResponse{
			ID:          item.ID,
			FileName:    item.FileName,
			ContentType: item.ContentType,
			SizeBytes:   item.SizeBytes,
			SortOrder:   item.SortOrder,
			URL:         item.URL,
			CreatedAt:   item.CreatedAt,
			UpdatedAt:   item.UpdatedAt,
		})
	}
	return result
}

func paginate(items []Equipment, limit, offset int32) []Equipment {
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
		return []Equipment{}
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

func normalizeStatus(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

func isValidStatus(value string) bool {
	_, ok := allowedStatuses[value]
	return ok
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
