package equipment

import (
    "context"
    "fmt"

    "github.com/google/uuid"

    "backend/internal/db/generated"
)

type EquipmentRepository interface {
    Create(ctx context.Context, params generated.CreateEquipmentParams) (*generated.CreateEquipmentRow, error)
    GetByID(ctx context.Context, id uuid.UUID) (*generated.GetEquipmentByIDRow, error)
    Update(ctx context.Context, params generated.UpdateEquipmentParams) (*generated.UpdateEquipmentRow, error)
    Delete(ctx context.Context, id uuid.UUID) error
    List(ctx context.Context, limit, offset int32) ([]generated.ListEquipmentRow, int64, error)
    Exists(ctx context.Context, id uuid.UUID) (bool, error)
}

type equipmentRepository struct {
    queries *generated.Queries
}

func NewRepository(queries *generated.Queries) EquipmentRepository {
    return &equipmentRepository{queries: queries}
}

func (r *equipmentRepository) Create(ctx context.Context, params generated.CreateEquipmentParams) (*generated.CreateEquipmentRow, error) {
    eq, err := r.queries.CreateEquipment(ctx, params)
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrCreateFailed, err)
    }
    return &eq, nil
}

func (r *equipmentRepository) GetByID(ctx context.Context, id uuid.UUID) (*generated.GetEquipmentByIDRow, error) {
    eq, err := r.queries.GetEquipmentByID(ctx, id)
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrNotFound, err)
    }
    return &eq, nil
}

func (r *equipmentRepository) Update(ctx context.Context, params generated.UpdateEquipmentParams) (*generated.UpdateEquipmentRow, error) {
    eq, err := r.queries.UpdateEquipment(ctx, params)
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrUpdateFailed, err)
    }
    return &eq, nil
}

func (r *equipmentRepository) Delete(ctx context.Context, id uuid.UUID) error {
    err := r.queries.DeleteEquipment(ctx, id)
    if err != nil {
        return fmt.Errorf("%w: %v", ErrDeleteFailed, err)
    }
    return nil
}

func (r *equipmentRepository) List(ctx context.Context, limit, offset int32) ([]generated.ListEquipmentRow, int64, error) {
    items, err := r.queries.ListEquipment(ctx, generated.ListEquipmentParams{
        Limit:  limit,
        Offset: offset,
    })
    if err != nil {
        return nil, 0, fmt.Errorf("%w: %v", ErrListFailed, err)
    }

    total, err := r.queries.CountEquipment(ctx)
    if err != nil {
        return nil, 0, fmt.Errorf("%w: %v", ErrListFailed, err)
    }

    return items, total, nil
}

func (r *equipmentRepository) Exists(ctx context.Context, id uuid.UUID) (bool, error) {
    exists, err := r.queries.EquipmentExists(ctx, id)
    if err != nil {
        return false, fmt.Errorf("%w: %v", ErrCheckExistsFailed, err)
    }
    return exists, nil
}