package bootstrap

import (
	"errors"
	"testing"

	"backend/internal/db/generated"
)

func TestSelectSingleAccess(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name    string
		rows    []generated.ListAccountAccessPathsByAccountIDRow
		wantErr error
	}{
		{
			name:    "no eligible access returns unauthorized",
			rows:    nil,
			wantErr: ErrUnauthorized,
		},
		{
			name: "single eligible access is accepted",
			rows: []generated.ListAccountAccessPathsByAccountIDRow{
				{},
			},
		},
		{
			name: "multiple eligible access paths require explicit selection",
			rows: []generated.ListAccountAccessPathsByAccountIDRow{
				{},
				{},
			},
			wantErr: ErrAccessSelectionRequired,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			row, err := selectSingleAccess(tt.rows)
			if tt.wantErr == nil {
				if err != nil {
					t.Fatalf("unexpected error: %v", err)
				}
				if row == nil {
					t.Fatal("expected selected access row")
				}
				return
			}

			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("expected %v, got %v", tt.wantErr, err)
			}
			if row != nil {
				t.Fatal("expected no selected row when selection fails")
			}
		})
	}
}
