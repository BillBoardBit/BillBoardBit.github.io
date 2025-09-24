# BillBoardBit NIP

## BillBoardBit Custom Events

This NIP defines the custom events used by the BillBoardBit application for managing a community billboard where users can list themselves to receive zaps and messages.

### BillBoardBit Entry (kind 30078)

A **billboard entry** is a parameterized replaceable event (kind 30078) that represents a user's entry in the BillBoardBit system.

#### Tags

- `d` - The user's pubkey (used as the unique identifier)
- `t` - Set to "BillBoardBit" to identify this as a billboard entry
- `alt` - Human-readable description of the event

#### Content

The content is a JSON object with the following optional fields:

```json
{
  "npub": "<user's npub1... address>",
  "displayName": "<optional display name>",
  "addedAt": <unix timestamp when added>
}
```

#### Example

```json
{
  "kind": 30078,
  "content": "{\"npub\":\"npub1abc123...\",\"displayName\":\"Alice\",\"addedAt\":1703123456}",
  "tags": [
    ["d", "user_pubkey_hex"],
    ["t", "BillBoardBit"],
    ["alt", "Billboard entry for collecting donations"]
  ],
  "pubkey": "user_pubkey_hex",
  "created_at": 1703123456,
  "sig": "..."
}
```

#### Usage

Users can add themselves to the billboard by publishing this event. To remove themselves, they publish the same event structure with empty content (`""`).

The application queries for these events using:

```json
{
  "kinds": [30078],
  "#t": ["BillBoardBit"],
  "limit": 1000
}
```

### Profile Pages and Zap Integration

When users click on a billboard entry, they are redirected to a profile page at `/{npub}` where they can:

1. View the user's Nostr profile information
2. See a QR code linking to the profile page
3. Send zaps with messages using existing Nostr zap infrastructure (NIP-57)
4. View received zaps and messages in chronological order

### Implementation Notes

- Uses existing Nostr infrastructure for zaps (kind 9735 zap receipts)
- Compatible with standard Nostr clients for profile viewing
- QR codes link to the profile page for easy sharing
- Minimal and focused on the core billboard functionality