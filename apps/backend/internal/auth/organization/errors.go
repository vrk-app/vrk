package organization

import "errors"

var (
    ErrNameRequired         = errors.New("organization name is required")
    ErrINNRequired          = errors.New("INN is required")
    ErrInvalidINN           = errors.New("INN must be exactly 10 digits")
    ErrKPPRequired          = errors.New("KPP is required")
    ErrInvalidKPP           = errors.New("KPP must be exactly 9 digits")
    ErrAddressRequired      = errors.New("address is required")
    ErrPropertyTypeRequired = errors.New("property type is required")
    ErrRoleRequired         = errors.New("role is required")
    ErrDirectorRequired     = errors.New("director is required")
    ErrInvalidUUID          = errors.New("invalid UUID format")
    ErrInvalidID            = errors.New("invalid organization ID")
    ErrNotFound             = errors.New("organization not found")
    ErrCreateFailed         = errors.New("failed to create organization")
    ErrUpdateFailed         = errors.New("failed to update organization")
    ErrDeleteFailed         = errors.New("failed to delete organization")
    ErrListFailed           = errors.New("failed to list organizations")
    ErrCheckExistsFailed    = errors.New("failed to check organization existence")
)
