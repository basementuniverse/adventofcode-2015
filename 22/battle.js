var battleLogEnabled = false,
	hardMode = true;

onmessage = function(e) {
	if (e.data == "start") {
		while (true) {
			postMessage(battle());
		}
	}
};

function log() {
	if (battleLogEnabled) {
		console.log.apply(console, arguments);
	}
}

function initialiseBoss() {
	return {
		hitPoints: 58,
		damage: 9
	};
}

function initialisePlayer() {
	return {
		hitPoints: 50,
		armour: 0,
		mana: 500,
		spellEffects: []
	};
}

function battle() {
	var playersTurn = true,
		player = initialisePlayer(),
		boss = initialiseBoss(),
		manaCost = 0,
		d = 0,
		a = 0;
	while (true) {
		log("\n-- %s turn --", playersTurn ? "Player" : "Boss");
		log("- Player has %i hit points, %i armour, %i mana", player.hitPoints, player.armour, player.mana);
		log("- Boss has %i hit points", boss.hitPoints);
		
		// Hard mode
		if (hardMode && playersTurn) {
			player.hitPoints--;
		}
		
		// Apply on-going spell effects
		for (var i = player.spellEffects.length; i--;) {
			player.spellEffects[i].currentTime++;
			if (player.spellEffects[i].currentTime <= player.spellEffects[i].activeTime) {
				player.spellEffects[i].effect(player, boss);
			}
			if (player.spellEffects[i].currentTime == player.spellEffects[i].activeTime) {
				player.spellEffects[i].effectEnd(player, boss);
			}
		}
		
		// Remove expired spell effects
		player.spellEffects = player.spellEffects.filter(function(spell) {
			return spell.currentTime < spell.activeTime;
		});
		
		// Check win conditions
		if (player.hitPoints <= 0) {
			log("Player is dead, boss wins!");
			return { playerWins: false, totalCost: manaCost };
		}
		if (boss.hitPoints <= 0) {
			log("Boss is dead, player wins!");
			return { playerWins: true, totalCost: manaCost };
		}
		
		// Handle player/boss turn
		if (playersTurn) {
			manaCost += castSpell(player, boss);
		} else {
			d = boss.damage;
			a = player.armour;
			player.hitPoints -= Math.max(d - a, 1);
			log("Boss attacks for %i - %i = %i damage", d, a, Math.max(d - a, 1));
		}
		playersTurn = !playersTurn;
	}
}

function rand(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
};

function castSpell(player, boss) {
	var availableSpells = spells.filter(function(spell) {
		return spell.cost <= player.mana && !player.spellEffects.some(function(activeSpell) {
			return activeSpell.name == spell.name;
		});
	});
	if (!availableSpells.length) {
		log("Player is out of mana or no available spells");
		player.hitPoints = 0;
		return 0;
	}
	var randomSpell = availableSpells[rand(0, availableSpells.length - 1)];
	randomSpell.currentTime = 0;
	randomSpell.effectStart(player, boss);
	player.spellEffects.push(randomSpell);
	player.mana -= randomSpell.cost;
	return randomSpell.cost;
}

var spells = [
	{
		name: "Magic Missile",
		cost: 53,
		activeTime: 1,
		currentTime: 0,
		effectStart: function(player, boss) {
			log("Player casts Magic Missile, dealing 4 damage");
			boss.hitPoints -= 4;
		},
		effect: function(player, boss) { },
		effectEnd: function(player, boss) { }
	},
	{
		name: "Drain",
		cost: 73,
		activeTime: 1,
		currentTime: 0,
		effectStart: function(player, boss) {
			log("Player casts Drain, dealing 2 damage and healing 2 hit points");
			boss.hitPoints -= 2;
			player.hitPoints += 2;
		},
		effect: function(player, boss) { },
		effectEnd: function(player, boss) { }
	},
	{
		name: "Shield",
		cost: 113,
		activeTime: 6,
		currentTime: 0,
		effectStart: function(player, boss) {
			log("Player casts Shield, increasing armour by 7");
			player.armour += 7;
		},
		effect: function(player, boss) {
			log("Shield's timer is now %i", this.activeTime - this.currentTime);
		},
		effectEnd: function(player, boss) {
			log("Shield expired");
			player.armour -= 7;
		}
	},
	{
		name: "Poison",
		cost: 173,
		activeTime: 6,
		currentTime: 0,
		effectStart: function(player, boss) {
			log("Player casts Poison");
		},
		effect: function(player, boss) {
			log("Poison deals 3 damage, it's timer is now %i", this.activeTime - this.currentTime);
			boss.hitPoints -= 3;
		},
		effectEnd: function(player, boss) {
			log("Poison expired");
		}
	},
	{
		name: "Recharge",
		cost: 229,
		activeTime: 5,
		currentTime: 0,
		effectStart: function(player, boss) {
			log("Player casts Recharge");
		},
		effect: function(player, boss) {
			log("Recharge provides 101 mana, it's timer is now %i", this.activeTime - this.currentTime);
			player.mana += 101;
		},
		effectEnd: function(player, boss) {
			log("Recharge expired");
		}
	}
];