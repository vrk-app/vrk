package standard

import (
    "context"
    "time"

    "github.com/google/uuid"
)

type StandardService interface {
    Create(ctx context.Context, req CreateRequest) (*StandardResponse, error)
    List(ctx context.Context, limit, offset int32) ([]*StandardResponse, int64, error)
    GetByID(ctx context.Context, id string) (*StandardResponse, error)
    Update(ctx context.Context, id string, req UpdateRequest) (*StandardResponse, error)
    Delete(ctx context.Context, id string) error
}

type standardService struct {
    repository StandardRepository
}

func NewService(repository StandardRepository) StandardService {
    return &standardService{repository: repository}
}

func (s *standardService) Create(ctx context.Context, req CreateRequest) (*StandardResponse, error) {
    id := uuid.New()

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

    model := Standard{
        ID:                          id,
        Model:                       req.Model,
        CertificateNumber:           req.CertificateNumber,
        LastOperationDate:           lastOpDate,
        NextOperationDate:           nextOpDate,
        DocumentProviderOrganization: req.DocumentProviderOrganization,
        DocumentURL:                 req.DocumentURL,
        MetrologicalCharacteristics: req.MetrologicalCharacteristics,
    }

    std, err := s.repository.Create(ctx, model)
    if err != nil {
        return nil, err
    }

    return toResponse(std), nil
}

func (s *standardService) GetByID(ctx context.Context, id string) (*StandardResponse, error) {
    stdID, err := uuid.Parse(id)
    if err != nil {
        return nil, ErrInvalidID
    }

    std, err := s.repository.GetByID(ctx, stdID)
    if err != nil {
        return nil, err
    }

    return toResponse(std), nil
}

func (s *standardService) Update(ctx context.Context, id string, req UpdateRequest) (*StandardResponse, error) {
    stdID, err := uuid.Parse(id)
    if err != nil {
        return nil, ErrInvalidID
    }

    current, err := s.repository.GetByID(ctx, stdID)
    if err != nil {
        return nil, err
    }

    if req.Model != nil {
        current.Model = *req.Model
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
    if req.MetrologicalCharacteristics != nil {
        current.MetrologicalCharacteristics = *req.MetrologicalCharacteristics
    }

    std, err := s.repository.Update(ctx, *current)
    if err != nil {
        return nil, err
    }

    return toResponse(std), nil
}

func (s *standardService) Delete(ctx context.Context, id string) error {
    stdID, err := uuid.Parse(id)
    if err != nil {
        return ErrInvalidID
    }
    return s.repository.Delete(ctx, stdID)
}

func (s *standardService) List(ctx context.Context, limit, offset int32) ([]*StandardResponse, int64, error) {
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

    res := make([]*StandardResponse, len(items))
    for i := range items {
        res[i] = toResponse(&items[i])
    }

    return res, total, nil
}

// toResponse преобразует Standard в StandardResponse
func toResponse(std *Standard) *StandardResponse {
    resp := &StandardResponse{
        ID:                          std.ID.String(),
        Model:                       std.Model,
        CertificateNumber:           std.CertificateNumber,
        DocumentProviderOrganization: std.DocumentProviderOrganization,
        DocumentURL:                 std.DocumentURL,
        MetrologicalCharacteristics: std.MetrologicalCharacteristics,
        CreatedAt:                   std.CreatedAt.Format(time.RFC3339),
        UpdatedAt:                   std.UpdatedAt.Format(time.RFC3339),
    }

    if std.LastOperationDate != nil {
        d := std.LastOperationDate.Format("2006-01-02")
        resp.LastOperationDate = &d
    }
    if std.NextOperationDate != nil {
        d := std.NextOperationDate.Format("2006-01-02")
        resp.NextOperationDate = &d
    }

    return resp
}