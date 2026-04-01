package standard

import (
    "context"
    "fmt"
    "time"

    "github.com/google/uuid"
    "github.com/jackc/pgx/v5/pgtype"

    "backend/internal/db/generated"
)

type StandardRepository interface {
    Create(ctx context.Context, m Standard) (*Standard, error)
    GetByID(ctx context.Context, id uuid.UUID) (*Standard, error)
    Update(ctx context.Context, m Standard) (*Standard, error)
    Delete(ctx context.Context, id uuid.UUID) error
    List(ctx context.Context, limit, offset int32) ([]Standard, int64, error)
    Exists(ctx context.Context, id uuid.UUID) (bool, error)
}

type standardRepository struct {
    q *generated.Queries
}

func NewRepository(q *generated.Queries) StandardRepository {
    return &standardRepository{q: q}
}

// Хелперы для конвертации
func toPGUUID(id uuid.UUID) pgtype.UUID {
    return pgtype.UUID{Bytes: id, Valid: true}
}

func toNullDate(t *time.Time) pgtype.Date {
    if t == nil {
        return pgtype.Date{}
    }
    return pgtype.Date{Time: *t, Valid: true}
}

func toNullString(s *string) pgtype.Text {
    if s == nil {
        return pgtype.Text{}
    }
    return pgtype.Text{String: *s, Valid: true}
}

func fromNullDate(v pgtype.Date) *time.Time {
    if !v.Valid {
        return nil
    }
    return &v.Time
}

func fromNullString(v pgtype.Text) *string {
    if !v.Valid {
        return nil
    }
    return &v.String
}

// mapRow преобразует строку из generated в Standard
func mapRow(r *generated.CreateStandardRow) *Standard {
    return &Standard{
        ID:                          uuid.UUID(r.ID.Bytes),
        Model:                       r.Model,
        CertificateNumber:           r.CertificateNumber,
        LastOperationDate:           fromNullDate(r.LastOperationDate),
        NextOperationDate:           fromNullDate(r.NextOperationDate),
        DocumentProviderOrganization: r.DocumentProviderOrganization,
        DocumentURL:                 r.DocumentUrl,
        MetrologicalCharacteristics: r.MetrologicalCharacteristics,
    }
}

func (r *standardRepository) Create(ctx context.Context, m Standard) (*Standard, error) {
    params := generated.CreateStandardParams{
        Model:                       m.Model,
        CertificateNumber:           m.CertificateNumber,
        LastOperationDate:           toNullDate(m.LastOperationDate),
        NextOperationDate:           toNullDate(m.NextOperationDate),
        DocumentProviderOrganization: m.DocumentProviderOrganization,
        DocumentUrl:                 m.DocumentURL,
        MetrologicalCharacteristics: m.MetrologicalCharacteristics,
    }

    row, err := r.q.CreateStandard(ctx, params)
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrCreateFailed, err)
    }
    return mapRow(&row), nil
}

func (r *standardRepository) GetByID(ctx context.Context, id uuid.UUID) (*Standard, error) {
    row, err := r.q.GetStandardByID(ctx, toPGUUID(id))
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrNotFound, err)
    }
    return mapRow((*generated.CreateStandardRow)(&row)), nil
}

func (r *standardRepository) Update(ctx context.Context, m Standard) (*Standard, error) {
    params := generated.UpdateStandardParams{
        ID:                          toPGUUID(m.ID),
        Model:                       m.Model,
        CertificateNumber:           m.CertificateNumber,
        LastOperationDate:           toNullDate(m.LastOperationDate),
        NextOperationDate:           toNullDate(m.NextOperationDate),
        DocumentProviderOrganization: m.DocumentProviderOrganization,
        DocumentUrl:                 m.DocumentURL,
        MetrologicalCharacteristics: m.MetrologicalCharacteristics,
    }

    row, err := r.q.UpdateStandard(ctx, params)
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrUpdateFailed, err)
    }
    return mapRow((*generated.CreateStandardRow)(&row)), nil
}

func (r *standardRepository) Delete(ctx context.Context, id uuid.UUID) error {
    return r.q.DeleteStandard(ctx, toPGUUID(id))
}

func (r *standardRepository) Exists(ctx context.Context, id uuid.UUID) (bool, error) {
    return r.q.StandardExists(ctx, toPGUUID(id))
}

func (r *standardRepository) List(ctx context.Context, limit, offset int32) ([]Standard, int64, error) {
    rows, err := r.q.ListStandards(ctx, generated.ListStandardsParams{
        Limit:  limit,
        Offset: offset,
    })
    if err != nil {
        return nil, 0, err
    }

    total, _ := r.q.CountStandards(ctx)

    result := make([]Standard, len(rows))
    for i := range rows {
        result[i] = *mapRow((*generated.CreateStandardRow)(&rows[i]))
    }
    return result, total, nil
}