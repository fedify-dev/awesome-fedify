import { fromMarkdown } from "npm:mdast-util-from-markdown@2.0.2";
import { toString } from "npm:mdast-util-to-string@4.0.0";
import type {
  Definition,
  Heading,
  Link,
  LinkReference,
  List,
  ListItem,
  Node,
  Paragraph,
  PhrasingContent,
  Root,
} from "npm:@types/mdast@4.0.4";

const README_PATH = new URL("../README.md", import.meta.url);
const STYLES_PATH = new URL("../site/styles.css", import.meta.url);
const LOGO_PATH = new URL("../site/logo.svg", import.meta.url);
const DIST_PATH = new URL("../dist/", import.meta.url);

const REPOSITORY_URL = "https://github.com/fedify-dev/awesome-fedify";
const CONTRIBUTING_URL = `${REPOSITORY_URL}/blob/main/CONTRIBUTING.md`;

type Entry = {
  title: string;
  url: string;
  description: string;
  languages: string[];
};

type Section = {
  id: string;
  title: string;
  entries: Entry[];
};

const markdown = await Deno.readTextFile(README_PATH);
const styles = await Deno.readTextFile(STYLES_PATH);
const tree = fromMarkdown(markdown) as Root;
const references = collectDefinitions(tree);

const titleNode = tree.children.find((node): node is Heading =>
  node.type === "heading" && node.depth === 1
);
const pageTitle = titleNode ? toString(titleNode) : "Awesome Fedify";
const intro = extractIntroParagraphs(tree, references);
const sections = extractSections(tree, references).filter((section) => section.entries.length > 0);
const totalEntries = sections.reduce((sum, section) => sum + section.entries.length, 0);

await Deno.mkdir(DIST_PATH, { recursive: true });
await Deno.writeTextFile(
  new URL("index.html", DIST_PATH),
  renderHtml({ pageTitle, intro, sections, totalEntries }),
);
await Deno.writeTextFile(new URL("styles.css", DIST_PATH), styles);
await Deno.copyFile(LOGO_PATH, new URL("logo.svg", DIST_PATH));

function collectDefinitions(root: Root): Map<string, string> {
  const definitions = new Map<string, string>();
  for (const node of root.children) {
    if (node.type === "definition") {
      definitions.set(node.identifier.toLowerCase(), node.url);
    }
  }
  return definitions;
}

function extractIntroParagraphs(root: Root, references: Map<string, string>): string[] {
  const paragraphs: string[] = [];
  let seenTitle = false;

  for (const node of root.children) {
    if (!seenTitle) {
      seenTitle = node.type === "heading" && node.depth === 1;
      continue;
    }
    if (node.type === "heading" && node.depth === 2) break;
    if (node.type !== "paragraph") continue;
    paragraphs.push(renderInline(node.children, references));
  }

  return paragraphs;
}

function extractSections(root: Root, references: Map<string, string>): Section[] {
  const sections: Section[] = [];
  let currentTitle: string | null = null;
  let currentEntries: Entry[] = [];

  const flush = () => {
    if (currentTitle === null || currentTitle === "Contributing") return;
    sections.push({
      id: slugify(currentTitle),
      title: currentTitle,
      entries: currentEntries,
    });
  };

  for (const node of root.children) {
    if (node.type === "heading" && node.depth === 2) {
      flush();
      currentTitle = toString(node);
      currentEntries = [];
      continue;
    }
    if (currentTitle === null) continue;
    if (node.type === "list") {
      currentEntries.push(...parseList(node, references));
    }
  }

  flush();
  return sections;
}

function parseList(list: List, references: Map<string, string>): Entry[] {
  return list.children.map((item) => parseListItem(item, references)).filter((entry): entry is Entry => entry !== null);
}

function parseListItem(item: ListItem, references: Map<string, string>): Entry | null {
  const paragraph = item.children.find((child): child is Paragraph => child.type === "paragraph");
  if (!paragraph) return null;

  const linkIndex = paragraph.children.findIndex((child) => child.type === "linkReference" || child.type === "link");
  if (linkIndex < 0) return null;

  const linkNode = paragraph.children[linkIndex] as LinkReference | Link;
  const title = toString(linkNode);
  const url = resolveUrl(linkNode, references);
  if (!url) {
    throw new Error(`Missing URL for ${title}`);
  }

  const trailingText = paragraph.children.slice(linkIndex + 1).map((child) => toString(child)).join("");
  const match = trailingText.match(/^\s*(?:\(([^)]+)\))?(?::\s*(.+))?\s*$/);
  const languages = match?.[1]
    ? match[1].split(",").map((language) => language.trim()).filter(Boolean)
    : [];
  const description = match?.[2]?.trim() ?? "";

  return { title, url, description, languages };
}

function resolveUrl(node: LinkReference | Link, references: Map<string, string>): string | null {
  if (node.type === "link") return node.url;
  return references.get(node.identifier.toLowerCase()) ?? null;
}

function renderHtml(
  { pageTitle, intro, sections, totalEntries }: {
    pageTitle: string;
    intro: string[];
    sections: Section[];
    totalEntries: number;
  },
): string {
  const nav = sections.map((section) =>
    `<li><a href="#${section.id}">${escapeHtml(section.title)}</a></li>`
  ).join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(pageTitle)}</title>
    <meta
      name="description"
      content="A curated directory of Fedify projects, packages, examples, tutorials, and talks."
    >
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
      href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
      rel="stylesheet"
    >
    <link rel="icon" href="./logo.svg" type="image/svg+xml">
    <link rel="stylesheet" href="./styles.css">
  </head>
  <body>
    <div class="site-shell">
      <header class="hero">
        <a class="brand" href="${REPOSITORY_URL}">
          <img src="./logo.svg" alt="Fedify logo" width="72" height="72">
          <div class="brand-copy">
            <p class="eyebrow">Fedify directory</p>
            <h1>${escapeHtml(pageTitle)}</h1>
          </div>
        </a>
        <div class="hero-grid">
          <div class="hero-copy">
            ${intro.map((paragraph) => `<p>${paragraph}</p>`).join("\n")}
          </div>
          <dl class="hero-stats" aria-label="Site summary">
            <div>
              <dt>Categories</dt>
              <dd>${sections.length}</dd>
            </div>
            <div>
              <dt>Entries</dt>
              <dd>${totalEntries}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd><a href="${REPOSITORY_URL}/blob/main/README.md">README.md</a></dd>
            </div>
          </dl>
        </div>
      </header>

      <div class="content-grid">
        <aside class="page-nav" aria-label="Sections">
          <div class="page-nav__inner">
            <p class="page-nav__title">Sections</p>
            <ol>
              ${nav}
            </ol>
            <p class="page-nav__note">
              Edit the list in
              <a href="${REPOSITORY_URL}/blob/main/README.md">README.md</a>.
            </p>
          </div>
        </aside>

        <main class="sections">
          ${sections.map(renderSection).join("\n")}
        </main>
      </div>

      <footer class="site-footer">
        <p>
          This site is generated from
          <a href="${REPOSITORY_URL}/blob/main/README.md">README.md</a>.
          Contribution guidelines live in
          <a href="${CONTRIBUTING_URL}">CONTRIBUTING.md</a>.
        </p>
      </footer>
    </div>
  </body>
</html>`;
}

function renderSection(section: Section): string {
  return `<section class="section-panel" id="${section.id}">
  <div class="section-heading">
    <p class="section-index">${String(section.entries.length).padStart(2, "0")}</p>
    <h2>${escapeHtml(section.title)}</h2>
  </div>
  <ul class="entry-list">
    ${section.entries.map(renderEntry).join("\n")}
  </ul>
</section>`;
}

function renderEntry(entry: Entry): string {
  const languages = entry.languages.length === 0
    ? ""
    : `<ul class="entry-languages">${entry.languages.map((language) =>
      `<li>${escapeHtml(language)}</li>`
    ).join("")}</ul>`;
  const description = entry.description
    ? `<p class="entry-description">${escapeHtml(entry.description)}</p>`
    : "";
  const titleClass = entry.title.startsWith("@fedify/") ? " entry-link--package" : "";

  return `<li class="entry-card">
  <a class="entry-link${titleClass}" href="${escapeAttribute(entry.url)}">${escapeHtml(entry.title)}</a>
  ${languages}
  ${description}
</li>`;
}

function renderInline(children: PhrasingContent[], references: Map<string, string>): string {
  return children.map((child) => renderInlineNode(child, references)).join("");
}

function renderInlineNode(node: PhrasingContent, references: Map<string, string>): string {
  switch (node.type) {
    case "text":
      return escapeHtml(node.value);
    case "inlineCode":
      return `<code>${escapeHtml(node.value)}</code>`;
    case "emphasis":
      return `<em>${renderInline(node.children, references)}</em>`;
    case "strong":
      return `<strong>${renderInline(node.children, references)}</strong>`;
    case "link":
      return `<a href="${escapeAttribute(node.url)}">${renderInline(node.children, references)}</a>`;
    case "linkReference": {
      const href = references.get(node.identifier.toLowerCase());
      const content = escapeHtml(toString(node));
      return href ? `<a href="${escapeAttribute(href)}">${content}</a>` : content;
    }
    case "delete":
      return `<del>${renderInline(node.children, references)}</del>`;
    case "break":
      return "<br>";
    default:
      return escapeHtml(toString(node as Node));
  }
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}
