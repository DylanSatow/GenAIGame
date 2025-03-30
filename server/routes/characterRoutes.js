const express = require('express');
const router = express.Router();
const Character = require('../models/Character');

// Create a new character
router.post('/', async (req, res) => {
  try {
    const character = new Character(req.body);
    await character.save();
    res.status(201).json(character);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all characters
router.get('/', async (req, res) => {
  try {
    const characters = await Character.find();
    res.json(characters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific character
router.get('/:id', async (req, res) => {
  try {
    const character = await Character.findById(req.params.id);
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }
    res.json(character);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a character
router.put('/:id', async (req, res) => {
  try {
    const character = await Character.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }
    res.json(character);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a character
router.delete('/:id', async (req, res) => {
  try {
    const character = await Character.findByIdAndDelete(req.params.id);
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }
    res.json({ message: 'Character deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 