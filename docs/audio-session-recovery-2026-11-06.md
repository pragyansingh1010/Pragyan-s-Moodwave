## Audio session recovery

- Handle media errors without leaving the player in a false playing state.
- Keep the active track identity when retrying a failed source.
- Reset progress only when a new track is actually loaded.
- Provide a visible retry path for recoverable failures.
- Keep queue navigation usable after a playback error.