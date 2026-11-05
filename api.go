package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"sort"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type App struct {
	corpus *Corpus
	store  *Store
	auth   *Auth
	admins map[int64]bool // account ids from KCET_ADMINS
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func fail(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func readJSON(r *http.Request, v any) error {
	r.Body = http.MaxBytesReader(nil, r.Body, 64<<10)
	return json.NewDecoder(r.Body).Decode(v)
}

func (app *App) authed(h func(http.ResponseWriter, *http.Request, User)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u, ok := app.session(w, r)
		if !ok {
			fail(w, http.StatusUnauthorized, "not logged in")
			return
		}
		h(w, r, u)
	}
}

// session returns the logged-in user. A cookie is only good while its account still exists and
// its session generation is current (a password change bumps it, signing out other devices).
func (app *App) session(w http.ResponseWriter, r *http.Request) (User, bool) {
	u, ok := app.auth.user(r)
	if !ok {
		return User{}, false
	}
	gen, err := app.store.SessionGen(u.ID)
	if err != nil || gen != u.Gen {
		if err != nil && !errors.Is(err, errNotFound) {
			log.Printf("session: %v", err)
			return User{}, false // database trouble: refuse, but keep the cookie
		}
		app.auth.clear(w)
		return User{}, false
	}
	return u, true
}

func (app *App) routes(mux *http.ServeMux) {
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, 200, map[string]any{"ok": true, "questions": len(app.corpus.Questions)})
	})
	mux.HandleFunc("POST /api/login", app.login)
	mux.HandleFunc("POST /api/signup", app.signup)
	mux.HandleFunc("POST /api/account/password", app.authed(app.changePassword))
	mux.HandleFunc("POST /api/logout", func(w http.ResponseWriter, r *http.Request) {
		app.auth.clear(w)
		writeJSON(w, 200, map[string]bool{"ok": true})
	})
	mux.HandleFunc("GET /api/me", app.authed(func(w http.ResponseWriter, r *http.Request, u User) {
		writeJSON(w, 200, map[string]any{"id": u.ID, "name": u.Name, "admin": app.isAdmin(u)})
	}))
	mux.HandleFunc("GET /api/meta", app.authed(app.meta))
	mux.HandleFunc("POST /api/attempts", app.authed(app.createAttempt))
	mux.HandleFunc("GET /api/attempts", app.authed(app.listAttempts))
	mux.HandleFunc("GET /api/attempts/{id}", app.authed(app.getAttempt))
	mux.HandleFunc("DELETE /api/attempts/{id}", app.authed(app.discardAttempt))
	mux.HandleFunc("PUT /api/attempts/{id}/responses/{qid}", app.authed(app.saveResponse))
	mux.HandleFunc("POST /api/attempts/{id}/reveal/{qid}", app.authed(app.reveal))
	mux.HandleFunc("POST /api/attempts/{id}/submit", app.authed(app.submit))
	mux.HandleFunc("GET /api/stats", app.authed(app.stats))
	mux.HandleFunc("POST /api/reports", app.authed(app.report))
	mux.HandleFunc("GET /api/admin/overview", app.adminOnly(app.adminOverview))
	mux.HandleFunc("GET /api/admin/students/{id}", app.adminOnly(app.adminStudent))
}

var usernameRE = regexp.MustCompile(`^[\p{L}\p{N} ._-]{2,32}$`)

type credentials struct{ Username, Password string }

func (app *App) readCreds(w http.ResponseWriter, r *http.Request) (credentials, string, bool) {
	var in credentials
	if err := readJSON(r, &in); err != nil {
		fail(w, 400, "bad request")
		return in, "", false
	}
	ip := clientIP(r)
	if !app.auth.allowAttempt(ip) {
		fail(w, 429, "Too many tries. Wait 15 minutes.")
		return in, ip, false
	}
	in.Username = strings.TrimSpace(in.Username)
	if !usernameRE.MatchString(in.Username) {
		fail(w, 400, "Name should be 2–32 letters or numbers.")
		return in, ip, false
	}
	return in, ip, true
}

func (app *App) signup(w http.ResponseWriter, r *http.Request) {
	in, ip, ok := app.readCreds(w, r)
	if !ok {
		return
	}
	if len(in.Password) < 6 || len(in.Password) > 72 {
		fail(w, 400, "Password should be at least 6 characters.")
		return
	}
	app.auth.fail(ip) // every sign-up counts toward the per-IP limit, so bots can't mass-create accounts
	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		fail(w, 500, "server error")
		return
	}
	id, err := app.store.CreateUser(in.Username, string(hash))
	if errors.Is(err, errUserExists) {
		fail(w, 409, "That name is taken. Log in instead, or pick another name.")
		return
	}
	if err != nil {
		log.Printf("signup: %v", err)
		fail(w, 500, "server error")
		return
	}
	u := User{ID: id, Name: in.Username}
	app.auth.issue(w, u)
	writeJSON(w, 201, u)
}

func (app *App) login(w http.ResponseWriter, r *http.Request) {
	in, ip, ok := app.readCreds(w, r)
	if !ok {
		return
	}
	acc, err := app.store.AccountByName(in.Username)
	if err != nil && !errors.Is(err, errNotFound) {
		fail(w, 500, "server error")
		return
	}
	if acc == nil || acc.Hash == "" || bcrypt.CompareHashAndPassword([]byte(acc.Hash), []byte(in.Password)) != nil {
		app.auth.fail(ip)
		time.Sleep(400 * time.Millisecond)
		fail(w, 401, "Name or password isn't right.")
		return
	}
	u := User{ID: acc.ID, Name: acc.Name, Gen: acc.Gen}
	app.auth.issue(w, u)
	writeJSON(w, 200, u)
}

// changePassword needs the current password. It signs out every other device (new session
// generation) and re-issues this device's cookie so it stays logged in.
func (app *App) changePassword(w http.ResponseWriter, r *http.Request, u User) {
	var in struct{ Current, Password string }
	if err := readJSON(r, &in); err != nil {
		fail(w, 400, "bad request")
		return
	}
	ip := clientIP(r)
	if !app.auth.allowAttempt(ip) {
		fail(w, 429, "Too many tries. Wait 15 minutes.")
		return
	}
	if len(in.Password) < 6 || len(in.Password) > 72 {
		fail(w, 400, "New password should be 6 to 72 characters.")
		return
	}
	acc, err := app.store.AccountByID(u.ID)
	if err != nil {
		fail(w, 500, "server error")
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(acc.Hash), []byte(in.Current)) != nil {
		app.auth.fail(ip)
		time.Sleep(400 * time.Millisecond)
		fail(w, 403, "Current password isn't right.") // 403, not 401: the session is fine
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		fail(w, 500, "server error")
		return
	}
	gen, err := app.store.SetPassword(u.ID, string(hash))
	if err != nil {
		log.Printf("change password: %v", err)
		fail(w, 500, "server error")
		return
	}
	app.auth.issue(w, User{ID: acc.ID, Name: acc.Name, Gen: gen})
	writeJSON(w, 200, map[string]bool{"ok": true})
}

func (app *App) meta(w http.ResponseWriter, r *http.Request, u User) {
	type chapterMeta struct {
		Chapter
		Count     int `json:"count"`
		PYQ       int `json:"pyq"`
		OutOfSyll int `json:"out_of_syllabus"`
	}
	type subjectMeta struct {
		ID       string        `json:"id"`
		Count    int           `json:"count"`
		PYQ      int           `json:"pyq"`
		Chapters []chapterMeta `json:"chapters"`
	}
	var out []subjectMeta
	for _, s := range subjects {
		counts := map[string]*chapterMeta{}
		sm := subjectMeta{ID: s, Chapters: []chapterMeta{}}
		var order []string
		for _, ch := range app.corpus.Chapters[s] {
			counts[ch.ID] = &chapterMeta{Chapter: ch}
			order = append(order, ch.ID)
		}
		for _, q := range app.corpus.BySubject[s] {
			cm := counts[q.Chapter]
			if cm == nil {
				cm = &chapterMeta{Chapter: Chapter{ID: q.Chapter, Name: app.corpus.chapterLabel(q.Chapter)}}
				counts[q.Chapter] = cm
				order = append(order, q.Chapter)
			}
			if !q.InSyllabus {
				cm.OutOfSyll++
			} else {
				cm.Count++
				sm.Count++
			}
			if q.Source.Type == "pyq" {
				cm.PYQ++
				sm.PYQ++
			}
		}
		for _, id := range order {
			if c := counts[id]; c.Count+c.OutOfSyll > 0 {
				sm.Chapters = append(sm.Chapters, *c)
			}
		}
		out = append(out, sm)
	}
	papers := app.corpus.Papers
	if papers == nil {
		papers = []Paper{}
	}
	writeJSON(w, 200, map[string]any{"subjects": out, "papers": papers, "flagged": app.corpus.Flagged})
}

func newID() string {
	b := make([]byte, 9)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func (app *App) history(userID int64) (pickHistory, error) {
	h := pickHistory{wrong: map[string]bool{}}
	seen, err := app.store.SeenInAttempts(userID)
	if err != nil {
		return h, err
	}
	h.seen = seen
	rows, err := app.store.History(userID)
	if err != nil {
		return h, err
	}
	for _, r := range rows { // ordered by time; last answer wins
		q := app.corpus.Questions[r.QID]
		h.wrong[r.QID] = q == nil || r.Choice == nil || !q.IsCorrect(*r.Choice)
	}
	return h, nil
}

var subjectName = map[string]string{"physics": "Physics", "chemistry": "Chemistry", "mathematics": "Mathematics", "all": "Full KCET"}

func (app *App) createAttempt(w http.ResponseWriter, r *http.Request, u User) {
	var in struct {
		Mode       string   `json:"mode"` // mock | full | quick | chapter | year
		Subject    string   `json:"subject"`
		Count      int      `json:"count"`
		Chapters   []string `json:"chapters"`
		Paper      string   `json:"paper"`
		Practice   bool     `json:"practice"`
		Timed      bool     `json:"timed"`
		IncludeOOS bool     `json:"include_oos"`
	}
	if err := readJSON(r, &in); err != nil {
		fail(w, 400, "bad request")
		return
	}
	h, err := app.history(u.ID)
	if err != nil {
		fail(w, 500, "server error")
		return
	}
	validSubject := in.Subject == "physics" || in.Subject == "chemistry" || in.Subject == "mathematics"
	if in.Count < 1 || in.Count > 180 {
		in.Count = 20
	}
	chapters := map[string]bool{}
	for _, c := range in.Chapters {
		chapters[c] = true
	}
	var qs []*Question
	var title string
	duration := 0
	switch in.Mode {
	case "mock":
		if !validSubject {
			fail(w, 400, "pick a subject")
			return
		}
		qs = pickMock(app.corpus, in.Subject, 60, in.IncludeOOS, h)
		title, duration = subjectName[in.Subject]+" mock", 70*60 // KCET: 80 min paper, first 10 for OMR details, 70 to answer
	case "full":
		in.Subject = "all"
		for _, s := range subjects {
			qs = append(qs, pickMock(app.corpus, s, 60, in.IncludeOOS, h)...)
		}
		title, duration = "Full KCET mock", 3*70*60
	case "quick", "chapter":
		if !validSubject {
			fail(w, 400, "pick a subject")
			return
		}
		if in.Mode == "chapter" && len(chapters) == 0 {
			fail(w, 400, "pick at least one chapter")
			return
		}
		qs = pickRandom(app.corpus, in.Subject, chapters, in.Count, in.IncludeOOS, h)
		title = fmt.Sprintf("%s · %d question%s", subjectName[in.Subject], len(qs), map[bool]string{true: "", false: "s"}[len(qs) == 1])
		if in.Mode == "chapter" {
			names := []string{}
			for _, c := range in.Chapters {
				names = append(names, app.corpus.chapterLabel(c))
			}
			sort.Strings(names)
			title = strings.Join(names, ", ")
			if len(names) > 2 {
				title = fmt.Sprintf("%s +%d more", names[0], len(names)-1)
			}
		}
		if in.Timed || in.Mode == "quick" && !in.Practice {
			duration = len(qs) * 60
		}
	case "year":
		for _, p := range app.corpus.Papers {
			if p.ID == in.Paper {
				in.Subject = p.Subject
				for _, id := range p.QuestionIDs {
					qs = append(qs, app.corpus.Questions[id])
				}
				title = fmt.Sprintf("%s %s", p.Name, subjectName[p.Subject])
			}
		}
		if qs == nil {
			fail(w, 404, "paper not found")
			return
		}
		if !in.Practice || in.Timed {
			duration = 70 * 60 * len(qs) / 60
		}
	default:
		fail(w, 400, "unknown mode")
		return
	}
	if len(qs) == 0 {
		fail(w, 409, "No questions available for that yet.")
		return
	}
	if in.Mode == "mock" || in.Mode == "full" {
		if in.Practice && !in.Timed {
			duration = 0
		}
	}
	a := &Attempt{ID: newID(), UserID: u.ID, Subject: in.Subject, Mode: in.Mode, Practice: in.Practice, Title: title,
		DurationS: duration, StartedAt: time.Now().Unix(), Total: len(qs)}
	for _, q := range qs {
		a.QuestionIDs = append(a.QuestionIDs, q.ID)
	}
	if err := app.store.CreateAttempt(a); err != nil {
		log.Printf("create attempt: %v", err)
		fail(w, 500, "server error")
		return
	}
	writeJSON(w, 201, map[string]string{"id": a.ID})
}

type reviewItem struct {
	QID      string `json:"qid"`
	Answer   int    `json:"answer"`
	Accepted []int  `json:"accepted"`
	Correct  bool   `json:"correct"`
}

func (app *App) loadAttempt(w http.ResponseWriter, r *http.Request, u User) (*Attempt, bool) {
	a, err := app.store.GetAttempt(r.PathValue("id"), u.ID)
	if errors.Is(err, errNotFound) {
		fail(w, 404, "not found")
		return nil, false
	}
	if err != nil {
		fail(w, 500, "server error")
		return nil, false
	}
	if a.SubmittedAt == nil && a.Expired(time.Now().Unix()) {
		if err := app.finish(a); err != nil {
			fail(w, 500, "server error")
			return nil, false
		}
	}
	return a, true
}

func (app *App) finish(a *Attempt) error {
	resp, err := app.store.Responses(a.ID)
	if err != nil {
		return err
	}
	score := 0
	for _, id := range a.QuestionIDs {
		if q, rr := app.corpus.Questions[id], resp[id]; q != nil && rr != nil && rr.Choice != nil && q.IsCorrect(*rr.Choice) {
			score++
		}
	}
	at := time.Now().Unix()
	if a.DurationS > 0 && at > a.Deadline() {
		at = a.Deadline()
	}
	if err := app.store.Submit(a.ID, score, at); err != nil {
		return err
	}
	a.SubmittedAt, a.Score = &at, &score
	return nil
}

func (app *App) getAttempt(w http.ResponseWriter, r *http.Request, u User) {
	a, ok := app.loadAttempt(w, r, u)
	if !ok {
		return
	}
	resp, err := app.store.Responses(a.ID)
	if err != nil {
		fail(w, 500, "server error")
		return
	}
	qs := []PublicQuestion{}
	responses := []Response{}
	reviews := map[string]reviewItem{}
	for _, id := range a.QuestionIDs {
		q := app.corpus.Questions[id]
		if q == nil { // question removed from corpus since; skip it
			continue
		}
		qs = append(qs, app.corpus.Public(q))
		rr := resp[id]
		if rr != nil {
			responses = append(responses, *rr)
		}
		if a.SubmittedAt != nil || (rr != nil && rr.Revealed) {
			reviews[id] = reviewItem{id, q.Answer, q.Accepted, rr != nil && rr.Choice != nil && q.IsCorrect(*rr.Choice)}
		}
	}
	writeJSON(w, 200, map[string]any{
		"attempt": a, "questions": qs, "responses": responses, "review": reviews,
		"deadline": a.Deadline(), "now": time.Now().Unix(),
	})
}

func (app *App) discardAttempt(w http.ResponseWriter, r *http.Request, u User) {
	if err := app.store.DeleteUnsubmitted(r.PathValue("id"), u.ID); err != nil {
		fail(w, 500, "server error")
		return
	}
	writeJSON(w, 200, map[string]bool{"ok": true})
}

func (app *App) listAttempts(w http.ResponseWriter, r *http.Request, u User) {
	list, err := app.store.ListAttempts(u.ID, 200)
	if err != nil {
		fail(w, 500, "server error")
		return
	}
	now := time.Now().Unix()
	out := []*Attempt{}
	for _, a := range list {
		if a.SubmittedAt == nil && a.Expired(now) {
			_ = app.finish(a)
		}
		out = append(out, a)
	}
	writeJSON(w, 200, out)
}

func inAttempt(a *Attempt, qid string) bool {
	for _, id := range a.QuestionIDs {
		if id == qid {
			return true
		}
	}
	return false
}

func (app *App) saveResponse(w http.ResponseWriter, r *http.Request, u User) {
	a, ok := app.loadAttempt(w, r, u)
	if !ok {
		return
	}
	if a.SubmittedAt != nil {
		fail(w, 409, "This test is already submitted.")
		return
	}
	qid := r.PathValue("qid")
	if !inAttempt(a, qid) {
		fail(w, 404, "not in this test")
		return
	}
	var in struct {
		Choice *int  `json:"choice"`
		Marked bool  `json:"marked"`
		TimeMS int64 `json:"time_ms"`
	}
	if err := readJSON(r, &in); err != nil || (in.Choice != nil && (*in.Choice < 0 || *in.Choice > 3)) {
		fail(w, 400, "bad request")
		return
	}
	if err := app.store.SaveResponse(a.ID, &Response{QID: qid, Choice: in.Choice, Marked: in.Marked, TimeMS: in.TimeMS}); err != nil {
		fail(w, 500, "server error")
		return
	}
	writeJSON(w, 200, map[string]bool{"ok": true})
}

func (app *App) reveal(w http.ResponseWriter, r *http.Request, u User) {
	a, ok := app.loadAttempt(w, r, u)
	if !ok {
		return
	}
	qid := r.PathValue("qid")
	if !a.Practice || a.SubmittedAt != nil || !inAttempt(a, qid) {
		fail(w, 409, "not allowed")
		return
	}
	var in struct {
		Choice int   `json:"choice"`
		TimeMS int64 `json:"time_ms"`
	}
	if err := readJSON(r, &in); err != nil || in.Choice < 0 || in.Choice > 3 {
		fail(w, 400, "bad request")
		return
	}
	resp, _ := app.store.Responses(a.ID)
	choice := in.Choice
	if prev := resp[qid]; prev != nil && prev.Revealed && prev.Choice != nil {
		choice = *prev.Choice // first answer sticks
	}
	marked := resp[qid] != nil && resp[qid].Marked
	if err := app.store.SaveResponse(a.ID, &Response{QID: qid, Choice: &choice, Marked: marked, TimeMS: in.TimeMS, Revealed: true}); err != nil {
		fail(w, 500, "server error")
		return
	}
	q := app.corpus.Questions[qid]
	writeJSON(w, 200, reviewItem{qid, q.Answer, q.Accepted, q.IsCorrect(choice)})
}

func (app *App) submit(w http.ResponseWriter, r *http.Request, u User) {
	a, ok := app.loadAttempt(w, r, u)
	if !ok {
		return
	}
	if a.SubmittedAt == nil {
		if err := app.finish(a); err != nil {
			fail(w, 500, "server error")
			return
		}
	}
	writeJSON(w, 200, a)
}

func (app *App) stats(w http.ResponseWriter, r *http.Request, u User) {
	out, err := app.statsFor(u.ID)
	if err != nil {
		fail(w, 500, "server error")
		return
	}
	writeJSON(w, 200, out)
}

// statsFor is one student's progress: per-subject and per-chapter accuracy, finished tests, daily activity.
func (app *App) statsFor(userID int64) (map[string]any, error) {
	rows, err := app.store.History(userID)
	if err != nil {
		return nil, err
	}
	type chStat struct {
		Subject  string `json:"subject"`
		Chapter  string `json:"chapter"`
		Name     string `json:"name"`
		Answered int    `json:"answered"`
		Correct  int    `json:"correct"`
		Skipped  int    `json:"skipped"`
		TimeMS   int64  `json:"time_ms"`
	}
	type subjStat struct {
		Answered int   `json:"answered"`
		Correct  int   `json:"correct"`
		Skipped  int   `json:"skipped"`
		Unique   int   `json:"unique"`
		TimeMS   int64 `json:"time_ms"`
	}
	chapters := map[string]*chStat{}
	subj := map[string]*subjStat{}
	uniq := map[string]bool{}
	for _, s := range subjects {
		subj[s] = &subjStat{}
	}
	days := map[string]int{}
	for _, h := range rows {
		q := app.corpus.Questions[h.QID]
		if q == nil {
			continue
		}
		key := q.Subject + "/" + q.Chapter
		c := chapters[key]
		if c == nil {
			c = &chStat{Subject: q.Subject, Chapter: q.Chapter, Name: app.corpus.chapterLabel(q.Chapter)}
			chapters[key] = c
		}
		s := subj[q.Subject]
		c.TimeMS += h.TimeMS
		s.TimeMS += h.TimeMS
		if !uniq[h.QID] {
			uniq[h.QID] = true
			s.Unique++
		}
		if h.Choice == nil {
			c.Skipped++
			s.Skipped++
			continue
		}
		c.Answered++
		s.Answered++
		days[time.Unix(h.Submitted, 0).Format("2006-01-02")]++
		if q.IsCorrect(*h.Choice) {
			c.Correct++
			s.Correct++
		}
	}
	chList := []*chStat{}
	for _, c := range chapters {
		chList = append(chList, c)
	}
	sort.Slice(chList, func(i, j int) bool { return chList[i].Subject+chList[i].Name < chList[j].Subject+chList[j].Name })
	attempts, err := app.store.ListAttempts(userID, 500)
	if err != nil {
		return nil, err
	}
	done := []*Attempt{}
	for _, a := range attempts {
		if a.SubmittedAt != nil {
			done = append(done, a)
		}
	}
	return map[string]any{"subjects": subj, "chapters": chList, "attempts": done, "days": days}, nil
}

func (app *App) report(w http.ResponseWriter, r *http.Request, u User) {
	var in struct{ QID, Note string }
	if err := readJSON(r, &in); err != nil || app.corpus.Questions[in.QID] == nil {
		fail(w, 400, "bad request")
		return
	}
	note := strings.TrimSpace(in.Note)
	if len(note) > 2000 {
		note = note[:2000]
	}
	if err := app.store.Report(u.ID, in.QID, note); err != nil {
		fail(w, 500, "server error")
		return
	}
	log.Printf("REPORT user=%s qid=%s note=%q", u.Name, in.QID, note)
	writeJSON(w, 200, map[string]bool{"ok": true})
}
