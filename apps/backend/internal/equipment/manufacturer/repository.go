package manufacturer

import (
    "context"
    "fmt"

    "github.com/google/uuid"
    "github.com/jackc/pgx/v5/pgtype"

    "backend/internal/db/generated"
)

type ManufacturerRepository interface {
    Create(ctx context.Context, m Manufacturer) (*Manufacturer, error)
    GetByID(ctx context.Context, id uuid.UUID) (*Manufacturer, error)
    Update(ctx context.Context, m Manufacturer) (*Manufacturer, error)
    Delete(ctx context.Context, id uuid.UUID) error
    List(ctx context.Context, limit, offset int32) ([]Manufacturer, int64, error)
    Exists(ctx context.Context, id uuid.UUID) (bool, error)
}

type manufacturerRepository struct {
    q *generated.Queries
}

func NewRepository(q *generated.Queries) ManufacturerRepository {
    return &manufacturerRepository{q: q}
}

// Хелперы (можно вынести в общий пакет, но для простоты оставим здесь)
func toPGUUID(id uuid.UUID) pgtype.UUID {
    return pgtype.UUID{Bytes: id, Valid: true}
}

func mapRow(r *generated.CreateManufacturerRow) *Manufacturer {
    return &Manufacturer{
        ID:              uuid.UUID(r.ID.Bytes),
        Name:            r.Name,
        ClassificationID: r.ClassificationID,
    }
}

func (r *manufacturerRepository) Create(ctx context.Context, m Manufacturer) (*Manufacturer, error) {
    params := generated.CreateManufacturerParams{
        Name:            m.Name,
        ClassificationID: m.ClassificationID,
    }
    row, err := r.q.CreateManufacturer(ctx, params)
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrCreateFailed, err)
    }
    return mapRow(&row), nil
}

func (r *manufacturerRepository) GetByID(ctx context.Context, id uuid.UUID) (*Manufacturer, error) {
    row, err := r.q.GetManufacturerByID(ctx, toPGUUID(id))
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrNotFound, err)
    }
    return mapRow((*generated.CreateManufacturerRow)(&row)), nil
}

func (r *manufacturerRepository) Update(ctx context.Context, m Manufacturer) (*Manufacturer, error) {
    params := generated.UpdateManufacturerParams{
        ID:              toPGUUID(m.ID),
        Name:            m.Name,
        ClassificationID: m.ClassificationID,
    }
    row, err := r.q.UpdateManufacturer(ctx, params)
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrUpdateFailed, err)
    }
    return mapRow((*generated.CreateManufacturerRow)(&row)), nil
}

func (r *manufacturerRepository) Delete(ctx context.Context, id uuid.UUID) error {
    err := r.q.DeleteManufacturer(ctx, toPGUUID(id))
    if err != nil {
        return fmt.Errorf("%w: %v", ErrDeleteFailed, err)
    }
    return nil
}

func (r *manufacturerRepository) Exists(ctx context.Context, id uuid.UUID) (bool, error) {
    exists, err := r.q.ManufacturerExists(ctx, toPGUUID(id))
    if err != nil {
        return false, fmt.Errorf("%w: %v", ErrCheckExistsFailed, err)
    }
    return exists, nil
}

func (r *manufacturerRepository) List(ctx context.Context, limit, offset int32) ([]Manufacturer, int64, error) {
    rows, err := r.q.ListManufacturers(ctx, generated.ListManufacturersParams{
        Limit:  limit,
        Offset: offset,
    })
    if err != nil {
        return nil, 0, fmt.Errorf("%w: %v", ErrListFailed, err)
    }
    total, _ := r.q.CountManufacturers(ctx)

    result := make([]Manufacturer, len(rows))
    for i := range rows {
        result[i] = *mapRow((*generated.CreateManufacturerRow)(&rows[i]))
    }
    return result, total, nil
}
