const OpenAI = require('openai');
const Character = require('../models/Character');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class GameService {
  constructor() {
    this.activeGames = new Map();
  }

  async startNewGame(characterId) {
    const character = await Character.findById(characterId);
    if (!character) {
      throw new Error('Character not found');
    }

    const gameState = {
      character,
      currentScene: null,
      inventory: [],
      gameHistory: [],
      lastAction: null
    };

    this.activeGames.set(characterId, gameState);
    
    // Generate initial scene
    const initialPrompt = this.generateInitialPrompt(character);
    const response = await this.getAIResponse(initialPrompt);
    
    gameState.currentScene = response;
    gameState.gameHistory.push({
      type: 'scene',
      content: response,
      timestamp: new Date()
    });

    return gameState;
  }

  async handlePlayerAction(characterId, action) {
    const gameState = this.activeGames.get(characterId);
    if (!gameState) {
      throw new Error('No active game found');
    }

    // Add player action to history
    gameState.gameHistory.push({
      type: 'player_action',
      content: action,
      timestamp: new Date()
    });

    // Generate AI response based on action and game state
    const prompt = this.generateActionPrompt(gameState, action);
    const response = await this.getAIResponse(prompt);

    // Update game state
    gameState.lastAction = action;
    gameState.currentScene = response;
    gameState.gameHistory.push({
      type: 'scene',
      content: response,
      timestamp: new Date()
    });

    return gameState;
  }

  generateInitialPrompt(character) {
    return `You are a Dungeon Master for a D&D 5e game. The player's character is:
    Name: ${character.name}
    Race: ${character.race}
    Class: ${character.class}
    Level: ${character.level}
    
    Create an engaging opening scene for this character. Include:
    1. A brief description of the setting
    2. A situation that requires the character's attention
    3. 2-3 possible actions the character could take
    
    Keep the response concise and engaging.`;
  }

  generateActionPrompt(gameState, action) {
    const { character, currentScene, gameHistory } = gameState;
    
    return `You are a Dungeon Master for a D&D 5e game. The current scene is:
    ${currentScene}
    
    The player's character (${character.name}, ${character.race} ${character.class}) has chosen to:
    ${action}
    
    Respond to this action by:
    1. Describing the outcome of the action
    2. Updating the scene
    3. Presenting 2-3 new possible actions
    
    Keep the response concise and engaging.`;
  }

  async getAIResponse(prompt) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an experienced Dungeon Master running a D&D 5e game. Keep responses concise, engaging, and focused on storytelling."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error getting AI response:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  endGame(characterId) {
    this.activeGames.delete(characterId);
  }
}

module.exports = new GameService(); 