package measuringinstrument

import (
    "context"
    "time"

    "github.com/google/uuid"
)

type MeasuringInstrumentService interface {
    Create(ctx context.Context, req CreateRequest) (*MeasuringInstrumentResponse, error)
    List(ctx context.Context, limit, offset int32) ([]*MeasuringInstrumentResponse, int64, error)
    GetByID(ctx context.Context, id string) (*MeasuringInstrumentResponse, error)
    Update(ctx context.Context, id string, req UpdateRequest) (*MeasuringInstrumentResponse, error)
    Delete(ctx context.Context, id string) error
}

type measuringInstrumentService struct {
    repository MeasuringInstrumentRepository
}

func NewService(repository MeasuringInstrumentRepository) MeasuringInstrumentService {
    return &measuringInstrumentService{repository: repository}
}

func (s *measuringInstrumentService) Create(ctx context.Context, req CreateRequest) (*MeasuringInstrumentResponse, error) {
    id := uuid.New()

    // Парсинг UUID
    metrologicalTypeID, err := uuid.Parse(req.MetrologicalOperationTypeID)
    if err != nil {
        return nil, ErrInvalidUUID
    }
    orgID, err := uuid.Parse(req.OrganizationID)
    if err != nil {
        return nil, ErrInvalidUUID
    }

    // standard_id (опционально)
    var standardID *uuid.UUID
    if req.StandardID != nil && *req.StandardID != "" {
        sid, err := uuid.Parse(*req.StandardID)
        if err != nil {
            return nil, ErrInvalidUUID
        }
        standardID = &sid
    }

    // Даты
    var lastOpDate, nextOpDate *time.Time
    if req.LastOperationDate != nil && *req.LastOperationDate != "" {
        t, err := time.Parse("2006-01-02", *req.LastOperationDate)
        if err == nil {
            lastOpDate = &t
        }
    }
    if req.NextOperationDate != nil && *req.NextOperationDate != "" {
        t, err := time.Parse("2006-01-02", *req.NextOperationDate)
        if err == nil {
            nextOpDate = &t
        }
    }

    model := MeasuringInstrument{
        ID:                          id,
        RegistryNumber:              req.RegistryNumber,
        MetrologicalOperationTypeID: metrologicalTypeID,
        CertificateNumber:           req.CertificateNumber,
        LastOperationDate:           lastOpDate,
        NextOperationDate:           nextOpDate,
        DocumentProviderOrganization: req.DocumentProviderOrganization,
        DocumentURL:                 req.DocumentURL,
        StandardID:                  standardID,
        OrganizationID:              orgID,
    }

    mi, err := s.repository.Create(ctx, model)
    if err != nil {
        return nil, err
    }

    return toResponse(mi), nil
}

func (s *measuringInstrumentService) GetByID(ctx context.Context, id string) (*MeasuringInstrumentResponse, error) {
    miID, err := uuid.Parse(id)
    if err != nil {
        return nil, ErrInvalidID
    }

    mi, err := s.repository.GetByID(ctx, miID)
    if err != nil {
        return nil, err
    }

    return toResponse(mi), nil
}

func (s *measuringInstrumentService) Update(ctx context.Context, id string, req UpdateRequest) (*MeasuringInstrumentResponse, error) {
    miID, err := uuid.Parse(id)
    if err != nil {
        return nil, ErrInvalidID
    }

    current, err := s.repository.GetByID(ctx, miID)
    if err != nil {
        return nil, err
    }

    if req.RegistryNumber != nil {
        current.RegistryNumber = *req.RegistryNumber
    }
    if req.MetrologicalOperationTypeID != nil {
        tid, err := uuid.Parse(*req.MetrologicalOperationTypeID)
        if err != nil {
            return nil, ErrInvalidUUID
        }
        current.MetrologicalOperationTypeID = tid
    }
    if req.CertificateNumber != nil {
        current.CertificateNumber = *req.CertificateNumber
    }
    if req.LastOperationDate != nil {
        if *req.LastOperationDate == "" {
            current.LastOperationDate = nil
        } else {
            t, err := time.Parse("2006-01-02", *req.LastOperationDate)
            if err == nil {
                current.LastOperationDate = &t
            }
        }
    }
    if req.NextOperationDate != nil {
        if *req.NextOperationDate == "" {
            current.NextOperationDate = nil
        } else {
            t, err := time.Parse("2006-01-02", *req.NextOperationDate)
            if err == nil {
                current.NextOperationDate = &t
            }
        }
    }
    if req.DocumentProviderOrganization != nil {
        current.DocumentProviderOrganization = *req.DocumentProviderOrganization
    }
    if req.DocumentURL != nil {
        current.DocumentURL = *req.DocumentURL
    }
    if req.StandardID != nil {
        if *req.StandardID == "" {
            current.StandardID = nil
        } else {
            sid, err := uuid.Parse(*req.StandardID)
            if err != nil {
                return nil, ErrInvalidUUID
            }
            current.StandardID = &sid
        }
    }
    if req.OrganizationID != nil {
        oid, err := uuid.Parse(*req.OrganizationID)
        if err != nil {
            return nil, ErrInvalidUUID
        }
        current.OrganizationID = oid
    }

    mi, err := s.repository.Update(ctx, *current)
    if err != nil {
        return nil, err
    }

    return toResponse(mi), nil
}

func (s *measuringInstrumentService) Delete(ctx context.Context, id string) error {
    miID, err := uuid.Parse(id)
    if err != nil {
        return ErrInvalidID
    }
    return s.repository.Delete(ctx, miID)
}

func (s *measuringInstrumentService) List(ctx context.Context, limit, offset int32) ([]*MeasuringInstrumentResponse, int64, error) {
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

    res := make([]*MeasuringInstrumentResponse, len(items))
    for i := range items {
        res[i] = toResponse(&items[i])
    }

    return res, total, nil
}

// toResponse преобразует MeasuringInstrument в MeasuringInstrumentResponse
func toResponse(mi *MeasuringInstrument) *MeasuringInstrumentResponse {
    resp := &MeasuringInstrumentResponse{
        ID:                            mi.ID.String(),
        RegistryNumber:                mi.RegistryNumber,
        MetrologicalOperationTypeID:   mi.MetrologicalOperationTypeID.String(),
        CertificateNumber:             mi.CertificateNumber,
        DocumentProviderOrganization:  mi.DocumentProviderOrganization,
        DocumentURL:                   mi.DocumentURL,
        OrganizationID:                mi.OrganizationID.String(),
        CreatedAt:                     mi.CreatedAt.Format(time.RFC3339),
        UpdatedAt:                     mi.UpdatedAt.Format(time.RFC3339),
    }

    if mi.LastOperationDate != nil {
        d := mi.LastOperationDate.Format("2006-01-02")
        resp.LastOperationDate = &d
    }
    if mi.NextOperationDate != nil {
        d := mi.NextOperationDate.Format("2006-01-02")
        resp.NextOperationDate = &d
    }
    if mi.StandardID != nil {
        id := mi.StandardID.String()
        resp.StandardID = &id
    }

    return resp
}