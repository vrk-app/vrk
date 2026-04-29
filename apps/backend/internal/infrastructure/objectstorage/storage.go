package objectstorage

import (
	"context"
	"errors"
	"fmt"
	"io"
	"strings"

	"backend/internal/infrastructure/config"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/smithy-go"
)

var (
	ErrNotConfigured  = errors.New("object storage is not configured")
	ErrObjectNotFound = errors.New("object not found")
)

type Object struct {
	Body        io.ReadCloser
	ContentType string
	Size        int64
}

type Storage interface {
	Put(ctx context.Context, key string, contentType string, body io.Reader, size int64) error
	Get(ctx context.Context, key string) (*Object, error)
	Delete(ctx context.Context, key string) error
}

type disabledStorage struct{}

func New(ctx context.Context, cfg config.ObjectStorageConfig) (Storage, error) {
	if cfg.Bucket == "" || cfg.AccessKeyID == "" || cfg.SecretAccessKey == "" {
		return disabledStorage{}, nil
	}

	awsCfg, err := awsconfig.LoadDefaultConfig(
		ctx,
		awsconfig.WithRegion(cfg.Region),
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(cfg.AccessKeyID, cfg.SecretAccessKey, "")),
	)
	if err != nil {
		return nil, fmt.Errorf("load object storage config: %w", err)
	}

	client := s3.NewFromConfig(awsCfg, func(options *s3.Options) {
		options.UsePathStyle = cfg.ForcePathStyle
		if strings.TrimSpace(cfg.Endpoint) != "" {
			options.BaseEndpoint = aws.String(strings.TrimSpace(cfg.Endpoint))
		}
	})

	return &s3Storage{
		bucket: cfg.Bucket,
		client: client,
	}, nil
}

func (disabledStorage) Put(context.Context, string, string, io.Reader, int64) error {
	return ErrNotConfigured
}

func (disabledStorage) Get(context.Context, string) (*Object, error) {
	return nil, ErrNotConfigured
}

func (disabledStorage) Delete(context.Context, string) error {
	return ErrNotConfigured
}

type s3Storage struct {
	bucket string
	client *s3.Client
}

func (s *s3Storage) Put(ctx context.Context, key string, contentType string, body io.Reader, size int64) error {
	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:        aws.String(s.bucket),
		Key:           aws.String(key),
		Body:          body,
		ContentLength: aws.Int64(size),
		ContentType:   aws.String(contentType),
	})
	if err != nil {
		return fmt.Errorf("put object: %w", err)
	}
	return nil
}

func (s *s3Storage) Get(ctx context.Context, key string) (*Object, error) {
	resp, err := s.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		if isNotFound(err) {
			return nil, ErrObjectNotFound
		}
		return nil, fmt.Errorf("get object: %w", err)
	}

	contentType := ""
	if resp.ContentType != nil {
		contentType = *resp.ContentType
	}
	size := int64(0)
	if resp.ContentLength != nil {
		size = *resp.ContentLength
	}

	return &Object{
		Body:        resp.Body,
		ContentType: contentType,
		Size:        size,
	}, nil
}

func (s *s3Storage) Delete(ctx context.Context, key string) error {
	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return fmt.Errorf("delete object: %w", err)
	}
	return nil
}

func isNotFound(err error) bool {
	var apiErr smithy.APIError
	if errors.As(err, &apiErr) {
		return apiErr.ErrorCode() == "NoSuchKey" || apiErr.ErrorCode() == "NotFound"
	}
	return false
}
