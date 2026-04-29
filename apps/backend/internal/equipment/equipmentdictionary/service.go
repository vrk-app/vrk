package equipmentdictionary

import (
    "context"
    "fmt"

    "github.com/google/uuid"
    "backend/internal/db/generated"
)

type Service interface {
    Create(ctx context.Context, req CreateEquipmentDictionaryRequest) (*EquipmentDictionaryFull, error)
    GetByID(ctx context.Context, id string) (*EquipmentDictionaryFull, error)
    Update(ctx context.Context, id string, req UpdateEquipmentDictionaryRequest) (*EquipmentDictionaryFull, error)
    Delete(ctx context.Context, id string) error
    List(ctx context.Context, limit, offset int32) ([]*EquipmentDictionaryFull, int64, error)
}

type service struct {
    repo Repository
}

func NewService(repo Repository) Service {
    return &service{repo: repo}
}

// Create – создание словаря оборудования с возможностью создания нового MID и стандартов
func (s *service) Create(ctx context.Context, req CreateEquipmentDictionaryRequest) (*EquipmentDictionaryFull, error) {
    var midID *uuid.UUID

    if req.MeasuringInstrument != nil {
        // Создаём MID
        var metrologicalTypeID *int32
        if req.MeasuringInstrument.MetrologicalOperationTypeID != nil {
            metrologicalTypeID = req.MeasuringInstrument.MetrologicalOperationTypeID
        }
        midParams := generated.CreateMeasuringInstrumentsDictionaryParams{
            RegistryNumber:             req.MeasuringInstrument.RegistryNumber,
            MetrologicalOperationTypeID: metrologicalTypeID,
        }
        newMID, err := s.repo.CreateMID(ctx, midParams)
        if err != nil {
            return nil, fmt.Errorf("failed to create MID: %w", err)
        }
        midID = &newMID.ID

        // Создаём эталоны
        for _, stdModel := range req.MeasuringInstrument.Standards {
            stdParams := generated.CreateStandardsDictionaryParams{
                MeasuringInstrumentsDictionaryID: toPGUUID(*midID),
                Model:                            stdModel,
            }
            if _, err := s.repo.CreateStandardsDict(ctx, stdParams); err != nil {
                return nil, fmt.Errorf("failed to create standard '%s': %w", stdModel, err)
            }
        }
    } else {
        return nil, fmt.Errorf("either measuringInstrumentDictionaryId or measuringInstrument must be provided")
    }

    // Создаём EquipmentDictionary
    equipParams := generated.CreateEquipmentDictionaryParams{
        FullName:                         req.FullName,
        Model:                            req.Model,
        MeasuringInstrumentsDictionaryID: toPGUUID(*midID),
    }
    full, err := s.repo.CreateEquipmentDict(ctx, equipParams)
    if err != nil {
        return nil, err
    }

    // Получаем стандарты для ответа
    var standards []StandardsDictionaryFull
    if full.MeasuringInstrumentsDictionaryID != nil {
        stds, err := s.repo.ListStandardsByMID(ctx, *full.MeasuringInstrumentsDictionaryID)
        if err == nil {
            for _, st := range stds {
                standards = append(standards, StandardsDictionaryFull{ID: st.ID.String(), Model: st.Model})
            }
        }
    }

    return toFullResponse(full, standards), nil
}

// GetByID – получение полной информации
func (s *service) GetByID(ctx context.Context, idStr string) (*EquipmentDictionaryFull, error) {
    id, err := uuid.Parse(idStr)
    if err != nil {
        return nil, fmt.Errorf("invalid ID: %w", err)
    }
    full, err := s.repo.GetEquipmentDictByID(ctx, id)
    if err != nil {
        return nil, err
    }
    var standards []StandardsDictionaryFull
    if full.MeasuringInstrumentsDictionaryID != nil {
        stds, err := s.repo.ListStandardsByMID(ctx, *full.MeasuringInstrumentsDictionaryID)
        if err == nil {
            for _, st := range stds {
                standards = append(standards, StandardsDictionaryFull{ID: st.ID.String(), Model: st.Model})
            }
        }
    }
    return toFullResponse(full, standards), nil
}

// Update – обновление
func (s *service) Update(ctx context.Context, idStr string, req UpdateEquipmentDictionaryRequest) (*EquipmentDictionaryFull, error) {
    id, err := uuid.Parse(idStr)
    if err != nil {
        return nil, fmt.Errorf("invalid ID: %w", err)
    }

    // Получаем текущую запись (полную)
    current, err := s.repo.GetEquipmentDictByID(ctx, id)
    if err != nil {
        return nil, err
    }

    // Обновляем базовые поля
    if req.FullName != nil {
        current.FullName = *req.FullName
    }
    if req.Model != nil {
        current.Model = *req.Model
    }

    newMID := current.MeasuringInstrumentsDictionaryID
    if req.MeasuringInstrumentsDictionaryID != nil && *req.MeasuringInstrumentsDictionaryID != "" {
        midUUID, err := uuid.Parse(*req.MeasuringInstrumentsDictionaryID)
        if err != nil {
            return nil, fmt.Errorf("invalid MID ID: %w", err)
        }
        newMID = &midUUID
    } else if req.MeasuringInstrument != nil {
        // Создаём новый MID и стандарты (аналогично Create)
        var metrologicalTypeID *int32
        if req.MeasuringInstrument.MetrologicalOperationTypeID != nil {
            metrologicalTypeID = req.MeasuringInstrument.MetrologicalOperationTypeID
        }
        midParams := generated.CreateMeasuringInstrumentsDictionaryParams{
            RegistryNumber:             req.MeasuringInstrument.RegistryNumber,
            MetrologicalOperationTypeID: metrologicalTypeID,
        }
        newMIDRow, err := s.repo.CreateMID(ctx, midParams)
        if err != nil {
            return nil, fmt.Errorf("failed to create MID: %w", err)
        }
        newMID = &newMIDRow.ID

        for _, stdModel := range req.MeasuringInstrument.Standards {
            stdParams := generated.CreateStandardsDictionaryParams{
                MeasuringInstrumentsDictionaryID: toPGUUID(*newMID),
                Model:                            stdModel,
            }
            if _, err := s.repo.CreateStandardsDict(ctx, stdParams); err != nil {
                return nil, fmt.Errorf("failed to create standard: %w", err)
            }
        }
    }

    // Обновляем EquipmentDictionary
    updateParams := generated.UpdateEquipmentDictionaryParams{
        ID:                               toPGUUID(id),
        FullName:                         current.FullName,
        Model:                            current.Model,
        MeasuringInstrumentsDictionaryID: toNullPGUUID(newMID),
    }
    updated, err := s.repo.UpdateEquipmentDict(ctx, updateParams)
    if err != nil {
        return nil, err
    }

    var standards []StandardsDictionaryFull
    if updated.MeasuringInstrumentsDictionaryID != nil {
        stds, err := s.repo.ListStandardsByMID(ctx, *updated.MeasuringInstrumentsDictionaryID)
        if err == nil {
            for _, st := range stds {
                standards = append(standards, StandardsDictionaryFull{ID: st.ID.String(), Model: st.Model})
            }
        }
    }
    return toFullResponse(updated, standards), nil
}

// Delete – удаление
func (s *service) Delete(ctx context.Context, idStr string) error {
    id, err := uuid.Parse(idStr)
    if err != nil {
        return fmt.Errorf("invalid ID: %w", err)
    }
    // Получаем MID перед удалением
    dict, err := s.repo.GetEquipmentDictByID(ctx, id)
    if err != nil {
        return err
    }
    midID := dict.MeasuringInstrumentsDictionaryID

    if err := s.repo.DeleteEquipmentDict(ctx, id); err != nil {
        return err
    }
    if midID != nil {
        _ = s.repo.DeleteStandardsByMID(ctx, *midID)
        _ = s.repo.DeleteMID(ctx, *midID)
    }
    return nil
}

// List – список
func (s *service) List(ctx context.Context, limit, offset int32) ([]*EquipmentDictionaryFull, int64, error) {
    if limit <= 0 {
        limit = 10
    }
    if limit > 100 {
        limit = 100
    }
    if offset < 0 {
        offset = 0
    }

    items, total, err := s.repo.ListEquipmentDicts(ctx, limit, offset)
    if err != nil {
        return nil, 0, err
    }

    result := make([]*EquipmentDictionaryFull, len(items))
    for i, it := range items {
        full, err := s.repo.GetEquipmentDictByID(ctx, it.ID)
        if err != nil {
            result[i] = &EquipmentDictionaryFull{
                ID:        it.ID.String(),
                FullName:  it.FullName,
                Model:     it.Model,
            }
            continue
        }
        standards, err := s.getStandardsForMID(ctx, full.MeasuringInstrumentsDictionaryID)
        if err != nil {
            standards = nil
        }
        result[i] = toFullResponse(full, standards)
    }
    return result, total, nil
}

func (s *service) getStandardsForMID(ctx context.Context, midID *uuid.UUID) ([]StandardsDictionaryFull, error) {
    if midID == nil {
        return nil, nil
    }
    stds, err := s.repo.ListStandardsByMID(ctx, *midID)
    if err != nil {
        return nil, err
    }
    result := make([]StandardsDictionaryFull, len(stds))
    for i, st := range stds {
        result[i] = StandardsDictionaryFull{
            ID:    st.ID.String(),
            Model: st.Model,
        }
    }
    return result, nil
}

// toFullResponse – преобразует EquipmentDictionaryWithDetails + стандарты в EquipmentDictionaryFull
func toFullResponse(dict *EquipmentDictionaryWithDetails, standards []StandardsDictionaryFull) *EquipmentDictionaryFull {
    var midFull *MeasuringInstrumentsDictionaryFull
    if dict.MeasuringInstrumentsDictionaryID != nil {
        midFull = &MeasuringInstrumentsDictionaryFull{
            ID:                         dict.MeasuringInstrumentsDictionaryID.String(),
            RegistryNumber:             getStringValue(dict.RegistryNumber),
            MetrologicalOperationTypeID: dict.MetrologicalOperationTypeID,
            MetrologicalOperationType:  dict.MetrologicalOperationType,
            Standards:                  standards,
        }
    }
    return &EquipmentDictionaryFull{
        ID:          dict.ID.String(),
        FullName:    dict.FullName,
        Model:       dict.Model,
        MID:         midFull,
    }
}

func getStringValue(ptr *string) string {
    if ptr == nil {
        return ""
    }
    return *ptr
}
