package agreement

import "errors"

var (
    ErrSourceRequired        = errors.New("source is required")
    ErrFactoryIDRequired     = errors.New("factory ID is required")
    ErrOrganizationRequired  = errors.New("organization ID is required")
    ErrNumberRequired        = errors.New("number is required")
    ErrStartDateRequired     = errors.New("start date is required")
    ErrEndDateRequired       = errors.New("end date is required")
    ErrSubjectRequired       = errors.New("subject of agreement is required")
    ErrScheduleIDRequired    = errors.New("schedule ID is required")
    ErrInvalidUUID           = errors.New("invalid UUID format")
    ErrInvalidID             = errors.New("invalid agreement ID")
    ErrNotFound              = errors.New("agreement not found")
    ErrCreateFailed          = errors.New("failed to create agreement")
    ErrUpdateFailed          = errors.New("failed to update agreement")
    ErrDeleteFailed          = errors.New("failed to delete agreement")
    ErrListFailed            = errors.New("failed to list agreements")
    ErrCheckExistsFailed     = errors.New("failed to check agreement existence")
    ErrInvalidDate           = errors.New("invalid date format, expected YYYY-MM-DD")
    ErrInvalidDateRange      = errors.New("end date must be after start date")
)