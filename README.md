# AI Dungeon Master

An AI-powered Dungeons & Dragons game that serves as an interactive portfolio piece. This game features an AI Dungeon Master that creates dynamic stories and responds to player choices in real-time.

## Features

- Character creation with D&D 5e stats
- AI-powered storytelling and narrative generation
- Interactive decision-making
- Basic combat system
- Character inventory and stat tracking
- Real-time updates using WebSocket

## Tech Stack

- Frontend: React with TypeScript
- Backend: Node.js with Express
- Database: MongoDB
- AI: OpenAI GPT API
- Styling: Tailwind CSS
- Real-time Communication: Socket.IO

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   cd client && npm install
   ```
3. Create a `.env` file in the root directory with:
   ```
   MONGODB_URI=your_mongodb_uri
   OPENAI_API_KEY=your_openai_api_key
   PORT=3001
   ```
4. Start the development server:
   ```bash
   npm run dev:full
   ```

## Project Structure

```
ai-dungeon-master/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/        # Page components
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Utility functions
├── server/                # Node.js backend
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   └── utils/            # Utility functions
└── package.json
```

## Contributing

This is a portfolio project. Feel free to fork and modify for your own use.

## License

MIT 