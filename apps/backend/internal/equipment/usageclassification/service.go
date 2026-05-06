package usageclassification

import (
    "context"
    "time"
)

type Service interface {
    Create(ctx context.Context, req CreateRequest) (*UsageClassificationResponse, error)
    GetByID(ctx context.Context, id int64) (*UsageClassificationResponse, error)
    Delete(ctx context.Context, id int64) error
    List(ctx context.Context, pg Pagination) ([]*UsageClassificationResponse, int64, error)
}

type service struct {
    repo Repository
}

func NewService(repo Repository) Service {
    return &service{repo: repo}
}

func (s *service) Create(ctx context.Context, req CreateRequest) (*UsageClassificationResponse, error) {
    if req.Classification == "" {
        return nil, ErrClassificationRequired
    }
    if len(req.Classification) > 200 {
        return nil, ErrClassificationTooLong
    }

    existing, err := s.repo.GetByClassification(ctx, req.Classification)
    if err != nil {
        return nil, err
    }
    if existing != nil {
        return nil, ErrDuplicateClassification
    }

    uc, err := s.repo.Create(ctx, req.Classification)
    if err != nil {
        return nil, err
    }
    return toResponse(uc), nil
}

func (s *service) GetByID(ctx context.Context, id int64) (*UsageClassificationResponse, error) {
    uc, err := s.repo.GetByID(ctx, id)
    if err != nil {
        return nil, err
    }
    return toResponse(uc), nil
}

func (s *service) Delete(ctx context.Context, id int64) error {
    return s.repo.Delete(ctx, id)
}

func (s *service) List(ctx context.Context, pg Pagination) ([]*UsageClassificationResponse, int64, error) {
    items, total, err := s.repo.List(ctx, pg.Limit, pg.Offset)
    if err != nil {
        return nil, 0, err
    }
    resp := make([]*UsageClassificationResponse, len(items))
    for i, uc := range items {
        resp[i] = toResponse(uc)
    }
    return resp, total, nil
}

func toResponse(uc *UsageClassification) *UsageClassificationResponse {
    return &UsageClassificationResponse{
        ID:             uc.ID,
        Classification: uc.Classification,
        CreatedAt:      uc.CreatedAt.Format(time.RFC3339),
    }
}