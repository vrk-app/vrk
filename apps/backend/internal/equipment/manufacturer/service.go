package manufacturer

import (
    "context"

    "github.com/google/uuid"
)

type ManufacturerService interface {
    Create(ctx context.Context, req CreateRequest) (*ManufacturerResponse, error)
    List(ctx context.Context, pg Pagination) ([]*ManufacturerResponse, int64, error)
    GetByID(ctx context.Context, id string) (*ManufacturerResponse, error)
    Update(ctx context.Context, id string, req UpdateRequest) (*ManufacturerResponse, error)
    Delete(ctx context.Context, id string) error
}

type ClassificationRepository interface {
    Exists(ctx context.Context, id int64) (bool, error)
}

type manufacturerService struct {
    repo ManufacturerRepository
    classificationRepo ClassificationRepository
}

func NewService(repo ManufacturerRepository, classificationRepo ClassificationRepository) ManufacturerService {
    return &manufacturerService{
        repo: repo,
        classificationRepo: classificationRepo,
    }
}

func (s *manufacturerService) Create(ctx context.Context, req CreateRequest) (*ManufacturerResponse, error) {
    if req.Name == "" {
        return nil, ErrNameRequired
    }
    if len(req.Name) > 200 {
        return nil, ErrNameTooLong
    }
    if req.ClassificationID == 0 {
        return nil, ErrClassificationRequired
    }

    exists, err := s.classificationRepo.Exists(ctx, int64(req.ClassificationID))
    if err != nil {
        return nil, err
    }
    if !exists {
        return nil, ErrClassificationNotFound
    }


    existing, err := s.repo.GetByName(ctx, req.Name)
    if err != nil {
        return nil, err
    }
    if existing != nil {
        return nil, ErrDuplicateName
    }

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
    if req.ClassificationID != nil {
        exists, err := s.classificationRepo.Exists(ctx, int64(*req.ClassificationID))
        if err != nil {
            return nil, err
        }
        if !exists {
            return nil, ErrClassificationNotFound
        }
    }
    if req.Name != nil && *req.Name != "" {
        if len(*req.Name) > 200 {
            return nil, ErrNameTooLong
        }
        existing, err := s.repo.GetByName(ctx, *req.Name)
        if err != nil {
            return nil, err
        }
        if existing != nil {
            return nil, ErrDuplicateName
        }
    }

    if req.Name != nil && *req.Name != "" {
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

func (s *manufacturerService) List(ctx context.Context, pg Pagination) ([]*ManufacturerResponse, int64, error) {
    items, total, err := s.repo.List(ctx, pg.Limit, pg.Offset)
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
    }
}
