export type IntelligenceCategory = 'crops' | 'livestock';

export type IntelligenceModel = {
  id: string;
  name: string;
  category: IntelligenceCategory;
  subject: string;
  disease?: string;
  service: string;
  predictPath: string;
  reportPath: string;
  input: 'image';
  trainingImageHints: string[];
};

export const INTELLIGENCE_SERVICES = {
  maize: process.env.EXPO_PUBLIC_AI_MAIZE_BASE_URL ?? '',
  cattle: process.env.EXPO_PUBLIC_AI_CATTLE_BASE_URL ?? '',
  maizeBee: process.env.EXPO_PUBLIC_AI_MAIZE_BEE_BASE_URL ?? '',
  grape: process.env.EXPO_PUBLIC_AI_GRAPE_BASE_URL ?? '',
  tomato: process.env.EXPO_PUBLIC_AI_TOMATO_BASE_URL ?? '',
  spinach: process.env.EXPO_PUBLIC_AI_SPINACH_BASE_URL ?? '',
  pepper: process.env.EXPO_PUBLIC_AI_PEPPER_BASE_URL ?? '',
  potatoes: process.env.EXPO_PUBLIC_AI_POTATOES_BASE_URL ?? '',
  poultry: process.env.EXPO_PUBLIC_AI_POULTRY_BASE_URL ?? '',
} as const;

export const INTELLIGENCE_MODELS: IntelligenceModel[] = [
  { id: 'maize-leaf-spot', name: 'Leaf Spot', category: 'crops', subject: 'Maize', disease: 'Leaf Spot', service: 'maize', predictPath: '/api/crops/maize/Leaf-Spot/predict', reportPath: '/api/crops/maize/Leaf-Spot/generate-report', input: 'image', trainingImageHints: ['single leaf', 'sharp lesion detail', 'natural daylight'] },
  { id: 'maize-leafy-beetle', name: 'Leafy Beetle', category: 'crops', subject: 'Maize', disease: 'Leafy Beetle', service: 'maize', predictPath: '/api/crops/maize/Leafy-Beetle/predict', reportPath: '/api/crops/maize/Leafy-Beetle/generate-report', input: 'image', trainingImageHints: ['whole affected leaf', 'insect visible when possible', 'close focus'] },
  { id: 'maize-fall-armyworm', name: 'Fall Armyworm', category: 'crops', subject: 'Maize', disease: 'Fall Armyworm', service: 'maize', predictPath: '/api/crops/maize/fall-armyworm/predict', reportPath: '/api/crops/maize/fall-armyworm/generate-report', input: 'image', trainingImageHints: ['whorl or feeding damage', 'close focus', 'avoid blur'] },
  { id: 'maize-grasshopper', name: 'Grasshopper', category: 'crops', subject: 'Maize', disease: 'Grasshopper', service: 'maize', predictPath: '/api/crops/maize/grasshopper/predict', reportPath: '/api/crops/maize/grasshopper/generate-report', input: 'image', trainingImageHints: ['affected plant', 'pest visible when possible', 'good daylight'] },
  { id: 'maize-streak-virus', name: 'Streak Virus', category: 'crops', subject: 'Maize', disease: 'Streak Virus', service: 'maize', predictPath: '/api/crops/maize/streak-virus/predict', reportPath: '/api/crops/maize/streak-virus/generate-report', input: 'image', trainingImageHints: ['leaf veins and streaking', 'fill frame', 'sharp detail'] },
  { id: 'cattle-foot-mouth', name: 'Foot and Mouth Disease', category: 'livestock', subject: 'Cattle', disease: 'Foot and Mouth Disease', service: 'cattle', predictPath: '/api/livestock/cattle/foot-and-mouth-disease/predict', reportPath: '/api/livestock/cattle/foot-and-mouth-disease/generate-report', input: 'image', trainingImageHints: ['affected mouth/foot area', 'safe distance', 'clear daylight'] },
  { id: 'cattle-lumpy-skin', name: 'Lumpy Skin Disease', category: 'livestock', subject: 'Cattle', disease: 'Lumpy Skin Disease', service: 'cattle', predictPath: '/api/livestock/cattle/lumpy-skin-disease/predict', reportPath: '/api/livestock/cattle/lumpy-skin-disease/generate-report', input: 'image', trainingImageHints: ['skin lesions', 'multiple lesions if safe', 'sharp close detail'] },
  { id: 'poultry-faeces', name: 'Poultry Faeces', category: 'livestock', subject: 'Chicken', service: 'cattle', predictPath: '/api/livestock/poultry/predict', reportPath: '/api/livestock/poultry/generate-report', input: 'image', trainingImageHints: ['sample clearly visible', 'top-down view', 'even lighting'] },
];

export function getModels(category: IntelligenceCategory) {
  return INTELLIGENCE_MODELS.filter(model => model.category === category);
}

export function getModelsForSubject(subject: string) {
  return INTELLIGENCE_MODELS.filter(model => model.subject === subject);
}
