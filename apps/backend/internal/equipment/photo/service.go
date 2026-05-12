package photo

import (
	"bytes"
	"context"
	"errors"
	"io"
	"net/http"
	"path"
	"strings"

	"backend/internal/auth/bootstrap"
	"backend/internal/equipment/registryaccess"
	"backend/internal/infrastructure/objectstorage"

	"github.com/google/uuid"
)

const (
	maxPhotoSizeBytes = 5 * 1024 * 1024
	maxPhotoCount     = 10
)

type Service interface {
	Delete(ctx context.Context, token string, subjectType SubjectType, subjectID string, photoID string) (*EquipmentPhotoResponse, error)
	Get(ctx context.Context, token string, subjectType SubjectType, subjectID string, photoID string) (*EquipmentPhotoObject, error)
	Upload(ctx context.Context, token string, subjectType SubjectType, subjectID string, fileName string, contentType string, body io.Reader) (*EquipmentPhotoResponse, error)
}

type service struct {
	repository Repository
	auth       bootstrap.Service
	storage    objectstorage.Storage
}

func NewService(repository Repository, auth bootstrap.Service, storage objectstorage.Storage) Service {
	return &service{
		repository: repository,
		auth:       auth,
		storage:    storage,
	}
}

func (s *service) Upload(
	ctx context.Context,
	token string,
	subjectType SubjectType,
	subjectID string,
	fileName string,
	contentType string,
	body io.Reader,
) (*EquipmentPhotoResponse, error) {
	session, subjectUUID, subject, err := s.authorizeMutation(ctx, token, subjectType, subjectID)
	if err != nil {
		return nil, err
	}

	count, err := s.repository.CountBySubject(ctx, uuid.MustParse(session.Organization.ID), subjectType, subjectUUID)
	if err != nil {
		return nil, err
	}
	if count >= maxPhotoCount {
		return nil, ErrPhotoLimitExceeded
	}

	payload, err := io.ReadAll(io.LimitReader(body, maxPhotoSizeBytes+1))
	if err != nil {
		return nil, err
	}
	if len(payload) == 0 {
		return nil, ErrPhotoRequired
	}
	if len(payload) > maxPhotoSizeBytes {
		return nil, ErrPhotoTooLarge
	}

	contentType = normalizePhotoContentType(fileName, contentType, payload)
	if contentType == "" {
		return nil, ErrPhotoInvalidContentType
	}
	fileName = normalizePhotoFileName(fileName, contentType)

	objectKey := "organizations/" + subject.OrganizationID + "/equipment/" + string(subjectType) + "/" + subject.ID + "/photos/" + uuid.NewString() + photoExtension(contentType)
	if err := s.storage.Put(ctx, objectKey, contentType, bytes.NewReader(payload), int64(len(payload))); err != nil {
		return nil, mapObjectStorageError(err)
	}

	created, err := s.repository.Create(ctx, EquipmentPhoto{
		OrganizationID: subject.OrganizationID,
		SubjectType:    subjectType,
		SubjectID:      subject.ID,
		ObjectKey:      objectKey,
		FileName:       fileName,
		ContentType:    contentType,
		SizeBytes:      int64(len(payload)),
	})
	if err != nil {
		_ = s.storage.Delete(ctx, objectKey)
		return nil, err
	}

	response := ToResponse(*created)
	return &response, nil
}

func (s *service) Get(ctx context.Context, token string, subjectType SubjectType, subjectID string, photoID string) (*EquipmentPhotoObject, error) {
	session, subjectUUID, _, err := s.authorizeView(ctx, token, subjectType, subjectID)
	if err != nil {
		return nil, err
	}
	photoUUID, err := uuid.Parse(strings.TrimSpace(photoID))
	if err != nil {
		return nil, ErrInvalidID
	}

	item, err := s.repository.Get(ctx, uuid.MustParse(session.Organization.ID), subjectType, subjectUUID, photoUUID)
	if err != nil {
		return nil, err
	}

	object, err := s.storage.Get(ctx, item.ObjectKey)
	if err != nil {
		return nil, mapObjectStorageError(err)
	}
	if object.ContentType == "" {
		object.ContentType = item.ContentType
	}
	if object.Size == 0 {
		object.Size = item.SizeBytes
	}

	return &EquipmentPhotoObject{
		Body:        object.Body,
		ContentType: object.ContentType,
		Size:        object.Size,
		FileName:    item.FileName,
	}, nil
}

func (s *service) Delete(ctx context.Context, token string, subjectType SubjectType, subjectID string, photoID string) (*EquipmentPhotoResponse, error) {
	session, subjectUUID, _, err := s.authorizeMutation(ctx, token, subjectType, subjectID)
	if err != nil {
		return nil, err
	}
	photoUUID, err := uuid.Parse(strings.TrimSpace(photoID))
	if err != nil {
		return nil, ErrInvalidID
	}

	deleted, err := s.repository.Delete(ctx, uuid.MustParse(session.Organization.ID), subjectType, subjectUUID, photoUUID)
	if err != nil {
		return nil, err
	}
	if deleted.ObjectKey != "" {
		_ = s.storage.Delete(ctx, deleted.ObjectKey)
	}

	response := ToResponse(*deleted)
	return &response, nil
}

func (s *service) authorizeMutation(ctx context.Context, token string, subjectType SubjectType, subjectID string) (*bootstrap.SessionSummaryResponse, uuid.UUID, *SubjectSnapshot, error) {
	session, err := registryaccess.RequireRegistryManager(ctx, s.auth, token)
	if err != nil {
		return nil, uuid.Nil, nil, mapAccessError(err)
	}

	subjectUUID, subject, err := s.resolveVisibleSubject(ctx, session, subjectType, subjectID)
	if err != nil {
		return nil, uuid.Nil, nil, err
	}
	if subject.ArchivedAt != nil {
		return nil, uuid.Nil, nil, ErrArchivedSubject
	}
	return session, subjectUUID, subject, nil
}

func (s *service) authorizeView(ctx context.Context, token string, subjectType SubjectType, subjectID string) (*bootstrap.SessionSummaryResponse, uuid.UUID, *SubjectSnapshot, error) {
	session, err := registryaccess.RequireCustomerSession(ctx, s.auth, token)
	if err != nil {
		return nil, uuid.Nil, nil, mapAccessError(err)
	}

	subjectUUID, subject, err := s.resolveVisibleSubject(ctx, session, subjectType, subjectID)
	if err != nil {
		return nil, uuid.Nil, nil, err
	}
	return session, subjectUUID, subject, nil
}

func (s *service) resolveVisibleSubject(
	ctx context.Context,
	session *bootstrap.SessionSummaryResponse,
	subjectType SubjectType,
	subjectID string,
) (uuid.UUID, *SubjectSnapshot, error) {
	if subjectType != SubjectTechnicalEquipment && subjectType != SubjectDiagnosticEquipment {
		return uuid.Nil, nil, ErrInvalidSubject
	}

	subjectUUID, err := uuid.Parse(strings.TrimSpace(subjectID))
	if err != nil {
		return uuid.Nil, nil, ErrInvalidSubject
	}

	subject, err := s.repository.GetSubjectSnapshot(ctx, subjectType, subjectUUID)
	if err != nil {
		return uuid.Nil, nil, err
	}
	if subject.OrganizationID != session.Organization.ID {
		return uuid.Nil, nil, ErrForbidden
	}
	if _, visible := registryaccess.VisibleUnitMap(session)[subject.UnitID]; !visible {
		return uuid.Nil, nil, ErrForbidden
	}

	return subjectUUID, subject, nil
}

func normalizePhotoContentType(fileName string, contentType string, payload []byte) string {
	declared := strings.ToLower(strings.TrimSpace(strings.Split(contentType, ";")[0]))
	detected := detectPhotoContentType(payload)
	if detected == "" {
		return ""
	}
	if declared == "image/png" || declared == "image/jpeg" || declared == "image/webp" {
		if declared != detected {
			return ""
		}
	}
	return detected
}

func detectPhotoContentType(payload []byte) string {
	if len(payload) >= 8 && bytes.Equal(payload[:8], []byte{0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a}) {
		return "image/png"
	}
	if len(payload) >= 3 && payload[0] == 0xff && payload[1] == 0xd8 && payload[2] == 0xff {
		return "image/jpeg"
	}
	if len(payload) >= 12 && string(payload[0:4]) == "RIFF" && string(payload[8:12]) == "WEBP" {
		return "image/webp"
	}

	detected := strings.ToLower(strings.TrimSpace(strings.Split(http.DetectContentType(payload), ";")[0]))
	if detected == "image/png" || detected == "image/jpeg" || detected == "image/webp" {
		return detected
	}
	return ""
}

func normalizePhotoFileName(fileName string, contentType string) string {
	fileName = path.Base(strings.TrimSpace(fileName))
	if fileName == "." || fileName == "/" || fileName == "" {
		return "photo" + photoExtension(contentType)
	}
	return fileName
}

func photoExtension(contentType string) string {
	switch contentType {
	case "image/png":
		return ".png"
	case "image/jpeg":
		return ".jpg"
	case "image/webp":
		return ".webp"
	default:
		return ""
	}
}

func mapAccessError(err error) error {
	switch err {
	case nil:
		return nil
	case registryaccess.ErrUnauthorized:
		return ErrUnauthorized
	case registryaccess.ErrForbidden:
		return ErrForbidden
	default:
		return err
	}
}

func mapObjectStorageError(err error) error {
	switch {
	case errors.Is(err, objectstorage.ErrNotConfigured):
		return ErrObjectStorageUnavailable
	case errors.Is(err, objectstorage.ErrObjectNotFound):
		return ErrPhotoNotFound
	default:
		return err
	}
}
