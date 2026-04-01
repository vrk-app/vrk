package measuringinstrument

import "errors"

var (
    ErrRegistryNumberRequired        = errors.New("registry number is required")
    ErrMetrologicalTypeRequired      = errors.New("metrological operation type is required")
    ErrCertificateNumberRequired     = errors.New("certificate number is required")
    ErrDocumentProviderRequired      = errors.New("document provider organization is required")
    ErrDocumentURLRequired           = errors.New("document URL is required")
    ErrOrganizationRequired          = errors.New("organization is required")
    ErrInvalidUUID                   = errors.New("invalid UUID format")
    ErrInvalidID                     = errors.New("invalid measuring instrument ID")
    ErrNotFound                      = errors.New("measuring instrument not found")
    ErrCreateFailed                  = errors.New("failed to create measuring instrument")
    ErrUpdateFailed                  = errors.New("failed to update measuring instrument")
    ErrDeleteFailed                  = errors.New("failed to delete measuring instrument")
    ErrListFailed                    = errors.New("failed to list measuring instruments")
    ErrCheckExistsFailed             = errors.New("failed to check measuring instrument existence")
)