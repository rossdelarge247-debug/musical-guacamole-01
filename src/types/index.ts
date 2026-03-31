// =============================================================================
// INTERVIEW MONKEY — CORE TYPE DEFINITIONS
// =============================================================================

// --- USER & AUTH -----------------------------------------------------------

export type UserTier = 'core' | 'pro' | 'prime'
export type UserAddon = 'coach_mode'

export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  tier: UserTier
  addons: UserAddon[]
  preferred_answer_style: AnswerStyle | null
  preferred_interview_modes: InterviewMode[]
  live_workspace_declaration_accepted: boolean
  live_workspace_declaration_accepted_at: string | null
  gdpr_consented_at: string | null
  created_at: string
  updated_at: string
}

// --- CANDIDATE PROFILE & GRAPH ---------------------------------------------

export type CandidateLevel = 'graduate' | 'early' | 'mid' | 'senior' | 'director' | 'executive'

export interface CandidateProfile {
  id: string
  user_id: string
  raw_cv_text: string | null
  level: CandidateLevel
  headline: string | null
  skills: string[]
  language_profile: LanguageProfile | null
  parsing_confidence: number // 0–1
  created_at: string
  updated_at: string
}

export interface LanguageProfile {
  preferred_complexity: 'simple' | 'standard' | 'complex'
  is_native_speaker: boolean
  style_notes: string[]
}

export type GraphNodeType =
  | 'role'
  | 'project'
  | 'achievement'
  | 'proof_point'
  | 'stakeholder'
  | 'decision'
  | 'failure'
  | 'lesson'
  | 'signal'

export interface CandidateGraphNode {
  id: string
  profile_id: string
  type: GraphNodeType
  title: string
  description: string
  context: string | null
  date_from: string | null
  date_to: string | null
  organisation: string | null
  metrics: string[]
  tags: string[]
  confidence: number // AI extraction confidence 0–1
  user_verified: boolean
  linked_node_ids: string[]
  created_at: string
  updated_at: string
}

// --- STORIES ---------------------------------------------------------------

export type QuestionType =
  | 'behavioural'
  | 'competency'
  | 'leadership'
  | 'strategy'
  | 'situational'
  | 'pressure'
  | 'motivational'
  | 'failure'
  | 'conflict'
  | 'ambiguity'
  | 'achievement'
  | 'stakeholder'
  | 'change'
  | 'commercial'

export type SignalType =
  | 'ownership'
  | 'leadership'
  | 'judgment'
  | 'prioritisation'
  | 'commercial_awareness'
  | 'self_awareness'
  | 'influence'
  | 'resilience'
  | 'scale'
  | 'decisiveness'
  | 'strategic_thinking'

export type AnswerVariantMode =
  | 'short'
  | 'medium'
  | 'long'
  | 'strategic'
  | 'reflective'
  | 'concise'
  | 'executive'

export interface StoryVariant {
  mode: AnswerVariantMode
  content: string
  word_count: number
}

export interface Story {
  id: string
  profile_id: string
  title: string
  summary: string
  context: string
  challenge: string
  action: string
  outcome: string
  metric: string | null
  stakeholder_angle: string | null
  question_fit_tags: QuestionType[]
  signal_strengths: Record<SignalType, number> // 0–5
  linked_node_ids: string[]
  variants: StoryVariant[]
  confidence_score: number
  is_overused: boolean
  created_at: string
  updated_at: string
}

// --- PRESSURE POINTS -------------------------------------------------------

export type PressurePointType =
  | 'gap'
  | 'short_tenure'
  | 'low_metrics'
  | 'limited_leadership'
  | 'apparent_pivot'
  | 'domain_mismatch'
  | 'title_mismatch'
  | 'unexplained_departure'
  | 'over_qualified'

export type PressurePointSeverity = 'low' | 'medium' | 'high'

export interface PressureDrill {
  question: string
  recommended_approach: string
}

export interface PressurePoint {
  id: string
  profile_id: string
  type: PressurePointType
  title: string
  interviewer_concern: string
  severity: PressurePointSeverity
  defense_line: string
  recommended_framing: string
  proof_points: string[]
  bad_responses_to_avoid: string[]
  drills: PressureDrill[]
  interviewer_lenses: string[]
  created_at: string
  updated_at: string
}

// --- JOB PACKS -------------------------------------------------------------

export type InterviewType = 'behavioural' | 'competency' | 'leadership' | 'strategy' | 'mixed' | 'panel'

export interface JobPack {
  id: string
  user_id: string
  profile_id: string
  title: string
  company: string | null
  jd_raw: string
  role_level: CandidateLevel
  interview_type: InterviewType
  inferred_priorities: string[]
  likely_questions: LikelyQuestion[]
  mapped_story_ids: string[]
  pressure_point_ids: string[]
  target_signals: SignalType[]
  vocabulary: string[]
  answer_priorities: string[]
  opening_pitch: string | null
  proof_point_ledger: ProofPoint[]
  readiness_scores: Record<string, number>
  created_at: string
  updated_at: string
}

export interface LikelyQuestion {
  id: string
  text: string
  type: QuestionType
  priority: 'high' | 'medium' | 'low'
  why_likely: string
  best_story_id: string | null
}

export interface ProofPoint {
  id: string
  text: string
  metric: string | null
  linked_story_ids: string[]
  signal: SignalType | null
}

// --- ANSWER ASSETS ---------------------------------------------------------

export type AnswerStyle = 'natural' | 'structured' | 'concise' | 'executive'
export type TransformMode =
  | 'more_concise'
  | 'more_strategic'
  | 'more_direct'
  | 'more_natural'
  | 'more_evidence'
  | 'more_executive'
  | 'simpler_english'
  | 'less_corporate'

export interface AnswerAsset {
  id: string
  user_id: string
  pack_id: string | null
  question_text: string
  question_type: QuestionType | null
  recommended_shape: string | null
  draft_answer: string
  transformed_variants: TransformedVariant[]
  score: number | null
  linked_story_id: string | null
  linked_proof_point_ids: string[]
  is_saved: boolean
  created_at: string
  updated_at: string
}

export interface TransformedVariant {
  mode: TransformMode
  content: string
  created_at: string
}

// --- SESSIONS --------------------------------------------------------------

export type SessionType = 'mock_ai' | 'mock_human' | 'live' | 'practice'
export type SessionStatus = 'pending' | 'active' | 'paused' | 'ended'

export interface Session {
  id: string
  user_id: string
  pack_id: string | null
  type: SessionType
  status: SessionStatus
  transcript: TranscriptEntry[]
  scores: Record<string, number>
  detected_issues: string[]
  recommendations: string[]
  user_self_rating: number | null
  created_at: string
  ended_at: string | null
}

export interface TranscriptEntry {
  id: string
  speaker: 'user' | 'interviewer' | 'system'
  text: string
  timestamp: string
  question_type: QuestionType | null
  classified_at: string | null
}

// --- DUAL SURFACE SESSIONS -------------------------------------------------

export type SurfaceRole = 'lead' | 'follower'
export type PairStatus = 'pending' | 'active' | 'ended'

export interface DualSurfaceSession {
  id: string
  session_id: string
  user_id: string
  pairing_token_hash: string
  token_expires_at: string
  lead_device_id: string | null
  follower_device_id: string | null
  status: PairStatus
  realtime_channel: string
  active_prompt: TeleprompterPrompt | null
  support_density: 'minimal' | 'standard' | 'full'
  created_at: string
  ended_at: string | null
}

export interface TeleprompterPrompt {
  question_type: QuestionType | null
  question_detected: string | null
  best_story_title: string | null
  alternate_story_title: string | null
  answer_shape: string | null
  proof_point: string | null
  coaching_nudge: string | null
  updated_at: string
}

// --- SIGNAL ANALYSIS -------------------------------------------------------

export interface SignalAnalysis {
  answer_id: string
  signals_detected: Partial<Record<SignalType, number>>
  signals_missing: SignalType[]
  overall_score: number
  summary: string
  suggestions: string[]
}

// --- DEMO MODE -------------------------------------------------------------

export interface DemoFlags {
  auth: boolean
  ai: boolean
  transcription: boolean
  payments: boolean
  email: boolean
  storage: boolean
}
