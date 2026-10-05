package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/fuel-planner/backend/internal/auth"
	"github.com/fuel-planner/backend/internal/httputil"
)

type contextKey string

const UserIDKey contextKey = "userID"

func Authenticate(tokens *auth.TokenService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if header == "" {
				httputil.Error(w, http.StatusUnauthorized, "missing authorization header")
				return
			}
			parts := strings.SplitN(header, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "bearer") {
				httputil.Error(w, http.StatusUnauthorized, "invalid authorization header")
				return
			}
			claims, err := tokens.ParseAccessToken(parts[1])
			if err != nil {
				httputil.Error(w, http.StatusUnauthorized, "invalid or expired token")
				return
			}
			ctx := context.WithValue(r.Context(), UserIDKey, claims.UserID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func UserIDFromContext(ctx context.Context) (string, bool) {
	v, ok := ctx.Value(UserIDKey).(string)
	return v, ok
}
