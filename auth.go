package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"fmt"
	"net"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"
)

const cookieName = "kcet_session"
const sessionTTL = 180 * 24 * time.Hour

type Auth struct {
	secret   []byte
	passcode string
	secure   bool

	mu       sync.Mutex
	failures map[string][]time.Time
}

type User struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

func (a *Auth) sign(payload string) string {
	m := hmac.New(sha256.New, a.secret)
	m.Write([]byte(payload))
	return base64.RawURLEncoding.EncodeToString(m.Sum(nil))
}

func (a *Auth) issue(w http.ResponseWriter, u User) {
	exp := time.Now().Add(sessionTTL).Unix()
	payload := fmt.Sprintf("%d|%s|%d", u.ID, base64.RawURLEncoding.EncodeToString([]byte(u.Name)), exp)
	http.SetCookie(w, &http.Cookie{
		Name: cookieName, Value: payload + "|" + a.sign(payload), Path: "/",
		HttpOnly: true, Secure: a.secure, SameSite: http.SameSiteLaxMode, Expires: time.Unix(exp, 0),
	})
}

func (a *Auth) clear(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{Name: cookieName, Value: "", Path: "/", MaxAge: -1, HttpOnly: true, Secure: a.secure})
}

func (a *Auth) user(r *http.Request) (User, bool) {
	c, err := r.Cookie(cookieName)
	if err != nil {
		return User{}, false
	}
	i := strings.LastIndexByte(c.Value, '|')
	if i < 0 {
		return User{}, false
	}
	payload, sig := c.Value[:i], c.Value[i+1:]
	if !hmac.Equal([]byte(sig), []byte(a.sign(payload))) {
		return User{}, false
	}
	parts := strings.Split(payload, "|")
	if len(parts) != 3 {
		return User{}, false
	}
	id, _ := strconv.ParseInt(parts[0], 10, 64)
	name, _ := base64.RawURLEncoding.DecodeString(parts[1])
	exp, _ := strconv.ParseInt(parts[2], 10, 64)
	if id == 0 || time.Now().Unix() > exp {
		return User{}, false
	}
	return User{id, string(name)}, true
}

func clientIP(r *http.Request) string {
	if ip := r.Header.Get("CF-Connecting-IP"); ip != "" {
		return ip
	}
	if ip := r.Header.Get("X-Real-IP"); ip != "" {
		return ip
	}
	h, _, _ := net.SplitHostPort(r.RemoteAddr)
	return h
}

// allowAttempt: at most 8 failed logins per IP per 15 minutes.
func (a *Auth) allowAttempt(ip string) bool {
	a.mu.Lock()
	defer a.mu.Unlock()
	cut := time.Now().Add(-15 * time.Minute)
	var keep []time.Time
	for _, t := range a.failures[ip] {
		if t.After(cut) {
			keep = append(keep, t)
		}
	}
	a.failures[ip] = keep
	return len(keep) < 8
}

func (a *Auth) fail(ip string) {
	a.mu.Lock()
	a.failures[ip] = append(a.failures[ip], time.Now())
	a.mu.Unlock()
}

func (a *Auth) checkPasscode(p string) bool {
	return subtle.ConstantTimeCompare([]byte(p), []byte(a.passcode)) == 1
}
