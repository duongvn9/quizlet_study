import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { adaptFeSwd392 } from "../src/domain/subjects/fe-swd392-adapter";
import { adaptMln122 } from "../src/domain/subjects/mln122-adapter";
import { adaptMma301 } from "../src/domain/subjects/mma301-adapter";
import { subjectSchema } from "../src/domain/subjects/schemas";

const dir = join(process.cwd(), "src/data/subjects");
const adapters = {
  "fe-swd392.json": adaptFeSwd392,
  "mln122.json": adaptMln122,
  "mma301.json": adaptMma301,
  "swd392.json": subjectSchema.parse
} as const;
const jsonFiles = readdirSync(dir).filter((file) => file.endsWith(".json")).sort();
const unknownFiles = jsonFiles.filter((file) => !(file in adapters));
if (unknownFiles.length) throw new Error(`Unregistered subject JSON: ${unknownFiles.join(", ")}`);
const files = Object.keys(adapters).sort() as (keyof typeof adapters)[];
const ids = new Set<string>();
const slugs = new Set<string>();
const normalizedFiles = new Set<string>();
const subjects = files.map((file) => {
  if (!/^[a-z0-9-]+\.json$/.test(file)) throw new Error(`Invalid subject filename: ${file}`);
  const normalized = file.toLowerCase();
  if (normalizedFiles.has(normalized)) throw new Error(`Duplicate canonical filename: ${file}`);
  normalizedFiles.add(normalized);
  const value = JSON.parse(readFileSync(join(dir, file), "utf8"));
  const subject = adapters[file](value);
  if (subject.slug !== basename(file, ".json")) throw new Error(`Filename and slug mismatch: ${file} != ${subject.slug}`);
  if (ids.has(subject.id)) throw new Error(`Duplicate subject id: ${subject.id}`);
  if (slugs.has(subject.slug)) throw new Error(`Duplicate subject slug: ${subject.slug}`);
  ids.add(subject.id);
  slugs.add(subject.slug);
  return subject;
});

const imports = files.map((file, index) => `import subject${index} from "../subjects/${file}";`).join("\n");
const adapterImports = `import { adaptFeSwd392 } from "@/domain/subjects/fe-swd392-adapter";\nimport { adaptMln122 } from "@/domain/subjects/mln122-adapter";\nimport { adaptMma301 } from "@/domain/subjects/mma301-adapter";\nimport { subjectSchema } from "@/domain/subjects/schemas";`;
const generatedAdapters = {
  "fe-swd392.json": "adaptFeSwd392",
  "mln122.json": "adaptMln122",
  "mma301.json": "adaptMma301",
  "swd392.json": "subjectSchema.parse"
} satisfies Record<keyof typeof adapters, string>;
const expressions = files.map((file, index) => `${generatedAdapters[file]}(subject${index})`);
const output = `${imports}\n${adapterImports}\nimport type { Subject } from "@/domain/subjects/types";\nexport const subjects: Subject[] = [${expressions.join(",")}];\nexport const subjectsBySlug = Object.fromEntries(subjects.map(subject => [subject.slug, subject])) as Record<string, Subject>;\nexport const subjectSlugs = subjects.map(subject => subject.slug);\nexport const getSubject = (slug: string) => subjectsBySlug[slug];\n`;
writeFileSync(join(process.cwd(), "src/data/generated/subjects.generated.ts"), output);
console.log(`Generated registry for ${subjects.length} subject(s)`);
