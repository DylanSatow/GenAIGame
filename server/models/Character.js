const mongoose = require('mongoose');

const characterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  race: {
    type: String,
    required: true,
    enum: ['Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling']
  },
  class: {
    type: String,
    required: true,
    enum: ['Fighter', 'Wizard', 'Rogue', 'Cleric', 'Ranger', 'Paladin', 'Barbarian', 'Bard', 'Druid', 'Monk', 'Warlock']
  },
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: 20
  },
  stats: {
    strength: { type: Number, required: true, min: 3, max: 20 },
    dexterity: { type: Number, required: true, min: 3, max: 20 },
    constitution: { type: Number, required: true, min: 3, max: 20 },
    intelligence: { type: Number, required: true, min: 3, max: 20 },
    wisdom: { type: Number, required: true, min: 3, max: 20 },
    charisma: { type: Number, required: true, min: 3, max: 20 }
  },
  armor: {
    type: {
      type: String,
      required: true,
      enum: ['none', 'light', 'medium', 'heavy']
    },
    name: {
      type: String,
      required: true
    }
  },
  inventory: [{
    name: String,
    quantity: Number,
    description: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate ability modifiers
characterSchema.methods.getAbilityModifier = function(ability) {
  return Math.floor((this.stats[ability] - 10) / 2);
};

// Calculate proficiency bonus based on level
characterSchema.methods.getProficiencyBonus = function() {
  return 2 + Math.floor((this.level - 1) / 4);
};

// Calculate hit points based on class and constitution
characterSchema.methods.calculateHitPoints = function() {
  const hitDice = {
    'Fighter': 10,
    'Wizard': 6,
    'Rogue': 8,
    'Cleric': 8,
    'Ranger': 10,
    'Paladin': 10,
    'Barbarian': 12,
    'Bard': 8,
    'Druid': 8,
    'Monk': 8,
    'Warlock': 8
  };

  const conMod = this.getAbilityModifier('constitution');
  const maxHP = hitDice[this.class] + conMod;
  
  return {
    maximum: maxHP,
    current: maxHP
  };
};

// Calculate armor class based on armor type and dexterity
characterSchema.methods.calculateArmorClass = function() {
  const dexMod = this.getAbilityModifier('dexterity');
  
  switch (this.armor.type) {
    case 'none':
      return 10 + dexMod;
    case 'light':
      return 11 + dexMod;
    case 'medium':
      return 14 + Math.min(dexMod, 2);
    case 'heavy':
      return 16; // Chain Mail
    default:
      return 10 + dexMod;
  }
};

// Pre-save hook to validate total ability scores
characterSchema.pre('save', function(next) {
  const totalStats = Object.values(this.stats).reduce((sum, stat) => sum + stat, 0);
  if (totalStats > 75) {
    next(new Error('Total ability scores exceed allowed maximum for character creation'));
  }
  next();
});

const Character = mongoose.model('Character', characterSchema);

module.exports = Character; 