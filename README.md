# BillBoardBit

A simple, minimal billboard application built on Nostr where users can list themselves to receive zaps and messages from the community.

## Features

- **Simple Login**: Connect with your Nostr account using browser extensions or private key
- **Billboard List**: Add yourself to a public list visible to all users
- **Profile Pages**: Each user gets a dedicated page with QR code for easy sharing
- **Zap Integration**: Receive Lightning Network zaps with messages
- **Real-time Updates**: See zaps and messages as they arrive

## How It Works

1. **Login**: Connect your Nostr account
2. **Add to Billboard**: Click "Add to List" to include yourself in the public billboard
3. **Share**: Share your profile link or QR code with supporters
4. **Receive**: Get zaps with messages from the community

## Technology

- Built with React 18, TypeScript, and Vite
- Uses Nostr protocol for decentralized identity and messaging
- Lightning Network integration for instant payments
- Responsive design with TailwindCSS
- Custom kind 30078 events for billboard entries

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

## Nostr Integration

This application uses:
- **Kind 30078**: Billboard entries with tag "BillBoardBit"
- **Kind 9735**: Zap receipts for displaying received payments
- **NIP-19**: Profile links and addresses
- **NIP-57**: Lightning Network zaps

See [NIP.md](./NIP.md) for detailed technical specifications.

## License

Open source - feel free to fork and customize for your community!