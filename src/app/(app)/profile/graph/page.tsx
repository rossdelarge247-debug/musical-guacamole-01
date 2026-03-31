import { redirect } from 'next/navigation'

// The Candidate Graph is now the Dashboard.
// Any direct links to /profile/graph land on /dashboard instead.
export default function CandidateGraphRedirect() {
  redirect('/dashboard')
}
