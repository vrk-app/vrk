package equipment

import (
    "context"
    "time"

    "github.com/google/uuid"
)

type EquipmentService interface {
    Create(ctx context.Context, req CreateRequest) (*EquipmentResponse, error)
    List(ctx context.Context, limit, offset int32) ([]*EquipmentResponse, int64, error)
    GetByID(ctx context.Context, id string) (*EquipmentResponse, error)
    Update(ctx context.Context, id string, req UpdateRequest) (*EquipmentResponse, error)
    Delete(ctx context.Context, id string) error
}

type equipmentService struct {
    repository EquipmentRepository
}

func NewService(repository EquipmentRepository) EquipmentService {
    return &equipmentService{repository: repository}
}

func (s *equipmentService) Create(ctx context.Context, req CreateRequest) (*EquipmentResponse, error) {
    id := uuid.New()

    // Парсинг UUID
    equipmentDictID, err := uuid.Parse(req.EquipmentDictionaryID)
    if err != nil {
        return nil, err
    }
    orgID, err := uuid.Parse(req.OrganizationID)
    if err != nil {
        return nil, err
    }

    // Год выпуска
    manufactureYear, err := time.Parse("2006", req.ManufactureYear)
    if err != nil {
        return nil, ErrManufactureYearRequired
    }

    // Регистрационный год (опционально)
    var registrationYear *time.Time
    if req.RegistrationYear != nil && *req.RegistrationYear != "" {
        t, err := time.Parse("2006", *req.RegistrationYear)
        if err == nil {
            registrationYear = &t
        }
    }

    // Инвентарный номер (опционально)
    var inventoryNumber *string = req.InventoryNumber

    model := Equipment{
        ID:                    id,
        FactoryNumber:         req.FactoryNumber,
        InventoryNumber:       inventoryNumber,
        ManufactureYear:       manufactureYear,
        RegistrationYear:      registrationYear,
        EquipmentDictionaryID: equipmentDictID,
        OrganizationID:        orgID,
        StatusID:              req.StatusID,
    }

    eq, err := s.repository.Create(ctx, model)
    if err != nil {
        return nil, err
    }

    return toResponse(eq), nil
}

func (s *equipmentService) GetByID(ctx context.Context, id string) (*EquipmentResponse, error) {
    eqID, err := uuid.Parse(id)
    if err != nil {
        return nil, ErrInvalidID
    }

    eq, err := s.repository.GetByID(ctx, eqID)
    if err != nil {
        return nil, err
    }

    return toResponse(eq), nil
}

func (s *equipmentService) Update(ctx context.Context, id string, req UpdateRequest) (*EquipmentResponse, error) {
    eqID, err := uuid.Parse(id)
    if err != nil {
        return nil, ErrInvalidID
    }

    current, err := s.repository.GetByID(ctx, eqID)
    if err != nil {
        return nil, err
    }

    // Обновляем поля, если переданы
    if req.FactoryNumber != nil {
        current.FactoryNumber = *req.FactoryNumber
    }
    if req.InventoryNumber != nil {
        current.InventoryNumber = req.InventoryNumber
    }
    if req.ManufactureYear != nil {
        t, err := time.Parse("2006", *req.ManufactureYear)
        if err == nil {
            current.ManufactureYear = t
        }
    }
    if req.RegistrationYear != nil {
        if *req.RegistrationYear == "" {
            current.RegistrationYear = nil
        } else {
            t, err := time.Parse("2006", *req.RegistrationYear)
            if err == nil {
                current.RegistrationYear = &t
            }
        }
    }
    if req.EquipmentDictionaryID != nil {
        id, err := uuid.Parse(*req.EquipmentDictionaryID)
        if err == nil {
            current.EquipmentDictionaryID = id
        }
    }
    if req.OrganizationID != nil {
        id, err := uuid.Parse(*req.OrganizationID)
        if err == nil {
            current.OrganizationID = id
        }
    }
    if req.StatusID != nil {
        current.StatusID = *req.StatusID
    }

    eq, err := s.repository.Update(ctx, *current)
    if err != nil {
        return nil, err
    }

    return toResponse(eq), nil
}

func (s *equipmentService) Delete(ctx context.Context, id string) error {
    eqID, err := uuid.Parse(id)
    if err != nil {
        return ErrInvalidID
    }
    return s.repository.Delete(ctx, eqID)
}

func (s *equipmentService) List(ctx context.Context, limit, offset int32) ([]*EquipmentResponse, int64, error) {
    if limit <= 0 {
        limit = 10
    }
    if limit > 100 {
        limit = 100
    }
    if offset < 0 {
        offset = 0
    }

    items, total, err := s.repository.List(ctx, limit, offset)
    if err != nil {
        return nil, 0, err
    }

    res := make([]*EquipmentResponse, len(items))
    for i := range items {
        res[i] = toResponse(&items[i])
    }

    return res, total, nil
}

// toResponse
func toResponse(eq *Equipment) *EquipmentResponse {
    resp := &EquipmentResponse{
        ID:                    eq.ID.String(),
        FactoryNumber:         eq.FactoryNumber,
        EquipmentDictionaryID: eq.EquipmentDictionaryID.String(),
        OrganizationID:        eq.OrganizationID.String(),
        StatusID:              eq.StatusID,
        ManufactureYear:       eq.ManufactureYear.Format("2006"),
    }

    if eq.InventoryNumber != nil {
        resp.InventoryNumber = eq.InventoryNumber
    }
    if eq.RegistrationYear != nil {
        year := eq.RegistrationYear.Format("2006")
        resp.RegistrationYear = &year
    }

    return resp
}