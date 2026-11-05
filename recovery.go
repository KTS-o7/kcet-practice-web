package main

import (
	"crypto/rand"
	"errors"
	"log"
	"math/big"
	"net/http"
	"strconv"
	"strings"
	"time"
	"unicode"

	"golang.org/x/crypto/bcrypt"
)

// Recovery codes: the only way back into an account without email. 12 characters from an alphabet
// without look-alikes (no 0/O, 1/I/L), shown as XXXX-XXXX-XXXX (about 59 bits). Stored bcrypt-hashed.
// A code works once: resetting the password with it issues a fresh code.

const recoveryAlphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"

// newRecoveryCode returns the code to show (formatted) and its bcrypt hash to store.
func newRecoveryCode() (code, hash string, err error) {
	var b strings.Builder
	max := big.NewInt(int64(len(recoveryAlphabet)))
	for i := 0; i < 12; i++ {
		if i > 0 && i%4 == 0 {
			b.WriteByte('-')
		}
		n, err := rand.Int(rand.Reader, max)
		if err != nil {
			return "", "", err
		}
		b.WriteByte(recoveryAlphabet[n.Int64()])
	}
	code = b.String()
	h, err := bcrypt.GenerateFromPassword([]byte(normalizeRecovery(code)), bcrypt.DefaultCost)
	return code, string(h), err
}

// normalizeRecovery accepts the code however it was typed: any case, with or without dashes/spaces.
func normalizeRecovery(s string) string {
	var b strings.Builder
	for _, r := range strings.ToUpper(s) {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			b.WriteRune(r)
		}
	}
	return b.String()
}

func recoveryMatches(hash, typed string) bool {
	n := normalizeRecovery(typed)
	return hash != "" && len(n) == 12 && bcrypt.CompareHashAndPassword([]byte(hash), []byte(n)) == nil
}

// resetWithRecovery: POST /api/reset {username, code, password}. Not logged in. Same per-IP limit and
// per-account lockout as login, so codes can't be guessed. On success: new password, a fresh code
// (the used one is spent), every other device signed out, and this device logged in.
func (app *App) resetWithRecovery(w http.ResponseWriter, r *http.Request) {
	var in struct{ Username, Code, Password string }
	if err := readJSON(r, &in); err != nil {
		fail(w, 400, "bad request")
		return
	}
	ip := clientIP(r)
	if !app.auth.allowAttempt(ip) {
		fail(w, 429, "Too many tries. Wait 15 minutes.")
		return
	}
	in.Username = strings.TrimSpace(in.Username)
	if !usernameRE.MatchString(in.Username) {
		fail(w, 400, "Name should be 2–32 letters or numbers.")
		return
	}
	if len(in.Password) < 6 || len(in.Password) > 72 {
		fail(w, 400, "New password should be 6 to 72 characters.")
		return
	}
	if locked, left := app.auth.accountLocked(in.Username); locked {
		fail(w, 429, lockedMessage(left))
		return
	}
	acc, err := app.store.AccountByName(in.Username)
	if err != nil && !errors.Is(err, errNotFound) {
		fail(w, 500, "server error")
		return
	}
	if acc == nil || !recoveryMatches(acc.Recovery, in.Code) {
		app.auth.fail(ip)
		app.auth.accountFail(in.Username)
		time.Sleep(400 * time.Millisecond)
		fail(w, 401, "Name or recovery code isn't right.")
		return
	}
	code, recHash, err := newRecoveryCode()
	if err != nil {
		fail(w, 500, "server error")
		return
	}
	pwHash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		fail(w, 500, "server error")
		return
	}
	gen, err := app.store.ResetPassword(acc.ID, string(pwHash), recHash)
	if err != nil {
		log.Printf("reset: %v", err)
		fail(w, 500, "server error")
		return
	}
	app.auth.accountOK(in.Username)
	app.auth.issue(w, User{ID: acc.ID, Name: acc.Name, Gen: gen})
	out := app.me(acc.ID, acc.Name, nil)
	out["recovery_code"] = code
	writeJSON(w, 200, out)
}

// newOwnRecovery: POST /api/account/recovery {current}. A logged-in student makes a new code
// (accounts from before recovery codes have none). Needs the current password; the old code stops working.
func (app *App) newOwnRecovery(w http.ResponseWriter, r *http.Request, u User) {
	var in struct{ Current string }
	if err := readJSON(r, &in); err != nil {
		fail(w, 400, "bad request")
		return
	}
	ip := clientIP(r)
	if !app.auth.allowAttempt(ip) {
		fail(w, 429, "Too many tries. Wait 15 minutes.")
		return
	}
	acc, err := app.store.AccountByID(u.ID)
	if err != nil {
		fail(w, 500, "server error")
		return
	}
	if locked, left := app.auth.accountLocked(acc.Name); locked {
		fail(w, 429, lockedMessage(left))
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(acc.Hash), []byte(in.Current)) != nil {
		app.auth.fail(ip)
		app.auth.accountFail(acc.Name)
		time.Sleep(400 * time.Millisecond)
		fail(w, 403, "Current password isn't right.")
		return
	}
	code, recHash, err := newRecoveryCode()
	if err != nil {
		fail(w, 500, "server error")
		return
	}
	if err := app.store.SetRecovery(acc.ID, recHash); err != nil {
		fail(w, 500, "server error")
		return
	}
	writeJSON(w, 200, map[string]string{"recovery_code": code})
}

// adminNewRecovery: POST /api/admin/students/{id}/recovery. For a student who forgot their password
// and lost their code: the admin makes a new code and passes it on; the student uses "Forgot password?".
// Their old code stops working. It doesn't sign them out or change their password.
func (app *App) adminNewRecovery(w http.ResponseWriter, r *http.Request, admin User) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id <= 0 {
		http.NotFound(w, r)
		return
	}
	acc, err := app.store.AccountByID(id)
	if errors.Is(err, errNotFound) {
		fail(w, 404, "No such student.")
		return
	}
	if err != nil {
		fail(w, 500, "server error")
		return
	}
	code, recHash, err := newRecoveryCode()
	if err != nil {
		fail(w, 500, "server error")
		return
	}
	if err := app.store.SetRecovery(acc.ID, recHash); err != nil {
		fail(w, 500, "server error")
		return
	}
	log.Printf("admin %d made a new recovery code for account %d", admin.ID, acc.ID)
	writeJSON(w, 200, map[string]string{"name": acc.Name, "recovery_code": code})
}
