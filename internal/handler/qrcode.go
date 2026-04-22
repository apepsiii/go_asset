package handler

import (
	"encoding/base64"
	"net/http"

	"github.com/labstack/echo/v5"
	"github.com/skip2/go-qrcode"
)

type QRCodeHandler struct{}

func NewQRCodeHandler() *QRCodeHandler {
	return &QRCodeHandler{}
}

func (h *QRCodeHandler) Generate(c *echo.Context) error {
	assetID := c.Param("id")

	qrURL := "http://localhost:5173/public/asset/" + assetID

	png, err := qrcode.Encode(qrURL, qrcode.Medium, 256)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	base64Str := base64.StdEncoding.EncodeToString(png)

	return c.JSON(http.StatusOK, map[string]string{
		"qr_code": "data:image/png;base64," + base64Str,
		"url":     qrURL,
	})
}
