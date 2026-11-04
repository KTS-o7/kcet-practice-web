export type SubjectId = 'physics' | 'chemistry' | 'mathematics'
export type AttemptSubject = SubjectId | 'all'
export type Mode = 'mock' | 'full' | 'quick' | 'chapter' | 'year'

export interface User {
  id: number
  name: string
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
