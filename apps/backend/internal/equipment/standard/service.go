package standard

import (
    "context"
    "database/sql"
    "fmt"
    "time"

    "github.com/google/uuid"

    "backend/internal/db/generated"
)

type StandardService interface {
    Create(ctx context.Context, req CreateRequest) (*StandardResponse, error)
    GetByID(ctx context.Context, id string) (*StandardResponse, error)
    Update(ctx context.Context, id string, req UpdateRequest) (*StandardResponse, error)
    Delete(ctx context.Context, id string) error
    List(ctx context.Context, limit, offset int32) ([]*StandardResponse, int64, error)
}

type standardService struct {
    repo StandardRepository
}

func NewService(repo StandardRepository) StandardService {
    return &standardService{repo: repo}
}

func (s *standardService) Create(ctx context.Context, req CreateRequest) (*StandardResponse, error) {
    // Валидация
    if req.Model == "" {
        return nil, ErrModelRequired
    }
    if req.CertificateNumber == "" {
        return nil, ErrCertificateNumberRequired
    }
    if req.DocumentProviderOrganization == "" {
        return nil, ErrDocumentProviderRequired
    }
    if req.DocumentURL == "" {
        return nil, ErrDocumentURLRequired
    }
    if req.MetrologicalCharacteristics == "" {
        return nil, ErrMetrologicalCharRequired
    }

    // Парсинг дат (опционально)
    var lastOpDate, nextOpDate sql.NullTime
    if req.LastOperationDate != nil && *req.LastOperationDate != "" {
        t, err := time.Parse("2006-01-02", *req.LastOperationDate)
        if err == nil {
            lastOpDate = sql.NullTime{Time: t, Valid: true}
        }
    }
    if req.NextOperationDate != nil && *req.NextOperationDate != "" {
        t, err := time.Parse("2006-01-02", *req.NextOperationDate)
        if err == nil {
            nextOpDate = sql.NullTime{Time: t, Valid: true}
        }
    }

    params := generated.CreateStandardParams{
        Model:                       req.Model,
        CertificateNumber:           req.CertificateNumber,
        LastOperationDate:           lastOpDate,
        NextOperationDate:           nextOpDate,
        DocumentProviderOrganization: req.DocumentProviderOrganization,
        DocumentUrl:                 req.DocumentURL,
        MetrologicalCharacteristics: req.MetrologicalCharacteristics,
    }

    std, err := s.repo.Create(ctx, params)
    if err != nil {
        return nil, err
    }

    return toResponse(fromCreateRow(std)), nil
}

func (s *standardService) GetByID(ctx context.Context, id string) (*StandardResponse, error) {
    stdID, err := uuid.Parse(id)
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrInvalidID, err)
    }
    std, err := s.repo.GetByID(ctx, stdID)
    if err != nil {
        return nil, err
    }
    return toResponse(fromGetByIDRow(std)), nil
}

func (s *standardService) Update(ctx context.Context, id string, req UpdateRequest) (*StandardResponse, error) {
    stdID, err := uuid.Parse(id)
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrInvalidID, err)
    }

    exists, err := s.repo.Exists(ctx, stdID)
    if err != nil {
        return nil, err
    }
    if !exists {
        return nil, ErrNotFound
    }

    // Получаем текущую запись
    current, err := s.repo.GetByID(ctx, stdID)
    if err != nil {
        return nil, err
    }

    // Обновляем поля
    model := current.Model
    if req.Model != nil {
        model = *req.Model
    }

    certificateNumber := current.CertificateNumber
    if req.CertificateNumber != nil {
        certificateNumber = *req.CertificateNumber
    }

    documentProvider := current.DocumentProviderOrganization
    if req.DocumentProviderOrganization != nil {
        documentProvider = *req.DocumentProviderOrganization
    }

    documentURL := current.DocumentUrl
    if req.DocumentURL != nil {
        documentURL = *req.DocumentURL
    }

    metrologicalChars := current.MetrologicalCharacteristics
    if req.MetrologicalCharacteristics != nil {
        metrologicalChars = *req.MetrologicalCharacteristics
    }

    var lastOpDate, nextOpDate sql.NullTime
    if req.LastOperationDate != nil && *req.LastOperationDate != "" {
        t, err := time.Parse("2006-01-02", *req.LastOperationDate)
        if err == nil {
            lastOpDate = sql.NullTime{Time: t, Valid: true}
        }
    } else {
        lastOpDate = current.LastOperationDate
    }

    if req.NextOperationDate != nil && *req.NextOperationDate != "" {
        t, err := time.Parse("2006-01-02", *req.NextOperationDate)
        if err == nil {
            nextOpDate = sql.NullTime{Time: t, Valid: true}
        }
    } else {
        nextOpDate = current.NextOperationDate
    }

    params := generated.UpdateStandardParams{
        ID:                          stdID,
        Model:                       model,
        CertificateNumber:           certificateNumber,
        LastOperationDate:           lastOpDate,
        NextOperationDate:           nextOpDate,
        DocumentProviderOrganization: documentProvider,
        DocumentUrl:                 documentURL,
        MetrologicalCharacteristics: metrologicalChars,
    }

    std, err := s.repo.Update(ctx, params)
    if err != nil {
        return nil, err
    }

    return toResponse(fromUpdateRow(std)), nil
}

func (s *standardService) Delete(ctx context.Context, id string) error {
    stdID, err := uuid.Parse(id)
    if err != nil {
        return fmt.Errorf("%w: %v", ErrInvalidID, err)
    }
    return s.repo.Delete(ctx, stdID)
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

    items, total, err := s.repo.List(ctx, limit, offset)
    if err != nil {
        return nil, 0, err
    }

    responses := make([]*StandardResponse, len(items))
    for i := range items {
        responses[i] = toResponse(fromListRow(&items[i]))
    }
    return responses, total, nil
}

// ---- внутренние типы и конвертеры ----
type stdModel struct {
    ID                          uuid.UUID
    Model                       string
    CertificateNumber           string
    LastOperationDate           sql.NullTime
    NextOperationDate           sql.NullTime
    DocumentProviderOrganization string
    DocumentURL                 string
    MetrologicalCharacteristics string
    CreatedAt                   time.Time
    UpdatedAt                   time.Time
}

func fromCreateRow(r *generated.CreateStandardRow) stdModel {
    return stdModel{
        ID:                          r.ID,
        Model:                       r.Model,
        CertificateNumber:           r.CertificateNumber,
        LastOperationDate:           r.LastOperationDate,
        NextOperationDate:           r.NextOperationDate,
        DocumentProviderOrganization: r.DocumentProviderOrganization,
        DocumentURL:                 r.DocumentUrl,
        MetrologicalCharacteristics: r.MetrologicalCharacteristics,
    }
}

func fromListRow(r *generated.ListStandardsRow) stdModel {
    return fromCreateRow((*generated.CreateStandardRow)(r))
}

func fromUpdateRow(r *generated.UpdateStandardRow) stdModel {
    return fromCreateRow((*generated.CreateStandardRow)(r))
}

func fromGetByIDRow(r *generated.GetStandardByIDRow) stdModel {
    return fromCreateRow((*generated.CreateStandardRow)(r))
}

func toResponse(m stdModel) *StandardResponse {
    resp := &StandardResponse{
        ID:                          m.ID.String(),
        Model:                       m.Model,
        CertificateNumber:           m.CertificateNumber,
        DocumentProviderOrganization: m.DocumentProviderOrganization,
        DocumentURL:                 m.DocumentURL,
        MetrologicalCharacteristics: m.MetrologicalCharacteristics,
    }
    if m.LastOperationDate.Valid {
        date := m.LastOperationDate.Time.Format("2006-01-02")
        resp.LastOperationDate = &date  // ← указатель на строку
    }
    if m.NextOperationDate.Valid {
        date := m.NextOperationDate.Time.Format("2006-01-02")
        resp.NextOperationDate = &date  // ← указатель на строку
    }
    return resp
}