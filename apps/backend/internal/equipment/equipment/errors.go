package equipment

import "errors"

var (
    ErrFactoryNumberRequired   = errors.New("factory number is required")
    ErrManufactureYearRequired = errors.New("manufacture year is required")
    ErrInvalidUUID             = errors.New("invalid UUID format")
    ErrInvalidID               = errors.New("invalid equipment ID")
    ErrNotFound                = errors.New("equipment not found")
    ErrCreateFailed            = errors.New("failed to create equipment")
    ErrUpdateFailed            = errors.New("failed to update equipment")
    ErrDeleteFailed            = errors.New("failed to delete equipment")
    ErrListFailed              = errors.New("failed to list equipment")
    ErrCheckExistsFailed       = errors.New("failed to check equipment existence")
)