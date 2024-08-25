import { NDKEvent } from "@nostr-dev-kit/ndk";
import { HashTagFilter } from "./HashTagFilter";

describe('HashTagFilter', () => {
  describe('notHashTags', () => {
    const filter = HashTagFilter.notHashTags(['test', 'mute']);

    it('should return true for events without hashtags', () => {
      const event = { content: 'This is a normal post' } as NDKEvent;
      expect(filter(event, 0, [])).toBe(true);
    });

    it('should return false for events with muted hashtags', () => {
      const event = { content: 'This post contains a #test hashtag' } as NDKEvent;
      expect(filter(event, 0, [])).toBe(false);
    });

    it('should return true for events with non-muted hashtags', () => {
      const event = { content: 'This post contains a #allowed hashtag' } as NDKEvent;
      expect(filter(event, 0, [])).toBe(true);
    });

    it('should be case-insensitive', () => {
      const event = { content: 'This post contains a #TEST hashtag' } as NDKEvent;
      expect(filter(event, 0, [])).toBe(false);
    });

    it('should return true for events with undefined content', () => {
      const event = {  } as NDKEvent;
      expect(filter(event, 0, [])).toBe(true);
    });
  });
});