package middleware

import (
	"net/http"
	"net/http/httptest"
	"os"

	clerk "github.com/clerk/clerk-sdk-go/v2"
	clerkhttp "github.com/clerk/clerk-sdk-go/v2/http"
	"github.com/labstack/echo/v5"
)

const (
	ContextKeyUserID    = "user_id"
	ContextKeySessionID = "session_id"
)

func ClerkAuth() echo.MiddlewareFunc {
	requireAuth := clerkhttp.RequireHeaderAuthorization()

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c *echo.Context) error {
			var claims *clerk.SessionClaims

			inner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if sc, ok := clerk.SessionClaimsFromContext(r.Context()); ok {
					claims = sc
				}
			})

			rec := httptest.NewRecorder()
			requireAuth(inner).ServeHTTP(rec, c.Request())

			allowUnauth := os.Getenv("ALLOW_UNAUTHENTICATED") == "1"

			if claims == nil && !allowUnauth {
				return c.JSON(http.StatusUnauthorized, map[string]string{
					"error":   "unauthorized",
					"message": "valid Clerk session token required",
				})
			}

			if claims != nil {
				c.Set(ContextKeyUserID, claims.Subject)
				c.Set(ContextKeySessionID, claims.SessionID)
			} else {
				c.Set(ContextKeyUserID, "anonymous")
				c.Set(ContextKeySessionID, "anonymous")
			}

			return next(c)
		}
	}
}

func GetUserID(c *echo.Context) string {
	id, _ := c.Get(ContextKeyUserID).(string)
	return id
}

func GetSessionID(c *echo.Context) string {
	id, _ := c.Get(ContextKeySessionID).(string)
	return id
}
