package organization

import (
    "context"
    "database/sql"
    "fmt"
    "time"

    "github.com/google/uuid"

    "backend/internal/db/generated"
)

type OrganizationService interface {
    Create(ctx context.Context, req CreateRequest) (*OrganizationResponse, error)
    List(ctx context.Context, limit, offset int32) ([]*OrganizationResponse, int64, error)
    GetByID(ctx context.Context, id string) (*OrganizationResponse, error)
    Update(ctx context.Context, id string, req UpdateRequest) (*OrganizationResponse, error)
    Delete(ctx context.Context, id string) error
}

type organizationService struct {
    organizationRepository OrganizationRepository
}

func NewService(organizationRepository OrganizationRepository) OrganizationService {
    return &organizationService{organizationRepository: organizationRepository}
}

func (s *organizationService) Create(ctx context.Context, req CreateRequest) (*OrganizationResponse, error) {
    if req.Name == "" {
        return nil, ErrNameRequired
    }
    if req.INN == "" {
        return nil, ErrINNRequired
    }
    if len(req.INN) != 10 {
        return nil, ErrInvalidINN
    }
    if req.KPP == "" {
        return nil, ErrKPPRequired
    }
    if len(req.KPP) != 9 {
        return nil, ErrInvalidKPP
    }
    if req.Address == "" {
        return nil, ErrAddressRequired
    }
    if req.PropertyTypeID == "" {
        return nil, ErrPropertyTypeRequired
    }
    if req.RoleID == "" {
        return nil, ErrRoleRequired
    }
    if req.DirectorID == "" {
        return nil, ErrDirectorRequired
    }

    // Парсинг UUID полей
    propertyTypeID, err := uuid.Parse(req.PropertyTypeID)
    if err != nil {
        return nil, fmt.Errorf("%w: property_type_id", ErrInvalidUUID)
    }

    roleID, err := uuid.Parse(req.RoleID)
    if err != nil {
        return nil, fmt.Errorf("%w: role_id", ErrInvalidUUID)
    }

    var directorID uuid.NullUUID // костыль пока нет schema.yaml для sqlc
    if req.DirectorID != "" {
        id, err := uuid.Parse(req.DirectorID)
        if err != nil {
            return nil, fmt.Errorf("%w: director_id", ErrInvalidUUID)
        }
        directorID = uuid.NullUUID{UUID: id, Valid: true}
    }


    var parentID uuid.NullUUID
    if req.ParentID != nil && *req.ParentID != "" {
        id, err := uuid.Parse(*req.ParentID)
        if err != nil {
            return nil, fmt.Errorf("%w: parent_id", ErrInvalidUUID)
        }
        parentID = uuid.NullUUID{UUID: id, Valid: true}
    }

    // Парсинг дат
    var poaIssueDate, poaExpirationDate *time.Time
    if req.POAIssueDate != nil && *req.POAIssueDate != "" {
        t, err := time.Parse("2006-01-02", *req.POAIssueDate)
        if err == nil {
            poaIssueDate = &t
        }
    }
    if req.POAExpirationDate != nil && *req.POAExpirationDate != "" {
        t, err := time.Parse("2006-01-02", *req.POAExpirationDate)
        if err == nil {
            poaExpirationDate = &t
        }
    }

    params := generated.CreateOrganizationParams{
        PropertyTypeID:        propertyTypeID,
        Name:                  req.Name,
        Inn:                   req.INN,
        Kpp:                   req.KPP,
        Address:               req.Address,
        RoleID:                roleID,
        DirectorID:            directorID,
        ParentID:              parentID,
    }

    if req.ShortName != nil {
        params.ShortName = sql.NullString{String: *req.ShortName, Valid: true}
    }
    if req.PowerOfAttorneyNumber != nil {
        params.PowerOfAttorneyNumber = sql.NullString{String: *req.PowerOfAttorneyNumber, Valid: true}
    }
    if poaIssueDate != nil {
        params.PoaIssueDate = sql.NullTime{Time: *poaIssueDate, Valid: true}
    }
    if poaExpirationDate != nil {
        params.PoaExpirationDate = sql.NullTime{Time: *poaExpirationDate, Valid: true}
    }
    if req.Logo != nil {
        params.Logo = sql.NullString{String: *req.Logo, Valid: true}
    }

    org, err := s.organizationRepository.Create(ctx, params)
    if err != nil {
        return nil, err
    }

    return toResponse(fromCreateRow(org)), nil
}

func (s *organizationService) GetByID(ctx context.Context, id string) (*OrganizationResponse, error) {
    orgID, err := uuid.Parse(id)
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrInvalidID, err)
    }

    org, err := s.organizationRepository.GetByID(ctx, orgID)
    if err != nil {
        return nil, err
    }

    return toResponse(fromGetByIDRow(org)), nil
}

func (s *organizationService) Update(ctx context.Context, id string, req UpdateRequest) (*OrganizationResponse, error) {
    orgID, err := uuid.Parse(id)
    if err != nil {
        return nil, fmt.Errorf("%w: %v", ErrInvalidID, err)
    }

    exists, err := s.organizationRepository.Exists(ctx, orgID)
    if err != nil {
        return nil, err
    }
    if !exists {
        return nil, ErrNotFound
    }

    current, err := s.organizationRepository.GetByID(ctx, orgID)
    if err != nil {
        return nil, err
    }

    propertyTypeID := current.PropertyTypeID
    if req.PropertyTypeID != nil && *req.PropertyTypeID != "" {
        id, err := uuid.Parse(*req.PropertyTypeID)
        if err != nil {
            return nil, fmt.Errorf("%w: property_type_id", ErrInvalidUUID)
        }
        propertyTypeID = id
    }

    roleID := current.RoleID
    if req.RoleID != nil && *req.RoleID != "" {
        id, err := uuid.Parse(*req.RoleID)
        if err != nil {
            return nil, fmt.Errorf("%w: role_id", ErrInvalidUUID)
        }
        roleID = id
    }

    name := current.Name
    if req.Name != nil {
        name = *req.Name
    }

    inn := current.Inn
    if req.INN != nil {
        inn = *req.INN
    }

    kpp := current.Kpp
    if req.KPP != nil {
        kpp = *req.KPP
    }

    address := current.Address
    if req.Address != nil {
        address = *req.Address
    }

    directorID := uuid.NullUUID{Valid: current.DirectorID.Valid}
    if current.DirectorID.Valid {
        directorID.UUID = current.DirectorID.UUID
    }
    if req.DirectorID != nil && *req.DirectorID != "" {
        id, err := uuid.Parse(*req.DirectorID)
        if err != nil {
            return nil, fmt.Errorf("%w: director_id", ErrInvalidUUID)
        }
        directorID = uuid.NullUUID{UUID: id, Valid: true}
    }

    parentID := uuid.NullUUID{Valid: current.ParentID.Valid}
    if current.ParentID.Valid {
        parentID.UUID = current.ParentID.UUID
    }
    if req.ParentID != nil && *req.ParentID != "" {
        id, err := uuid.Parse(*req.ParentID)
        if err != nil {
            return nil, fmt.Errorf("%w: parent_id", ErrInvalidUUID)
        }
        parentID = uuid.NullUUID{UUID: id, Valid: true}
    }

    shortName := current.ShortName
    if req.ShortName != nil {
        shortName = sql.NullString{String: *req.ShortName, Valid: true}
    }

    powerOfAttorneyNumber := current.PowerOfAttorneyNumber
    if req.PowerOfAttorneyNumber != nil {
        powerOfAttorneyNumber = sql.NullString{String: *req.PowerOfAttorneyNumber, Valid: true}
    }

    poaIssueDate := current.PoaIssueDate
    if req.POAIssueDate != nil && *req.POAIssueDate != "" {
        t, err := time.Parse("2006-01-02", *req.POAIssueDate)
        if err == nil {
            poaIssueDate = sql.NullTime{Time: t, Valid: true}
        }
    }

    poaExpirationDate := current.PoaExpirationDate
    if req.POAExpirationDate != nil && *req.POAExpirationDate != "" {
        t, err := time.Parse("2006-01-02", *req.POAExpirationDate)
        if err == nil {
            poaExpirationDate = sql.NullTime{Time: t, Valid: true}
        }
    }

    logo := current.Logo
    if req.Logo != nil {
        logo = sql.NullString{String: *req.Logo, Valid: true}
    }

    params := generated.UpdateOrganizationParams{
        ID:                    orgID,
        PropertyTypeID:        propertyTypeID,
        RoleID:                roleID,
        Name:                  name,
        Inn:                   inn,
        Kpp:                   kpp,
        Address:               address,
        DirectorID:            directorID,
        ParentID:              parentID,
        ShortName:             shortName,
        PowerOfAttorneyNumber: powerOfAttorneyNumber,
        PoaIssueDate:          poaIssueDate,
        PoaExpirationDate:     poaExpirationDate,
        Logo:                  logo,
    }

    org, err := s.organizationRepository.Update(ctx, params)
    if err != nil {
        return nil, err
    }

    return toResponse(fromUpdateRow(org)), nil
}

func (s *organizationService) Delete(ctx context.Context, id string) error {
    orgID, err := uuid.Parse(id)
    if err != nil {
        return fmt.Errorf("%w: %v", ErrInvalidID, err)
    }
    return s.organizationRepository.Delete(ctx, orgID)
}


func (s *organizationService) List(ctx context.Context, limit, offset int32) ([]*OrganizationResponse, int64, error) {
    if limit <= 0 {
        limit = 10
    } // нужно задавать из конфига/констант
    if limit > 100 {
        limit = 100
    }
    if offset < 0 {
        offset = 0
    }

    items, total, err := s.organizationRepository.List(ctx, limit, offset)
    if err != nil {
        return nil, 0, err
    }

    responses := make([]*OrganizationResponse, len(items))
    for i := range items {
        responses[i] = toResponse(fromListRow(&items[i]))
    }

    return responses, total, nil
}

// toResponse
type orgModel struct {
	ID            uuid.UUID
	PropertyTypeID uuid.UUID
	Name          string
	Inn           string
	Kpp           string
	Address       string
	RoleID        uuid.UUID
	DirectorID    uuid.NullUUID
	ParentID      uuid.NullUUID
	ShortName     sql.NullString
	PowerOfAttorneyNumber sql.NullString
	PoaIssueDate  sql.NullTime
	PoaExpirationDate sql.NullTime
	Logo          sql.NullString
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

func fromCreateRow(r *generated.CreateOrganizationRow) orgModel {
	return orgModel{
		ID: r.ID, PropertyTypeID: r.PropertyTypeID, Name: r.Name,
		Inn: r.Inn, Kpp: r.Kpp, Address: r.Address,
		RoleID: r.RoleID, DirectorID: r.DirectorID,
		ParentID: r.ParentID, ShortName: r.ShortName,
		PowerOfAttorneyNumber: r.PowerOfAttorneyNumber,
		PoaIssueDate: r.PoaIssueDate, PoaExpirationDate: r.PoaExpirationDate,
		Logo: r.Logo, CreatedAt: r.CreatedAt, UpdatedAt: r.UpdatedAt,
	}
}

func fromListRow(r *generated.ListOrganizationsRow) orgModel {
	return fromCreateRow((*generated.CreateOrganizationRow)(r))
}

func fromUpdateRow(r *generated.UpdateOrganizationRow) orgModel {
	return fromCreateRow((*generated.CreateOrganizationRow)(r))
}

func fromGetByIDRow(r *generated.GetOrganizationByIDRow) orgModel {
	return fromCreateRow((*generated.CreateOrganizationRow)(r))
}

func toResponse(m orgModel) *OrganizationResponse {
	resp := &OrganizationResponse{
		ID: m.ID.String(),
		PropertyTypeID: m.PropertyTypeID.String(),
		Name: m.Name,
		INN: m.Inn,
		KPP: m.Kpp,
		Address: m.Address,
		RoleID: m.RoleID.String(),
		DirectorID: m.DirectorID.UUID.String(),
		CreatedAt: m.CreatedAt.Format(time.RFC3339),
		UpdatedAt: m.UpdatedAt.Format(time.RFC3339),
	}

	if m.ShortName.Valid {
		resp.ShortName = &m.ShortName.String
	}
	if m.ParentID.Valid {
		id := m.ParentID.UUID.String()
		resp.ParentID = &id
	}
	if m.PowerOfAttorneyNumber.Valid {
		resp.PowerOfAttorneyNumber = &m.PowerOfAttorneyNumber.String
	}
	if m.PoaIssueDate.Valid {
		d := m.PoaIssueDate.Time.Format("2006-01-02")
		resp.POAIssueDate = &d
	}
	if m.PoaExpirationDate.Valid {
		d := m.PoaExpirationDate.Time.Format("2006-01-02")
		resp.POAExpirationDate = &d
	}
	if m.Logo.Valid {
		resp.Logo = &m.Logo.String
	}

	return resp
}