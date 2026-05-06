package usageclassification

import (
    "context"
    "fmt"
    "errors"

    "github.com/jackc/pgx/v5"
    "backend/internal/db/generated"
)

type Repository interface {
    Create(ctx context.Context, classification string) (*UsageClassification, error)
    GetByID(ctx context.Context, id int64) (*UsageClassification, error)
    GetByClassification(ctx context.Context, classification string) (*UsageClassification, error)
    Delete(ctx context.Context, id int64) error
    List(ctx context.Context, limit, offset int32) ([]*UsageClassification, int64, error)
    Exists(ctx context.Context, id int64) (bool, error)
}

type repository struct {
    q *generated.Queries
}

func NewRepository(q *generated.Queries) Repository {
    return &repository{q: q}
}

func mapRow(row *generated.CreateUsageClassificationRow) *UsageClassification {
    return &UsageClassification{
        ID:            row.ID,
        Classification: row.Classification,
    }
}

func (r *repository) Create(ctx context.Context, classification string) (*UsageClassification, error) {
    row, err := r.q.CreateUsageClassification(ctx, classification)
    if err != nil {
        return nil, fmt.Errorf("failed to create usage classification: %w", err)
    }
    return mapRow(&row), nil
}

func (r *repository) GetByID(ctx context.Context, id int64) (*UsageClassification, error) {
    row, err := r.q.GetUsageClassificationByID(ctx, int32(id))
    if err != nil {
        return nil, fmt.Errorf("usage classification not found: %w", err)
    }
    return mapRow((*generated.CreateUsageClassificationRow)(&row)), nil
}

func (r *repository) Delete(ctx context.Context, id int64) error {
    err := r.q.DeleteUsageClassification(ctx, int32(id))
    if err != nil {
        return fmt.Errorf("failed to delete usage classification: %w", err)
    }
    return nil
}

func (r *repository) List(ctx context.Context, limit, offset int32) ([]*UsageClassification, int64, error) {
    rows, err := r.q.ListUsageClassifications(ctx, generated.ListUsageClassificationsParams{
        Limit:  limit,
        Offset: offset,
    })
    if err != nil {
        return nil, 0, fmt.Errorf("failed to list: %w", err)
    }
    total, err := r.q.CountUsageClassifications(ctx)
    if err != nil {
        return nil, 0, fmt.Errorf("failed to count: %w", err)
    }
    items := make([]*UsageClassification, len(rows))
    for i, row := range rows {
        items[i] = mapRow((*generated.CreateUsageClassificationRow)(&row))
    }
    return items, total, nil
}

func (r *repository) Exists(ctx context.Context, id int64) (bool, error) {
    return r.q.UsageClassificationExists(ctx, int32(id))
}

func (r *repository) GetByClassification(ctx context.Context, classification string) (*UsageClassification, error) {
    row, err := r.q.GetUsageClassificationByClassification(ctx, classification)
    if err != nil {
        if errors.Is(err, pgx.ErrNoRows) {
            return nil, nil
        }
        return nil, fmt.Errorf("failed to get classification by name: %w", err)
    }
    return mapRow((*generated.CreateUsageClassificationRow)(&row)), nil
}
