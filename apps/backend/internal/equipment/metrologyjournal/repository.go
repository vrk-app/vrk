package metrologyjournal

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	Create(ctx context.Context, entry Entry) (*Entry, error)
	ListBySubject(ctx context.Context, organizationID uuid.UUID, subjectType SubjectType, subjectID uuid.UUID) ([]Entry, error)
	ListByOrganization(ctx context.Context, organizationID uuid.UUID, subjectType SubjectType) (map[string][]Entry, error)
}

type repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return &repository{db: db}
}

const selectColumns = `
    id,
    organization_id,
    subject_type,
    subject_id,
    operation_type,
    operation_date,
    document_number,
    valid_until,
    executor_organization,
    attachment_url,
    comment,
    created_at
`

func scanEntry(scanner interface {
	Scan(dest ...any) error
}) (*Entry, error) {
	var entry Entry
	var organizationID uuid.UUID
	var subjectID uuid.UUID

	if err := scanner.Scan(
		&entry.ID,
		&organizationID,
		&entry.SubjectType,
		&subjectID,
		&entry.OperationType,
		&entry.OperationDate,
		&entry.DocumentNumber,
		&entry.ValidUntil,
		&entry.ExecutorOrganization,
		&entry.AttachmentURL,
		&entry.Comment,
		&entry.CreatedAt,
	); err != nil {
		return nil, err
	}

	entry.OrganizationID = organizationID.String()
	entry.SubjectID = subjectID.String()
	return &entry, nil
}

func (r *repository) Create(ctx context.Context, entry Entry) (*Entry, error) {
	query := `
        INSERT INTO registry_metrology_journal_entries (
            organization_id,
            subject_type,
            subject_id,
            operation_type,
            operation_date,
            document_number,
            valid_until,
            executor_organization,
            attachment_url,
            comment
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
        )
        RETURNING ` + selectColumns

	return scanEntry(r.db.QueryRow(
		ctx,
		query,
		uuid.MustParse(entry.OrganizationID),
		entry.SubjectType,
		uuid.MustParse(entry.SubjectID),
		entry.OperationType,
		entry.OperationDate,
		entry.DocumentNumber,
		entry.ValidUntil,
		entry.ExecutorOrganization,
		entry.AttachmentURL,
		entry.Comment,
	))
}

func (r *repository) ListBySubject(
	ctx context.Context,
	organizationID uuid.UUID,
	subjectType SubjectType,
	subjectID uuid.UUID,
) ([]Entry, error) {
	rows, err := r.db.Query(
		ctx,
		`SELECT `+selectColumns+`
        FROM registry_metrology_journal_entries
        WHERE organization_id = $1 AND subject_type = $2 AND subject_id = $3
        ORDER BY operation_date DESC, created_at DESC`,
		organizationID,
		subjectType,
		subjectID,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to list metrology journal entries: %w", err)
	}
	defer rows.Close()

	result := make([]Entry, 0)
	for rows.Next() {
		entry, scanErr := scanEntry(rows)
		if scanErr != nil {
			return nil, fmt.Errorf("failed to scan metrology journal entry: %w", scanErr)
		}
		result = append(result, *entry)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate metrology journal entries: %w", err)
	}

	return result, nil
}

func (r *repository) ListByOrganization(
	ctx context.Context,
	organizationID uuid.UUID,
	subjectType SubjectType,
) (map[string][]Entry, error) {
	rows, err := r.db.Query(
		ctx,
		`SELECT `+selectColumns+`
        FROM registry_metrology_journal_entries
        WHERE organization_id = $1 AND subject_type = $2
        ORDER BY operation_date DESC, created_at DESC`,
		organizationID,
		subjectType,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to list metrology journal entries: %w", err)
	}
	defer rows.Close()

	result := make(map[string][]Entry)
	for rows.Next() {
		entry, scanErr := scanEntry(rows)
		if scanErr != nil {
			return nil, fmt.Errorf("failed to scan metrology journal entry: %w", scanErr)
		}
		result[entry.SubjectID] = append(result[entry.SubjectID], *entry)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate metrology journal entries: %w", err)
	}

	return result, nil
}
