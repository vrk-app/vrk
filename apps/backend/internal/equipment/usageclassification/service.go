package usageclassification

import (
    "context"
    "strconv"
    "time"
)

type Service interface {
    Create(ctx context.Context, req CreateRequest) (*UsageClassificationResponse, error)
    GetByID(ctx context.Context, id string) (*UsageClassificationResponse, error)
    Delete(ctx context.Context, id string) error
    List(ctx context.Context, limit, offset int32) ([]*UsageClassificationResponse, int64, error)
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
    uc, err := s.repo.Create(ctx, req.Classification)
    if err != nil {
        return nil, err
    }
    return toResponse(uc), nil
}

func (s *service) GetByID(ctx context.Context, idStr string) (*UsageClassificationResponse, error) {
    id, err := strconv.ParseInt(idStr, 10, 64)
    if err != nil {
        return nil, ErrInvalidID
    }
    uc, err := s.repo.GetByID(ctx, id)
    if err != nil {
        return nil, err
    }
    return toResponse(uc), nil
}

func (s *service) Delete(ctx context.Context, idStr string) error {
    id, err := strconv.ParseInt(idStr, 10, 64)
    if err != nil {
        return ErrInvalidID
    }
    return s.repo.Delete(ctx, id)
}

func (s *service) List(ctx context.Context, limit, offset int32) ([]*UsageClassificationResponse, int64, error) {
    if limit <= 0 {
        limit = 10
    }
    if limit > 100 {
        limit = 100
    }
    if offset < 0 {
        offset = 0
    }
    items, total, err := s.repo.List(ctx, limit, offset)
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