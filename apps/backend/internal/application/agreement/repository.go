package agreement

import (
	"context"
	"errors"
	"fmt"
	"time"

	"backend/internal/db/generated"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type AgreementRepository interface {
	Create(ctx context.Context, m Agreement) (*Agreement, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Agreement, error)
	ListByCustomerOrganization(ctx context.Context, organizationID uuid.UUID) ([]Agreement, error)
	ListByContractorOrganization(ctx context.Context, organizationID uuid.UUID) ([]Agreement, error)
	Update(ctx context.Context, m Agreement) (*Agreement, error)
	ListActiveContractors(ctx context.Context) ([]ContractorOption, error)
	GetActiveContractorByID(ctx context.Context, id uuid.UUID) (*ContractorOption, error)
}

type agreementRepository struct {
	q *generated.Queries
}

func NewRepository(q *generated.Queries) AgreementRepository {
	return &agreementRepository{q: q}
}

func (r *agreementRepository) Create(ctx context.Context, m Agreement) (*Agreement, error) {
	row, err := r.q.CreateAgreement(ctx, generated.CreateAgreementParams{
		CustomerOrganizationID:   toPGUUID(m.CustomerOrganizationID),
		ContractorOrganizationID: toPGUUID(m.ContractorOrganizationID),
		ContractNumber:           stringPtr(m.ContractNumber),
		ContractStatus:           stringPtr(m.ContractStatus),
		StartDate:                toPGDate(m.StartDate),
		EndDate:                  toPGDate(m.EndDate),
		WorkType:                 stringPtr(m.WorkType),
		EquipmentType:            stringPtr(m.EquipmentType),
		Region:                   stringPtr(m.Region),
		DivisionID:               nullablePGUUID(m.DivisionID),
		UnitID:                   nullablePGUUID(m.UnitID),
		LocationScopeLabel:       cloneString(m.LocationScopeLabel),
		Source:                   cloneString(m.Source),
		SubjectOfAgreement:       cloneString(m.SubjectOfAgreement),
	})
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrCreateFailed, err)
	}

	return mapCreateAgreementRow(&row), nil
}

func (r *agreementRepository) GetByID(ctx context.Context, id uuid.UUID) (*Agreement, error) {
	row, err := r.q.GetAgreementByID(ctx, toPGUUID(id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return mapGetAgreementRow(&row), nil
}

func (r *agreementRepository) ListByCustomerOrganization(ctx context.Context, organizationID uuid.UUID) ([]Agreement, error) {
	rows, err := r.q.ListAgreementsByCustomerOrganization(ctx, toPGUUID(organizationID))
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrListFailed, err)
	}

	result := make([]Agreement, 0, len(rows))
	for _, row := range rows {
		result = append(result, *mapCustomerAgreementRow(&row))
	}
	return result, nil
}

func (r *agreementRepository) ListByContractorOrganization(ctx context.Context, organizationID uuid.UUID) ([]Agreement, error) {
	rows, err := r.q.ListAgreementsByContractorOrganization(ctx, toPGUUID(organizationID))
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrListFailed, err)
	}

	result := make([]Agreement, 0, len(rows))
	for _, row := range rows {
		result = append(result, *mapContractorAgreementRow(&row))
	}
	return result, nil
}

func (r *agreementRepository) Update(ctx context.Context, m Agreement) (*Agreement, error) {
	_, err := r.q.UpdateAgreement(ctx, generated.UpdateAgreementParams{
		ID:                       toPGUUID(m.ID),
		ContractorOrganizationID: toPGUUID(m.ContractorOrganizationID),
		ContractNumber:           stringPtr(m.ContractNumber),
		ContractStatus:           stringPtr(m.ContractStatus),
		StartDate:                toPGDate(m.StartDate),
		EndDate:                  toPGDate(m.EndDate),
		WorkType:                 stringPtr(m.WorkType),
		EquipmentType:            stringPtr(m.EquipmentType),
		Region:                   stringPtr(m.Region),
		DivisionID:               nullablePGUUID(m.DivisionID),
		UnitID:                   nullablePGUUID(m.UnitID),
		LocationScopeLabel:       cloneString(m.LocationScopeLabel),
		Source:                   cloneString(m.Source),
		SubjectOfAgreement:       cloneString(m.SubjectOfAgreement),
		UpdatedAt:                pgtype.Timestamptz{Time: m.UpdatedAt, Valid: true},
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrConflict
		}
		return nil, fmt.Errorf("%w: %v", ErrUpdateFailed, err)
	}

	return r.GetByID(ctx, m.ID)
}

func (r *agreementRepository) ListActiveContractors(ctx context.Context) ([]ContractorOption, error) {
	rows, err := r.q.ListActiveContractorOrganizations(ctx)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrListFailed, err)
	}

	result := make([]ContractorOption, 0, len(rows))
	for _, row := range rows {
		result = append(result, ContractorOption{
			ID:        uuidFromPG(row.ID),
			Name:      row.ShellName,
			ShortName: row.ShortName,
		})
	}
	return result, nil
}

func (r *agreementRepository) GetActiveContractorByID(ctx context.Context, id uuid.UUID) (*ContractorOption, error) {
	row, err := r.q.GetActiveContractorOrganizationByID(ctx, toPGUUID(id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrContractorOrganizationInvalid
		}
		return nil, err
	}

	return &ContractorOption{
		ID:        uuidFromPG(row.ID),
		Name:      row.ShellName,
		ShortName: row.ShortName,
	}, nil
}

func mapCreateAgreementRow(row *generated.CreateAgreementRow) *Agreement {
	return &Agreement{
		ID:                         uuidFromPG(row.ID),
		CustomerOrganizationID:     uuidFromPG(row.CustomerOrganizationID),
		CustomerOrganizationName:   row.CustomerOrganizationName,
		ContractorOrganizationID:   uuidFromPG(row.ContractorOrganizationID),
		ContractorOrganizationName: row.ContractorOrganizationName,
		ContractNumber:             derefString(row.ContractNumber),
		ContractStatus:             derefString(row.ContractStatus),
		StartDate:                  row.StartDate.Time,
		EndDate:                    row.EndDate.Time,
		WorkType:                   derefString(row.WorkType),
		EquipmentType:              derefString(row.EquipmentType),
		Region:                     derefString(row.Region),
		DivisionID:                 optionalUUID(row.DivisionID),
		DivisionName:               row.DivisionName,
		UnitID:                     optionalUUID(row.UnitID),
		UnitName:                   row.UnitName,
		LocationScopeLabel:         row.LocationScopeLabel,
		Source:                     row.Source,
		SubjectOfAgreement:         row.SubjectOfAgreement,
		CreatedAt:                  row.CreatedAt.Time,
		UpdatedAt:                  row.UpdatedAt.Time,
	}
}

func mapGetAgreementRow(row *generated.GetAgreementByIDRow) *Agreement {
	return &Agreement{
		ID:                         uuidFromPG(row.ID),
		CustomerOrganizationID:     uuidFromPG(row.CustomerOrganizationID),
		CustomerOrganizationName:   row.CustomerOrganizationName,
		ContractorOrganizationID:   uuidFromPG(row.ContractorOrganizationID),
		ContractorOrganizationName: row.ContractorOrganizationName,
		ContractNumber:             derefString(row.ContractNumber),
		ContractStatus:             derefString(row.ContractStatus),
		StartDate:                  row.StartDate.Time,
		EndDate:                    row.EndDate.Time,
		WorkType:                   derefString(row.WorkType),
		EquipmentType:              derefString(row.EquipmentType),
		Region:                     derefString(row.Region),
		DivisionID:                 optionalUUID(row.DivisionID),
		DivisionName:               row.DivisionName,
		UnitID:                     optionalUUID(row.UnitID),
		UnitName:                   row.UnitName,
		LocationScopeLabel:         row.LocationScopeLabel,
		Source:                     row.Source,
		SubjectOfAgreement:         row.SubjectOfAgreement,
		CreatedAt:                  row.CreatedAt.Time,
		UpdatedAt:                  row.UpdatedAt.Time,
	}
}

func mapCustomerAgreementRow(row *generated.ListAgreementsByCustomerOrganizationRow) *Agreement {
	return &Agreement{
		ID:                         uuidFromPG(row.ID),
		CustomerOrganizationID:     uuidFromPG(row.CustomerOrganizationID),
		CustomerOrganizationName:   row.CustomerOrganizationName,
		ContractorOrganizationID:   uuidFromPG(row.ContractorOrganizationID),
		ContractorOrganizationName: row.ContractorOrganizationName,
		ContractNumber:             derefString(row.ContractNumber),
		ContractStatus:             derefString(row.ContractStatus),
		StartDate:                  row.StartDate.Time,
		EndDate:                    row.EndDate.Time,
		WorkType:                   derefString(row.WorkType),
		EquipmentType:              derefString(row.EquipmentType),
		Region:                     derefString(row.Region),
		DivisionID:                 optionalUUID(row.DivisionID),
		DivisionName:               row.DivisionName,
		UnitID:                     optionalUUID(row.UnitID),
		UnitName:                   row.UnitName,
		LocationScopeLabel:         row.LocationScopeLabel,
		Source:                     row.Source,
		SubjectOfAgreement:         row.SubjectOfAgreement,
		CreatedAt:                  row.CreatedAt.Time,
		UpdatedAt:                  row.UpdatedAt.Time,
	}
}

func mapContractorAgreementRow(row *generated.ListAgreementsByContractorOrganizationRow) *Agreement {
	return &Agreement{
		ID:                         uuidFromPG(row.ID),
		CustomerOrganizationID:     uuidFromPG(row.CustomerOrganizationID),
		CustomerOrganizationName:   row.CustomerOrganizationName,
		ContractorOrganizationID:   uuidFromPG(row.ContractorOrganizationID),
		ContractorOrganizationName: row.ContractorOrganizationName,
		ContractNumber:             derefString(row.ContractNumber),
		ContractStatus:             derefString(row.ContractStatus),
		StartDate:                  row.StartDate.Time,
		EndDate:                    row.EndDate.Time,
		WorkType:                   derefString(row.WorkType),
		EquipmentType:              derefString(row.EquipmentType),
		Region:                     derefString(row.Region),
		DivisionID:                 optionalUUID(row.DivisionID),
		DivisionName:               row.DivisionName,
		UnitID:                     optionalUUID(row.UnitID),
		UnitName:                   row.UnitName,
		LocationScopeLabel:         row.LocationScopeLabel,
		Source:                     row.Source,
		SubjectOfAgreement:         row.SubjectOfAgreement,
		CreatedAt:                  row.CreatedAt.Time,
		UpdatedAt:                  row.UpdatedAt.Time,
	}
}

func toPGUUID(id uuid.UUID) pgtype.UUID {
	return pgtype.UUID{Bytes: id, Valid: true}
}

func nullablePGUUID(id *uuid.UUID) pgtype.UUID {
	if id == nil {
		return pgtype.UUID{}
	}
	return toPGUUID(*id)
}

func optionalUUID(value pgtype.UUID) *uuid.UUID {
	if !value.Valid {
		return nil
	}

	id := uuidFromPG(value)
	return &id
}

func toPGDate(value time.Time) pgtype.Date {
	return pgtype.Date{Time: value, Valid: true}
}

func uuidFromPG(id pgtype.UUID) uuid.UUID {
	return uuid.UUID(id.Bytes)
}

func cloneString(value *string) *string {
	if value == nil {
		return nil
	}
	cloned := *value
	return &cloned
}

func stringPtr(value string) *string {
	return cloneString(&value)
}

func derefString(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}
