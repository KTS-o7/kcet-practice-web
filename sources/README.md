# Sources

Raw source files for the KCET question corpus. Never edit files here; they are the evidence
every question in the app traces back to.

Layout:
- pyq/<year>/<subject>/            past KCET papers + official answer keys (subject = physics|chemistry|mathematics)
- third-party/<subject>/<source-slug>/   practice banks with their own answer keys
- manual/<source-slug>/            manually collected material, fetched by hand (see manual/bank/README.md)
- syllabus/                        PUC I/II syllabus, KCET pattern, deleted-topic notices
- _manifests/<agent>.json          one manifest per collection agent

Every downloaded file has an entry in a manifest:
{ "path", "url", "fetched_at", "sha256", "bytes", "pages", "kind": "question_paper|answer_key|combined|syllabus|notice",
  "year", "subject", "version" (e.g. A1), "official": true|false, "notes" }
