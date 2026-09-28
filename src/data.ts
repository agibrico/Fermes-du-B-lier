import { 
  FeedFormula, 
  StockItem, 
  HealthProtocolItem, 
  TechnicalParams, 
  CuttingYield,
  FeedProgramConfig,
  WeightTargetConfig,
  IngredientDefinition
} from './types';

/**
 * Programme standardisé officiel du projet « Fermes du Bélier — Plan 35 jours »
 * J1 à J10 inclus : Aliment industriel de démarrage (Sac 25kg = 15 000 FCFA -> 600 FCFA/kg)
 * J11 à J24 inclus : Aliment croissance du PDF (Formulation 100kg = 29 009 FCFA -> 290,09 FCFA/kg)
 * J25 à J35 inclus : Aliment finition du PDF (Formulation 100kg = 30 160 FCFA -> 301,60 FCFA/kg)
 */
export const FEED_PROGRAM_STANDARD: FeedProgramConfig = {
  id: 'prog_belier_35d_v1',
  name: 'Programme Standard Belier 35 Jours (PDF)',
  isNewStandard: true,
  phaseStarter: {
    startDay: 1,
    endDay: 10,
    feedType: 'Aliment Industriel Démarrage (Miettes)',
    packagingKg: 25,
    bagPriceFcfa: 15000,
    calculatedPricePerKg: 600
  },
  phaseGrower: {
    startDay: 11,
    endDay: 24,
    formulaId: 'form_croissance_pdf_v1'
  },
  phaseFinisher: {
    startDay: 25,
    endDay: 35,
    formulaId: 'form_finition_pdf_v1'
  },
  notes: 'Programme proposé configurable. Le suivi se poursuit après J35 si le lot continue sans blocage.'
};

export const WEIGHT_TARGET_DEFAULT: WeightTargetConfig = {
  targetAgeDays: 35,
  minWeightGrams: 2100,
  maxWeightGrams: 2200,
  description: 'Objectif configurable de 2,1 à 2,2 kg de poids vif moyen par sujet à J35. Cible de suivi, non une garantie de résultat.'
};

/**
 * Formules exactes issues de Formules_Alimentaires_Poulet_de_Chair.pdf
 * Enregistrées comme versions de référence « À valider nutritionnellement »
 */
export const FEED_FORMULAS_PDF: FeedFormula[] = [
  {
    id: 'form_industriel_demarrage',
    code: 'DEM-IND-01',
    name: 'Aliment Industriel Démarrage (Miettes)',
    version: '1.0',
    phase: 'Démarrage Industriel',
    isIndustrialProduct: true,
    source: 'Produit Industriel Certifié (Sac 25kg)',
    status: 'validée',
    validatorName: 'Fournisseur Agréé / Direction Élevage',
    validationDate: '2026-01-01',
    calculatedCostPer100Kg: 60000,
    calculatedCostPerKg: 600.00,
    isCostComplete: true,
    notes: 'Produit fini manufacturé acheté en sacs de 25 kg à 15 000 FCFA (soit 600 FCFA/kg). La composition fabricant est garantie et ne peut pas être modifiée artificiellement. Une transformation nécessite la création d\'une recette personnalisée distincte.',
    missingNutritionalDataNotes: [
      'Garantie fabricant standard : PB min. 21.0 %, EM min. 3 000 kcal/kg, Lysine dig min. 1.25 %, Ca 1.0 %, P disp 0.45 %'
    ],
    ingredients: [
      { name: 'Aliment Démarrage Industriel (Produit Fini 25kg)', quantityKg100: 100.00, refPriceFcfaKg: 600, notes: 'Produit fini complet du commerce' }
    ]
  },
  {
    id: 'form_croissance_pdf_v1',
    code: 'CROISS-PDF-01',
    name: 'Aliment Croissance (Formule PDF)',
    version: '1.0',
    phase: 'Croissance',
    isIndustrialProduct: false,
    source: 'Formules_Alimentaires_Poulet_de_Chair.pdf',
    status: 'à valider',
    calculatedCostPer100Kg: 29009,
    calculatedCostPerKg: 290.09,
    isCostComplete: true,
    notes: 'Le total de 28 009 FCFA inscrit dans le PDF comportait une erreur de calcul arithmétique de 1 000 FCFA. Coût réel recalculé : 29 009 FCFA/100kg.',
    missingNutritionalDataNotes: [
      'Blé : grain entier ou son de blé à confirmer',
      'Teneur protéique et digestibilité du tourteau de soja à préciser',
      'Composition exacte et profil microbiologique de la farine de poisson à vérifier',
      'Marque, teneurs vitaminiques et oligo-éléments du prémix (1%) à renseigner',
      'Forme commerciale et pureté de la L-Lysine (HCl 98.5% ?) et DL-Méthionine (99% ?)',
      'Taux de phosphore assimilable du phosphate bicalcique'
    ],
    ingredients: [
      { ingredientId: 'ing_mais', name: 'Maïs', typeOrForm: 'Grain broyé', quantityKg100: 43.70, refPriceFcfaKg: 170, notes: 'Base énergétique principale', maxIncorporationPercent: 70 },
      { ingredientId: 'ing_soja', name: 'Tourteau de soja', typeOrForm: 'Tourteau déshuilé', quantityKg100: 35.00, refPriceFcfaKg: 350, notes: 'Source protéique majeure', maxIncorporationPercent: 40 },
      { ingredientId: 'ing_ble', name: 'Blé', typeOrForm: 'Grain ou issue', quantityKg100: 12.00, refPriceFcfaKg: 120, notes: 'Grain ou son à confirmer', maxIncorporationPercent: 30 },
      { ingredientId: 'ing_poisson', name: 'Farine de poisson', typeOrForm: 'Farine animale', quantityKg100: 4.00, refPriceFcfaKg: 320, notes: 'Acides aminés et minéraux', maxIncorporationPercent: 6 },
      { ingredientId: 'ing_huile', name: 'Huile végétale', typeOrForm: 'Liquide énergétique', quantityKg100: 2.00, refPriceFcfaKg: 1000, notes: 'Densité énergétique', maxIncorporationPercent: 4 },
      { ingredientId: 'ing_premix', name: 'Prémix', typeOrForm: 'Complexe CMV', quantityKg100: 1.00, refPriceFcfaKg: 3000, notes: 'Taux incorporation 1%', maxIncorporationPercent: 1 },
      { ingredientId: 'ing_phosphate', name: 'Phosphate bicalcique', typeOrForm: 'Poudre minérale', quantityKg100: 1.00, refPriceFcfaKg: 600, notes: 'Phosphore assimilable', maxIncorporationPercent: 3 },
      { ingredientId: 'ing_carbonate', name: 'Carbonate de calcium', typeOrForm: 'Poudre calcaire', quantityKg100: 0.80, refPriceFcfaKg: 200, notes: 'Calcium pour ossature', maxIncorporationPercent: 2 },
      { ingredientId: 'ing_sel', name: 'Sel', typeOrForm: 'Cristaux fins', quantityKg100: 0.30, refPriceFcfaKg: 500, notes: 'Électrolytes', maxIncorporationPercent: 0.4 },
      { ingredientId: 'ing_lysine', name: 'L-Lysine', typeOrForm: 'Acide aminé cristallin', quantityKg100: 0.10, refPriceFcfaKg: 2850, notes: 'Acide aminé essentiel', maxIncorporationPercent: 0.5 },
      { ingredientId: 'ing_methionine', name: 'DL-Méthionine', typeOrForm: 'Acide aminé cristallin', quantityKg100: 0.10, refPriceFcfaKg: 4150, notes: 'Acide aminé soufré', maxIncorporationPercent: 0.5 }
    ]
  },
  {
    id: 'form_finition_pdf_v1',
    code: 'FINI-PDF-01',
    name: 'Aliment Finition (Formule PDF)',
    version: '1.0',
    phase: 'Finition',
    isIndustrialProduct: false,
    source: 'Formules_Alimentaires_Poulet_de_Chair.pdf',
    status: 'à valider',
    calculatedCostPer100Kg: 30160,
    calculatedCostPerKg: 301.60,
    isCostComplete: true,
    notes: 'Le total de 30 161 FCFA dans le PDF provenait d\'arrondis intermédiaires sur la lysine et méthionine (427.5 + 622.5 = 1050). Total exact : 30 160 FCFA/100kg.',
    missingNutritionalDataNotes: [
      'Blé : grain entier ou son de blé à confirmer',
      'Teneur du tourteau de soja à spécifier',
      'Fraîcheur et indice TVBN de la farine de poisson',
      'Vérification de la notice du prémix finition',
      'Concentration exacte des acides aminés de synthèse'
    ],
    ingredients: [
      { ingredientId: 'ing_mais', name: 'Maïs', typeOrForm: 'Grain broyé', quantityKg100: 49.00, refPriceFcfaKg: 170, notes: 'Énergie de finition', maxIncorporationPercent: 70 },
      { ingredientId: 'ing_soja', name: 'Tourteau de soja', typeOrForm: 'Tourteau déshuilé', quantityKg100: 35.00, refPriceFcfaKg: 350, notes: 'Source de protéines', maxIncorporationPercent: 40 },
      { ingredientId: 'ing_ble', name: 'Blé', typeOrForm: 'Grain ou issue', quantityKg100: 7.00, refPriceFcfaKg: 120, notes: 'Grain ou son à confirmer', maxIncorporationPercent: 30 },
      { ingredientId: 'ing_poisson', name: 'Farine de poisson', typeOrForm: 'Farine animale', quantityKg100: 2.50, refPriceFcfaKg: 320, notes: 'Protéines nobles', maxIncorporationPercent: 6 },
      { ingredientId: 'ing_huile', name: 'Huile végétale', typeOrForm: 'Liquide énergétique', quantityKg100: 3.00, refPriceFcfaKg: 1000, notes: 'Finition et brillance', maxIncorporationPercent: 4 },
      { ingredientId: 'ing_premix', name: 'Prémix', typeOrForm: 'Complexe CMV', quantityKg100: 1.00, refPriceFcfaKg: 3000, notes: 'Prémix 1%', maxIncorporationPercent: 1 },
      { ingredientId: 'ing_phosphate', name: 'Phosphate bicalcique', typeOrForm: 'Poudre minérale', quantityKg100: 0.90, refPriceFcfaKg: 600, notes: 'Maintien minéral', maxIncorporationPercent: 3 },
      { ingredientId: 'ing_carbonate', name: 'Carbonate de calcium', typeOrForm: 'Poudre calcaire', quantityKg100: 1.00, refPriceFcfaKg: 200, notes: 'Calcium', maxIncorporationPercent: 2 },
      { ingredientId: 'ing_sel', name: 'Sel', typeOrForm: 'Cristaux fins', quantityKg100: 0.30, refPriceFcfaKg: 500, notes: 'Équilibre chlorure de sodium', maxIncorporationPercent: 0.4 },
      { ingredientId: 'ing_lysine', name: 'L-Lysine', typeOrForm: 'Acide aminé cristallin', quantityKg100: 0.15, refPriceFcfaKg: 2850, notes: 'Acide aminé synthèse', maxIncorporationPercent: 0.5 },
      { ingredientId: 'ing_methionine', name: 'DL-Méthionine', typeOrForm: 'Acide aminé cristallin', quantityKg100: 0.15, refPriceFcfaKg: 4150, notes: 'Acide aminé synthèse', maxIncorporationPercent: 0.5 }
    ]
  }
];

export const INGREDIENTS_LIBRARY_DEFAULT: IngredientDefinition[] = [
  {
    id: 'ing_mais',
    name: 'Maïs grain broyé',
    typeOrForm: 'Céréale grain broyé',
    unit: 'kg',
    refPriceFcfaKg: 170,
    supplier: 'Fournisseurs locaux Korhogo / Bouaké',
    dataSource: 'Tables INRAE / AFZ Aviculture Tropicale',
    maxIncorporationPercent: 70,
    incorporationJustification: 'Source principale d\'amidon hautement digestible.',
    nutrition: {
      energyKcalKg: 3250,
      crudeProteinPercent: 8.5,
      digestibleLysinePercent: 0.22,
      digestibleMethioninePercent: 0.17,
      calciumPercent: 0.02,
      availablePhosphorusPercent: 0.10,
      crudeFiberPercent: 2.2
    }
  },
  {
    id: 'ing_ble',
    name: 'Grain de blé tendre',
    typeOrForm: 'Céréale grain entier/concassé',
    unit: 'kg',
    refPriceFcfaKg: 120,
    supplier: 'Grands Moulins d\'Abidjan',
    dataSource: 'Tables INRAE',
    maxIncorporationPercent: 30,
    incorporationJustification: 'Riche en gluten et amidon ; attention aux polysaccharides non amylacés (PNA).',
    nutrition: {
      energyKcalKg: 3050,
      crudeProteinPercent: 11.0,
      digestibleLysinePercent: 0.28,
      digestibleMethioninePercent: 0.15,
      calciumPercent: 0.05,
      availablePhosphorusPercent: 0.12,
      crudeFiberPercent: 2.8
    }
  },
  {
    id: 'ing_son_ble',
    name: 'Son de blé fin',
    typeOrForm: 'Sous-produit céréalier / Issue',
    unit: 'kg',
    refPriceFcfaKg: 85,
    supplier: 'Minoterie GMA',
    dataSource: 'INRAE Avicole',
    maxIncorporationPercent: 10,
    incorporationJustification: 'Transit et ballast ; faible valeur énergétique, limite stricte de 10% pour les poulets de chair.',
    nutrition: {
      energyKcalKg: 1650,
      crudeProteinPercent: 14.5,
      digestibleLysinePercent: 0.45,
      digestibleMethioninePercent: 0.18,
      calciumPercent: 0.12,
      availablePhosphorusPercent: 0.25,
      crudeFiberPercent: 9.5
    }
  },
  {
    id: 'ing_soja',
    name: 'Tourteau de soja 48%',
    typeOrForm: 'Tourteau déshuilé extrudé',
    unit: 'kg',
    refPriceFcfaKg: 350,
    supplier: 'Importateur Port Abidjan',
    dataSource: 'Table Céréales & Protéines',
    maxIncorporationPercent: 40,
    incorporationJustification: 'Standard d\'or protéique mondial pour la chair ; excellent équilibre en lysine.',
    nutrition: {
      energyKcalKg: 2250,
      crudeProteinPercent: 46.5,
      digestibleLysinePercent: 2.65,
      digestibleMethioninePercent: 0.60,
      calciumPercent: 0.30,
      availablePhosphorusPercent: 0.20,
      crudeFiberPercent: 3.8
    }
  },
  {
    id: 'ing_poisson',
    name: 'Farine de poisson artisanale 62%',
    typeOrForm: 'Farine animale séchée et moulue',
    unit: 'kg',
    refPriceFcfaKg: 320,
    supplier: 'Pêcheries San Pedro / Sassandra',
    dataSource: 'Analyse laboratoire LANADA',
    maxIncorporationPercent: 6,
    incorporationJustification: 'Acides aminés soufrés et minéraux ; ne pas dépasser 5-6% pour éviter goût de poisson et TVBN toxique.',
    nutrition: {
      energyKcalKg: 2800,
      crudeProteinPercent: 62.0,
      digestibleLysinePercent: 4.50,
      digestibleMethioninePercent: 1.70,
      calciumPercent: 5.20,
      availablePhosphorusPercent: 2.80,
      crudeFiberPercent: 1.0
    }
  },
  {
    id: 'ing_huile',
    name: 'Huile végétale (Palme désodorisée)',
    typeOrForm: 'Matière grasse liquide',
    unit: 'kg',
    refPriceFcfaKg: 1000,
    supplier: 'Palmindus CI',
    dataSource: 'Tables INRAE',
    maxIncorporationPercent: 4,
    incorporationJustification: 'Concentration énergétique en finition, diminue la poussière d\'aliment et augmente l\'appétence.',
    nutrition: {
      energyKcalKg: 8800,
      crudeProteinPercent: 0,
      digestibleLysinePercent: 0,
      digestibleMethioninePercent: 0,
      calciumPercent: 0,
      availablePhosphorusPercent: 0,
      crudeFiberPercent: 0
    }
  },
  {
    id: 'ing_premix',
    name: 'Prémix Chair Standard 1%',
    typeOrForm: 'Complexe minéralo-vitaminique (CMV)',
    unit: 'kg',
    refPriceFcfaKg: 3000,
    supplier: 'Distributeur Vétérinaire Agréé',
    dataSource: 'Fiche technique fabricant',
    maxIncorporationPercent: 1.0,
    isAdditiveOrMineral: true,
    incorporationJustification: 'Vitamines A, D3, E, B-complexe, oligo-éléments (Zinc, Fer, Manganèse, Cuivre, Iode, Sélénium). Dosage strict 1%.',
    nutrition: {
      energyKcalKg: 0,
      crudeProteinPercent: 0,
      digestibleLysinePercent: 0,
      digestibleMethioninePercent: 0,
      calciumPercent: 18.0,
      availablePhosphorusPercent: 0,
      crudeFiberPercent: 0
    }
  },
  {
    id: 'ing_phosphate',
    name: 'Phosphate bicalcique 18% P',
    typeOrForm: 'Sel minéral inorganique',
    unit: 'kg',
    refPriceFcfaKg: 600,
    supplier: 'Comptoir Vétérinaire',
    dataSource: 'Norme chimique',
    maxIncorporationPercent: 3.0,
    isAdditiveOrMineral: true,
    incorporationJustification: 'Apport de phosphore hautement assimilable sans apport de fluor toxique.',
    nutrition: {
      energyKcalKg: 0,
      crudeProteinPercent: 0,
      digestibleLysinePercent: 0,
      digestibleMethioninePercent: 0,
      calciumPercent: 24.0,
      availablePhosphorusPercent: 18.0,
      crudeFiberPercent: 0
    }
  },
  {
    id: 'ing_carbonate',
    name: 'Carbonate de calcium (Craie broyée)',
    typeOrForm: 'Roche calcaire purifiée',
    unit: 'kg',
    refPriceFcfaKg: 200,
    supplier: 'Fournisseur carrière',
    dataSource: 'Norme chimique',
    maxIncorporationPercent: 2.0,
    isAdditiveOrMineral: true,
    incorporationJustification: 'Source économique de calcium pour la trame osseuse des poulets de chair.',
    nutrition: {
      energyKcalKg: 0,
      crudeProteinPercent: 0,
      digestibleLysinePercent: 0,
      digestibleMethioninePercent: 0,
      calciumPercent: 38.0,
      availablePhosphorusPercent: 0,
      crudeFiberPercent: 0
    }
  },
  {
    id: 'ing_sel',
    name: 'Sel marin fin (NaCl)',
    typeOrForm: 'Sel raffiné de cuisine',
    unit: 'kg',
    refPriceFcfaKg: 500,
    supplier: 'Salins CI',
    dataSource: 'Standard avicole',
    maxIncorporationPercent: 0.4,
    isAdditiveOrMineral: true,
    incorporationJustification: 'Sodium et chlore indispensables. Attention : dépasser 0.4% provoque des fientes liquides et diarrhées.',
    nutrition: {
      energyKcalKg: 0,
      crudeProteinPercent: 0,
      digestibleLysinePercent: 0,
      digestibleMethioninePercent: 0,
      calciumPercent: 0,
      availablePhosphorusPercent: 0,
      crudeFiberPercent: 0
    }
  },
  {
    id: 'ing_lysine',
    name: 'L-Lysine HCl 98.5%',
    typeOrForm: 'Acide aminé synthétique pur',
    unit: 'kg',
    refPriceFcfaKg: 2850,
    supplier: 'Bio-chimie Avicole',
    dataSource: 'Fiche Ajinomoto / Evonik',
    maxIncorporationPercent: 0.5,
    isAdditiveOrMineral: true,
    incorporationJustification: 'Premier acide aminé limitant en aviculture ; permet de baisser le tourteau de soja tout en maintenant la croissance.',
    nutrition: {
      energyKcalKg: 3900,
      crudeProteinPercent: 94.0,
      digestibleLysinePercent: 78.8,
      digestibleMethioninePercent: 0,
      calciumPercent: 0,
      availablePhosphorusPercent: 0,
      crudeFiberPercent: 0
    }
  },
  {
    id: 'ing_methionine',
    name: 'DL-Méthionine 99%',
    typeOrForm: 'Acide aminé synthétique pur',
    unit: 'kg',
    refPriceFcfaKg: 4150,
    supplier: 'Bio-chimie Avicole',
    dataSource: 'Fiche Evonik Degussa',
    maxIncorporationPercent: 0.5,
    isAdditiveOrMineral: true,
    incorporationJustification: 'Acide aminé soufré limitant pour le plumage, la thermorégulation et le gain de muscle pectoral.',
    nutrition: {
      energyKcalKg: 5000,
      crudeProteinPercent: 58.0,
      digestibleLysinePercent: 0,
      digestibleMethioninePercent: 99.0,
      calciumPercent: 0,
      availablePhosphorusPercent: 0,
      crudeFiberPercent: 0
    }
  },
  {
    id: 'ing_arachide',
    name: 'Tourteau d\'arachide délipidé',
    typeOrForm: 'Tourteau oléagineux',
    unit: 'kg',
    refPriceFcfaKg: 280,
    supplier: 'Marché Bouaké',
    dataSource: 'Tables INRAE Tropical',
    maxIncorporationPercent: 15,
    incorporationJustification: 'Riche en protéines (45%) mais pauvre en lysine et méthionine ; risque d\'aflatoxines à tester avant usage.',
    nutrition: {
      energyKcalKg: 2500,
      crudeProteinPercent: 45.0,
      digestibleLysinePercent: 1.40,
      digestibleMethioninePercent: 0.45,
      calciumPercent: 0.20,
      availablePhosphorusPercent: 0.18,
      crudeFiberPercent: 5.5
    }
  },
  {
    id: 'ing_manioc',
    name: 'Farine de cossettes de manioc',
    typeOrForm: 'Tubercule séché et broyé',
    unit: 'kg',
    refPriceFcfaKg: 130,
    supplier: 'Producteurs Dabou / Grand-Bassam',
    dataSource: 'Tables Recherche Avicole',
    maxIncorporationPercent: 20,
    incorporationJustification: 'Énergie très digestible sans protéines ; élimination totale de l\'acide cyanhydrique (HCN) requise par séchage solaire.',
    nutrition: {
      energyKcalKg: 3000,
      crudeProteinPercent: 2.5,
      digestibleLysinePercent: 0.08,
      digestibleMethioninePercent: 0.04,
      calciumPercent: 0.15,
      availablePhosphorusPercent: 0.08,
      crudeFiberPercent: 3.2
    }
  }
];

/**
 * Protocoles de santé paramétrables (Vaccins, vitamines et traitements)
 * Pas de calendrier universel figé : chaque protocole indique la source, la maladie ciblée et le délai d'attente
 */
export const HEALTH_PROTOCOLS_DEFAULT: HealthProtocolItem[] = [
  {
    id: 'prot_hb1',
    targetDisease: 'Peste Aviaire (Newcastle) + Bronchite Infectieuse',
    productName: 'Vaccin HB1 / H120 (souches vivantes atténuées)',
    category: 'vaccin',
    plannedDayStart: 1,
    plannedDayEnd: 1,
    routeOfAdministration: 'goutte_oculaire',
    standardDose: '1 goutte / oiseau (ou nébulisation au couvoir)',
    instructionsNotice: 'Vérifier la chaîne du froid (2°C - 8°C). Si réalisé au couvoir, consigner le bordereau du couvoir.',
    withdrawalPeriodDays: 0,
    sourceNoticeRef: 'Notice Fabricant Vaccin Aviaire & Recommandations Vétérinaires',
    validatingVetName: 'Dr. Vétérinaire Conseil',
    validatingVetDate: '2026-01-10'
  },
  {
    id: 'prot_gumboro_1',
    targetDisease: 'Maladie de Gumboro (Bursite infectieuse)',
    productName: 'Vaccin Gumboro Intermédiaire (Souche D78 ou équivalent)',
    category: 'vaccin',
    plannedDayStart: 12,
    plannedDayEnd: 14,
    routeOfAdministration: 'eau_de_boisson',
    standardDose: '1 dose / sujet',
    instructionsNotice: 'Arrêter tout désinfectant et chlore dans l\'eau 48h avant. Assoiffer 1h30 à 2h. Neutraliser avec lait écrémé en poudre (2.5 g/L). Distribuer en 1h30 max.',
    withdrawalPeriodDays: 0,
    boissonChecklist: {
      waterQualityVerified: true,
      disinfectantNeutralized: true,
      thirstDurationHours: 2,
      consumptionTimeLimitHours: 1.5
    },
    sourceNoticeRef: 'Protocole sérologique avicole',
    validatingVetName: 'Dr. Vétérinaire Conseil',
    validatingVetDate: '2026-01-10'
  },
  {
    id: 'prot_newcastle_rappel',
    targetDisease: 'Rappel Peste Aviaire (Newcastle Clone 30 ou Lasota)',
    productName: 'Vaccin Lasota / Clone 30',
    category: 'vaccin',
    plannedDayStart: 21,
    plannedDayEnd: 23,
    routeOfAdministration: 'eau_de_boisson',
    standardDose: '1 dose / sujet',
    instructionsNotice: 'Eau claire sans désinfectant. À consommer dans les 2 heures.',
    withdrawalPeriodDays: 0,
    boissonChecklist: {
      waterQualityVerified: true,
      disinfectantNeutralized: true,
      thirstDurationHours: 1.5,
      consumptionTimeLimitHours: 2
    },
    sourceNoticeRef: 'Notice Fabricant',
    validatingVetName: 'Dr. Vétérinaire Conseil',
    validatingVetDate: '2026-01-10'
  },
  {
    id: 'prot_anticoccidien',
    targetDisease: 'Prévention Coccidiose (si indiquée sur diagnostic litière)',
    productName: 'Anticoccidien buvable (Amprolium ou Toltrazuril sous prescription)',
    category: 'medicament',
    plannedDayStart: 16,
    plannedDayEnd: 18,
    routeOfAdministration: 'eau_de_boisson',
    standardDose: 'Selon prescription stricte (ex: Amprolium 20% à 1g/Litre)',
    instructionsNotice: 'ATTENTION : Présence d\'un délai d\'attente avant abattage. Respecter impérativement la prescription médicale.',
    withdrawalPeriodDays: 5,
    sourceNoticeRef: 'Prescription Vétérinaire obligatoire',
    validatingVetName: 'À valider par le vétérinaire traitant'
  },
  {
    id: 'prot_antistress_demarrage',
    targetDisease: 'Récupération transport et stress d\'arrivée',
    productName: 'Complexe Polyvitaminé + Électrolytes',
    category: 'vitamine_supplement',
    plannedDayStart: 1,
    plannedDayEnd: 3,
    routeOfAdministration: 'eau_de_boisson',
    standardDose: '1 g / Litre d\'eau tiède propre',
    instructionsNotice: 'Eau tiède sucrée (5%) à l\'arrivée pendant 2h, puis eau vitaminée pendant 3 jours.',
    withdrawalPeriodDays: 0,
    sourceNoticeRef: 'Guide d\'élevage démarrage'
  }
];

export const STOCK_ITEMS_DEFAULT: StockItem[] = [
  {
    id: 'stk_starter_bag',
    name: 'Aliment Démarrage Industriel (Sac 25 kg)',
    category: 'aliment_industriel',
    quantityOnHand: 10,
    unit: 'sac_25kg',
    brand: 'Miettes Pro Début',
    supplier: 'AgroFournitures SA',
    lotNumber: 'DEM-2026-08',
    unitCostFcfa: 15000,
    reorderAlertLevel: 4,
    purchaseDate: '2026-09-15',
    expiryDate: '2027-03-15'
  },
  {
    id: 'stk_corn',
    name: 'Maïs jaune grain propre dépoussiéré',
    category: 'matiere_premiere',
    quantityOnHand: 450,
    unit: 'kg',
    supplier: 'Coopérative Céréalière',
    lotNumber: 'MAIS-2026-B4',
    unitCostFcfa: 170,
    reorderAlertLevel: 100,
    storageConditions: 'Silo ventilé sec'
  },
  {
    id: 'stk_soya',
    name: 'Tourteau de Soja déshuilé (46%)',
    category: 'matiere_premiere',
    quantityOnHand: 280,
    unit: 'kg',
    supplier: 'Oléagineux Tropiques',
    lotNumber: 'SOJ-2026-11',
    unitCostFcfa: 350,
    reorderAlertLevel: 80
  },
  {
    id: 'stk_wheat',
    name: 'Blé',
    category: 'matiere_premiere',
    quantityOnHand: 120,
    unit: 'kg',
    supplier: 'Import Meunerie',
    unitCostFcfa: 120,
    reorderAlertLevel: 40,
    storageConditions: 'Stock sec'
  },
  {
    id: 'stk_fishmeal',
    name: 'Farine de poisson',
    category: 'matiere_premiere',
    quantityOnHand: 40,
    unit: 'kg',
    supplier: 'Pêcheries Locales',
    unitCostFcfa: 320,
    reorderAlertLevel: 15
  },
  {
    id: 'stk_oil',
    name: 'Huile végétale raffinée',
    category: 'matiere_premiere',
    quantityOnHand: 25,
    unit: 'litre',
    supplier: 'Huilerie Centrale',
    unitCostFcfa: 1000,
    reorderAlertLevel: 10
  },
  {
    id: 'stk_premix',
    name: 'Prémix 1% Poulet de chair',
    category: 'matiere_premiere',
    quantityOnHand: 15,
    unit: 'kg',
    brand: 'NutriPro Chair 1%',
    lotNumber: 'PRM-0926',
    unitCostFcfa: 3000,
    reorderAlertLevel: 5,
    expiryDate: '2027-06-30'
  },
  {
    id: 'stk_lysine',
    name: 'L-Lysine synthétique',
    category: 'matiere_premiere',
    quantityOnHand: 4.5,
    unit: 'kg',
    supplier: 'BioSynth',
    unitCostFcfa: 2850,
    reorderAlertLevel: 1.0
  },
  {
    id: 'stk_methionine',
    name: 'DL-Méthionine pure',
    category: 'matiere_premiere',
    quantityOnHand: 4.0,
    unit: 'kg',
    supplier: 'BioSynth',
    unitCostFcfa: 4150,
    reorderAlertLevel: 1.0
  },
  {
    id: 'stk_phos',
    name: 'Phosphate bicalcique',
    category: 'matiere_premiere',
    quantityOnHand: 20,
    unit: 'kg',
    unitCostFcfa: 600,
    reorderAlertLevel: 5
  },
  {
    id: 'stk_carb',
    name: 'Carbonate de calcium',
    category: 'matiere_premiere',
    quantityOnHand: 30,
    unit: 'kg',
    unitCostFcfa: 200,
    reorderAlertLevel: 10
  },
  {
    id: 'stk_salt',
    name: 'Sel fin',
    category: 'matiere_premiere',
    quantityOnHand: 15,
    unit: 'kg',
    unitCostFcfa: 500,
    reorderAlertLevel: 3
  },
  {
    id: 'stk_vax_gumboro',
    name: 'Vaccin Gumboro D78 (1 000 doses)',
    category: 'produit_sante',
    quantityOnHand: 2,
    unit: 'flacon',
    brand: 'Intervet / MSD',
    lotNumber: 'GUM-5589B',
    unitCostFcfa: 3500,
    reorderAlertLevel: 1,
    storageConditions: 'Frigo 2°C - 8°C (Pas de congélation)',
    expiryDate: '2027-02-28'
  },
  {
    id: 'stk_vitamines',
    name: 'Complexe Polyvitaminé 100g',
    category: 'produit_sante',
    quantityOnHand: 6,
    unit: 'unite',
    unitCostFcfa: 1500,
    reorderAlertLevel: 2,
    expiryDate: '2027-11-30'
  }
];

export const CUTTING_YIELDS_STANDARD: CuttingYield[] = [
  { pieceName: 'Escalopes (Poitrine sans os)', percentageLiveWeight: 24.0, weightPerSubjectKg: 0.516, unitPriceFcfaKg: 3000 },
  { pieceName: 'Cuisses (avec os et peau)', percentageLiveWeight: 25.0, weightPerSubjectKg: 0.538, unitPriceFcfaKg: 2200 },
  { pieceName: 'Ailes', percentageLiveWeight: 8.0, weightPerSubjectKg: 0.172, unitPriceFcfaKg: 2500 },
  { pieceName: 'Ensemble Tête-Cou-Dos', percentageLiveWeight: 18.0, weightPerSubjectKg: 0.387, unitPriceFcfaKg: 1000 },
  { pieceName: 'Foie', percentageLiveWeight: 2.0, weightPerSubjectKg: 0.043, unitPriceFcfaKg: 1000 },
  { pieceName: 'Pattes (Paires)', percentageLiveWeight: 0, weightPerSubjectKg: 0, unitPriceFcfaKg: 50, isPerUnit: true },
  { pieceName: 'Gésier', percentageLiveWeight: 0, weightPerSubjectKg: 0, unitPriceFcfaKg: 100, isPerUnit: true },
];

export const TECHNICAL_PARAMS_DEFAULT: TechnicalParams = {
  chickUnitPriceFcfa: 630, // Poussin 1 jour avec amortissement mortalité
  healthUnitPriceFcfa: 150, // Standard sanitaire
  feedIndustrial25kgBagFcfa: 15000,
  feedIndustrialPerKgFcfa: 600, // 15 000 / 25 kg = 600 FCFA/kg
  feedCostPerKg: {
    'Démarrage Industriel': 600, // Confirmé : 15 000 F / 25 kg
    'Croissance': 290.09, // Recalculé du PDF
    'Finition': 301.60, // Recalculé du PDF
    'Prédémarrage Historique': 400
  }
};

export const FEED_INGREDIENTS_100KG = [
  { name: 'Maïs grain broyé', demarrageKg: 54.0, croissanceKg: 57.0, finitionKg: 62.0, roleAndAdjustment: 'Énergie principale, riche en amidon.' },
  { name: 'Tourteau de soja', demarrageKg: 28.0, croissanceKg: 25.0, finitionKg: 21.0, roleAndAdjustment: 'Protéines de haute valeur biologique.' },
  { name: 'Son de blé / riz', demarrageKg: 6.0, croissanceKg: 7.0, finitionKg: 7.0, roleAndAdjustment: 'Fibres et transit digestif.' },
  { name: 'Farine de poisson', demarrageKg: 5.0, croissanceKg: 4.0, finitionKg: 3.0, roleAndAdjustment: 'Acides aminés soufrés et minéraux.' },
  { name: 'Huile végétale', demarrageKg: 2.0, croissanceKg: 2.5, finitionKg: 3.0, roleAndAdjustment: 'Densité énergétique et appétence.' },
  { name: 'Phosphate bicalcique', demarrageKg: 2.0, croissanceKg: 1.8, finitionKg: 1.6, roleAndAdjustment: 'Phosphore assimilable pour le squelette.' },
  { name: 'Carbonate de calcium', demarrageKg: 1.5, croissanceKg: 1.4, finitionKg: 1.3, roleAndAdjustment: 'Calcium pour la minéralisation osseuse.' },
  { name: 'Prémix CMV 1%', demarrageKg: 1.0, croissanceKg: 1.0, finitionKg: 0.8, roleAndAdjustment: 'Vitamines, oligo-éléments et acides aminés de synthèse.' },
  { name: 'Sel fin', demarrageKg: 0.5, croissanceKg: 0.3, finitionKg: 0.3, roleAndAdjustment: 'Équilibre électrolytique.' }
];

export const ROTATION_SCENARIOS = [
  {
    name: 'Scénario Standard (100 poussins / 10j)',
    totalPresentInRotation: 350,
    poussinInvestment10d: 63000,
    workingCapitalRequired: 280000,
    expectedRevenue10d: 315000,
    netMonthlyProfit: 195000
  },
  {
    name: 'Scénario Semi-Intensif (250 poussins / 10j)',
    totalPresentInRotation: 875,
    poussinInvestment10d: 157500,
    workingCapitalRequired: 680000,
    expectedRevenue10d: 787500,
    netMonthlyProfit: 490000
  },
  {
    name: 'Scénario Professionnel (500 poussins / 10j)',
    totalPresentInRotation: 1750,
    poussinInvestment10d: 315000,
    workingCapitalRequired: 1350000,
    expectedRevenue10d: 1575000,
    netMonthlyProfit: 980000
  }
];

export const ADVICE_BIOSAFETY = [
  { id: 'bio_1', title: 'Vide sanitaire strict', description: 'Nettoyage, désinfection au formol ou crésyl, repos d’au moins 14 jours entre 2 bandes.' },
  { id: 'bio_2', title: 'Pédiluves & Sas d\'entrée', description: 'Changement régulier du désinfectant du pédiluve (eau de javel ou virkon) et bottes dédiées.' },
  { id: 'bio_3', title: 'Respect des délais d\'attente', description: 'Ne jamais vendre ni abattre d\'animaux sous traitement médicamenteux avant le délai légal prescrit.' },
  { id: 'bio_4', title: 'Contrôle quotidien de la litière', description: 'Maintenir la litière sèche et aérée (copeaux de bois blancs dépoussiérés).' }
];
