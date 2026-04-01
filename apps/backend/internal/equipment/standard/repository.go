package standard

import (
    "context"
    "fmt"

    "github.com/google/uuid"

    "backend/internal/db/generated"
)

type StandardRepository interface {
    Create(ctx context.Context, params generated.CreateStandardParams) (*generated.CreateStandardRow, error)
    GetByID(ctx context.Context, id uuid.UUID) (*generated.GetStandardByIDRow, error)
    Update(ctx context.Context, params generated.UpdateStandardParams) (*generated.UpdateStandardRow, error)
    Delete(ctx context.Context, id uuid.UUID) error
    List(ctx context.Context, limit, offset int32) ([]generated.ListStandardsRow, int64, error)
    Exists(ctx context.Context, id uuid.UUID) (bool, error)
}

type standardRepository struct {
    queries *generated.Queries
}

func NewRepository(queries *generated.Queries) StandardRepository {
    return &standardRepository{queries: queries}
}

func (r *standardRepository) Create(ctx context.Context, params generated.CreateStandardParams) (*generated.CreateStandardRow, error) {
    s, err := r.queries.CreateStandard(ctx, params)
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrCreateFailed, err)
    }
    return &s, nil
}

func (r *standardRepository) GetByID(ctx context.Context, id uuid.UUID) (*generated.GetStandardByIDRow, error) {
    s, err := r.queries.GetStandardByID(ctx, id)
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrNotFound, err)
    }
    return &s, nil
}

func (r *standardRepository) Update(ctx context.Context, params generated.UpdateStandardParams) (*generated.UpdateStandardRow, error) {
    s, err := r.queries.UpdateStandard(ctx, params)
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrUpdateFailed, err)
    }
    return &s, nil
}

func (r *standardRepository) Delete(ctx context.Context, id uuid.UUID) error {
    err := r.queries.DeleteStandard(ctx, id)
    if err != nil {
        return fmt.Errorf("%w: %v", ErrDeleteFailed, err)
    }
    return nil
}

func (r *standardRepository) List(ctx context.Context, limit, offset int32) ([]generated.ListStandardsRow, int64, error) {
    items, err := r.queries.ListStandards(ctx, generated.ListStandardsParams{
        Limit:  limit,
        Offset: offset,
    })
    if err != nil {
        return nil, 0, fmt.Errorf("%w: %v", ErrListFailed, err)
    }

    total, err := r.queries.CountStandards(ctx)
    if err != nil {
        return nil, 0, fmt.Errorf("%w: %v", ErrListFailed, err)
    }

    return items, total, nil
}

func (r *standardRepository) Exists(ctx context.Context, id uuid.UUID) (bool, error) {
    exists, err := r.queries.StandardExists(ctx, id)
    if err != nil {
        return false, fmt.Errorf("%w: %v", ErrCheckExistsFailed, err)
    }
    return exists, nil
}