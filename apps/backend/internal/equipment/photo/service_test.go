package photo

import (
	"bytes"
	"context"
	"errors"
	"io"
	"slices"
	"testing"
	"time"

	"backend/internal/auth/bootstrap"
	"backend/internal/infrastructure/objectstorage"

	"github.com/google/uuid"
)

type memoryPhotoRepository struct {
	subjects map[string]SubjectSnapshot
	photos   map[string]EquipmentPhoto
	count    int
}

func (r *memoryPhotoRepository) Create(ctx context.Context, item EquipmentPhoto) (*EquipmentPhoto, error) {
	item.ID = uuid.NewString()
	item.SortOrder = r.count
	item.CreatedAt = time.Now().UTC()
	item.UpdatedAt = item.CreatedAt
	r.photos[item.ID] = item
	r.count++
	return &item, nil
}

func (r *memoryPhotoRepository) CountBySubject(ctx context.Context, organizationID uuid.UUID, subjectType SubjectType, subjectID uuid.UUID) (int, error) {
	return r.count, nil
}

func (r *memoryPhotoRepository) Delete(ctx context.Context, organizationID uuid.UUID, subjectType SubjectType, subjectID uuid.UUID, photoID uuid.UUID) (*EquipmentPhoto, error) {
	item, ok := r.photos[photoID.String()]
	if !ok {
		return nil, ErrPhotoNotFound
	}
	delete(r.photos, photoID.String())
	return &item, nil
}

func (r *memoryPhotoRepository) Get(ctx context.Context, organizationID uuid.UUID, subjectType SubjectType, subjectID uuid.UUID, photoID uuid.UUID) (*EquipmentPhoto, error) {
	item, ok := r.photos[photoID.String()]
	if !ok {
		return nil, ErrPhotoNotFound
	}
	return &item, nil
}

func (r *memoryPhotoRepository) GetSubjectSnapshot(ctx context.Context, subjectType SubjectType, subjectID uuid.UUID) (*SubjectSnapshot, error) {
	subject, ok := r.subjects[subjectID.String()]
	if !ok {
		return nil, ErrPhotoNotFound
	}
	return &subject, nil
}

func (r *memoryPhotoRepository) ListBySubject(ctx context.Context, organizationID uuid.UUID, subjectType SubjectType, subjectID uuid.UUID) ([]EquipmentPhoto, error) {
	return nil, errors.New("not implemented")
}

func (r *memoryPhotoRepository) ListBySubjects(ctx context.Context, organizationID uuid.UUID, subjectType SubjectType, subjectIDs []uuid.UUID) (map[string][]EquipmentPhoto, error) {
	return nil, errors.New("not implemented")
}

type memoryPhotoStorage struct {
	objects map[string][]byte
	deleted []string
}

func (s *memoryPhotoStorage) Put(ctx context.Context, key string, contentType string, body io.Reader, size int64) error {
	payload, err := io.ReadAll(body)
	if err != nil {
		return err
	}
	s.objects[key] = payload
	return nil
}

func (s *memoryPhotoStorage) Get(ctx context.Context, key string) (*objectstorage.Object, error) {
	payload, ok := s.objects[key]
	if !ok {
		return nil, objectstorage.ErrObjectNotFound
	}
	return &objectstorage.Object{
		Body:        io.NopCloser(bytes.NewReader(payload)),
		ContentType: "image/png",
		Size:        int64(len(payload)),
	}, nil
}

func (s *memoryPhotoStorage) Delete(ctx context.Context, key string) error {
	s.deleted = append(s.deleted, key)
	delete(s.objects, key)
	return nil
}

type photoAuthService struct {
	bootstrap.Service
	session *bootstrap.SessionSummaryResponse
	err     error
}

func (s photoAuthService) GetSession(ctx context.Context, token string) (*bootstrap.SessionSummaryResponse, error) {
	return s.session, s.err
}

func photoTestSession(orgID string, unitID string, roleTemplate string) *bootstrap.SessionSummaryResponse {
	return &bootstrap.SessionSummaryResponse{
		Organization: bootstrap.SessionOrganizationResponse{
			ID:          orgID,
			RoleTitle:   "customer",
			Name:        "ВРК Тест",
			LaunchState: "active",
		},
		Grant: &bootstrap.SessionGrantResponse{
			ID:           "grant-1",
			RoleTemplate: roleTemplate,
			ScopeType:    bootstrap.ScopeOrganization,
			ScopeID:      orgID,
		},
		Workspace: bootstrap.SessionWorkspaceResponse{
			ScopeType: bootstrap.ScopeOrganization,
			ScopeID:   orgID,
		},
		Units: []bootstrap.UnitResponse{
			{
				ID:     unitID,
				Type:   "ВРД",
				Name:   "Юнит",
				Status: "active",
			},
		},
	}
}

func TestUploadStoresPhotoForManager(t *testing.T) {
	orgID := uuid.NewString()
	unitID := uuid.NewString()
	subjectID := uuid.NewString()
	repository := &memoryPhotoRepository{
		subjects: map[string]SubjectSnapshot{
			subjectID: {
				ID:             subjectID,
				OrganizationID: orgID,
				UnitID:         unitID,
			},
		},
		photos: map[string]EquipmentPhoto{},
	}
	storage := &memoryPhotoStorage{objects: map[string][]byte{}}
	service := NewService(repository, photoAuthService{
		session: photoTestSession(orgID, unitID, bootstrap.RoleOrganizationAdmin),
	}, storage)

	response, err := service.Upload(
		context.Background(),
		"session-token",
		SubjectTechnicalEquipment,
		subjectID,
		"photo.png",
		"image/png",
		bytes.NewReader([]byte{137, 80, 78, 71, 13, 10, 26, 10}),
	)
	if err != nil {
		t.Fatalf("expected upload to succeed, got %v", err)
	}
	if response.URL != "/api/equipment/"+subjectID+"/photos/"+response.ID {
		t.Fatalf("unexpected public url: %s", response.URL)
	}
	if len(storage.objects) != 1 {
		t.Fatalf("expected one stored object, got %d", len(storage.objects))
	}
}

func TestUploadRejectsReadOnlyUser(t *testing.T) {
	orgID := uuid.NewString()
	unitID := uuid.NewString()
	subjectID := uuid.NewString()
	service := NewService(&memoryPhotoRepository{
		subjects: map[string]SubjectSnapshot{
			subjectID: {
				ID:             subjectID,
				OrganizationID: orgID,
				UnitID:         unitID,
			},
		},
		photos: map[string]EquipmentPhoto{},
	}, photoAuthService{
		session: photoTestSession(orgID, unitID, bootstrap.RoleOrganizationHead),
	}, &memoryPhotoStorage{objects: map[string][]byte{}})

	_, err := service.Upload(
		context.Background(),
		"session-token",
		SubjectTechnicalEquipment,
		subjectID,
		"photo.png",
		"image/png",
		bytes.NewReader([]byte{137, 80, 78, 71, 13, 10, 26, 10}),
	)
	if !errors.Is(err, ErrForbidden) {
		t.Fatalf("expected ErrForbidden, got %v", err)
	}
}

func TestUploadRejectsInvalidImagePayload(t *testing.T) {
	orgID := uuid.NewString()
	unitID := uuid.NewString()
	subjectID := uuid.NewString()
	repository := &memoryPhotoRepository{
		subjects: map[string]SubjectSnapshot{
			subjectID: {
				ID:             subjectID,
				OrganizationID: orgID,
				UnitID:         unitID,
			},
		},
		photos: map[string]EquipmentPhoto{},
	}
	storage := &memoryPhotoStorage{objects: map[string][]byte{}}
	service := NewService(repository, photoAuthService{
		session: photoTestSession(orgID, unitID, bootstrap.RoleOrganizationAdmin),
	}, storage)

	_, err := service.Upload(
		context.Background(),
		"session-token",
		SubjectTechnicalEquipment,
		subjectID,
		"not-a-photo.png",
		"image/png",
		bytes.NewReader([]byte("not an image")),
	)
	if !errors.Is(err, ErrPhotoInvalidContentType) {
		t.Fatalf("expected ErrPhotoInvalidContentType, got %v", err)
	}
	if len(storage.objects) != 0 {
		t.Fatalf("invalid payload should not be stored, got %d objects", len(storage.objects))
	}
}

func TestGetAllowsReadOnlyVisibleUser(t *testing.T) {
	orgID := uuid.NewString()
	unitID := uuid.NewString()
	subjectID := uuid.NewString()
	photoID := uuid.NewString()
	objectKey := "organizations/" + orgID + "/equipment/technical_equipment/" + subjectID + "/photos/" + photoID + ".png"
	service := NewService(&memoryPhotoRepository{
		subjects: map[string]SubjectSnapshot{
			subjectID: {
				ID:             subjectID,
				OrganizationID: orgID,
				UnitID:         unitID,
			},
		},
		photos: map[string]EquipmentPhoto{
			photoID: {
				ID:             photoID,
				OrganizationID: orgID,
				SubjectType:    SubjectTechnicalEquipment,
				SubjectID:      subjectID,
				ObjectKey:      objectKey,
				FileName:       "photo.png",
				ContentType:    "image/png",
				SizeBytes:      8,
			},
		},
	}, photoAuthService{
		session: photoTestSession(orgID, unitID, bootstrap.RoleOrganizationHead),
	}, &memoryPhotoStorage{objects: map[string][]byte{objectKey: []byte{137, 80, 78, 71, 13, 10, 26, 10}}})

	object, err := service.Get(context.Background(), "session-token", SubjectTechnicalEquipment, subjectID, photoID)
	if err != nil {
		t.Fatalf("expected get to succeed, got %v", err)
	}
	defer object.Body.Close()
	if object.ContentType != "image/png" {
		t.Fatalf("expected image/png, got %s", object.ContentType)
	}
}

func TestDeleteRejectsArchivedSubject(t *testing.T) {
	orgID := uuid.NewString()
	unitID := uuid.NewString()
	subjectID := uuid.NewString()
	photoID := uuid.NewString()
	archivedAt := time.Now().UTC()
	storage := &memoryPhotoStorage{objects: map[string][]byte{}}
	service := NewService(&memoryPhotoRepository{
		subjects: map[string]SubjectSnapshot{
			subjectID: {
				ID:             subjectID,
				OrganizationID: orgID,
				UnitID:         unitID,
				ArchivedAt:     &archivedAt,
			},
		},
		photos: map[string]EquipmentPhoto{},
	}, photoAuthService{
		session: photoTestSession(orgID, unitID, bootstrap.RoleOrganizationAdmin),
	}, storage)

	_, err := service.Delete(context.Background(), "session-token", SubjectTechnicalEquipment, subjectID, photoID)
	if !errors.Is(err, ErrArchivedSubject) {
		t.Fatalf("expected ErrArchivedSubject, got %v", err)
	}
	if len(storage.deleted) != 0 {
		t.Fatalf("storage delete should not be called for archived subject: %v", storage.deleted)
	}
}

func TestDeleteRemovesMetadataAndObjectForManager(t *testing.T) {
	orgID := uuid.NewString()
	unitID := uuid.NewString()
	subjectID := uuid.NewString()
	photoID := uuid.NewString()
	objectKey := "organizations/" + orgID + "/equipment/technical_equipment/" + subjectID + "/photos/" + photoID + ".png"
	storage := &memoryPhotoStorage{objects: map[string][]byte{objectKey: []byte{137, 80, 78, 71, 13, 10, 26, 10}}}
	service := NewService(&memoryPhotoRepository{
		subjects: map[string]SubjectSnapshot{
			subjectID: {
				ID:             subjectID,
				OrganizationID: orgID,
				UnitID:         unitID,
			},
		},
		photos: map[string]EquipmentPhoto{
			photoID: {
				ID:             photoID,
				OrganizationID: orgID,
				SubjectType:    SubjectTechnicalEquipment,
				SubjectID:      subjectID,
				ObjectKey:      objectKey,
				FileName:       "photo.png",
				ContentType:    "image/png",
				SizeBytes:      8,
			},
		},
	}, photoAuthService{
		session: photoTestSession(orgID, unitID, bootstrap.RoleOrganizationAdmin),
	}, storage)

	if _, err := service.Delete(context.Background(), "session-token", SubjectTechnicalEquipment, subjectID, photoID); err != nil {
		t.Fatalf("expected delete to succeed, got %v", err)
	}
	if !slices.Contains(storage.deleted, objectKey) {
		t.Fatalf("expected object delete for %s, got %v", objectKey, storage.deleted)
	}
}
