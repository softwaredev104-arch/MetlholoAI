export type IntelligenceCategory = 'crops' | 'livestock';

export type IntelligenceAvailability = 'available' | 'prediction_verified' | 'coming_soon';

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
  availability: IntelligenceAvailability;
};

export const INTELLIGENCE_SERVICES = {
  general: process.env.EXPO_PUBLIC_AI_GENERAL_BASE_URL ?? '',
  apple: process.env.EXPO_PUBLIC_AI_APPLE_BASE_URL ?? '',
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
  { id: 'apple-black-rot', name: 'Black Rot', category: 'crops', subject: 'Apple', disease: 'Black Rot', service: 'apple', predictPath: '/api/crops/Apple/black_rot/predict', reportPath: '/api/crops/Apple/black_rot/generate-report', input: 'image', trainingImageHints: ['single leaf or fruit', 'sharp lesion detail', 'natural daylight'], availability: 'prediction_verified' },
  { id: 'maize-leaf-blight', name: 'Leaf Blight', category: 'crops', subject: 'Maize', disease: 'Leaf Blight', service: 'maize', predictPath: '/api/crops/maize/leaf_blight/predict', reportPath: '/api/crops/maize/leaf_blight/generate-report', input: 'image', trainingImageHints: ['single leaf', 'sharp lesion detail', 'natural daylight'], availability: 'prediction_verified' },
  { id: 'maize-leaf-spot', name: 'Leaf Spot', category: 'crops', subject: 'Maize', disease: 'Leaf Spot', service: 'maize', predictPath: '/api/crops/maize/Leaf-Spot/predict', reportPath: '/api/crops/maize/Leaf-Spot/generate-report', input: 'image', trainingImageHints: ['single leaf', 'sharp lesion detail', 'natural daylight'] , availability: 'coming_soon' },
  { id: 'maize-leafy-beetle', name: 'Leafy Beetle', category: 'crops', subject: 'Maize', disease: 'Leafy Beetle', service: 'maize', predictPath: '/api/crops/maize/Leafy-Beetle/predict', reportPath: '/api/crops/maize/Leafy-Beetle/generate-report', input: 'image', trainingImageHints: ['whole affected leaf', 'insect visible when possible', 'close focus'] , availability: 'coming_soon' },
  { id: 'maize-fall-armyworm', name: 'Fall Armyworm', category: 'crops', subject: 'Maize', disease: 'Fall Armyworm', service: 'maize', predictPath: '/api/crops/maize/fall-armyworm/predict', reportPath: '/api/crops/maize/fall-armyworm/generate-report', input: 'image', trainingImageHints: ['whorl or feeding damage', 'close focus', 'avoid blur'] , availability: 'coming_soon' },
  { id: 'maize-grasshopper', name: 'Grasshopper', category: 'crops', subject: 'Maize', disease: 'Grasshopper', service: 'maize', predictPath: '/api/crops/maize/grasshopper/predict', reportPath: '/api/crops/maize/grasshopper/generate-report', input: 'image', trainingImageHints: ['affected plant', 'pest visible when possible', 'good daylight'] , availability: 'coming_soon' },
  { id: 'maize-streak-virus', name: 'Streak Virus', category: 'crops', subject: 'Maize', disease: 'Streak Virus', service: 'maize', predictPath: '/api/crops/maize/streak-virus/predict', reportPath: '/api/crops/maize/streak-virus/generate-report', input: 'image', trainingImageHints: ['leaf veins and streaking', 'fill frame', 'sharp detail'] , availability: 'coming_soon' },
  { id: 'cattle-health-classifier', name: 'Cattle Health Classifier', category: 'livestock', subject: 'Cattle', service: 'general', predictPath: '/api/livestock/cattle/lumpy-skin-disease/predict', reportPath: '/api/livestock/cattle/lumpy-skin-disease/generate-report', input: 'image', trainingImageHints: ['capture the animal safely', 'clear affected area when present', 'natural daylight'] , availability: 'prediction_verified' },
  { id: 'poultry-faeces', name: 'Poultry Faeces', category: 'livestock', subject: 'Chicken', service: 'poultry', predictPath: '/api/livestock/poultry/predict', reportPath: '/api/livestock/poultry/generate-report', input: 'image', trainingImageHints: ['sample clearly visible', 'top-down view', 'even lighting'] , availability: 'prediction_verified' },
  { id: 'tomato-spider-mites', name: 'Spider Mites', category: 'crops', subject: 'Tomato', disease: 'Spider Mites', service: 'tomato', predictPath: '/api/crops/tomato/Spider_mites/predict', reportPath: '/api/crops/tomato/Spider_mites/generate-report', input: 'image', trainingImageHints: ['clear affected area', 'sharp focus', 'natural daylight'] , availability: 'prediction_verified' },
  { id: 'tomato-yellow-leaf-curl-virus', name: 'Yellow Leaf Curl Virus', category: 'crops', subject: 'Tomato', disease: 'Yellow Leaf Curl Virus', service: 'tomato', predictPath: '/api/crops/tomato/Yellow_Leaf_Curl_Virus/predict', reportPath: '/api/crops/tomato/Yellow_Leaf_Curl_Virus/generate-report', input: 'image', trainingImageHints: ['clear affected area', 'sharp focus', 'natural daylight'] , availability: 'coming_soon' },
  { id: 'tomato-leaf-blight', name: 'Leaf Blight', category: 'crops', subject: 'Tomato', disease: 'Leaf Blight', service: 'tomato', predictPath: '/api/crops/tomato/leaf-blight/predict', reportPath: '/api/crops/tomato/leaf-blight/generate-report', input: 'image', trainingImageHints: ['clear affected area', 'sharp focus', 'natural daylight'] , availability: 'coming_soon' },
  { id: 'tomato-mosaic-virus', name: 'Mosaic Virus', category: 'crops', subject: 'Tomato', disease: 'Mosaic Virus', service: 'tomato', predictPath: '/api/crops/tomato/mosaic_virus/predict', reportPath: '/api/crops/tomato/mosaic_virus/generate-report', input: 'image', trainingImageHints: ['clear affected area', 'sharp focus', 'natural daylight'] , availability: 'coming_soon' },
  { id: 'tomato-septoria', name: 'Septoria Leaf Spot', category: 'crops', subject: 'Tomato', disease: 'Septoria Leaf Spot', service: 'tomato', predictPath: '/api/crops/tomato/septoria-leaf-spot/predict', reportPath: '/api/crops/tomato/septoria-leaf-spot/generate-report', input: 'image', trainingImageHints: ['clear affected area', 'sharp focus', 'natural daylight'] , availability: 'coming_soon' },
  { id: 'spinach-anthracnose', name: 'Anthracnose', category: 'crops', subject: 'Spinach', disease: 'Anthracnose', service: 'spinach', predictPath: '/api/crops/spinach/anthracnose/predict', reportPath: '/api/crops/spinach/anthracnose/generate-report', input: 'image', trainingImageHints: ['clear affected area', 'sharp focus', 'natural daylight'] , availability: 'prediction_verified' },
  { id: 'spinach-downy-mildew', name: 'Downy Mildew', category: 'crops', subject: 'Spinach', disease: 'Downy Mildew', service: 'spinach', predictPath: '/api/crops/spinach/downy-mildew/predict', reportPath: '/api/crops/spinach/downy-mildew/generate-report', input: 'image', trainingImageHints: ['clear affected area', 'sharp focus', 'natural daylight'] , availability: 'coming_soon' },
  { id: 'pepper-bacterial-spot', name: 'Bacterial Spot', category: 'crops', subject: 'Pepper', disease: 'Bacterial Spot', service: 'pepper', predictPath: '/api/crops/Pepper/Bacterial-spot/predict', reportPath: '/api/crops/Pepper/Bacterial-spot/generate-report', input: 'image', trainingImageHints: ['clear affected area', 'sharp focus', 'natural daylight'] , availability: 'prediction_verified' },
  { id: 'potato-early-blight', name: 'Early Blight', category: 'crops', subject: 'Potatoes', disease: 'Early Blight', service: 'potatoes', predictPath: '/api/crops/Potatoes/Early-blight/predict', reportPath: '/api/crops/Potatoes/Early-blight/generate-report', input: 'image', trainingImageHints: ['clear affected area', 'sharp focus', 'natural daylight'] , availability: 'coming_soon' },
  { id: 'potato-late-blight', name: 'Late Blight', category: 'crops', subject: 'Potatoes', disease: 'Late Blight', service: 'potatoes', predictPath: '/api/crops/Potatoes/late_blight/predict', reportPath: '/api/crops/Potatoes/late_blight/generate-report', input: 'image', trainingImageHints: ['clear affected area', 'sharp focus', 'natural daylight'] , availability: 'prediction_verified' },
  { id: 'grape-black-measles', name: 'Black Measles', category: 'crops', subject: 'Grape', disease: 'Black Measles', service: 'grape', predictPath: '/api/crops/Grape/black_measles/predict', reportPath: '/api/crops/Grape/black_measles/generate-report', input: 'image', trainingImageHints: ['clear affected area', 'sharp focus', 'natural daylight'] , availability: 'coming_soon' },
  { id: 'grape-black-rot', name: 'Black Rot', category: 'crops', subject: 'Grape', disease: 'Black Rot', service: 'grape', predictPath: '/api/crops/Grape/black_rot/predict', reportPath: '/api/crops/Grape/black_rot/generate-report', input: 'image', trainingImageHints: ['clear affected area', 'sharp focus', 'natural daylight'] , availability: 'prediction_verified' },
  { id: 'grape-isariopsis', name: 'Isariopsis Leaf Spot', category: 'crops', subject: 'Grape', disease: 'Isariopsis Leaf Spot', service: 'grape', predictPath: '/api/crops/Grape/isariopsis_leaf_spot/predict', reportPath: '/api/crops/Grape/isariopsis_leaf_spot/generate-report', input: 'image', trainingImageHints: ['clear affected area', 'sharp focus', 'natural daylight'] , availability: 'coming_soon' },
];

export function getModels(category: IntelligenceCategory) {
  return INTELLIGENCE_MODELS.filter(model => model.category === category);
}

export function getModelsForSubject(subject: string) {
  return INTELLIGENCE_MODELS.filter(model => model.subject === subject);
}
