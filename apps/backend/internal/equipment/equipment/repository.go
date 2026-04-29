package equipment

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type EquipmentRepository interface {
	Create(ctx context.Context, item Equipment) (*Equipment, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Equipment, error)
	ListByOrganization(ctx context.Context, organizationID uuid.UUID, includeArchived bool) ([]Equipment, error)
	Update(ctx context.Context, item Equipment) (*Equipment, error)
	Archive(ctx context.Context, id uuid.UUID) (*Equipment, error)
}

type equipmentRepository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) EquipmentRepository {
	return &equipmentRepository{db: db}
}

const equipmentSelectColumns = `
    e.id,
    e.organization_id,
    e.unit_id,
    unit.name,
    unit.division_id,
    division.name,
    e.manufacturer,
    e.classification,
    e.model,
    e.full_name,
    e.factory_number,
    e.inventory_number,
    e.manufacture_year,
    e.status,
    e.comment,
    e.document_url,
    (
        SELECT COUNT(*)
        FROM registry_measuring_instruments mi
        WHERE mi.equipment_id = e.id AND mi.archived_at IS NULL
    ) AS measuring_instrument_count,
    e.archived_at,
    e.created_at,
    e.updated_at
`

func scanEquipment(scanner interface {
	Scan(dest ...any) error
}) (*Equipment, error) {
	var item Equipment
	var unitID uuid.UUID
	var organizationID uuid.UUID
	var divisionID *uuid.UUID

	if err := scanner.Scan(
		&item.ID,
		&organizationID,
		&unitID,
		&item.UnitName,
		&divisionID,
		&item.DivisionName,
		&item.Manufacturer,
		&item.Classification,
		&item.Model,
		&item.FullName,
		&item.FactoryNumber,
		&item.InventoryNumber,
		&item.ManufactureYear,
		&item.Status,
		&item.Comment,
		&item.DocumentURL,
		&item.MeasuringInstrumentCount,
		&item.ArchivedAt,
		&item.CreatedAt,
		&item.UpdatedAt,
	); err != nil {
		return nil, err
	}

	item.OrganizationID = organizationID.String()
	item.UnitID = unitID.String()
	if divisionID != nil {
		value := divisionID.String()
		item.DivisionID = &value
	}

	return &item, nil
}

func (r *equipmentRepository) Create(ctx context.Context, item Equipment) (*Equipment, error) {
	query := `
        INSERT INTO registry_equipment (
            organization_id,
            unit_id,
            manufacturer,
            classification,
            model,
            full_name,
            factory_number,
            inventory_number,
            manufacture_year,
            status,
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
		item.Manufacturer,
		item.Classification,
		item.Model,
		item.FullName,
		item.FactoryNumber,
		item.InventoryNumber,
		item.ManufactureYear,
		item.Status,
		item.Comment,
		item.DocumentURL,
	).Scan(&id); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrCreateFailed, err)
	}

	return r.GetByID(ctx, id)
}

func (r *equipmentRepository) GetByID(ctx context.Context, id uuid.UUID) (*Equipment, error) {
	query := fmt.Sprintf(`
        SELECT %s
        FROM registry_equipment e
        JOIN auth_units unit ON unit.id = e.unit_id
        LEFT JOIN auth_divisions division ON division.id = unit.division_id
        WHERE e.id = $1
    `, equipmentSelectColumns)

	item, err := scanEquipment(r.db.QueryRow(ctx, query, id))
	if err != nil {
		return nil, ErrNotFound
	}

	return item, nil
}

func (r *equipmentRepository) ListByOrganization(ctx context.Context, organizationID uuid.UUID, includeArchived bool) ([]Equipment, error) {
	query := fmt.Sprintf(`
        SELECT %s
        FROM registry_equipment e
        JOIN auth_units unit ON unit.id = e.unit_id
        LEFT JOIN auth_divisions division ON division.id = unit.division_id
        WHERE e.organization_id = $1
          AND ($2::boolean OR e.archived_at IS NULL)
        ORDER BY e.created_at DESC
    `, equipmentSelectColumns)

	rows, err := r.db.Query(ctx, query, organizationID, includeArchived)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrListFailed, err)
	}
	defer rows.Close()

	result := make([]Equipment, 0)
	for rows.Next() {
		item, scanErr := scanEquipment(rows)
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

func (r *equipmentRepository) Update(ctx context.Context, item Equipment) (*Equipment, error) {
	query := `
        UPDATE registry_equipment
        SET
            unit_id = $2,
            manufacturer = $3,
            classification = $4,
            model = $5,
            full_name = $6,
            factory_number = $7,
            inventory_number = $8,
            manufacture_year = $9,
            status = $10,
            comment = $11,
            document_url = $12,
            updated_at = NOW()
        WHERE id = $1 AND archived_at IS NULL
        RETURNING id
    `

	var id uuid.UUID
	if err := r.db.QueryRow(
		ctx,
		query,
		uuid.MustParse(item.ID),
		uuid.MustParse(item.UnitID),
		item.Manufacturer,
		item.Classification,
		item.Model,
		item.FullName,
		item.FactoryNumber,
		item.InventoryNumber,
		item.ManufactureYear,
		item.Status,
		item.Comment,
		item.DocumentURL,
	).Scan(&id); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrAlreadyArchived
		}
		return nil, fmt.Errorf("%w: %v", ErrUpdateFailed, err)
	}

	return r.GetByID(ctx, id)
}

func (r *equipmentRepository) Archive(ctx context.Context, id uuid.UUID) (*Equipment, error) {
	query := `
        UPDATE registry_equipment
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
