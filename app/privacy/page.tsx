import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { InfinityIcon } from '@/components/ui/infinity-icon'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy | Twin',
  description: 'How Twin collects, uses, and protects your data'
}

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/20 bg-white/10 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <InfinityIcon className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Twin</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last Updated: October 21, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Overview</h2>
            <p>
              Twin is a platform that creates AI-powered personas to personalize your digital experiences.
              This privacy policy explains how we collect, use, store, and protect your data across both
              our web application and Chrome extension.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">What We Collect</h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">Web Application</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Account Information:</strong> Email address, name (when you sign up)
              </li>
              <li>
                <strong>Persona Data:</strong> Interests, goals, profession, communication preferences (entered by you during onboarding)
              </li>
              <li>
                <strong>Connected Account Data:</strong> When you authorize:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>YouTube: Subscriptions, playlists, liked videos (read-only)</li>
                  <li>GitHub: Public repositories, starred repos (if connected)</li>
                  <li>LinkedIn: Profile data, skills (coming soon)</li>
                </ul>
              </li>
              <li>
                <strong>Usage Data:</strong> Session information, feature usage, error logs
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Chrome Extension</h3>
            <p className="mb-3">
              <strong>Important:</strong> The Chrome extension does NOT collect or create persona data.
              It only reads your existing persona created in the web app.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Page Content:</strong> Text, URLs, and images from web pages - ONLY when you explicitly
                click the "Personalize" button
              </li>
              <li>
                <strong>Session Token:</strong> To authenticate you with the Twin API
              </li>
              <li>
                <strong>No Background Tracking:</strong> We do NOT track your browsing history, cookies,
                or activity unless you click "Personalize"
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Data</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Persona Generation:</strong> Connected account data is analyzed by AI (Google Gemini)
                to create your personalized profile
              </li>
              <li>
                <strong>Content Personalization:</strong> Your persona is used to rank and recommend content
                when you use the Chrome extension
              </li>
              <li>
                <strong>Service Improvement:</strong> Aggregate, anonymized data helps us improve Twin
              </li>
              <li>
                <strong>Communication:</strong> Sending service updates, feature announcements (you can opt out)
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Sharing & Third Parties</h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">Services We Use</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Supabase:</strong> Database hosting (data stored in secure cloud infrastructure)
              </li>
              <li>
                <strong>Google Gemini AI:</strong> Processes your persona data and page content to generate
                personalized recommendations
              </li>
              <li>
                <strong>Cloudflare Workers:</strong> Hosts our API endpoints
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">What We DON'T Do</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>❌ We never sell your data to third parties</li>
              <li>❌ We don't use your data for advertising</li>
              <li>❌ We don't share your persona with other users or companies</li>
              <li>❌ No background tracking or surveillance</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Storage & Security</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>All data transmission uses HTTPS encryption</li>
              <li>Passwords are hashed and never stored in plain text</li>
              <li>Session tokens expire after 24 hours</li>
              <li>API keys are never exposed to client-side code</li>
              <li>Database access is restricted to authorized services only</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Your Rights & Controls</h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">You Can:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>View Your Data:</strong> Access your persona anytime in the Twin dashboard
              </li>
              <li>
                <strong>Edit Your Persona:</strong> Update interests, goals, and preferences at any time
              </li>
              <li>
                <strong>Disconnect Accounts:</strong> Revoke YouTube, GitHub, or other connected accounts
              </li>
              <li>
                <strong>Export Your Data:</strong> Request a copy of your data (contact us)
              </li>
              <li>
                <strong>Delete Your Account:</strong> Permanently delete all your data:
                <ol className="list-decimal pl-6 mt-2 space-y-1">
                  <li>Go to your dashboard settings</li>
                  <li>Click "Delete Account"</li>
                  <li>Confirm deletion - this removes all data from our systems</li>
                </ol>
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Chrome Extension Specific:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Sign out anytime to disconnect from your persona</li>
              <li>Uninstall the extension to stop all data transmission</li>
              <li>Extension only acts when you click "Personalize" - full control</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Active Accounts:</strong> Your persona and account data is retained while your account is active
              </li>
              <li>
                <strong>Deleted Accounts:</strong> Data is permanently deleted within 30 days of account deletion
              </li>
              <li>
                <strong>Page Content:</strong> Content sent for personalization is processed in real-time and not stored
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">GDPR Compliance (EU Users)</h2>
            <p className="mb-3">
              If you're located in the European Union, you have additional rights under GDPR:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
              <li><strong>Right to Rectification:</strong> Correct inaccurate data</li>
              <li><strong>Right to Erasure:</strong> Delete your data ("right to be forgotten")</li>
              <li><strong>Right to Data Portability:</strong> Receive your data in a portable format</li>
              <li><strong>Right to Object:</strong> Object to certain data processing</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, contact us at the email below.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
            <p>
              Twin is not intended for users under 13 years old. We do not knowingly collect
              data from children. If you believe we have collected data from a child, please
              contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
            <p>
              We may update this privacy policy occasionally to reflect changes in our practices
              or legal requirements. We'll notify you of significant changes via email or a notice
              in the app. Continued use of Twin after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="mb-3">
              For privacy questions, data requests, or concerns:
            </p>
            <ul className="list-none space-y-2">
              <li><strong>Email:</strong> privacy@twin.app (or your actual email)</li>
              <li><strong>Website:</strong> <Link href="/" className="text-primary hover:underline">twin.erniesg.workers.dev</Link></li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Summary</h2>
            <div className="bg-primary/5 p-6 rounded-lg">
              <p className="font-semibold mb-3">In Plain English:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>We collect data you give us (persona, connected accounts) to personalize your experience</li>
                <li>Chrome extension only acts when you click - no background tracking</li>
                <li>We use Google Gemini AI to process your data</li>
                <li>We never sell your data or use it for ads</li>
                <li>You can view, edit, export, or delete your data anytime</li>
                <li>Your data is encrypted and secure</li>
              </ul>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Twin. Your AI memory system.</p>
          <div className="mt-2 space-x-4">
            <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
