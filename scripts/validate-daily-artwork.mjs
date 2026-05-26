#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const artworkRoot = "app/daily/_artworks";
const requiredFiles = ["artwork.tsx", "index.ts", "profile.ts", "thumb.webp"];
const axes = ["palette", "composition", "interaction", "renderMode", "mood", "material"];
const personalityAxes = ["temperament", "socialEnergy", "humor", "pressure", "voice"];
const allowedBriefValues = {
  palette: [
    "black-ground",
    "white-ground",
    "high-chroma",
    "fluorescent",
    "monochrome",
    "primary",
    "earth",
    "pastel",
    "institutional",
    "metallic",
    "night",
  ],
  composition: [
    "single-object",
    "diagram",
    "map",
    "instrument",
    "room-scene",
    "typographic",
    "game-board",
    "pattern-system",
    "timeline",
    "split-screen",
    "field",
  ],
  interaction: ["press", "drag", "type", "hold", "erase", "tune", "collide", "sort", "trace", "plant", "shake"],
  renderMode: ["canvas-2d", "svg", "css-dom", "webgl", "html-controls", "text-grid", "mixed-dom"],
  mood: ["loud", "clinical", "comic", "severe", "tender", "chaotic", "ceremonial", "deadpan", "meditative", "industrial"],
  material: ["paper", "textile", "mineral", "organism", "machine", "architecture", "weather", "screen", "body", "food", "transit", "document"],
};
const allowedPersonalityValues = {
  temperament: ["brash", "wry", "tender", "prissy", "feral", "ceremonial", "suspicious", "giddy", "mournful", "bossy", "shy", "grandiose"],
  socialEnergy: [
    "confessional",
    "heckling",
    "maternal",
    "bureaucratic",
    "flirtatious",
    "schoolteacher",
    "street-vendor",
    "doctor",
    "foreman",
    "oracle",
    "radio-host",
    "conspirator",
  ],
  humor: ["dry", "slapstick", "morbid", "camp", "deadpan", "petty", "absurd", "sardonic", "earnest-no-joke", "operatic", "childlike", "menacing"],
  pressure: ["itchy", "overheated", "solemn", "panicked", "domestic", "litigious", "hungry", "medical", "civic", "ritual", "sulking", "triumphant"],
  voice: [
    "workshop-gothic",
    "kitchen-table",
    "municipal-romantic",
    "stage-whisper",
    "market-stall",
    "diary-with-teeth",
    "ship-log",
    "school-notebook",
    "emergency-manual",
    "sermon",
    "love-letter",
    "lab-notes",
  ],
};
const plaqueCliches = [
  /\bthis (piece|work) explores\b/i,
  /\bthe (piece|work) explores\b/i,
  /\bthis (piece|work) treats\b/i,
  /\bthe (piece|work) treats\b/i,
  /\bas a meditation on\b/i,
  /\binterrogates?\b/i,
  /\binvestigates?\b/i,
  /\bjuxtaposes?\b/i,
  /\bliminal\b/i,
  /\bmateriality\b/i,
  /\btension between\b/i,
  /\bembodied continuity\b/i,
  /\bbehav(?:e|es|ing) like\b/i,
];
const overusedWords = [
  "paper",
  "ledger",
  "rubbing",
  "margin",
  "ink",
  "thread",
  "stitched",
  "graphite",
  "soot",
  "dust",
  "grain",
  "field",
  "page",
  "letter",
  "cloth",
  "weaving",
];
const seedTraceTokens = [
  "Seed trace:",
  "source=",
  "premise=",
  "temperament=",
  "socialEnergy=",
  "humor=",
  "pressure=",
  "voice=",
  "wildMove=",
  "interface=",
  "motion=",
  "materialMutation=",
  "scaleRupture=",
  "antiDefault=",
];

function git(args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function fail(errors) {
  if (errors.length === 0) {
    console.log("Daily artwork validation passed.");
    return;
  }

  for (const error of errors) {
    console.error(`::error::${error}`);
  }
  process.exit(1);
}

function readRepoFile(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function collectProfilePaths(relativeDir = artworkRoot) {
  const absoluteDir = path.join(root, relativeDir);
  if (!existsSync(absoluteDir)) {
    return [];
  }

  return readdirSync(absoluteDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `${relativeDir}/${entry.name}/profile.ts`)
    .filter((profilePath) => existsSync(path.join(root, profilePath)));
}

function extractString(content, fieldName) {
  const match = new RegExp(`${fieldName}:\\s*"([^"]*)"`, "m").exec(content);
  return match?.[1] ?? "";
}

function extractVisualBrief(content) {
  const block = /visualBrief:\s*{([\s\S]*?)\n\s*},/m.exec(content)?.[1] ?? "";
  const brief = {};
  for (const axis of axes) {
    brief[axis] = extractString(block, axis);
  }
  return brief;
}

function extractPersonalityBrief(content) {
  const block = /personality:\s*{([\s\S]*?)\n\s*},/m.exec(content)?.[1] ?? "";
  const personality = {};
  for (const axis of personalityAxes) {
    personality[axis] = extractString(block, axis);
  }
  personality.signature = extractString(block, "signature");
  return personality;
}

function extractTopLevelString(content, fieldName) {
  const match = new RegExp(`^  ${fieldName}:\\s*"([^"]*)"`, "m").exec(content);
  return match?.[1] ?? "";
}

function parseProfile(profilePath) {
  const content = readRepoFile(profilePath);
  const folder = profilePath.split("/").at(-2) ?? "";
  return {
    path: profilePath,
    folder,
    content,
    date: extractString(content, "date"),
    slug: extractString(content, "slug"),
    title: extractString(content, "title"),
    thumbColor: extractString(content, "thumbColor"),
    visualBrief: extractVisualBrief(content),
    personality: extractPersonalityBrief(content),
  };
}

function profileSortNewestFirst(left, right) {
  return right.date.localeCompare(left.date);
}

function validateProfileShape(profile, errors) {
  if (!profile.date || !profile.slug || !profile.title) {
    errors.push(`${profile.path} must define date, slug, and title.`);
  }

  if (!profile.folder.startsWith(`${profile.date}-`) || profile.folder !== `${profile.date}-${profile.slug}`) {
    errors.push(`${profile.path} date/slug must match folder name ${profile.folder}.`);
  }

  for (const axis of axes) {
    const value = profile.visualBrief[axis];
    if (!value) {
      errors.push(`${profile.path} is missing visualBrief.${axis}.`);
      continue;
    }
    if (!allowedBriefValues[axis].includes(value)) {
      errors.push(`${profile.path} visualBrief.${axis}="${value}" is not an allowed value.`);
    }
  }

  if (!/^#[0-9a-f]{6}$/i.test(profile.thumbColor)) {
    errors.push(`${profile.path} thumbColor must be a 6-digit hex color.`);
  }
}

function hexToHsl(hex) {
  const raw = hex.replace("#", "");
  const r = Number.parseInt(raw.slice(0, 2), 16) / 255;
  const g = Number.parseInt(raw.slice(2, 4), 16) / 255;
  const b = Number.parseInt(raw.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return { hue: 0, saturation: 0, lightness };
  }

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (max === r) {
    hue = 60 * (((g - b) / delta) % 6);
  } else if (max === g) {
    hue = 60 * ((b - r) / delta + 2);
  } else {
    hue = 60 * ((r - g) / delta + 4);
  }

  return { hue: hue < 0 ? hue + 360 : hue, saturation, lightness };
}

function hueDistance(left, right) {
  const distance = Math.abs(left - right);
  return Math.min(distance, 360 - distance);
}

function isMutedLight(hex) {
  const hsl = hexToHsl(hex);
  return hsl.saturation < 0.34 && hsl.lightness > 0.56;
}

function isTooSimilarColor(leftHex, rightHex) {
  const left = hexToHsl(leftHex);
  const right = hexToHsl(rightHex);
  return (
    hueDistance(left.hue, right.hue) < 24 &&
    Math.abs(left.saturation - right.saturation) < 0.2 &&
    Math.abs(left.lightness - right.lightness) < 0.16
  );
}

function sharedAxes(left, right) {
  return axes.filter((axis) => left.visualBrief[axis] === right.visualBrief[axis]);
}

function sharedPersonalityAxes(left, right) {
  return personalityAxes.filter((axis) => left.personality[axis] && left.personality[axis] === right.personality[axis]);
}

function wordHits(content) {
  const lower = content.toLowerCase();
  return overusedWords.filter((word) => new RegExp(`\\b${word}\\b`, "i").test(lower));
}

function validatePersonality(newProfile, recentProfiles, errors) {
  for (const axis of personalityAxes) {
    const value = newProfile.personality[axis];
    if (!value) {
      errors.push(`${newProfile.path} is missing personality.${axis}.`);
      continue;
    }
    if (!allowedPersonalityValues[axis].includes(value)) {
      errors.push(`${newProfile.path} personality.${axis}="${value}" is not an allowed value.`);
    }
  }

  const signature = newProfile.personality.signature;
  if (!signature) {
    errors.push(`${newProfile.path} is missing personality.signature.`);
  } else if (signature.length < 70 || signature.length > 220) {
    errors.push(`${newProfile.path} personality.signature should be one vivid sentence between 70 and 220 characters.`);
  }

  const previousWithPersonality = recentProfiles.find((profile) => profile.personality.signature);
  if (previousWithPersonality) {
    const immediateMatches = sharedPersonalityAxes(newProfile, previousWithPersonality);
    if (immediateMatches.length > 1) {
      errors.push(
        `${newProfile.path} shares too much personality with ${previousWithPersonality.date} ${previousWithPersonality.title}: ${immediateMatches.join(", ")}. Maximum is 1.`,
      );
    }
  }

  for (const recent of recentProfiles.filter((profile) => profile.personality.signature).slice(0, 5)) {
    const matches = sharedPersonalityAxes(newProfile, recent);
    if (matches.length > 2) {
      errors.push(
        `${newProfile.path} shares ${matches.length} personality axes with ${recent.date} ${recent.title}: ${matches.join(", ")}. Maximum is 2.`,
      );
    }
  }
}

function validateDiversity(newProfile, recentProfiles, errors) {
  const previous = recentProfiles[0];
  if (!previous) {
    return;
  }

  const immediateMatches = sharedAxes(newProfile, previous);
  if (immediateMatches.length > 0) {
    errors.push(
      `${newProfile.path} shares visualBrief axes with the previous piece (${previous.date} ${previous.title}): ${immediateMatches.join(", ")}. Pick a harder turn.`,
    );
  }

  for (const recent of recentProfiles.slice(0, 5)) {
    const matches = sharedAxes(newProfile, recent);
    if (matches.length > 2) {
      errors.push(
        `${newProfile.path} shares ${matches.length} visualBrief axes with ${recent.date} ${recent.title}: ${matches.join(", ")}. Maximum is 2.`,
      );
    }
  }

  const mutedRecentCount = recentProfiles.slice(0, 3).filter((profile) => isMutedLight(profile.thumbColor)).length;
  if (isMutedLight(newProfile.thumbColor) && mutedRecentCount >= 2) {
    errors.push(`${newProfile.path} uses another muted light thumbColor after ${mutedRecentCount} of the last 3 did. Pick a more forceful color world.`);
  }

  for (const recent of recentProfiles.slice(0, 3)) {
    if (isTooSimilarColor(newProfile.thumbColor, recent.thumbColor)) {
      errors.push(`${newProfile.path} thumbColor ${newProfile.thumbColor} is too close to ${recent.date} ${recent.title} (${recent.thumbColor}).`);
    }
  }

  const repeatedWords = wordHits(newProfile.content).filter((word) =>
    recentProfiles.slice(0, 5).some((profile) => wordHits(profile.content).includes(word)),
  );
  if (new Set(repeatedWords).size >= 4) {
    errors.push(`${newProfile.path} repeats too many recent material words: ${[...new Set(repeatedWords)].join(", ")}.`);
  }

  const explanation = extractString(newProfile.content, "explanation");
  if (/\bthis square\b/i.test(explanation)) {
    errors.push(`${newProfile.path} explanation uses "this square"; write a fresher artist statement.`);
  }
}

function validatePlaqueVoice(newProfile, errors) {
  const explanation = extractTopLevelString(newProfile.content, "explanation");
  if (!explanation) {
    errors.push(`${newProfile.path} must include a top-level explanation string.`);
    return;
  }

  const sentences = explanation.split(/[.!?]+/).map((part) => part.trim()).filter(Boolean);
  if (sentences.length < 2 || sentences.length > 4) {
    errors.push(`${newProfile.path} explanation should be 2-4 sentences.`);
  }

  if (!/\b(I|I'm|I've|I'd|me|my|mine|we|we're|we've|our)\b/i.test(explanation)) {
    errors.push(`${newProfile.path} explanation should sound first-person and inhabited, not curatorial.`);
  }

  for (const pattern of plaqueCliches) {
    if (pattern.test(explanation)) {
      errors.push(`${newProfile.path} explanation uses grant-speak/cliche: ${pattern}`);
    }
  }
}

function validateSeedTrace(newProfile, errors) {
  const inspiration = extractString(newProfile.content, "inspiration");
  if (!inspiration) {
    errors.push(`${newProfile.path} must include inspiration with a one-line seed trace.`);
    return;
  }

  for (const token of seedTraceTokens) {
    if (!inspiration.includes(token)) {
      errors.push(`${newProfile.path} inspiration seed trace is missing ${token}`);
    }
  }
}

function validateAllProfiles(errors) {
  for (const profilePath of collectProfilePaths()) {
    validateProfileShape(parseProfile(profilePath), errors);
  }
}

function validatePullRequest(errors) {
  const baseSha = process.env.BASE_SHA;
  const headSha = process.env.HEAD_SHA || "HEAD";
  if (!baseSha) {
    validateAllProfiles(errors);
    return;
  }

  const changedFiles = git(["diff", "--name-only", baseSha, headSha]).split("\n").filter(Boolean);
  const addedFiles = git(["diff", "--diff-filter=A", "--name-only", baseSha, headSha]).split("\n").filter(Boolean);
  if (changedFiles.length === 0) {
    errors.push("Daily artwork PR has no file changes.");
    return;
  }

  if (!changedFiles.includes("app/daily/_lib/daily-registry.ts")) {
    errors.push("Daily artwork PR must update app/daily/_lib/daily-registry.ts.");
  }

  const addedArtworkDirs = [
    ...new Set(
      addedFiles
        .map((file) => /^app\/daily\/_artworks\/(\d{4}-\d{2}-\d{2}-[^/]+)\//.exec(file)?.[1])
        .filter(Boolean)
        .map((folder) => `${artworkRoot}/${folder}`),
    ),
  ];

  if (addedArtworkDirs.length !== 1) {
    errors.push(`Daily artwork PR must add exactly one artwork folder; found ${addedArtworkDirs.length}.`);
    return;
  }

  const artworkDir = addedArtworkDirs[0];
  for (const requiredFile of requiredFiles) {
    const requiredPath = `${artworkDir}/${requiredFile}`;
    if (!addedFiles.includes(requiredPath)) {
      errors.push(`Daily artwork PR must add ${requiredPath}.`);
    }
  }

  const newProfile = parseProfile(`${artworkDir}/profile.ts`);
  const recentProfiles = collectProfilePaths()
    .filter((profilePath) => profilePath !== newProfile.path)
    .map(parseProfile)
    .sort(profileSortNewestFirst);

  validateProfileShape(newProfile, errors);
  validatePersonality(newProfile, recentProfiles, errors);
  validatePlaqueVoice(newProfile, errors);
  validateSeedTrace(newProfile, errors);
  validateDiversity(newProfile, recentProfiles, errors);
}

const errors = [];
validatePullRequest(errors);
fail(errors);
