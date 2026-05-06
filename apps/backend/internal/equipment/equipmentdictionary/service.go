// internal/equipment/equipmentdictionary/service.go
package equipmentdictionary

import (
    "context"

    "github.com/google/uuid"
)

type MetrologicalTypeRepository interface {
    Exists(ctx context.Context, id int64) (bool, error)
}

type Service interface {
    Create(ctx context.Context, req CreateEquipmentDictionaryRequest) (*EquipmentDictionaryFull, error)
    GetByID(ctx context.Context, id string) (*EquipmentDictionaryFull, error)
    Update(ctx context.Context, id string, req UpdateEquipmentDictionaryRequest) (*EquipmentDictionaryFull, error)
    Delete(ctx context.Context, id string) error
    List(ctx context.Context, pg Pagination) ([]*EquipmentDictionaryFull, int64, error)
}

type service struct {
    repo Repository
    mtRepo MetrologicalTypeRepository
}

func NewService(repo Repository, mtRepo MetrologicalTypeRepository) Service {
    return &service{repo: repo, mtRepo: mtRepo}
}

func (s *service) Create(ctx context.Context, req CreateEquipmentDictionaryRequest) (*EquipmentDictionaryFull, error) {
    var midID *uuid.UUID

    if req.MeasuringInstrument != nil {
        // Валидация registry_number
        if req.MeasuringInstrument.RegistryNumber == "" {
            return nil, ErrRegistryNumberRequired
        }
        if len(req.MeasuringInstrument.RegistryNumber) > 50 {
            return nil, ErrRegistryNumberTooLong
        }

        // Проверка уникальности registry_number
        registryNumberExists, err := s.repo.ExistsMIDByRegistryNumber(ctx, req.MeasuringInstrument.RegistryNumber)
        if err != nil {
            return nil, err
        }
        if registryNumberExists {
            return nil, ErrRegistryNumberNotUnique
        }

        exists, err := s.mtRepo.Exists(ctx, int64(req.MeasuringInstrument.MetrologicalOperationTypeID))
        if err != nil {
            return nil, err
        }
        if !exists {
            return nil, ErrMetrologicalTypeNotFound
        }


        // Валидация эталонов
        for _, stdModel := range req.MeasuringInstrument.Standards {
            if len(stdModel) > 100 {
                return nil, ErrStandardModelTooLong
            }
        }

        // Создаём MID
        newMID, err := s.repo.CreateMID(ctx, req.MeasuringInstrument.RegistryNumber, req.MeasuringInstrument.MetrologicalOperationTypeID)
        if err != nil {
            return nil, err
        }
        midID = &newMID.ID

        // Создаём эталоны
        for _, stdModel := range req.MeasuringInstrument.Standards {
            if _, err := s.repo.CreateStandardsDict(ctx, *midID, stdModel); err != nil {
                return nil, ErrStandardCreationFailed
            }
        }
    }

    // Создаём EquipmentDictionary
    full, err := s.repo.CreateEquipmentDict(ctx, req.FullName, req.Model, midID)
    if err != nil {
        return nil, err
    }

    // Получаем эталоны для ответа
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
        return nil, ErrInvalidID
    }
    full, err := s.repo.GetEquipmentDictByID(ctx, id)
    if err != nil {
        return nil, ErrNotFound
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

func (s *service) Update(ctx context.Context, idStr string, req UpdateEquipmentDictionaryRequest) (*EquipmentDictionaryFull, error) {
    id, err := uuid.Parse(idStr)
    if err != nil {
        return nil, ErrInvalidID
    }

    // Получаем текущую запись (полную)
    current, err := s.repo.GetEquipmentDictByID(ctx, id)
    if err != nil {
        return nil, ErrNotFound
    }

    // Обновляем базовые поля
    if req.FullName != nil {
        current.FullName = *req.FullName
    }
    if req.Model != nil {
        current.Model = *req.Model
    }

    newMID := current.MeasuringInstrumentsDictionaryID

    if req.MeasuringInstrument != nil {
        if current.MeasuringInstrumentsDictionaryID == nil {
            // нельзя добавить MID через update
            return nil, ErrMIDNotFound
        }
        originalMID, err := s.repo.GetMIDByID(ctx, *current.MeasuringInstrumentsDictionaryID)

        // Валидация registry_number
        var finalRegistryNumber string
        if req.MeasuringInstrument.RegistryNumber != nil && *req.MeasuringInstrument.RegistryNumber != "" {
            if len(*req.MeasuringInstrument.RegistryNumber) > 50 {
                return nil, ErrRegistryNumberTooLong
            }


            // Проверяем уникальность registry_number
            originalMID, err := s.repo.GetMIDByID(ctx, *current.MeasuringInstrumentsDictionaryID)
            if err != nil {
                return nil, err
            }
            if originalMID.RegistryNumber != *req.MeasuringInstrument.RegistryNumber {
                exists, err := s.repo.ExistsMIDByRegistryNumber(ctx, *req.MeasuringInstrument.RegistryNumber)
                if err != nil {
                    return nil, err
                }
                if exists {
                    return nil, ErrRegistryNumberNotUnique
                }
            }
            finalRegistryNumber = *req.MeasuringInstrument.RegistryNumber
        } else {
            finalRegistryNumber = originalMID.RegistryNumber
        }

        // Проверяем metrologicalOperationTypeID
        var finalMetrologicalTypeID int32
        if req.MeasuringInstrument.MetrologicalOperationTypeID != nil {
            exists, err := s.mtRepo.Exists(ctx, int64(*req.MeasuringInstrument.MetrologicalOperationTypeID))
            if err != nil {
                return nil, err
            }
            if !exists {
                return nil, ErrMetrologicalTypeNotFound
            }
            finalMetrologicalTypeID = *req.MeasuringInstrument.MetrologicalOperationTypeID
        } else {
            finalMetrologicalTypeID = originalMID.MetrologicalOperationTypeID
        }
    
        // Валидация эталонов
        for _, stdModel := range req.MeasuringInstrument.Standards {
            if len(stdModel) > 100 {
                return nil, ErrStandardModelTooLong
            }
        }

        // Обновляем существующий MID
        err = s.repo.UpdateMID(ctx, *current.MeasuringInstrumentsDictionaryID, finalRegistryNumber, finalMetrologicalTypeID)
        if err != nil {
            return nil, err
        }

        // Обновляем стандарты: если передан массив - удаляем старые и создаём новые
        if req.MeasuringInstrument.Standards != nil {
            if err := s.repo.DeleteStandardsByMID(ctx, *current.MeasuringInstrumentsDictionaryID); err != nil {
                return nil, err
            }
            for _, stdModel := range req.MeasuringInstrument.Standards {
                if _, err := s.repo.CreateStandardsDict(ctx, *current.MeasuringInstrumentsDictionaryID, stdModel); err != nil {
                    return nil, ErrStandardCreationFailed
                }
            }
        }
        newMID = current.MeasuringInstrumentsDictionaryID
    }

    // Обновляем EquipmentDictionary
    updated, err := s.repo.UpdateEquipmentDict(ctx, id, current.FullName, current.Model, newMID)
    if err != nil {
        return nil, err
    }

    // Получаем эталоны для ответа
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
        return ErrInvalidID
    }
    // Получаем MID перед удалением
    dict, err := s.repo.GetEquipmentDictByID(ctx, id)
    if err != nil {
        return ErrNotFound
    }
    midID := dict.MeasuringInstrumentsDictionaryID

    if err := s.repo.DeleteEquipmentDict(ctx, id); err != nil {
        return ErrDeleteFailed
    }
    if midID != nil {
        _ = s.repo.DeleteStandardsByMID(ctx, *midID)
        _ = s.repo.DeleteMID(ctx, *midID)
    }
    return nil
}

// List – список
func (s *service) List(ctx context.Context, pg Pagination) ([]*EquipmentDictionaryFull, int64, error) {
    items, total, err := s.repo.ListEquipmentDicts(ctx, pg.Limit, pg.Offset)  
    if err != nil {
        return nil, 0, ErrListFailed
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
            MetrologicalOperationTypeID: *dict.MetrologicalOperationTypeID,
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
