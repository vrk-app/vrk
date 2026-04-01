package measuringinstrument

import (
    "context"
    "database/sql"
    "fmt"
    "time"

    "github.com/google/uuid"

    "backend/internal/db/generated"
)

type MeasuringInstrumentService interface {
    Create(ctx context.Context, req CreateRequest) (*MeasuringInstrumentResponse, error)
    GetByID(ctx context.Context, id string) (*MeasuringInstrumentResponse, error)
    Update(ctx context.Context, id string, req UpdateRequest) (*MeasuringInstrumentResponse, error)
    Delete(ctx context.Context, id string) error
    List(ctx context.Context, limit, offset int32) ([]*MeasuringInstrumentResponse, int64, error)
}

type measuringInstrumentService struct {
    repo MeasuringInstrumentRepository
}

func NewService(repo MeasuringInstrumentRepository) MeasuringInstrumentService {
    return &measuringInstrumentService{repo: repo}
}

func (s *measuringInstrumentService) Create(ctx context.Context, req CreateRequest) (*MeasuringInstrumentResponse, error) {
    // Валидация
    if req.RegistryNumber == "" {
        return nil, ErrRegistryNumberRequired
    }
    if req.MetrologicalOperationTypeID == "" {
        return nil, ErrMetrologicalTypeRequired
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
    if req.OrganizationID == "" {
        return nil, ErrOrganizationRequired
    }

    // Парсинг UUID
    metrologicalTypeID, err := uuid.Parse(req.MetrologicalOperationTypeID)
    if err != nil {
        return nil, fmt.Errorf("%w: metrological_operation_type_id", ErrInvalidUUID)
    }
    orgID, err := uuid.Parse(req.OrganizationID)
    if err != nil {
        return nil, fmt.Errorf("%w: organization_id", ErrInvalidUUID)
    }

    // standard_id может быть NULL
    var standardID uuid.NullUUID
    if req.StandardID != nil && *req.StandardID != "" {
        id, err := uuid.Parse(*req.StandardID)
        if err != nil {
            return nil, fmt.Errorf("%w: standard_id", ErrInvalidUUID)
        }
        standardID = uuid.NullUUID{UUID: id, Valid: true}
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

    params := generated.CreateMeasuringInstrumentParams{
        RegistryNumber:                req.RegistryNumber,
        MetrologicalOperationTypeID:   metrologicalTypeID,
        CertificateNumber:             req.CertificateNumber,
        LastOperationDate:             lastOpDate,
        NextOperationDate:             nextOpDate,
        DocumentProviderOrganization:  req.DocumentProviderOrganization,
        DocumentUrl:                   req.DocumentURL,
        StandardID:                    standardID,
        OrganizationID:                orgID,
    }

    mi, err := s.repo.Create(ctx, params)
    if err != nil {
        return nil, err
    }

    return toResponse(fromCreateRow(mi)), nil
}

func (s *measuringInstrumentService) GetByID(ctx context.Context, id string) (*MeasuringInstrumentResponse, error) {
    miID, err := uuid.Parse(id)
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrInvalidID, err)
    }
    mi, err := s.repo.GetByID(ctx, miID)
    if err != nil {
        return nil, err
    }
    return toResponse(fromGetByIDRow(mi)), nil
}

func (s *measuringInstrumentService) Update(ctx context.Context, id string, req UpdateRequest) (*MeasuringInstrumentResponse, error) {
    miID, err := uuid.Parse(id)
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrInvalidID, err)
    }

    exists, err := s.repo.Exists(ctx, miID)
    if err != nil {
        return nil, err
    }
    if !exists {
        return nil, ErrNotFound
    }

    // Получаем текущую запись
    current, err := s.repo.GetByID(ctx, miID)
    if err != nil {
        return nil, err
    }

    // Обновляем поля
    registryNumber := current.RegistryNumber
    if req.RegistryNumber != nil {
        registryNumber = *req.RegistryNumber
    }

    metrologicalTypeID := current.MetrologicalOperationTypeID
    if req.MetrologicalOperationTypeID != nil {
        id, err := uuid.Parse(*req.MetrologicalOperationTypeID)
        if err != nil {
            return nil, fmt.Errorf("%w: metrological_operation_type_id", ErrInvalidUUID)
        }
        metrologicalTypeID = id
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

    orgID := current.OrganizationID
    if req.OrganizationID != nil {
        id, err := uuid.Parse(*req.OrganizationID)
        if err != nil {
            return nil, fmt.Errorf("%w: organization_id", ErrInvalidUUID)
        }
        orgID = id
    }

    var standardID uuid.NullUUID
    if req.StandardID != nil && *req.StandardID != "" {
        id, err := uuid.Parse(*req.StandardID)
        if err != nil {
            return nil, fmt.Errorf("%w: standard_id", ErrInvalidUUID)
        }
        standardID = uuid.NullUUID{UUID: id, Valid: true}
    } else {
		standardID = current.StandardID
	}


    // Парсинг дат (опционально)
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

    params := generated.UpdateMeasuringInstrumentParams{
        ID:                          miID,
        RegistryNumber:              registryNumber,
        MetrologicalOperationTypeID: metrologicalTypeID,
        CertificateNumber:           certificateNumber,
        LastOperationDate:           lastOpDate,
        NextOperationDate:           nextOpDate,
        DocumentProviderOrganization: documentProvider,
        DocumentUrl:                 documentURL,
        StandardID:                  standardID,
        OrganizationID:              orgID,
    }

    mi, err := s.repo.Update(ctx, params)
    if err != nil {
        return nil, err
    }

    return toResponse(fromUpdateRow(mi)), nil
}

func (s *measuringInstrumentService) Delete(ctx context.Context, id string) error {
    miID, err := uuid.Parse(id)
    if err != nil {
        return fmt.Errorf("%w: %v", ErrInvalidID, err)
    }
    return s.repo.Delete(ctx, miID)
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

    items, total, err := s.repo.List(ctx, limit, offset)
    if err != nil {
        return nil, 0, err
    }

    responses := make([]*MeasuringInstrumentResponse, len(items))
    for i := range items {
        responses[i] = toResponse(fromListRow(&items[i]))
    }
    return responses, total, nil
}

// ---- внутренние типы и конвертеры ----
type miModel struct {
    ID                          uuid.UUID
    RegistryNumber              string
    MetrologicalOperationTypeID uuid.UUID
    CertificateNumber           string
    LastOperationDate           sql.NullTime
    NextOperationDate           sql.NullTime
    DocumentProviderOrganization string
    DocumentURL                 string
    StandardID                  uuid.NullUUID
    OrganizationID              uuid.UUID
    CreatedAt                   time.Time
    UpdatedAt                   time.Time
}

func fromCreateRow(r *generated.CreateMeasuringInstrumentRow) miModel {
    return miModel{
        ID:                          r.ID,
        RegistryNumber:              r.RegistryNumber,
        MetrologicalOperationTypeID: r.MetrologicalOperationTypeID,
        CertificateNumber:           r.CertificateNumber,
        LastOperationDate:           r.LastOperationDate,
        NextOperationDate:           r.NextOperationDate,
        DocumentProviderOrganization: r.DocumentProviderOrganization,
        DocumentURL:                 r.DocumentUrl,
        StandardID:                  r.StandardID,
        OrganizationID:              r.OrganizationID,
    }
}

func fromListRow(r *generated.ListMeasuringInstrumentsRow) miModel {
    return fromCreateRow((*generated.CreateMeasuringInstrumentRow)(r))
}

func fromUpdateRow(r *generated.UpdateMeasuringInstrumentRow) miModel {
    return fromCreateRow((*generated.CreateMeasuringInstrumentRow)(r))
}

func fromGetByIDRow(r *generated.GetMeasuringInstrumentByIDRow) miModel {
    return fromCreateRow((*generated.CreateMeasuringInstrumentRow)(r))
}

func toResponse(m miModel) *MeasuringInstrumentResponse {
    resp := &MeasuringInstrumentResponse{
        ID:                            m.ID.String(),
        RegistryNumber:                m.RegistryNumber,
        MetrologicalOperationTypeID:   m.MetrologicalOperationTypeID.String(),
        CertificateNumber:             m.CertificateNumber,
        DocumentProviderOrganization:  m.DocumentProviderOrganization,
        DocumentURL:                   m.DocumentURL,
        OrganizationID:                m.OrganizationID.String(),
        CreatedAt:                     m.CreatedAt.Format(time.RFC3339),
        UpdatedAt:                     m.UpdatedAt.Format(time.RFC3339),
    }
    if m.LastOperationDate.Valid {
        date := m.LastOperationDate.Time.Format("2006-01-02")
        resp.LastOperationDate = &date
    }
    if m.NextOperationDate.Valid {
        date := m.NextOperationDate.Time.Format("2006-01-02")
        resp.NextOperationDate = &date
    }
    if m.StandardID.Valid {
        id := m.StandardID.UUID.String()
        resp.StandardID = &id
    }
    return resp
}