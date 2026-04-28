package organization

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"backend/internal/db/generated"
)

type OrganizationRepository interface {
	Create(ctx context.Context, m Organization) (*Organization, error)
	GetByID(ctx context.Context, id uuid.UUID) (*OrganizationWithDetails, error)
	GetByIDForUpdate(ctx context.Context, id uuid.UUID) (*Organization, error)
	Update(ctx context.Context, m Organization) (*Organization, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, limit, offset int32) ([]OrganizationWithDetails, int64, error)
	Exists(ctx context.Context, id uuid.UUID) (bool, error)
}

type organizationRepository struct {
	q *generated.Queries
}

func NewRepository(q *generated.Queries) OrganizationRepository {
	return &organizationRepository{q: q}
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

func (r *organizationRepository) Create(ctx context.Context, m Organization) (*Organization, error) {
	params := generated.CreateOrganizationParams{
		PropertyTypeID:        toPGUUID(m.PropertyTypeID),
		Name:                  m.Name,
		Inn:                   m.Inn,
		Kpp:                   m.Kpp,
		Address:               m.Address,
		RoleID:                toPGUUID(m.RoleID),
		DirectorID:            toPGUUID(m.DirectorID),
		ParentID:              toNullPGUUID(m.ParentID),
		ShortName:             m.ShortName,
		PowerOfAttorneyNumber: m.PowerOfAttorneyNumber,
		PoaIssueDate:          toNullDate(m.PoaIssueDate),
		PoaExpirationDate:     toNullDate(m.PoaExpirationDate),
		Logo:                  m.Logo,
	}

	row, err := r.q.CreateOrganization(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrCreateFailed, err)
	}

	return mapRow(&row), nil
}

func (r *organizationRepository) GetByID(ctx context.Context, id uuid.UUID) (*OrganizationWithDetails, error) {
	row, err := r.q.GetOrganizationByID(ctx, toPGUUID(id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return mapRowWithDetails(&row), nil
}

func (r *organizationRepository) GetByIDForUpdate(ctx context.Context, id uuid.UUID) (*Organization, error) {
	row, err := r.q.GetOrganizationByID(ctx, toPGUUID(id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return &Organization{
		ID:                    uuid.UUID(row.ID.Bytes),
		PropertyTypeID:        uuid.UUID(row.PropertyTypeID.Bytes),
		Name:                  row.Name,
		Inn:                   row.Inn,
		Kpp:                   row.Kpp,
		Address:               row.Address,
		RoleID:                uuid.UUID(row.RoleID.Bytes),
		DirectorID:            uuid.UUID(row.DirectorID.Bytes),
		ParentID:              fromNullUUID(row.ParentID),
		ShortName:             row.ShortName,
		PowerOfAttorneyNumber: row.PowerOfAttorneyNumber,
		PoaIssueDate:          fromNullDate(row.PoaIssueDate),
		PoaExpirationDate:     fromNullDate(row.PoaExpirationDate),
		Logo:                  row.Logo,
		CreatedAt:             row.CreatedAt.Time,
		UpdatedAt:             row.UpdatedAt.Time,
	}, nil
}

func (r *organizationRepository) Update(ctx context.Context, m Organization) (*Organization, error) {
	params := generated.UpdateOrganizationParams{
		ID:                    toPGUUID(m.ID),
		PropertyTypeID:        toPGUUID(m.PropertyTypeID),
		Name:                  m.Name,
		Inn:                   m.Inn,
		Kpp:                   m.Kpp,
		Address:               m.Address,
		RoleID:                toPGUUID(m.RoleID),
		DirectorID:            toPGUUID(m.DirectorID),
		ParentID:              toNullPGUUID(m.ParentID),
		ShortName:             m.ShortName,
		PowerOfAttorneyNumber: m.PowerOfAttorneyNumber,
		PoaIssueDate:          toNullDate(m.PoaIssueDate),
		PoaExpirationDate:     toNullDate(m.PoaExpirationDate),
		Logo:                  m.Logo,
		UpdatedAt:             pgtype.Timestamptz{Time: m.UpdatedAt, Valid: true},
	}

	row, err := r.q.UpdateOrganization(ctx, params)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrConflict
		}
		return nil, fmt.Errorf("%w: %v", ErrUpdateFailed, err)
	}

	return mapRow((*generated.CreateOrganizationRow)(&row)), nil
}

func (r *organizationRepository) Delete(ctx context.Context, id uuid.UUID) error {
	rowsAffected, err := r.q.DeleteOrganization(ctx, toPGUUID(id))
	if err != nil {
		return fmt.Errorf("%w: %v", ErrDeleteFailed, err)
	}
	if rowsAffected == 0 {
		return ErrNotFound
	}

	return nil
}

func (r *organizationRepository) Exists(ctx context.Context, id uuid.UUID) (bool, error) {
	return r.q.OrganizationExists(ctx, toPGUUID(id))
}

func (r *organizationRepository) List(ctx context.Context, limit, offset int32) ([]OrganizationWithDetails, int64, error) {
	rows, err := r.q.ListOrganizations(ctx, generated.ListOrganizationsParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, 0, err
	}

	total, _ := r.q.CountOrganizations(ctx)

	result := make([]OrganizationWithDetails, len(rows))
	for i := range rows {
		result[i] = *mapListRowWithDetails(&rows[i])
	}

	return result, total, nil
}

func mapRow(r *generated.CreateOrganizationRow) *Organization {
	return &Organization{
		ID:                    uuid.UUID(r.ID.Bytes),
		PropertyTypeID:        uuid.UUID(r.PropertyTypeID.Bytes),
		Name:                  r.Name,
		Inn:                   r.Inn,
		Kpp:                   r.Kpp,
		Address:               r.Address,
		RoleID:                uuid.UUID(r.RoleID.Bytes),
		DirectorID:            uuid.UUID(r.DirectorID.Bytes),
		ParentID:              fromNullUUID(r.ParentID),
		ShortName:             r.ShortName,
		PowerOfAttorneyNumber: r.PowerOfAttorneyNumber,
		PoaIssueDate:          fromNullDate(r.PoaIssueDate),
		PoaExpirationDate:     fromNullDate(r.PoaExpirationDate),
		Logo:                  r.Logo,
		CreatedAt:             r.CreatedAt.Time,
		UpdatedAt:             r.UpdatedAt.Time,
	}
}

func mapRowWithDetails(r *generated.GetOrganizationByIDRow) *OrganizationWithDetails {
	return mapOrganizationWithDetails(
		r.ID,
		r.PropertyTypeName,
		r.Name,
		r.Inn,
		r.Kpp,
		r.Address,
		r.RoleTitle,
		r.DirectorName,
		r.ParentID,
		r.ShortName,
		r.PowerOfAttorneyNumber,
		r.PoaIssueDate,
		r.PoaExpirationDate,
		r.Logo,
	)
}

func mapListRowWithDetails(r *generated.ListOrganizationsRow) *OrganizationWithDetails {
	return mapOrganizationWithDetails(
		r.ID,
		r.PropertyTypeName,
		r.Name,
		r.Inn,
		r.Kpp,
		r.Address,
		r.RoleTitle,
		r.DirectorName,
		r.ParentID,
		r.ShortName,
		r.PowerOfAttorneyNumber,
		r.PoaIssueDate,
		r.PoaExpirationDate,
		r.Logo,
	)
}

func mapOrganizationWithDetails(
	id pgtype.UUID,
	propertyTypeName *string,
	name string,
	inn string,
	kpp string,
	address string,
	roleTitle *string,
	directorName any,
	parent pgtype.UUID,
	shortName *string,
	powerOfAttorneyNumber *string,
	poaIssueDate pgtype.Date,
	poaExpirationDate pgtype.Date,
	logo *string,
) *OrganizationWithDetails {
	var parentID *uuid.UUID
	if parent.Valid {
		value := uuid.UUID(parent.Bytes)
		parentID = &value
	}

	resolvedPropertyTypeName := ""
	if propertyTypeName != nil {
		resolvedPropertyTypeName = *propertyTypeName
	}

	resolvedRoleTitle := ""
	if roleTitle != nil {
		resolvedRoleTitle = *roleTitle
	}

	resolvedDirectorName := ""
	if directorName != nil {
		if v, ok := directorName.(string); ok {
			resolvedDirectorName = v
		}
	}

	return &OrganizationWithDetails{
		ID:                    uuid.UUID(id.Bytes),
		PropertyTypeName:      resolvedPropertyTypeName,
		Name:                  name,
		Inn:                   inn,
		Kpp:                   kpp,
		Address:               address,
		RoleTitle:             resolvedRoleTitle,
		DirectorName:          resolvedDirectorName,
		ParentID:              parentID,
		ShortName:             shortName,
		PowerOfAttorneyNumber: powerOfAttorneyNumber,
		PoaIssueDate:          fromNullDate(poaIssueDate),
		PoaExpirationDate:     fromNullDate(poaExpirationDate),
		Logo:                  logo,
	}
}
