package equipment

import (
    "context"
    "fmt"
    "time"

    "github.com/google/uuid"
    "github.com/jackc/pgx/v5/pgtype"

    "backend/internal/db/generated"
)

type EquipmentRepository interface {
    Create(ctx context.Context, m Equipment) (*Equipment, error)
    GetByID(ctx context.Context, id uuid.UUID) (*EquipmentWithDetails, error)
    GetEquipmentDictionaryByID(ctx context.Context, id uuid.UUID) (*EquipmentDictionaryInfo, error)
    CreateMeasuringInstrument(ctx context.Context, mi MeasuringInstrument) error
    CreateStandard(ctx context.Context, s Standard) error
//    Update(ctx context.Context, m Equipment) (*Equipment, error)
    Delete(ctx context.Context, id uuid.UUID) error
    List(ctx context.Context, limit, offset int32) ([]EquipmentWithDetails, int64, error)
    ListStandardsByEquipmentID(ctx context.Context, equipmentID uuid.UUID) ([]StandardInfo, error)
    Exists(ctx context.Context, id uuid.UUID) (bool, error)
}

type equipmentRepository struct {
    q *generated.Queries
}

func NewRepository(q *generated.Queries) EquipmentRepository {
    return &equipmentRepository{q: q}
}

func toPGUUID(id uuid.UUID) pgtype.UUID {
    return pgtype.UUID{Bytes: id, Valid: true}
}

func toNullPGUUID(id *uuid.UUID) pgtype.UUID {
    if id == nil {
        return pgtype.UUID{}
    }
    return pgtype.UUID{Bytes: *id, Valid: true}
}

func toNullDate(t *time.Time) pgtype.Date {
    if t == nil {
        return pgtype.Date{}
    }
    return pgtype.Date{Time: *t, Valid: true}
}

func fromNullUUID(v pgtype.UUID) *uuid.UUID {
    if !v.Valid {
        return nil
    }
    id := uuid.UUID(v.Bytes)
    return &id
}

func fromNullDate(v pgtype.Date) *time.Time {
    if !v.Valid {
        return nil
    }
    return &v.Time
}

func mapRow(r *generated.Equipment) *Equipment {
    return &Equipment{
        ID:                    uuid.UUID(r.ID.Bytes),
        FactoryNumber:         r.FactoryNumber,
        InventoryNumber:       r.InventoryNumber,
        ManufactureYear:       r.ManufactureYear.Time,
        EquipmentDictionaryID: uuid.UUID(r.EquipmentDictionaryID.Bytes),
        OrganizationID:        uuid.UUID(r.OrganizationID.Bytes),
        StatusID:              r.StatusID,      
    }
}

func mapRowWithDetails(r *generated.GetEquipmentByIDRow) *EquipmentWithDetails {
    var measuringInstrumentID *uuid.UUID
    if r.MeasuringInstrumentID.Valid {
        id := uuid.UUID(r.MeasuringInstrumentID.Bytes)
        measuringInstrumentID = &id
    }

    miInfo := &MeasuringInstrumentInfo{
        ID:                           measuringInstrumentID,
        CertificateNumber:            r.MiCertificateNumber,
        LastOperationDate:            datePtrToStringPtr(r.MiLastOperationDate),
        NextOperationDate:            datePtrToStringPtr(r.MiNextOperationDate),
        DocumentProviderOrganization: r.MiDocumentProviderOrganization,
        DocumentURL:                  r.MiDocumentUrl,
        RegistryNumber:               r.RegistryNumber,
        MetrologicalOperationType:    r.MetrologicalOperationType,
    }

    return &EquipmentWithDetails{
        ID:                         uuid.UUID(r.ID.Bytes),
        ManufacturerID:             uuid.UUID(r.ManufacturerID.Bytes),
        ManufacturerName:           getStringValue(r.ManufacturerName),
        UsageClassification:        getStringValue(r.UsageClassification),
        EquipmentDictionaryID:      uuid.UUID(r.EquipmentDictionaryID.Bytes),
        EquipmentName:              getStringValue(r.EquipmentName),
        Model:                      getStringValue(r.Model),
        MeasuringInstrumentsDictID: fromNullUUID(r.MeasuringInstrumentsDictionaryID),
        FactoryNumber:              r.FactoryNumber,
        InventoryNumber:            r.InventoryNumber,
        ManufactureYear:            r.ManufactureYear.Time,
        OrganizationID:             uuid.UUID(r.OrganizationID.Bytes),
        OrganizationName:           getStringValue(r.OrganizationName),
        StatusID:                   r.StatusID,
        StatusName:                 getStringValue(r.StatusName),
        MeasuringInstrument:        miInfo,
    }
}

func mapRowWithDetailsFromList(r *generated.ListEquipmentRow) *EquipmentWithDetails {
    // Базовые поля
    equipmentName := getStringValue(r.EquipmentName)
    model := getStringValue(r.Model)
    manufacturerName := getStringValue(r.ManufacturerName)
    usageClassification := getStringValue(r.UsageClassification)
    organizationName := getStringValue(r.OrganizationName)
    statusName := getStringValue(r.StatusName)
    registryNumber := getStringValue(r.RegistryNumber)
    metrologicalOperationType := getStringValue(r.MetrologicalOperationType)

    // Данные средства измерения
    var measuringInstrumentID *uuid.UUID
    if r.MeasuringInstrumentID.Valid {
        id := uuid.UUID(r.MeasuringInstrumentID.Bytes)
        measuringInstrumentID = &id
    }

    miInfo := &MeasuringInstrumentInfo{
        ID:                           measuringInstrumentID,
        CertificateNumber:            r.MiCertificateNumber,
        LastOperationDate:            datePtrToStringPtr(r.MiLastOperationDate),
        NextOperationDate:            datePtrToStringPtr(r.MiNextOperationDate),
        DocumentProviderOrganization: r.MiDocumentProviderOrganization,
        DocumentURL:                  r.MiDocumentUrl,
        RegistryNumber:               &registryNumber,
        MetrologicalOperationType:    &metrologicalOperationType,
    }


    return &EquipmentWithDetails{
        ID:                         uuid.UUID(r.ID.Bytes),
        ManufacturerID:             uuid.UUID(r.ManufacturerID.Bytes),
        ManufacturerName:           manufacturerName,
        UsageClassification:        usageClassification,
        EquipmentDictionaryID:      uuid.UUID(r.EquipmentDictionaryID.Bytes),
        EquipmentName:              equipmentName,
        Model:                      model,
        MeasuringInstrumentsDictID: fromNullUUID(r.MeasuringInstrumentsDictionaryID),
        FactoryNumber:              r.FactoryNumber,
        InventoryNumber:            r.InventoryNumber,
        ManufactureYear:            r.ManufactureYear.Time,
        OrganizationID:             uuid.UUID(r.OrganizationID.Bytes),
        OrganizationName:           organizationName,
        StatusID:                   r.StatusID,
        StatusName:                 statusName,
        MeasuringInstrument:        miInfo,
    }
}


func getStringValue(ptr *string) string {
    if ptr == nil {
        return ""
    }
    return *ptr
}

func (r *equipmentRepository) GetEquipmentDictionaryByID(ctx context.Context, id uuid.UUID) (*EquipmentDictionaryInfo, error) {
    row, err := r.q.GetEquipmentDictionaryByID(ctx, toPGUUID(id))
    if err != nil {
        return nil, err
    }

    var measuringInstrumentsDictID *uuid.UUID
    if row.MeasuringInstrumentsDictionaryID.Valid {
        id := uuid.UUID(row.MeasuringInstrumentsDictionaryID.Bytes)
        measuringInstrumentsDictID = &id
    }

    var measuringInstrumentInfo *MeasuringInstrumentInfo
    if measuringInstrumentsDictID != nil {
        measuringInstrumentInfo = &MeasuringInstrumentInfo{
            RegistryNumber:            row.RegistryNumber,
            MetrologicalOperationType: row.MetrologicalOperationType,
        }
        if row.MetrologicalOperationTypeID != nil {
            measuringInstrumentInfo.MetrologicalOperationTypeID = row.MetrologicalOperationTypeID
        }
    }

    return &EquipmentDictionaryInfo{
        ID:                         uuid.UUID(row.ID.Bytes),
        FullName:                   row.FullName,
        Model:                      row.Model,
        MeasuringInstrumentsDictionaryID: measuringInstrumentsDictID,
        MeasuringInstrumentInfo: measuringInstrumentInfo,
    }, nil
}

func (r *equipmentRepository) CreateMeasuringInstrument(ctx context.Context, mi MeasuringInstrument) error {
    params := generated.CreateMeasuringInstrumentParams{
        EquipmentID:                 toPGUUID(mi.EquipmentID),
        MetrologicalOperationTypeID: mi.MetrologicalOperationTypeID,
        CertificateNumber:           mi.CertificateNumber,
        LastOperationDate:           toNullDate(mi.LastOperationDate),
        NextOperationDate:           toNullDate(mi.NextOperationDate),
        DocumentProviderOrganization: mi.DocumentProviderOrganization,
        DocumentUrl:                 mi.DocumentURL,
    }
    _, err := r.q.CreateMeasuringInstrument(ctx, params)
    return err
}

func (r *equipmentRepository) CreateStandard(ctx context.Context, s Standard) error {
    params := generated.CreateStandardParams{
        EquipmentID:                 toPGUUID(s.EquipmentID),
        CertificateNumber:           s.CertificateNumber,
        LastOperationDate:           toNullDate(s.LastOperationDate),
        NextOperationDate:           toNullDate(s.NextOperationDate),
        DocumentProviderOrganization: s.DocumentProviderOrganization,
        DocumentUrl:                 s.DocumentURL,
        MetrologicalCharacteristics: s.MetrologicalCharacteristics,
    }
    _, err := r.q.CreateStandard(ctx, params)
    return err
}

func (r *equipmentRepository) Create(ctx context.Context, m Equipment) (*Equipment, error) {
    params := generated.CreateEquipmentParams{
        ManufacturerID:        toPGUUID(m.ManufacturerID),
        FactoryNumber:         m.FactoryNumber,
        InventoryNumber:       m.InventoryNumber,
        ManufactureYear:       pgtype.Date{Time: m.ManufactureYear, Valid: true},
        EquipmentDictionaryID: toPGUUID(m.EquipmentDictionaryID),
        OrganizationID:        toPGUUID(m.OrganizationID),
        StatusID:              m.StatusID,
    }

    row, err := r.q.CreateEquipment(ctx, params)
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrCreateFailed, err)
    }
    return mapRow(&row), nil
}

func (r *equipmentRepository) GetByID(ctx context.Context, id uuid.UUID) (*EquipmentWithDetails, error) {
    row, err := r.q.GetEquipmentByID(ctx, toPGUUID(id))
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrNotFound, err)
    }
    return mapRowWithDetails(&row), nil
}

// func (r *equipmentRepository) Update(ctx context.Context, m Equipment) (*Equipment, error) {
//     params := generated.UpdateEquipmentParams{
//         ID:                    toPGUUID(m.ID),
//         FactoryNumber:         m.FactoryNumber,
//         InventoryNumber:       m.InventoryNumber,
//         ManufactureYear:       pgtype.Date{Time: m.ManufactureYear, Valid: true},
//         EquipmentDictionaryID: toPGUUID(m.EquipmentDictionaryID),
//         OrganizationID:        toPGUUID(m.OrganizationID),
//         StatusID:              m.StatusID,
//     }

//     row, err := r.q.UpdateEquipment(ctx, params)
//     if err != nil {
//         return nil, fmt.Errorf("%w: %v", ErrUpdateFailed, err)
//     }
//     return mapRow((*generated.CreateEquipmentRow)(&row)), nil
//     return nil, nil
// }

func (r *equipmentRepository) Delete(ctx context.Context, id uuid.UUID) error {
    return r.q.DeleteEquipment(ctx, toPGUUID(id))
}

func (r *equipmentRepository) Exists(ctx context.Context, id uuid.UUID) (bool, error) {
    return r.q.EquipmentExists(ctx, toPGUUID(id))
}

func (r *equipmentRepository) List(ctx context.Context, limit, offset int32) ([]EquipmentWithDetails, int64, error) {
    rows, err := r.q.ListEquipment(ctx, generated.ListEquipmentParams{
        Limit:  limit,
        Offset: offset,
    })
    if err != nil {
        return nil, 0, err
    }

    total, _ := r.q.CountEquipment(ctx)

    result := make([]EquipmentWithDetails, len(rows))
    for i := range rows {
        result[i] = *mapRowWithDetailsFromList(&rows[i])
    }
    return result, total, nil
}

func (r *equipmentRepository) ListStandardsByEquipmentID(ctx context.Context, equipmentID uuid.UUID) ([]StandardInfo, error) {
    rows, err := r.q.ListStandardsByEquipmentID(ctx, toPGUUID(equipmentID))
    if err != nil {
        return nil, err
    }
    result := make([]StandardInfo, len(rows))
    for i, row := range rows {
        var standardID *uuid.UUID
        if row.ID.Valid {
            id := uuid.UUID(row.ID.Bytes)
            standardID = &id
        }
        result[i] = StandardInfo{
            ID:                           standardID,
            CertificateNumber:            row.CertificateNumber,
            LastOperationDate:            datePtrToStringPtr(row.LastOperationDate),
            NextOperationDate:            datePtrToStringPtr(row.NextOperationDate),
            DocumentProviderOrganization: row.DocumentProviderOrganization,
            DocumentURL:                  row.DocumentUrl,
            MetrologicalCharacteristics:  row.MetrologicalCharacteristics,
        }
    }
    return result, nil
}

func datePtrToStringPtr(d pgtype.Date) *string {
    if !d.Valid {
        return nil
    }
    s := d.Time.Format("2006-01-02")
    return &s
}