package metrologicaltype

import (
    "context"
    "fmt"

    "backend/internal/db/generated"
)

type Repository interface {
    Create(ctx context.Context, operationType string) (*MetrologicalType, error)
    GetByID(ctx context.Context, id int64) (*MetrologicalType, error)
    Delete(ctx context.Context, id int64) error
    List(ctx context.Context, limit, offset int32) ([]*MetrologicalType, int64, error)
    Exists(ctx context.Context, id int64) (bool, error)
}

type repository struct {
    q *generated.Queries
}

func NewRepository(q *generated.Queries) Repository {
    return &repository{q: q}
}

func mapRow(row *generated.CreateMetrologicalTypeRow) *MetrologicalType {
    return &MetrologicalType{
        ID:                       int64(row.ID),
        MetrologicalOperationType: row.MetrologicalOperationType,
    }
}

func (r *repository) Create(ctx context.Context, operationType string) (*MetrologicalType, error) {
    row, err := r.q.CreateMetrologicalType(ctx, operationType)
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrCreateFailed, err)
    }
    return mapRow(&row), nil
}

func (r *repository) GetByID(ctx context.Context, id int64) (*MetrologicalType, error) {
    row, err := r.q.GetMetrologicalTypeByID(ctx, int32(id))
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrNotFound, err)
    }
    return mapRow((*generated.CreateMetrologicalTypeRow)(&row)), nil
}

func (r *repository) Delete(ctx context.Context, id int64) error {
    err := r.q.DeleteMetrologicalType(ctx, int32(id))
    if err != nil {
        return fmt.Errorf("%w: %v", ErrDeleteFailed, err)
    }
    return nil
}

func (r *repository) List(ctx context.Context, limit, offset int32) ([]*MetrologicalType, int64, error) {
    rows, err := r.q.ListMetrologicalTypes(ctx, generated.ListMetrologicalTypesParams{
        Limit:  limit,
        Offset: offset,
    })
    if err != nil {
        return nil, 0, fmt.Errorf("%w: %v", ErrListFailed, err)
    }
    total, err := r.q.CountMetrologicalTypes(ctx)
    if err != nil {
        return nil, 0, fmt.Errorf("%w: %v", ErrListFailed, err)
    }

    items := make([]*MetrologicalType, len(rows))
    for i, row := range rows {
        items[i] = mapRow((*generated.CreateMetrologicalTypeRow)(&row))
    }
    return items, total, nil
}

func (r *repository) Exists(ctx context.Context, id int64) (bool, error) {
    exists, err := r.q.MetrologicalTypeExists(ctx, int32(id))
    if err != nil {
        return false, fmt.Errorf("%w: %v", ErrListFailed, err)
    }
    return exists, nil
}
