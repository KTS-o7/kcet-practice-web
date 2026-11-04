package main

import (
	"math/rand/v2"
	"sort"
)

type pickHistory struct {
	seen  map[string]bool
	wrong map[string]bool // last answer was wrong or skipped
}

// rank orders candidates: unseen first, then previously wrong, then the rest; random within each tier.
func rank(qs []*Question, h pickHistory) []*Question {
	out := append([]*Question(nil), qs...)
	rand.Shuffle(len(out), func(i, j int) { out[i], out[j] = out[j], out[i] })
	tier := func(q *Question) int {
		switch {
		case !h.seen[q.ID]:
			return 0
		case h.wrong[q.ID]:
			return 1
		}
		return 2
	}
	sort.SliceStable(out, func(i, j int) bool { return tier(out[i]) < tier(out[j]) })
	return out
}

func eligible(c *Corpus, subject string, chapters map[string]bool, includeOOS bool) []*Question {
	var out []*Question
	for _, q := range c.BySubject[subject] {
		if !includeOOS && !q.InSyllabus {
			continue
		}
		if len(chapters) > 0 && !chapters[q.Chapter] {
			continue
		}
		out = append(out, q)
	}
	return out
}

// pickMock draws n questions spread over chapters in proportion to how often
// each chapter appears in past KCET papers.
func pickMock(c *Corpus, subject string, n int, includeOOS bool, h pickHistory) []*Question {
	pool := eligible(c, subject, nil, includeOOS)
	byCh := map[string][]*Question{}
	weight := map[string]float64{}
	var totalW float64
	for _, q := range pool {
		byCh[q.Chapter] = append(byCh[q.Chapter], q)
		if q.Source.Type == "pyq" {
			weight[q.Chapter]++
			totalW++
		}
	}
	if totalW == 0 { // no PYQs: weight by availability
		for ch, qs := range byCh {
			weight[ch] = float64(len(qs))
			totalW += weight[ch]
		}
	}
	type alloc struct {
		ch   string
		n    int
		frac float64
	}
	var allocs []alloc
	used := 0
	for ch := range byCh {
		exact := weight[ch] / totalW * float64(n)
		k := int(exact)
		if k > len(byCh[ch]) {
			k = len(byCh[ch])
		}
		allocs = append(allocs, alloc{ch, k, exact - float64(int(exact))})
		used += k
	}
	sort.Slice(allocs, func(i, j int) bool { return allocs[i].frac > allocs[j].frac })
	for i := 0; used < n && i < len(allocs)*4; i++ { // largest remainder, skipping full chapters
		a := &allocs[i%len(allocs)]
		if a.n < len(byCh[a.ch]) {
			a.n++
			used++
		}
	}
	picked := map[string]bool{}
	var out []*Question
	for _, a := range allocs {
		for _, q := range rank(byCh[a.ch], h)[:a.n] {
			out = append(out, q)
			picked[q.ID] = true
		}
	}
	if len(out) < n { // top up from anything left
		for _, q := range rank(pool, h) {
			if len(out) >= n {
				break
			}
			if !picked[q.ID] {
				out = append(out, q)
			}
		}
	}
	// Group by chapter order in the syllabus, like a real paper roughly does.
	order := map[string]int{}
	for i, ch := range c.Chapters[subject] {
		order[ch.ID] = i
	}
	sort.SliceStable(out, func(i, j int) bool { return order[out[i].Chapter] < order[out[j].Chapter] })
	return out
}

func pickRandom(c *Corpus, subject string, chapters map[string]bool, n int, includeOOS bool, h pickHistory) []*Question {
	r := rank(eligible(c, subject, chapters, includeOOS), h)
	if len(r) > n {
		r = r[:n]
	}
	return r
}
