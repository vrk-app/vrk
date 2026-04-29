package metrologicaltype

import "errors"

var (
    ErrOperationTypeRequired = errors.New("metrological operation type is required")
    ErrInvalidID             = errors.New("invalid ID, must be an integer")
    ErrNotFound              = errors.New("metrological type not found")
    ErrCreateFailed          = errors.New("failed to create metrological type")
    ErrDeleteFailed          = errors.New("failed to delete metrological type")
    ErrListFailed            = errors.New("failed to list metrological types")
)
