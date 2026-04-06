package agreement

import (
    "context"
    "time"

    "github.com/google/uuid"
)

type AgreementService interface {
    Create(ctx context.Context, req CreateRequest) (*AgreementResponse, error)
    List(ctx context.Context, limit, offset int32) ([]*AgreementResponse, int64, error)
    GetByID(ctx context.Context, id string) (*AgreementResponse, error)
    Update(ctx context.Context, id string, req UpdateRequest) (*AgreementResponse, error)
    Delete(ctx context.Context, id string) error
}

type agreementService struct {
    repository AgreementRepository
}

func NewService(repository AgreementRepository) AgreementService {
    return &agreementService{repository: repository}
}

func (s *agreementService) Create(ctx context.Context, req CreateRequest) (*AgreementResponse, error) {
    id := uuid.New()

    // Парсинг UUID
    factoryID, err := uuid.Parse(req.FactoryID)
    if err != nil {
        return nil, ErrInvalidUUID
    }

    orgID, err := uuid.Parse(req.OrganizationID)
    if err != nil {
        return nil, ErrInvalidUUID
    }

    scheduleID, err := uuid.Parse(req.ScheduleID)
    if err != nil {
        return nil, ErrInvalidUUID
    }

    // Парсинг дат
    startDate, err := time.Parse("2006-01-02", req.StartDate)
    if err != nil {
        return nil, ErrInvalidDate
    }

    endDate, err := time.Parse("2006-01-02", req.EndDate)
    if err != nil {
        return nil, ErrInvalidDate
    }

    // Проверка, что end_date >= start_date
    if endDate.Before(startDate) {
        return nil, ErrInvalidDateRange
    }

    model := Agreement{
        ID:                 id,
        Source:             req.Source,
        FactoryID:          factoryID,
        OrganizationID:     orgID,
        Number:             req.Number,
        StartDate:          startDate,
        EndDate:            endDate,
        SubjectOfAgreement: req.SubjectOfAgreement,
        ScheduleID:         scheduleID,
    }

    agreement, err := s.repository.Create(ctx, model)
    if err != nil {
        return nil, err
    }

    return toResponse(agreement), nil
}

func (s *agreementService) GetByID(ctx context.Context, id string) (*AgreementResponse, error) {
    agreementID, err := uuid.Parse(id)
    if err != nil {
        return nil, ErrInvalidID
    }

    agreement, err := s.repository.GetByID(ctx, agreementID)
    if err != nil {
        return nil, err
    }

    return toResponse(agreement), nil
}

func (s *agreementService) Update(ctx context.Context, id string, req UpdateRequest) (*AgreementResponse, error) {
    agreementID, err := uuid.Parse(id)
    if err != nil {
        return nil, ErrInvalidID
    }

    current, err := s.repository.GetByID(ctx, agreementID)
    if err != nil {
        return nil, err
    }

    if req.Source != nil {
        current.Source = *req.Source
    }
    if req.FactoryID != nil {
        id, err := uuid.Parse(*req.FactoryID)
        if err != nil {
            return nil, ErrInvalidUUID
        }
        current.FactoryID = id
    }
    if req.OrganizationID != nil {
        id, err := uuid.Parse(*req.OrganizationID)
        if err != nil {
            return nil, ErrInvalidUUID
        }
        current.OrganizationID = id
    }
    if req.Number != nil {
        current.Number = *req.Number
    }
    if req.StartDate != nil {
        t, err := time.Parse("2006-01-02", *req.StartDate)
        if err != nil {
            return nil, ErrInvalidDate
        }
        current.StartDate = t
    }
    if req.EndDate != nil {
        t, err := time.Parse("2006-01-02", *req.EndDate)
        if err != nil {
            return nil, ErrInvalidDate
        }
        current.EndDate = t
    }
    if req.SubjectOfAgreement != nil {
        current.SubjectOfAgreement = *req.SubjectOfAgreement
    }
    if req.ScheduleID != nil {
        id, err := uuid.Parse(*req.ScheduleID)
        if err != nil {
            return nil, ErrInvalidUUID
        }
        current.ScheduleID = id
    }

    // Проверка, что end_date >= start_date
    if current.EndDate.Before(current.StartDate) {
        return nil, ErrInvalidDateRange
    }

    agreement, err := s.repository.Update(ctx, *current)
    if err != nil {
        return nil, err
    }

    return toResponse(agreement), nil
}

func (s *agreementService) Delete(ctx context.Context, id string) error {
    agreementID, err := uuid.Parse(id)
    if err != nil {
        return ErrInvalidID
    }
    return s.repository.Delete(ctx, agreementID)
}

func (s *agreementService) List(ctx context.Context, limit, offset int32) ([]*AgreementResponse, int64, error) {
    if limit <= 0 {
        limit = 10
    }
    if limit > 100 {
        limit = 100
    }
    if offset < 0 {
        offset = 0
    }

    items, total, err := s.repository.List(ctx, limit, offset)
    if err != nil {
        return nil, 0, err
    }

    res := make([]*AgreementResponse, len(items))
    for i := range items {
        res[i] = toResponse(&items[i])
    }

    return res, total, nil
}

func toResponse(a *Agreement) *AgreementResponse {
    return &AgreementResponse{
        ID:                 a.ID.String(),
        Source:             a.Source,
        FactoryID:          a.FactoryID.String(),
        OrganizationID:     a.OrganizationID.String(),
        Number:             a.Number,
        StartDate:          a.StartDate.Format("2006-01-02"),
        EndDate:            a.EndDate.Format("2006-01-02"),
        SubjectOfAgreement: a.SubjectOfAgreement,
        ScheduleID:         a.ScheduleID.String(),
    }
}