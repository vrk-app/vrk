package measuringinstrument

import (
    "context"
    "fmt"
    "time"

    "github.com/google/uuid"
    "github.com/jackc/pgx/v5/pgtype"

    "backend/internal/db/generated"
)

type MeasuringInstrumentRepository interface {
    Create(ctx context.Context, m MeasuringInstrument) (*MeasuringInstrument, error)
    GetByID(ctx context.Context, id uuid.UUID) (*MeasuringInstrument, error)
    Update(ctx context.Context, m MeasuringInstrument) (*MeasuringInstrument, error)
    Delete(ctx context.Context, id uuid.UUID) error
    List(ctx context.Context, limit, offset int32) ([]MeasuringInstrument, int64, error)
    Exists(ctx context.Context, id uuid.UUID) (bool, error)
}

type measuringInstrumentRepository struct {
    q *generated.Queries
}

func NewRepository(q *generated.Queries) MeasuringInstrumentRepository {
    return &measuringInstrumentRepository{q: q}
}

// Хелперы для конвертации (аналогичные организации)
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

func toNullString(s *string) pgtype.Text {
    if s == nil {
        return pgtype.Text{}
    }
    return pgtype.Text{String: *s, Valid: true}
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

func fromNullString(v pgtype.Text) *string {
    if !v.Valid {
        return nil
    }
    return &v.String
}

// mapRow преобразует строку из generated в MeasuringInstrument
func mapRow(r *generated.CreateMeasuringInstrumentRow) *MeasuringInstrument {
    return &MeasuringInstrument{
        ID:                          uuid.UUID(r.ID.Bytes),
        RegistryNumber:              r.RegistryNumber,
        MetrologicalOperationTypeID: uuid.UUID(r.MetrologicalOperationTypeID.Bytes),
        CertificateNumber:           r.CertificateNumber,
        LastOperationDate:           fromNullDate(r.LastOperationDate),
        NextOperationDate:           fromNullDate(r.NextOperationDate),
        DocumentProviderOrganization: r.DocumentProviderOrganization,
        DocumentURL:                 r.DocumentUrl,
        StandardID:                  fromNullUUID(r.StandardID),
        OrganizationID:              uuid.UUID(r.OrganizationID.Bytes),
    }
}

func (r *measuringInstrumentRepository) Create(ctx context.Context, m MeasuringInstrument) (*MeasuringInstrument, error) {
    params := generated.CreateMeasuringInstrumentParams{
        RegistryNumber:                m.RegistryNumber,
        MetrologicalOperationTypeID:   toPGUUID(m.MetrologicalOperationTypeID),
        CertificateNumber:             m.CertificateNumber,
        LastOperationDate:             toNullDate(m.LastOperationDate),
        NextOperationDate:             toNullDate(m.NextOperationDate),
        DocumentProviderOrganization:  m.DocumentProviderOrganization,
        DocumentUrl:                   m.DocumentURL,
        StandardID:                    toNullPGUUID(m.StandardID),
        OrganizationID:                toPGUUID(m.OrganizationID),
    }

    row, err := r.q.CreateMeasuringInstrument(ctx, params)
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrCreateFailed, err)
    }
    return mapRow(&row), nil
}

func (r *measuringInstrumentRepository) GetByID(ctx context.Context, id uuid.UUID) (*MeasuringInstrument, error) {
    row, err := r.q.GetMeasuringInstrumentByID(ctx, toPGUUID(id))
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrNotFound, err)
    }
    return mapRow((*generated.CreateMeasuringInstrumentRow)(&row)), nil
}

func (r *measuringInstrumentRepository) Update(ctx context.Context, m MeasuringInstrument) (*MeasuringInstrument, error) {
    params := generated.UpdateMeasuringInstrumentParams{
        ID:                          toPGUUID(m.ID),
        RegistryNumber:              m.RegistryNumber,
        MetrologicalOperationTypeID: toPGUUID(m.MetrologicalOperationTypeID),
        CertificateNumber:           m.CertificateNumber,
        LastOperationDate:           toNullDate(m.LastOperationDate),
        NextOperationDate:           toNullDate(m.NextOperationDate),
        DocumentProviderOrganization: m.DocumentProviderOrganization,
        DocumentUrl:                 m.DocumentURL,
        StandardID:                  toNullPGUUID(m.StandardID),
        OrganizationID:              toPGUUID(m.OrganizationID),
    }

    row, err := r.q.UpdateMeasuringInstrument(ctx, params)
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrUpdateFailed, err)
    }
    return mapRow((*generated.CreateMeasuringInstrumentRow)(&row)), nil
}

func (r *measuringInstrumentRepository) Delete(ctx context.Context, id uuid.UUID) error {
    return r.q.DeleteMeasuringInstrument(ctx, toPGUUID(id))
}

func (r *measuringInstrumentRepository) Exists(ctx context.Context, id uuid.UUID) (bool, error) {
    return r.q.MeasuringInstrumentExists(ctx, toPGUUID(id))
}

func (r *measuringInstrumentRepository) List(ctx context.Context, limit, offset int32) ([]MeasuringInstrument, int64, error) {
    rows, err := r.q.ListMeasuringInstruments(ctx, generated.ListMeasuringInstrumentsParams{
        Limit:  limit,
        Offset: offset,
    })
    if err != nil {
        return nil, 0, err
    }

    total, _ := r.q.CountMeasuringInstruments(ctx)

    result := make([]MeasuringInstrument, len(rows))
    for i := range rows {
        result[i] = *mapRow((*generated.CreateMeasuringInstrumentRow)(&rows[i]))
    }
    return result, total, nil
}