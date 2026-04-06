package organization

import (
    "context"
    "time"

    "github.com/google/uuid"
)

type OrganizationService interface {
    Create(ctx context.Context, req CreateRequest) (*OrganizationResponse, error)
    List(ctx context.Context, limit, offset int32) ([]*OrganizationResponse, int64, error)
    GetByID(ctx context.Context, id string) (*OrganizationResponse, error)
    Update(ctx context.Context, id string, req UpdateRequest) (*OrganizationResponse, error)
    Delete(ctx context.Context, id string) error
}

type organizationService struct {
    repository OrganizationRepository
}

func NewService(repository OrganizationRepository) OrganizationService {
    return &organizationService{repository: repository}
}

func (s *organizationService) Create(ctx context.Context, req CreateRequest) (*OrganizationResponse, error) {
    id := uuid.New()

	propertyTypeID, _ := uuid.Parse(req.PropertyTypeID)
	roleID, _ := uuid.Parse(req.RoleID)
	directorID, _ := uuid.Parse(req.DirectorID)

	var parentID *uuid.UUID
	if req.ParentID != nil {
		p, _ := uuid.Parse(*req.ParentID)
		parentID = &p
	}

	var issueDate *time.Time
	if req.POAIssueDate != nil {
		t, _ := time.Parse("2006-01-02", *req.POAIssueDate)
		issueDate = &t
	}

	var expDate *time.Time
	if req.POAExpirationDate != nil {
		t, _ := time.Parse("2006-01-02", *req.POAExpirationDate)
		expDate = &t
	}

	model := Organization{
		ID:                    id,
		PropertyTypeID:        propertyTypeID,
		Name:                  req.Name,
		Inn:                   req.INN,
		Kpp:                   req.KPP,
		Address:               req.Address,
		RoleID:                roleID,
		DirectorID:            directorID,
		ParentID:              parentID,
		ShortName:             req.ShortName,
		PowerOfAttorneyNumber: req.PowerOfAttorneyNumber,
		PoaIssueDate:          issueDate,
		PoaExpirationDate:     expDate,
		Logo:                  req.Logo,
	}

	org, err := s.repository.Create(ctx, model)
	if err != nil {
		return nil, err
	}

	return toResponseFromOrganization(*org), nil
}

func (s *organizationService) GetByID(ctx context.Context, id string) (*OrganizationResponse, error) {
	orgID, _ := uuid.Parse(id)
	org, err := s.repository.GetByID(ctx, orgID)
	if err != nil {
		return nil, err
	}
	return toResponseFromOrganizationWithDetails(*org), nil
}

func (s *organizationService) Update(ctx context.Context, id string, req UpdateRequest) (*OrganizationResponse, error) {
	orgID, err := uuid.Parse(id)
	if err != nil {
		return nil, ErrInvalidID
	}

    current, err := s.repository.GetByIDForUpdate(ctx, orgID)
    if err != nil {
        return nil, err
    }

    if req.Name != nil {
        current.Name = *req.Name
    }
    if req.INN != nil {
        current.Inn = *req.INN
    }
    if req.KPP != nil {
        current.Kpp = *req.KPP
    }
    if req.Address != nil {
        current.Address = *req.Address
    }
    if req.ShortName != nil {
        current.ShortName = req.ShortName
    }
    if req.PowerOfAttorneyNumber != nil {
        current.PowerOfAttorneyNumber = req.PowerOfAttorneyNumber
    }
    if req.Logo != nil {
        current.Logo = req.Logo
    }

    if req.PropertyTypeID != nil && *req.PropertyTypeID != "" {
        current.PropertyTypeID = uuid.MustParse(*req.PropertyTypeID)
    }

    if req.RoleID != nil && *req.RoleID != "" {
        current.RoleID = uuid.MustParse(*req.RoleID)
    }

    if req.DirectorID != nil && *req.DirectorID != "" {
        current.DirectorID = uuid.MustParse(*req.DirectorID)
    }

    if req.ParentID != nil {
        if *req.ParentID == "" {
            current.ParentID = nil
        } else {
            p, _ := uuid.Parse(*req.ParentID)
            current.ParentID = &p
        }
    }

    if req.POAIssueDate != nil {
        if *req.POAIssueDate == "" {
            current.PoaIssueDate = nil
        } else {
            t, _ := time.Parse("2006-01-02", *req.POAIssueDate)
            current.PoaIssueDate = &t
        }
    }

    if req.POAExpirationDate != nil {
        if *req.POAExpirationDate == "" {
            current.PoaExpirationDate = nil
        } else {
            t, _ := time.Parse("2006-01-02", *req.POAExpirationDate)
            current.PoaExpirationDate = &t
        }
    }

	org, err := s.repository.Update(ctx, *current)
	if err != nil {
		return nil, err
	}

	return toResponseFromOrganization(*org), nil
}

func (s *organizationService) Delete(ctx context.Context, id string) error {
	orgID, _ := uuid.Parse(id)
	return s.repository.Delete(ctx, orgID)
}

func (s *organizationService) List(ctx context.Context, limit, offset int32) ([]*OrganizationResponse, int64, error) {
    if limit <= 0 {
        limit = 10
    }
	items, total, err := s.repository.List(ctx, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	res := make([]*OrganizationResponse, len(items))
	for i := range items {
		res[i] = toResponseFromOrganizationWithDetails(items[i])
	}

	return res, total, nil
}

// toResponse
func toResponseFromOrganization(m Organization) *OrganizationResponse {
	resp := &OrganizationResponse{
		ID:             m.ID.String(),
		Name:           m.Name,
		INN:            m.Inn,
		KPP:            m.Kpp,
		Address:        m.Address,
	}

	if m.ParentID != nil {
		id := m.ParentID.String()
		resp.ParentID = &id
	}

	if m.ShortName != nil {
		resp.ShortName = m.ShortName
	}

	if m.PowerOfAttorneyNumber != nil {
		resp.PowerOfAttorneyNumber = m.PowerOfAttorneyNumber
	}

	if m.PoaIssueDate != nil {
		d := m.PoaIssueDate.Format("2006-01-02")
		resp.POAIssueDate = &d
	}

	if m.PoaExpirationDate != nil {
		d := m.PoaExpirationDate.Format("2006-01-02")
		resp.POAExpirationDate = &d
	}

	if m.Logo != nil {
		resp.Logo = m.Logo
	}

	return resp
}

func toResponseFromOrganizationWithDetails(row OrganizationWithDetails) *OrganizationResponse {
	resp := &OrganizationResponse{
		ID:           row.ID.String(),
		PropertyType: row.PropertyTypeName,
		Name:         row.Name,
		INN:          row.Inn,
		KPP:          row.Kpp,
		Address:      row.Address,
		Role:         row.RoleTitle,
		DirectorName: row.DirectorName,
	}

	if row.ParentID != nil {
		id := row.ParentID.String()
		resp.ParentID = &id
	}

	if row.ShortName != nil {
		resp.ShortName = row.ShortName
	}

	if row.PowerOfAttorneyNumber != nil {
		resp.PowerOfAttorneyNumber = row.PowerOfAttorneyNumber
	}

	if row.PoaIssueDate != nil {
		d := row.PoaIssueDate.Format("2006-01-02")
		resp.POAIssueDate = &d
	}

	if row.PoaExpirationDate != nil {
		d := row.PoaExpirationDate.Format("2006-01-02")
		resp.POAExpirationDate = &d
	}

	if row.Logo != nil {
		resp.Logo = row.Logo
	}

	return resp
}