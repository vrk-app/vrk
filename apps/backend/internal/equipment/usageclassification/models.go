package usageclassification

import (
    "time"
)

type UsageClassification struct {
    ID            int32
    Classification string
    CreatedAt     time.Time
}

type CreateRequest struct {
    Classification string `json:"classification" validate:"required"`
}

type UsageClassificationResponse struct {
    ID             int32  `json:"id"`
    Classification string `json:"classification"`
    CreatedAt      string `json:"createdAt"`
}

type ListFilter struct {
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