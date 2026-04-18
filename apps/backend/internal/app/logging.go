package app

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5/middleware"
)

func requestLoggingMiddleware(logger *slog.Logger) func(http.Handler) http.Handler {
	// Вместо chi.Logger используем свой middleware: runtime baseline, compose и
	// CI должны видеть один и тот же structured JSON event shape в stdout.
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			startedAt := time.Now()
			writer := middleware.NewWrapResponseWriter(w, r.ProtoMajor)

			next.ServeHTTP(writer, r)

			// 4xx оставляем на info: для CRUD-эндпоинтов и smoke probe это часто
			// штатные ответы. До error повышаем только реальные 5xx.
			level := slog.LevelInfo
			if writer.Status() >= http.StatusInternalServerError {
				level = slog.LevelError
			}

			logger.LogAttrs(
				r.Context(),
				level,
				"http_request",
				slog.String("request_id", middleware.GetReqID(r.Context())),
				slog.String("method", r.Method),
				slog.String("path", r.URL.Path),
				slog.Int("status", writer.Status()),
				slog.Int("bytes", writer.BytesWritten()),
				slog.Int64("duration_ms", time.Since(startedAt).Milliseconds()),
				slog.String("remote_addr", r.RemoteAddr),
			)
		})
	}
}
