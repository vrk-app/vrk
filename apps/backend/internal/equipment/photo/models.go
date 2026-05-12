package photo

import (
	"io"
	"time"
)

type SubjectType string

const (
	SubjectTechnicalEquipment  SubjectType = "technical_equipment"
	SubjectDiagnosticEquipment SubjectType = "diagnostic_equipment"
)

type EquipmentPhoto struct {
	ID             string
	OrganizationID string
	SubjectType    SubjectType
	SubjectID      string
	ObjectKey      string
	FileName       string
	ContentType    string
	SizeBytes      int64
	SortOrder      int
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

type SubjectSnapshot struct {
	ID             string
	OrganizationID string
	UnitID         string
	ArchivedAt     *time.Time
}

type EquipmentPhotoResponse struct {
	ID          string `json:"id"`
	FileName    string `json:"fileName"`
	ContentType string `json:"contentType"`
	SizeBytes   int64  `json:"sizeBytes"`
	SortOrder   int    `json:"sortOrder"`
	URL         string `json:"url"`
	CreatedAt   string `json:"createdAt"`
	UpdatedAt   string `json:"updatedAt"`
}

type EquipmentPhotoObject struct {
	Body        io.ReadCloser
	ContentType string
	Size        int64
	FileName    string
}

type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

func ToResponse(item EquipmentPhoto) EquipmentPhotoResponse {
	return EquipmentPhotoResponse{
		ID:          item.ID,
		FileName:    item.FileName,
		ContentType: item.ContentType,
		SizeBytes:   item.SizeBytes,
		SortOrder:   item.SortOrder,
		URL:         publicURL(item.SubjectType, item.SubjectID, item.ID),
		CreatedAt:   item.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   item.UpdatedAt.Format(time.RFC3339),
	}
}

func ToResponses(items []EquipmentPhoto) []EquipmentPhotoResponse {
	result := make([]EquipmentPhotoResponse, 0, len(items))
	for _, item := range items {
		result = append(result, ToResponse(item))
	}
	return result
}

func publicURL(subject SubjectType, subjectID string, photoID string) string {
	switch subject {
	case SubjectDiagnosticEquipment:
		return "/api/equipment/measuring-instruments/" + subjectID + "/photos/" + photoID
	default:
		return "/api/equipment/" + subjectID + "/photos/" + photoID
	}
}
