package organization

import (
	"context"
	"strings"
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

	propertyTypeID, err := parseRequiredUUID(req.PropertyTypeID)
	if err != nil {
		return nil, err
	}
	roleID, err := parseRequiredUUID(req.RoleID)
	if err != nil {
		return nil, err
	}
	directorID, err := parseRequiredUUID(req.DirectorID)
	if err != nil {
		return nil, err
	}
	parentID, err := parseOptionalUUID(req.ParentID)
	if err != nil {
		return nil, err
	}
	issueDate, err := parseOptionalDate(req.POAIssueDate)
	if err != nil {
		return nil, err
	}
	expDate, err := parseOptionalDate(req.POAExpirationDate)
	if err != nil {
		return nil, err
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
	orgID, err := uuid.Parse(strings.TrimSpace(id))
	if err != nil {
		return nil, ErrInvalidID
	}
	org, err := s.repository.GetByID(ctx, orgID)
	if err != nil {
		return nil, err
	}
	return toResponseFromOrganizationWithDetails(*org), nil
}

func (s *organizationService) Update(ctx context.Context, id string, req UpdateRequest) (*OrganizationResponse, error) {
	orgID, err := uuid.Parse(strings.TrimSpace(id))
	if err != nil {
		return nil, ErrInvalidID
	}

	current, err := s.repository.GetByIDForUpdate(ctx, orgID)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		current.Name = strings.TrimSpace(*req.Name)
	}
	if req.INN != nil {
		current.Inn = strings.TrimSpace(*req.INN)
	}
	if req.KPP != nil {
		current.Kpp = strings.TrimSpace(*req.KPP)
	}
	if req.Address != nil {
		current.Address = strings.TrimSpace(*req.Address)
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

	if req.PropertyTypeID != nil {
		current.PropertyTypeID, err = parseRequiredUUID(*req.PropertyTypeID)
		if err != nil {
			return nil, err
		}
	}

	if req.RoleID != nil {
		current.RoleID, err = parseRequiredUUID(*req.RoleID)
		if err != nil {
			return nil, err
		}
	}

	if req.DirectorID != nil {
		current.DirectorID, err = parseRequiredUUID(*req.DirectorID)
		if err != nil {
			return nil, err
		}
	}

	if req.ParentID != nil {
		current.ParentID, err = parseOptionalUUID(req.ParentID)
		if err != nil {
			return nil, err
		}
	}

	if req.POAIssueDate != nil {
		current.PoaIssueDate, err = parseOptionalDate(req.POAIssueDate)
		if err != nil {
			return nil, err
		}
	}

	if req.POAExpirationDate != nil {
		current.PoaExpirationDate, err = parseOptionalDate(req.POAExpirationDate)
		if err != nil {
			return nil, err
		}
	}

	org, err := s.repository.Update(ctx, *current)
	if err != nil {
		return nil, err
	}

	return toResponseFromOrganization(*org), nil
}

func (s *organizationService) Delete(ctx context.Context, id string) error {
	orgID, err := uuid.Parse(strings.TrimSpace(id))
	if err != nil {
		return ErrInvalidID
	}
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
		ID:      m.ID.String(),
		Name:    m.Name,
		INN:     m.Inn,
		KPP:     m.Kpp,
		Address: m.Address,
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

func parseRequiredUUID(value string) (uuid.UUID, error) {
	parsed, err := uuid.Parse(strings.TrimSpace(value))
	if err != nil {
		return uuid.Nil, ErrInvalidUUID
	}

	return parsed, nil
}

func parseOptionalUUID(value *string) (*uuid.UUID, error) {
	if value == nil {
		return nil, nil
	}

	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil, nil
	}

	parsed, err := uuid.Parse(trimmed)
	if err != nil {
		return nil, ErrInvalidUUID
	}

	return &parsed, nil
}

func parseOptionalDate(value *string) (*time.Time, error) {
	if value == nil {
		return nil, nil
	}

	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil, nil
	}

	parsed, err := time.Parse("2006-01-02", trimmed)
	if err != nil {
		return nil, ErrInvalidDate
	}

	return &parsed, nil
}
