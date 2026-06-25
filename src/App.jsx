import React, { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "clicksprint:wave:v1";
const LEGACY_STORAGE_KEYS = ["clicksprint:stats:v2", "clicksprint:stats:v1"];

const themes = [
  { name: "Disco Pancakes", emoji: "🪩", accent: "#ffcf31" },
  { name: "Laser Pickles", emoji: "🥒", accent: "#34d399" },
  { name: "Moon Mall", emoji: "🌙", accent: "#8bd7ff" },
  { name: "Confetti Volcano", emoji: "🎊", accent: "#ff6b57" },
  { name: "Turbo Laundry", emoji: "🧺", accent: "#35c6ff" },
  { name: "Neon Nachos", emoji: "🔺", accent: "#fbbf24" },
  { name: "Sock Rocket", emoji: "🚀", accent: "#ff7ab6" },
  { name: "Bubblegum Speedway", emoji: "🫧", accent: "#fb6fbd" },
  { name: "Waffle Weather", emoji: "🧇", accent: "#f59e0b" },
  { name: "Jellybean Parade", emoji: "🍬", accent: "#a7f3d0" },
];

const upgrades = [
  {
    id: "tapDamage",
    lane: "damage",
    name: "Tap Damage",
    icon: "👆",
    baseCost: 45,
    growth: 1.35,
    unlockWave: 1,
    description: "More damage every hit.",
  },
  {
    id: "maxShield",
    lane: "survival",
    name: "Shield Cells",
    icon: "🛡️",
    baseCost: 60,
    growth: 1.42,
    unlockWave: 1,
    description: "Survive more misses and attacks.",
  },
  {
    id: "coinValue",
    lane: "damage",
    name: "Coin Press",
    icon: "◎",
    baseCost: 70,
    growth: 1.46,
    unlockWave: 1,
    description: "More coins from every wave.",
  },
  {
    id: "targetSize",
    lane: "control",
    name: "Wide Lens",
    icon: "🎯",
    baseCost: 85,
    growth: 1.48,
    maxLevel: 8,
    unlockWave: 2,
    description: "Make the target easier to hit.",
  },
  {
    id: "targetStability",
    lane: "control",
    name: "Target Stabilizer",
    icon: "🧭",
    baseCost: 105,
    growth: 1.5,
    unlockWave: 3,
    description: "Smooth out sporadic target movement.",
  },
  {
    id: "comboMastery",
    lane: "damage",
    name: "Combo Engine",
    icon: "⚡",
    baseCost: 110,
    growth: 1.52,
    unlockWave: 3,
    description: "Consecutive hits add more damage.",
  },
  {
    id: "armor",
    lane: "survival",
    name: "Miss Armor",
    icon: "🧱",
    baseCost: 140,
    growth: 1.55,
    unlockWave: 4,
    description: "Reduce miss penalties.",
  },
  {
    id: "missForgiveness",
    lane: "control",
    name: "Miss Buffer",
    icon: "◎",
    baseCost: 150,
    growth: 1.56,
    unlockWave: 4,
    description: "Near misses hurt less.",
  },
  {
    id: "bossBreaker",
    lane: "damage",
    name: "Boss Breaker",
    icon: "💥",
    baseCost: 180,
    growth: 1.6,
    unlockWave: 5,
    description: "Extra damage to boss waves.",
  },
  {
    id: "critChance",
    lane: "damage",
    name: "Lucky Pop",
    icon: "✨",
    baseCost: 220,
    growth: 1.62,
    maxLevel: 11,
    unlockWave: 7,
    description: "Chance for a big hit.",
  },
  {
    id: "regen",
    lane: "survival",
    name: "Repair Bot",
    icon: "➕",
    baseCost: 260,
    growth: 1.64,
    unlockWave: 10,
    description: "Heal after clearing waves.",
  },
  {
    id: "slowBoss",
    lane: "control",
    name: "Boss Drag",
    icon: "🧲",
    baseCost: 320,
    growth: 1.68,
    unlockWave: 12,
    description: "Boss targets move a little slower.",
  },
];

const upgradeLanes = [
  { id: "damage", label: "Damage", description: "Clear waves faster." },
  { id: "survival", label: "Survival", description: "Keep the shield alive." },
  { id: "control", label: "Control", description: "Make skill checks fairer." },
];

const START_WAVE_STEP = 5;
const FIRST_CHECKPOINT_WAVE = START_WAVE_STEP + 1;
const MAX_CHECKPOINT_BOSS_WAVE = 100;
const MAX_START_WAVE = MAX_CHECKPOINT_BOSS_WAVE + 1;
const OVERCLOCK_UNLOCK_BOSS = 100;
const MUTATION_UNLOCK_BOSS = 150;
const startWaveTiers = Array.from({ length: MAX_CHECKPOINT_BOSS_WAVE / START_WAVE_STEP }, (_, index) => (index + 1) * START_WAVE_STEP + 1);
const baseLevels = upgrades.reduce((levels, upgrade) => ({ ...levels, [upgrade.id]: 0 }), {});

const coreUpgrades = [
  {
    id: "overTap",
    name: "Overcore Tap",
    icon: "C",
    baseCost: 1,
    growth: 1.62,
    maxLevel: 30,
    unlockBoss: 100,
    description: "Permanent tap damage after Overclock.",
  },
  {
    id: "shieldReboot",
    name: "Shield Reboot",
    icon: "R",
    baseCost: 2,
    growth: 1.82,
    maxLevel: 5,
    unlockBoss: 100,
    description: "Survive one lethal shield break each run.",
  },
  {
    id: "targetAnchor",
    name: "Target Anchor",
    icon: "A",
    baseCost: 2,
    growth: 1.7,
    maxLevel: 20,
    unlockBoss: 100,
    description: "Permanently tames late-wave movement.",
  },
  {
    id: "coinMagnet",
    name: "Coin Magnet",
    icon: "$",
    baseCost: 2,
    growth: 1.74,
    maxLevel: 20,
    unlockBoss: 100,
    description: "Permanent coin value after Overclock.",
  },
  {
    id: "comboBank",
    name: "Combo Bank",
    icon: "X",
    baseCost: 3,
    growth: 1.78,
    maxLevel: 15,
    unlockBoss: 100,
    description: "Permanent combo scaling after Overclock.",
  },
  {
    id: "bossCore",
    name: "Boss Core",
    icon: "B",
    baseCost: 3,
    growth: 1.82,
    maxLevel: 15,
    unlockBoss: 100,
    description: "Permanent boss damage and boss drag.",
  },
  {
    id: "checkpointLicense",
    name: "Checkpoint License",
    icon: "L",
    baseCost: 4,
    growth: 2.2,
    maxLevel: 6,
    unlockBoss: 100,
    description: "Keep a deeper start gate after Overclock.",
  },
];

const baseCoreUpgrades = coreUpgrades.reduce((levels, upgrade) => ({ ...levels, [upgrade.id]: 0 }), {});

const mutations = [
  {
    id: "none",
    name: "Clean Run",
    description: "No modifier.",
    coinBonus: 0,
    coreBonus: 0,
  },
  {
    id: "tinyTarget",
    name: "Tiny Target",
    description: "Smaller target, bigger rewards.",
    targetScale: 0.86,
    coinBonus: 0.25,
    coreBonus: 0.25,
  },
  {
    id: "hotShield",
    name: "Hot Shield",
    description: "Less shield, better rewards.",
    shieldScale: 0.72,
    coinBonus: 0.35,
    coreBonus: 0.35,
  },
  {
    id: "rapidBoss",
    name: "Rapid Bosses",
    description: "Bosses fire faster and hit harder.",
    bossHpScale: 1.2,
    bossAttackScale: 0.78,
    bossDamageBonus: 1,
    chaosBonus: 0.08,
    coinBonus: 0.45,
    coreBonus: 0.5,
  },
];

function pad2(value) {
  return String(value).padStart(2, "0");
}

function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  return function nextRandom() {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatNumber(value) {
  return Math.floor(value).toLocaleString();
}

function roundGateCost(value) {
  const step = value >= 100_000_000 ? 500_000 : value >= 10_000_000 ? 100_000 : value >= 1_000_000 ? 25_000 : value >= 100_000 ? 2500 : value >= 10_000 ? 500 : 100;
  return Math.ceil(value / step) * step;
}

function normalizeStartWave(value) {
  const wave = Math.floor(Number(value) || 1);
  if (wave < START_WAVE_STEP) return 1;

  const checkpointWave = wave % START_WAVE_STEP === 0 ? wave + 1 : wave;
  if (checkpointWave < FIRST_CHECKPOINT_WAVE) return 1;
  const checkpointIndex = Math.floor((checkpointWave - FIRST_CHECKPOINT_WAVE) / START_WAVE_STEP);
  return clamp(FIRST_CHECKPOINT_WAVE + Math.max(0, checkpointIndex) * START_WAVE_STEP, FIRST_CHECKPOINT_WAVE, MAX_START_WAVE);
}

function nextStartWaveGate(maxStartWave) {
  const normalized = normalizeStartWave(maxStartWave);
  if (normalized >= MAX_START_WAVE) return null;
  if (normalized === 1) return FIRST_CHECKPOINT_WAVE;
  return Math.min(normalized + START_WAVE_STEP, MAX_START_WAVE);
}

function checkpointBossWave(startWave) {
  const normalized = normalizeStartWave(startWave);
  return normalized === 1 ? 0 : normalized - 1;
}

function startWaveCost(wave) {
  const bossWave = checkpointBossWave(wave);
  if (!bossWave) return 0;
  const tier = bossWave / START_WAVE_STEP;
  return roundGateCost(1_000 * Math.pow(tier, 2.55) * Math.pow(1.048, bossWave));
}

function createDailyConfig(day) {
  const seed = hashString(`clicksprint-wave-${day}`);
  const random = mulberry32(seed);
  const theme = themes[Math.floor(random() * themes.length)];
  return {
    dateKey: day,
    seed,
    theme,
    drift: 0.82 + random() * 0.36,
  };
}

function defaultAnalytics() {
  return {
    runs: 0,
    totalWave: 0,
    averageWave: 0,
    totalHits: 0,
    totalMisses: 0,
    missRate: 0,
    totalNearMisses: 0,
    totalBossesDefeated: 0,
    upgradeChoices: {},
    adOffersShown: 0,
    adOffersAccepted: 0,
  };
}

function normalizeAnalytics(value, fallback = {}) {
  const defaults = defaultAnalytics();
  return {
    ...defaults,
    ...value,
    runs: Number(value?.runs) || Number(fallback.gamesPlayed) || 0,
    totalWave: Number(value?.totalWave) || Number(fallback.bestWave) || 0,
    averageWave: Number(value?.averageWave) || 0,
    totalHits: Number(value?.totalHits) || Number(fallback.totalHits) || 0,
    totalMisses: Number(value?.totalMisses) || Number(fallback.totalMisses) || 0,
    missRate: Number(value?.missRate) || 0,
    totalNearMisses: Number(value?.totalNearMisses) || 0,
    totalBossesDefeated: Number(value?.totalBossesDefeated) || 0,
    upgradeChoices: { ...(value?.upgradeChoices || {}) },
    adOffersShown: Number(value?.adOffersShown) || 0,
    adOffersAccepted: Number(value?.adOffersAccepted) || 0,
  };
}

function averageWave(meta) {
  const runs = meta.analytics?.runs || 0;
  return runs ? meta.analytics.totalWave / runs : 0;
}

function missRateForCounts(hits, misses) {
  const taps = hits + misses;
  return taps ? Math.round((misses / taps) * 100) : 0;
}

function topUpgradeChoice(meta) {
  const choices = meta.analytics?.upgradeChoices || {};
  const [upgradeId, count] = Object.entries(choices).sort((a, b) => b[1] - a[1])[0] || [];
  const upgrade = upgrades.find((item) => item.id === upgradeId);
  return upgrade ? `${upgrade.name} x${count}` : "None yet";
}

function defaultMeta() {
  return {
    version: 2,
    coins: 0,
    cores: 0,
    levels: { ...baseLevels },
    coreUpgrades: { ...baseCoreUpgrades },
    maxStartWave: 1,
    selectedStartWave: 1,
    bestWave: 0,
    bestBossWave: 0,
    cycleBestWave: 0,
    cycleBestBossWave: 0,
    cycleCoreBonus: 0,
    overclocks: 0,
    totalCores: 0,
    activeMutationId: "none",
    bestScore: 0,
    gamesPlayed: 0,
    totalCoins: 0,
    totalHits: 0,
    totalMisses: 0,
    totalNearMisses: 0,
    bestStreak: 0,
    analytics: defaultAnalytics(),
    lastRun: null,
  };
}

function normalizeLevels(value = {}) {
  return upgrades.reduce((levels, upgrade) => {
    const rawLevel = Math.max(0, Math.floor(Number(value?.[upgrade.id]) || 0));
    return {
      ...levels,
      [upgrade.id]: upgrade.maxLevel ? Math.min(rawLevel, upgrade.maxLevel) : rawLevel,
    };
  }, { ...baseLevels });
}

function normalizeCoreUpgrades(value = {}) {
  return coreUpgrades.reduce((levels, upgrade) => {
    const rawLevel = Math.max(0, Math.floor(Number(value?.[upgrade.id]) || 0));
    return {
      ...levels,
      [upgrade.id]: Math.min(rawLevel, upgrade.maxLevel),
    };
  }, { ...baseCoreUpgrades });
}

function normalizeMeta(value) {
  const maxStartWave = normalizeStartWave(value?.maxStartWave);
  const selectedStartWave = Math.min(normalizeStartWave(value?.selectedStartWave), maxStartWave);
  const activeMutationId = mutations.some((mutation) => mutation.id === value?.activeMutationId) ? value.activeMutationId : "none";

  return {
    ...defaultMeta(),
    ...value,
    version: 2,
    coins: Number(value?.coins) || 0,
    cores: Number(value?.cores) || 0,
    levels: normalizeLevels(value?.levels),
    coreUpgrades: normalizeCoreUpgrades(value?.coreUpgrades),
    maxStartWave,
    selectedStartWave,
    bestWave: Number(value?.bestWave) || 0,
    bestBossWave: Number(value?.bestBossWave) || 0,
    cycleBestWave: Number(value?.cycleBestWave) || 0,
    cycleBestBossWave: Number(value?.cycleBestBossWave) || 0,
    cycleCoreBonus: Number(value?.cycleCoreBonus) || 0,
    overclocks: Number(value?.overclocks) || 0,
    totalCores: Number(value?.totalCores) || Number(value?.cores) || 0,
    activeMutationId,
    bestScore: Number(value?.bestScore) || 0,
    gamesPlayed: Number(value?.gamesPlayed) || 0,
    totalCoins: Number(value?.totalCoins) || 0,
    totalHits: Number(value?.totalHits) || 0,
    totalMisses: Number(value?.totalMisses) || 0,
    totalNearMisses: Number(value?.totalNearMisses) || 0,
    bestStreak: Number(value?.bestStreak) || Number(value?.bestChain) || 0,
    analytics: normalizeAnalytics(value?.analytics, value),
    lastRun: value?.lastRun || null,
  };
}

function readMeta() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) return normalizeMeta(JSON.parse(saved));

    for (const key of LEGACY_STORAGE_KEYS) {
      const legacy = window.localStorage.getItem(key);
      if (!legacy) continue;
      const parsed = JSON.parse(legacy);
      return normalizeMeta({
        coins: 0,
        bestScore: parsed.bestScore || 0,
        gamesPlayed: parsed.gamesPlayed || 0,
        totalHits: parsed.totalHits || 0,
        totalMisses: parsed.totalMisses || 0,
        bestStreak: parsed.bestChain || 0,
      });
    }
  } catch {
    return null;
  }

  return null;
}

function saveMeta(meta) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
  } catch {
    // Local persistence is useful but not required for a playable run.
  }
}

function upgradeCost(upgrade, level) {
  return Math.ceil((upgrade.baseCost * Math.pow(upgrade.growth, level)) / 5) * 5;
}

function coreUpgradeCost(upgrade, level) {
  return Math.max(1, Math.ceil(upgrade.baseCost * Math.pow(upgrade.growth, level)));
}

function coreLevel(meta, upgradeId) {
  return Number(meta?.coreUpgrades?.[upgradeId]) || 0;
}

function mutationById(id) {
  return mutations.find((mutation) => mutation.id === id) || mutations[0];
}

function mutationUnlocked(meta) {
  return (meta.bestBossWave || 0) >= MUTATION_UNLOCK_BOSS;
}

function activeMutationForMeta(meta) {
  return mutationUnlocked(meta) ? mutationById(meta.activeMutationId) : mutations[0];
}

function effectiveLevels(meta) {
  const core = meta.coreUpgrades || {};
  return {
    ...meta.levels,
    tapDamage: (meta.levels.tapDamage || 0) + (core.overTap || 0) * 1.35,
    maxShield: (meta.levels.maxShield || 0) + (core.shieldReboot || 0) * 1.15,
    coinValue: (meta.levels.coinValue || 0) + (core.coinMagnet || 0) * 0.75,
    targetStability: (meta.levels.targetStability || 0) + (core.targetAnchor || 0) * 1.2,
    comboMastery: (meta.levels.comboMastery || 0) + (core.comboBank || 0) * 0.8,
    bossBreaker: (meta.levels.bossBreaker || 0) + (core.bossCore || 0) * 1.25,
    slowBoss: (meta.levels.slowBoss || 0) + (core.bossCore || 0) * 0.5 + (core.targetAnchor || 0) * 0.35,
  };
}

function isBossWave(wave) {
  return wave > 0 && wave % 5 === 0;
}

function maxShield(levels) {
  return 5 + (levels.maxShield || 0) * 2;
}

function runMaxShield(levels, mutation) {
  return Math.max(1, Math.round(maxShield(levels) * (mutation?.shieldScale || 1)));
}

function tapDamage(levels, boss) {
  const base = 18 + (levels.tapDamage || 0) * 7;
  const bossBonus = boss ? (levels.bossBreaker || 0) * 9 : 0;
  return base + bossBonus;
}

function targetSize(levels, mutation = null) {
  const base = clamp(82 + (levels.targetSize || 0) * 7, 82, 134);
  return Math.round(clamp(base * (mutation?.targetScale || 1), 58, 140));
}

function movementChaos(wave, boss, levels, mutation = null) {
  const stabilizerLevel = levels.targetStability || 0;
  const bossChaos = boss ? 0.32 : 0;
  return clamp(0.2 + wave * 0.041 + bossChaos + (mutation?.chaosBonus || 0) - stabilizerLevel * 0.125, 0.12, 1.18);
}

function movementTransitionMs(wave, boss, levels) {
  const stabilizerLevel = levels.targetStability || 0;
  const bossPenalty = boss ? 30 : 0;
  return clamp(230 - wave * 4 - bossPenalty + stabilizerLevel * 18, 80, 260);
}

function targetSkin(wave, boss) {
  if (boss) return `skin-boss skin-${wave % 4}`;
  return `skin-${wave % 4}`;
}

function targetDamageLevel(hpPercent) {
  if (hpPercent <= 22) return "damage-critical";
  if (hpPercent <= 48) return "damage-cracked";
  if (hpPercent <= 74) return "damage-scuffed";
  return "damage-clean";
}

function comboWindowMs(levels) {
  return 1160 + (levels.comboMastery || 0) * 80;
}

function comboMultiplier(streak, levels) {
  const comboLevel = levels.comboMastery || 0;
  const step = 0.035 + comboLevel * 0.01;
  const cap = 10 + comboLevel * 3;
  return 1 + Math.min(Math.max(streak - 1, 0), cap) * step;
}

function critChance(levels) {
  return Math.min(0.05 + (levels.critChance || 0) * 0.035, 0.42);
}

function waveHp(wave, mutation = null) {
  const boss = isBossWave(wave);
  const base = 72 + Math.round(Math.pow(wave, 1.4) * 34);
  const bossHp = boss ? Math.round(base * 3.1 * (mutation?.bossHpScale || 1)) : base;
  return bossHp;
}

function waveReward(wave, levels) {
  const boss = isBossWave(wave);
  const base = 18 + wave * 7 + Math.floor(Math.pow(wave, 1.18) * 4);
  const multiplier = 1 + (levels.coinValue || 0) * 0.18;
  return Math.round(base * multiplier * (boss ? 2.75 : 1));
}

function attackDamage(wave, boss, levels, mutation = null) {
  const raw = (boss ? 2 : 1) + Math.floor(wave / 8);
  return Math.max(1, raw + (boss ? mutation?.bossDamageBonus || 0 : 0) - Math.floor((levels.armor || 0) / 3));
}

function missDamage(levels) {
  return Math.max(1, 2 - Math.floor((levels.armor || 0) / 2));
}

function missPenaltyForDistance(levels, distanceRatio) {
  const base = missDamage(levels);
  const buffer = levels.missForgiveness || 0;
  const grazeLimit = 1.18 + buffer * 0.08;
  const softLimit = 1.72 + buffer * 0.1;
  const mediumLimit = 2.45 + buffer * 0.08;

  if (distanceRatio <= grazeLimit) {
    return { damage: 0, label: "GRAZE", near: true, scoreLoss: 0 };
  }

  if (distanceRatio <= softLimit) {
    return { damage: Math.max(0, Math.ceil(base / 2) - Math.floor(buffer / 4)), label: "NEAR MISS", near: true, scoreLoss: 8 };
  }

  if (distanceRatio <= mediumLimit) {
    return { damage: base, label: "MISS", near: false, scoreLoss: 15 };
  }

  return { damage: base + 1, label: "WIDE MISS", near: false, scoreLoss: 22 };
}

function attackWindup(wave, boss, levels) {
  const slowBossLevel = levels.slowBoss || 0;
  const bossWindup = boss ? 1020 + slowBossLevel * 35 : 760;
  return Math.max(520, bossWindup - wave * 4);
}

function attackInterval(wave, boss, levels, mutation = null) {
  const slowBossLevel = levels.slowBoss || 0;
  const base = boss ? 2500 + slowBossLevel * 180 : 3200;
  const interval = Math.max(1250, base - wave * 28);
  return Math.round(interval * (boss ? mutation?.bossAttackScale || 1 : 1));
}

function moveInterval(wave, boss, levels, drift, mutation = null) {
  const slowBossLevel = levels.slowBoss || 0;
  const stabilizerLevel = levels.targetStability || 0;
  const base = boss ? 720 + slowBossLevel * 55 : 980;
  return Math.max(320, Math.round((base - wave * 15 + stabilizerLevel * 48) * drift * (mutation?.moveScale || 1)));
}

function bossFirstClearBonus(wave) {
  return isBossWave(wave) ? 75 + wave * 14 : 0;
}

function overclockBaseCores(bossWave) {
  if (bossWave < OVERCLOCK_UNLOCK_BOSS) return 0;
  return Math.floor((bossWave - (OVERCLOCK_UNLOCK_BOSS - START_WAVE_STEP)) / START_WAVE_STEP);
}

function overclockCoreReward(meta) {
  const base = overclockBaseCores(meta.cycleBestBossWave || 0);
  return Math.floor(base * (1 + (meta.cycleCoreBonus || 0)));
}

function retainedStartWaveAfterOverclock(coreUpgradesValue = {}) {
  const licenseLevel = Number(coreUpgradesValue.checkpointLicense) || 0;
  if (licenseLevel <= 0) return 1;
  return normalizeStartWave(FIRST_CHECKPOINT_WAVE + (licenseLevel - 1) * START_WAVE_STEP);
}

function runCoinMultiplier(mutationId) {
  return 1 + (mutationById(mutationId).coinBonus || 0);
}

function shieldRebootValue(meta, maxShieldValue) {
  const rebootLevel = coreLevel(meta, "shieldReboot");
  if (!rebootLevel) return 0;
  return Math.min(maxShieldValue, 1 + rebootLevel * 2);
}

function targetPosition(seed, wave, targetIndex, levels = {}, mutation = null) {
  const random = mulberry32(hashString(`${seed}:wave:${wave}:target:${targetIndex}`));
  const boss = isBossWave(wave);
  const chaos = movementChaos(wave, boss, levels, mutation);
  const priorRandom = mulberry32(hashString(`${seed}:wave:${wave}:target:${Math.max(0, targetIndex - 1)}`));
  const prior = {
    x: 15 + priorRandom() * 70,
    y: 18 + priorRandom() * 64,
  };
  const next = {
    x: 15 + random() * 70,
    y: 18 + random() * 64,
  };
  if (targetIndex <= 0) return next;

  const blend = clamp(0.34 + chaos * 0.55, 0.38, 1);
  const feintX = (random() - 0.5) * 20 * chaos;
  const feintY = (random() - 0.5) * 18 * chaos;
  return {
    x: clamp(prior.x + (next.x - prior.x) * blend + feintX, 12, 88),
    y: clamp(prior.y + (next.y - prior.y) * blend + feintY, 16, 86),
  };
}

function createSession(daily, meta) {
  const mutation = activeMutationForMeta(meta);
  const levels = effectiveLevels(meta);
  const shield = runMaxShield(levels, mutation);
  const startWave = normalizeStartWave(meta.selectedStartWave);
  return {
    runId: `${daily.dateKey}-${Date.now().toString(36)}`,
    status: "ready",
    wave: startWave,
    startWave,
    mutationId: mutation.id,
    mutationCoreBonus: mutation.coreBonus || 0,
    enemyHp: waveHp(startWave, mutation),
    enemyMaxHp: waveHp(startWave, mutation),
    shield,
    maxShield: shield,
    runCoins: 0,
    score: 0,
    hits: 0,
    misses: 0,
    nearMisses: 0,
    streak: 0,
    bestStreak: 0,
    targetIndex: 0,
    lastHitAt: 0,
    nextAttackAt: 0,
    pendingAttack: null,
    lastWaveReward: 0,
    bossesDefeated: 0,
    bestBossWaveInRun: 0,
    milestoneCoins: 0,
    rebootUsed: false,
    adBonusClaimed: false,
    adBonusCoins: 0,
    finalReason: "",
  };
}

function rankForWave(wave) {
  if (wave >= 30) return "Endless Menace";
  if (wave >= 20) return "Boss Farmer";
  if (wave >= 12) return "Wave Breaker";
  if (wave >= 6) return "Target Scrambler";
  return "Fresh Runner";
}

function performanceLine(session) {
  if (session.wave >= 25) return "🏁🔥⚡ Deep run, loud thumbs";
  if (session.bestStreak >= 30) return "🎯⚡ Huge hit chain";
  if (session.misses <= 2 && session.wave >= 10) return "✨🎯 Clean coordination";
  if (session.misses >= 15) return "😅🛡️ Survived the chaos";
  return "👆💥 Built for one more wave";
}

function shareTextFor(session, daily) {
  const url = window.location.href;
  return `ClickDefense ${daily.theme.emoji} ${daily.theme.name}\nScore: ${formatNumber(session.score)}\nWave: ${session.wave} | Rank: ${rankForWave(session.wave)}\n${performanceLine(session)}\n${url}`;
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function HudStat({ label, value, tone = "" }) {
  return (
    <div className={`stat-pill ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function UpgradeButton({ upgrade, level, coins, bestWave, onBuy }) {
  const locked = bestWave < upgrade.unlockWave;
  const maxed = Boolean(upgrade.maxLevel && level >= upgrade.maxLevel);
  const cost = upgradeCost(upgrade, level);
  const canBuy = !locked && !maxed && coins >= cost;

  return (
    <button className={`meta-upgrade ${locked ? "locked" : ""} ${maxed ? "maxed" : ""}`} type="button" disabled={!canBuy} onClick={() => onBuy(upgrade.id)}>
      <span className="meta-icon">{upgrade.icon}</span>
      <span className="meta-copy">
        <strong>{upgrade.name}</strong>
        <small>{locked ? `Unlock wave ${upgrade.unlockWave}` : maxed ? "Fully upgraded." : upgrade.description}</small>
      </span>
      <span className="meta-price">
        <b>Lv. {level}{upgrade.maxLevel ? `/${upgrade.maxLevel}` : ""}</b>
        <small>{locked ? "LOCK" : maxed ? "MAX" : `${formatNumber(cost)} ◎`}</small>
      </span>
    </button>
  );
}

function CoreUpgradeButton({ upgrade, level, cores, bestBossWave, onBuy }) {
  const locked = bestBossWave < upgrade.unlockBoss;
  const maxed = level >= upgrade.maxLevel;
  const cost = coreUpgradeCost(upgrade, level);
  const canBuy = !locked && !maxed && cores >= cost;

  return (
    <button className={`meta-upgrade core-upgrade ${locked ? "locked" : ""} ${maxed ? "maxed" : ""}`} type="button" disabled={!canBuy} onClick={() => onBuy(upgrade.id)}>
      <span className="meta-icon">{upgrade.icon}</span>
      <span className="meta-copy">
        <strong>{upgrade.name}</strong>
        <small>{locked ? `Beat Boss ${upgrade.unlockBoss}` : maxed ? "Fully upgraded." : upgrade.description}</small>
      </span>
      <span className="meta-price">
        <b>Lv. {level}/{upgrade.maxLevel}</b>
        <small>{locked ? "LOCK" : maxed ? "MAX" : `${formatNumber(cost)} core${cost === 1 ? "" : "s"}`}</small>
      </span>
    </button>
  );
}

function MutationButton({ mutation, active, unlocked, onSelect }) {
  const disabled = !unlocked && mutation.id !== "none";
  const rewardLabel = mutation.id === "none" ? "Normal rewards" : `+${Math.round((mutation.coinBonus || 0) * 100)}% coins`;

  return (
    <button className={`mutation-option ${active ? "selected" : ""}`} type="button" disabled={disabled} onClick={() => onSelect(mutation.id)}>
      <strong>{mutation.name}</strong>
      <span>{disabled ? `Beat Boss ${MUTATION_UNLOCK_BOSS}` : mutation.description}</span>
      <small>{disabled ? "LOCK" : rewardLabel}</small>
    </button>
  );
}

function StartGateButton({ wave, meta, progressWave, onBuy, onSelect }) {
  const maxStartWave = meta.maxStartWave || 1;
  const selected = (meta.selectedStartWave || 1) === wave;
  const owned = wave === 1 || wave <= maxStartWave;
  const nextGate = nextStartWaveGate(maxStartWave);
  const reached = wave === 1 || progressWave >= wave;
  const cost = wave === 1 ? 0 : startWaveCost(wave);
  const canBuy = !owned && reached && wave === nextGate && meta.coins >= cost;
  const disabled = !owned && !canBuy;
  const bossWave = checkpointBossWave(wave);
  const label = wave === 1 ? "Always available" : owned ? "Owned" : !reached ? `Clear boss ${bossWave}` : wave !== nextGate ? "Buy earlier gates" : `${formatNumber(cost)} ◎`;

  function handleClick() {
    if (owned) {
      onSelect(wave);
      return;
    }

    if (canBuy) onBuy(wave);
  }

  return (
    <button className={`start-gate ${selected ? "selected" : ""} ${owned ? "owned" : ""}`} type="button" disabled={disabled} onClick={handleClick}>
      <strong>Wave {wave}</strong>
      <span>{selected ? "Selected" : label}</span>
    </button>
  );
}

function EndScreen({ session, meta, daily, shareStatus, onShare, onOpenWorkshop, onDoubleCoins }) {
  const runMissRate = missRateForCounts(session.hits, session.misses);
  const doubleDisabled = session.adBonusClaimed || session.runCoins <= 0;
  const mutation = mutationById(session.mutationId);
  const corePreview = overclockBaseCores(session.bestBossWaveInRun);

  return (
    <section className="end-screen" aria-label="Run results">
      <div className="end-panel">
        <span className="end-kicker">{session.finalReason || "Run complete"}</span>
        <h2>Wave {session.wave}</h2>
        <p className="rank-title">{rankForWave(session.wave)}</p>
        <p className="performance-line">{performanceLine(session)}</p>
        <div className="end-detail-grid">
          <div>
            <span>Started at</span>
            <strong>Wave {session.startWave || 1}</strong>
          </div>
          <div>
            <span>Wave reached</span>
            <strong>{session.wave}</strong>
          </div>
          <div>
            <span>Bosses down</span>
            <strong>{session.bossesDefeated}</strong>
          </div>
          <div>
            <span>Coins earned</span>
            <strong>{formatNumber(session.runCoins + session.adBonusCoins)} ◎</strong>
          </div>
          <div>
            <span>Mutation</span>
            <strong>{mutation.name}</strong>
          </div>
          <div>
            <span>Core value</span>
            <strong>{corePreview ? `${formatNumber(corePreview)} base` : "None yet"}</strong>
          </div>
          <div>
            <span>Best streak</span>
            <strong>{session.bestStreak} hits</strong>
          </div>
          <div>
            <span>Miss rate</span>
            <strong>{runMissRate}%</strong>
          </div>
          <div>
            <span>Near misses</span>
            <strong>{session.nearMisses}</strong>
          </div>
          <div>
            <span>Milestone bonus</span>
            <strong>{formatNumber(session.milestoneCoins)} ◎</strong>
          </div>
        </div>
        <div className="end-actions">
        <button className="ad-button" type="button" disabled={doubleDisabled} onClick={onDoubleCoins}>
          {session.adBonusClaimed ? `Reward claimed +${formatNumber(session.adBonusCoins)} ◎` : `Watch ad to double coins (+${formatNumber(session.runCoins)} ◎)`}
        </button>
        <button className="share-button" type="button" disabled={shareStatus === "working"} onClick={onShare}>
          {shareStatus === "working"
            ? "Sharing..."
            : shareStatus === "copied"
              ? "Copied score"
              : shareStatus === "shared"
                ? "Shared"
                : "Share run"}
        </button>
        <button className="run-again-button" type="button" onClick={onOpenWorkshop}>
          Open workshop
        </button>
        </div>
      </div>
    </section>
  );
}

function App() {
  const today = useMemo(() => dateKey(), []);
  const daily = useMemo(() => createDailyConfig(today), [today]);
  const initialMeta = useMemo(() => readMeta() || defaultMeta(), []);
  const [meta, setMeta] = useState(initialMeta);
  const [session, setSession] = useState(() => createSession(daily, initialMeta));
  const [bursts, setBursts] = useState([]);
  const [shots, setShots] = useState([]);
  const [missFeedback, setMissFeedback] = useState(null);
  const [shareStatus, setShareStatus] = useState("idle");
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [mobileView, setMobileView] = useState("game");
  const [openUpgradeLanes, setOpenUpgradeLanes] = useState({
    damage: true,
    survival: false,
    control: false,
  });
  const metaRef = useRef(meta);
  const sessionRef = useRef(session);
  const audioRef = useRef(null);
  const feedbackIdRef = useRef(0);
  const finishedRunRef = useRef("");

  const boss = isBossWave(session.wave);
  const runLevels = useMemo(() => effectiveLevels(meta), [meta]);
  const runMutation = mutationById(session.mutationId);
  const target = targetPosition(daily.seed, session.wave, session.targetIndex, runLevels, runMutation);
  const hpPercent = clamp((session.enemyHp / session.enemyMaxHp) * 100, 0, 100);
  const shieldPercent = clamp((session.shield / session.maxShield) * 100, 0, 100);
  const currentTapDamage = tapDamage(runLevels, boss);
  const nextBossWave = session.wave + (5 - (session.wave % 5 || 5));
  const chaos = movementChaos(session.wave, boss, runLevels, runMutation);
  const shieldUnderFire = (shots.length > 0 || Boolean(session.pendingAttack)) && session.status === "active";
  const runMissRate = missRateForCounts(session.hits, session.misses);
  const globalMissRate = missRateForCounts(meta.analytics?.totalHits || 0, meta.analytics?.totalMisses || 0);
  const avgWave = averageWave(meta);
  const topUpgrade = topUpgradeChoice(meta);
  const selectedStartWave = meta.selectedStartWave || 1;
  const maxStartWave = meta.maxStartWave || 1;
  const progressWave = Math.max(meta.bestWave || 0, session.wave || 0);
  const nextStartGate = nextStartWaveGate(maxStartWave);
  const overclockReward = overclockCoreReward(meta);
  const canOverclock = overclockReward > 0 && session.status !== "active";
  const hasOverclockAccess = (meta.bestBossWave || 0) >= OVERCLOCK_UNLOCK_BOSS || overclockReward > 0 || (meta.overclocks || 0) > 0;
  const hasMutationAccess = mutationUnlocked(meta);

  useEffect(() => {
    metaRef.current = meta;
    saveMeta(meta);
  }, [meta]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    if (session.status === "active" && mobileView !== "game") {
      setMobileView("game");
    }
  }, [mobileView, session.status]);

  useEffect(() => {
    if (session.status !== "active") return undefined;

    const intervalId = window.setInterval(() => {
      const now = Date.now();
      let shotToAdd = null;
      let shotDuration = 720;

      setSession((current) => {
        if (current.status !== "active") return current;

        if (current.pendingAttack && now >= current.pendingAttack.impactAt) {
          const damage = current.pendingAttack.damage;
          const shield = current.shield - damage;
          const currentBoss = current.pendingAttack.boss;

          if (shield <= 0) {
            const rebootShield = current.rebootUsed ? 0 : shieldRebootValue(metaRef.current, current.maxShield);
            if (rebootShield > 0) {
              const rebooted = {
                ...current,
                shield: rebootShield,
                streak: 0,
                rebootUsed: true,
                pendingAttack: null,
                finalReason: "",
              };
              sessionRef.current = rebooted;
              return rebooted;
            }

            const ended = {
              ...current,
              shield: 0,
              streak: 0,
              pendingAttack: null,
              status: "ended",
              finalReason: currentBoss ? "Boss cracked the shield" : "Shield broke",
            };
            sessionRef.current = ended;
            return ended;
          }

          const next = {
            ...current,
            shield,
            streak: 0,
            pendingAttack: null,
          };
          sessionRef.current = next;
          return next;
        }

        if (current.pendingAttack || (current.nextAttackAt && now < current.nextAttackAt)) return current;

        const currentBoss = isBossWave(current.wave);
        const levels = effectiveLevels(metaRef.current);
        const mutation = mutationById(current.mutationId);
        const damage = attackDamage(current.wave, currentBoss, levels, mutation);
        const windup = attackWindup(current.wave, currentBoss, levels);
        shotToAdd = incomingShotFor(current, damage, now, windup);
        shotDuration = windup + 180;

        const next = {
          ...current,
          pendingAttack: {
            id: shotToAdd.id,
            boss: currentBoss,
            damage,
            impactAt: now + windup,
          },
          nextAttackAt: now + windup + attackInterval(current.wave, currentBoss, levels, mutation),
        };
        sessionRef.current = next;
        return next;
      });

      if (shotToAdd) addShot(shotToAdd, shotDuration);
    }, 150);

    return () => window.clearInterval(intervalId);
  }, [session.status]);

  useEffect(() => {
    if (session.status === "ended") return undefined;

    const intervalId = window.setInterval(() => {
      setSession((current) => {
        if (current.status === "ended") return current;
        return { ...current, targetIndex: current.targetIndex + 1 };
      });
    }, moveInterval(session.wave, boss, runLevels, daily.drift, runMutation));

    return () => window.clearInterval(intervalId);
  }, [boss, daily.drift, runLevels, runMutation, session.status, session.wave]);

  useEffect(() => {
    if (session.status !== "ended" || finishedRunRef.current === session.runId) return;
    finishedRunRef.current = session.runId;

    const result = {
      runId: session.runId,
      dateKey: daily.dateKey,
      startWave: session.startWave || 1,
      wave: session.wave,
      score: Math.floor(session.score),
        coins: session.runCoins,
        cores: overclockBaseCores(session.bestBossWaveInRun),
        mutation: mutationById(session.mutationId).name,
        hits: session.hits,
      misses: session.misses,
      nearMisses: session.nearMisses,
      bestStreak: session.bestStreak,
      bossesDefeated: session.bossesDefeated,
      bestBossWave: session.bestBossWaveInRun,
      missRate: missRateForCounts(session.hits, session.misses),
      rank: rankForWave(session.wave),
      theme: daily.theme.name,
      completedAt: new Date().toISOString(),
    };

    setMeta((current) => {
      const analyticsRuns = (current.analytics?.runs || 0) + 1;
      const analyticsWave = (current.analytics?.totalWave || 0) + session.wave;
      const analyticsHits = (current.analytics?.totalHits || 0) + session.hits;
      const analyticsMisses = (current.analytics?.totalMisses || 0) + session.misses;
      const nextCycleBestBoss = Math.max(current.cycleBestBossWave || 0, session.bestBossWaveInRun || 0);
      const nextCycleCoreBonus =
        session.bestBossWaveInRun > (current.cycleBestBossWave || 0)
          ? session.mutationCoreBonus || 0
          : Math.max(current.cycleCoreBonus || 0, session.bestBossWaveInRun === nextCycleBestBoss ? session.mutationCoreBonus || 0 : 0);

      return {
        ...current,
        coins: current.coins + session.runCoins,
        bestWave: Math.max(current.bestWave, session.wave),
        bestBossWave: Math.max(current.bestBossWave || 0, session.bestBossWaveInRun || 0),
        cycleBestWave: Math.max(current.cycleBestWave || 0, session.wave),
        cycleBestBossWave: nextCycleBestBoss,
        cycleCoreBonus: nextCycleCoreBonus,
        bestScore: Math.max(current.bestScore, Math.floor(session.score)),
        gamesPlayed: current.gamesPlayed + 1,
        totalCoins: current.totalCoins + session.runCoins,
        totalHits: current.totalHits + session.hits,
        totalMisses: current.totalMisses + session.misses,
        totalNearMisses: current.totalNearMisses + session.nearMisses,
        bestStreak: Math.max(current.bestStreak, session.bestStreak),
        analytics: {
          ...current.analytics,
          runs: analyticsRuns,
          totalWave: analyticsWave,
          averageWave: analyticsWave / analyticsRuns,
          totalHits: analyticsHits,
          totalMisses: analyticsMisses,
          missRate: missRateForCounts(analyticsHits, analyticsMisses),
          totalNearMisses: (current.analytics?.totalNearMisses || 0) + session.nearMisses,
          totalBossesDefeated: (current.analytics?.totalBossesDefeated || 0) + session.bossesDefeated,
          adOffersShown: (current.analytics?.adOffersShown || 0) + (session.runCoins > 0 ? 1 : 0),
        },
        lastRun: result,
      };
    });
    setShowEndScreen(true);
  }, [daily.dateKey, daily.theme.name, session]);

  function addBurst(burst, duration = 700) {
    setBursts((current) => [...current.slice(-7), burst]);
    window.setTimeout(() => {
      setBursts((current) => current.filter((item) => item.id !== burst.id));
    }, duration);
  }

  function addShot(shot, duration = 720) {
    setShots((current) => [...current.slice(-5), shot]);
    window.setTimeout(() => {
      setShots((current) => current.filter((item) => item.id !== shot.id));
    }, duration);
  }

  function playMissSound(kind) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const context = audioRef.current || new AudioContext();
      audioRef.current = context;
      if (context.state === "suspended") {
        void context.resume().catch(() => {});
      }

      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const fullMiss = kind === "miss";
      oscillator.type = fullMiss ? "square" : "triangle";
      oscillator.frequency.setValueAtTime(fullMiss ? 126 : 196, now);
      oscillator.frequency.exponentialRampToValueAtTime(fullMiss ? 72 : 142, now + 0.09);
      gain.gain.setValueAtTime(fullMiss ? 0.055 : 0.032, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.11);
    } catch {
      // Haptics and visual feedback still carry the miss if audio is unavailable.
    }
  }

  function triggerMissFeedback(penalty) {
    const kind = penalty.damage > 0 ? (penalty.near ? "near" : "miss") : "graze";
    const now = Date.now();
    feedbackIdRef.current += 1;
    const id = `feedback-${now}-${kind}-${feedbackIdRef.current}`;
    setMissFeedback({
      id,
      kind,
      label: penalty.label,
    });

    window.setTimeout(() => {
      setMissFeedback((current) => (current?.id === id ? null : current));
    }, 620);

    if (navigator.vibrate) {
      navigator.vibrate(kind === "miss" ? [24, 34, 28] : kind === "near" ? 14 : 8);
    }
    playMissSound(kind);
  }

  function incomingShotFor(current, damage, now, windup) {
    const currentBoss = isBossWave(current.wave);
    const levels = effectiveLevels(metaRef.current);
    const origin = targetPosition(daily.seed, current.wave, current.targetIndex, levels, mutationById(current.mutationId));
    const push = currentBoss ? (origin.x < 50 ? 13 : -13) : (origin.x < 50 ? 6 : -6);

    return {
      id: `shot-${now}-${current.wave}-${current.targetIndex}-${current.shield}`,
      boss: currentBoss,
      damage,
      x: origin.x,
      y: origin.y,
      impactX: clamp(origin.x + push, 18, 82),
      windup,
    };
  }

  function startSession(current, now) {
    if (current.status === "active") return current;
    if (current.status !== "ready") return current;

    return {
      ...current,
      status: "active",
      pendingAttack: null,
      nextAttackAt: now + attackInterval(current.wave, isBossWave(current.wave), effectiveLevels(metaRef.current), mutationById(current.mutationId)),
    };
  }

  function clearWave(current, reward, now, milestoneBonus = 0) {
    const nextWave = current.wave + 1;
    const levels = effectiveLevels(metaRef.current);
    const mutation = mutationById(current.mutationId);
    const shieldGain = mutation.id === "hotShield" ? Math.min(levels.regen || 0, Math.ceil(current.maxShield / 4)) : Math.min(levels.regen || 0, Math.ceil(current.maxShield / 3));
    const nextShield = Math.min(current.maxShield, current.shield + shieldGain);
    const clearedBoss = isBossWave(current.wave);
    return {
      ...current,
      wave: nextWave,
      enemyHp: waveHp(nextWave, mutation),
      enemyMaxHp: waveHp(nextWave, mutation),
      shield: nextShield,
      runCoins: current.runCoins + reward,
      score: current.score + reward * 12,
      targetIndex: current.targetIndex + 4,
      lastWaveReward: reward,
      pendingAttack: null,
      bossesDefeated: current.bossesDefeated + (clearedBoss ? 1 : 0),
      bestBossWaveInRun: clearedBoss ? Math.max(current.bestBossWaveInRun, current.wave) : current.bestBossWaveInRun,
      milestoneCoins: current.milestoneCoins + milestoneBonus,
      nextAttackAt: now + Math.min(850, attackInterval(nextWave, isBossWave(nextWave), levels, mutation)),
    };
  }

  function hitTarget(event) {
    event.preventDefault();
    event.stopPropagation();

    const now = Date.now();
    let burst = null;

    setSession((current) => {
      const active = startSession(current, now);
      if (active.status !== "active") return current;

      const levels = effectiveLevels(metaRef.current);
      const currentBoss = isBossWave(active.wave);
      const streak = now - active.lastHitAt < comboWindowMs(levels) ? active.streak + 1 : 1;
      const random = mulberry32(hashString(`${active.runId}:${active.wave}:${active.hits}`));
      const crit = random() < critChance(levels);
      const damage = Math.round(tapDamage(levels, currentBoss) * comboMultiplier(streak, levels) * (crit ? 2.4 : 1));
      const enemyHp = active.enemyHp - damage;
      const defeated = enemyHp <= 0;
      const milestoneGate = Math.max(metaRef.current.bestBossWave || 0, active.bestBossWaveInRun || 0);
      const milestoneBonus = defeated && currentBoss && active.wave > milestoneGate ? bossFirstClearBonus(active.wave) : 0;
      const reward = defeated ? Math.round((waveReward(active.wave, levels) + milestoneBonus) * runCoinMultiplier(active.mutationId)) : 0;
      burst = {
        id: `${now}-${active.hits}`,
        kind: defeated ? "explosion" : crit ? "crit" : "hit",
        x: target.x,
        y: target.y,
        label: defeated ? (currentBoss ? "BOSS DOWN" : "WAVE CLEAR") : crit ? `CRIT ${damage}` : `-${formatNumber(damage)}`,
        subLabel: defeated ? `+${formatNumber(reward)} ◎${milestoneBonus ? " bonus" : ""}` : "",
        boss: currentBoss,
      };

      const next = {
        ...active,
        enemyHp: Math.max(0, enemyHp),
        score: active.score + damage,
        hits: active.hits + 1,
        streak,
        bestStreak: Math.max(active.bestStreak, streak),
        lastHitAt: now,
      };

      return defeated ? clearWave(next, reward, now, milestoneBonus) : next;
    });

    if (burst) addBurst(burst, burst.kind === "explosion" ? 640 : 700);
  }

  function missField(event) {
    if (session.status !== "active") return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const snapshot = sessionRef.current;
    const levels = effectiveLevels(metaRef.current);
    const mutation = mutationById(snapshot.mutationId);
    const liveTarget = targetPosition(daily.seed, snapshot.wave, snapshot.targetIndex, levels, mutation);
    const targetCenterX = rect.width * (liveTarget.x / 100);
    const targetCenterY = rect.height * (liveTarget.y / 100);
    const distance = Math.hypot(event.clientX - rect.left - targetCenterX, event.clientY - rect.top - targetCenterY);
    const distanceRatio = distance / Math.max(1, targetSize(levels, mutation) / 2);
    const penalty = missPenaltyForDistance(levels, distanceRatio);
    feedbackIdRef.current += 1;
    const missBurst = {
      id: `miss-${Date.now()}-${feedbackIdRef.current}`,
      kind: penalty.near ? "miss near" : "miss",
      x: clamp(x, 12, 88),
      y: clamp(y, 12, 88),
      label: penalty.damage ? `${penalty.label} -${penalty.damage}` : penalty.label,
    };
    triggerMissFeedback(penalty);

    setSession((current) => {
      if (current.status !== "active") return current;
      const damage = penalty.damage;
      const shield = current.shield - damage;
      const nearMisses = current.nearMisses + (penalty.near ? 1 : 0);
      const keepsCombo = damage === 0;
      if (shield <= 0) {
        const rebootShield = current.rebootUsed ? 0 : shieldRebootValue(metaRef.current, current.maxShield);
        if (rebootShield > 0) {
          return {
            ...current,
            shield: rebootShield,
            misses: current.misses + 1,
            nearMisses,
            streak: 0,
            rebootUsed: true,
          };
        }

        return {
          ...current,
          shield: 0,
          misses: current.misses + 1,
          nearMisses,
          streak: 0,
          pendingAttack: null,
          status: "ended",
          finalReason: "Missed into danger",
        };
      }

      return {
        ...current,
        shield,
        misses: current.misses + 1,
        nearMisses,
        streak: keepsCombo ? current.streak : 0,
        score: Math.max(0, current.score - damage * penalty.scoreLoss),
      };
    });
    addBurst(missBurst, 650);
  }

  function buyUpgrade(upgradeId) {
    const upgrade = upgrades.find((item) => item.id === upgradeId);
    if (!upgrade) return;

    setMeta((current) => {
      if (current.bestWave < upgrade.unlockWave) return current;
      const level = current.levels[upgrade.id] || 0;
      if (upgrade.maxLevel && level >= upgrade.maxLevel) return current;
      const cost = upgradeCost(upgrade, level);
      if (current.coins < cost) return current;
      return {
        ...current,
        coins: current.coins - cost,
        levels: {
          ...current.levels,
          [upgrade.id]: level + 1,
        },
        analytics: {
          ...current.analytics,
          upgradeChoices: {
            ...(current.analytics?.upgradeChoices || {}),
            [upgrade.id]: ((current.analytics?.upgradeChoices || {})[upgrade.id] || 0) + 1,
          },
        },
      };
    });
  }

  function buyCoreUpgrade(upgradeId) {
    const upgrade = coreUpgrades.find((item) => item.id === upgradeId);
    if (!upgrade) return;

    setMeta((current) => {
      if ((current.bestBossWave || 0) < upgrade.unlockBoss) return current;
      const level = current.coreUpgrades?.[upgrade.id] || 0;
      if (level >= upgrade.maxLevel) return current;
      const cost = coreUpgradeCost(upgrade, level);
      if ((current.cores || 0) < cost) return current;
      return {
        ...current,
        cores: current.cores - cost,
        coreUpgrades: {
          ...current.coreUpgrades,
          [upgrade.id]: level + 1,
        },
      };
    });
  }

  function selectMutation(mutationId) {
    const mutation = mutationById(mutationId);
    if (mutation.id !== "none" && !mutationUnlocked(metaRef.current)) return;

    const nextMeta = {
      ...metaRef.current,
      activeMutationId: mutation.id,
    };
    metaRef.current = nextMeta;
    setMeta(nextMeta);

    if (sessionRef.current.status === "ready") {
      setSession(createSession(daily, nextMeta));
    }
  }

  function overclockNow() {
    const current = metaRef.current;
    const reward = overclockCoreReward(current);
    if (reward <= 0 || sessionRef.current.status === "active") return;

    const retainedStartWave = retainedStartWaveAfterOverclock(current.coreUpgrades);
    const nextMeta = {
      ...current,
      coins: 0,
      cores: (current.cores || 0) + reward,
      totalCores: (current.totalCores || 0) + reward,
      levels: { ...baseLevels },
      maxStartWave: retainedStartWave,
      selectedStartWave: retainedStartWave,
      cycleBestWave: 0,
      cycleBestBossWave: 0,
      cycleCoreBonus: 0,
      overclocks: (current.overclocks || 0) + 1,
      activeMutationId: "none",
    };

    metaRef.current = nextMeta;
    finishedRunRef.current = "";
    setShareStatus("idle");
    setShowEndScreen(false);
    setBursts([]);
    setShots([]);
    setMobileView("game");
    setMeta(nextMeta);
    setSession(createSession(daily, nextMeta));
  }

  function toggleUpgradeLane(laneId) {
    setOpenUpgradeLanes((current) => ({
      ...current,
      [laneId]: !current[laneId],
    }));
  }

  function selectStartWave(wave) {
    const normalized = normalizeStartWave(wave);
    setMeta((current) => {
      if (normalized !== 1 && normalized > (current.maxStartWave || 1)) return current;
      return {
        ...current,
        selectedStartWave: normalized,
      };
    });
  }

  function buyStartWaveGate(wave) {
    const normalized = normalizeStartWave(wave);
    setMeta((current) => {
      const maxStartWave = current.maxStartWave || 1;
      const nextGate = nextStartWaveGate(maxStartWave);
      const progressWave = Math.max(current.bestWave || 0, sessionRef.current?.wave || 0);
      const cost = startWaveCost(normalized);
      if (normalized !== nextGate || progressWave < normalized || current.coins < cost) return current;

      return {
        ...current,
        coins: current.coins - cost,
        maxStartWave: normalized,
        selectedStartWave: normalized,
      };
    });
  }

  function newRun() {
    if (sessionRef.current.status === "active") return;
    finishedRunRef.current = "";
    setShareStatus("idle");
    setShowEndScreen(false);
    setMobileView("game");
    setBursts([]);
    setShots([]);
    setSession(createSession(daily, metaRef.current));
  }

  function openWorkshopPanel() {
    if (sessionRef.current.status === "active") return;
    setShowEndScreen(false);
    setMobileView("workshop");
  }

  async function shareScore() {
    const text = shareTextFor(session, daily);
    setShareStatus("working");

    try {
      if (navigator.share) {
        await navigator.share({ title: "ClickDefense", text });
        setShareStatus("shared");
      } else {
        await copyText(text);
        setShareStatus("copied");
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        await copyText(text);
        setShareStatus("copied");
      } else {
        setShareStatus("idle");
      }
    }
  }

  function claimDoubleCoins() {
    if (session.status !== "ended" || session.adBonusClaimed || session.runCoins <= 0) return;

    const bonus = session.runCoins;
    setSession((current) => {
      if (current.status !== "ended" || current.adBonusClaimed) return current;
      return {
        ...current,
        adBonusClaimed: true,
        adBonusCoins: bonus,
      };
    });
    setMeta((current) => ({
      ...current,
      coins: current.coins + bonus,
      totalCoins: current.totalCoins + bonus,
      analytics: {
        ...current.analytics,
        adOffersAccepted: (current.analytics?.adOffersAccepted || 0) + 1,
      },
      lastRun: current.lastRun ? { ...current.lastRun, adBonusCoins: bonus } : current.lastRun,
    }));
  }

  return (
    <main className={`app-shell mobile-${mobileView}-open run-${session.status}`} style={{ "--theme-accent": daily.theme.accent }}>
      <section className={`game-card game-${session.status}`} aria-label="ClickDefense wave game">
        <header className="game-header">
          <div className="brand-lockup">
            <span className="speed-lines" aria-hidden="true" />
            <div>
              <h1>ClickDefense</h1>
              <span className="arena-name">Wave Defense Clicker</span>
            </div>
          </div>
          <div className="top-bank">
            <span aria-hidden="true">◎</span>
            <strong>{formatNumber(meta.coins + session.runCoins)}</strong>
            <small>coins</small>
          </div>
          <button className="settings-button mobile-shop-button" type="button" disabled={session.status === "active"} onClick={openWorkshopPanel} aria-label="Open workshop">
            Shop
          </button>
        </header>

        <section className="hud" aria-label="Run stats">
          <HudStat label={boss ? "Boss Wave" : "Wave"} value={session.wave} tone={boss ? "hot" : ""} />
          <HudStat label="Score" value={formatNumber(session.score)} />
          <HudStat label="Streak" value={`${session.streak}x`} tone={session.streak >= 10 ? "hot" : ""} />
        </section>

        <section className="play-wrap">
          <div className={`play-field ${boss ? "boss-field" : ""}`} onPointerDown={missField}>
            {missFeedback ? (
              <span className={`miss-feedback ${missFeedback.kind}`} key={missFeedback.id} aria-hidden="true">
                <b>{missFeedback.label}</b>
              </span>
            ) : null}
            <div className={`wave-banner ${boss ? "boss" : ""}`}>
              <strong>{boss ? "BOSS WAVE" : `WAVE ${session.wave}`}</strong>
              <span>{boss ? "Break the drone before it cracks your shield" : "Tap the moving target. Misses damage the shield."}</span>
            </div>

            <div className="field-status">
              <span>{session.status === "ready" ? "Tap target to start" : boss ? "Incoming fire" : `${session.bestStreak} best streak`}</span>
              <strong>{formatNumber(currentTapDamage)} dmg / hit</strong>
            </div>

            <div className="enemy-panel">
              <div className="enemy-title">
                <span>{boss ? "Boss Drone" : `Wave ${session.wave}`}</span>
                <strong>{formatNumber(Math.max(0, session.enemyHp))} HP</strong>
              </div>
              <div className="bar-track enemy-bar">
                <span style={{ width: `${hpPercent}%` }} />
              </div>
            </div>

            <div className={`shield-generator ${shieldUnderFire ? "under-fire" : ""}`} aria-hidden="true">
              <span className="shield-dome" style={{ "--shield-fill": `${shieldPercent}%` }} />
              <span className="shield-core" />
              <span className="shield-pad" />
            </div>

            <div className={`shield-panel ${shieldUnderFire ? "under-fire" : ""}`}>
              <span>Shield</span>
              <strong>
                {session.shield}/{session.maxShield}
              </strong>
              <div className="bar-track shield-bar">
                <span style={{ width: `${shieldPercent}%` }} />
              </div>
            </div>

            <button
              className={`tap-target ${session.status === "active" ? "is-live" : ""} ${targetSkin(session.wave, boss)} ${targetDamageLevel(hpPercent)}`}
              type="button"
              aria-label="Hit wave target"
              disabled={session.status === "ended"}
              onPointerDown={hitTarget}
              style={{
                "--target-x": `${target.x}%`,
                "--target-y": `${target.y}%`,
                "--target-size": `${targetSize(runLevels, runMutation)}px`,
                "--drift": daily.drift,
                "--chaos": chaos.toFixed(2),
                "--chaos-shift": `${(chaos * 5).toFixed(1)}px`,
                "--chaos-shift-half": `${(chaos * 2.5).toFixed(1)}px`,
                "--chaos-tilt": `${(chaos * 4).toFixed(1)}deg`,
                "--chaos-tilt-neg": `${(-chaos * 4).toFixed(1)}deg`,
                "--chaos-tilt-half": `${(chaos * 2).toFixed(1)}deg`,
                "--move-ms": `${movementTransitionMs(session.wave, boss, runLevels)}ms`,
              }}
            >
              <span className="target-ring outer" />
              <span className="target-ring middle" />
              {boss ? (
                <>
                  <span className="boss-wing left" aria-hidden="true" />
                  <span className="boss-wing right" aria-hidden="true" />
                  <span className="boss-cannon" aria-hidden="true" />
                  <span className="boss-eye" aria-hidden="true" />
                </>
              ) : null}
              <span className="target-cracks" aria-hidden="true" />
              <span className="target-core">{session.status === "ready" ? "GO" : boss ? "BOSS" : "HIT"}</span>
            </button>

            <div className="tap-instruction" aria-hidden="true">
              <span>{boss ? "TAP THE BOSS" : "TAP THE TARGET"}</span>
              <strong>{session.status === "ready" ? "to start the run" : "to deal damage"}</strong>
            </div>

            {shots.map((shot) => (
              <span
                className={`boss-shot ${shot.boss ? "boss" : ""}`}
                key={shot.id}
                style={{
                  "--shot-x": `${shot.x}%`,
                  "--shot-y": `${shot.y}%`,
                  "--impact-x": `${shot.impactX}%`,
                  "--shot-duration": `${shot.windup}ms`,
                }}
                aria-hidden="true"
              >
                <i />
                <b>-{shot.damage}</b>
              </span>
            ))}

            {bursts.map((burst) =>
              burst.kind === "explosion" ? (
                <span
                  className={`target-explosion ${burst.boss ? "boss" : ""}`}
                  key={burst.id}
                  style={{ left: `${burst.x}%`, top: `${burst.y}%` }}
                  aria-hidden="true"
                >
                  <i className="piece piece-1" />
                  <i className="piece piece-2" />
                  <i className="piece piece-3" />
                  <i className="piece piece-4" />
                  <i className="piece piece-5" />
                  <i className="piece piece-6" />
                  <i className="piece piece-7" />
                  <i className="piece piece-8" />
                  <b>{burst.label}</b>
                  <small>{burst.subLabel}</small>
                </span>
              ) : (
                <span className={`field-burst ${burst.kind}`} key={burst.id} style={{ left: `${burst.x}%`, top: `${burst.y}%` }}>
                  {burst.label}
                </span>
              ),
            )}
          </div>
        </section>

        <section className="bank-row" aria-label="Run resources">
          <div className="coin-bank">
            <span aria-hidden="true">◎</span>
            <strong>{formatNumber(session.runCoins)}</strong>
          </div>
          <div className="power-readout">
            <span>{formatNumber(meta.coins)} saved</span>
            <span>start wave {selectedStartWave}</span>
            <span>{nextBossWave || 5} next boss</span>
            <span>{mutationById(session.mutationId).name}</span>
            <span>{runMissRate}% miss</span>
          </div>
        </section>
      </section>

      <section className="workshop" aria-label="Permanent upgrades">
        <div className="workshop-header">
          <div>
            <span>Workshop</span>
            <strong>{formatNumber(meta.coins)} coins · {formatNumber(meta.cores || 0)} cores</strong>
          </div>
          <button type="button" disabled={session.status === "active"} onClick={newRun}>
            {session.status === "active" ? "Run active" : session.status === "ended" ? `Start Wave ${selectedStartWave}` : `Fresh Wave ${selectedStartWave}`}
          </button>
        </div>
        <section className="between-run-panel" aria-label="Between runs">
          <span>Between runs</span>
          <strong>Upgrade before Wave {selectedStartWave}</strong>
          <p>Spend coins, pick a launch gate, then jump back into the defense.</p>
        </section>
        <div className="workshop-scroll">
        <section className={`overclock-panel ${hasOverclockAccess ? "unlocked" : ""}`} aria-label="Overclock ascension">
          <header>
            <div>
              <span>Overclock</span>
              <strong>{hasOverclockAccess ? `+${formatNumber(overclockReward)} cores ready` : `Beat Boss ${OVERCLOCK_UNLOCK_BOSS}`}</strong>
            </div>
            <small>{meta.overclocks || 0} resets</small>
          </header>
          <div className="overclock-readout">
            <span>Cycle boss {meta.cycleBestBossWave || 0}</span>
            <span>Lifetime boss {meta.bestBossWave || 0}</span>
            <span>{Math.round((meta.cycleCoreBonus || 0) * 100)}% core boost</span>
          </div>
          <button type="button" disabled={!canOverclock} onClick={overclockNow}>
            {session.status === "active" ? "Finish run first" : overclockReward > 0 ? `Overclock for ${formatNumber(overclockReward)} cores` : "Reach Boss 100 this cycle"}
          </button>
        </section>
        {hasOverclockAccess ? (
          <section className="core-shop" aria-label="Core upgrades">
            <header>
              <div>
                <span>Core upgrades</span>
                <strong>Permanent power</strong>
              </div>
              <small>{formatNumber(meta.cores || 0)} cores</small>
            </header>
            <div className="core-upgrade-list">
              {coreUpgrades.map((upgrade) => (
                <CoreUpgradeButton key={upgrade.id} upgrade={upgrade} level={meta.coreUpgrades?.[upgrade.id] || 0} cores={meta.cores || 0} bestBossWave={meta.bestBossWave || 0} onBuy={buyCoreUpgrade} />
              ))}
            </div>
          </section>
        ) : null}
        <section className="mutation-panel" aria-label="Run mutations">
          <header>
            <div>
              <span>Mutations</span>
              <strong>{hasMutationAccess ? "Choose next run" : `Unlock at Boss ${MUTATION_UNLOCK_BOSS}`}</strong>
            </div>
            <small>{activeMutationForMeta(meta).name}</small>
          </header>
          <div className="mutation-list">
            {mutations.map((mutation) => (
              <MutationButton key={mutation.id} mutation={mutation} active={activeMutationForMeta(meta).id === mutation.id} unlocked={hasMutationAccess || mutation.id === "none"} onSelect={selectMutation} />
            ))}
          </div>
        </section>
        <section className="start-gates" aria-label="Start wave gates">
          <header>
            <div>
              <span>Launch gate</span>
              <strong>Start at Wave {selectedStartWave}</strong>
            </div>
            <small>
              {nextStartGate ? `Next: Wave ${nextStartGate} after Boss ${checkpointBossWave(nextStartGate)} for ${formatNumber(startWaveCost(nextStartGate))} ◎` : "All gates unlocked"}
            </small>
          </header>
          <div className="start-gate-list">
            <StartGateButton wave={1} meta={meta} progressWave={progressWave} onBuy={buyStartWaveGate} onSelect={selectStartWave} />
            {startWaveTiers.map((wave) => (
              <StartGateButton key={wave} wave={wave} meta={meta} progressWave={progressWave} onBuy={buyStartWaveGate} onSelect={selectStartWave} />
            ))}
          </div>
        </section>
        <div className="upgrade-list">
          {upgradeLanes.map((lane) => {
            const laneOpen = Boolean(openUpgradeLanes[lane.id]);
            const laneUpgrades = upgrades.filter((upgrade) => upgrade.lane === lane.id);
            return (
              <section className={`upgrade-lane ${laneOpen ? "open" : "collapsed"}`} key={lane.id}>
                <button className="lane-toggle" type="button" aria-expanded={laneOpen} aria-controls={`upgrade-lane-${lane.id}`} onClick={() => toggleUpgradeLane(lane.id)}>
                  <span className="lane-chevron" aria-hidden="true" />
                  <span className="lane-title">
                    <strong>{lane.label}</strong>
                    <small>{lane.description}</small>
                  </span>
                  <span className="lane-count">{laneUpgrades.length}</span>
                </button>
                {laneOpen ? (
                  <div className="lane-upgrades" id={`upgrade-lane-${lane.id}`}>
                    {laneUpgrades.map((upgrade) => (
                      <UpgradeButton
                        key={upgrade.id}
                        upgrade={upgrade}
                        level={meta.levels[upgrade.id] || 0}
                        coins={meta.coins}
                        bestWave={Math.max(meta.bestWave, session.wave)}
                        onBuy={buyUpgrade}
                      />
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
        </div>
      </section>

      <aside className="stats-strip" aria-label="Local stats">
        <span>Wave {meta.bestWave}</span>
        <span>Boss {meta.bestBossWave || 0}</span>
        <span>Cycle {meta.cycleBestBossWave || 0}</span>
        <span>{formatNumber(meta.cores || 0)} cores</span>
        <span>{meta.overclocks || 0} clocks</span>
        <span>Avg {avgWave.toFixed(1)}</span>
        <span>Miss {globalMissRate}%</span>
        <span>Top {topUpgrade}</span>
        <span>Score {formatNumber(meta.bestScore)}</span>
        <span>{meta.gamesPlayed} runs</span>
        <span>{meta.bestStreak} streak</span>
      </aside>

      {session.status === "ended" && showEndScreen ? (
        <EndScreen
          session={session}
          meta={meta}
          daily={daily}
          shareStatus={shareStatus}
          onShare={shareScore}
          onDoubleCoins={claimDoubleCoins}
          onOpenWorkshop={openWorkshopPanel}
        />
      ) : null}
    </main>
  );
}

export default App;
