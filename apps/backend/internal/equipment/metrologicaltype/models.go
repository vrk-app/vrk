package metrologicaltype

import (
    "time"
)

type MetrologicalType struct {
    ID                       int64
    MetrologicalOperationType string
    CreatedAt                time.Time
}

type CreateRequest struct {
    MetrologicalOperationType string `json:"metrologicalOperationType" validate:"required"`
}

type MetrologicalTypeResponse struct {
    ID                       int64  `json:"id"`
    MetrologicalOperationType string `json:"metrologicalOperationType"`
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
