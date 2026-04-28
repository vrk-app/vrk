package measuringinstrument

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type StandardScope struct {
	SubdivisionID *string
	UnitID        *string
	OwnerLabel    *string
}

type MeasuringInstrumentRepository interface {
	Create(ctx context.Context, item MeasuringInstrument) (*MeasuringInstrument, error)
	GetByID(ctx context.Context, id uuid.UUID) (*MeasuringInstrument, error)
	ListByOrganization(ctx context.Context, organizationID uuid.UUID, includeArchived bool) ([]MeasuringInstrument, error)
	Update(ctx context.Context, item MeasuringInstrument) (*MeasuringInstrument, error)
	Archive(ctx context.Context, id uuid.UUID) (*MeasuringInstrument, error)
	ReplaceStandardLinks(ctx context.Context, measuringInstrumentID uuid.UUID, standardIDs []uuid.UUID) error
	ListStandardLinksByOrganization(ctx context.Context, organizationID uuid.UUID) (map[string][]LinkedStandard, error)
	GetStandardScopes(ctx context.Context, organizationID uuid.UUID, standardIDs []uuid.UUID) (map[string]StandardScope, error)
	GetEquipmentSummary(ctx context.Context, id uuid.UUID) (*EquipmentSummary, string, string, error)
}

type measuringInstrumentRepository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) MeasuringInstrumentRepository {
	return &measuringInstrumentRepository{db: db}
}

const measuringInstrumentSelectColumns = `
    mi.id,
    mi.organization_id,
    mi.unit_id,
    unit.name,
    unit.subdivision_id,
    subdivision.name,
    mi.equipment_id,
    equipment.full_name,
    mi.name,
    mi.instrument_type,
    mi.model,
    mi.registration_number,
    mi.serial_number,
    mi.status,
    mi.placement_kind,
    mi.comment,
    mi.document_url,
    mi.archived_at,
    mi.created_at,
    mi.updated_at
`

func scanMeasuringInstrument(scanner interface {
	Scan(dest ...any) error
}) (*MeasuringInstrument, error) {
	var item MeasuringInstrument
	var organizationID uuid.UUID
	var unitID uuid.UUID
	var subdivisionID *uuid.UUID
	var equipmentID *uuid.UUID

	if err := scanner.Scan(
		&item.ID,
		&organizationID,
		&unitID,
		&item.UnitName,
		&subdivisionID,
		&item.SubdivisionName,
		&equipmentID,
		&item.EquipmentFullName,
		&item.Name,
		&item.InstrumentType,
		&item.Model,
		&item.RegistrationNumber,
		&item.SerialNumber,
		&item.Status,
		&item.PlacementKind,
		&item.Comment,
		&item.DocumentURL,
		&item.ArchivedAt,
		&item.CreatedAt,
		&item.UpdatedAt,
	); err != nil {
		return nil, err
	}

	item.OrganizationID = organizationID.String()
	item.UnitID = unitID.String()
	if subdivisionID != nil {
		value := subdivisionID.String()
		item.SubdivisionID = &value
	}
	if equipmentID != nil {
		value := equipmentID.String()
		item.EquipmentID = &value
	}

	return &item, nil
}

func (r *measuringInstrumentRepository) Create(ctx context.Context, item MeasuringInstrument) (*MeasuringInstrument, error) {
	query := `
        INSERT INTO registry_measuring_instruments (
            organization_id,
            unit_id,
            equipment_id,
            name,
            instrument_type,
            model,
            registration_number,
            serial_number,
            status,
            placement_kind,
            comment,
            document_url
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        )
        RETURNING id
    `

	var id uuid.UUID
	if err := r.db.QueryRow(
		ctx,
		query,
		uuid.MustParse(item.OrganizationID),
		uuid.MustParse(item.UnitID),
		nullableUUID(item.EquipmentID),
		item.Name,
		item.InstrumentType,
		item.Model,
		item.RegistrationNumber,
		item.SerialNumber,
		item.Status,
		item.PlacementKind,
		item.Comment,
		item.DocumentURL,
	).Scan(&id); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrCreateFailed, err)
	}

	return r.GetByID(ctx, id)
}

func (r *measuringInstrumentRepository) GetByID(ctx context.Context, id uuid.UUID) (*MeasuringInstrument, error) {
	query := fmt.Sprintf(`
        SELECT %s
        FROM registry_measuring_instruments mi
        JOIN auth_units unit ON unit.id = mi.unit_id
        LEFT JOIN auth_subdivisions subdivision ON subdivision.id = unit.subdivision_id
        LEFT JOIN registry_equipment equipment ON equipment.id = mi.equipment_id
        WHERE mi.id = $1
    `, measuringInstrumentSelectColumns)

	item, err := scanMeasuringInstrument(r.db.QueryRow(ctx, query, id))
	if err != nil {
		return nil, ErrNotFound
	}

	return item, nil
}

func (r *measuringInstrumentRepository) ListByOrganization(ctx context.Context, organizationID uuid.UUID, includeArchived bool) ([]MeasuringInstrument, error) {
	query := fmt.Sprintf(`
        SELECT %s
        FROM registry_measuring_instruments mi
        JOIN auth_units unit ON unit.id = mi.unit_id
        LEFT JOIN auth_subdivisions subdivision ON subdivision.id = unit.subdivision_id
        LEFT JOIN registry_equipment equipment ON equipment.id = mi.equipment_id
        WHERE mi.organization_id = $1
          AND ($2::boolean OR mi.archived_at IS NULL)
        ORDER BY mi.created_at DESC
    `, measuringInstrumentSelectColumns)

	rows, err := r.db.Query(ctx, query, organizationID, includeArchived)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrListFailed, err)
	}
	defer rows.Close()

	result := make([]MeasuringInstrument, 0)
	for rows.Next() {
		item, scanErr := scanMeasuringInstrument(rows)
		if scanErr != nil {
			return nil, fmt.Errorf("%w: %v", ErrListFailed, scanErr)
		}
		result = append(result, *item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrListFailed, err)
	}

	return result, nil
}

func (r *measuringInstrumentRepository) Update(ctx context.Context, item MeasuringInstrument) (*MeasuringInstrument, error) {
	query := `
        UPDATE registry_measuring_instruments
        SET
            unit_id = $2,
            equipment_id = $3,
            name = $4,
            instrument_type = $5,
            model = $6,
            registration_number = $7,
            serial_number = $8,
            status = $9,
            placement_kind = $10,
            comment = $11,
            document_url = $12,
            updated_at = NOW()
        WHERE id = $1
        RETURNING id
    `

	var id uuid.UUID
	if err := r.db.QueryRow(
		ctx,
		query,
		uuid.MustParse(item.ID),
		uuid.MustParse(item.UnitID),
		nullableUUID(item.EquipmentID),
		item.Name,
		item.InstrumentType,
		item.Model,
		item.RegistrationNumber,
		item.SerialNumber,
		item.Status,
		item.PlacementKind,
		item.Comment,
		item.DocumentURL,
	).Scan(&id); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrUpdateFailed, err)
	}

	return r.GetByID(ctx, id)
}

func (r *measuringInstrumentRepository) Archive(ctx context.Context, id uuid.UUID) (*MeasuringInstrument, error) {
	query := `
        UPDATE registry_measuring_instruments
        SET archived_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND archived_at IS NULL
        RETURNING id
    `

	var archivedID uuid.UUID
	if err := r.db.QueryRow(ctx, query, id).Scan(&archivedID); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrArchiveFailed, err)
	}

	return r.GetByID(ctx, archivedID)
}

func (r *measuringInstrumentRepository) ReplaceStandardLinks(ctx context.Context, measuringInstrumentID uuid.UUID, standardIDs []uuid.UUID) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `DELETE FROM registry_measuring_instrument_standards WHERE measuring_instrument_id = $1`, measuringInstrumentID); err != nil {
		return err
	}

	for _, standardID := range standardIDs {
		if _, err := tx.Exec(
			ctx,
			`INSERT INTO registry_measuring_instrument_standards (measuring_instrument_id, standard_id) VALUES ($1, $2)`,
			measuringInstrumentID,
			standardID,
		); err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (r *measuringInstrumentRepository) ListStandardLinksByOrganization(ctx context.Context, organizationID uuid.UUID) (map[string][]LinkedStandard, error) {
	rows, err := r.db.Query(ctx, `
        SELECT
            link.measuring_instrument_id,
            standard.id,
            standard.standard_type,
            standard.model,
            standard.identifier,
            standard.serial_number,
            standard.status,
            COALESCE(standard.owner_label, org.shell_name) AS scope_label
        FROM registry_measuring_instrument_standards link
        JOIN registry_measuring_instruments mi ON mi.id = link.measuring_instrument_id
        JOIN registry_standards standard ON standard.id = link.standard_id
        JOIN auth_bootstrap_organizations org ON org.id = standard.organization_id
        WHERE mi.organization_id = $1
          AND mi.archived_at IS NULL
          AND standard.archived_at IS NULL
        ORDER BY standard.created_at DESC
    `, organizationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[string][]LinkedStandard)
	for rows.Next() {
		var measuringInstrumentID uuid.UUID
		var standardID uuid.UUID
		var standard LinkedStandard
		if err := rows.Scan(
			&measuringInstrumentID,
			&standardID,
			&standard.StandardType,
			&standard.Model,
			&standard.Identifier,
			&standard.SerialNumber,
			&standard.Status,
			&standard.ScopeLabel,
		); err != nil {
			return nil, err
		}
		standard.ID = standardID.String()
		key := measuringInstrumentID.String()
		result[key] = append(result[key], standard)
	}

	return result, rows.Err()
}

func (r *measuringInstrumentRepository) GetStandardScopes(ctx context.Context, organizationID uuid.UUID, standardIDs []uuid.UUID) (map[string]StandardScope, error) {
	if len(standardIDs) == 0 {
		return map[string]StandardScope{}, nil
	}

	rows, err := r.db.Query(ctx, `
        SELECT id, subdivision_id, unit_id, owner_label
        FROM registry_standards
        WHERE organization_id = $1 AND id = ANY($2) AND archived_at IS NULL
    `, organizationID, standardIDs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[string]StandardScope, len(standardIDs))
	for rows.Next() {
		var id uuid.UUID
		var subdivisionID *uuid.UUID
		var unitID *uuid.UUID
		var ownerLabel *string
		if err := rows.Scan(&id, &subdivisionID, &unitID, &ownerLabel); err != nil {
			return nil, err
		}

		scope := StandardScope{OwnerLabel: ownerLabel}
		if subdivisionID != nil {
			value := subdivisionID.String()
			scope.SubdivisionID = &value
		}
		if unitID != nil {
			value := unitID.String()
			scope.UnitID = &value
		}
		result[id.String()] = scope
	}

	return result, rows.Err()
}

func (r *measuringInstrumentRepository) GetEquipmentSummary(ctx context.Context, id uuid.UUID) (*EquipmentSummary, string, string, error) {
	var equipmentID uuid.UUID
	var organizationID uuid.UUID
	var unitID uuid.UUID
	var summary EquipmentSummary
	if err := r.db.QueryRow(
		ctx,
		`SELECT id, organization_id, unit_id, full_name
         FROM registry_equipment
         WHERE id = $1 AND archived_at IS NULL`,
		id,
	).Scan(&equipmentID, &organizationID, &unitID, &summary.FullName); err != nil {
		return nil, "", "", ErrEquipmentInvalid
	}

	summary.ID = equipmentID.String()
	return &summary, organizationID.String(), unitID.String(), nil
}

func nullableUUID(value *string) interface{} {
	if value == nil || *value == "" {
		return nil
	}
	return uuid.MustParse(*value)
}
