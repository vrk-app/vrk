package equipment

import (
    "context"
    "database/sql"
    "fmt"
    "time"

    "github.com/google/uuid"

    "backend/internal/db/generated"
)

type EquipmentService interface {
    Create(ctx context.Context, req CreateRequest) (*EquipmentResponse, error)
    GetByID(ctx context.Context, id string) (*EquipmentResponse, error)
    Update(ctx context.Context, id string, req UpdateRequest) (*EquipmentResponse, error)
    Delete(ctx context.Context, id string) error
    List(ctx context.Context, limit, offset int32) ([]*EquipmentResponse, int64, error)
}

type equipmentService struct {
    repo EquipmentRepository
}

func NewService(repo EquipmentRepository) EquipmentService {
    return &equipmentService{repo: repo}
}

func (s *equipmentService) Create(ctx context.Context, req CreateRequest) (*EquipmentResponse, error) {
    if req.FactoryNumber == "" {
        return nil, ErrFactoryNumberRequired
    }
    if req.ManufactureYear == "" {
        return nil, ErrManufactureYearRequired
    }

    equipmentDictID, err := uuid.Parse(req.EquipmentDictionaryID)
    if err != nil {
        return nil, fmt.Errorf("%w: equipment_dictionary_id", ErrInvalidUUID)
    }
    orgID, err := uuid.Parse(req.OrganizationID)
    if err != nil {
        return nil, fmt.Errorf("%w: organization_id", ErrInvalidUUID)
    }

    var manufactureYear time.Time
    if t, err := time.Parse("2006", req.ManufactureYear); err == nil {
        manufactureYear = t
    } else {
        return nil, fmt.Errorf("invalid manufacture year format, expected YYYY")
    }

    var registrationYear sql.NullTime
    if req.RegistrationYear != nil && *req.RegistrationYear != "" {
        if t, err := time.Parse("2006", *req.RegistrationYear); err == nil {
            registrationYear = sql.NullTime{Time: t, Valid: true}
        }
    }

    var inventoryNumber sql.NullString
    if req.InventoryNumber != nil {
        inventoryNumber = sql.NullString{String: *req.InventoryNumber, Valid: true}
    }

    params := generated.CreateEquipmentParams{
        FactoryNumber:         req.FactoryNumber,
        InventoryNumber:       inventoryNumber,
        ManufactureYear:       manufactureYear,
        RegistrationYear:      registrationYear,
        EquipmentDictionaryID: equipmentDictID,
        OrganizationID:        orgID,
        StatusID:              req.StatusID,
    }

    eq, err := s.repo.Create(ctx, params)
    if err != nil {
        return nil, err
    }

    return toResponse(fromCreateRow(eq)), nil
}

func (s *equipmentService) GetByID(ctx context.Context, id string) (*EquipmentResponse, error) {
    eqID, err := uuid.Parse(id)
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrInvalidID, err)
    }
    eq, err := s.repo.GetByID(ctx, eqID)
    if err != nil {
        return nil, err
    }
    return toResponse(fromGetByIDRow(eq)), nil
}

func (s *equipmentService) Update(ctx context.Context, id string, req UpdateRequest) (*EquipmentResponse, error) {
    eqID, err := uuid.Parse(id)
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrInvalidID, err)
    }

    exists, err := s.repo.Exists(ctx, eqID)
    if err != nil {
        return nil, err
    }
    if !exists {
        return nil, ErrNotFound
    }

    current, err := s.repo.GetByID(ctx, eqID)
    if err != nil {
        return nil, err
    }

    factoryNumber := current.FactoryNumber
    if req.FactoryNumber != nil {
        factoryNumber = *req.FactoryNumber
    }

    var inventoryNumber sql.NullString = current.InventoryNumber
    if req.InventoryNumber != nil {
        inventoryNumber = sql.NullString{String: *req.InventoryNumber, Valid: true}
    }

    manufactureYear := current.ManufactureYear
    if req.ManufactureYear != nil {
        if t, err := time.Parse("2006", *req.ManufactureYear); err == nil {
            manufactureYear = t
        }
    }

    var registrationYear sql.NullTime = current.RegistrationYear
    if req.RegistrationYear != nil {
        if t, err := time.Parse("2006", *req.RegistrationYear); err == nil {
            registrationYear = sql.NullTime{Time: t, Valid: true}
        } else {
            registrationYear = sql.NullTime{Valid: false}
        }
    }

    equipmentDictID := current.EquipmentDictionaryID
    if req.EquipmentDictionaryID != nil {
        id, err := uuid.Parse(*req.EquipmentDictionaryID)
        if err != nil {
            return nil, fmt.Errorf("%w: equipment_dictionary_id", ErrInvalidUUID)
        }
        equipmentDictID = id
    }

    organizationID := current.OrganizationID
    if req.OrganizationID != nil {
        id, err := uuid.Parse(*req.OrganizationID)
        if err != nil {
            return nil, fmt.Errorf("%w: organization_id", ErrInvalidUUID)
        }
        organizationID = id
    }

    statusID := current.StatusID
    if req.StatusID != nil {
        statusID = *req.StatusID
    }

    params := generated.UpdateEquipmentParams{
        ID:                    eqID,
        FactoryNumber:         factoryNumber,
        InventoryNumber:       inventoryNumber,
        ManufactureYear:       manufactureYear,
        RegistrationYear:      registrationYear,
        EquipmentDictionaryID: equipmentDictID,
        OrganizationID:        organizationID,
        StatusID:              statusID,
    }

    eq, err := s.repo.Update(ctx, params)
    if err != nil {
        return nil, err
    }

    return toResponse(fromUpdateRow(eq)), nil
}

func (s *equipmentService) Delete(ctx context.Context, id string) error {
    eqID, err := uuid.Parse(id)
    if err != nil {
        return fmt.Errorf("%w: %v", ErrInvalidID, err)
    }
    return s.repo.Delete(ctx, eqID)
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

    items, total, err := s.repo.List(ctx, limit, offset)
    if err != nil {
        return nil, 0, err
    }

    responses := make([]*EquipmentResponse, len(items))
    for i := range items {
        responses[i] = toResponse(fromListRow(&items[i]))
    }
    return responses, total, nil
}


type eqModel struct {
    ID                    uuid.UUID
    FactoryNumber         string
    InventoryNumber       sql.NullString
    ManufactureYear       time.Time
    RegistrationYear      sql.NullTime
    EquipmentDictionaryID uuid.UUID
    OrganizationID        uuid.UUID
    StatusID              int16
}

func fromCreateRow(r *generated.CreateEquipmentRow) eqModel {
    return eqModel{
        ID:                    r.ID,
        FactoryNumber:         r.FactoryNumber,
        InventoryNumber:       r.InventoryNumber,
        ManufactureYear:       r.ManufactureYear,
        RegistrationYear:      r.RegistrationYear,
        EquipmentDictionaryID: r.EquipmentDictionaryID,
        OrganizationID:        r.OrganizationID,
        StatusID:              r.StatusID,
    }
}

func fromListRow(r *generated.ListEquipmentRow) eqModel {
    return fromCreateRow((*generated.CreateEquipmentRow)(r))
}

func fromUpdateRow(r *generated.UpdateEquipmentRow) eqModel {
    return fromCreateRow((*generated.CreateEquipmentRow)(r))
}

func fromGetByIDRow(r *generated.GetEquipmentByIDRow) eqModel {
    return fromCreateRow((*generated.CreateEquipmentRow)(r))
}

func toResponse(m eqModel) *EquipmentResponse {
    resp := &EquipmentResponse{
        ID:                     m.ID.String(),
        FactoryNumber:          m.FactoryNumber,
        ManufactureYear:        m.ManufactureYear.Format("2006"),
        EquipmentDictionaryID:  m.EquipmentDictionaryID.String(),
        OrganizationID:         m.OrganizationID.String(),
        StatusID:               m.StatusID,
    }
    if m.InventoryNumber.Valid {
        resp.InventoryNumber = &m.InventoryNumber.String
    }
    if m.RegistrationYear.Valid {
        year := m.RegistrationYear.Time.Format("2006")
        resp.RegistrationYear = &year
    }
    return resp
}