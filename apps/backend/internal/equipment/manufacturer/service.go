package manufacturer

import (
    "context"
    "time"

    "github.com/google/uuid"
)

type ManufacturerService interface {
    Create(ctx context.Context, req CreateRequest) (*ManufacturerResponse, error)
    List(ctx context.Context, limit, offset int32) ([]*ManufacturerResponse, int64, error)
    GetByID(ctx context.Context, id string) (*ManufacturerResponse, error)
    Update(ctx context.Context, id string, req UpdateRequest) (*ManufacturerResponse, error)
    Delete(ctx context.Context, id string) error
}

type manufacturerService struct {
    repo ManufacturerRepository
}

func NewService(repo ManufacturerRepository) ManufacturerService {
    return &manufacturerService{repo: repo}
}

func (s *manufacturerService) Create(ctx context.Context, req CreateRequest) (*ManufacturerResponse, error) {
    model := Manufacturer{
        Name:            req.Name,
        ClassificationID: req.ClassificationID,
    }

    m, err := s.repo.Create(ctx, model)
    if err != nil {
        return nil, err
    }

    return toResponse(m), nil
}

func (s *manufacturerService) GetByID(ctx context.Context, id string) (*ManufacturerResponse, error) {
    mID, err := uuid.Parse(id)
    if err != nil {
        return nil, ErrInvalidID
    }

    m, err := s.repo.GetByID(ctx, mID)
    if err != nil {
        return nil, err
    }

    return toResponse(m), nil
}

func (s *manufacturerService) Update(ctx context.Context, id string, req UpdateRequest) (*ManufacturerResponse, error) {
    mID, err := uuid.Parse(id)
    if err != nil {
        return nil, ErrInvalidID
    }

    current, err := s.repo.GetByID(ctx, mID)
    if err != nil {
        return nil, err
    }

    if req.Name != nil {
        current.Name = *req.Name
    }
    if req.ClassificationID != nil {
        current.ClassificationID = *req.ClassificationID
    }

    m, err := s.repo.Update(ctx, *current)
    if err != nil {
        return nil, err
    }

    return toResponse(m), nil
}

func (s *manufacturerService) Delete(ctx context.Context, id string) error {
    mID, err := uuid.Parse(id)
    if err != nil {
        return ErrInvalidID
    }
    return s.repo.Delete(ctx, mID)
}

func (s *manufacturerService) List(ctx context.Context, limit, offset int32) ([]*ManufacturerResponse, int64, error) {
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

    res := make([]*ManufacturerResponse, len(items))
    for i := range items {
        res[i] = toResponse(&items[i])
    }
    return res, total, nil
}

func toResponse(m *Manufacturer) *ManufacturerResponse {
    return &ManufacturerResponse{
        ID:              m.ID.String(),
        Name:            m.Name,
        ClassificationID: m.ClassificationID,
        CreatedAt:       m.CreatedAt.Format(time.RFC3339),
        UpdatedAt:       m.UpdatedAt.Format(time.RFC3339),
    }
}
