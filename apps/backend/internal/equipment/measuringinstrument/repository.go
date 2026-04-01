package measuringinstrument

import (
    "context"
    "fmt"

    "github.com/google/uuid"

    "backend/internal/db/generated"
)

type MeasuringInstrumentRepository interface {
    Create(ctx context.Context, params generated.CreateMeasuringInstrumentParams) (*generated.CreateMeasuringInstrumentRow, error)
    GetByID(ctx context.Context, id uuid.UUID) (*generated.GetMeasuringInstrumentByIDRow, error)
    Update(ctx context.Context, params generated.UpdateMeasuringInstrumentParams) (*generated.UpdateMeasuringInstrumentRow, error)
    Delete(ctx context.Context, id uuid.UUID) error
    List(ctx context.Context, limit, offset int32) ([]generated.ListMeasuringInstrumentsRow, int64, error)
    Exists(ctx context.Context, id uuid.UUID) (bool, error)
}

type measuringInstrumentRepository struct {
    queries *generated.Queries
}

func NewRepository(queries *generated.Queries) MeasuringInstrumentRepository {
    return &measuringInstrumentRepository{queries: queries}
}

func (r *measuringInstrumentRepository) Create(ctx context.Context, params generated.CreateMeasuringInstrumentParams) (*generated.CreateMeasuringInstrumentRow, error) {
    mi, err := r.queries.CreateMeasuringInstrument(ctx, params)
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrCreateFailed, err)
    }
    return &mi, nil
}

func (r *measuringInstrumentRepository) GetByID(ctx context.Context, id uuid.UUID) (*generated.GetMeasuringInstrumentByIDRow, error) {
    mi, err := r.queries.GetMeasuringInstrumentByID(ctx, id)
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrNotFound, err)
    }
    return &mi, nil
}

func (r *measuringInstrumentRepository) Update(ctx context.Context, params generated.UpdateMeasuringInstrumentParams) (*generated.UpdateMeasuringInstrumentRow, error) {
    mi, err := r.queries.UpdateMeasuringInstrument(ctx, params)
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrUpdateFailed, err)
    }
    return &mi, nil
}

func (r *measuringInstrumentRepository) Delete(ctx context.Context, id uuid.UUID) error {
    err := r.queries.DeleteMeasuringInstrument(ctx, id)
    if err != nil {
        return fmt.Errorf("%w: %v", ErrDeleteFailed, err)
    }
    return nil
}

func (r *measuringInstrumentRepository) List(ctx context.Context, limit, offset int32) ([]generated.ListMeasuringInstrumentsRow, int64, error) {
    items, err := r.queries.ListMeasuringInstruments(ctx, generated.ListMeasuringInstrumentsParams{
        Limit:  limit,
        Offset: offset,
    })
    if err != nil {
        return nil, 0, fmt.Errorf("%w: %v", ErrListFailed, err)
    }

    total, err := r.queries.CountMeasuringInstruments(ctx)
    if err != nil {
        return nil, 0, fmt.Errorf("%w: %v", ErrListFailed, err)
    }

    return items, total, nil
}

func (r *measuringInstrumentRepository) Exists(ctx context.Context, id uuid.UUID) (bool, error) {
    exists, err := r.queries.MeasuringInstrumentExists(ctx, id)
    if err != nil {
        return false, fmt.Errorf("%w: %v", ErrCheckExistsFailed, err)
    }
    return exists, nil
}