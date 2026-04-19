package standard

import "errors"

var (
	ErrUnauthorized             = errors.New("unauthorized")
	ErrForbidden                = errors.New("forbidden")
	ErrInvalidID                = errors.New("invalid standard ID")
	ErrNotFound                 = errors.New("standard not found")
	ErrTypeRequired             = errors.New("standard type is required")
	ErrModelRequired            = errors.New("model is required")
	ErrIdentifierRequired       = errors.New("identifier is required")
	ErrMetrologicalCharRequired = errors.New("metrological characteristics are required")
	ErrScopeInvalid             = errors.New("ownership scope is invalid")
	ErrOperationTypeRequired    = errors.New("operation type is required")
	ErrOperationTypeInvalid     = errors.New("operation type is invalid")
	ErrOperationDateRequired    = errors.New("operation date is required")
	ErrOperationDateInvalid     = errors.New("operation date is invalid")
	ErrDocumentNumberRequired   = errors.New("document number is required")
	ErrExecutorRequired         = errors.New("executor organization is required")
	ErrValidUntilInvalid        = errors.New("valid until is invalid")
	ErrArchivedTarget           = errors.New("archived standards cannot be changed")
	ErrAlreadyArchived          = errors.New("standard is already archived")
	ErrCreateFailed             = errors.New("failed to create standard")
	ErrUpdateFailed             = errors.New("failed to update standard")
	ErrListFailed               = errors.New("failed to list standards")
	ErrArchiveFailed            = errors.New("failed to archive standard")
)
