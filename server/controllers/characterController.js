const Character = require('../models/Character');

exports.createCharacter = async (req, res) => {
  try {
    const character = new Character(req.body);
    await character.save();
    
    // Calculate HP and AC
    const hitPoints = character.calculateHitPoints();
    const armorClass = character.calculateArmorClass();
    
    // Add calculated fields to response
    const characterResponse = character.toObject();
    characterResponse.hitPoints = hitPoints;
    characterResponse.armorClass = armorClass;
    
    res.status(201).json(characterResponse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getCharacter = async (req, res) => {
  try {
    const character = await Character.findById(req.params.id);
    if (!character) {
      return res.status(404).json({ message: 'Character not found' });
    }
    
    // Calculate HP and AC
    const hitPoints = character.calculateHitPoints();
    const armorClass = character.calculateArmorClass();
    
    // Add calculated fields to response
    const characterResponse = character.toObject();
    characterResponse.hitPoints = hitPoints;
    characterResponse.armorClass = armorClass;
    
    res.json(characterResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCharacter = async (req, res) => {
  try {
    const character = await Character.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!character) {
      return res.status(404).json({ message: 'Character not found' });
    }
    
    // Calculate HP and AC
    const hitPoints = character.calculateHitPoints();
    const armorClass = character.calculateArmorClass();
    
    // Add calculated fields to response
    const characterResponse = character.toObject();
    characterResponse.hitPoints = hitPoints;
    characterResponse.armorClass = armorClass;
    
    res.json(characterResponse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteCharacter = async (req, res) => {
  try {
    const character = await Character.findByIdAndDelete(req.params.id);
    if (!character) {
      return res.status(404).json({ message: 'Character not found' });
    }
    res.json({ message: 'Character deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 