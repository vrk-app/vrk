package manufacturer

import "errors"

var (
    ErrNameRequired        = errors.New("manufacturer name is required")
    ErrNameTooLong           = errors.New("manufacturer name must not exceed 200 characters")
    ErrDuplicateName         = errors.New("manufacturer with this name already exists")
    ErrClassificationNotFound = errors.New("classification not found")
    ErrClassificationRequired = errors.New("classification ID is required")
    ErrInvalidUUID          = errors.New("invalid UUID format")
    ErrInvalidID            = errors.New("invalid manufacturer ID")
    ErrNotFound             = errors.New("manufacturer not found")
    ErrCreateFailed         = errors.New("failed to create manufacturer")
    ErrUpdateFailed         = errors.New("failed to update manufacturer")
    ErrDeleteFailed         = errors.New("failed to delete manufacturer")
    ErrListFailed           = errors.New("failed to list manufacturers")
    ErrCheckExistsFailed    = errors.New("failed to check manufacturer existence")
)  