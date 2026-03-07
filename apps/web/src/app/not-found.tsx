export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">404</p>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Страница не найдена</h1>
      <p className="max-w-xl text-sm text-muted-foreground">
        Проверь адрес или вернись к навигации приложения.
      </p>
    </main>
  );
}
