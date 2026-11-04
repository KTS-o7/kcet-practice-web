package main

import (
	"crypto/rand"
	"embed"
	"flag"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path"
	"strings"
	"time"
)

//go:embed all:web/dist
var webFS embed.FS

//go:embed corpus
var corpusFS embed.FS

func main() {
	addr := flag.String("addr", "127.0.0.1:8093", "listen address")
	dbPath := flag.String("db", "kcet.db", "SQLite database path")
	dev := flag.Bool("dev", false, "dev mode: passcode defaults to 'kcet', cookies not Secure, serve corpus from disk")
	corpusDir := flag.String("corpus", "corpus", "corpus directory to read in dev mode")
	flag.Parse()

	var cfs fs.FS
	cfs, _ = fs.Sub(corpusFS, "corpus")
	if *dev {
		cfs = os.DirFS(*corpusDir) // pick up corpus edits without rebuilding
	}
	corpus, err := LoadCorpus(cfs)
	if err != nil {
		log.Fatalf("corpus: %v", err)
	}
	log.Printf("corpus: %d questions (%d flagged), %d papers", len(corpus.Questions), corpus.Flagged, len(corpus.Papers))

	store, err := OpenStore(*dbPath)
	if err != nil {
		log.Fatalf("db: %v", err)
	}

	passcode := os.Getenv("KCET_PASSCODE")
	if passcode == "" {
		if !*dev {
			log.Fatal("KCET_PASSCODE must be set")
		}
		passcode = "kcet"
	}
	secret := []byte(os.Getenv("KCET_SECRET"))
	if len(secret) < 32 {
		if !*dev {
			log.Fatal("KCET_SECRET must be at least 32 bytes")
		}
		secret = make([]byte, 32)
		_, _ = rand.Read(secret)
	}

	app := &App{corpus: corpus, store: store, auth: &Auth{secret: secret, passcode: passcode, secure: !*dev, failures: map[string][]time.Time{}}}
	mux := http.NewServeMux()
	app.routes(mux)

	imgFS, _ := fs.Sub(cfs, "images")
	imgs := http.StripPrefix("/img/", http.FileServer(http.FS(imgFS)))
	mux.Handle("GET /img/", app.authedHandler(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "private, max-age=31536000, immutable")
		imgs.ServeHTTP(w, r)
	}))

	dist, _ := fs.Sub(webFS, "web/dist")
	mux.Handle("GET /", spa(dist))

	srv := &http.Server{Addr: *addr, Handler: securityHeaders(mux), ReadHeaderTimeout: 10 * time.Second}
	log.Printf("listening on http://%s", *addr)
	log.Fatal(srv.ListenAndServe())
}

func (app *App) authedHandler(h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if _, ok := app.auth.user(r); !ok {
			http.Error(w, "not logged in", http.StatusUnauthorized)
			return
		}
		h(w, r)
	}
}

// spa serves built assets; unknown paths get index.html so client routing works.
func spa(dist fs.FS) http.Handler {
	files := http.FileServer(http.FS(dist))
	index, _ := fs.ReadFile(dist, "index.html")
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		p := strings.TrimPrefix(path.Clean(r.URL.Path), "/")
		if p == "robots.txt" {
			w.Header().Set("Content-Type", "text/plain")
			_, _ = w.Write([]byte("User-agent: *\nDisallow: /\n"))
			return
		}
		if p != "" && p != "index.html" {
			if st, err := fs.Stat(dist, p); err == nil && !st.IsDir() {
				if strings.HasPrefix(p, "assets/") {
					w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
				}
				files.ServeHTTP(w, r)
				return
			}
			if strings.HasPrefix(p, "api/") || path.Ext(p) != "" {
				http.NotFound(w, r)
				return
			}
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Header().Set("Cache-Control", "no-cache")
		_, _ = w.Write(index)
	})
}

func securityHeaders(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hd := w.Header()
		hd.Set("X-Robots-Tag", "noindex, nofollow")
		hd.Set("X-Content-Type-Options", "nosniff")
		hd.Set("Referrer-Policy", "same-origin")
		hd.Set("X-Frame-Options", "DENY")
		hd.Set("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'")
		h.ServeHTTP(w, r)
	})
}
