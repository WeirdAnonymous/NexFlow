import { useState, type CSSProperties } from "react";
import ReactMarkdown from "react-markdown";
import { contactHref, safeColor, type BuilderMessage, type SiteConfig } from "@/lib/site-config";

export function SiteView({ config, onAsk }: { config: SiteConfig; onAsk?: ((m: BuilderMessage[]) => Promise<string>) | undefined }) {
  const style = { "--site": safeColor(config.primaryColor) } as CSSProperties;
  return (
    <div style={style} className="min-h-full bg-background text-foreground">
      <header className="bg-[var(--site)] px-5 pb-12 pt-10 text-primary-foreground">
        <div className="mx-auto max-w-3xl">
          <p className="font-display text-sm font-semibold opacity-80">{config.businessName}</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">{config.tagline}</h1>
          <p className="mt-3 opacity-85">{config.description}</p>
          {config.hours && <p className="mt-4 text-sm opacity-75">Horário: {config.hours}</p>}
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-10 px-5 py-10">
        {config.services.length > 0 && (
          <section>
            <h2 className="text-xl font-bold">Serviços</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {config.services.map((s, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-4">
                  <p className="font-semibold">{s.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                  {s.price && <p className="mt-2 text-sm font-semibold">{s.price}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
        {config.sections.map((s, i) => (
          <section key={i}>
            <h2 className="text-xl font-bold">{s.title}</h2>
            <p className="mt-2 whitespace-pre-line text-muted-foreground">{s.body}</p>
          </section>
        ))}
        {config.faqs.length > 0 && (
          <section>
            <h2 className="text-xl font-bold">Perguntas frequentes</h2>
            <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
              {config.faqs.map((f, i) => (
                <details key={i} className="p-4">
                  <summary className="cursor-pointer font-medium">{f.question}</summary>
                  <p className="mt-2 text-sm text-muted-foreground">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}
        <Assistant config={config} onAsk={onAsk} />
      </main>
      <footer className="pb-8 text-center text-xs text-muted-foreground">Atendimento por Nexflow</footer>
    </div>
  );
}

function Assistant({ config, onAsk }: { config: SiteConfig; onAsk?: ((m: BuilderMessage[]) => Promise<string>) | undefined }) {
  const [msgs, setMsgs] = useState<BuilderMessage[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [human, setHuman] = useState(false);
  const href = config.humanContact ? contactHref(config.humanContact) : null;

  async function send() {
    const q = text.trim();
    if (!q || busy || !onAsk) return;
    const next = [...msgs, { role: "user" as const, content: q }];
    setMsgs(next);
    setText("");
    setBusy(true);
    try {
      const reply = await onAsk(next);
      setMsgs([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      setMsgs([...next, { role: "assistant", content: `⚠️ ${(e as Error).message}` }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--site)]" />
        <p className="font-semibold">Atendimento virtual</p>
      </div>
      <div className="max-h-80 space-y-3 overflow-y-auto py-4 text-sm">
        <p className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-3 py-2">Olá! Sou o assistente da {config.businessName}. Como posso ajudar?</p>
        {msgs.map((m, i) =>
          m.role === "user" ? (
            <p key={i} className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-[var(--site)] px-3 py-2 text-primary-foreground">{m.content}</p>
          ) : (
            <div key={i} className="prose prose-sm max-w-[85%] px-1"><ReactMarkdown>{m.content}</ReactMarkdown></div>
          ),
        )}
        {busy && <p className="px-1 text-muted-foreground">Digitando…</p>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} disabled={!onAsk} placeholder={onAsk ? "Digite sua pergunta..." : "Disponível após publicar"} className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        <button disabled={busy || !onAsk} className="rounded-full bg-[var(--site)] px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">Enviar</button>
      </form>
      <button onClick={() => setHuman(true)} className="mt-3 text-sm font-medium text-muted-foreground underline">Prefiro falar com uma pessoa</button>
      {human && (
        <p className="mt-2 text-sm">
          {config.humanContact ? (href ? <a className="font-semibold underline" href={href} target="_blank" rel="noreferrer">Falar com a equipe: {config.humanContact}</a> : <>Fale com a equipe: <b>{config.humanContact}</b></>) : "A empresa ainda não cadastrou um contato direto."}
        </p>
      )}
    </section>
  );
}
