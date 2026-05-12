package photo

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	Create(ctx context.Context, item EquipmentPhoto) (*EquipmentPhoto, error)
	CountBySubject(ctx context.Context, organizationID uuid.UUID, subjectType SubjectType, subjectID uuid.UUID) (int, error)
	Delete(ctx context.Context, organizationID uuid.UUID, subjectType SubjectType, subjectID uuid.UUID, photoID uuid.UUID) (*EquipmentPhoto, error)
	Get(ctx context.Context, organizationID uuid.UUID, subjectType SubjectType, subjectID uuid.UUID, photoID uuid.UUID) (*EquipmentPhoto, error)
	GetSubjectSnapshot(ctx context.Context, subjectType SubjectType, subjectID uuid.UUID) (*SubjectSnapshot, error)
	ListBySubject(ctx context.Context, organizationID uuid.UUID, subjectType SubjectType, subjectID uuid.UUID) ([]EquipmentPhoto, error)
	ListBySubjects(ctx context.Context, organizationID uuid.UUID, subjectType SubjectType, subjectIDs []uuid.UUID) (map[string][]EquipmentPhoto, error)
}

type repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return &repository{db: db}
}

const photoSelectColumns = `
    id,
    organization_id,
    subject_type,
    subject_id,
    object_key,
    file_name,
    content_type,
    size_bytes,
    sort_order,
    created_at,
    updated_at
`

func scanPhoto(scanner interface {
	Scan(dest ...any) error
}) (*EquipmentPhoto, error) {
	var item EquipmentPhoto
	var id uuid.UUID
	var organizationID uuid.UUID
	var subjectID uuid.UUID
	var subjectType string

	if err := scanner.Scan(
		&id,
		&organizationID,
		&subjectType,
		&subjectID,
		&item.ObjectKey,
		&item.FileName,
		&item.ContentType,
		&item.SizeBytes,
		&item.SortOrder,
		&item.CreatedAt,
		&item.UpdatedAt,
	); err != nil {
		return nil, err
	}

	item.ID = id.String()
	item.OrganizationID = organizationID.String()
	item.SubjectType = SubjectType(subjectType)
	item.SubjectID = subjectID.String()
	return &item, nil
}

func (r *repository) Create(ctx context.Context, item EquipmentPhoto) (*EquipmentPhoto, error) {
	query := fmt.Sprintf(`
        INSERT INTO registry_equipment_photos (
            organization_id,
            subject_type,
            subject_id,
            object_key,
            file_name,
            content_type,
            size_bytes,
            sort_order
        ) VALUES (
            $1::uuid,
            $2::varchar(32),
            $3::uuid,
            $4::text,
            $5::varchar(255),
            $6::varchar(64),
            $7::bigint,
            COALESCE((
                SELECT MAX(sort_order) + 1
                FROM registry_equipment_photos
                WHERE organization_id = $1::uuid
                  AND subject_type = $2::varchar(32)
                  AND subject_id = $3::uuid
            ), 0)
        )
        RETURNING %s
    `, photoSelectColumns)

	created, err := scanPhoto(r.db.QueryRow(
		ctx,
		query,
		uuid.MustParse(item.OrganizationID),
		string(item.SubjectType),
		uuid.MustParse(item.SubjectID),
		item.ObjectKey,
		item.FileName,
		item.ContentType,
		item.SizeBytes,
	))
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrCreateFailed, err)
	}

	return created, nil
}

func (r *repository) CountBySubject(ctx context.Context, organizationID uuid.UUID, subjectType SubjectType, subjectID uuid.UUID) (int, error) {
	var count int
	if err := r.db.QueryRow(
		ctx,
		`SELECT COUNT(*) FROM registry_equipment_photos WHERE organization_id = $1 AND subject_type = $2 AND subject_id = $3`,
		organizationID,
		string(subjectType),
		subjectID,
	).Scan(&count); err != nil {
		return 0, err
	}
	return count, nil
}

func (r *repository) Delete(
	ctx context.Context,
	organizationID uuid.UUID,
	subjectType SubjectType,
	subjectID uuid.UUID,
	photoID uuid.UUID,
) (*EquipmentPhoto, error) {
	query := fmt.Sprintf(`
        DELETE FROM registry_equipment_photos
        WHERE organization_id = $1
          AND subject_type = $2
          AND subject_id = $3
          AND id = $4
        RETURNING %s
    `, photoSelectColumns)

	item, err := scanPhoto(r.db.QueryRow(ctx, query, organizationID, string(subjectType), subjectID, photoID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrPhotoNotFound
		}
		return nil, fmt.Errorf("%w: %v", ErrDeleteFailed, err)
	}
	return item, nil
}

func (r *repository) Get(
	ctx context.Context,
	organizationID uuid.UUID,
	subjectType SubjectType,
	subjectID uuid.UUID,
	photoID uuid.UUID,
) (*EquipmentPhoto, error) {
	query := fmt.Sprintf(`
        SELECT %s
        FROM registry_equipment_photos
        WHERE organization_id = $1
          AND subject_type = $2
          AND subject_id = $3
          AND id = $4
    `, photoSelectColumns)

	item, err := scanPhoto(r.db.QueryRow(ctx, query, organizationID, string(subjectType), subjectID, photoID))
	if err != nil {
		return nil, ErrPhotoNotFound
	}
	return item, nil
}

func (r *repository) GetSubjectSnapshot(ctx context.Context, subjectType SubjectType, subjectID uuid.UUID) (*SubjectSnapshot, error) {
	var query string
	switch subjectType {
	case SubjectTechnicalEquipment:
		query = `
            SELECT id, organization_id, unit_id, archived_at
            FROM registry_equipment
            WHERE id = $1
        `
	case SubjectDiagnosticEquipment:
		query = `
            SELECT id, organization_id, unit_id, archived_at
            FROM registry_measuring_instruments
            WHERE id = $1
        `
	default:
		return nil, ErrInvalidSubject
	}

	var id uuid.UUID
	var organizationID uuid.UUID
	var unitID uuid.UUID
	var snapshot SubjectSnapshot
	if err := r.db.QueryRow(ctx, query, subjectID).Scan(&id, &organizationID, &unitID, &snapshot.ArchivedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrPhotoNotFound
		}
		return nil, fmt.Errorf("%w: %v", ErrSubjectLookupFailed, err)
	}

	snapshot.ID = id.String()
	snapshot.OrganizationID = organizationID.String()
	snapshot.UnitID = unitID.String()
	return &snapshot, nil
}

func (r *repository) ListBySubject(ctx context.Context, organizationID uuid.UUID, subjectType SubjectType, subjectID uuid.UUID) ([]EquipmentPhoto, error) {
	query := fmt.Sprintf(`
        SELECT %s
        FROM registry_equipment_photos
        WHERE organization_id = $1
          AND subject_type = $2
          AND subject_id = $3
        ORDER BY sort_order ASC, created_at ASC
    `, photoSelectColumns)

	rows, err := r.db.Query(ctx, query, organizationID, string(subjectType), subjectID)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrListFailed, err)
	}
	defer rows.Close()

	return scanPhotoRows(rows)
}

func (r *repository) ListBySubjects(
	ctx context.Context,
	organizationID uuid.UUID,
	subjectType SubjectType,
	subjectIDs []uuid.UUID,
) (map[string][]EquipmentPhoto, error) {
	result := make(map[string][]EquipmentPhoto, len(subjectIDs))
	if len(subjectIDs) == 0 {
		return result, nil
	}

	query := fmt.Sprintf(`
        SELECT %s
        FROM registry_equipment_photos
        WHERE organization_id = $1
          AND subject_type = $2
          AND subject_id = ANY($3)
        ORDER BY subject_id ASC, sort_order ASC, created_at ASC
    `, photoSelectColumns)

	rows, err := r.db.Query(ctx, query, organizationID, string(subjectType), subjectIDs)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrListFailed, err)
	}
	defer rows.Close()

	items, err := scanPhotoRows(rows)
	if err != nil {
		return nil, err
	}
	for _, item := range items {
		result[item.SubjectID] = append(result[item.SubjectID], item)
	}
	return result, nil
}

func scanPhotoRows(rows pgx.Rows) ([]EquipmentPhoto, error) {
	result := make([]EquipmentPhoto, 0)
	for rows.Next() {
		item, err := scanPhoto(rows)
		if err != nil {
			return nil, fmt.Errorf("%w: %v", ErrListFailed, err)
		}
		result = append(result, *item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrListFailed, err)
	}
	return result, nil
}
