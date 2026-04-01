package organization

import (
    "context"
    "fmt"

    "github.com/google/uuid"

    "backend/internal/db/generated"
)

type OrganizationRepository interface {
    Create(ctx context.Context, params generated.CreateOrganizationParams) (*generated.CreateOrganizationRow, error)
    List(ctx context.Context, limit, offset int32) ([]generated.ListOrganizationsRow, int64, error)
    GetByID(ctx context.Context, id uuid.UUID) (*generated.GetOrganizationByIDRow, error)
    Update(ctx context.Context, params generated.UpdateOrganizationParams) (*generated.UpdateOrganizationRow, error)
    Delete(ctx context.Context, id uuid.UUID) error
    Exists(ctx context.Context, id uuid.UUID) (bool, error)
}

type organizationRepository struct {
    queries *generated.Queries
}

func NewRepository(queries *generated.Queries) OrganizationRepository {
    return &organizationRepository{queries: queries}
}

func (r *organizationRepository) Create(ctx context.Context, params generated.CreateOrganizationParams) (*generated.CreateOrganizationRow, error) {
    org, err := r.queries.CreateOrganization(ctx, params)
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrCreateFailed, err)
    }
    return &org, nil
}

func (r *organizationRepository) List(ctx context.Context, limit, offset int32) ([]generated.ListOrganizationsRow, int64, error) {
    items, err := r.queries.ListOrganizations(ctx, generated.ListOrganizationsParams{
        Limit:  limit,
        Offset: offset,
    })
    if err != nil {
        return nil, 0, fmt.Errorf("%w: %v", ErrListFailed, err)
    }

    total, err := r.queries.CountOrganizations(ctx)
    if err != nil {
        return nil, 0, fmt.Errorf("%w: %v", ErrListFailed, err)
    }

    return items, total, nil
}

func (r *organizationRepository) GetByID(ctx context.Context, id uuid.UUID) (*generated.GetOrganizationByIDRow, error) {
    org, err := r.queries.GetOrganizationByID(ctx, id)
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrNotFound, err)
    }
    return &org, nil
}

func (r *organizationRepository) Update(ctx context.Context, params generated.UpdateOrganizationParams) (*generated.UpdateOrganizationRow, error) {
    org, err := r.queries.UpdateOrganization(ctx, params)
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrUpdateFailed, err)
    }
    return &org, nil
}

func (r *organizationRepository) Delete(ctx context.Context, id uuid.UUID) error {
    err := r.queries.DeleteOrganization(ctx, id)
    if err != nil {
        return fmt.Errorf("%w: %v", ErrDeleteFailed, err)
    }
    return nil
}

func (r *organizationRepository) Exists(ctx context.Context, id uuid.UUID) (bool, error) {
    exists, err := r.queries.OrganizationExists(ctx, id)
    if err != nil {
        return false, fmt.Errorf("%w: %v", ErrCheckExistsFailed, err)
    }
    return exists, nil
}