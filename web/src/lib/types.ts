export type SubjectId = 'physics' | 'chemistry' | 'mathematics'
export type AttemptSubject = SubjectId | 'all'
export type Mode = 'mock' | 'full' | 'quick' | 'chapter' | 'year'

export interface User {
  id: number
  name: string
  admin?: boolean
  has_recovery?: boolean
}

/** Sign-up and password reset hand back a one-time recovery code to show the student. */
export interface WithRecovery extends User {
  recovery_code: string
}

export interface ChapterMeta {
  id: string
  name: string
  class: 11 | 12 | number
  in_syllabus: boolean
  count: number
  pyq: number
  out_of_syllabus: number
}

export interface SubjectMeta {
  id: SubjectId
  count: number
  pyq: number
  chapters: ChapterMeta[] | null
}

export interface Paper {
  id: string
  subject: SubjectId
  year: number
  name: string
  count: number
}

export interface Meta {
  subjects: SubjectMeta[]
  papers: Paper[]
  flagged: number
}

export interface Attempt {
  id: string
  subject: AttemptSubject
  mode: Mode
  practice: boolean
  title: string
  duration_s: number
  started_at: number
  submitted_at: number | null
  score: number | null
  total: number
  answered?: number
}

export interface Question {
  id: string
  subject: SubjectId
  chapter: string
  chapter_name: string
  stem: string
  options: string[]
  images: string[] | null
  source_label: string
}

export type Choice = 0 | 1 | 2 | 3

export interface ResponseRow {
  qid: string
  choice: number | null
  marked: boolean
  time_ms: number
  revealed: boolean
}

export interface ReviewItem {
  qid: string
  answer: number
  accepted: number[] | null
  correct: boolean
}

export interface AttemptDetail {
  attempt: Attempt
  questions: Question[]
  responses: ResponseRow[]
  review: Record<string, ReviewItem>
  deadline: number
  now: number
}

export interface CreateAttemptInput {
  mode: Mode
  subject?: SubjectId
  count?: number
  chapters?: string[]
  paper?: string
  practice: boolean
  timed: boolean
  include_oos: boolean
}

export interface SubjectStat {
  answered: number
  correct: number
  skipped: number
  unique: number
  time_ms: number
}

export interface ChapterStat {
  subject: SubjectId
  chapter: string
  name: string
  answered: number
  correct: number
  skipped: number
  time_ms: number
}

export interface Stats {
  subjects: Record<SubjectId, SubjectStat>
  chapters: ChapterStat[]
  attempts: Attempt[]
  days: Record<string, number>
}

/* ---------- Owner dashboard (/api/admin/overview) ---------- */

export interface AdminTotals {
  signups: number
  active: number
  tests: number
  answered: number
}

export interface AdminDay extends AdminTotals {
  day: string // YYYY-MM-DD, IST
}

export interface AdminCohort {
  week: string
  size: number
  weeks: (number | null)[]
}

export interface AdminCount {
  key: string
  started: number
  finished: number
}

export interface AdminChapter {
  subject: SubjectId
  chapter: string
  name: string
  answered: number
  correct: number
}

export interface AdminSuspect {
  id: string
  subject: SubjectId
  chapter_name: string
  source: string
  stem: string
  options: string[]
  accepted: number[]
  picks: number[]
  students: number
  top: number
  live: boolean
}

export interface AdminReport {
  id: number
  user: string
  qid: string
  subject?: SubjectId | ''
  chapter_name?: string
  note: string
  created_at: number
}

export interface AdminStudent {
  id: number
  name: string
  joined: number
  last_active: number
  tests: number
  answered: number
  score: number
  total: number
}

export interface AdminOverview {
  generated_at: number
  today: AdminTotals
  week: AdminTotals
  students_total: number
  days: AdminDay[]
  retention: AdminCohort[]
  modes: AdminCount[]
  subjects: AdminCount[]
  kinds: AdminCount[]
  hardest: AdminChapter[]
  suspects: AdminSuspect[]
  reports: AdminReport[]
  students: AdminStudent[]
  thresholds: { suspect_min_students: number; suspect_max_correct: number; suspect_min_top: number; hard_min_answers: number }
}

export interface AdminStudentDetail {
  student: { id: number; name: string; joined: number; last_active: number }
  stats: Stats
  tests: Attempt[] // every test started, newest first
}
