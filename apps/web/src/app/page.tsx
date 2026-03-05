import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-start justify-center gap-4 p-6">
      <h1 className="text-3xl font-semibold tracking-tight">go360go</h1>
      <p className="text-muted-foreground">Staging: beta.go360go.ru</p>
      <Button>UI foundation ready</Button>
    </main>
  );
}
