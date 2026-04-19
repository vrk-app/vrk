package equipment

import (
	"context"
	"strings"
	"time"

	"backend/internal/auth/bootstrap"
	"backend/internal/equipment/registryaccess"

	"github.com/google/uuid"
)

type EquipmentService interface {
	Create(ctx context.Context, token string, req CreateRequest) (*EquipmentResponse, error)
	List(ctx context.Context, token string, includeArchived bool, limit, offset int32) ([]*EquipmentResponse, int64, error)
	GetByID(ctx context.Context, token string, id string) (*EquipmentResponse, error)
	Update(ctx context.Context, token string, id string, req UpdateRequest) (*EquipmentResponse, error)
	Archive(ctx context.Context, token string, id string) (*EquipmentResponse, error)
}

type equipmentService struct {
	repository  EquipmentRepository
	authService bootstrap.Service
}

func NewService(repository EquipmentRepository, authService bootstrap.Service) EquipmentService {
	return &equipmentService{
		repository:  repository,
		authService: authService,
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

	return toResponse(created), nil
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
	result := make([]*EquipmentResponse, 0, len(paged))
	for index := range paged {
		result = append(result, toResponse(&paged[index]))
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

	return toResponse(item), nil
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

	return toResponse(item), nil
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

	return toResponse(archived), nil
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

func toResponse(item *Equipment) *EquipmentResponse {
	var archivedAt *string
	if item.ArchivedAt != nil {
		value := item.ArchivedAt.Format(time.RFC3339)
		archivedAt = &value
	}

	return &EquipmentResponse{
		ID:             item.ID,
		OrganizationID: item.OrganizationID,
		Unit: UnitSummary{
			ID:              item.UnitID,
			Name:            item.UnitName,
			SubdivisionID:   item.SubdivisionID,
			SubdivisionName: item.SubdivisionName,
		},
		Manufacturer:             item.Manufacturer,
		Classification:           item.Classification,
		Model:                    item.Model,
		FullName:                 item.FullName,
		FactoryNumber:            item.FactoryNumber,
		InventoryNumber:          item.InventoryNumber,
		ManufactureYear:          item.ManufactureYear,
		Status:                   item.Status,
		Comment:                  item.Comment,
		DocumentURL:              item.DocumentURL,
		MeasuringInstrumentCount: item.MeasuringInstrumentCount,
		ArchivedAt:               archivedAt,
		CreatedAt:                item.CreatedAt.Format(time.RFC3339),
		UpdatedAt:                item.UpdatedAt.Format(time.RFC3339),
	}
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
