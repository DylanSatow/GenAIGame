const OpenAI = require('openai');
const Character = require('../models/Character');
const mongoose = require('mongoose');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Define Game State Schema
const gameStateSchema = new mongoose.Schema({
  characterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Character', required: true },
  character: { type: Object, required: true },
  currentScene: { type: String },
  inventory: [{ type: Object }],
  gameHistory: [{
    type: { type: String, required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  lastAction: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const GameState = mongoose.model('GameState', gameStateSchema);

class GameService {
  async startNewGame(characterId) {
    const character = await Character.findById(characterId);
    if (!character) {
      throw new Error('Character not found');
    }

    // Convert Mongoose document to plain object
    const characterObj = character.toObject();

    // Check if there's an existing game state
    let gameState = await GameState.findOne({ characterId });
    
    if (!gameState) {
      // Create new game state
      gameState = new GameState({
        characterId,
        character: characterObj,
        currentScene: null,
        inventory: characterObj.inventory || [],
        gameHistory: [],
        lastAction: null
      });
    } else {
      // Reset existing game state
      gameState.currentScene = null;
      gameState.gameHistory = [];
      gameState.lastAction = null;
      gameState.updatedAt = new Date();
    }

    // Generate initial scene
    const initialPrompt = this.generateInitialPrompt(characterObj);
    const response = await this.getAIResponse(initialPrompt);
    
    gameState.currentScene = response;
    gameState.gameHistory.push({
      type: 'scene',
      content: response,
      timestamp: new Date()
    });

    await gameState.save();
    return gameState.toObject();
  }

  async handlePlayerAction(characterId, action) {
    const gameState = await GameState.findOne({ characterId });
    if (!gameState) {
      throw new Error('No active game found');
    }

    // Add player action to history
    gameState.gameHistory.push({
      type: 'player_action',
      content: action,
      timestamp: new Date()
    });

    // Determine if an ability check is needed
    const checkInfo = this.determineAbilityCheck(action, gameState.character);
    if (checkInfo) {
      // Add ability check information to game history
      gameState.gameHistory.push({
        type: 'ability_check',
        content: `Making a ${checkInfo.ability} check (DC ${checkInfo.dc}) with modifier ${checkInfo.modifier}`,
        timestamp: new Date()
      });
    }

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
    gameState.updatedAt = new Date();

    await gameState.save();
    return gameState.toObject();
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
    
    // Determine if the action requires an ability check
    const checkInfo = this.determineAbilityCheck(action, character);
    
    return `You are a Dungeon Master for a D&D 5e game. The current scene is:
    ${currentScene}
    
    The player's character (${character.name}, ${character.race} ${character.class}) has chosen to:
    ${action}
    
    ${checkInfo ? `This action requires a ${checkInfo.ability} check (DC ${checkInfo.dc}). The character's modifier is ${checkInfo.modifier}.` : ''}
    
    Respond to this action by:
    1. Describing the outcome of the action
    2. Updating the scene
    3. Presenting 2-3 new possible actions
    
    Keep the response concise and engaging.`;
  }

  determineAbilityCheck(action, character) {
    // Convert action to lowercase for easier matching
    const actionLower = action.toLowerCase();
    
    // Define common ability check patterns
    const checkPatterns = {
      strength: [
        'lift', 'push', 'pull', 'break', 'force', 'carry', 'climb', 'jump',
        'wrestle', 'grapple', 'throw', 'carry', 'drag'
      ],
      dexterity: [
        'dodge', 'sneak', 'hide', 'steal', 'lockpick', 'disarm', 'acrobatics',
        'balance', 'move silently', 'pick pocket', 'tumble', 'escape'
      ],
      constitution: [
        'endure', 'resist', 'withstand', 'survive', 'hold breath', 'resist poison',
        'resist disease', 'resist exhaustion'
      ],
      intelligence: [
        'investigate', 'research', 'analyze', 'study', 'recall', 'remember',
        'decipher', 'solve', 'figure out', 'understand'
      ],
      wisdom: [
        'perceive', 'notice', 'sense', 'track', 'survival', 'insight',
        'meditate', 'observe', 'spot', 'listen'
      ],
      charisma: [
        'persuade', 'deceive', 'intimidate', 'perform', 'bargain', 'negotiate',
        'convince', 'lie', 'bluff', 'charm', 'seduce'
      ]
    };

    // Determine which ability check is needed
    let ability = null;
    let dc = 10; // Default DC

    for (const [abilityName, patterns] of Object.entries(checkPatterns)) {
      if (patterns.some(pattern => actionLower.includes(pattern))) {
        ability = abilityName;
        // Adjust DC based on action complexity
        if (actionLower.includes('very') || actionLower.includes('extremely')) {
          dc = 15;
        } else if (actionLower.includes('nearly impossible') || actionLower.includes('impossible')) {
          dc = 20;
        }
        break;
      }
    }

    if (ability) {
      const modifier = Math.floor((character.stats[ability] - 10) / 2);
      return { ability, dc, modifier };
    }

    return null;
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

  async endGame(characterId) {
    await GameState.findOneAndDelete({ characterId });
  }

  async getGameState(characterId) {
    const gameState = await GameState.findOne({ characterId });
    if (!gameState) {
      throw new Error('No active game found');
    }
    return gameState.toObject();
  }
}

module.exports = new GameService(); 