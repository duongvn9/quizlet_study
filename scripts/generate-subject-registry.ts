import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { subjectSchema } from "../src/domain/subjects/schemas";

const dir = join(process.cwd(), "src/data/subjects");
const files = readdirSync(dir).filter((file) => file.endsWith(".json")).sort();
const ids = new Set<string>();
const slugs = new Set<string>();
const normalizedFiles = new Set<string>();

for (const file of files) {
  if (!/^[a-z0-9-]+\.json$/.test(file)) throw new Error(`Invalid subject filename: ${file}`);
  const normalized = file.toLowerCase();
  if (normalizedFiles.has(normalized)) throw new Error(`Duplicate canonical filename: ${file}`);
  normalizedFiles.add(normalized);
  const subject = subjectSchema.parse(JSON.parse(readFileSync(join(dir, file), "utf8")));
  if (subject.slug !== basename(file, ".json")) throw new Error(`Filename and slug mismatch: ${file} != ${subject.slug}`);
  if (ids.has(subject.id)) throw new Error(`Duplicate subject id: ${subject.id}`);
  if (slugs.has(subject.slug)) throw new Error(`Duplicate subject slug: ${subject.slug}`);
  ids.add(subject.id);
  slugs.add(subject.slug);
}

const imports = files.map((file, index) => `import subject${index} from "../subjects/${file}";`).join("\n");
const names = files.map((_, index) => `subject${index}`);
const output = `${imports}\nimport { subjectSchema } from "@/domain/subjects/schemas";\nimport type { Subject } from "@/domain/subjects/types";\nexport const subjects: Subject[] = [${names.join(",")}].map(value => subjectSchema.parse(value));\nexport const subjectsBySlug = Object.fromEntries(subjects.map(subject => [subject.slug, subject])) as Record<string, Subject>;\nexport const subjectSlugs = subjects.map(subject => subject.slug);\nexport const getSubject = (slug: string) => subjectsBySlug[slug];\n`;
writeFileSync(join(process.cwd(), "src/data/generated/subjects.generated.ts"), output);
console.log(`Generated registry for ${files.length} subject(s)`);
