export default function Contact() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center bg-gradient-to-b from-emerald-50 via-white to-emerald-100 py-20 px-6">
      <h1 className="text-4xl font-extrabold text-emerald-700 mb-6">Ota yhteyttä</h1>
      <p className="max-w-2xl text-neutral-700 text-lg leading-relaxed mb-8">
        Onko sinulla kysyttävää tai palautetta? Lähetä meille viesti — kuulemme mielellämme sinusta! 💬
      </p>
      <form className="flex flex-col gap-4 w-full max-w-md">
        <input
          type="text"
          placeholder="Nimi"
          className="input rounded-xl border border-emerald-200 px-4 py-2 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
        />
        <input
          type="email"
          placeholder="Sähköposti"
          className="input rounded-xl border border-emerald-200 px-4 py-2 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
        />
        <textarea
          placeholder="Viesti"
          rows={4}
          className="input rounded-xl border border-emerald-200 px-4 py-2 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
        ></textarea>
        <button
          type="submit"
          className="bg-emerald-500 text-white font-semibold py-2 rounded-xl hover:bg-emerald-600 transition"
        >
          Lähetä viesti
        </button>
      </form>
    </main>
  );
}