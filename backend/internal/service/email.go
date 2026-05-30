package service

import (
	"fmt"
	"link-do-backend/internal/config"

	"gopkg.in/gomail.v2"
)

type EmailService struct {
	dialer *gomail.Dialer
	from   string
}

func NewEmailService() *EmailService {
	cfg := config.Get()
	dialer := gomail.NewDialer(
		cfg.SMTPHost,
		465,
		cfg.SMTPUsername,
		cfg.SMTPPassword,
	)
	dialer.SSL = true

	return &EmailService{
		dialer: dialer,
		from:   cfg.SMTPFrom,
	}
}

func (s *EmailService) SendVerificationCode(to, code string) error {
	m := gomail.NewMessage()
	m.SetAddressHeader("From", s.from, "Link-Do")
	m.SetHeader("To", to)
	m.SetHeader("Subject", "Link-Do 验证码")
	m.SetBody("text/html", s.buildEmailBody(code))

	return s.dialer.DialAndSend(m)
}

func (s *EmailService) buildEmailBody(code string) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 400px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h2 { color: #333; margin: 0 0 24px; font-size: 20px; }
    .code { font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 8px; text-align: center; margin: 24px 0; }
    p { color: #666; font-size: 14px; line-height: 1.6; margin: 8px 0; }
    .hint { color: #999; font-size: 12px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Link-Do 验证码</h2>
    <div class="code">%s</div>
    <p>您的验证码，有效期 5 分钟。</p>
    <p class="hint">如果您没有请求此验证码，请忽略此邮件。</p>
  </div>
</body>
</html>`, code)
}
