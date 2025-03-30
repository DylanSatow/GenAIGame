const express = require('express');
const router = express.Router();
const gameService = require('../services/gameService');

// Start a new game with a character
router.post('/start/:characterId', async (req, res) => {
  try {
    const gameState = await gameService.startNewGame(req.params.characterId);
    res.json(gameState);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Handle player action
router.post('/action/:characterId', async (req, res) => {
  try {
    const { action } = req.body;
    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }
    const gameState = await gameService.handlePlayerAction(req.params.characterId, action);
    res.json(gameState);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// End game
router.post('/end/:characterId', (req, res) => {
  try {
    gameService.endGame(req.params.characterId);
    res.json({ message: 'Game ended successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get current game state
router.get('/state/:characterId', (req, res) => {
  try {
    const gameState = gameService.activeGames.get(req.params.characterId);
    if (!gameState) {
      return res.status(404).json({ error: 'No active game found' });
    }
    res.json(gameState);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 