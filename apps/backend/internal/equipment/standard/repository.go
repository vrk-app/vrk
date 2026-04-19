package standard

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type StandardRepository interface {
	Create(ctx context.Context, item Standard) (*Standard, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Standard, error)
	ListByOrganization(ctx context.Context, organizationID uuid.UUID, includeArchived bool) ([]Standard, error)
	Update(ctx context.Context, item Standard) (*Standard, error)
	Archive(ctx context.Context, id uuid.UUID) (*Standard, error)
}

type standardRepository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) StandardRepository {
	return &standardRepository{db: db}
}

const standardSelectColumns = `
    standard.id,
    standard.organization_id,
    org.shell_name,
    standard.subdivision_id,
    subdivision.name,
    standard.unit_id,
    unit.name,
    standard.owner_label,
    standard.standard_type,
    standard.model,
    standard.identifier,
    standard.serial_number,
    standard.metrological_characteristics,
    standard.status,
    standard.comment,
    standard.document_url,
    (
        SELECT COUNT(*)
        FROM registry_measuring_instrument_standards link
        JOIN registry_measuring_instruments mi ON mi.id = link.measuring_instrument_id
        WHERE link.standard_id = standard.id AND mi.archived_at IS NULL
    ) AS linked_measuring_instruments,
    standard.archived_at,
    standard.created_at,
    standard.updated_at
`

func scanStandard(scanner interface {
	Scan(dest ...any) error
}) (*Standard, error) {
	var item Standard
	var organizationID uuid.UUID
	var subdivisionID *uuid.UUID
	var unitID *uuid.UUID

	if err := scanner.Scan(
		&item.ID,
		&organizationID,
		&item.OrganizationName,
		&subdivisionID,
		&item.SubdivisionName,
		&unitID,
		&item.UnitName,
		&item.OwnerLabel,
		&item.StandardType,
		&item.Model,
		&item.Identifier,
		&item.SerialNumber,
		&item.MetrologicalCharacteristics,
		&item.Status,
		&item.Comment,
		&item.DocumentURL,
		&item.LinkedMeasuringInstruments,
		&item.ArchivedAt,
		&item.CreatedAt,
		&item.UpdatedAt,
	); err != nil {
		return nil, err
	}

	item.OrganizationID = organizationID.String()
	if subdivisionID != nil {
		value := subdivisionID.String()
		item.SubdivisionID = &value
	}
	if unitID != nil {
		value := unitID.String()
		item.UnitID = &value
	}

	return &item, nil
}

func (r *standardRepository) Create(ctx context.Context, item Standard) (*Standard, error) {
	query := `
        INSERT INTO registry_standards (
            organization_id,
            subdivision_id,
            unit_id,
            owner_label,
            standard_type,
            model,
            identifier,
            serial_number,
            metrological_characteristics,
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
		nullableUUID(item.SubdivisionID),
		nullableUUID(item.UnitID),
		item.OwnerLabel,
		item.StandardType,
		item.Model,
		item.Identifier,
		item.SerialNumber,
		item.MetrologicalCharacteristics,
		item.Status,
		item.Comment,
		item.DocumentURL,
	).Scan(&id); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrCreateFailed, err)
	}

	return r.GetByID(ctx, id)
}

func (r *standardRepository) GetByID(ctx context.Context, id uuid.UUID) (*Standard, error) {
	query := fmt.Sprintf(`
        SELECT %s
        FROM registry_standards standard
        JOIN auth_bootstrap_organizations org ON org.id = standard.organization_id
        LEFT JOIN auth_subdivisions subdivision ON subdivision.id = standard.subdivision_id
        LEFT JOIN auth_units unit ON unit.id = standard.unit_id
        WHERE standard.id = $1
    `, standardSelectColumns)

	item, err := scanStandard(r.db.QueryRow(ctx, query, id))
	if err != nil {
		return nil, ErrNotFound
	}

	return item, nil
}

func (r *standardRepository) ListByOrganization(ctx context.Context, organizationID uuid.UUID, includeArchived bool) ([]Standard, error) {
	query := fmt.Sprintf(`
        SELECT %s
        FROM registry_standards standard
        JOIN auth_bootstrap_organizations org ON org.id = standard.organization_id
        LEFT JOIN auth_subdivisions subdivision ON subdivision.id = standard.subdivision_id
        LEFT JOIN auth_units unit ON unit.id = standard.unit_id
        WHERE standard.organization_id = $1
          AND ($2::boolean OR standard.archived_at IS NULL)
        ORDER BY standard.created_at DESC
    `, standardSelectColumns)

	rows, err := r.db.Query(ctx, query, organizationID, includeArchived)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrListFailed, err)
	}
	defer rows.Close()

	result := make([]Standard, 0)
	for rows.Next() {
		item, scanErr := scanStandard(rows)
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

func (r *standardRepository) Update(ctx context.Context, item Standard) (*Standard, error) {
	query := `
        UPDATE registry_standards
        SET
            subdivision_id = $2,
            unit_id = $3,
            owner_label = $4,
            standard_type = $5,
            model = $6,
            identifier = $7,
            serial_number = $8,
            metrological_characteristics = $9,
            status = $10,
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
		nullableUUID(item.SubdivisionID),
		nullableUUID(item.UnitID),
		item.OwnerLabel,
		item.StandardType,
		item.Model,
		item.Identifier,
		item.SerialNumber,
		item.MetrologicalCharacteristics,
		item.Status,
		item.Comment,
		item.DocumentURL,
	).Scan(&id); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrUpdateFailed, err)
	}

	return r.GetByID(ctx, id)
}

func (r *standardRepository) Archive(ctx context.Context, id uuid.UUID) (*Standard, error) {
	query := `
        UPDATE registry_standards
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

func nullableUUID(value *string) interface{} {
	if value == nil || *value == "" {
		return nil
	}
	return uuid.MustParse(*value)
}
