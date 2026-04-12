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

    equipmentDictID, err := uuid.Parse(req.EquipmentDictionaryID)
    if err != nil {
        return nil, err
    }
    orgID, err := uuid.Parse(req.OrganizationID)
    if err != nil {
        return nil, err
    }
    manufactureYear, err := time.Parse("2006", req.ManufactureYear)
    if err != nil {
        return nil, ErrManufactureYearRequired
    }

    var registrationYear *time.Time
    if req.RegistrationYear != nil && *req.RegistrationYear != "" {
        t, err := time.Parse("2006", *req.RegistrationYear)
        if err == nil {
            registrationYear = &t
        }
    }
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

    full, err := s.repository.GetByID(ctx, eq.ID)
    if err != nil {
        return toResponseFromEquipment(eq), nil
    }

    return toResponse(full), nil
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

    model := Equipment{
        ID:                    eqID,
        FactoryNumber:         current.FactoryNumber,
        InventoryNumber:       current.InventoryNumber,
        ManufactureYear:       current.ManufactureYear,
        RegistrationYear:      current.RegistrationYear,
        EquipmentDictionaryID: current.EquipmentDictionaryID,
        OrganizationID:        current.OrganizationID,
        StatusID:              current.StatusID,
    }

    if req.FactoryNumber != nil {
        model.FactoryNumber = *req.FactoryNumber
    }
    if req.InventoryNumber != nil {
        model.InventoryNumber = req.InventoryNumber
    }
    if req.ManufactureYear != nil {
        t, err := time.Parse("2006", *req.ManufactureYear)
        if err == nil {
            model.ManufactureYear = t
        }
    }
    if req.RegistrationYear != nil {
        if *req.RegistrationYear == "" {
            model.RegistrationYear = nil
        } else {
            t, err := time.Parse("2006", *req.RegistrationYear)
            if err == nil {
                model.RegistrationYear = &t
            }
        }
    }
    if req.EquipmentDictionaryID != nil {
        id, err := uuid.Parse(*req.EquipmentDictionaryID)
        if err == nil {
            model.EquipmentDictionaryID = id
        }
    }
    if req.OrganizationID != nil {
        id, err := uuid.Parse(*req.OrganizationID)
        if err == nil {
            model.OrganizationID = id
        }
    }
    if req.StatusID != nil {
        model.StatusID = *req.StatusID
    }

    eq, err := s.repository.Update(ctx, model)
    if err != nil {
        return nil, err
    }

    full, err := s.repository.GetByID(ctx, eq.ID)
    if err != nil {
        return toResponseFromEquipment(eq), nil
    }

    return toResponse(full), nil
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
func toResponse(eq *EquipmentWithDetails) *EquipmentResponse {
    resp := &EquipmentResponse{
        ID:                  eq.ID.String(),
        FactoryNumber:       eq.FactoryNumber,
        ManufactureYear:     eq.ManufactureYear.Format("2006"),
        EquipmentName:       eq.EquipmentName,
        Model:               eq.Model,
        Manufacturer:        eq.Manufacturer,
        UsageClassification: eq.UsageClassification,
        OrganizationName:    eq.OrganizationName,
        StatusID:            eq.StatusID,
        StatusName:          eq.StatusName,
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

func toResponseFromEquipment(eq *Equipment) *EquipmentResponse {
    resp := &EquipmentResponse{
        ID:              eq.ID.String(),
        FactoryNumber:   eq.FactoryNumber,
        ManufactureYear: eq.ManufactureYear.Format("2006"),
        StatusID:        eq.StatusID,
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
