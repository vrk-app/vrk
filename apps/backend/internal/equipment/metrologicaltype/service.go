package metrologicaltype

import (
    "context"
)

type Service interface {
    Create(ctx context.Context, req CreateRequest) (*MetrologicalTypeResponse, error)
    GetByID(ctx context.Context, id int64) (*MetrologicalTypeResponse, error)
    Delete(ctx context.Context, id int64) error
    List(ctx context.Context, pg Pagination) ([]*MetrologicalTypeResponse, int64, error)
}

type service struct {
    repo Repository
}

func NewService(repo Repository) Service {
    return &service{repo: repo}
}

func (s *service) Create(ctx context.Context, req CreateRequest) (*MetrologicalTypeResponse, error) {
    // Валидация
    if req.MetrologicalOperationType == "" {
        return nil, ErrOperationTypeRequired
    }
    if len(req.MetrologicalOperationType) > 20 {
        return nil, ErrOperationTypeTooLong
    }

    // Проверка существования
    existing, err := s.repo.GetByOperationType(ctx, req.MetrologicalOperationType)
    if err != nil {
        return nil, err
    }
    if existing != nil {
        return nil, ErrDuplicateOperationType
    }

    mt, err := s.repo.Create(ctx, req.MetrologicalOperationType)
    if err != nil {
        return nil, err
    }
    return toResponse(mt), nil
}

func (s *service) GetByID(ctx context.Context, id int64) (*MetrologicalTypeResponse, error) {
    mt, err := s.repo.GetByID(ctx, id)
    if err != nil {
        return nil, err
    }
    if mt == nil {
        return nil, ErrNotFound
    }
    return toResponse(mt), nil
}

func (s *service) Delete(ctx context.Context, id int64) error {
    exists, err := s.repo.Exists(ctx, id)
    if err != nil {
        return err
    }
    if !exists {
        return ErrNotFound
    }
    return s.repo.Delete(ctx, id)
}

func (s *service) List(ctx context.Context, pg Pagination) ([]*MetrologicalTypeResponse, int64, error) {
    items, total, err := s.repo.List(ctx, pg.Limit, pg.Offset)
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
    }
}
