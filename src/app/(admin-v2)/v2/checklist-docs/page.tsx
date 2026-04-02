import { createMeta } from "@/lib/seo";

export const metadata = createMeta({
  title: "Manage Checklist Docs",
  description: "Manage checklist document templates and requirements.",
  noIndex: true,
});

export default function ChecklistDocsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-medium text-foreground">
          Manage Checklist Docs
        </h1>
        <p className="text-sm text-muted-foreground">
          This page is ready for the checklist docs management UI.
        </p>
      </div>
    </main>
  );
}

