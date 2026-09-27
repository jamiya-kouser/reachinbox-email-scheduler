import { useEffect, useState } from 'react';

type User = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
};

type EmailRecord = {
  id: string;
  recipient_email: string;
  subject: string;
  status: string;
  scheduled_for: string;
};

const API = 'http://localhost:4000';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [emails, setEmails] = useState<EmailRecord[]>([]);

  const [form, setForm] = useState({
    recipientEmail: '',
    subject: '',
    bodyText: '',
    scheduledFor: '',
  });

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await fetch(`${API}/api/v1/auth/me`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setUser(data.user);
        }
      }
    } catch {
      setMessage('Backend is not reachable.');
    } finally {
      setLoading(false);
    }
  }

  function login() {
    window.location.href = `${API}/api/v1/auth/google`;
  }

  async function logout() {
    await fetch(`${API}/api/v1/auth/logout`, {
      credentials: 'include',
    });

    setUser(null);
  }

  async function scheduleEmail(e: React.FormEvent) {
    e.preventDefault();

    setSending(true);
    setMessage('');

    try {
      /*
       * Temporary sender ID for the database test sender.
       * Once the sender-management API is added, this will come
       * from the authenticated user's configured sender.
       */
      const senderId = 'c5f67998-ba6d-11f1-84ff-76fc32eb794b';

      const response = await fetch(`${API}/api/v1/emails/schedule`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
          'X-Demo-Mode': 'true',
        },
        body: JSON.stringify({
          senderId,
          recipientEmail: form.recipientEmail,
          recipientName: null,
          subject: form.subject,
          bodyText: form.bodyText,
          scheduledFor: new Date(form.scheduledFor).toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to schedule email');
      }

      setMessage('✓ Email scheduled successfully');

      setEmails((current) => [
        {
          id: data.emailId,
          recipient_email: form.recipientEmail,
          subject: form.subject,
          status: data.status,
          scheduled_for: data.scheduledFor,
        },
        ...current,
      ]);

      setForm({
        recipientEmail: '',
        subject: '',
        bodyText: '',
        scheduledFor: '',
      });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Something went wrong'
      );
    } finally {
      setSending(false);
    }
  }

  if (!user && !showDemo && !loading) {
    return (
      <div className="min-h-screen bg-[#080d1a] text-white flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(79,70,229,0.16),transparent_35%)]" />

        <div className="relative w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-3xl font-bold shadow-2xl shadow-indigo-600/30">
              R
            </div>

            <h1 className="text-3xl font-bold mt-6 tracking-tight">
              ReachInbox
            </h1>

            <p className="text-slate-400 mt-2">
              Smart email scheduling, built for scale.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-[#0f172a] p-8 shadow-2xl">
            <h2 className="text-xl font-semibold text-center">
              Welcome back
            </h2>

            <p className="text-sm text-slate-500 text-center mt-2 mb-7">
              Sign in to manage and schedule your emails.
            </p>

            <button
              onClick={login}
              className="w-full flex items-center justify-center gap-3 rounded-xl bg-white text-slate-900 py-3.5 font-semibold hover:bg-slate-200 transition"
            >
              <span className="text-lg font-bold">G</span>
              Continue with Google
            </button>

            <button
              onClick={() => setShowDemo(true)}
              className="w-full mt-3 rounded-xl border border-slate-700 text-slate-400 py-3 text-sm hover:bg-slate-800 hover:text-white transition"
            >
              Preview Dashboard
            </button>

            <div className="mt-7 pt-6 border-t border-slate-800">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-indigo-400 font-semibold">OAuth</p>
                  <p className="text-xs text-slate-600 mt-1">Secure login</p>
                </div>
                <div>
                  <p className="text-indigo-400 font-semibold">BullMQ</p>
                  <p className="text-xs text-slate-600 mt-1">Reliable queue</p>
                </div>
                <div>
                  <p className="text-indigo-400 font-semibold">SMTP</p>
                  <p className="text-xs text-slate-600 mt-1">Email delivery</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-600 mt-6">
            ReachInbox Email Scheduler • Development Build
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1120] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="h-10 w-10 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading ReachInbox...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1120] text-white">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="hidden md:flex w-64 border-r border-slate-800 bg-[#0f172a] flex-col">
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-lg">
                R
              </div>
              <div>
                <h1 className="font-bold">ReachInbox</h1>
                <p className="text-xs text-slate-500">Smart Email Infrastructure</p>
              </div>
            </div>
          </div>

          <nav className="p-4 space-y-2 flex-1">
            <div className="px-4 py-3 rounded-xl bg-indigo-600/15 text-indigo-300 font-medium">
              Dashboard
            </div>

            <div className="px-4 py-3 rounded-xl text-slate-400">
              Scheduled
            </div>

            <div className="px-4 py-3 rounded-xl text-slate-400">
              Sent
            </div>

            <div className="px-4 py-3 rounded-xl text-slate-400">
              Failed
            </div>
          </nav>

          <div className="p-4 border-t border-slate-800">
            <div className="rounded-xl bg-slate-900 p-4">
              <p className="text-xs text-slate-500 mb-2">SYSTEM STATUS</p>
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Backend connected
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1">

          {/* Header */}
          <header className="h-20 border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur flex items-center justify-between px-6 md:px-10">
            <div>
              <h2 className="text-xl font-semibold">Campaign Overview</h2>
              <p className="text-sm text-slate-500">
                Schedule, deliver, and track your emails from one place
              </p>
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    className="h-9 w-9 rounded-full"
                    alt=""
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center">
                    {user.name?.[0] || user.email[0].toUpperCase()}
                  </div>
                )}

                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{user.name || 'User'}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>

                <button
                  onClick={logout}
                  className="text-xs text-slate-400 hover:text-white ml-2"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="px-5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-sm hover:bg-slate-200 transition"
              >
                Continue with Google
              </button>
            )}
          </header>

          <div className="p-6 md:p-10 max-w-7xl mx-auto">

            {/* Stats */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <StatCard
                label="Total Emails"
                value={String(emails.length)}
                icon="✉"
              />
              <StatCard
                label="Scheduled"
                value={String(
                  emails.filter((email) => email.status === 'QUEUED').length
                )}
                icon="◷"
              />
              <StatCard
                label="Sent"
                value={String(
                  emails.filter((email) => email.status === 'SENT').length
                )}
                icon="✓"
              />
            </section>

            <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">

              {/* Schedule form */}
              <section className="rounded-2xl border border-slate-800 bg-[#0f172a] p-6 md:p-8">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold">Schedule an Email</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Create a message and choose when it should be delivered.
                  </p>
                </div>

                <form onSubmit={scheduleEmail} className="space-y-5">

                  <div>
                    <label className="text-sm text-slate-400 block mb-2">
                      Recipient
                    </label>
                    <input
                      required
                      type="email"
                      value={form.recipientEmail}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          recipientEmail: e.target.value,
                        })
                      }
                      placeholder="recipient@example.com"
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 block mb-2">
                      Subject
                    </label>
                    <input
                      required
                      value={form.subject}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          subject: e.target.value,
                        })
                      }
                      placeholder="Your email subject"
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 block mb-2">
                      Message
                    </label>
                    <textarea
                      required
                      rows={7}
                      value={form.bodyText}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          bodyText: e.target.value,
                        })
                      }
                      placeholder="Write your email..."
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 outline-none focus:border-indigo-500 transition resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 block mb-2">
                      Schedule time
                    </label>
                    <input
                      required
                      type="datetime-local"
                      value={form.scheduledFor}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          scheduledFor: e.target.value,
                        })
                      }
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 outline-none focus:border-indigo-500"
                    />
                  </div>

                  {message && (
                    <div
                      className={`rounded-xl px-4 py-3 text-sm ${
                        message.startsWith('✓')
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {message}
                    </div>
                  )}

                  <button
                    disabled={sending}
                    className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-3.5 font-semibold transition"
                  >
                    {sending ? 'Scheduling...' : 'Schedule Email'}
                  </button>
                </form>
              </section>

              {/* Activity */}
              <section className="rounded-2xl border border-slate-800 bg-[#0f172a] p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">Recent Activity</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Your latest scheduled emails
                    </p>
                  </div>
                </div>

                {emails.length === 0 ? (
                  <div className="border border-dashed border-slate-700 rounded-xl p-8 text-center">
                    <div className="text-3xl mb-3">✉</div>
                    <p className="text-slate-400 text-sm">
                      No emails scheduled yet.
                    </p>
                    <p className="text-slate-600 text-xs mt-1">
                      Your scheduled emails will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {emails.map((email) => (
                      <div
                        key={email.id}
                        className="rounded-xl bg-slate-900 border border-slate-800 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {email.subject}
                            </p>
                            <p className="text-xs text-slate-500 mt-1 truncate">
                              {email.recipient_email}
                            </p>
                          </div>

                          <span
                            className={`text-xs px-2.5 py-1 rounded-full ${
                              email.status === 'SENT'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-indigo-500/10 text-indigo-400'
                            }`}
                          >
                            {email.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Architecture strip */}
            <section className="mt-6 rounded-2xl border border-slate-800 bg-[#0f172a] p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                Delivery Pipeline
              </p>

              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Pipeline label="React" />
                <span className="text-slate-600">→</span>
                <Pipeline label="Express API" />
                <span className="text-slate-600">→</span>
                <Pipeline label="MySQL" />
                <span className="text-slate-600">→</span>
                <Pipeline label="Redis + BullMQ" />
                <span className="text-slate-600">→</span>
                <Pipeline label="Worker" />
                <span className="text-slate-600">→</span>
                <Pipeline label="Ethereal SMTP" />
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <span className="text-indigo-400">{icon}</span>
      </div>
      <p className="text-3xl font-bold mt-3">{value}</p>
    </div>
  );
}

function Pipeline({ label }: { label: string }) {
  return (
    <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300">
      {label}
    </span>
  );
}