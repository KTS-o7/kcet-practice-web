package main

import (
	"log"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"
)

// Owner dashboard: read-only aggregates over every account. Only account IDs listed in
// KCET_ADMINS (comma-separated account ids) can call it; everyone else gets a plain 404.
// IDs, not usernames: anyone can sign up, so a listed name could be claimed by a stranger.
// Remove an ID from the list before ever deleting that account (SQLite can reuse the last id).

var ist = time.FixedZone("IST", 5*3600+30*60)

func parseAdmins(s string) map[int64]bool {
	out := map[int64]bool{}
	for _, part := range strings.Split(s, ",") {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		id, err := strconv.ParseInt(part, 10, 64)
		if err != nil || id <= 0 {
			log.Printf("KCET_ADMINS: ignoring %q (expected an account id)", part)
			continue
		}
		out[id] = true
	}
	return out
}

func (app *App) isAdmin(u User) bool { return app.admins[u.ID] }

func (app *App) adminOnly(h func(http.ResponseWriter, *http.Request, User)) http.HandlerFunc {
	return app.authed(func(w http.ResponseWriter, r *http.Request, u User) {
		if !app.isAdmin(u) {
			http.NotFound(w, r)
			return
		}
		h(w, r, u)
	})
}

func dayOf(ts int64) string { return time.Unix(ts, 0).In(ist).Format("2006-01-02") }

func dayStart(t time.Time) time.Time {
	y, m, d := t.In(ist).Date()
	return time.Date(y, m, d, 0, 0, 0, 0, ist)
}

type adminTotals struct {
	Signups  int `json:"signups"`
	Active   int `json:"active"`
	Tests    int `json:"tests"`
	Answered int `json:"answered"`
}

type adminDay struct {
	Day      string `json:"day"`
	Active   int    `json:"active"`
	Tests    int    `json:"tests"`
	Answered int    `json:"answered"`
	Signups  int    `json:"signups"`
}

type adminCohort struct {
	Week  string `json:"week"` // Monday, YYYY-MM-DD
	Size  int    `json:"size"`
	Weeks []*int `json:"weeks"` // % active in week 1..4 after sign-up; null until that week is over
}

type adminCount struct {
	Key      string `json:"key"`
	Started  int    `json:"started"`
	Finished int    `json:"finished"`
}

type adminChapter struct {
	Subject  string `json:"subject"`
	Chapter  string `json:"chapter"`
	Name     string `json:"name"`
	Answered int    `json:"answered"`
	Correct  int    `json:"correct"`
}

type adminSuspect struct {
	ID       string   `json:"id"`
	Subject  string   `json:"subject"`
	Chapter  string   `json:"chapter_name"`
	Source   string   `json:"source"`
	Stem     string   `json:"stem"`
	Options  []string `json:"options"`
	Accepted []int    `json:"accepted"`
	Picks    []int    `json:"picks"` // students per option
	Students int      `json:"students"`
	Top      int      `json:"top"` // most-picked wrong option
	Live     bool     `json:"live"`
}

type adminReport struct {
	ID        int64  `json:"id"`
	User      string `json:"user"`
	QID       string `json:"qid"`
	Subject   string `json:"subject"`
	Chapter   string `json:"chapter_name"`
	Note      string `json:"note"`
	CreatedAt int64  `json:"created_at"`
}

type adminStudent struct {
	ID         int64  `json:"id"`
	Name       string `json:"name"`
	Joined     int64  `json:"joined"`
	LastActive int64  `json:"last_active"`
	Tests      int    `json:"tests"`
	Answered   int    `json:"answered"`
	Score      int    `json:"score"` // sum over finished tests
	Total      int    `json:"total"`
}

const (
	suspectMinStudents = 8    // enough students to trust the pattern
	suspectMaxCorrect  = 0.25 // under a quarter match our key
	suspectMinTop      = 0.5  // and one other option draws at least half
	hardMinAnswers     = 30
)

func (app *App) adminOverview(w http.ResponseWriter, r *http.Request, _ User) {
	out, err := app.buildOverview(time.Now())
	if err != nil {
		log.Printf("admin overview: %v", err)
		fail(w, 500, "server error")
		return
	}
	writeJSON(w, 200, out)
}

func (app *App) buildOverview(now time.Time) (map[string]any, error) {
	db := app.store.db
	students := map[int64]*adminStudent{}
	order := []*adminStudent{}
	rows, err := db.Query(`SELECT id, username, created_at FROM users`)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		s := &adminStudent{}
		if err := rows.Scan(&s.ID, &s.Name, &s.Joined); err != nil {
			rows.Close()
			return nil, err
		}
		s.LastActive = s.Joined
		students[s.ID] = s
		order = append(order, s)
	}
	rows.Close()

	// Activity: each user's active days. A day counts if they started or finished a test,
	// or saved an answer (responses from before updated_at existed count on the test's start day).
	active := map[int64]map[string]bool{}
	touch := func(uid, ts int64) {
		if ts <= 0 {
			return
		}
		if active[uid] == nil {
			active[uid] = map[string]bool{}
		}
		active[uid][dayOf(ts)] = true
		if s := students[uid]; s != nil && ts > s.LastActive {
			s.LastActive = ts
		}
	}
	testsByDay := map[string]int{}
	answeredByDay := map[string]int{}
	signupsByDay := map[string]int{}
	for _, s := range order {
		signupsByDay[dayOf(s.Joined)]++
	}
	modes := map[string]*adminCount{}
	subjectsMix := map[string]*adminCount{}
	kinds := map[string]*adminCount{}
	bump := func(m map[string]*adminCount, k string, finished bool) {
		c := m[k]
		if c == nil {
			c = &adminCount{Key: k}
			m[k] = c
		}
		c.Started++
		if finished {
			c.Finished++
		}
	}

	rows, err = db.Query(`SELECT user_id, mode, subject, practice, started_at, submitted_at, score, total FROM attempts`)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var uid, started int64
		var mode, subject string
		var practice bool
		var submitted *int64
		var score *int
		var total int
		if err := rows.Scan(&uid, &mode, &subject, &practice, &started, &submitted, &score, &total); err != nil {
			rows.Close()
			return nil, err
		}
		touch(uid, started)
		done := submitted != nil
		bump(modes, mode, done)
		bump(subjectsMix, subject, done)
		kind := "timed"
		if practice {
			kind = "practice"
		}
		bump(kinds, kind, done)
		if done {
			touch(uid, *submitted)
			testsByDay[dayOf(*submitted)]++
			if s := students[uid]; s != nil {
				s.Tests++
				s.Total += total
				if score != nil {
					s.Score += *score
				}
			}
		}
	}
	rows.Close()

	rows, err = db.Query(`SELECT a.user_id, COALESCE(r.updated_at, a.started_at) FROM responses r
		JOIN attempts a ON a.id = r.attempt_id WHERE r.choice IS NOT NULL`)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var uid, ts int64
		if err := rows.Scan(&uid, &ts); err != nil {
			rows.Close()
			return nil, err
		}
		touch(uid, ts)
		answeredByDay[dayOf(ts)]++
		if s := students[uid]; s != nil {
			s.Answered++
		}
	}
	rows.Close()

	activeOn := func(day string) int {
		n := 0
		for _, days := range active {
			if days[day] {
				n++
			}
		}
		return n
	}

	// Last 30 days, oldest first.
	today := dayStart(now)
	days := []adminDay{}
	for i := 29; i >= 0; i-- {
		d := today.AddDate(0, 0, -i).Format("2006-01-02")
		days = append(days, adminDay{Day: d, Active: activeOn(d), Tests: testsByDay[d], Answered: answeredByDay[d], Signups: signupsByDay[d]})
	}
	sum := func(from int) adminTotals {
		t := adminTotals{}
		seen := map[int64]bool{}
		for _, d := range days[from:] {
			t.Signups += d.Signups
			t.Tests += d.Tests
			t.Answered += d.Answered
			for uid, ds := range active {
				if ds[d.Day] {
					seen[uid] = true
				}
			}
		}
		t.Active = len(seen)
		return t
	}

	// Retention by sign-up week (Monday start): share of each cohort active in weeks 1-4 after joining.
	cohorts := map[string][]*adminStudent{}
	for _, s := range order {
		j := dayStart(time.Unix(s.Joined, 0))
		monday := j.AddDate(0, 0, -((int(j.Weekday()) + 6) % 7))
		k := monday.Format("2006-01-02")
		cohorts[k] = append(cohorts[k], s)
	}
	weeks := make([]string, 0, len(cohorts))
	for k := range cohorts {
		weeks = append(weeks, k)
	}
	sort.Sort(sort.Reverse(sort.StringSlice(weeks)))
	if len(weeks) > 8 {
		weeks = weeks[:8]
	}
	retention := []adminCohort{}
	for _, k := range weeks {
		c := adminCohort{Week: k, Size: len(cohorts[k])}
		for wk := 1; wk <= 4; wk++ {
			eligible, hit := 0, 0
			for _, s := range cohorts[k] {
				start := dayStart(time.Unix(s.Joined, 0)).AddDate(0, 0, 7*wk)
				end := start.AddDate(0, 0, 7)
				if end.After(now) {
					continue // this student's week isn't over yet
				}
				eligible++
				for d := start; d.Before(end); d = d.AddDate(0, 0, 1) {
					if active[s.ID][d.Format("2006-01-02")] {
						hit++
						break
					}
				}
			}
			if eligible == 0 {
				c.Weeks = append(c.Weeks, nil)
				continue
			}
			p := hit * 100 / eligible
			c.Weeks = append(c.Weeks, &p)
		}
		retention = append(retention, c)
	}

	// Per-question picks: students per option (a student counts once per option),
	// plus raw answers for chapter difficulty. Finished tests only.
	type qstat struct{ picks [4]int }
	qs := map[string]*qstat{}
	chapters := map[string]*adminChapter{}
	rows, err = db.Query(`SELECT r.qid, r.choice, COUNT(DISTINCT a.user_id), COUNT(*) FROM responses r
		JOIN attempts a ON a.id = r.attempt_id
		WHERE a.submitted_at IS NOT NULL AND r.choice IS NOT NULL GROUP BY r.qid, r.choice`)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var qid string
		var choice, users, n int
		if err := rows.Scan(&qid, &choice, &users, &n); err != nil {
			rows.Close()
			return nil, err
		}
		q := app.corpus.Questions[qid]
		if q == nil || choice < 0 || choice > 3 {
			continue
		}
		st := qs[qid]
		if st == nil {
			st = &qstat{}
			qs[qid] = st
		}
		st.picks[choice] += users
		k := q.Subject + "/" + q.Chapter
		c := chapters[k]
		if c == nil {
			c = &adminChapter{Subject: q.Subject, Chapter: q.Chapter, Name: app.corpus.chapterLabel(q.Chapter)}
			chapters[k] = c
		}
		c.Answered += n
		if q.IsCorrect(choice) {
			c.Correct += n
		}
	}
	rows.Close()
	hardest := []*adminChapter{}
	for _, c := range chapters {
		if c.Answered >= hardMinAnswers {
			hardest = append(hardest, c)
		}
	}
	sort.Slice(hardest, func(i, j int) bool {
		return float64(hardest[i].Correct)/float64(hardest[i].Answered) < float64(hardest[j].Correct)/float64(hardest[j].Answered)
	})
	if len(hardest) > 10 {
		hardest = hardest[:10]
	}

	suspects := []adminSuspect{}
	for qid, st := range qs {
		q := app.corpus.Questions[qid]
		total, correct, top := 0, 0, -1
		for c, n := range st.picks {
			total += n
			if q.IsCorrect(c) {
				correct += n
			} else if top < 0 || n > st.picks[top] {
				top = c
			}
		}
		if total < suspectMinStudents || top < 0 {
			continue
		}
		if float64(correct)/float64(total) >= suspectMaxCorrect || float64(st.picks[top])/float64(total) < suspectMinTop {
			continue
		}
		label := q.Source.Name
		if q.Source.Number > 0 {
			label += " · Q" + strconv.Itoa(q.Source.Number)
		}
		suspects = append(suspects, adminSuspect{
			ID: q.ID, Subject: q.Subject, Chapter: app.corpus.chapterLabel(q.Chapter), Source: label,
			Stem: q.Stem, Options: q.Options, Accepted: q.Accepted, Picks: st.picks[:], Students: total, Top: top,
			Live: q.Status == "verified",
		})
	}
	sort.Slice(suspects, func(i, j int) bool { return suspects[i].Students > suspects[j].Students })

	reports := []adminReport{}
	rows, err = db.Query(`SELECT r.id, COALESCE(u.username, '?'), r.qid, r.note, r.created_at FROM reports r
		LEFT JOIN users u ON u.id = r.user_id ORDER BY r.created_at DESC LIMIT 100`)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var rp adminReport
		if err := rows.Scan(&rp.ID, &rp.User, &rp.QID, &rp.Note, &rp.CreatedAt); err != nil {
			rows.Close()
			return nil, err
		}
		if q := app.corpus.Questions[rp.QID]; q != nil {
			rp.Subject, rp.Chapter = q.Subject, app.corpus.chapterLabel(q.Chapter)
		}
		reports = append(reports, rp)
	}
	rows.Close()

	sort.Slice(order, func(i, j int) bool { return order[i].LastActive > order[j].LastActive })
	list := func(m map[string]*adminCount) []*adminCount {
		out := []*adminCount{}
		for _, c := range m {
			out = append(out, c)
		}
		sort.Slice(out, func(i, j int) bool { return out[i].Started > out[j].Started })
		return out
	}

	return map[string]any{
		"generated_at":   now.Unix(),
		"today":          sum(29),
		"week":           sum(23),
		"students_total": len(order),
		"days":           days,
		"retention":      retention,
		"modes":          list(modes),
		"subjects":       list(subjectsMix),
		"kinds":          list(kinds),
		"hardest":        hardest,
		"suspects":       suspects,
		"reports":        reports,
		"students":       order,
		"thresholds": map[string]any{
			"suspect_min_students": suspectMinStudents, "suspect_max_correct": suspectMaxCorrect,
			"suspect_min_top": suspectMinTop, "hard_min_answers": hardMinAnswers,
		},
	}, nil
}
