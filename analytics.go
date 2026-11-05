package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strconv"
	"strings"
)

// Usage analytics (PostHog, EU cloud).
//
// The browser sends events to /ingest on this site, and this server forwards them to PostHog, so
// ad-blockers don't drop them and no nginx change is needed. Our session cookie is never forwarded.
//
// Logged-out visitors are tracked with PostHog's cookie. A logged-in student is tracked only if they
// allowed it (users.analytics_consent = 1). They're then identified by analyticsID: a keyed hash of
// their account id that can't be turned back into the id (or their name) without the server secret.

func (app *App) analyticsID(id int64) string {
	m := hmac.New(sha256.New, app.auth.secret)
	m.Write([]byte("posthog|" + strconv.FormatInt(id, 10)))
	return "s_" + hex.EncodeToString(m.Sum(nil))[:20]
}

func posthogProxy() http.Handler {
	api := &url.URL{Scheme: "https", Host: "eu.i.posthog.com"}
	assets := &url.URL{Scheme: "https", Host: "eu-assets.i.posthog.com"}
	rp := &httputil.ReverseProxy{
		Rewrite: func(pr *httputil.ProxyRequest) {
			p := strings.TrimPrefix(pr.In.URL.Path, "/ingest")
			if p == "" {
				p = "/"
			}
			target := api
			if strings.HasPrefix(p, "/static/") || strings.HasPrefix(p, "/array/") {
				target = assets
			}
			pr.SetURL(target)
			pr.Out.URL.Path, pr.Out.URL.RawPath = p, ""
			pr.Out.Host = target.Host
			pr.Out.Header.Del("Cookie") // never our session cookie
			pr.Out.Header.Del("Authorization")
			pr.Out.Header.Set("X-Forwarded-For", clientIP(pr.In)) // so visitors are told apart
		},
		ModifyResponse: func(r *http.Response) error {
			r.Header.Del("Set-Cookie")
			return nil
		},
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		r.Body = http.MaxBytesReader(w, r.Body, 5<<20)
		rp.ServeHTTP(w, r)
	})
}

// setAnalytics: POST /api/account/analytics {allow}. The student's own choice, changeable any time.
func (app *App) setAnalytics(w http.ResponseWriter, r *http.Request, u User) {
	var in struct{ Allow bool }
	if err := readJSON(r, &in); err != nil {
		fail(w, 400, "bad request")
		return
	}
	if err := app.store.SetAnalyticsConsent(u.ID, in.Allow); err != nil {
		fail(w, 500, "server error")
		return
	}
	writeJSON(w, 200, map[string]bool{"ok": true})
}

// me is the "who am I" answer shared by /api/me, login, sign-up and reset. Pass acc if it's already
// loaded; otherwise it's read from the database.
func (app *App) me(id int64, name string, acc *Account) map[string]any {
	if acc == nil {
		acc, _ = app.store.AccountByID(id)
	}
	out := map[string]any{"id": id, "name": name, "admin": app.admins[id], "has_recovery": false,
		"analytics": nil, "analytics_id": app.analyticsID(id)}
	if acc != nil {
		out["has_recovery"] = acc.Recovery != ""
		out["analytics"] = acc.Consent
	}
	return out
}
