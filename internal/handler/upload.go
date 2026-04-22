package handler

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/labstack/echo/v5"
)

type UploadHandler struct{}

func NewUploadHandler() *UploadHandler {
	return &UploadHandler{}
}

func (h *UploadHandler) Upload(c *echo.Context) error {
	file, err := c.FormFile("photo")
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "no file uploaded"})
	}

	if err := os.MkdirAll("./uploads", os.ModePerm); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), sanitizeFilename(file.Filename[:len(file.Filename)-len(ext)]), ext)
	dst := filepath.Join("./uploads", filename)

	src, err := file.Open()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	defer src.Close()

	out, err := os.Create(dst)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	defer out.Close()

	if _, err := io.Copy(out, src); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{
		"url": "/uploads/" + filename,
	})
}

func sanitizeFilename(name string) string {
	if len(name) > 20 {
		name = name[:20]
	}
	return name
}
