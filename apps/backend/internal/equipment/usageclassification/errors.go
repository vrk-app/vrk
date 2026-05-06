package usageclassification

import "errors"

var (
    ErrClassificationRequired = errors.New("classification is required")
    ErrClassificationTooLong  = errors.New("classification must not exceed 200 characters")
    ErrDuplicateClassification = errors.New("classification already exists")
    ErrInvalidID              = errors.New("invalid ID, must be an integer")
    ErrNotFound               = errors.New("usage classification not found")
    ErrCreateFailed           = errors.New("failed to create usage classification")
    ErrDeleteFailed           = errors.New("failed to delete usage classification")
    ErrListFailed             = errors.New("failed to list usage classifications")
)