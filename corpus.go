package main

import (
	"encoding/json"
	"fmt"
	"io/fs"
	"path"
	"sort"
	"strings"
)

var subjects = []string{"physics", "chemistry", "mathematics"}

type Source struct {
	Type    string `json:"type"`
	Name    string `json:"name"`
	Year    int    `json:"year"`
	Version string `json:"version"`
	Number  int    `json:"number"`
	File    string `json:"file"`
	Page    int    `json:"page"`
	KeyFile string `json:"key_file"`
}

type Question struct {
	ID         string          `json:"id"`
	Subject    string          `json:"subject"`
	Chapter    string          `json:"chapter"`
	Source     Source          `json:"source"`
	Stem       string          `json:"stem"`
	Options    []string        `json:"options"`
	Answer     int             `json:"answer"`
	Accepted   []int           `json:"accepted"`
	Images     []string        `json:"images"`
	Status     string          `json:"status"`
	InSyllabus bool            `json:"in_syllabus"`
	Checks     json.RawMessage `json:"checks,omitempty"`
}

func (q *Question) IsCorrect(choice int) bool {
	for _, a := range q.Accepted {
		if a == choice {
			return true
		}
	}
	return false
}

type Chapter struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Class      int    `json:"class"`
	InSyllabus bool   `json:"in_syllabus"`
}

// Paper is a real past KCET paper, questions in original order.
type Paper struct {
	ID          string   `json:"id"`
	Subject     string   `json:"subject"`
	Year        int      `json:"year"`
	Name        string   `json:"name"`
	QuestionIDs []string `json:"-"`
	Count       int      `json:"count"`
}

type Corpus struct {
	Questions   map[string]*Question
	BySubject   map[string][]*Question // verified only
	Chapters    map[string][]Chapter
	ChapterName map[string]string
	Papers      []Paper
	Flagged     int
}

func LoadCorpus(fsys fs.FS) (*Corpus, error) {
	c := &Corpus{
		Questions:   map[string]*Question{},
		BySubject:   map[string][]*Question{},
		Chapters:    map[string][]Chapter{},
		ChapterName: map[string]string{},
	}
	if b, err := fs.ReadFile(fsys, "chapters.json"); err == nil {
		if err := json.Unmarshal(b, &c.Chapters); err != nil {
			return nil, fmt.Errorf("chapters.json: %w", err)
		}
	}
	for _, chs := range c.Chapters {
		for _, ch := range chs {
			c.ChapterName[ch.ID] = ch.Name
		}
	}
	papers := map[string]*Paper{}
	err := fs.WalkDir(fsys, "questions", func(p string, d fs.DirEntry, err error) error {
		if err != nil || d.IsDir() || path.Ext(p) != ".json" {
			return err
		}
		b, err := fs.ReadFile(fsys, p)
		if err != nil {
			return err
		}
		var qs []*Question
		if err := json.Unmarshal(b, &qs); err != nil {
			return fmt.Errorf("%s: %w", p, err)
		}
		for _, q := range qs {
			if _, dup := c.Questions[q.ID]; dup {
				return fmt.Errorf("%s: duplicate id %s", p, q.ID)
			}
			if len(q.Accepted) == 0 {
				q.Accepted = []int{q.Answer}
			}
			c.Questions[q.ID] = q
			if q.Status == "flagged" {
				c.Flagged++
			}
			if q.Status != "verified" || len(q.Options) != 4 {
				continue
			}
			c.BySubject[q.Subject] = append(c.BySubject[q.Subject], q)
			if q.Source.Type == "pyq" && q.Source.Year > 0 {
				pid := fmt.Sprintf("kcet-%d-%s", q.Source.Year, q.Subject)
				pp := papers[pid]
				if pp == nil {
					pp = &Paper{ID: pid, Subject: q.Subject, Year: q.Source.Year, Name: fmt.Sprintf("KCET %d", q.Source.Year)}
					papers[pid] = pp
				}
				pp.QuestionIDs = append(pp.QuestionIDs, q.ID)
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	for _, p := range papers {
		sort.Slice(p.QuestionIDs, func(i, j int) bool {
			return c.Questions[p.QuestionIDs[i]].Source.Number < c.Questions[p.QuestionIDs[j]].Source.Number
		})
		p.Count = len(p.QuestionIDs)
		c.Papers = append(c.Papers, *p)
	}
	sort.Slice(c.Papers, func(i, j int) bool {
		if c.Papers[i].Year != c.Papers[j].Year {
			return c.Papers[i].Year > c.Papers[j].Year
		}
		return c.Papers[i].Subject < c.Papers[j].Subject
	})
	return c, nil
}

func (c *Corpus) chapterLabel(id string) string {
	if n, ok := c.ChapterName[id]; ok {
		return n
	}
	if id == "" {
		return "Uncategorised"
	}
	return strings.ReplaceAll(id, "-", " ")
}

// PublicQuestion is what the client sees during a test: no answer.
type PublicQuestion struct {
	ID          string   `json:"id"`
	Subject     string   `json:"subject"`
	Chapter     string   `json:"chapter"`
	ChapterName string   `json:"chapter_name"`
	Stem        string   `json:"stem"`
	Options     []string `json:"options"`
	Images      []string `json:"images"`
	SourceLabel string   `json:"source_label"`
}

func (c *Corpus) Public(q *Question) PublicQuestion {
	label := q.Source.Name
	if q.Source.Number > 0 {
		label = fmt.Sprintf("%s · Q%d", label, q.Source.Number)
	}
	imgs := q.Images
	if imgs == nil {
		imgs = []string{}
	}
	return PublicQuestion{q.ID, q.Subject, q.Chapter, c.chapterLabel(q.Chapter), q.Stem, q.Options, imgs, label}
}
