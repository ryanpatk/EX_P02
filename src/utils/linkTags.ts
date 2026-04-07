import { LinkWithTag, Tag } from '../types/database';

export function getTagsForLink(link: LinkWithTag): Tag[] {
  if (link.tags && link.tags.length > 0) {
    return link.tags;
  }

  const tagMap = new Map<string, Tag>();
  if (link.tag) {
    tagMap.set(link.tag.id, link.tag);
  }
  if (link.link_tags) {
    link.link_tags.forEach((linkTag) => {
      if (linkTag.tag) {
        tagMap.set(linkTag.tag.id, linkTag.tag);
      }
    });
  }
  return Array.from(tagMap.values());
}

export function getTagIdsForLink(link: LinkWithTag): string[] {
  return getTagsForLink(link).map((t) => t.id);
}
