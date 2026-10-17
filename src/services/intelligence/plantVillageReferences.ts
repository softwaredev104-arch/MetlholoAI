import type { CaptureExample } from './captureGuidance';

/**
 * Pinned images from PlantVillage GitHub (official dataset card: CC BY-SA 3.0).
 * These are labelled reference pictures, NOT verified training samples
 * belonging to any particular production model version.
 * The laboratory-style imagery may differ from Botswana field photos.
 */
export const PLANTVILLAGE_REFERENCES: Record<string, CaptureExample[]> = {
  "maize-leaf-spot": [
    {
      "uri": "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Corn_(maize)___Cercospora_leaf_spot%20Gray_leaf_spot/00120a18-ff90-46e4-92fb-2b7a10345bd3___RS_GLSp%209357.JPG",
      "sourceUrl": "https://github.com/spMohanty/PlantVillage-Dataset/blob/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Corn_(maize)___Cercospora_leaf_spot%20Gray_leaf_spot/00120a18-ff90-46e4-92fb-2b7a10345bd3___RS_GLSp%209357.JPG",
      "title": "PlantVillage leaf reference 1",
      "attribution": "PlantVillage Dataset — Mohanty, Hughes & Salathé (2016)",
      "license": "CC BY-SA 3.0",
      "kind": "licensed_reference"
    },
    {
      "uri": "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Corn_(maize)___Cercospora_leaf_spot%20Gray_leaf_spot/00a20f6f-e8bd-4453-9e25-36ea70feb626___RS_GLSp%204655.JPG",
      "sourceUrl": "https://github.com/spMohanty/PlantVillage-Dataset/blob/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Corn_(maize)___Cercospora_leaf_spot%20Gray_leaf_spot/00a20f6f-e8bd-4453-9e25-36ea70feb626___RS_GLSp%204655.JPG",
      "title": "PlantVillage leaf reference 2",
      "attribution": "PlantVillage Dataset — Mohanty, Hughes & Salathé (2016)",
      "license": "CC BY-SA 3.0",
      "kind": "licensed_reference"
    }
  ],
  "tomato-yellow-leaf-curl-virus": [
    {
      "uri": "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Tomato___Tomato_Yellow_Leaf_Curl_Virus/00139ae8-d881-4edb-925f-46584b0bd68c___YLCV_NREC%202944.JPG",
      "sourceUrl": "https://github.com/spMohanty/PlantVillage-Dataset/blob/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Tomato___Tomato_Yellow_Leaf_Curl_Virus/00139ae8-d881-4edb-925f-46584b0bd68c___YLCV_NREC%202944.JPG",
      "title": "PlantVillage leaf reference 1",
      "attribution": "PlantVillage Dataset — Mohanty, Hughes & Salathé (2016)",
      "license": "CC BY-SA 3.0",
      "kind": "licensed_reference"
    },
    {
      "uri": "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Tomato___Tomato_Yellow_Leaf_Curl_Virus/0036c89d-7743-4895-9fcf-b8d2c1fc8455___YLCV_NREC%200313.JPG",
      "sourceUrl": "https://github.com/spMohanty/PlantVillage-Dataset/blob/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Tomato___Tomato_Yellow_Leaf_Curl_Virus/0036c89d-7743-4895-9fcf-b8d2c1fc8455___YLCV_NREC%200313.JPG",
      "title": "PlantVillage leaf reference 2",
      "attribution": "PlantVillage Dataset — Mohanty, Hughes & Salathé (2016)",
      "license": "CC BY-SA 3.0",
      "kind": "licensed_reference"
    }
  ],
  "tomato-spider-mites": [
    {
      "uri": "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Tomato___Spider_mites%20Two-spotted_spider_mite/002835d1-c18e-4471-aa6e-8d8c29585e9b___Com.G_SpM_FL%208584.JPG",
      "sourceUrl": "https://github.com/spMohanty/PlantVillage-Dataset/blob/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Tomato___Spider_mites%20Two-spotted_spider_mite/002835d1-c18e-4471-aa6e-8d8c29585e9b___Com.G_SpM_FL%208584.JPG",
      "title": "PlantVillage leaf reference 1",
      "attribution": "PlantVillage Dataset — Mohanty, Hughes & Salathé (2016)",
      "license": "CC BY-SA 3.0",
      "kind": "licensed_reference"
    },
    {
      "uri": "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Tomato___Spider_mites%20Two-spotted_spider_mite/003b7929-a364-4e74-be1c-37c4c0a6ec63___Com.G_SpM_FL%201414.JPG",
      "sourceUrl": "https://github.com/spMohanty/PlantVillage-Dataset/blob/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Tomato___Spider_mites%20Two-spotted_spider_mite/003b7929-a364-4e74-be1c-37c4c0a6ec63___Com.G_SpM_FL%201414.JPG",
      "title": "PlantVillage leaf reference 2",
      "attribution": "PlantVillage Dataset — Mohanty, Hughes & Salathé (2016)",
      "license": "CC BY-SA 3.0",
      "kind": "licensed_reference"
    }
  ],
  "tomato-septoria": [
    {
      "uri": "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Tomato___Septoria_leaf_spot/002533c1-722b-44e5-9d2e-91f7747b2543___Keller.St_CG%201831.JPG",
      "sourceUrl": "https://github.com/spMohanty/PlantVillage-Dataset/blob/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Tomato___Septoria_leaf_spot/002533c1-722b-44e5-9d2e-91f7747b2543___Keller.St_CG%201831.JPG",
      "title": "PlantVillage leaf reference 1",
      "attribution": "PlantVillage Dataset — Mohanty, Hughes & Salathé (2016)",
      "license": "CC BY-SA 3.0",
      "kind": "licensed_reference"
    },
    {
      "uri": "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Tomato___Septoria_leaf_spot/0025c401-7785-49c5-8bef-780a8a0d3652___Matt.S_CG%202694.JPG",
      "sourceUrl": "https://github.com/spMohanty/PlantVillage-Dataset/blob/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Tomato___Septoria_leaf_spot/0025c401-7785-49c5-8bef-780a8a0d3652___Matt.S_CG%202694.JPG",
      "title": "PlantVillage leaf reference 2",
      "attribution": "PlantVillage Dataset — Mohanty, Hughes & Salathé (2016)",
      "license": "CC BY-SA 3.0",
      "kind": "licensed_reference"
    }
  ],
  "tomato-mosaic-virus": [
    {
      "uri": "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Tomato___Tomato_mosaic_virus/000ec6ea-9063-4c33-8abe-d58ca8a88878___PSU_CG%202169.JPG",
      "sourceUrl": "https://github.com/spMohanty/PlantVillage-Dataset/blob/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Tomato___Tomato_mosaic_virus/000ec6ea-9063-4c33-8abe-d58ca8a88878___PSU_CG%202169.JPG",
      "title": "PlantVillage leaf reference 1",
      "attribution": "PlantVillage Dataset — Mohanty, Hughes & Salathé (2016)",
      "license": "CC BY-SA 3.0",
      "kind": "licensed_reference"
    },
    {
      "uri": "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Tomato___Tomato_mosaic_virus/006e354b-c054-4b72-a83c-e3feb038942e___PSU_CG%202330.JPG",
      "sourceUrl": "https://github.com/spMohanty/PlantVillage-Dataset/blob/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Tomato___Tomato_mosaic_virus/006e354b-c054-4b72-a83c-e3feb038942e___PSU_CG%202330.JPG",
      "title": "PlantVillage leaf reference 2",
      "attribution": "PlantVillage Dataset — Mohanty, Hughes & Salathé (2016)",
      "license": "CC BY-SA 3.0",
      "kind": "licensed_reference"
    }
  ],
  "potato-early-blight": [
    {
      "uri": "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Potato___Early_blight/001187a0-57ab-4329-baff-e7246a9edeb0___RS_Early.B%208178.JPG",
      "sourceUrl": "https://github.com/spMohanty/PlantVillage-Dataset/blob/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Potato___Early_blight/001187a0-57ab-4329-baff-e7246a9edeb0___RS_Early.B%208178.JPG",
      "title": "PlantVillage leaf reference 1",
      "attribution": "PlantVillage Dataset — Mohanty, Hughes & Salathé (2016)",
      "license": "CC BY-SA 3.0",
      "kind": "licensed_reference"
    },
    {
      "uri": "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Potato___Early_blight/002a55fb-7a3d-4a3a-aca8-ce2d5ebc6925___RS_Early.B%208170.JPG",
      "sourceUrl": "https://github.com/spMohanty/PlantVillage-Dataset/blob/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Potato___Early_blight/002a55fb-7a3d-4a3a-aca8-ce2d5ebc6925___RS_Early.B%208170.JPG",
      "title": "PlantVillage leaf reference 2",
      "attribution": "PlantVillage Dataset — Mohanty, Hughes & Salathé (2016)",
      "license": "CC BY-SA 3.0",
      "kind": "licensed_reference"
    }
  ],
  "potato-late-blight": [
    {
      "uri": "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Potato___Late_blight/0051e5e8-d1c4-4a84-bf3a-a426cdad6285___RS_LB%204640.JPG",
      "sourceUrl": "https://github.com/spMohanty/PlantVillage-Dataset/blob/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Potato___Late_blight/0051e5e8-d1c4-4a84-bf3a-a426cdad6285___RS_LB%204640.JPG",
      "title": "PlantVillage leaf reference 1",
      "attribution": "PlantVillage Dataset — Mohanty, Hughes & Salathé (2016)",
      "license": "CC BY-SA 3.0",
      "kind": "licensed_reference"
    },
    {
      "uri": "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Potato___Late_blight/00695906-210d-4a9d-822e-986a17384115___RS_LB%204026.JPG",
      "sourceUrl": "https://github.com/spMohanty/PlantVillage-Dataset/blob/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Potato___Late_blight/00695906-210d-4a9d-822e-986a17384115___RS_LB%204026.JPG",
      "title": "PlantVillage leaf reference 2",
      "attribution": "PlantVillage Dataset — Mohanty, Hughes & Salathé (2016)",
      "license": "CC BY-SA 3.0",
      "kind": "licensed_reference"
    }
  ],
  "grape-black-rot": [
    {
      "uri": "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Grape___Black_rot/00090b0f-c140-4e77-8d20-d39f67b75fcc___FAM_B.Rot%200376.JPG",
      "sourceUrl": "https://github.com/spMohanty/PlantVillage-Dataset/blob/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Grape___Black_rot/00090b0f-c140-4e77-8d20-d39f67b75fcc___FAM_B.Rot%200376.JPG",
      "title": "PlantVillage leaf reference 1",
      "attribution": "PlantVillage Dataset — Mohanty, Hughes & Salathé (2016)",
      "license": "CC BY-SA 3.0",
      "kind": "licensed_reference"
    },
    {
      "uri": "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Grape___Black_rot/003d09ef-e16c-4e8a-badf-847d46cb3dc0___FAM_B.Rot%203184.JPG",
      "sourceUrl": "https://github.com/spMohanty/PlantVillage-Dataset/blob/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Grape___Black_rot/003d09ef-e16c-4e8a-badf-847d46cb3dc0___FAM_B.Rot%203184.JPG",
      "title": "PlantVillage leaf reference 2",
      "attribution": "PlantVillage Dataset — Mohanty, Hughes & Salathé (2016)",
      "license": "CC BY-SA 3.0",
      "kind": "licensed_reference"
    }
  ],
  "grape-black-measles": [
    {
      "uri": "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Grape___Esca_(Black_Measles)/0075b632-2e34-4e4f-9697-fe2b332b7ef8___FAM_B.Msls%204399.JPG",
      "sourceUrl": "https://github.com/spMohanty/PlantVillage-Dataset/blob/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Grape___Esca_(Black_Measles)/0075b632-2e34-4e4f-9697-fe2b332b7ef8___FAM_B.Msls%204399.JPG",
      "title": "PlantVillage leaf reference 1",
      "attribution": "PlantVillage Dataset — Mohanty, Hughes & Salathé (2016)",
      "license": "CC BY-SA 3.0",
      "kind": "licensed_reference"
    },
    {
      "uri": "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Grape___Esca_(Black_Measles)/00b65fe8-cee1-4b68-8ef4-1211814f2845___FAM_B.Msls%203990.JPG",
      "sourceUrl": "https://github.com/spMohanty/PlantVillage-Dataset/blob/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Grape___Esca_(Black_Measles)/00b65fe8-cee1-4b68-8ef4-1211814f2845___FAM_B.Msls%203990.JPG",
      "title": "PlantVillage leaf reference 2",
      "attribution": "PlantVillage Dataset — Mohanty, Hughes & Salathé (2016)",
      "license": "CC BY-SA 3.0",
      "kind": "licensed_reference"
    }
  ],
  "grape-isariopsis": [
    {
      "uri": "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Grape___Leaf_blight_(Isariopsis_Leaf_Spot)/0001aa74-bbd7-433b-a900-1dccab39d521___FAM_L.Blight%204508.JPG",
      "sourceUrl": "https://github.com/spMohanty/PlantVillage-Dataset/blob/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Grape___Leaf_blight_(Isariopsis_Leaf_Spot)/0001aa74-bbd7-433b-a900-1dccab39d521___FAM_L.Blight%204508.JPG",
      "title": "PlantVillage leaf reference 1",
      "attribution": "PlantVillage Dataset — Mohanty, Hughes & Salathé (2016)",
      "license": "CC BY-SA 3.0",
      "kind": "licensed_reference"
    },
    {
      "uri": "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Grape___Leaf_blight_(Isariopsis_Leaf_Spot)/0012e1ee-fde3-478f-ab27-18648feb2b05___FAM_L.Blight%201647.JPG",
      "sourceUrl": "https://github.com/spMohanty/PlantVillage-Dataset/blob/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Grape___Leaf_blight_(Isariopsis_Leaf_Spot)/0012e1ee-fde3-478f-ab27-18648feb2b05___FAM_L.Blight%201647.JPG",
      "title": "PlantVillage leaf reference 2",
      "attribution": "PlantVillage Dataset — Mohanty, Hughes & Salathé (2016)",
      "license": "CC BY-SA 3.0",
      "kind": "licensed_reference"
    }
  ],
  "pepper-bacterial-spot": [
    {
      "uri": "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Pepper%2C_bell___Bacterial_spot/0022d6b7-d47c-4ee2-ae9a-392a53f48647___JR_B.Spot%208964.JPG",
      "sourceUrl": "https://github.com/spMohanty/PlantVillage-Dataset/blob/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Pepper%2C_bell___Bacterial_spot/0022d6b7-d47c-4ee2-ae9a-392a53f48647___JR_B.Spot%208964.JPG",
      "title": "PlantVillage leaf reference 1",
      "attribution": "PlantVillage Dataset — Mohanty, Hughes & Salathé (2016)",
      "license": "CC BY-SA 3.0",
      "kind": "licensed_reference"
    },
    {
      "uri": "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Pepper%2C_bell___Bacterial_spot/006adb74-934f-448f-a14f-62181742127b___JR_B.Spot%203395.JPG",
      "sourceUrl": "https://github.com/spMohanty/PlantVillage-Dataset/blob/7f7ecc7e1eaca78107e3affe7cb5abd9427e139a/raw/color/Pepper%2C_bell___Bacterial_spot/006adb74-934f-448f-a14f-62181742127b___JR_B.Spot%203395.JPG",
      "title": "PlantVillage leaf reference 2",
      "attribution": "PlantVillage Dataset — Mohanty, Hughes & Salathé (2016)",
      "license": "CC BY-SA 3.0",
      "kind": "licensed_reference"
    }
  ]
};
