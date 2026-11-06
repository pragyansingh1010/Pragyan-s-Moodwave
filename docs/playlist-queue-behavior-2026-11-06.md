## Playlist queue behavior

- Keep the active track index aligned with the queue after a track is removed.
- Define whether adding a track appends it or plays it immediately.
- Handle an empty queue without leaving stale track metadata on screen.
- Preserve the current playback position when queue metadata changes.
- Verify next and previous actions at both queue boundaries.