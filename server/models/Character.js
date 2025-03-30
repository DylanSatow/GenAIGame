const mongoose = require('mongoose');

const hitDice = {
  barbarian: 12,
  bard: 8,
  cleric: 8,
  druid: 8,
  fighter: 10,
  monk: 8,
  paladin: 10,
  ranger: 10,
  rogue: 8,
  sorcerer: 6,
  warlock: 8,
  wizard: 6
};

const armorAC = {
  'No Armor': { base: 10, dexBonus: true, maxDex: null },
  'Light Armor': { base: 11, dexBonus: true, maxDex: null },
  'Medium Armor': { base: 14, dexBonus: true, maxDex: 2 },
  'Heavy Armor': { base: 18, dexBonus: false, maxDex: null }
};

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
      enum: Object.keys(armorAC)
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
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate ability modifier
function calculateModifier(score) {
  return Math.floor((score - 10) / 2);
}

// Add methods to the schema
characterSchema.methods.calculateHitPoints = function() {
  const hitDie = hitDice[this.class.toLowerCase()];
  const conMod = calculateModifier(this.stats.constitution);
  const baseHP = hitDie + conMod;
  return {
    current: baseHP,
    maximum: baseHP
  };
};

characterSchema.methods.calculateArmorClass = function() {
  const armor = armorAC[this.armor.type];
  let ac = armor.base;
  
  if (armor.dexBonus) {
    const dexMod = calculateModifier(this.stats.dexterity);
    if (armor.maxDex) {
      ac += Math.min(dexMod, armor.maxDex);
    } else {
      ac += dexMod;
    }
  }
  
  return ac;
};

// Pre-save hook to calculate HP and AC
characterSchema.pre('save', function(next) {
  this.hitPoints = this.calculateHitPoints();
  this.armorClass = this.calculateArmorClass();
  this.updatedAt = new Date();
  next();
});

// Virtual for ability modifiers
characterSchema.virtual('modifiers').get(function() {
  return {
    strength: calculateModifier(this.stats.strength),
    dexterity: calculateModifier(this.stats.dexterity),
    constitution: calculateModifier(this.stats.constitution),
    intelligence: calculateModifier(this.stats.intelligence),
    wisdom: calculateModifier(this.stats.wisdom),
    charisma: calculateModifier(this.stats.charisma)
  };
});

const Character = mongoose.model('Character', characterSchema);

module.exports = Character; 