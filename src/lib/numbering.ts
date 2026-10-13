/**
 * Hierarchical numbering (1, 1.1, 1.2, 2 ...) for a mind map tree.
 *
 * The prefix applied to each topic is remembered by uid, so turning numbering off or renumbering
 * removes exactly what we added and never touches text that merely looks like a number
 * ("2024 roadmap", "A plan"). Works on plain text and on rich-text HTML (the prefix goes after
 * any leading tags).
 */
export type NumberPrefixes = Map<string, string>;

const leadingTags = (text: string) => /^(?:\s*<[^>]+>)*/.exec(text)![0];

export function addPrefix(text: string, prefix: string): string {
  const lead = leadingTags(text);
  return `${lead}${prefix} ${text.slice(lead.length)}`;
}

export function removePrefix(text: string, prefix: string | undefined): string {
  if (!prefix) return text;
  const lead = leadingTags(text);
  const rest = text.slice(lead.length);
  return rest.startsWith(`${prefix} `) ? lead + rest.slice(prefix.length + 1) : text;
}

/**
 * Mutates `tree` in place. `previous` holds the prefixes applied by the last call; the returned
 * map holds the prefixes applied now (empty when `enable` is false). The root is never numbered.
 */
export function applyNumbering(tree: any, enable: boolean, previous: NumberPrefixes): NumberPrefixes {
  const applied: NumberPrefixes = new Map();

  const visit = (node: any, prefix: string) => {
    if (!node.data) node.data = {};
    const uid: string | undefined = node.data.uid;
    let text = removePrefix(node.data.text || '', uid ? previous.get(uid) : undefined);
    if (enable && prefix && uid) {
      text = addPrefix(text, prefix);
      applied.set(uid, prefix);
    }
    node.data.text = text;
    if (Array.isArray(node.children)) {
      node.children.forEach((child: any, idx: number) => visit(child, prefix ? `${prefix}.${idx + 1}` : `${idx + 1}`));
    }
  };

  if (tree && Array.isArray(tree.children)) {
    tree.children.forEach((child: any, idx: number) => visit(child, `${idx + 1}`));
  }
  return applied;
}
