package organization

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
)

type stubOrganizationRepository struct {
	create           func(ctx context.Context, m Organization) (*Organization, error)
	getByID          func(ctx context.Context, id uuid.UUID) (*OrganizationWithDetails, error)
	getByIDForUpdate func(ctx context.Context, id uuid.UUID) (*Organization, error)
	update           func(ctx context.Context, m Organization) (*Organization, error)
	delete           func(ctx context.Context, id uuid.UUID) error
	list             func(ctx context.Context, limit, offset int32) ([]OrganizationWithDetails, int64, error)
	exists           func(ctx context.Context, id uuid.UUID) (bool, error)
}

func (s stubOrganizationRepository) Create(ctx context.Context, m Organization) (*Organization, error) {
	return s.create(ctx, m)
}

func (s stubOrganizationRepository) GetByID(ctx context.Context, id uuid.UUID) (*OrganizationWithDetails, error) {
	return s.getByID(ctx, id)
}

func (s stubOrganizationRepository) GetByIDForUpdate(ctx context.Context, id uuid.UUID) (*Organization, error) {
	return s.getByIDForUpdate(ctx, id)
}

func (s stubOrganizationRepository) Update(ctx context.Context, m Organization) (*Organization, error) {
	return s.update(ctx, m)
}

func (s stubOrganizationRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return s.delete(ctx, id)
}

func (s stubOrganizationRepository) List(ctx context.Context, limit, offset int32) ([]OrganizationWithDetails, int64, error) {
	return s.list(ctx, limit, offset)
}

func (s stubOrganizationRepository) Exists(ctx context.Context, id uuid.UUID) (bool, error) {
	return s.exists(ctx, id)
}

func TestOrganizationServiceGetByIDRejectsMalformedID(t *testing.T) {
	t.Parallel()

	service := NewService(stubOrganizationRepository{
		create: func(ctx context.Context, m Organization) (*Organization, error) {
			return nil, errors.New("unexpected call")
		},
		getByID: func(ctx context.Context, id uuid.UUID) (*OrganizationWithDetails, error) {
			return nil, errors.New("unexpected call")
		},
		getByIDForUpdate: func(ctx context.Context, id uuid.UUID) (*Organization, error) {
			return nil, errors.New("unexpected call")
		},
		update: func(ctx context.Context, m Organization) (*Organization, error) {
			return nil, errors.New("unexpected call")
		},
		delete: func(ctx context.Context, id uuid.UUID) error { return errors.New("unexpected call") },
		list: func(ctx context.Context, limit, offset int32) ([]OrganizationWithDetails, int64, error) {
			return nil, 0, errors.New("unexpected call")
		},
		exists: func(ctx context.Context, id uuid.UUID) (bool, error) { return false, errors.New("unexpected call") },
	})

	_, err := service.GetByID(context.Background(), "not-a-uuid")
	if !errors.Is(err, ErrInvalidID) {
		t.Fatalf("expected ErrInvalidID, got %v", err)
	}
}

func TestOrganizationServiceDeleteRejectsMalformedID(t *testing.T) {
	t.Parallel()

	service := NewService(stubOrganizationRepository{
		create: func(ctx context.Context, m Organization) (*Organization, error) {
			return nil, errors.New("unexpected call")
		},
		getByID: func(ctx context.Context, id uuid.UUID) (*OrganizationWithDetails, error) {
			return nil, errors.New("unexpected call")
		},
		getByIDForUpdate: func(ctx context.Context, id uuid.UUID) (*Organization, error) {
			return nil, errors.New("unexpected call")
		},
		update: func(ctx context.Context, m Organization) (*Organization, error) {
			return nil, errors.New("unexpected call")
		},
		delete: func(ctx context.Context, id uuid.UUID) error { return errors.New("unexpected call") },
		list: func(ctx context.Context, limit, offset int32) ([]OrganizationWithDetails, int64, error) {
			return nil, 0, errors.New("unexpected call")
		},
		exists: func(ctx context.Context, id uuid.UUID) (bool, error) { return false, errors.New("unexpected call") },
	})

	err := service.Delete(context.Background(), "not-a-uuid")
	if !errors.Is(err, ErrInvalidID) {
		t.Fatalf("expected ErrInvalidID, got %v", err)
	}
}

func TestOrganizationServiceCreateValidatesOptionalFields(t *testing.T) {
	t.Parallel()

	validID := uuid.NewString()
	tests := []struct {
		name string
		req  CreateRequest
		want error
	}{
		{
			name: "invalid parent id returns 400-classified error",
			req: CreateRequest{
				PropertyTypeID: validID,
				Name:           "Org",
				INN:            "1234567890",
				KPP:            "123456789",
				Address:        "Address",
				ParentID:       stringPtr("bad-uuid"),
				RoleID:         validID,
				DirectorID:     validID,
			},
			want: ErrInvalidUUID,
		},
		{
			name: "invalid poa issue date returns validation error",
			req: CreateRequest{
				PropertyTypeID: validID,
				Name:           "Org",
				INN:            "1234567890",
				KPP:            "123456789",
				Address:        "Address",
				RoleID:         validID,
				DirectorID:     validID,
				POAIssueDate:   stringPtr("2026-31-31"),
			},
			want: ErrInvalidDate,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			service := NewService(stubOrganizationRepository{
				create: func(ctx context.Context, m Organization) (*Organization, error) {
					return nil, errors.New("unexpected call")
				},
				getByID: func(ctx context.Context, id uuid.UUID) (*OrganizationWithDetails, error) {
					return nil, errors.New("unexpected call")
				},
				getByIDForUpdate: func(ctx context.Context, id uuid.UUID) (*Organization, error) {
					return nil, errors.New("unexpected call")
				},
				update: func(ctx context.Context, m Organization) (*Organization, error) {
					return nil, errors.New("unexpected call")
				},
				delete: func(ctx context.Context, id uuid.UUID) error { return errors.New("unexpected call") },
				list: func(ctx context.Context, limit, offset int32) ([]OrganizationWithDetails, int64, error) {
					return nil, 0, errors.New("unexpected call")
				},
				exists: func(ctx context.Context, id uuid.UUID) (bool, error) { return false, errors.New("unexpected call") },
			})

			_, err := service.Create(context.Background(), tt.req)
			if !errors.Is(err, tt.want) {
				t.Fatalf("expected %v, got %v", tt.want, err)
			}
		})
	}
}

func TestOrganizationServiceUpdateValidatesOptionalFields(t *testing.T) {
	t.Parallel()

	current := &Organization{
		ID:             uuid.New(),
		PropertyTypeID: uuid.New(),
		RoleID:         uuid.New(),
		DirectorID:     uuid.New(),
	}

	tests := []struct {
		name string
		req  UpdateRequest
		want error
	}{
		{
			name: "invalid optional property type id fails fast",
			req:  UpdateRequest{PropertyTypeID: stringPtr("bad-uuid")},
			want: ErrInvalidUUID,
		},
		{
			name: "invalid parent id fails fast",
			req:  UpdateRequest{ParentID: stringPtr("bad-uuid")},
			want: ErrInvalidUUID,
		},
		{
			name: "invalid poa expiration date fails fast",
			req:  UpdateRequest{POAExpirationDate: stringPtr("2026-99-01")},
			want: ErrInvalidDate,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			service := NewService(stubOrganizationRepository{
				create: func(ctx context.Context, m Organization) (*Organization, error) {
					return nil, errors.New("unexpected call")
				},
				getByID: func(ctx context.Context, id uuid.UUID) (*OrganizationWithDetails, error) {
					return nil, errors.New("unexpected call")
				},
				getByIDForUpdate: func(ctx context.Context, id uuid.UUID) (*Organization, error) {
					return current, nil
				},
				update: func(ctx context.Context, m Organization) (*Organization, error) {
					return nil, errors.New("unexpected call")
				},
				delete: func(ctx context.Context, id uuid.UUID) error { return errors.New("unexpected call") },
				list: func(ctx context.Context, limit, offset int32) ([]OrganizationWithDetails, int64, error) {
					return nil, 0, errors.New("unexpected call")
				},
				exists: func(ctx context.Context, id uuid.UUID) (bool, error) { return false, errors.New("unexpected call") },
			})

			_, err := service.Update(context.Background(), current.ID.String(), tt.req)
			if !errors.Is(err, tt.want) {
				t.Fatalf("expected %v, got %v", tt.want, err)
			}
		})
	}
}

func stringPtr(value string) *string {
	return &value
}
