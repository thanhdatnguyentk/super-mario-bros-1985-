import type { BiomeType } from '../types/level-schema.ts';

export interface BiomePalette {
  skyBg: string;
  groundPrimary: string;
  groundHighlight: string;
  groundShadow: string;
  brickPrimary: string;
  brickMortar: string;
  questionColors: [string, string, string]; // 3-frame shimmer cycle
  pipePrimary: string;
  pipeHighlight: string;
  pipeDark: string;
  hillFill: string;
  hillOutline: string;
  bushFill: string;
  cloudFill: string;
  cloudOutline: string;
  hudText: string;
}

export const NES_BIOME_PALETTES: Record<BiomeType, BiomePalette> = {
  overworld: {
    skyBg: '#5C94FC', // Authentic NES 0x22 Sky Blue
    groundPrimary: '#C84C0C', // NES 0x17 Brick Red-Brown
    groundHighlight: '#FCBCB0', // NES 0x36 Peach Highlight
    groundShadow: '#000000',
    brickPrimary: '#C84C0C',
    brickMortar: '#000000',
    questionColors: ['#FC9838', '#C84C0C', '#887000'],
    pipePrimary: '#00A800', // NES 0x1A Vivid Green
    pipeHighlight: '#80D010', // NES 0x29 Lime Green
    pipeDark: '#005000',
    hillFill: '#00A800',
    hillOutline: '#000000',
    bushFill: '#80D010',
    cloudFill: '#FCFCFC',
    cloudOutline: '#000000',
    hudText: '#FCFCFC',
  },
  underground: {
    skyBg: '#000000',
    groundPrimary: '#008088',
    groundHighlight: '#00E8D8',
    groundShadow: '#004058',
    brickPrimary: '#008088',
    brickMortar: '#000000',
    questionColors: ['#FC9838', '#C84C0C', '#887000'],
    pipePrimary: '#00A800',
    pipeHighlight: '#80D010',
    pipeDark: '#005000',
    hillFill: '#005000',
    hillOutline: '#000000',
    bushFill: '#008088',
    cloudFill: '#008088',
    cloudOutline: '#004058',
    hudText: '#FCFCFC',
  },
  underwater: {
    skyBg: '#2038EC',
    groundPrimary: '#00A844',
    groundHighlight: '#80D010',
    groundShadow: '#005000',
    brickPrimary: '#787878',
    brickMortar: '#000000',
    questionColors: ['#FC9838', '#C84C0C', '#887000'],
    pipePrimary: '#FC7460',
    pipeHighlight: '#FCBCB0',
    pipeDark: '#A81000',
    hillFill: '#008088',
    hillOutline: '#004058',
    bushFill: '#00E8D8',
    cloudFill: '#FCFCFC',
    cloudOutline: '#3CBCFC',
    hudText: '#FCFCFC',
  },
  athletic: {
    skyBg: '#5C94FC',
    groundPrimary: '#C84C0C',
    groundHighlight: '#FCBCB0',
    groundShadow: '#000000',
    brickPrimary: '#C84C0C',
    brickMortar: '#000000',
    questionColors: ['#FC9838', '#C84C0C', '#887000'],
    pipePrimary: '#00A800',
    pipeHighlight: '#80D010',
    pipeDark: '#005000',
    hillFill: '#00A800',
    hillOutline: '#000000',
    bushFill: '#80D010',
    cloudFill: '#FCFCFC',
    cloudOutline: '#000000',
    hudText: '#FCFCFC',
  },
  castle: {
    skyBg: '#000000',
    groundPrimary: '#787878',
    groundHighlight: '#BCBCBC',
    groundShadow: '#000000',
    brickPrimary: '#787878',
    brickMortar: '#000000',
    questionColors: ['#FC9838', '#C84C0C', '#887000'],
    pipePrimary: '#BCBCBC',
    pipeHighlight: '#FCFCFC',
    pipeDark: '#505050',
    hillFill: '#505050',
    hillOutline: '#000000',
    bushFill: '#787878',
    cloudFill: '#787878',
    cloudOutline: '#000000',
    hudText: '#FCFCFC',
  },
};

export interface MarioColorScheme {
  hatAndShirt: string; // Primary tunic/hat
  overallsAndHair: string; // Overalls, boots, hair, mustache
  skin: string; // Face, hands, buttons
}

export const MARIO_PALETTES: Record<
  'small' | 'super' | 'fire' | 'star-1' | 'star-2' | 'star-3',
  MarioColorScheme
> = {
  small: {
    hatAndShirt: '#D82800', // NES Red
    overallsAndHair: '#887000', // NES Brown/Olive
    skin: '#FC9838', // NES Skin Orange-Gold
  },
  super: {
    hatAndShirt: '#D82800',
    overallsAndHair: '#887000',
    skin: '#FC9838',
  },
  fire: {
    hatAndShirt: '#FCFCFC', // White tunic/hat
    overallsAndHair: '#D82800', // Red overalls
    skin: '#FC9838',
  },
  'star-1': {
    hatAndShirt: '#FC9838',
    overallsAndHair: '#D82800',
    skin: '#FCFCFC',
  },
  'star-2': {
    hatAndShirt: '#00A800',
    overallsAndHair: '#FC9838',
    skin: '#FCFCFC',
  },
  'star-3': {
    hatAndShirt: '#3CBCFC',
    overallsAndHair: '#0058F8',
    skin: '#FCFCFC',
  },
};
