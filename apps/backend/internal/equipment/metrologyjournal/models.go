package metrologyjournal

import "time"

type SubjectType string

const (
	SubjectTypeMeasuringInstrument SubjectType = "measuring_instrument"
	SubjectTypeStandard            SubjectType = "standard"
	SubjectTypeTechnicalEquipment  SubjectType = "technical_equipment"
)

type OperationType string

const (
	OperationTypeVerification OperationType = "verification"
	OperationTypeCalibration  OperationType = "calibration"
	OperationTypeMaintenance  OperationType = "maintenance"
	OperationTypeSuspension   OperationType = "suspension"
	OperationTypeDecommission OperationType = "decommission"
)

type Entry struct {
	ID                   string
	OrganizationID       string
	SubjectType          SubjectType
	SubjectID            string
	OperationType        OperationType
	OperationDate        time.Time
	DocumentNumber       string
	ValidUntil           *time.Time
	ExecutorOrganization string
	AttachmentURL        *string
	Comment              *string
	CreatedAt            time.Time
}

type DerivedState struct {
	Status        string
	NextDueDate   *string
	LatestJournal *Entry
	JournalCount  int
}

func DeriveState(entries []Entry, fallbackStatus string) DerivedState {
	if len(entries) == 0 {
		return DerivedState{Status: fallbackStatus}
	}

	latest := entries[0]
	state := DerivedState{
		Status:        fallbackStatus,
		LatestJournal: &latest,
		JournalCount:  len(entries),
	}

	switch latest.OperationType {
	case OperationTypeDecommission:
		state.Status = "retired"
		return state
	case OperationTypeSuspension:
		state.Status = "inactive"
		return state
	default:
		state.Status = "active"
	}

	if latest.ValidUntil == nil {
		return state
	}

	formatted := latest.ValidUntil.UTC().Format("2006-01-02")
	state.NextDueDate = &formatted
	today := time.Now().UTC().Truncate(24 * time.Hour)
	if latest.ValidUntil.UTC().Before(today) {
		state.Status = "inactive"
	}

	return state
}
