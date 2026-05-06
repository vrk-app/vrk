package equipment

import (
    "fmt"
    "context"
    "time"

    "github.com/google/uuid"
)

type EquipmentService interface {
    Create(ctx context.Context, req CreateRequest) (*EquipmentResponse, error)
    List(ctx context.Context, pg Pagination) ([]*EquipmentResponse, int64, error)
    GetByID(ctx context.Context, id string) (*EquipmentResponse, error)
//    Update(ctx context.Context, id string, req UpdateRequest) (*EquipmentResponse, error)
    Delete(ctx context.Context, id string) error
}

type equipmentService struct {
    repository EquipmentRepository
}

func NewService(repository EquipmentRepository) EquipmentService {
    return &equipmentService{repository: repository}
}

func (s *equipmentService) Create(ctx context.Context, req CreateRequest) (*EquipmentResponse, error) {
    id := uuid.New()

    manufacturerID, err := uuid.Parse(req.ManufacturerID)
    if err != nil {
        return nil, fmt.Errorf("invalid manufacturer_id: %w", err)
    }
    equipmentDictID, err := uuid.Parse(req.EquipmentDictionaryID)
    if err != nil {
        return nil, fmt.Errorf("invalid equipment_dictionary_id: %w", err)
    }
    orgID, err := uuid.Parse(req.OrganizationID)
    if err != nil {
        return nil, fmt.Errorf("invalid organization_id: %w", err)
    }
    manufactureYear, err := time.Parse("2006", req.ManufactureYear)
    if err != nil {
        return nil, ErrManufactureYearRequired
    }

    var inventoryNumber *string = req.InventoryNumber

    model := Equipment{
        ID:                    id,
        ManufacturerID:        manufacturerID,
        EquipmentDictionaryID: equipmentDictID,
        FactoryNumber:         req.FactoryNumber,
        InventoryNumber:       inventoryNumber,
        ManufactureYear:       manufactureYear,
        OrganizationID:        orgID,
        StatusID:              req.StatusID,
    }

    eq, err := s.repository.Create(ctx, model)
    if err != nil {
        return nil, err
    }

    // Получаем информацию о словаре оборудования
    dictInfo, err := s.repository.GetEquipmentDictionaryByID(ctx, equipmentDictID)
    if err != nil {
        return nil, err
    }

    // Если есть measuring_instruments_dictionary_id, создаем запись в measuring_instruments
    if dictInfo.MeasuringInstrumentsDictionaryID != nil {
        registryNumber := *dictInfo.MeasuringInstrumentInfo.RegistryNumber
        var metrologicalTypeID *int32
        if req.MetrologicalOperationTypeID != nil {
            metrologicalTypeID = req.MetrologicalOperationTypeID
        } else if dictInfo.MeasuringInstrumentInfo.MetrologicalOperationTypeID != nil {
            metrologicalTypeID = dictInfo.MeasuringInstrumentInfo.MetrologicalOperationTypeID
        }

        var standardID *uuid.UUID
        if req.StandardID != nil && *req.StandardID != "" {
            sid, err := uuid.Parse(*req.StandardID)
            if err == nil {
                standardID = &sid
            }
        }

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

        documentProvider := req.DocumentProviderOrganization
        if (documentProvider == nil || *documentProvider == "") && registryNumber != "" {
            documentProvider = &registryNumber
        }

        documentURL := req.DocumentURL
        if documentURL == nil {
            empty := ""
            documentURL = &empty
        }

        mi := MeasuringInstrument{
            EquipmentID:                  eq.ID,
            MetrologicalOperationTypeID:  metrologicalTypeID,
            CertificateNumber:            req.CertificateNumber,
            LastOperationDate:            lastOpDate,
            NextOperationDate:            nextOpDate,
            DocumentProviderOrganization: documentProvider,
            DocumentURL:                  documentURL,
            StandardID:                   standardID,
        }

        if err := s.repository.CreateMeasuringInstrument(ctx, mi); err != nil {
            _ = err
        }
    }

    // Получаем полные данные для ответа
    full, err := s.repository.GetByID(ctx, eq.ID)
    if err != nil {
        return toResponseFromEquipment(eq), nil
    }

    return toResponse(full), nil
}


func (s *equipmentService) GetByID(ctx context.Context, id string) (*EquipmentResponse, error) {
    eqID, err := uuid.Parse(id)
    if err != nil {
        return nil, ErrInvalidID
    }

    eq, err := s.repository.GetByID(ctx, eqID)
    if err != nil {
        return nil, err
    }

    return toResponse(eq), nil
}

// func (s *equipmentService) Update(ctx context.Context, id string, req UpdateRequest) (*EquipmentResponse, error) {
//     eqID, err := uuid.Parse(id)
//     if err != nil {
//         return nil, ErrInvalidID
//     }

//     current, err := s.repository.GetByID(ctx, eqID)
//     if err != nil {
//         return nil, err
//     }

//     model := Equipment{
//         ID:                    eqID,
//         FactoryNumber:         current.FactoryNumber,
//         InventoryNumber:       current.InventoryNumber,
//         ManufactureYear:       current.ManufactureYear,
//         RegistrationYear:      current.RegistrationYear,
//         EquipmentDictionaryID: current.EquipmentDictionaryID,
//         OrganizationID:        current.OrganizationID,
//         StatusID:              current.StatusID,
//     }

//     if req.FactoryNumber != nil {
//         model.FactoryNumber = *req.FactoryNumber
//     }
//     if req.InventoryNumber != nil {
//         model.InventoryNumber = req.InventoryNumber
//     }
//     if req.ManufactureYear != nil {
//         t, err := time.Parse("2006", *req.ManufactureYear)
//         if err == nil {
//             model.ManufactureYear = t
//         }
//     }
//     if req.RegistrationYear != nil {
//         if *req.RegistrationYear == "" {
//             model.RegistrationYear = nil
//         } else {
//             t, err := time.Parse("2006", *req.RegistrationYear)
//             if err == nil {
//                 model.RegistrationYear = &t
//             }
//         }
//     }
//     if req.EquipmentDictionaryID != nil {
//         id, err := uuid.Parse(*req.EquipmentDictionaryID)
//         if err == nil {
//             model.EquipmentDictionaryID = id
//         }
//     }
//     if req.OrganizationID != nil {
//         id, err := uuid.Parse(*req.OrganizationID)
//         if err == nil {
//             model.OrganizationID = id
//         }
//     }
//     if req.StatusID != nil {
//         model.StatusID = *req.StatusID
//     }

//     eq, err := s.repository.Update(ctx, model)
//     if err != nil {
//         return nil, err
//     }

//     full, err := s.repository.GetByID(ctx, eq.ID)
//     if err != nil {
//         return toResponseFromEquipment(eq), nil
//     }

//     return toResponse(full), nil
// }

func (s *equipmentService) Delete(ctx context.Context, id string) error {
    eqID, err := uuid.Parse(id)
    if err != nil {
        return ErrInvalidID
    }
    return s.repository.Delete(ctx, eqID)
}

func (s *equipmentService) List(ctx context.Context, pg Pagination) ([]*EquipmentResponse, int64, error) {
    items, total, err := s.repository.List(ctx, pg.Limit, pg.Offset)
    if err != nil {
        return nil, 0, err
    }

    res := make([]*EquipmentResponse, len(items))
    for i, eq := range items {
        standards, err := s.repository.ListStandardsByEquipmentID(ctx, eq.ID)
        if err != nil {
            standards = []StandardInfo{}
        }
        res[i] = toResponseWithStandards(&eq, standards)
    }

    return res, total, nil
}

// toResponse
func toResponse(eq *EquipmentWithDetails) *EquipmentResponse {
    resp := &EquipmentResponse{
        ID:                   eq.ID.String(),
        ManufacturerName:     eq.ManufacturerName,
        UsageClassification:  eq.UsageClassification,
        EquipmentName:        eq.EquipmentName,
        Model:                eq.Model,
        FactoryNumber:        eq.FactoryNumber,
        ManufactureYear:      eq.ManufactureYear.Format("2006"),
        OrganizationName:     eq.OrganizationName,
        StatusID:             eq.StatusID,
        StatusName:           eq.StatusName,
    }

    if eq.InventoryNumber != nil {
        resp.InventoryNumber = eq.InventoryNumber
    }

    // Добавляем данные средства измерения, если есть
    if eq.MeasuringInstrument != nil && eq.MeasuringInstrument.ID != nil {
        resp.MeasuringInstrument = eq.MeasuringInstrument
    }

    return resp
}

func toResponseWithStandards(eq *EquipmentWithDetails, standards []StandardInfo) *EquipmentResponse {
    resp := &EquipmentResponse{
        ID:                   eq.ID.String(),
        ManufacturerName:     eq.ManufacturerName,
        UsageClassification:  eq.UsageClassification,
        EquipmentName:        eq.EquipmentName,
        Model:                eq.Model,
        FactoryNumber:        eq.FactoryNumber,
        ManufactureYear:      eq.ManufactureYear.Format("2006"),
        OrganizationName:     eq.OrganizationName,
        StatusID:             eq.StatusID,
        StatusName:           eq.StatusName,
    }

    if eq.InventoryNumber != nil {
        resp.InventoryNumber = eq.InventoryNumber
    }

    if eq.MeasuringInstrument != nil && eq.MeasuringInstrument.ID != nil {
        resp.MeasuringInstrument = eq.MeasuringInstrument
    }

    if len(standards) > 0 {
        resp.Standards = standards
    }

    return resp
}

func toResponseFromEquipment(eq *Equipment) *EquipmentResponse {
    resp := &EquipmentResponse{
        ID:              eq.ID.String(),
        FactoryNumber:   eq.FactoryNumber,
        ManufactureYear: eq.ManufactureYear.Format("2006"),
        StatusID:        eq.StatusID,
    }

    if eq.InventoryNumber != nil {
        resp.InventoryNumber = eq.InventoryNumber
    }

    return resp
}

func getStringValueOrDefault(ptr *string, defaultValue string) string {
    if ptr != nil && *ptr != "" {
        return *ptr
    }
    return defaultValue
}

