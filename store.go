package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"time"

	_ "modernc.org/sqlite"
)

const schema = `
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS attempts(
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  subject TEXT NOT NULL,
  mode TEXT NOT NULL,
  practice INTEGER NOT NULL,
  title TEXT NOT NULL,
  question_ids TEXT NOT NULL,
  duration_s INTEGER NOT NULL,
  started_at INTEGER NOT NULL,
  submitted_at INTEGER,
  score INTEGER,
  total INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS attempts_user ON attempts(user_id, started_at DESC);
CREATE TABLE IF NOT EXISTS responses(
  attempt_id TEXT NOT NULL REFERENCES attempts(id),
  qid TEXT NOT NULL,
  choice INTEGER,
  marked INTEGER NOT NULL DEFAULT 0,
  time_ms INTEGER NOT NULL DEFAULT 0,
  revealed INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(attempt_id, qid)
);
CREATE TABLE IF NOT EXISTS reports(
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  qid TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
`

type Store struct{ db *sql.DB }

func OpenStore(path string) (*Store, error) {
	db, err := sql.Open("sqlite", "file:"+path+"?_pragma=journal_mode(WAL)&_pragma=busy_timeout(5000)&_pragma=foreign_keys(1)&_pragma=synchronous(NORMAL)")
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)
	if _, err := db.Exec(schema); err != nil {
		return nil, err
	}
	// v2: per-user passwords (accounts created by the student himself)
	var n int
	_ = db.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('users') WHERE name = 'password_hash'`).Scan(&n)
	if n == 0 {
		if _, err := db.Exec(`ALTER TABLE users ADD COLUMN password_hash TEXT NOT NULL DEFAULT ''`); err != nil {
			return nil, err
		}
	}
	return &Store{db}, nil
}

var errUserExists = errors.New("user exists")

// CreateUser adds a new account; errUserExists if the name is taken (case-insensitive).
func (s *Store) CreateUser(name, hash string) (int64, error) {
	res, err := s.db.Exec(`INSERT INTO users(username, created_at, password_hash) VALUES(?, ?, ?) ON CONFLICT(username) DO NOTHING`, name, time.Now().Unix(), hash)
	if err != nil {
		return 0, err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return 0, errUserExists
	}
	return res.LastInsertId()
}

// UserByName returns id, stored name and password hash.
func (s *Store) UserByName(name string) (int64, string, string, error) {
	var id int64
	var stored, hash string
	err := s.db.QueryRow(`SELECT id, username, password_hash FROM users WHERE username = ?`, name).Scan(&id, &stored, &hash)
	if errors.Is(err, sql.ErrNoRows) {
		return 0, "", "", errNotFound
	}
	return id, stored, hash, err
}

type Attempt struct {
	ID          string   `json:"id"`
	UserID      int64    `json:"-"`
	Subject     string   `json:"subject"`
	Mode        string   `json:"mode"`
	Practice    bool     `json:"practice"`
	Title       string   `json:"title"`
	QuestionIDs []string `json:"-"`
	DurationS   int      `json:"duration_s"`
	StartedAt   int64    `json:"started_at"`
	SubmittedAt *int64   `json:"submitted_at"`
	Score       *int     `json:"score"`
	Total       int      `json:"total"`
	Answered    int      `json:"answered"`
}

func (a *Attempt) Deadline() int64 {
	if a.DurationS == 0 {
		return 0
	}
	return a.StartedAt + int64(a.DurationS)
}

func (a *Attempt) Expired(now int64) bool {
	return a.DurationS > 0 && now > a.Deadline()+10 // 10s grace for the final autosave
}

func (s *Store) CreateAttempt(a *Attempt) error {
	ids, _ := json.Marshal(a.QuestionIDs)
	_, err := s.db.Exec(`INSERT INTO attempts(id,user_id,subject,mode,practice,title,question_ids,duration_s,started_at,total)
		VALUES(?,?,?,?,?,?,?,?,?,?)`, a.ID, a.UserID, a.Subject, a.Mode, a.Practice, a.Title, string(ids), a.DurationS, a.StartedAt, a.Total)
	return err
}

const attemptCols = `id,user_id,subject,mode,practice,title,question_ids,duration_s,started_at,submitted_at,score,total,
  (SELECT COUNT(*) FROM responses r WHERE r.attempt_id = attempts.id AND r.choice IS NOT NULL)`

func scanAttempt(row interface{ Scan(...any) error }) (*Attempt, error) {
	var a Attempt
	var ids string
	if err := row.Scan(&a.ID, &a.UserID, &a.Subject, &a.Mode, &a.Practice, &a.Title, &ids, &a.DurationS, &a.StartedAt, &a.SubmittedAt, &a.Score, &a.Total, &a.Answered); err != nil {
		return nil, err
	}
	if err := json.Unmarshal([]byte(ids), &a.QuestionIDs); err != nil {
		return nil, err
	}
	return &a, nil
}

var errNotFound = errors.New("not found")

func (s *Store) GetAttempt(id string, userID int64) (*Attempt, error) {
	a, err := scanAttempt(s.db.QueryRow(`SELECT `+attemptCols+` FROM attempts WHERE id = ? AND user_id = ?`, id, userID))
	if errors.Is(err, sql.ErrNoRows) {
		return nil, errNotFound
	}
	return a, err
}

func (s *Store) ListAttempts(userID int64, limit int) ([]*Attempt, error) {
	rows, err := s.db.Query(`SELECT `+attemptCols+` FROM attempts WHERE user_id = ? ORDER BY started_at DESC LIMIT ?`, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*Attempt
	for rows.Next() {
		a, err := scanAttempt(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

type Response struct {
	QID      string `json:"qid"`
	Choice   *int   `json:"choice"`
	Marked   bool   `json:"marked"`
	TimeMS   int64  `json:"time_ms"`
	Revealed bool   `json:"revealed"`
}

func (s *Store) Responses(attemptID string) (map[string]*Response, error) {
	rows, err := s.db.Query(`SELECT qid,choice,marked,time_ms,revealed FROM responses WHERE attempt_id = ?`, attemptID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[string]*Response{}
	for rows.Next() {
		var r Response
		if err := rows.Scan(&r.QID, &r.Choice, &r.Marked, &r.TimeMS, &r.Revealed); err != nil {
			return nil, err
		}
		out[r.QID] = &r
	}
	return out, rows.Err()
}

func (s *Store) SaveResponse(attemptID string, r *Response) error {
	_, err := s.db.Exec(`INSERT INTO responses(attempt_id,qid,choice,marked,time_ms,revealed) VALUES(?,?,?,?,?,?)
		ON CONFLICT(attempt_id,qid) DO UPDATE SET
		  choice = CASE WHEN responses.revealed THEN responses.choice ELSE excluded.choice END,
		  marked = excluded.marked,
		  time_ms = MAX(responses.time_ms, excluded.time_ms),
		  revealed = MAX(responses.revealed, excluded.revealed)`,
		attemptID, r.QID, r.Choice, r.Marked, r.TimeMS, r.Revealed)
	return err
}

func (s *Store) Submit(attemptID string, score int, at int64) error {
	_, err := s.db.Exec(`UPDATE attempts SET submitted_at = ?, score = ? WHERE id = ? AND submitted_at IS NULL`, at, score, attemptID)
	return err
}

func (s *Store) DeleteUnsubmitted(attemptID string, userID int64) error {
	if _, err := s.db.Exec(`DELETE FROM responses WHERE attempt_id IN (SELECT id FROM attempts WHERE id = ? AND user_id = ? AND submitted_at IS NULL)`, attemptID, userID); err != nil {
		return err
	}
	_, err := s.db.Exec(`DELETE FROM attempts WHERE id = ? AND user_id = ? AND submitted_at IS NULL`, attemptID, userID)
	return err
}

// History: every answered question in submitted attempts, for stats and selection.
type HistRow struct {
	QID       string
	Choice    *int
	TimeMS    int64
	Submitted int64
}

func (s *Store) History(userID int64) ([]HistRow, error) {
	rows, err := s.db.Query(`SELECT r.qid, r.choice, r.time_ms, a.submitted_at FROM responses r
		JOIN attempts a ON a.id = r.attempt_id WHERE a.user_id = ? AND a.submitted_at IS NOT NULL ORDER BY a.submitted_at`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []HistRow
	for rows.Next() {
		var h HistRow
		if err := rows.Scan(&h.QID, &h.Choice, &h.TimeMS, &h.Submitted); err != nil {
			return nil, err
		}
		out = append(out, h)
	}
	return out, rows.Err()
}

func (s *Store) SeenInAttempts(userID int64) (map[string]bool, error) {
	rows, err := s.db.Query(`SELECT question_ids FROM attempts WHERE user_id = ?`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	seen := map[string]bool{}
	for rows.Next() {
		var ids string
		if err := rows.Scan(&ids); err != nil {
			return nil, err
		}
		var list []string
		_ = json.Unmarshal([]byte(ids), &list)
		for _, id := range list {
			seen[id] = true
		}
	}
	return seen, rows.Err()
}

func (s *Store) Report(userID int64, qid, note string) error {
	_, err := s.db.Exec(`INSERT INTO reports(user_id,qid,note,created_at) VALUES(?,?,?,?)`, userID, qid, note, time.Now().Unix())
	return err
}
