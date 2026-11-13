// Derive a readable course ("vak") and lesson type from Avans titles like "J34KM AI Skillslab ws".

const TYPE_RULES: Array<[RegExp, string]> = [
  [/\bherkansing\b/i, "Herkansing"],
  [/\bgastcollege\b/i, "Gastcollege"],
  [/\bprojectbeg\b/i, "Projectbegeleiding"],
  [/\bpresenteren\b/i, "Presentatie"],
  [/\bPOG\b/, "POG"],
  [/\bws\b/i, "Workshop"],
  [/\bwc\b/i, "Werkcollege"],
  [/\bhc\b/i, "Hoorcollege"],
  [/\bpracticum\b/i, "Practicum"],
  [/\btentamen\b/i, "Tentamen"],
];

const STRIP_TOKENS = /\b(herkansing|gastcollege|projectbeg|presenteren|POG|ws|wc|hc)\b/gi;
const CODE_PREFIX = /^([A-Z0-9]{3,10})\s+(?=\S)/;

export function courseCode(title: string): string | null {
  const m = CODE_PREFIX.exec(title);
  return m && /\d/.test(m[1] ?? "") ? (m[1] ?? null) : null;
}

export function courseName(title: string): string {
  const code = courseCode(title);
  const withoutCode = code ? title.slice(code.length) : title;
  const name = withoutCode.replace(STRIP_TOKENS, " ").replace(/\s+/g, " ").trim();
  return name || title.trim();
}

export function lessonType(title: string): string | null {
  for (const [re, label] of TYPE_RULES) if (re.test(title)) return label;
  return null;
}

export type Tone = "violet" | "azure" | "lime" | "ink";
const TONES: Tone[] = ["violet", "azure", "lime", "ink"];

export function courseTone(name: string): Tone {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length] ?? "ink";
}

export const toneClasses: Record<Tone, { bar: string; soft: string; text: string }> = {
  violet: { bar: "bg-violet", soft: "bg-violet-soft", text: "text-violet" },
  azure: { bar: "bg-azure", soft: "bg-azure-soft", text: "text-azure" },
  lime: { bar: "bg-lime", soft: "bg-lime-soft", text: "text-success" },
  ink: { bar: "bg-primary", soft: "bg-secondary", text: "text-foreground" },
};

