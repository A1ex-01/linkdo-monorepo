package service

import (
	"context"
	"errors"
	"fmt"
	"link-do-backend/internal/config"
	"link-do-backend/internal/models"
	"link-do-backend/internal/notion"
	"link-do-backend/internal/repository"
	"link-do-backend/internal/utils"
	"math/rand"
	"regexp"
	"strings"
	"time"
)

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

var (
	ErrInvalidEmail    = errors.New("invalid email format")
	ErrRateLimited     = errors.New("请 60 秒后再试")
	ErrCodeExpired     = errors.New("验证码已过期")
	ErrCodeInvalidated = errors.New("验证码已失效，请重新发送")
	ErrInvalidCode     = errors.New("验证码错误")
)

type AuthService struct {
	userRepo *repository.UserRepository
	redisSvc *RedisService
	emailSvc *EmailService
	jwtSvc   *JWTService
}

func NewAuthService(userRepo *repository.UserRepository, redisSvc *RedisService, emailSvc *EmailService, jwtSvc *JWTService) *AuthService {
	return &AuthService{
		userRepo: userRepo,
		redisSvc: redisSvc,
		emailSvc: emailSvc,
		jwtSvc:   jwtSvc,
	}
}

func (s *AuthService) GetOAuthURL() string {
	cfg := config.Get()
	return fmt.Sprintf("https://api.notion.com/v1/oauth/authorize?client_id=%s&response_type=code&owner=user&redirect_uri=%s",
		cfg.NotionClientID,
		cfg.NotionRedirectURI,
	)
}

func (s *AuthService) HandleCallback(ctx context.Context, code string) (uuid string, name string, err error) {
	cfg := config.Get()
	tokenResp, err := notion.ExchangeCodeForToken(ctx, cfg.NotionClientID, cfg.NotionClientSecret, code, cfg.NotionRedirectURI)
	if err != nil {
		return "", "", err
	}
	var userId = ctx.Value("userID").(uint)

	user, err := s.userRepo.UpsertFromOAuth(
		tokenResp.Owner.User.ID,
		tokenResp.AccessToken,
		tokenResp.Owner.User.Name,
		nil,
		userId,
	)
	if err != nil {
		return "", "", err
	}
	return user.UUID, user.Name, nil
}

func (s *AuthService) GetUserByID(id uint) (*models.User, error) {
	return s.userRepo.GetByID(id)
}

func (s *AuthService) GetUserByUUID(uuid string) (*models.User, error) {
	return s.userRepo.GetByUUID(uuid)
}

func (s *AuthService) GetUserByEmail(email string) (*models.User, error) {
	return s.userRepo.GetByEmail(email)
}

func (s *AuthService) SendVerificationCode(ctx context.Context, email string) error {
	if !emailRegex.MatchString(email) {
		return ErrInvalidEmail
	}

	rateLimitKey := fmt.Sprintf("rate_limit:%s", email)
	exists, _ := s.redisSvc.Exists(ctx, rateLimitKey)
	if exists {
		return ErrRateLimited
	}

	code := generateVerificationCode()

	codeKey := fmt.Sprintf("code:%s", email)
	if err := s.redisSvc.Set(ctx, codeKey, code, 5*time.Minute); err != nil {
		return err
	}

	rateKey := fmt.Sprintf("rate:%s", email)
	if err := s.redisSvc.Set(ctx, rateKey, "1", 60*time.Second); err != nil {
		return err
	}

	return s.emailSvc.SendVerificationCode(email, code)
}

func (s *AuthService) VerifyCode(ctx context.Context, email, code string) (string, error) {
	if !emailRegex.MatchString(email) {
		return "", ErrInvalidEmail
	}

	codeKey := fmt.Sprintf("code:%s", email)
	storedCode, err := s.redisSvc.Get(ctx, codeKey)
	if err != nil {
		return "", ErrCodeExpired
	}

	errCountKey := fmt.Sprintf("err:%s", email)
	errCount, _ := s.redisSvc.Incr(ctx, errCountKey)
	if errCount == 1 {
		s.redisSvc.Expire(ctx, errCountKey, 10*time.Minute)
	}

	if errCount >= 3 {
		s.redisSvc.Del(ctx, codeKey)
		return "", ErrCodeInvalidated
	}

	if storedCode != code {
		return "", ErrInvalidCode
	}

	s.redisSvc.Del(ctx, codeKey, errCountKey)
	_, err = s.userRepo.GetByEmail(email)
	if err != nil {
		err = s.userRepo.Create(&models.User{
			UUID:  utils.NewUserUUID(),
			Email: email,
			Name:  extractNameFromEmail(email),
		})
		if err != nil {
			return "", err
		}
	}

	token, err := s.jwtSvc.GenerateToken(email)
	if err != nil {
		return "", err
	}

	return token, nil
}

func generateVerificationCode() string {
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	code := ""
	for i := 0; i < 6; i++ {
		code += fmt.Sprintf("%d", r.Intn(10))
	}
	return code
}

func generateUUID() string {
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	b := make([]byte, 16)
	r.Read(b)
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}

func extractNameFromEmail(email string) string {
	name := email[:strings.Index(email, "@")]
	return name
}
