package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"link-do-backend/internal/repository"
)

var (
	ErrMcpInvalidToken     = errors.New("invalid or expired token")
	ErrMcpInvalidCode      = errors.New("invalid or expired authorization code")
	ErrMcpClientNotFound   = errors.New("client not found")
	ErrMcpClientMismatch   = errors.New("client mismatch")
	ErrMcpRedirectMismatch = errors.New("redirect_uri mismatch")
)

type McpTokenData struct {
	Token       string
	ClientID    string
	UserID      uint
	UserUUID    string
	Scopes      []string
	ExpiresAt   time.Time
	CreatedAt   time.Time
	LinkdoToken string
}

type McpCodeData struct {
	Code          string
	ClientID      string
	RedirectURI   string
	State         string
	Scopes        []string
	CodeChallenge string
	UserID        uint
	UserUUID      string
	LinkdoToken   string
	ExpiresAt     time.Time
	CreatedAt     time.Time
}

type McpOAuthService struct {
	userRepo *repository.UserRepository
	redisSvc *RedisService
	jwtSvc   *JWTService
}

func NewMcpOAuthService(userRepo *repository.UserRepository, redisSvc *RedisService, jwtSvc *JWTService) *McpOAuthService {
	return &McpOAuthService{
		userRepo: userRepo,
		redisSvc: redisSvc,
		jwtSvc:   jwtSvc,
	}
}

// GenerateCode issues an authorization code after validating the Link-Do token.
func (s *McpOAuthService) GenerateCode(ctx context.Context, params struct {
	ClientID      string
	RedirectURI   string
	State         string
	Scopes        []string
	CodeChallenge string
	LinkdoToken   string
}) (string, error) {
	// Validate the Link-Do token
	userUUID, err := s.validateLinkdoToken(ctx, params.LinkdoToken)
	if err != nil {
		return "", fmt.Errorf("invalid linkdo token: %w", err)
	}

	// Get user by UUID
	user, err := s.userRepo.GetByUUID(userUUID)
	if err != nil {
		return "", fmt.Errorf("user not found: %w", err)
	}

	code := generateSecureToken(16)
	data := McpCodeData{
		Code:          code,
		ClientID:      params.ClientID,
		RedirectURI:   params.RedirectURI,
		State:         params.State,
		Scopes:        params.Scopes,
		CodeChallenge: params.CodeChallenge,
		UserID:        user.ID,
		UserUUID:      user.UUID,
		LinkdoToken:   params.LinkdoToken,
		ExpiresAt:     time.Now().Add(10 * time.Minute),
		CreatedAt:     time.Now(),
	}

	key := fmt.Sprintf("mcp:code:%s", code)
	if err := s.redisSvc.SetJSON(ctx, key, data, 10*time.Minute); err != nil {
		return "", err
	}
	return code, nil
}

// ExchangeCode exchanges an authorization code for an MCP access token.
func (s *McpOAuthService) ExchangeCode(ctx context.Context, params struct {
	Code        string
	ClientID    string
	RedirectURI string
}) (*McpTokenData, error) {
	key := fmt.Sprintf("mcp:code:%s", params.Code)
	var codeData McpCodeData
	if err := s.redisSvc.GetJSON(ctx, key, &codeData); err != nil {
		return nil, ErrMcpInvalidCode
	}
	if time.Now().After(codeData.ExpiresAt) {
		s.redisSvc.Del(ctx, key)
		return nil, ErrMcpInvalidCode
	}

	if params.ClientID != "" && codeData.ClientID != "" && codeData.ClientID != params.ClientID {
		return nil, ErrMcpClientMismatch
	}
	if params.RedirectURI != "" && codeData.RedirectURI != "" && codeData.RedirectURI != params.RedirectURI {
		return nil, ErrMcpRedirectMismatch
	}

	// Delete the code (one-time use)
	s.redisSvc.Del(ctx, key)

	// Generate MCP access token
	mcpToken := generateSecureToken(32)
	tokenData := McpTokenData{
		Token:       mcpToken,
		ClientID:    codeData.ClientID,
		UserID:      codeData.UserID,
		UserUUID:    codeData.UserUUID,
		Scopes:      codeData.Scopes,
		ExpiresAt:   time.Now().Add(1 * time.Hour),
		CreatedAt:   time.Now(),
		LinkdoToken: codeData.LinkdoToken,
	}

	tokenKey := fmt.Sprintf("mcp:token:%s", mcpToken)
	if err := s.redisSvc.SetJSON(ctx, tokenKey, tokenData, 1*time.Hour); err != nil {
		return nil, err
	}
	return &tokenData, nil
}

// VerifyToken verifies an MCP access token and returns the token data.
func (s *McpOAuthService) VerifyToken(ctx context.Context, mcpToken string) (*McpTokenData, error) {
	key := fmt.Sprintf("mcp:token:%s", mcpToken)
	var data McpTokenData
	if err := s.redisSvc.GetJSON(ctx, key, &data); err != nil {
		return nil, ErrMcpInvalidToken
	}
	if time.Now().After(data.ExpiresAt) {
		s.redisSvc.Del(ctx, key)
		return nil, ErrMcpInvalidToken
	}
	return &data, nil
}

// validateLinkdoToken validates a Link-Do token (JWT or UUID) directly against the database.
func (s *McpOAuthService) validateLinkdoToken(ctx context.Context, token string) (string, error) {
	// Try UUID token first (legacy Notion OAuth)
	user, err := s.userRepo.GetByUUID(token)
	if err == nil && user != nil {
		return user.UUID, nil
	}

	// Try JWT validation
	if s.jwtSvc != nil {
		claims, jwtErr := s.jwtSvc.ValidateToken(token)
		if jwtErr == nil && claims.Email != "" {
			userByEmail, err2 := s.userRepo.GetByEmail(claims.Email)
			if err2 == nil && userByEmail != nil {
				return userByEmail.UUID, nil
			}
		}
	}

	return "", ErrMcpInvalidToken
}

func generateSecureToken(n int) string {
	bytes := make([]byte, n)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

func generateMcpToken() string {
	bytes := make([]byte, 32)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}
