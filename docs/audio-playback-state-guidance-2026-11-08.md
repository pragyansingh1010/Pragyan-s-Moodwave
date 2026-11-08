# Audio Playback State Guidance

Date: 2026-11-08

## Purpose

Define consistent expected behavior for audio playback state guidance in this project.

## Expected behavior

- Validate user input before changing application state.
- Keep feedback clear, specific, and accessible.
- Preserve existing data and unrelated UI state during updates.
- Handle empty, invalid, and failed states without breaking the main workflow.

## Verification checklist

- [ ] Test a normal valid case.
- [ ] Test empty and invalid input.
- [ ] Confirm the interface communicates the result.
- [ ] Confirm existing project behavior remains unchanged.
