package equipment

import (
    "context"
    "fmt"
    "time"

    "github.com/google/uuid"
    "github.com/jackc/pgx/v5/pgtype"

    "backend/internal/db/generated"
)

type EquipmentRepository interface {
    Create(ctx context.Context, m Equipment) (*Equipment, error)
    GetByID(ctx context.Context, id uuid.UUID) (*EquipmentWithDetails, error)
    Update(ctx context.Context, m Equipment) (*Equipment, error)
    Delete(ctx context.Context, id uuid.UUID) error
    List(ctx context.Context, limit, offset int32) ([]EquipmentWithDetails, int64, error)
    Exists(ctx context.Context, id uuid.UUID) (bool, error)
}

type equipmentRepository struct {
    q *generated.Queries
}

func NewRepository(q *generated.Queries) EquipmentRepository {
    return &equipmentRepository{q: q}
}

func toPGUUID(id uuid.UUID) pgtype.UUID {
    return pgtype.UUID{Bytes: id, Valid: true}
}

func toNullPGUUID(id *uuid.UUID) pgtype.UUID {
    if id == nil {
        return pgtype.UUID{}
    }
    return pgtype.UUID{Bytes: *id, Valid: true}
}

func toNullDate(t *time.Time) pgtype.Date {
    if t == nil {
        return pgtype.Date{}
    }
    return pgtype.Date{Time: *t, Valid: true}
}

func fromNullUUID(v pgtype.UUID) *uuid.UUID {
    if !v.Valid {
        return nil
    }
    id := uuid.UUID(v.Bytes)
    return &id
}

func fromNullDate(v pgtype.Date) *time.Time {
    if !v.Valid {
        return nil
    }
    return &v.Time
}


func mapRow(r *generated.CreateEquipmentRow) *Equipment {
    return &Equipment{
        ID:                    uuid.UUID(r.ID.Bytes),
        FactoryNumber:         r.FactoryNumber,
        InventoryNumber:       r.InventoryNumber,
        ManufactureYear:       r.ManufactureYear.Time,
        RegistrationYear:      fromNullDate(r.RegistrationYear),
        EquipmentDictionaryID: uuid.UUID(r.EquipmentDictionaryID.Bytes),
        OrganizationID:        uuid.UUID(r.OrganizationID.Bytes),
        StatusID:              r.StatusID,      
    }
}
func mapRowWithDetails(r *generated.GetEquipmentByIDRow) *EquipmentWithDetails {
    equipmentName := ""
    if r.EquipmentName != nil {
        equipmentName = *r.EquipmentName
    }
    model := ""
    if r.Model != nil {
        model = *r.Model
    }
    manufacturer := ""
    if r.Manufacturer != nil {
        manufacturer = *r.Manufacturer
    }
    usageClassification := ""
    if r.UsageClassification != nil {
        usageClassification = *r.UsageClassification
    }
    organizationName := ""
    if r.OrganizationName != nil {
        organizationName = *r.OrganizationName
    }
    statusName := ""
    if r.StatusName != nil {
        statusName = *r.StatusName
    }

    return &EquipmentWithDetails{
        ID:                    uuid.UUID(r.ID.Bytes),
        FactoryNumber:         r.FactoryNumber,
        InventoryNumber:       r.InventoryNumber,
        ManufactureYear:       r.ManufactureYear.Time,
        RegistrationYear:      fromNullDate(r.RegistrationYear),
        EquipmentDictionaryID: uuid.UUID(r.EquipmentDictionaryID.Bytes),
        EquipmentName:         equipmentName,
        Model:                 model,
        Manufacturer:          manufacturer,
        UsageClassification:   usageClassification,
        OrganizationID:        uuid.UUID(r.OrganizationID.Bytes),
        OrganizationName:      organizationName,
        StatusID:              r.StatusID,
        StatusName:            statusName,
    }
}

func (r *equipmentRepository) Create(ctx context.Context, m Equipment) (*Equipment, error) {
    params := generated.CreateEquipmentParams{
        FactoryNumber:         m.FactoryNumber,
        InventoryNumber:       m.InventoryNumber,
        ManufactureYear:       pgtype.Date{Time: m.ManufactureYear, Valid: true},
        RegistrationYear:      toNullDate(m.RegistrationYear),
        EquipmentDictionaryID: toPGUUID(m.EquipmentDictionaryID),
        OrganizationID:        toPGUUID(m.OrganizationID),
        StatusID:              m.StatusID,
    }

    row, err := r.q.CreateEquipment(ctx, params)
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrCreateFailed, err)
    }
    return mapRow(&row), nil
}

func (r *equipmentRepository) GetByID(ctx context.Context, id uuid.UUID) (*EquipmentWithDetails, error) {
    row, err := r.q.GetEquipmentByID(ctx, toPGUUID(id))
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrNotFound, err)
    }
    return mapRowWithDetails(&row), nil
}

func (r *equipmentRepository) Update(ctx context.Context, m Equipment) (*Equipment, error) {
    params := generated.UpdateEquipmentParams{
        ID:                    toPGUUID(m.ID),
        FactoryNumber:         m.FactoryNumber,
        InventoryNumber:       m.InventoryNumber,
        ManufactureYear:       pgtype.Date{Time: m.ManufactureYear, Valid: true},
        RegistrationYear:      toNullDate(m.RegistrationYear),
        EquipmentDictionaryID: toPGUUID(m.EquipmentDictionaryID),
        OrganizationID:        toPGUUID(m.OrganizationID),
        StatusID:              m.StatusID,
    }

    row, err := r.q.UpdateEquipment(ctx, params)
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrUpdateFailed, err)
    }
    return mapRow((*generated.CreateEquipmentRow)(&row)), nil
}

func (r *equipmentRepository) Delete(ctx context.Context, id uuid.UUID) error {
    return r.q.DeleteEquipment(ctx, toPGUUID(id))
}

func (r *equipmentRepository) Exists(ctx context.Context, id uuid.UUID) (bool, error) {
    return r.q.EquipmentExists(ctx, toPGUUID(id))
}

func (r *equipmentRepository) List(ctx context.Context, limit, offset int32) ([]EquipmentWithDetails, int64, error) {
    rows, err := r.q.ListEquipment(ctx, generated.ListEquipmentParams{
        Limit:  limit,
        Offset: offset,
    })
    if err != nil {
        return nil, 0, err
    }

    total, _ := r.q.CountEquipment(ctx)

    result := make([]EquipmentWithDetails, len(rows))
    for i := range rows {
        result[i] = *mapRowWithDetails((*generated.GetEquipmentByIDRow)(&rows[i]))
    }
    return result, total, nil
}