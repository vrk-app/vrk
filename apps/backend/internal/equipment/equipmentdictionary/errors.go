package equipmentdictionary

import "errors"

var (
    ErrInvalidID          = errors.New("invalid ID format")
    ErrNotFound           = errors.New("equipment dictionary not found")
    ErrCreateFailed       = errors.New("failed to create equipment dictionary")
    ErrUpdateFailed       = errors.New("failed to update equipment dictionary")
    ErrDeleteFailed       = errors.New("failed to delete equipment dictionary")
    ErrListFailed         = errors.New("failed to list equipment dictionaries")
    ErrRegistryNumberNotUnique = errors.New("registry number already exists")
    ErrMIDNotFound = errors.New("measuring instrument dictionary not found for this equipment dictionary")
    ErrInvalidMID         = errors.New("invalid measuring instrument dictionary ID")
    ErrStandardCreationFailed = errors.New("failed to create standard dictionary")
    ErrStandardModelTooLong = errors.New("standard model must not exceed 100 characters")
    ErrRegistryNumberRequired   = errors.New("registry number is required")
    ErrRegistryNumberTooLong    = errors.New("registry number must not exceed 50 characters")
    ErrMetrologicalTypeNotFound = errors.New("metrological operation type not found")
)