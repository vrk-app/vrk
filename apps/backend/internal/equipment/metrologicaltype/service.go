package metrologicaltype

import (
    "context"
    "strconv"
    "time"
)

type Service interface {
    Create(ctx context.Context, req CreateRequest) (*MetrologicalTypeResponse, error)
    GetByID(ctx context.Context, id string) (*MetrologicalTypeResponse, error)
    Delete(ctx context.Context, id string) error
    List(ctx context.Context, limit, offset int32) ([]*MetrologicalTypeResponse, int64, error)
}

type service struct {
    repo Repository
}

func NewService(repo Repository) Service {
    return &service{repo: repo}
}

func (s *service) Create(ctx context.Context, req CreateRequest) (*MetrologicalTypeResponse, error) {
    if req.MetrologicalOperationType == "" {
        return nil, ErrOperationTypeRequired
    }
    mt, err := s.repo.Create(ctx, req.MetrologicalOperationType)
    if err != nil {
        return nil, err
    }
    return toResponse(mt), nil
}

func (s *service) GetByID(ctx context.Context, idStr string) (*MetrologicalTypeResponse, error) {
    id, err := strconv.ParseInt(idStr, 10, 64)
    if err != nil {
        return nil, ErrInvalidID
    }
    mt, err := s.repo.GetByID(ctx, id)
    if err != nil {
        return nil, err
    }
    return toResponse(mt), nil
}

func (s *service) Delete(ctx context.Context, idStr string) error {
    id, err := strconv.ParseInt(idStr, 10, 64)
    if err != nil {
        return ErrInvalidID
    }
    return s.repo.Delete(ctx, id)
}

func (s *service) List(ctx context.Context, limit, offset int32) ([]*MetrologicalTypeResponse, int64, error) {
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
    resp := make([]*MetrologicalTypeResponse, len(items))
    for i, mt := range items {
        resp[i] = toResponse(mt)
    }
    return resp, total, nil
}

func toResponse(mt *MetrologicalType) *MetrologicalTypeResponse {
    return &MetrologicalTypeResponse{
        ID:                       mt.ID,
        MetrologicalOperationType: mt.MetrologicalOperationType,
        CreatedAt:                mt.CreatedAt.Format(time.RFC3339),
    }
}
