package manufacturer

import (
    "github.com/google/uuid"
)

type Manufacturer struct {
    ID              uuid.UUID
    Name            string
    ClassificationID int32
}

type CreateRequest struct {
    Name            string `json:"name" validate:"required"`
    ClassificationID int32
}

type UpdateRequest struct {
    Name            *string `json:"name,omitempty"`
    ClassificationID *int32
}

type ManufacturerResponse struct {
    ID              string `json:"id"`
    Name            string `json:"name"`
    ClassificationID int32
}

type Pagination struct {
    Limit  int32
    Offset int32
}

type Meta struct {
    Total  int64 `json:"total"`
    Limit  int32 `json:"limit"`
    Offset int32 `json:"offset"`
}

type Response struct {
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
    Error   string      `json:"error,omitempty"`
    Meta    *Meta       `json:"meta,omitempty"`
}
