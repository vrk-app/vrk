package standard

import "errors"

var (
    ErrModelRequired             = errors.New("model is required")
    ErrCertificateNumberRequired = errors.New("certificate number is required")
    ErrDocumentProviderRequired  = errors.New("document provider organization is required")
    ErrDocumentURLRequired       = errors.New("document URL is required")
    ErrMetrologicalCharRequired  = errors.New("metrological characteristics are required")
    ErrInvalidUUID               = errors.New("invalid UUID format")
    ErrInvalidID                 = errors.New("invalid standard ID")
    ErrNotFound                  = errors.New("standard not found")
    ErrCreateFailed              = errors.New("failed to create standard")
    ErrUpdateFailed              = errors.New("failed to update standard")
    ErrDeleteFailed              = errors.New("failed to delete standard")
    ErrListFailed                = errors.New("failed to list standards")
    ErrCheckExistsFailed         = errors.New("failed to check standard existence")
)