package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/fuel-planner/backend/internal/httputil"
	"github.com/fuel-planner/backend/internal/users"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	db     *pgxpool.Pool
	users  *users.Repository
	tokens *TokenService
}

func NewHandler(db *pgxpool.Pool, tokens *TokenService) *Handler {
	return &Handler{db: db, users: users.NewRepository(db), tokens: tokens}
}

type registerRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	DisplayName string `json:"display_name"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type refreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

type tokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
	TokenType    string `json:"token_type"`
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.Error(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" || len(req.Password) < 8 {
		httputil.Error(w, http.StatusBadRequest, "email and password (min 8 chars) required")
		return
	}

	hash, err := HashPassword(req.Password)
	if err != nil {
		httputil.Error(w, http.StatusInternalServerError, "could not hash password")
		return
	}

	user, err := h.users.Create(r.Context(), req.Email, hash, req.DisplayName)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate") {
			httputil.Error(w, http.StatusConflict, "email already registered")
			return
		}
		httputil.Error(w, http.StatusInternalServerError, "could not create user")
		return
	}

	h.issueTokens(w, r.Context(), user.ID)
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.Error(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	user, err := h.users.GetByEmail(r.Context(), req.Email)
	if err != nil {
		httputil.Error(w, http.StatusUnauthorized, "invalid email or password")
		return
	}
	if CheckPassword(user.PasswordHash, req.Password) != nil {
		httputil.Error(w, http.StatusUnauthorized, "invalid email or password")
		return
	}

	h.issueTokens(w, r.Context(), user.ID)
}

func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	var req refreshRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.Error(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if req.RefreshToken == "" {
		httputil.Error(w, http.StatusBadRequest, "refresh_token required")
		return
	}

	hash := hashToken(req.RefreshToken)
	userID, err := h.validateRefreshToken(r.Context(), hash)
	if err != nil {
		httputil.Error(w, http.StatusUnauthorized, "invalid refresh token")
		return
	}

	// Rotate refresh token
	_ = h.revokeRefreshToken(r.Context(), hash)
	h.issueTokens(w, r.Context(), userID)
}

func (h *Handler) issueTokens(w http.ResponseWriter, ctx context.Context, userID string) {
	access, err := h.tokens.NewAccessToken(userID)
	if err != nil {
		httputil.Error(w, http.StatusInternalServerError, "could not issue access token")
		return
	}
	refresh, err := h.newRefreshToken(ctx, userID)
	if err != nil {
		httputil.Error(w, http.StatusInternalServerError, "could not issue refresh token")
		return
	}
	httputil.JSON(w, http.StatusOK, tokenResponse{
		AccessToken:  access,
		RefreshToken: refresh,
		ExpiresIn:    int64(h.tokens.AccessTTL().Seconds()),
		TokenType:    "Bearer",
	})
}

func (h *Handler) newRefreshToken(ctx context.Context, userID string) (string, error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}
	token := hex.EncodeToString(raw)
	hash := hashToken(token)
	expires := time.Now().Add(h.tokens.RefreshTTL())
	_, err := h.db.Exec(ctx, `
		INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
		VALUES ($1, $2, $3)
	`, userID, hash, expires)
	if err != nil {
		return "", err
	}
	return token, nil
}

func (h *Handler) validateRefreshToken(ctx context.Context, hash string) (string, error) {
	var userID string
	var expires time.Time
	err := h.db.QueryRow(ctx, `
		SELECT user_id, expires_at FROM refresh_tokens WHERE token_hash = $1
	`, hash).Scan(&userID, &expires)
	if err != nil || time.Now().After(expires) {
		return "", err
	}
	return userID, nil
}

func (h *Handler) revokeRefreshToken(ctx context.Context, hash string) error {
	_, err := h.db.Exec(ctx, `DELETE FROM refresh_tokens WHERE token_hash = $1`, hash)
	return err
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}
