package equipment

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type EquipmentService interface {
	Create(ctx context.Context, req CreateRequest) (*EquipmentResponse, error)
	List(ctx context.Context, pg Pagination) ([]*EquipmentResponse, int64, error)
	GetByID(ctx context.Context, id string) (*EquipmentResponse, error)
	Update(ctx context.Context, id string, req UpdateRequest) (*EquipmentResponse, error)
	Delete(ctx context.Context, id string) error
}

type equipmentService struct {
	repository EquipmentRepository
}

func NewService(repository EquipmentRepository) EquipmentService {
	return &equipmentService{repository: repository}
}

func (s *equipmentService) Create(ctx context.Context, req CreateRequest) (*EquipmentResponse, error) {
	if req.ManufacturerID == "" {
		return nil, ErrManufacturerRequired
	}
	if req.EquipmentDictionaryID == "" {
		return nil, ErrEquipmentDictionaryRequired
	}
	if req.OrganizationID == "" {
		return nil, ErrOrganizationRequired
	}
	if req.FactoryNumber == "" {
		return nil, ErrFactoryNumberRequired
	}
	if req.ManufactureYear == "" {
		return nil, ErrManufactureYearRequired
	}
	if req.StatusID == 0 {
		return nil, ErrStatusRequired
	}

	id := uuid.New()

	if len(req.FactoryNumber) > 50 {
		return nil, ErrFactoryNumberTooLong
	}
	if req.InventoryNumber != nil && len(*req.InventoryNumber) > 50 {
		return nil, ErrInventoryNumberTooLong
	}

	manufactureYear, err := time.Parse("2006", req.ManufactureYear)
	if err != nil {
		return nil, ErrInvalidDateFormat
	}

	manufacturerID, err := uuid.Parse(req.ManufacturerID)
	if err != nil {
		return nil, ErrInvalidUUID
	}
	exists, err := s.repository.ManufacturerExists(ctx, manufacturerID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, ErrManufacturerNotFound
	}
	equipmentDictID, err := uuid.Parse(req.EquipmentDictionaryID)
	if err != nil {
		return nil, ErrInvalidUUID
	}
	exists, err = s.repository.EquipmentDictionaryExists(ctx, equipmentDictID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, ErrEquipmentDictNotFound
	}

	orgID, err := uuid.Parse(req.OrganizationID)
	if err != nil {
		return nil, ErrInvalidUUID
	}
	exists, err = s.repository.OrganizationExists(ctx, orgID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, ErrOrganizationNotFound
	}

	exists, err = s.repository.EquipmentStatusExists(ctx, req.StatusID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, ErrStatusNotFound
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

	dictInfo, err := s.repository.GetEquipmentDictionaryByID(ctx, equipmentDictID)
	if err != nil {
		return nil, err
	}

	if dictInfo.MeasuringInstrumentsDictionaryID != nil {
		// Валидация данных средства измерения
		if req.CertificateNumber != nil && len(*req.CertificateNumber) > 100 {
			return nil, ErrCertificateNumberTooLong
		}
		if req.DocumentProviderOrganization != nil && len(*req.DocumentProviderOrganization) > 200 {
			return nil, ErrDocProviderTooLong
		}
		if req.DocumentURL != nil && len(*req.DocumentURL) > 255 {
			return nil, ErrDocumentURLTooLong
		}

		// Проверка и парсинг дат
		var lastOpDate, nextOpDate *time.Time
		if req.LastOperationDate != nil && *req.LastOperationDate != "" {
			t, err := time.Parse("2006-01-02", *req.LastOperationDate)
			if err != nil {
				return nil, ErrInvalidDateFormat
			}
			lastOpDate = &t
		}
		if req.NextOperationDate != nil && *req.NextOperationDate != "" {
			t, err := time.Parse("2006-01-02", *req.NextOperationDate)
			if err != nil {
				return nil, ErrInvalidDateFormat
			}
			nextOpDate = &t
		}

		// Проверка метеотипа
		var metrologicalTypeID *int32
		if req.MetrologicalOperationTypeID != nil {
			exists, err = s.repository.MetrologicalTypeExists(ctx, *req.MetrologicalOperationTypeID)
			if err != nil {
				return nil, err
			}
			if !exists {
				return nil, ErrMetrologicalTypeNotFound
			}
			metrologicalTypeID = req.MetrologicalOperationTypeID
		} else if dictInfo.MeasuringInstrumentInfo.MetrologicalOperationTypeID != nil {
			metrologicalTypeID = dictInfo.MeasuringInstrumentInfo.MetrologicalOperationTypeID
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
			DocumentProviderOrganization: req.DocumentProviderOrganization,
			DocumentURL:                  documentURL,
		}

		if err := s.repository.CreateMeasuringInstrument(ctx, mi); err != nil {
			return nil, fmt.Errorf("failed to create measuring instrument: %w", err)
		}

		for _, stdReq := range req.Standards {
			// Валидация длины полей эталона
			if stdReq.CertificateNumber != nil && len(*stdReq.CertificateNumber) > 100 {
				return nil, ErrStandardCertNumberTooLong
			}
			if stdReq.DocumentProviderOrganization != nil && len(*stdReq.DocumentProviderOrganization) > 100 {
				return nil, ErrStandardDocProviderTooLong
			}
			if stdReq.DocumentURL != nil && len(*stdReq.DocumentURL) > 255 {
				return nil, ErrStandardDocumentURLTooLong
			}
			if stdReq.MetrologicalCharacteristics != nil && len(*stdReq.MetrologicalCharacteristics) > 10000 {
				return nil, ErrMetrologicalCharacteristicsTooLong
			}
			if stdReq.Model == "" {
				return nil, ErrStandardModelNotFound
			}

			// Проверка существования модели эталона в словаре
			stdDictID, err := s.repository.GetStandardDictionaryIDByModelAndMID(ctx, stdReq.Model, *dictInfo.MeasuringInstrumentsDictionaryID)
			if err != nil {
				return nil, err
			}
			if stdDictID == nil {
				return nil, fmt.Errorf("%w: %s", ErrStandardModelNotFound, stdReq.Model)
			}

			// Парсинг дат эталона
			var lastOpDateStd, nextOpDateStd *time.Time
			if stdReq.LastOperationDate != nil && *stdReq.LastOperationDate != "" {
				t, err := time.Parse("2006-01-02", *stdReq.LastOperationDate)
				if err != nil {
					return nil, ErrInvalidDateFormat
				}
				lastOpDateStd = &t
			}
			if stdReq.NextOperationDate != nil && *stdReq.NextOperationDate != "" {
				t, err := time.Parse("2006-01-02", *stdReq.NextOperationDate)
				if err != nil {
					return nil, ErrInvalidDateFormat
				}
				nextOpDateStd = &t
			}

			std := Standard{
				EquipmentID:                  eq.ID,
				StandardsDictionaryID:        stdDictID,
				CertificateNumber:            stdReq.CertificateNumber,
				LastOperationDate:            lastOpDateStd,
				NextOperationDate:            nextOpDateStd,
				DocumentProviderOrganization: stdReq.DocumentProviderOrganization,
				DocumentURL:                  stdReq.DocumentURL,
				MetrologicalCharacteristics:  stdReq.MetrologicalCharacteristics,
			}
			if err := s.repository.CreateStandard(ctx, std); err != nil {
				return nil, fmt.Errorf("failed to create standard: %w", err)
			}
		}
	}

	full, err := s.repository.GetByID(ctx, eq.ID)
	if err != nil {
		return toResponseFromEquipment(eq), nil
	}

	standards, err := s.repository.ListStandardsByEquipmentID(ctx, eq.ID)
	if err != nil {
		standards = []StandardInfo{}
	}

	return toResponseWithStandards(full, standards), nil
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

	standards, err := s.repository.ListStandardsByEquipmentID(ctx, eqID)
	if err != nil {
		standards = []StandardInfo{}
		return nil, err
	}

	return toResponseWithStandards(eq, standards), nil
}

func (s *equipmentService) Update(ctx context.Context, idStr string, req UpdateRequest) (*EquipmentResponse, error) {
	eqID, err := uuid.Parse(idStr)
	if err != nil {
		return nil, ErrInvalidID
	}

	// Получаем текущее оборудование (с деталями, но без эталонов)
	current, err := s.repository.GetByID(ctx, eqID)
	if err != nil {
		return nil, ErrNotFound
	}

	// Текущий словарь оборудования
	currentDictID, err := uuid.Parse(current.EquipmentDictionaryID.String())
	if err != nil {
		return nil, ErrInvalidUUID
	}
	dictInfo, err := s.repository.GetEquipmentDictionaryByID(ctx, currentDictID)
	if err != nil {
		return nil, err
	}

	// ========================================
	// 1. Обновление основных полей оборудования
	// ========================================
	model := Equipment{
		ID:                    eqID,
		ManufacturerID:        current.ManufacturerID,
		EquipmentDictionaryID: currentDictID,
		FactoryNumber:         current.FactoryNumber,
		InventoryNumber:       current.InventoryNumber,
		ManufactureYear:       current.ManufactureYear,
		OrganizationID:        current.OrganizationID,
		StatusID:              current.StatusID,
	}

	// Производитель
	if req.ManufacturerID != nil && *req.ManufacturerID != "" {
		mid, err := uuid.Parse(*req.ManufacturerID)
		if err != nil {
			return nil, ErrInvalidUUID
		}
		exists, err := s.repository.ManufacturerExists(ctx, mid)
		if err != nil {
			return nil, err
		}
		if !exists {
			return nil, ErrManufacturerNotFound
		}
		model.ManufacturerID = mid
	}

	// Словарь оборудования
	if req.EquipmentDictionaryID != nil && *req.EquipmentDictionaryID != "" {
		dictID, err := uuid.Parse(*req.EquipmentDictionaryID)
		if err != nil {
			return nil, ErrInvalidUUID
		}
		exists, err := s.repository.EquipmentDictionaryExists(ctx, dictID)
		if err != nil {
			return nil, err
		}
		if !exists {
			return nil, ErrEquipmentDictNotFound
		}
		model.EquipmentDictionaryID = dictID
	}

	// Заводской номер
	if req.FactoryNumber != nil {
		if len(*req.FactoryNumber) > 50 {
			return nil, ErrFactoryNumberTooLong
		}
		model.FactoryNumber = *req.FactoryNumber
	}

	// Инвентарный номер
	if req.InventoryNumber != nil {
		if len(*req.InventoryNumber) > 50 {
			return nil, ErrInventoryNumberTooLong
		}
		model.InventoryNumber = req.InventoryNumber
	}

	// Год выпуска
	if req.ManufactureYear != nil && *req.ManufactureYear != "" {
		t, err := time.Parse("2006", *req.ManufactureYear)
		if err != nil {
			return nil, ErrInvalidDateFormat
		}
		model.ManufactureYear = t
	}

	// Организация
	if req.OrganizationID != nil && *req.OrganizationID != "" {
		orgID, err := uuid.Parse(*req.OrganizationID)
		if err != nil {
			return nil, ErrInvalidUUID
		}
		exists, err := s.repository.OrganizationExists(ctx, orgID)
		if err != nil {
			return nil, err
		}
		if !exists {
			return nil, ErrOrganizationNotFound
		}
		model.OrganizationID = orgID
	}

	// Статус
	if req.StatusID != nil {
		exists, err := s.repository.EquipmentStatusExists(ctx, *req.StatusID)
		if err != nil {
			return nil, err
		}
		if !exists {
			return nil, ErrStatusNotFound
		}
		model.StatusID = *req.StatusID
	}

	// Сохраняем изменения оборудования
	updatedEq, err := s.repository.UpdateEquipment(ctx, model)
	if err != nil {
		return nil, err
	}

	// ========================================
	// 2. Обновление средства измерения (если есть)
	// ========================================
	// Получаем текущее средство измерения (если есть)
	currentMI, err := s.repository.GetMeasuringInstrumentByEquipmentID(ctx, eqID)
	if err != nil {
		return nil, err
	}

	// Если оборудование имеет MID и в запросе есть поля для его обновления
	if dictInfo.MeasuringInstrumentsDictionaryID != nil {
		// Подготавливаем обновлённый MI (если ещё нет, создаём новый)
		mi := MeasuringInstrument{
			EquipmentID: eqID,
		}
		if currentMI != nil {
			mi.ID = currentMI.ID
			mi.MetrologicalOperationTypeID = currentMI.MetrologicalOperationTypeID
			mi.CertificateNumber = currentMI.CertificateNumber
			mi.LastOperationDate = currentMI.LastOperationDate
			mi.NextOperationDate = currentMI.NextOperationDate
			mi.DocumentProviderOrganization = currentMI.DocumentProviderOrganization
			mi.DocumentURL = currentMI.DocumentURL
		}

		// Обновляем поля из запроса
		if req.MetrologicalOperationTypeID != nil {
			// Проверяем существование метеотипа
			exists, err := s.repository.MetrologicalTypeExists(ctx, *req.MetrologicalOperationTypeID)
			if err != nil {
				return nil, err
			}
			if !exists {
				return nil, ErrMetrologicalTypeNotFound
			}
			mi.MetrologicalOperationTypeID = req.MetrologicalOperationTypeID
		}
		if req.CertificateNumber != nil {
			if len(*req.CertificateNumber) > 100 {
				return nil, ErrCertificateNumberTooLong
			}
			mi.CertificateNumber = req.CertificateNumber
		}
		if req.LastOperationDate != nil {
			if *req.LastOperationDate == "" {
				mi.LastOperationDate = nil
			} else {
				t, err := time.Parse("2006-01-02", *req.LastOperationDate)
				if err != nil {
					return nil, ErrInvalidDateFormat
				}
				mi.LastOperationDate = &t
			}
		}
		if req.NextOperationDate != nil {
			if *req.NextOperationDate == "" {
				mi.NextOperationDate = nil
			} else {
				t, err := time.Parse("2006-01-02", *req.NextOperationDate)
				if err != nil {
					return nil, ErrInvalidDateFormat
				}
				mi.NextOperationDate = &t
			}
		}
		if req.DocumentProviderOrganization != nil {
			if len(*req.DocumentProviderOrganization) > 200 {
				return nil, ErrDocProviderTooLong
			}
			mi.DocumentProviderOrganization = req.DocumentProviderOrganization
		}
		if req.DocumentURL != nil {
			if len(*req.DocumentURL) > 255 {
				return nil, ErrDocumentURLTooLong
			}
			mi.DocumentURL = req.DocumentURL
		}

		// Сохраняем MI (создаём или обновляем)
		if currentMI == nil {
			// Создаём новое MI
			if err := s.repository.CreateMeasuringInstrument(ctx, mi); err != nil {
				return nil, fmt.Errorf("failed to create measuring instrument: %w", err)
			}
		} else {
			// Обновляем существующее
			if err := s.repository.UpdateMeasuringInstrument(ctx, mi); err != nil {
				return nil, fmt.Errorf("failed to update measuring instrument: %w", err)
			}
		}
	} else if currentMI != nil {
		// Если оборудование больше не должно иметь MI (но в запросе нет полей – удаляем)
		// По условию задачи, если словарь не содержит MID, значит нет и MI. Удаляем, если он был.
		if err := s.repository.DeleteMeasuringInstrument(ctx, eqID); err != nil {
			return nil, err
		}
	}

	// ========================================
	// 3. Обновление эталонов (поштучно)
	// ========================================
	for _, stdReq := range req.Standards {
		if stdReq.ID == "" {
			return nil, fmt.Errorf("standard ID is required for update")
		}
		stdID, err := uuid.Parse(stdReq.ID)
		if err != nil {
			return nil, fmt.Errorf("%w: invalid standard ID", ErrInvalidUUID)
		}

		// Проверяем, что эталон принадлежит этому оборудованию
		exists, err := s.repository.StandardExistsForEquipment(ctx, stdID, eqID)
		if err != nil {
			return nil, err
		}
		if !exists {
			return nil, fmt.Errorf("standard %s not found for this equipment", stdID)
		}

		var lastOpDate, nextOpDate *time.Time
		if stdReq.LastOperationDate != nil {
			if *stdReq.LastOperationDate == "" {
				lastOpDate = nil
			} else {
				t, err := time.Parse("2006-01-02", *stdReq.LastOperationDate)
				if err != nil {
					return nil, ErrInvalidDateFormat
				}
				lastOpDate = &t
			}
		}
		if stdReq.NextOperationDate != nil {
			if *stdReq.NextOperationDate == "" {
				nextOpDate = nil
			} else {
				t, err := time.Parse("2006-01-02", *stdReq.NextOperationDate)
				if err != nil {
					return nil, ErrInvalidDateFormat
				}
				nextOpDate = &t
			}
		}

		if stdReq.CertificateNumber != nil && len(*stdReq.CertificateNumber) > 100 {
			return nil, ErrStandardCertNumberTooLong
		}
		if stdReq.DocumentProviderOrganization != nil && len(*stdReq.DocumentProviderOrganization) > 100 {
			return nil, ErrStandardDocProviderTooLong
		}
		if stdReq.DocumentURL != nil && len(*stdReq.DocumentURL) > 255 {
			return nil, ErrStandardDocumentURLTooLong
		}
		if stdReq.MetrologicalCharacteristics != nil && len(*stdReq.MetrologicalCharacteristics) > 10000 {
			return nil, ErrMetrologicalCharacteristicsTooLong
		}

		stdUpdate := StandardUpdate{
			ID:                           stdID,
			CertificateNumber:            stdReq.CertificateNumber,
			LastOperationDate:            lastOpDate,
			NextOperationDate:            nextOpDate,
			DocumentProviderOrganization: stdReq.DocumentProviderOrganization,
			DocumentURL:                  stdReq.DocumentURL,
			MetrologicalCharacteristics:  stdReq.MetrologicalCharacteristics,
		}
		if err := s.repository.UpdateStandard(ctx, stdUpdate); err != nil {
			return nil, fmt.Errorf("failed to update standard: %w", err)
		}
	}

	full, err := s.repository.GetByID(ctx, eqID)
	if err != nil {
		return toResponseFromEquipment(updatedEq), nil
	}
	standards, err := s.repository.ListStandardsByEquipmentID(ctx, eqID)
	if err != nil {
		standards = []StandardInfo{}
	}
	return toResponseWithStandards(full, standards), nil
}

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
		ID:                  eq.ID.String(),
		ManufacturerName:    eq.ManufacturerName,
		UsageClassification: eq.UsageClassification,
		EquipmentName:       eq.EquipmentName,
		Model:               eq.Model,
		FactoryNumber:       eq.FactoryNumber,
		ManufactureYear:     eq.ManufactureYear.Format("2006"),
		OrganizationName:    eq.OrganizationName,
		StatusID:            eq.StatusID,
		StatusName:          eq.StatusName,
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
		ID:                  eq.ID.String(),
		ManufacturerName:    eq.ManufacturerName,
		UsageClassification: eq.UsageClassification,
		EquipmentName:       eq.EquipmentName,
		Model:               eq.Model,
		FactoryNumber:       eq.FactoryNumber,
		ManufactureYear:     eq.ManufactureYear.Format("2006"),
		OrganizationName:    eq.OrganizationName,
		StatusID:            eq.StatusID,
		StatusName:          eq.StatusName,
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
