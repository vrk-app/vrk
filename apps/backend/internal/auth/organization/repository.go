package organization

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	"backend/internal/db/generated"
)

type OrganizationRepository interface {
	Create(ctx context.Context, m Organization) (*Organization, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Organization, error)
	Update(ctx context.Context, m Organization) (*Organization, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, limit, offset int32) ([]Organization, int64, error)
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

func (r *organizationRepository) GetByID(ctx context.Context, id uuid.UUID) (*Organization, error) {
	row, err := r.q.GetOrganizationByID(ctx, toPGUUID(id))
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrNotFound, err)
	}
	return mapRow((*generated.CreateOrganizationRow)(&row)), nil
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
	}

	row, err := r.q.UpdateOrganization(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrUpdateFailed, err)
	}

	return mapRow((*generated.CreateOrganizationRow)(&row)), nil
}

func (r *organizationRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.q.DeleteOrganization(ctx, toPGUUID(id))
}

func (r *organizationRepository) Exists(ctx context.Context, id uuid.UUID) (bool, error) {
	return r.q.OrganizationExists(ctx, toPGUUID(id))
}

func (r *organizationRepository) List(ctx context.Context, limit, offset int32) ([]Organization, int64, error) {
	rows, err := r.q.ListOrganizations(ctx, generated.ListOrganizationsParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, 0, err
	}

	total, _ := r.q.CountOrganizations(ctx)

	result := make([]Organization, len(rows))
	for i := range rows {
		result[i] = *mapRow((*generated.CreateOrganizationRow)(&rows[i]))
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