package equipment

import "errors"

var (
	ErrUnauthorized           = errors.New("unauthorized")
	ErrForbidden              = errors.New("forbidden")
	ErrInvalidID              = errors.New("invalid equipment ID")
	ErrNotFound               = errors.New("equipment not found")
	ErrManufacturerRequired   = errors.New("manufacturer is required")
	ErrClassificationRequired = errors.New("classification is required")
	ErrModelRequired          = errors.New("model is required")
	ErrFullNameRequired       = errors.New("full name is required")
	ErrFactoryNumberRequired  = errors.New("factory number is required")
	ErrUnitRequired           = errors.New("unit is required")
	ErrManufactureYearInvalid = errors.New("manufacture year is invalid")
	ErrStatusRequired         = errors.New("status is required")
	ErrStatusInvalid          = errors.New("status is invalid")
	ErrAlreadyArchived        = errors.New("equipment is already archived")
	ErrCreateFailed           = errors.New("failed to create equipment")
	ErrUpdateFailed           = errors.New("failed to update equipment")
	ErrListFailed             = errors.New("failed to list equipment")
	ErrArchiveFailed          = errors.New("failed to archive equipment")
)
