package agreement

import (
    "context"
    "fmt"

    "github.com/google/uuid"
    "github.com/jackc/pgx/v5/pgtype"

    "backend/internal/db/generated"
)

type AgreementRepository interface {
    Create(ctx context.Context, m Agreement) (*Agreement, error)
    GetByID(ctx context.Context, id uuid.UUID) (*Agreement, error)
    Update(ctx context.Context, m Agreement) (*Agreement, error)
    Delete(ctx context.Context, id uuid.UUID) error
    List(ctx context.Context, limit, offset int32) ([]Agreement, int64, error)
    Exists(ctx context.Context, id uuid.UUID) (bool, error)
}

type agreementRepository struct {
    q *generated.Queries
}

func NewRepository(q *generated.Queries) AgreementRepository {
    return &agreementRepository{q: q}
}
      
func toPGUUID(id uuid.UUID) pgtype.UUID {
    return pgtype.UUID{Bytes: id, Valid: true}
}

func toPGNumeric(n int64) pgtype.Numeric {
    var num pgtype.Numeric
    num.Scan(n)
    return num
}

func fromPGNumeric(num pgtype.Numeric) int64 {
    var n int64
    num.Scan(&n)
    return n
}


func mapRow(r *generated.CreateAgreementRow) *Agreement {
    return &Agreement{
        ID:                 uuid.UUID(r.ID.Bytes),
        Source:             r.Source,
        FactoryID:          uuid.UUID(r.FactoryID.Bytes),
        OrganizationID:     uuid.UUID(r.OrganizationID.Bytes),
        Number:             fromPGNumeric(r.Number),
        StartDate:          r.StartDate.Time,
        EndDate:            r.EndDate.Time,
        SubjectOfAgreement: r.SubjectOfAgreement,
        ScheduleID:         uuid.UUID(r.ScheduleID.Bytes),
    }
}

func (r *agreementRepository) Create(ctx context.Context, m Agreement) (*Agreement, error) {
    params := generated.CreateAgreementParams{
        Source:             m.Source,
        FactoryID:          toPGUUID(m.FactoryID),
        OrganizationID:     toPGUUID(m.OrganizationID),
        Number:             toPGNumeric(m.Number),
        StartDate:          pgtype.Date{Time: m.StartDate, Valid: true},
        EndDate:            pgtype.Date{Time: m.EndDate, Valid: true},
        SubjectOfAgreement: m.SubjectOfAgreement,
        ScheduleID:         toPGUUID(m.ScheduleID),
    }

    row, err := r.q.CreateAgreement(ctx, params)
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrCreateFailed, err)
    }
    return mapRow(&row), nil
}

func (r *agreementRepository) GetByID(ctx context.Context, id uuid.UUID) (*Agreement, error) {
    row, err := r.q.GetAgreementByID(ctx, toPGUUID(id))
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrNotFound, err)
    }
    return mapRow((*generated.CreateAgreementRow)(&row)), nil
}

func (r *agreementRepository) Update(ctx context.Context, m Agreement) (*Agreement, error) {
    params := generated.UpdateAgreementParams{
        ID:                 toPGUUID(m.ID),
        Source:             m.Source,
        FactoryID:          toPGUUID(m.FactoryID),
        OrganizationID:     toPGUUID(m.OrganizationID),
        Number:             toPGNumeric(m.Number),
        StartDate:          pgtype.Date{Time: m.StartDate, Valid: true},
        EndDate:            pgtype.Date{Time: m.EndDate, Valid: true},
        SubjectOfAgreement: m.SubjectOfAgreement,
        ScheduleID:         toPGUUID(m.ScheduleID),
    }

    row, err := r.q.UpdateAgreement(ctx, params)
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrUpdateFailed, err)
    }
    return mapRow((*generated.CreateAgreementRow)(&row)), nil
}

func (r *agreementRepository) Delete(ctx context.Context, id uuid.UUID) error {
    return r.q.DeleteAgreement(ctx, toPGUUID(id))
}

func (r *agreementRepository) Exists(ctx context.Context, id uuid.UUID) (bool, error) {
    return r.q.AgreementExists(ctx, toPGUUID(id))
}

func (r *agreementRepository) List(ctx context.Context, limit, offset int32) ([]Agreement, int64, error) {
    rows, err := r.q.ListAgreements(ctx, generated.ListAgreementsParams{
        Limit:  limit,
        Offset: offset,
    })
    if err != nil {
        return nil, 0, err
    }

    total, _ := r.q.CountAgreements(ctx)

    result := make([]Agreement, len(rows))
    for i := range rows {
        result[i] = *mapRow((*generated.CreateAgreementRow)(&rows[i]))
    }
    return result, total, nil
}