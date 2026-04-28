package usageclassification

import "errors"

var (
    ErrClassificationRequired = errors.New("classification is required")
    ErrInvalidID              = errors.New("invalid ID, must be an integer")
    ErrNotFound               = errors.New("usage classification not found")
    ErrCreateFailed           = errors.New("failed to create usage classification")
    ErrDeleteFailed           = errors.New("failed to delete usage classification")
    ErrListFailed             = errors.New("failed to list usage classifications")
)