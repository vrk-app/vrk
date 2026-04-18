package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"backend/internal/app"
	"backend/internal/infrastructure/config"
)

// @title VRK API
// @BasePath /api/v1
func main() {
	// Stage 02 smoke, compose и CI читают backend-логи из stdout, поэтому
	// держим один process-wide structured logger от старта до остановки.
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{}))
	slog.SetDefault(logger)

	cfg, err := config.Load()
	if err != nil {
		fail("failed to load config", err)
	}

	application, err := app.New(cfg)
	if err != nil {
		fail("failed to create app", err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Run блокирует поток на ListenAndServe, поэтому сервер живет в отдельной
	// goroutine, а main выбирает между OS signal и неожиданным падением сервера.
	serverErrCh := make(chan error, 1)
	go func() {
		serverErrCh <- application.Run(ctx)
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	select {
	case sig := <-quit:
		slog.Info("shutdown_signal_received", "signal", sig.String())
	case err := <-serverErrCh:
		if err != nil {
			fail("server stopped unexpectedly", err)
		}
	}

	// Shutdown вызывается только отсюда. App.Run по ctx.Done() просто выходит,
	// чтобы не запускать два параллельных graceful shutdown path.
	cancel()

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutdownCancel()

	if err := application.Shutdown(shutdownCtx); err != nil {
		fail("shutdown error", err)
	}
}

func fail(message string, err error) {
	slog.Error(message, "error", err)
	os.Exit(1)
}
