import { INTELLIGENCE_MODELS } from '@/services/intelligence/catalog';

export type DictionaryOption = { id: string; label: string; group?: string; description?: string };

const unique = (values: string[]) => [...new Set(values)].sort((a,b)=>a.localeCompare(b));

export const FARM_TYPES = [
  'Crop farming','Livestock','Mixed farming','Poultry','Horticulture','Aquaculture','Beekeeping','Agri-business','Research / advisory',
].map(label => ({ id: label.toLowerCase().replace(/[^a-z0-9]+/g,'-'), label }));

export const ANIMALS = [
  'Cattle','Goats','Sheep','Pigs','Chickens','Broilers','Layers','Poultry','Bees','Rabbits','Fish','Donkeys','Horses','Wildlife','Other',
].map(label => ({ id: label.toLowerCase().replace(/[^a-z0-9]+/g,'-'), label }));

// Model subjects are the canonical intelligence vocabulary; common farm crops extend it for records that do not yet have an AI model.
export const CROPS = unique([
  ...INTELLIGENCE_MODELS.filter(m=>m.category==='crops').map(m=>m.subject),
  'Sorghum','Wheat','Beans','Cowpeas','Groundnuts','Cabbage','Watermelon','Melons','Onions','Carrots','Leafy vegetables','Fruit trees','Other',
]).map(label => ({ id: label.toLowerCase().replace(/[^a-z0-9]+/g,'-'), label }));

export const INTELLIGENCE_DISEASES_AND_PESTS = unique(
  INTELLIGENCE_MODELS.map(m=>m.disease ?? m.name).filter(Boolean),
).map(label => ({ id: label.toLowerCase().replace(/[^a-z0-9]+/g,'-'), label }));

// Botswana-relevant vaccine vocabulary. Product/brand selection should be added only from verified supplier/BVI catalogues.
export const VACCINES = [
  'Foot and Mouth Disease (FMD)','Anthrax','Contagious Bovine Pleuropneumonia (CBPP)','Blackleg',
  'Rabies','Pasteurellosis','Peste des Petits Ruminants (PPR)','Other / veterinary recommendation',
].map(label => ({ id: label.toLowerCase().replace(/[^a-z0-9]+/g,'-'), label }));

export const FERTILIZERS = [
  { id:'urea', label:'Urea', group:'Nitrogen' },
  { id:'ammonium-nitrate', label:'Ammonium nitrate', group:'Nitrogen' },
  { id:'dap', label:'DAP', group:'Compound / starter' },
  { id:'map', label:'MAP', group:'Compound / starter' },
  { id:'npk', label:'NPK', group:'Compound' },
  { id:'potassium-chloride', label:'Potassium chloride (MOP)', group:'Potassium' },
  { id:'potassium-sulphate', label:'Potassium sulphate (SOP)', group:'Potassium' },
  { id:'lime', label:'Agricultural lime', group:'Soil amendment' },
  { id:'organic', label:'Organic / compost fertilizer', group:'Organic' },
  { id:'other', label:'Other', group:'Other' },
];

export const FEED_TYPES = [
  'Pasture / grazing','Hay','Silage','Maize meal','Commercial livestock feed','Poultry feed',
  'Layer feed','Broiler starter','Broiler grower','Broiler finisher','Mineral supplement','Protein supplement','Other',
].map(label => ({ id: label.toLowerCase().replace(/[^a-z0-9]+/g,'-'), label }));

export const UNITS = [
  'kg','g','tonnes','litres','ml','bags','bales','head','birds','beehives','hectares','m²','units',
].map(label => ({ id: label, label }));

export const TASK_TYPES = [
  'Planting','Irrigation','Fertilizing','Spraying','Weeding','Scouting','Harvesting','Vaccination',
  'Dipping / parasite control','Feeding','Breeding','Animal health check','Record keeping','Other',
].map(label => ({ id: label.toLowerCase().replace(/[^a-z0-9]+/g,'-'), label }));

export const MARKETPLACE_CATEGORIES = [
  'Animals','Crops','Vaccines','Fertilizers','Seeds','Animal feed','Farm equipment','Tools','Produce','Other',
].map(label => ({ id: label.toLowerCase().replace(/[^a-z0-9]+/g,'-'), label }));

export const MODEL_SUBJECTS = unique(INTELLIGENCE_MODELS.map(m=>m.subject)).map(label => ({
  id: label.toLowerCase().replace(/[^a-z0-9]+/g,'-'), label,
  modelCount: INTELLIGENCE_MODELS.filter(m=>m.subject===label).length,
}));

export const MODEL_OPTIONS = INTELLIGENCE_MODELS.map(model => ({
  id:model.id, label:model.name, subject:model.subject, disease:model.disease, category:model.category,
}));

export const getOptionsForCrop = (crop: string) =>
  MODEL_OPTIONS.filter(option => option.subject.toLowerCase() === crop.toLowerCase());

export const getDictionaryOptions = (key:
  'farmTypes'|'animals'|'crops'|'vaccines'|'fertilizers'|'feedTypes'|'units'|'taskTypes'|'marketplaceCategories'
): DictionaryOption[] => ({
  farmTypes:FARM_TYPES, animals:ANIMALS, crops:CROPS, vaccines:VACCINES, fertilizers:FERTILIZERS,
  feedTypes:FEED_TYPES, units:UNITS, taskTypes:TASK_TYPES, marketplaceCategories:MARKETPLACE_CATEGORIES,
}[key]);
