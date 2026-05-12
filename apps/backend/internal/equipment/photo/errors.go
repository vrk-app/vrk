package photo

import "errors"

var (
	ErrUnauthorized             = errors.New("unauthorized")
	ErrForbidden                = errors.New("forbidden")
	ErrInvalidID                = errors.New("invalid equipment photo ID")
	ErrInvalidSubject           = errors.New("invalid equipment photo subject")
	ErrPhotoNotFound            = errors.New("equipment photo not found")
	ErrPhotoRequired            = errors.New("photo file is required")
	ErrPhotoInvalidContentType  = errors.New("photo must be JPEG, PNG, or WebP")
	ErrPhotoTooLarge            = errors.New("photo must not exceed 5 MB")
	ErrPhotoLimitExceeded       = errors.New("equipment photo limit exceeded")
	ErrArchivedSubject          = errors.New("archived equipment photos cannot be changed")
	ErrObjectStorageUnavailable = errors.New("object storage is unavailable")
	ErrCreateFailed             = errors.New("failed to create equipment photo")
	ErrDeleteFailed             = errors.New("failed to delete equipment photo")
	ErrListFailed               = errors.New("failed to list equipment photos")
	ErrSubjectLookupFailed      = errors.New("failed to resolve equipment photo subject")
)
