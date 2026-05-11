package standard

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type StandardRepository interface {
	Create(ctx context.Context, item Standard) (*Standard, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Standard, error)
	ListByOrganization(ctx context.Context, organizationID uuid.UUID, includeArchived bool) ([]Standard, error)
	Update(ctx context.Context, item Standard) (*Standard, error)
	Archive(ctx context.Context, id uuid.UUID) (*Standard, error)
	Delete(ctx context.Context, id uuid.UUID) error
	GetDiagnosticEquipmentScope(ctx context.Context, id uuid.UUID) (*DiagnosticEquipmentScope, error)
}

type standardRepository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) StandardRepository {
	return &standardRepository{db: db}
}

type DiagnosticEquipmentScope struct {
	ID             string
	Name           string
	OrganizationID string
	UnitID         string
	UnitName       string
	Archived       bool
}

const standardSelectColumns = `
    standard.id,
    standard.organization_id,
    org.shell_name,
    standard.division_id,
    division.name,
    standard.unit_id,
    unit.name,
    standard.owner_label,
    standard.diagnostic_equipment_id,
    diagnostic.name,
    standard.standard_type,
    standard.model,
    standard.identifier,
    standard.serial_number,
    standard.metrological_characteristics,
    standard.status,
    standard.comment,
    standard.document_url,
    standard.archived_at,
    standard.created_at,
    standard.updated_at
`

func scanStandard(scanner interface {
	Scan(dest ...any) error
}) (*Standard, error) {
	var item Standard
	var organizationID uuid.UUID
	var divisionID *uuid.UUID
	var unitID *uuid.UUID
	var diagnosticEquipmentID *uuid.UUID

	if err := scanner.Scan(
		&item.ID,
		&organizationID,
		&item.OrganizationName,
		&divisionID,
		&item.DivisionName,
		&unitID,
		&item.UnitName,
		&item.OwnerLabel,
		&diagnosticEquipmentID,
		&item.DiagnosticEquipmentName,
		&item.StandardType,
		&item.Model,
		&item.Identifier,
		&item.SerialNumber,
		&item.MetrologicalCharacteristics,
		&item.Status,
		&item.Comment,
		&item.DocumentURL,
		&item.ArchivedAt,
		&item.CreatedAt,
		&item.UpdatedAt,
	); err != nil {
		return nil, err
	}

	item.OrganizationID = organizationID.String()
	if divisionID != nil {
		value := divisionID.String()
		item.DivisionID = &value
	}
	if unitID != nil {
		value := unitID.String()
		item.UnitID = &value
	}
	if diagnosticEquipmentID != nil {
		value := diagnosticEquipmentID.String()
		item.DiagnosticEquipmentID = &value
	}

	return &item, nil
}

func (r *standardRepository) Create(ctx context.Context, item Standard) (*Standard, error) {
	query := `
        INSERT INTO registry_standards (
            organization_id,
            division_id,
            unit_id,
            owner_label,
            diagnostic_equipment_id,
            standard_type,
            model,
            identifier,
            serial_number,
            metrological_characteristics,
            status,
            comment,
            document_url
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        )
        RETURNING id
    `

	var id uuid.UUID
	if err := r.db.QueryRow(
		ctx,
		query,
		uuid.MustParse(item.OrganizationID),
		nullableUUID(item.DivisionID),
		nullableUUID(item.UnitID),
		item.OwnerLabel,
		nullableUUID(item.DiagnosticEquipmentID),
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
        LEFT JOIN auth_divisions division ON division.id = standard.division_id
        LEFT JOIN auth_units unit ON unit.id = standard.unit_id
        LEFT JOIN registry_measuring_instruments diagnostic ON diagnostic.id = standard.diagnostic_equipment_id
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
        LEFT JOIN auth_divisions division ON division.id = standard.division_id
        LEFT JOIN auth_units unit ON unit.id = standard.unit_id
        LEFT JOIN registry_measuring_instruments diagnostic ON diagnostic.id = standard.diagnostic_equipment_id
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
            division_id = $2,
            unit_id = $3,
            owner_label = $4,
            diagnostic_equipment_id = $5,
            standard_type = $6,
            model = $7,
            identifier = $8,
            serial_number = $9,
            metrological_characteristics = $10,
            status = $11,
            comment = $12,
            document_url = $13,
            updated_at = NOW()
        WHERE id = $1
        RETURNING id
    `

	var id uuid.UUID
	if err := r.db.QueryRow(
		ctx,
		query,
		uuid.MustParse(item.ID),
		nullableUUID(item.DivisionID),
		nullableUUID(item.UnitID),
		item.OwnerLabel,
		nullableUUID(item.DiagnosticEquipmentID),
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

func (r *standardRepository) GetDiagnosticEquipmentScope(ctx context.Context, id uuid.UUID) (*DiagnosticEquipmentScope, error) {
	var item DiagnosticEquipmentScope
	var diagnosticEquipmentID uuid.UUID
	var organizationID uuid.UUID
	var unitID uuid.UUID
	var archivedAt *time.Time

	if err := r.db.QueryRow(ctx, `
        SELECT
            mi.id,
            mi.name,
            mi.organization_id,
            mi.unit_id,
            unit.name,
            mi.archived_at
        FROM registry_measuring_instruments mi
        JOIN auth_units unit ON unit.id = mi.unit_id
        WHERE mi.id = $1
    `, id).Scan(
		&diagnosticEquipmentID,
		&item.Name,
		&organizationID,
		&unitID,
		&item.UnitName,
		&archivedAt,
	); err != nil {
		return nil, ErrDiagnosticEquipmentInvalid
	}

	item.ID = diagnosticEquipmentID.String()
	item.OrganizationID = organizationID.String()
	item.UnitID = unitID.String()
	item.Archived = archivedAt != nil
	return &item, nil
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

func (r *standardRepository) Delete(ctx context.Context, id uuid.UUID) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("%w: %v", ErrDeleteFailed, err)
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `
        DELETE FROM registry_metrology_journal_entries
        WHERE subject_type = 'standard' AND subject_id = $1
    `, id); err != nil {
		return fmt.Errorf("%w: %v", ErrDeleteFailed, err)
	}

	commandTag, err := tx.Exec(ctx, `
        DELETE FROM registry_standards
        WHERE id = $1
    `, id)
	if err != nil {
		return fmt.Errorf("%w: %v", ErrDeleteFailed, err)
	}
	if commandTag.RowsAffected() == 0 {
		return ErrNotFound
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("%w: %v", ErrDeleteFailed, err)
	}

	return nil
}

func nullableUUID(value *string) interface{} {
	if value == nil || *value == "" {
		return nil
	}
	return uuid.MustParse(*value)
}
