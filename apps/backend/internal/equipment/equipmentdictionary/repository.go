package equipmentdictionary

import (
    "context"
    "fmt"

    "github.com/google/uuid"
    "github.com/jackc/pgx/v5/pgtype"

    "backend/internal/db/generated"
)

type Repository interface {
    // Equipment dictionary
    CreateEquipmentDict(ctx context.Context, fullName, model string, midID *uuid.UUID) (*EquipmentDictionaryWithDetails, error)
    GetEquipmentDictByID(ctx context.Context, id uuid.UUID) (*EquipmentDictionaryWithDetails, error)
    UpdateEquipmentDict(ctx context.Context, id uuid.UUID, fullName, model string, midID *uuid.UUID) (*EquipmentDictionaryWithDetails, error)
    DeleteEquipmentDict(ctx context.Context, id uuid.UUID) error
    ListEquipmentDicts(ctx context.Context, limit, offset int32) ([]*EquipmentDictionary, int64, error)
    ExistsEquipmentDict(ctx context.Context, id uuid.UUID) (bool, error)

    // Measuring instrument dictionary
    CreateMID(ctx context.Context, registryNumber string, metrologicalTypeID int32) (*MeasuringInstrumentsDictionary, error)
    GetMIDByID(ctx context.Context, id uuid.UUID) (*MeasuringInstrumentsDictionary, error)
    UpdateMID(ctx context.Context, id uuid.UUID, registryNumber string, metrologicalTypeID int32) error
    DeleteMID(ctx context.Context, id uuid.UUID) error
    ExistsMIDByRegistryNumber(ctx context.Context, registryNumber string) (bool, error)

    // Standard dictionary
    CreateStandardsDict(ctx context.Context, midID uuid.UUID, model string) (*StandardsDictionary, error)
    ListStandardsByMID(ctx context.Context, mid uuid.UUID) ([]*StandardsDictionary, error)
    DeleteStandardsByMID(ctx context.Context, mid uuid.UUID) error
    DeleteStandardsDict(ctx context.Context, id uuid.UUID) error
}

type repository struct {
    q *generated.Queries
}

func NewRepository(q *generated.Queries) Repository {
    return &repository{q: q}
}

// ---------- helpers ----------
func toPGUUID(id uuid.UUID) pgtype.UUID {
    return pgtype.UUID{Bytes: id, Valid: true}
}

func toNullPGUUID(id *uuid.UUID) pgtype.UUID {
    if id == nil {
        return pgtype.UUID{}
    }
    return pgtype.UUID{Bytes: *id, Valid: true}
}

func fromNullUUID(v pgtype.UUID) *uuid.UUID {
    if !v.Valid {
        return nil
    }
    id := uuid.UUID(v.Bytes)
    return &id
}

// ---------- маппинг row → модель ----------
func mapEquipmentDict(row *generated.GetEquipmentDictionaryByIDRow) *EquipmentDictionary {
    return &EquipmentDictionary{
        ID:                               uuid.UUID(row.ID.Bytes),
        FullName:                         row.FullName,
        Model:                            row.Model,
        MeasuringInstrumentsDictionaryID: fromNullUUID(row.MeasuringInstrumentsDictionaryID),
    }
}

func mapMID(row *generated.CreateMeasuringInstrumentsDictionaryRow) *MeasuringInstrumentsDictionary {
    return &MeasuringInstrumentsDictionary{
        ID:                           uuid.UUID(row.ID.Bytes),
        RegistryNumber:               row.RegistryNumber,
        MetrologicalOperationTypeID:  row.MetrologicalOperationTypeID,
    }
}

func mapStandardDict(row *generated.CreateStandardsDictionaryRow) *StandardsDictionary {
    return &StandardsDictionary{
        ID:                           uuid.UUID(row.ID.Bytes),
        MeasuringInstrumentsDictionaryID: uuid.UUID(row.MeasuringInstrumentsDictionaryID.Bytes),
        Model:                        row.Model,
    }
}

// ---------- реализация Equipment dictionary ----------
func (r *repository) CreateEquipmentDict(ctx context.Context, fullName, model string, midID *uuid.UUID) (*EquipmentDictionaryWithDetails, error) {
    params := generated.CreateEquipmentDictionaryParams{
        FullName:                         fullName,
        Model:                            model,
        MeasuringInstrumentsDictionaryID: toNullPGUUID(midID),
    }
    row, err := r.q.CreateEquipmentDictionary(ctx, params)
    if err != nil {
        return nil, fmt.Errorf("failed to create equipment dict: %w", err)
    }
    return r.getFullByID(ctx, row.ID)
}

func (r *repository) UpdateEquipmentDict(ctx context.Context, id uuid.UUID, fullName, model string, midID *uuid.UUID) (*EquipmentDictionaryWithDetails, error) {
    params := generated.UpdateEquipmentDictionaryParams{
        ID:                               toPGUUID(id),
        FullName:                         fullName,
        Model:                            model,
        MeasuringInstrumentsDictionaryID: toNullPGUUID(midID),
    }
    row, err := r.q.UpdateEquipmentDictionary(ctx, params)
    if err != nil {
        return nil, fmt.Errorf("failed to update equipment dict: %w", err)
    }
    return r.getFullByID(ctx, row.ID)
}

func (r *repository) DeleteEquipmentDict(ctx context.Context, id uuid.UUID) error {
    err := r.q.DeleteEquipmentDictionary(ctx, toPGUUID(id))
    if err != nil {
        return fmt.Errorf("failed to delete equipment dict: %w", err)
    }
    return nil
}

func (r *repository) ListEquipmentDicts(ctx context.Context, limit, offset int32) ([]*EquipmentDictionary, int64, error) {
    rows, err := r.q.ListEquipmentDictionaries(ctx, generated.ListEquipmentDictionariesParams{
        Limit:  limit,
        Offset: offset,
    })
    if err != nil {
        return nil, 0, fmt.Errorf("failed to list equipment dicts: %w", err)
    }
    total, err := r.q.CountEquipmentDictionaries(ctx)
    if err != nil {
        return nil, 0, fmt.Errorf("failed to count equipment dicts: %w", err)
    }
    items := make([]*EquipmentDictionary, len(rows))
    for i := range rows {
        items[i] = mapEquipmentDict((*generated.GetEquipmentDictionaryByIDRow)(&rows[i]))
    }
    return items, total, nil
}

func (r *repository) ExistsEquipmentDict(ctx context.Context, id uuid.UUID) (bool, error) {
    exists, err := r.q.EquipmentDictionaryExists(ctx, toPGUUID(id))
    if err != nil {
        return false, fmt.Errorf("failed to check existence: %w", err)
    }
    return exists, nil
}

func (r *repository) getFullByID(ctx context.Context, id pgtype.UUID) (*EquipmentDictionaryWithDetails, error) {
    row, err := r.q.GetEquipmentDictionaryByID(ctx, id)
    if err != nil {
        return nil, err
    }
    return &EquipmentDictionaryWithDetails{
        ID:                         uuid.UUID(row.ID.Bytes),
        FullName:                   row.FullName,
        Model:                      row.Model,
        MeasuringInstrumentsDictionaryID: fromNullUUID(row.MeasuringInstrumentsDictionaryID),
        RegistryNumber:             row.RegistryNumber,
        MetrologicalOperationTypeID: row.MetrologicalOperationTypeID,
        MetrologicalOperationType:  row.MetrologicalOperationType,
    }, nil
}

func (r *repository) GetEquipmentDictByID(ctx context.Context, id uuid.UUID) (*EquipmentDictionaryWithDetails, error) {
    return r.getFullByID(ctx, toPGUUID(id))
}

// ---------- Measuring instrument dictionary ----------
func (r *repository) CreateMID(ctx context.Context, registryNumber string, metrologicalTypeID int32) (*MeasuringInstrumentsDictionary, error) {
    params := generated.CreateMeasuringInstrumentsDictionaryParams{
        RegistryNumber:             registryNumber,
        MetrologicalOperationTypeID: metrologicalTypeID,
    }
    row, err := r.q.CreateMeasuringInstrumentsDictionary(ctx, params)
    if err != nil {
        return nil, fmt.Errorf("failed to create MID: %w", err)
    }
    return mapMID(&row), nil
}

func (r *repository) GetMIDByID(ctx context.Context, id uuid.UUID) (*MeasuringInstrumentsDictionary, error) {
    row, err := r.q.GetMeasuringInstrumentsDictionaryByID(ctx, toPGUUID(id))
    if err != nil {
        return nil, fmt.Errorf("failed to get MID: %w", err)
    }
    return mapMID((*generated.CreateMeasuringInstrumentsDictionaryRow)(&row)), nil
}

func (r *repository) UpdateMID(ctx context.Context, id uuid.UUID, registryNumber string, metrologicalTypeID int32) error {
    params := generated.UpdateMeasuringInstrumentsDictionaryParams{
        ID:                         toPGUUID(id),
        RegistryNumber:             registryNumber,
        MetrologicalOperationTypeID: metrologicalTypeID,
    }
    _, err := r.q.UpdateMeasuringInstrumentsDictionary(ctx, params)
    if err != nil {
        return fmt.Errorf("failed to update MID: %w", err)
    }
    return nil
}

func (r *repository) DeleteMID(ctx context.Context, id uuid.UUID) error {
    err := r.q.DeleteMeasuringInstrumentsDictionary(ctx, toPGUUID(id))
    if err != nil {
        return fmt.Errorf("failed to delete MID: %w", err)
    }
    return nil
}

func (r *repository) ExistsMIDByRegistryNumber(ctx context.Context, registryNumber string) (bool, error) {
    exists, err := r.q.ExistsMIDByRegistryNumber(ctx, registryNumber)
    if err != nil {
        return false, fmt.Errorf("failed to check registry number: %w", err)
    }
    return exists, nil
}

// ---------- Standard dictionary ----------
func (r *repository) CreateStandardsDict(ctx context.Context, midID uuid.UUID, model string) (*StandardsDictionary, error) {
    params := generated.CreateStandardsDictionaryParams{
        MeasuringInstrumentsDictionaryID: toPGUUID(midID),
        Model:                            model,
    }
    row, err := r.q.CreateStandardsDictionary(ctx, params)
    if err != nil {
        return nil, fmt.Errorf("failed to create standard dict: %w", err)
    }
    return mapStandardDict(&row), nil
}

func (r *repository) ListStandardsByMID(ctx context.Context, mid uuid.UUID) ([]*StandardsDictionary, error) {
    rows, err := r.q.ListStandardsDictionariesByMID(ctx, toPGUUID(mid))
    if err != nil {
        return nil, fmt.Errorf("failed to list standards: %w", err)
    }
    items := make([]*StandardsDictionary, len(rows))
    for i := range rows {
        items[i] = mapStandardDict((*generated.CreateStandardsDictionaryRow)(&rows[i]))
    }
    return items, nil
}

func (r *repository) DeleteStandardsByMID(ctx context.Context, mid uuid.UUID) error {
    err := r.q.DeleteStandardsDictionariesByMID(ctx, toPGUUID(mid))
    if err != nil {
        return fmt.Errorf("failed to delete standards by MID: %w", err)
    }
    return nil
}

func (r *repository) DeleteStandardsDict(ctx context.Context, id uuid.UUID) error {
    err := r.q.DeleteStandardsDictionary(ctx, toPGUUID(id))
    if err != nil {
        return fmt.Errorf("failed to delete standard dict: %w", err)
    }
    return nil
}