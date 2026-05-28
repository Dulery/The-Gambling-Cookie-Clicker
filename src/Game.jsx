import { useState, useEffect, useRef } from 'react'
import { saveScore, loadScore, getLeaderboard } from './firebase.js'
import Casino from './Casino.jsx'
import Bank from './Bank.jsx'
import Life, { getDefaultAssets } from './Life.jsx'


// ── Upgrades par palier (10 passifs + 10 clics chacun) ───────────────────────
const _TIER_PASSIVES = [
  /* T0 – Cabane */ [
    { id:'pas_0_0', name:'🖱️ Curseur',              desc:'+1/sec',      cps:1,          baseCost:50        },
    { id:'pas_0_1', name:'🐭 Souris mécanique',     desc:'+2/sec',      cps:2,          baseCost:120       },
    { id:'pas_0_2', name:'📜 Grimoire',              desc:'+4/sec',      cps:4,          baseCost:280       },
    { id:'pas_0_3', name:'🕯️ Chandelle',            desc:'+7/sec',      cps:7,          baseCost:500       },
    { id:'pas_0_4', name:'🪨 Pierre à feu',          desc:'+12/sec',     cps:12,         baseCost:750       },
    { id:'pas_0_5', name:'🪵 Bûchers',               desc:'+20/sec',     cps:20,         baseCost:1000      },
    { id:'pas_0_6', name:'🪤 Piège artisanal',       desc:'+30/sec',     cps:30,         baseCost:1200      },
    { id:'pas_0_7', name:'🧺 Panier tressé',         desc:'+45/sec',     cps:45,         baseCost:1400      },
    { id:'pas_0_8', name:'🌿 Herbes médicinales',    desc:'+65/sec',     cps:65,         baseCost:1600      },
    { id:'pas_0_9', name:'🍯 Ruche sauvage',         desc:'+90/sec',     cps:90,         baseCost:1800      },
  ],
  /* T1 – Petite maison */ [
    { id:'pas_1_0', name:'👵 Mamie',                 desc:'+5/sec',      cps:5,          baseCost:600       },
    { id:'pas_1_1', name:'🧑‍🍳 Cuisinier',           desc:'+12/sec',     cps:12,         baseCost:1500      },
    { id:'pas_1_2', name:'🌻 Jardin',                desc:'+25/sec',     cps:25,         baseCost:3500      },
    { id:'pas_1_3', name:'🐓 Poulailler',             desc:'+45/sec',     cps:45,         baseCost:6000      },
    { id:'pas_1_4', name:'🐑 Bergerie',               desc:'+70/sec',     cps:70,         baseCost:9000      },
    { id:'pas_1_5', name:'🍎 Verger',                 desc:'+100/sec',    cps:100,        baseCost:12000     },
    { id:'pas_1_6', name:'🧀 Fromagerie',             desc:'+145/sec',    cps:145,        baseCost:15500     },
    { id:'pas_1_7', name:'🍞 Boulangerie',            desc:'+200/sec',    cps:200,        baseCost:18500     },
    { id:'pas_1_8', name:'🏪 Épicerie',               desc:'+270/sec',    cps:270,        baseCost:21500     },
    { id:'pas_1_9', name:'🛒 Marché local',           desc:'+360/sec',    cps:360,        baseCost:24000     },
  ],
  /* T2 – Maison de famille */ [
    { id:'pas_2_0', name:'🌾 Ferme',                 desc:'+20/sec',     cps:20,         baseCost:2500      },
    { id:'pas_2_1', name:'🐄 Élevage',               desc:'+60/sec',     cps:60,         baseCost:8000      },
    { id:'pas_2_2', name:'🏗️ Chantier',               desc:'+120/sec',    cps:120,        baseCost:20000     },
    { id:'pas_2_3', name:'🚜 Tracteur',               desc:'+220/sec',    cps:220,        baseCost:45000     },
    { id:'pas_2_4', name:'🌽 Silo à grain',           desc:'+380/sec',    cps:380,        baseCost:80000     },
    { id:'pas_2_5', name:'💧 Irrigation',             desc:'+600/sec',    cps:600,        baseCost:120000    },
    { id:'pas_2_6', name:'🌱 Serre hydroponique',     desc:'+900/sec',    cps:900,        baseCost:160000    },
    { id:'pas_2_7', name:'🐖 Porcherie industrielle', desc:'+1300/sec',   cps:1300,       baseCost:200000    },
    { id:'pas_2_8', name:'🥛 Laiterie coopérative',  desc:'+1800/sec',   cps:1800,       baseCost:245000    },
    { id:'pas_2_9', name:'🌿 Labo végétal',           desc:'+2500/sec',   cps:2500,       baseCost:290000    },
  ],
  /* T3 – Appartement */ [
    { id:'pas_3_0', name:'⛏️ Mine',                  desc:'+100/sec',    cps:100,        baseCost:10000     },
    { id:'pas_3_1', name:'🛢️ Puits de pétrole',      desc:'+280/sec',    cps:280,        baseCost:45000     },
    { id:'pas_3_2', name:'⚙️ Atelier mécanique',     desc:'+550/sec',    cps:550,        baseCost:110000    },
    { id:'pas_3_3', name:'🔩 Fonderie',               desc:'+1000/sec',   cps:1000,       baseCost:250000    },
    { id:'pas_3_4', name:'⛽ Raffinerie',             desc:'+1800/sec',   cps:1800,       baseCost:500000    },
    { id:'pas_3_5', name:'🏗️ Infrastructure lourde',  desc:'+3000/sec',   cps:3000,       baseCost:900000    },
    { id:'pas_3_6', name:'🚂 Réseau ferroviaire',     desc:'+5000/sec',   cps:5000,       baseCost:1500000   },
    { id:'pas_3_7', name:'⚡ Centrale mécanique',    desc:'+8000/sec',   cps:8000,       baseCost:2200000   },
    { id:'pas_3_8', name:'🏙️ Zone industrielle',      desc:'+12000/sec',  cps:12000,      baseCost:3000000   },
    { id:'pas_3_9', name:'🌆 Mégapole',               desc:'+18000/sec',  cps:18000,      baseCost:3800000   },
  ],
  /* T4 – Commerce */ [
    { id:'pas_4_0', name:'🏭 Usine',                 desc:'+500/sec',    cps:500,        baseCost:40000     },
    { id:'pas_4_1', name:'🔋 Centrale électrique',   desc:'+1500/sec',   cps:1500,       baseCost:300000    },
    { id:'pas_4_2', name:'🤖 Robot industriel',       desc:'+4000/sec',   cps:4000,       baseCost:1200000   },
    { id:'pas_4_3', name:'🏦 Banque de cookies',      desc:'+9000/sec',   cps:9000,       baseCost:4000000   },
    { id:'pas_4_4', name:'📡 Réseau satellite',       desc:'+18000/sec',  cps:18000,      baseCost:10000000  },
    { id:'pas_4_5', name:'🚢 Cargo maritime',         desc:'+33000/sec',  cps:33000,      baseCost:20000000  },
    { id:'pas_4_6', name:'✈️ Flotte aérienne',        desc:'+55000/sec',  cps:55000,      baseCost:32000000  },
    { id:'pas_4_7', name:'🏙️ Zone commerciale',       desc:'+85000/sec',  cps:85000,      baseCost:43000000  },
    { id:'pas_4_8', name:'🌐 Réseau mondial',         desc:'+130K/sec',   cps:130000,     baseCost:52000000  },
    { id:'pas_4_9', name:'💰 Empire économique',      desc:'+190K/sec',   cps:190000,     baseCost:59000000  },
  ],
  /* T5 – Usine */ [
    { id:'pas_5_0', name:'🚪 Portail',                desc:'+2000/sec',   cps:2000,       baseCost:200000    },
    { id:'pas_5_1', name:'🔭 Observatoire',           desc:'+8000/sec',   cps:8000,       baseCost:3000000   },
    { id:'pas_5_2', name:'💻 Supercalculateur',        desc:'+22000/sec',  cps:22000,      baseCost:12000000  },
    { id:'pas_5_3', name:'⚛️ Réacteur plasma',         desc:'+55000/sec',  cps:55000,      baseCost:40000000  },
    { id:'pas_5_4', name:'🧪 Labo biotech',            desc:'+120K/sec',   cps:120000,     baseCost:100000000 },
    { id:'pas_5_5', name:'🛰️ Réseau de satellites',   desc:'+250K/sec',   cps:250000,     baseCost:230000000 },
    { id:'pas_5_6', name:'🕳️ Accélérateur',           desc:'+500K/sec',   cps:500000,     baseCost:420000000 },
    { id:'pas_5_7', name:'🧬 Ingénierie génétique',   desc:'+900K/sec',   cps:900000,     baseCost:610000000 },
    { id:'pas_5_8', name:'🌋 Énergie géothermique',   desc:'+1.5M/sec',   cps:1500000,    baseCost:770000000 },
    { id:'pas_5_9', name:'🌐 Méga-internet quantique', desc:'+2.4M/sec',  cps:2400000,    baseCost:880000000 },
  ],
  /* T6 – Château */ [
    { id:'pas_6_0', name:'🛕 Temple antique',         desc:'+10K/sec',    cps:10000,      baseCost:1000000   },
    { id:'pas_6_1', name:'🌠 Nexus cosmique',          desc:'+40K/sec',    cps:40000,      baseCost:15000000  },
    { id:'pas_6_2', name:'⚗️ Alchimiste légendaire',  desc:'+120K/sec',   cps:120000,     baseCost:70000000  },
    { id:'pas_6_3', name:'🔯 Artefact sacré',          desc:'+320K/sec',   cps:320000,     baseCost:250000000 },
    { id:'pas_6_4', name:'🌒 Lune ensorcelée',         desc:'+750K/sec',   cps:750000,     baseCost:700000000 },
    { id:'pas_6_5', name:'🧿 Cristal cosmique',        desc:'+1.8M/sec',   cps:1800000,    baseCost:2000000000},
    { id:'pas_6_6', name:'🎇 Étoile enchanteresse',   desc:'+4M/sec',     cps:4000000,    baseCost:5000000000},
    { id:'pas_6_7', name:'🏰 Citadelle éternelle',     desc:'+9M/sec',     cps:9000000,    baseCost:9000000000},
    { id:'pas_6_8', name:'👁️ Œil cosmique',            desc:'+20M/sec',    cps:20000000,   baseCost:12000000000},
    { id:'pas_6_9', name:'🌌 Trône des dieux',         desc:'+45M/sec',    cps:45000000,   baseCost:14000000000},
  ],
  /* T7 – Gratte-ciel */ [
    { id:'pas_7_0', name:'🔬 Laboratoire avancé',     desc:'+50K/sec',    cps:50000,      baseCost:6000000   },
    { id:'pas_7_1', name:'☢️ Réacteur nucléaire',      desc:'+200K/sec',   cps:200000,     baseCost:80000000  },
    { id:'pas_7_2', name:'🌊 Générateur marémoteur',   desc:'+600K/sec',   cps:600000,     baseCost:500000000 },
    { id:'pas_7_3', name:'💥 Réacteur à fusion',       desc:'+1.5M/sec',   cps:1500000,    baseCost:3000000000},
    { id:'pas_7_4', name:'🧲 Magnétron géant',         desc:'+4M/sec',     cps:4000000,    baseCost:10000000000},
    { id:'pas_7_5', name:'🌡️ Thermodynamique ultime',  desc:'+10M/sec',    cps:10000000,   baseCost:30000000000},
    { id:'pas_7_6', name:'⚗️ Nanofabrique',            desc:'+25M/sec',    cps:25000000,   baseCost:80000000000},
    { id:'pas_7_7', name:'🌀 Tunnel quantique',         desc:'+65M/sec',    cps:65000000,   baseCost:140000000000},
    { id:'pas_7_8', name:'🧠 Cerveau numérique',       desc:'+160M/sec',   cps:160000000,  baseCost:200000000000},
    { id:'pas_7_9', name:'🔩 Méga-structure orbitale', desc:'+400M/sec',   cps:400000000,  baseCost:245000000000},
  ],
  /* T8 – Station spatiale */ [
    { id:'pas_8_0', name:'🚀 Vaisseau spatial',        desc:'+250K/sec',   cps:250000,     baseCost:35000000  },
    { id:'pas_8_1', name:'🛸 Flotte galactique',        desc:'+1M/sec',     cps:1000000,    baseCost:500000000 },
    { id:'pas_8_2', name:'⭐ Étoile artificielle',      desc:'+3M/sec',     cps:3000000,    baseCost:5000000000},
    { id:'pas_8_3', name:'🌟 Supernova privée',         desc:'+8M/sec',     cps:8000000,    baseCost:20000000000},
    { id:'pas_8_4', name:'🌐 Réseau stellaire',         desc:'+20M/sec',    cps:20000000,   baseCost:70000000000},
    { id:'pas_8_5', name:'🌑 Naine noire',              desc:'+50M/sec',    cps:50000000,   baseCost:200000000000},
    { id:'pas_8_6', name:'☀️ Harnacheur d\'étoile',    desc:'+130M/sec',   cps:130000000,  baseCost:600000000000},
    { id:'pas_8_7', name:'🌌 Nébuleuse artificielle',   desc:'+330M/sec',   cps:330000000,  baseCost:1500000000000},
    { id:'pas_8_8', name:'🕳️ Trou noir contrôlé',      desc:'+850M/sec',   cps:850000000,  baseCost:3000000000000},
    { id:'pas_8_9', name:'🌀 Galaxie privée',           desc:'+2.2B/sec',   cps:2200000000, baseCost:4800000000000},
  ],
  /* T9 – Complexe dimensionnel */ [
    { id:'pas_9_0', name:'🌌 Dimension',               desc:'+1M/sec',     cps:1000000,    baseCost:200000000 },
    { id:'pas_9_1', name:'💫 Singularité',             desc:'+5M/sec',     cps:5000000,    baseCost:2000000000},
    { id:'pas_9_2', name:'🔮 Conscience cosmique',     desc:'+15M/sec',    cps:15000000,   baseCost:20000000000},
    { id:'pas_9_3', name:'🌀 Nexus dimensionnel',      desc:'+50M/sec',    cps:50000000,   baseCost:150000000000},
    { id:'pas_9_4', name:'🧿 Cristal éternel',         desc:'+150M/sec',   cps:150000000,  baseCost:800000000000},
    { id:'pas_9_5', name:'🌟 Supernova sacrée',        desc:'+400M/sec',   cps:400000000,  baseCost:3000000000000},
    { id:'pas_9_6', name:'⚡ Foudre divine',           desc:'+1B/sec',     cps:1000000000, baseCost:10000000000000},
    { id:'pas_9_7', name:'🌈 Arc-en-ciel cosmique',    desc:'+2.5B/sec',   cps:2500000000, baseCost:30000000000000},
    { id:'pas_9_8', name:'♾️ Infini générateur',       desc:'+6B/sec',     cps:6000000000, baseCost:80000000000000},
    { id:'pas_9_9', name:'🍪 Cookie Absolu',           desc:'+15B/sec',    cps:15000000000,baseCost:200000000000000},
  ],
]

const _TIER_CLICKS = [
  /* T0 */ [
    { id:'clic_0_0', name:'👆 Coup de pouce',    desc:'+2/clic',      cpc:2,          baseCost:100       },
    { id:'clic_0_1', name:'🤏 Pincée précise',   desc:'+4/clic',      cpc:4,          baseCost:200       },
    { id:'clic_0_2', name:'✊ Poing ferme',       desc:'+7/clic',      cpc:7,          baseCost:350       },
    { id:'clic_0_3', name:'🖐️ Main ouverte',     desc:'+12/clic',     cpc:12,         baseCost:550       },
    { id:'clic_0_4', name:'🤜 Crochet du droit', desc:'+18/clic',     cpc:18,         baseCost:800       },
    { id:'clic_0_5', name:'💪 Biceps gonflé',    desc:'+27/clic',     cpc:27,         baseCost:1000      },
    { id:'clic_0_6', name:'🤸 Saut acrobatique', desc:'+40/clic',     cpc:40,         baseCost:1200      },
    { id:'clic_0_7', name:'🧗 Grimpeur agile',   desc:'+55/clic',     cpc:55,         baseCost:1400      },
    { id:'clic_0_8', name:'🏃 Sprint frénétique',desc:'+75/clic',     cpc:75,         baseCost:1600      },
    { id:'clic_0_9', name:'🤺 Escrimeur fou',    desc:'+100/clic',    cpc:100,        baseCost:1900      },
  ],
  /* T1 */ [
    { id:'clic_1_0', name:'💅 Doigt d\'or',      desc:'+10/clic',     cpc:10,         baseCost:600       },
    { id:'clic_1_1', name:'🧤 Gant léger',       desc:'+22/clic',     cpc:22,         baseCost:1500      },
    { id:'clic_1_2', name:'🥊 Gant de boxe',     desc:'+45/clic',     cpc:45,         baseCost:3500      },
    { id:'clic_1_3', name:'⚒️ Marteau de forgeron',desc:'+80/clic',   cpc:80,         baseCost:6500      },
    { id:'clic_1_4', name:'🔧 Clé anglaise',     desc:'+130/clic',    cpc:130,        baseCost:10000     },
    { id:'clic_1_5', name:'🔨 Marteau lourd',    desc:'+200/clic',    cpc:200,        baseCost:14000     },
    { id:'clic_1_6', name:'⛏️ Pioche de mineur', desc:'+300/clic',    cpc:300,        baseCost:17500     },
    { id:'clic_1_7', name:'🗜️ Étau industriel',  desc:'+430/clic',    cpc:430,        baseCost:20000     },
    { id:'clic_1_8', name:'🪚 Scie circulaire',  desc:'+600/clic',    cpc:600,        baseCost:22500     },
    { id:'clic_1_9', name:'🪛 Tournevis turbo',  desc:'+800/clic',    cpc:800,        baseCost:24500     },
  ],
  /* T2 */ [
    { id:'clic_2_0', name:'🧤 Gant magique',     desc:'+50/clic',     cpc:50,         baseCost:3500      },
    { id:'clic_2_1', name:'🔨 Grand marteau',    desc:'+120/clic',    cpc:120,        baseCost:10000     },
    { id:'clic_2_2', name:'⚙️ Engrenage turbo',  desc:'+260/clic',    cpc:260,        baseCost:25000     },
    { id:'clic_2_3', name:'🔩 Boulon renforcé',  desc:'+500/clic',    cpc:500,        baseCost:55000     },
    { id:'clic_2_4', name:'🪝 Crochet en acier', desc:'+900/clic',    cpc:900,        baseCost:100000    },
    { id:'clic_2_5', name:'🔗 Chaîne industrielle',desc:'+1500/clic', cpc:1500,       baseCost:150000    },
    { id:'clic_2_6', name:'⚒️ Double pioche',    desc:'+2300/clic',   cpc:2300,       baseCost:195000    },
    { id:'clic_2_7', name:'🏗️ Bras de grue',     desc:'+3400/clic',   cpc:3400,       baseCost:230000    },
    { id:'clic_2_8', name:'🚛 Bulldozer',         desc:'+5000/clic',   cpc:5000,       baseCost:265000    },
    { id:'clic_2_9', name:'🏎️ Turbo-clic',        desc:'+7000/clic',   cpc:7000,       baseCost:295000    },
  ],
  /* T3 */ [
    { id:'clic_3_0', name:'👊 Poing d\'acier',   desc:'+200/clic',    cpc:200,        baseCost:18000     },
    { id:'clic_3_1', name:'🔫 Pisto-cliqueur',   desc:'+600/clic',    cpc:600,        baseCost:70000     },
    { id:'clic_3_2', name:'⚡ Décharge électrique',desc:'+1500/clic',  cpc:1500,       baseCost:200000    },
    { id:'clic_3_3', name:'💣 Explosif tactique', desc:'+3500/clic',   cpc:3500,       baseCost:500000    },
    { id:'clic_3_4', name:'🚀 Mini-roquette',    desc:'+7000/clic',   cpc:7000,       baseCost:1000000   },
    { id:'clic_3_5', name:'🛡️ Bouclier pulsé',   desc:'+13000/clic',  cpc:13000,      baseCost:1800000   },
    { id:'clic_3_6', name:'⚔️ Épée runique',     desc:'+22000/clic',  cpc:22000,      baseCost:2500000   },
    { id:'clic_3_7', name:'🗡️ Dague empoisonnée',desc:'+35000/clic',  cpc:35000,      baseCost:3000000   },
    { id:'clic_3_8', name:'🏹 Arc de cristal',   desc:'+55000/clic',  cpc:55000,      baseCost:3500000   },
    { id:'clic_3_9', name:'🌩️ Foudre canalisée', desc:'+80000/clic',  cpc:80000,      baseCost:3900000   },
  ],
  /* T4 */ [
    { id:'clic_4_0', name:'⚡ Laser de combat',   desc:'+1000/clic',   cpc:1000,       baseCost:100000    },
    { id:'clic_4_1', name:'🔬 Micro-injecteur',   desc:'+3000/clic',   cpc:3000,       baseCost:500000    },
    { id:'clic_4_2', name:'🧲 Aimant turbo',      desc:'+7000/clic',   cpc:7000,       baseCost:1500000   },
    { id:'clic_4_3', name:'💡 Éclair ionique',    desc:'+16000/clic',  cpc:16000,      baseCost:5000000   },
    { id:'clic_4_4', name:'📡 Pulse satellite',   desc:'+30000/clic',  cpc:30000,      baseCost:12000000  },
    { id:'clic_4_5', name:'🛸 Rayon tracteur',    desc:'+55000/clic',  cpc:55000,      baseCost:22000000  },
    { id:'clic_4_6', name:'💥 Onde de choc',      desc:'+90000/clic',  cpc:90000,      baseCost:33000000  },
    { id:'clic_4_7', name:'🌪️ Tornade quantique', desc:'+140K/clic',   cpc:140000,     baseCost:43000000  },
    { id:'clic_4_8', name:'⚗️ Synthèse forcée',   desc:'+210K/clic',   cpc:210000,     baseCost:52000000  },
    { id:'clic_4_9', name:'🌀 Vortex industriel', desc:'+320K/clic',   cpc:320000,     baseCost:59000000  },
  ],
  /* T5 */ [
    { id:'clic_5_0', name:'☄️ Météorite',         desc:'+5000/clic',   cpc:5000,       baseCost:600000    },
    { id:'clic_5_1', name:'🌀 Vortex cosmique',   desc:'+15000/clic',  cpc:15000,      baseCost:4000000   },
    { id:'clic_5_2', name:'💫 Éclat stellaire',   desc:'+40000/clic',  cpc:40000,      baseCost:15000000  },
    { id:'clic_5_3', name:'🌋 Lave quantique',    desc:'+100K/clic',   cpc:100000,     baseCost:45000000  },
    { id:'clic_5_4', name:'🧠 Télékinésie',       desc:'+230K/clic',   cpc:230000,     baseCost:120000000 },
    { id:'clic_5_5', name:'🌩️ Tempête EM',         desc:'+500K/clic',   cpc:500000,     baseCost:280000000 },
    { id:'clic_5_6', name:'🌟 Implosion stellaire',desc:'+1M/clic',    cpc:1000000,    baseCost:480000000 },
    { id:'clic_5_7', name:'🔥 Soleil artificiel',  desc:'+2M/clic',    cpc:2000000,    baseCost:650000000 },
    { id:'clic_5_8', name:'♾️ Cycle infini',       desc:'+3.8M/clic',  cpc:3800000,    baseCost:780000000 },
    { id:'clic_5_9', name:'🌐 Pulse mondial',      desc:'+7M/clic',    cpc:7000000,    baseCost:880000000 },
  ],
  /* T6 */ [
    { id:'clic_6_0', name:'🌌 Supernova',          desc:'+25K/clic',   cpc:25000,      baseCost:4000000   },
    { id:'clic_6_1', name:'🔮 Orbe magique',       desc:'+80K/clic',   cpc:80000,      baseCost:25000000  },
    { id:'clic_6_2', name:'🧿 Œil du chaos',       desc:'+220K/clic',  cpc:220000,     baseCost:100000000 },
    { id:'clic_6_3', name:'⚡ Foudre runique',     desc:'+600K/clic',  cpc:600000,     baseCost:350000000 },
    { id:'clic_6_4', name:'🌀 Spirale astrale',    desc:'+1.5M/clic',  cpc:1500000,    baseCost:1000000000},
    { id:'clic_6_5', name:'🔥 Phénix cosmique',    desc:'+3.5M/clic',  cpc:3500000,    baseCost:3000000000},
    { id:'clic_6_6', name:'🌒 Éclipse totale',     desc:'+8M/clic',    cpc:8000000,    baseCost:6000000000},
    { id:'clic_6_7', name:'👁️ Regard du dieu',     desc:'+18M/clic',   cpc:18000000,   baseCost:9500000000},
    { id:'clic_6_8', name:'🌟 Éclat divin',        desc:'+40M/clic',   cpc:40000000,   baseCost:12500000000},
    { id:'clic_6_9', name:'🌠 Volonté cosmique',   desc:'+90M/clic',   cpc:90000000,   baseCost:14500000000},
  ],
  /* T7 */ [
    { id:'clic_7_0', name:'🌟 Supernova XXL',      desc:'+150K/clic',  cpc:150000,     baseCost:25000000  },
    { id:'clic_7_1', name:'🧬 ADN quantique',      desc:'+500K/clic',  cpc:500000,     baseCost:200000000 },
    { id:'clic_7_2', name:'💫 Quasar focalisé',    desc:'+1.5M/clic',  cpc:1500000,    baseCost:1500000000},
    { id:'clic_7_3', name:'⚡ Antimasse',           desc:'+4M/clic',    cpc:4000000,    baseCost:8000000000},
    { id:'clic_7_4', name:'🕳️ Trou de ver',        desc:'+10M/clic',   cpc:10000000,   baseCost:25000000000},
    { id:'clic_7_5', name:'🌌 Matière noire',       desc:'+25M/clic',   cpc:25000000,   baseCost:60000000000},
    { id:'clic_7_6', name:'☢️ Plasma atomique',    desc:'+65M/clic',   cpc:65000000,   baseCost:110000000000},
    { id:'clic_7_7', name:'🔬 Nanobot massif',     desc:'+160M/clic',  cpc:160000000,  baseCost:165000000000},
    { id:'clic_7_8', name:'🧠 Cerveau cosmique',   desc:'+400M/clic',  cpc:400000000,  baseCost:210000000000},
    { id:'clic_7_9', name:'🌀 Fractale infinie',    desc:'+1B/clic',    cpc:1000000000, baseCost:248000000000},
  ],
  /* T8 */ [
    { id:'clic_8_0', name:'🧬 ADN galactique',     desc:'+750K/clic',  cpc:750000,     baseCost:200000000 },
    { id:'clic_8_1', name:'🔮 Prophétie',          desc:'+3M/clic',    cpc:3000000,    baseCost:2000000000},
    { id:'clic_8_2', name:'🌀 Singularité-clic',   desc:'+10M/clic',   cpc:10000000,   baseCost:15000000000},
    { id:'clic_8_3', name:'💥 Big Crunch',          desc:'+30M/clic',   cpc:30000000,   baseCost:60000000000},
    { id:'clic_8_4', name:'🌟 Quasar chargé',      desc:'+80M/clic',   cpc:80000000,   baseCost:200000000000},
    { id:'clic_8_5', name:'🌌 Dimension pulse',    desc:'+200M/clic',  cpc:200000000,  baseCost:600000000000},
    { id:'clic_8_6', name:'♾️ Boucle infinie',     desc:'+500M/clic',  cpc:500000000,  baseCost:1500000000000},
    { id:'clic_8_7', name:'🔥 Géante rouge',       desc:'+1.2B/clic',  cpc:1200000000, baseCost:2500000000000},
    { id:'clic_8_8', name:'🕳️ Horizon des événements',desc:'+3B/clic', cpc:3000000000, baseCost:3800000000000},
    { id:'clic_8_9', name:'🌈 Rayon cosmique',     desc:'+7.5B/clic',  cpc:7500000000, baseCost:4900000000000},
  ],
  /* T9 */ [
    { id:'clic_9_0', name:'🔮 Maîtrise cosmique',  desc:'+4M/clic',    cpc:4000000,    baseCost:2000000000},
    { id:'clic_9_1', name:'💫 Ondes temporelles',  desc:'+15M/clic',   cpc:15000000,   baseCost:20000000000},
    { id:'clic_9_2', name:'🌀 Fracture de réalité',desc:'+50M/clic',   cpc:50000000,   baseCost:150000000000},
    { id:'clic_9_3', name:'⚡ Dieu du tonnerre',   desc:'+150M/clic',  cpc:150000000,  baseCost:800000000000},
    { id:'clic_9_4', name:'🌟 Conscience absolue', desc:'+400M/clic',  cpc:400000000,  baseCost:4000000000000},
    { id:'clic_9_5', name:'♾️ Infini cliquable',   desc:'+1B/clic',    cpc:1000000000, baseCost:15000000000000},
    { id:'clic_9_6', name:'🔥 Feu primordial',     desc:'+2.5B/clic',  cpc:2500000000, baseCost:40000000000000},
    { id:'clic_9_7', name:'🌌 Créateur de monde',  desc:'+6B/clic',    cpc:6000000000, baseCost:100000000000000},
    { id:'clic_9_8', name:'👁️ Œil de l\'Absolu',   desc:'+15B/clic',   cpc:15000000000,baseCost:300000000000000},
    { id:'clic_9_9', name:'🍪 Le Grand Clic',      desc:'+40B/clic',   cpc:40000000000,baseCost:900000000000000},
  ],
]

const UPGRADES = [
  ..._TIER_PASSIVES.flatMap((arr, t) => arr.map(u => ({ ...u, requiredTier: t }))),
  ..._TIER_CLICKS.flatMap((arr, t) => arr.map(u => ({ ...u, requiredTier: t }))),
]


const TIERS = [
  { id: 0, name: 'Cabane en bois',        icon: '🪵', cost: 0              },
  { id: 1, name: 'Petite maison',          icon: '🏠', cost: 2000           },
  { id: 2, name: 'Maison de famille',      icon: '🏡', cost: 25000          },
  { id: 3, name: 'Appartement',            icon: '🏢', cost: 300000         },
  { id: 4, name: 'Commerce',               icon: '🏬', cost: 4000000        },
  { id: 5, name: 'Usine',                  icon: '🏭', cost: 60000000       },
  { id: 6, name: 'Château',               icon: '🏰', cost: 900000000      },
  { id: 7, name: 'Gratte-ciel',            icon: '🏙️', cost: 15000000000    },
  { id: 8, name: 'Station spatiale',       icon: '🌌', cost: 250000000000   },
  { id: 9, name: 'Complexe dimensionnel',  icon: '🌀', cost: 5000000000000  },
]

function getUpgradeCost(upgrade, owned) {
  return Math.floor(upgrade.baseCost * Math.pow(1.20, owned))
}

const GAMBLES = [
  { id: 'flip',   icon: '🪙', name: 'Pile ou Face', cost: 25,     chance: 0.40,   mult: 2,   desc: '40% de gagner ×2',      mental: 1  },
  { id: 'five',   icon: '🎯', name: '1 sur 5',       cost: 300,    chance: 0.16,   mult: 4,   desc: '16% de gagner ×4',      mental: 1  },
  { id: 'ten',    icon: '🏂', name: '1 sur 10',      cost: 1500,   chance: 0.08,   mult: 7,   desc: '8% de gagner ×7',       mental: 2  },
  { id: 'twenty', icon: '💥', name: '1 sur 20',      cost: 8000,   chance: 0.04,   mult: 14,  desc: '4% de gagner ×14',      mental: 2  },
  { id: 'hundo',  icon: '🎰', name: '1 sur 100',     cost: 25000,  chance: 0.008,  mult: 60,  desc: '0.8% de gagner ×60',    mental: 3  },
  { id: 'kilo',   icon: '👑', name: '1 sur 1000',    cost: 100000, chance: 0.0007, mult: 600, desc: '0.07% de gagner ×600',  mental: 5  },
]

function fmt(n) {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T'
  if (n >= 1e9)  return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6)  return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3)  return (n / 1e3).toFixed(1) + 'K'
  return Math.floor(n).toString()
}

export default function Game({ user, onLogout }) {
  const [cookies, setCookies]         = useState(0)
  const [totalCookies, setTotal]      = useState(0)
  const [owned, setOwned]             = useState({})
  const [cps, setCps]                 = useState(0)
  const [cpc, setCpc]                 = useState(1)
  const [clicking, setClicking]       = useState(false)
  const [loaded, setLoaded]           = useState(false)
  const [saving, setSaving]           = useState(false)
  const [floats, setFloats]           = useState([])
  const [tab, setTab]                 = useState('clicker')
  const [leaderboard, setLeaderboard] = useState([])
  const [lbLoading, setLbLoading]    = useState(false)
  const [customName, setCustomName]  = useState('')
  const [profileOpen, setProfileOpen]= useState(false)
  const [editingName, setEditingName]= useState('')
  const [savedEmail, setSavedEmail]  = useState('')
  const [loan, setLoan]               = useState(0)
  const [gambleResults, setGambleResults] = useState({})
  const [assets, setAssets]           = useState(getDefaultAssets)
  const [dead, setDead]               = useState(false)
  const [deathCause, setDeathCause]   = useState(null)
  const [mentalHealth, setMentalHealth] = useState(100)
  const [tier,         setTier]         = useState(0)

  const cookiesRef      = useRef(0)
  const totalRef        = useRef(0)
  const ownedRef        = useRef({})
  const loanRef         = useRef(0)
  const assetsRef       = useRef(getDefaultAssets())
  const mentalRef       = useRef(100)
  const tierRef         = useRef(0)
  const saveTimer       = useRef(null)

  const userId = user?.profile?.sub

  // Sync refs with state so the debounced save always has latest values
  useEffect(() => { cookiesRef.current = cookies }, [cookies])
  useEffect(() => { totalRef.current = totalCookies }, [totalCookies])
  useEffect(() => { ownedRef.current = owned }, [owned])
  useEffect(() => { loanRef.current = loan }, [loan])
  useEffect(() => { assetsRef.current = assets }, [assets])
  useEffect(() => { mentalRef.current = mentalHealth }, [mentalHealth])
  useEffect(() => { tierRef.current = tier }, [tier])

  // Load save from Firebase
  useEffect(() => {
    if (!userId) return
    loadScore(userId)
      .then(data => {
        if (data) {
          setCookies(data.cookies ?? 0)
          setTotal(data.totalCookies ?? 0)
          setOwned(data.owned ?? {})
          setLoan(data.loan ?? 0)
          setAssets({ ...getDefaultAssets(), ...(data.assets ?? {}) })
          setMentalHealth(data.mentalHealth ?? 100)
          setTier(data.tier ?? 0)
          if (data.displayName) setCustomName(data.displayName)
          if (data.email) setSavedEmail(data.email)
        }
      })
      .catch(console.error)
      .finally(() => setLoaded(true))
  }, [userId])

  // Recalculate CPS + CPC whenever upgrades change
  useEffect(() => {
    const totalCps = UPGRADES.reduce((sum, u) => u.cps ? sum + (owned[u.id] || 0) * u.cps : sum, 0)
    const totalCpc = UPGRADES.reduce((sum, u) => u.cpc ? sum + (owned[u.id] || 0) * u.cpc : sum, 0)
    setCps(totalCps)
    setCpc(1 + totalCpc)
  }, [owned])

  // Passive income loop
  useEffect(() => {
    if (cps <= 0 || !loaded) return
    const interval = setInterval(() => {
      setCookies(c => c + cps)
      setTotal(t => t + cps)
    }, 1000)
    return () => clearInterval(interval)
  }, [cps, loaded])

  // Loan interest: +2% every 20s + malus mental
  useEffect(() => {
    if (!loaded) return
    const interval = setInterval(() => {
      const currentLoan = loanRef.current
      if (currentLoan <= 0) return

      const newLoan = Math.ceil(currentLoan * 1.02)
      setLoan(newLoan)
      loanRef.current = newLoan

      // Mental health penalty while in debt
      setMentalHealth(mh => Math.max(0, mh - 10))
      scheduleSave()
    }, 20000)
    return () => clearInterval(interval)
  }, [loaded])

  // Mental health passive regen: +1 every 60s
  useEffect(() => {
    if (!loaded) return
    const interval = setInterval(() => {
      setMentalHealth(mh => {
        const next = Math.min(100, mh + 1)
        mentalRef.current = next
        return next
      })
    }, 60000)
    return () => clearInterval(interval)
  }, [loaded])

  const changeMentalHealth = (delta) => {
    setMentalHealth(mh => Math.max(0, Math.min(100, mh + delta)))
  }

  const scheduleSave = () => {
    if (!userId) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaving(true)
      try {
        await saveScore(userId, {
          displayName: customName || user?.profile?.preferred_username || user?.profile?.name || user?.profile?.email || 'Joueur',
          email: user?.profile?.email || savedEmail || '',
          cookies: cookiesRef.current,
          totalCookies: totalRef.current,
          owned: ownedRef.current,
          loan: loanRef.current,
          assets: assetsRef.current,
          mentalHealth: mentalRef.current,
          tier: tierRef.current,
          savedAt: new Date().toISOString(),
        })
      } catch (e) {
        console.error('Erreur de sauvegarde:', e)
      } finally {
        setSaving(false)
      }
    }, 4000)
  }

  // Fetch leaderboard when tab changes to 'leaderboard'
  useEffect(() => {
    if (tab !== 'leaderboard') return
    setLbLoading(true)
    getLeaderboard(50)
      .then(rows => setLeaderboard(rows))
      .catch(err => console.error('Leaderboard error:', err))
      .finally(() => setLbLoading(false))
  }, [tab])

  const handleClick = (e) => {
    setCookies(c => c + cpc)
    setTotal(t => t + cpc)
    setClicking(true)
    setTimeout(() => setClicking(false), 100)

    // Floating animation
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now() + Math.random()
    setFloats(f => [...f, { id, x, y, value: cpc }])
    setTimeout(() => setFloats(f => f.filter(fl => fl.id !== id)), 900)

    scheduleSave()
  }

  const buyUpgrade = (upgrade) => {
    const count = owned[upgrade.id] || 0
    const cost  = getUpgradeCost(upgrade, count)
    if (cookies < cost) return
    setCookies(c => c - cost)
    setOwned(o => ({ ...o, [upgrade.id]: count + 1 }))
    scheduleSave()
  }

  const buyTier = () => {
    if (tier >= TIERS.length - 1) return
    const next = TIERS[tier + 1]
    if (cookies < next.cost) return
    setCookies(c => c - next.cost)
    setTier(t => t + 1)
    scheduleSave()
  }

  const handleCasinoResult = (delta) => {
    setCookies(c => c + delta)
    scheduleSave()
  }

  const handleMentalChange = (delta) => {
    changeMentalHealth(delta)
  }

  const handleBorrow = (amount, totalOwed) => {
    setCookies(c => c + amount)
    setLoan(l => l + totalOwed)
    scheduleSave()
  }

  const handleRepay = (amount) => {
    const repay = Math.min(amount, loan)
    setCookies(c => c - repay)
    setLoan(l => Math.max(0, l - repay))
    scheduleSave()
  }

  const handleSellAsset = (asset) => {
    const qty = assets[asset.id] ?? asset.startQty
    if (qty <= 0) return
    const newQty = qty - 1
    setAssets(a => ({ ...a, [asset.id]: newQty }))
    setCookies(c => c + asset.price)
    changeMentalHealth(asset.mentalImpact ?? -3)
    scheduleSave()
    if (asset.fatalAtZero && newQty === 0) {
      setTimeout(() => handleDeath(asset), 600)
    }
  }

  const handleDeath = (cause) => {
    setDeathCause(cause)
    setCookies(0)
    setTotal(0)
    setOwned({})
    setLoan(0)
    setAssets(getDefaultAssets())
    setMentalHealth(100)
    setTier(0)
    setDead(true)
    if (userId) {
      saveScore(userId, {
        cookies: 0, totalCookies: 0, owned: {}, loan: 0,
        assets: getDefaultAssets(), mentalHealth: 100, tier: 0,
        savedAt: new Date().toISOString(),
      }).catch(console.error)
    }
  }

  const handleRespawn = () => {
    setDead(false)
    setDeathCause(null)
  }

  const handleBuyItem = (item) => {
    if (cookies < item.cost) return
    setCookies(c => c - item.cost)
    if (item.consumable) {
      changeMentalHealth(item.mentalBoost ?? 0)
    } else {
      setAssets(a => ({ ...a, [item.id]: (a[item.id] ?? 0) + 1 }))
      changeMentalHealth(item.mentalBoost ?? 3)
    }
    scheduleSave()
  }

  const handleGamble = (gamble) => {
    if (cookies < gamble.cost) return
    const win = Math.random() < gamble.chance
    if (win) {
      const gain = Math.floor(gamble.cost * gamble.mult)
      setCookies(c => c - gamble.cost + gain)
      changeMentalHealth(gamble.mental ?? 5)
    } else {
      setCookies(c => c - gamble.cost)
      changeMentalHealth(-(gamble.mental ?? 5))
    }
    setGambleResults(r => ({ ...r, [gamble.id]: win ? 'win' : 'lose' }))
    setTimeout(() => setGambleResults(r => { const n = { ...r }; delete n[gamble.id]; return n }), 1600)
    scheduleSave()
  }

  // Mental health = 0 → death
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!loaded || dead || mentalHealth > 0) return
    const timer = setTimeout(() =>
      handleDeath({ name: 'dépression totale', type: 'mental' })
    , 400)
    return () => clearTimeout(timer)
  }, [mentalHealth, loaded, dead])

  if (!loaded) {
    return (
      <div className="centered">
        <div className="spinner" />
        <p>Chargement de la partie...</p>
      </div>
    )
  }

  const picture = user?.profile?.picture
  const name    = customName || user?.profile?.name || user?.profile?.email || 'Joueur'
  const email   = user?.profile?.email || savedEmail || ''

  const handleSaveName = () => {
    const trimmed = editingName.trim()
    if (!trimmed) return
    setCustomName(trimmed)
    setProfileOpen(false)
    if (userId) {
      saveScore(userId, { displayName: trimmed }).catch(console.error)
    }
  }

  return (
    <div className="game">

      {/* Death overlay */}
      {dead && (
        <div className="death-screen">
          <div className="death-box">
            <div className="death-skull">💀</div>
            <h2 className="death-title">Vous êtes mort</h2>
            <p className="death-msg">
              {deathCause?.type === 'mental'
                ? <>Votre santé mentale a atteint 0.<br />Vous avez sombré dans la dépression…</>
                : deathCause?.type === 'roulette'
                ? <>La balle était dans la chambre.<br />Vous n&apos;avez pas eu de chance…</>
                : <>Vous avez vendu votre <strong>{deathCause?.name}</strong>…</>}
              <br />Tout est perdu. Cookies, upgrades, emprunt — tout.
            </p>
            <button className="btn-respawn" onClick={handleRespawn}>
              Recommencer à zéro
            </button>
          </div>
        </div>
      )}

      {/* Profile modal */}
      {profileOpen && (
        <div className="profile-overlay" onClick={() => setProfileOpen(false)}>
          <div className="profile-modal" onClick={e => e.stopPropagation()}>
            <h2 className="profile-title">👤 Mon profil</h2>
            {picture && <img src={picture} alt="avatar" className="profile-avatar" referrerPolicy="no-referrer" />}
            <label className="profile-label">Nom d&apos;affichage</label>
            <input
              className="profile-input"
              value={editingName}
              onChange={e => setEditingName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveName()}
              placeholder={name}
              maxLength={32}
              autoFocus
            />
            <label className="profile-label">Email</label>
            <div className="profile-email">{email}</div>
            <div className="profile-actions">
              <button className="btn-profile-save" onClick={handleSaveName}>Sauvegarder</button>
              <button className="btn-profile-cancel" onClick={() => setProfileOpen(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="game-header">
        <div className="user-info" onClick={() => { setEditingName(name); setProfileOpen(true) }} style={{cursor:'pointer'}} title="Modifier le profil">
          {picture && <img src={picture} alt="avatar" className="avatar" referrerPolicy="no-referrer" />}
          <span className="user-name">{name}</span>
          {saving && <span className="saving-badge">💾 Sauvegarde…</span>}
        </div>
        <button className="btn-logout" onClick={onLogout}>Déconnexion</button>
      </header>

      {/* Top tabs */}
      <nav className="game-tabs">
        <button className={`game-tab ${tab === 'clicker' ? 'active' : ''}`} onClick={() => setTab('clicker')}>
          🍪 Clicker
        </button>
        <button className={`game-tab ${tab === 'casino' ? 'active' : ''}`} onClick={() => setTab('casino')}>
          🎰 Casino
        </button>
        <button className={`game-tab ${tab === 'bank' ? 'active' : ''}`} onClick={() => setTab('bank')}>
          🏦 Banque{loan > 0 ? <span className="tab-debt-badge"> !</span> : null}
        </button>
        <button className={`game-tab ${tab === 'life' ? 'active' : ''}`} onClick={() => setTab('life')}>
          💼 Vie
        </button>
        <button className={`game-tab ${tab === 'leaderboard' ? 'active' : ''}`} onClick={() => setTab('leaderboard')}>
          🏆 Classement
        </button>
      </nav>

      {/* Mental health bar */}
      <div className="mental-bar-container">
        <span className="mental-label">
          {mentalHealth >= 70 ? '😊' : mentalHealth >= 40 ? '😐' : '😰'} Santé mentale
        </span>
        <div className="mental-bar-track">
          <div
            className={`mental-bar-fill ${mentalHealth >= 70 ? 'mental-good' : mentalHealth >= 40 ? 'mental-mid' : 'mental-bad'}`}
            style={{ width: `${mentalHealth}%` }}
          />
        </div>
        <span className="mental-pct">{Math.round(mentalHealth)}%</span>
      </div>

      <main className="game-main">
        {tab === 'clicker' ? (
          /* Cookie zone */
          <section className="cookie-zone">
          <div className="stats">
            <div className="stat">
              <span className={`stat-value ${cookies < 0 ? 'stat-debt' : ''}`}>{cookies < 0 ? '−' : ''}{fmt(Math.abs(cookies))}</span>
              <span className="stat-label">{cookies < 0 ? '🔴 dette' : 'cookies'}</span>
            </div>
            {cps > 0 && (
              <div className="stat">
                <span className="stat-value">{fmt(cps)}</span>
                <span className="stat-label">par seconde</span>
              </div>
            )}
            {cpc > 1 && (
              <div className="stat">
                <span className="stat-value">{fmt(cpc)}</span>
                <span className="stat-label">par clic</span>
              </div>
            )}
            {loan > 0 && (
              <div className="stat">
                <span className="stat-value stat-debt">{fmt(loan)}</span>
                <span className="stat-label">💸 emprunt</span>
              </div>
            )}
          </div>

          <div className="cookie-wrapper" onClick={handleClick}>
            <button className={`cookie-btn ${clicking ? 'clicked' : ''}`} aria-label="Cliquer">
              🍪
            </button>
            {floats.map(f => (
              <span
                key={f.id}
                className="float-text"
                style={{ left: f.x, top: f.y }}
              >
                +{fmt(f.value)}
              </span>
            ))}
          </div>

          <p className="total-label">Total cuit : {fmt(totalCookies)} cookies</p>
        </section>
        ) : tab === 'casino' ? (
          <Casino cookies={cookies} onResult={handleCasinoResult} onMentalChange={handleMentalChange} onDeath={handleDeath} />
        ) : tab === 'life' ? (
          <Life
            cookies={cookies}
            assets={assets}
            onSell={handleSellAsset}
            onBuy={handleBuyItem}
          />
        ) : tab === 'leaderboard' ? (
          <section className="leaderboard">
            <h2 className="lb-title">🏆 Classement</h2>
            {lbLoading ? (
              <p className="lb-loading">Chargement…</p>
            ) : leaderboard.length === 0 ? (
              <p className="lb-loading">Aucun joueur trouvé.</p>
            ) : (
              <ol className="lb-list">
                {leaderboard.map((row, i) => {
                  const isMe = row.id === userId
                  const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
                  return (
                    <li key={row.id} className={`lb-row ${isMe ? 'lb-me' : ''}`}>
                      <span className="lb-rank">{medal}</span>
                      <span className="lb-name">{row.displayName || 'Joueur'}</span>
                      {row.tier != null && TIERS[row.tier] && (
                        <span className="lb-tier">{TIERS[row.tier].icon} {TIERS[row.tier].name}</span>
                      )}
                      <span className="lb-score">{fmt(row.cookies ?? 0)} 🍪</span>
                    </li>
                  )
                })}
              </ol>
            )}
          </section>
        ) : (
          <Bank cookies={cookies} loan={loan} onBorrow={handleBorrow} onRepay={handleRepay} />
        )}

        {/* Upgrades panel */}
        <aside className="upgrades">
          <h2 className="upgrades-title">Améliorations</h2>

          {/* Palier */}
          <div className="tier-panel">
            <div className="tier-current">
              <span className="tier-icon-big">{TIERS[tier].icon}</span>
              <div>
                <div className="tier-label-small">Palier actuel</div>
                <div className="tier-name-text">{TIERS[tier].name}</div>
              </div>
            </div>
            {tier < TIERS.length - 1 ? (
              <button
                className={`tier-buy-btn ${cookies >= TIERS[tier + 1].cost ? 'affordable' : 'expensive'}`}
                onClick={buyTier}
                disabled={cookies < TIERS[tier + 1].cost}
              >
                <span>{TIERS[tier + 1].icon} {TIERS[tier + 1].name}</span>
                <span className="tier-buy-cost">{fmt(TIERS[tier + 1].cost)} 🍪</span>
              </button>
            ) : (
              <div className="tier-max">🌟 Palier maximum atteint !</div>
            )}
          </div>

          <div className="upgrades-section-label">⏱️ Passif</div>
          {UPGRADES.filter(u => u.cps && u.requiredTier === tier).map(upgrade => {
            const count     = owned[upgrade.id] || 0
            const cost      = getUpgradeCost(upgrade, count)
            const canAfford = cookies >= cost
            return (
              <button
                key={upgrade.id}
                className={`upgrade-item ${canAfford ? 'affordable' : 'expensive'}`}
                onClick={() => buyUpgrade(upgrade)}
                disabled={!canAfford}
              >
                <span className="upgrade-icon">{upgrade.name.split(' ')[0]}</span>
                <div className="upgrade-info">
                  <span className="upgrade-name">{upgrade.name.slice(upgrade.name.indexOf(' ') + 1)}</span>
                  <span className="upgrade-desc">{upgrade.desc}</span>
                </div>
                <div className="upgrade-meta">
                  <span className="upgrade-cost">{fmt(cost)} 🍪</span>
                  {count > 0 && <span className="upgrade-count">×{count}</span>}
                </div>
              </button>
            )
          })}
          {tier < TIERS.length - 1 && (
            <button className="upgrade-item locked tier-teaser" disabled>
              <span className="upgrade-icon">🔒</span>
              <div className="upgrade-info">
                <span className="upgrade-name">+{_TIER_PASSIVES[tier + 1].length} passifs débloqués</span>
                <span className="upgrade-desc">{TIERS[tier + 1].icon} {TIERS[tier + 1].name} requis</span>
              </div>
              <div className="upgrade-meta"><span className="upgrade-lock">🔒</span></div>
            </button>
          )}

          <div className="upgrades-divider" />
          <div className="upgrades-section-label">👆 Clic</div>
          {UPGRADES.filter(u => u.cpc && u.requiredTier === tier).map(upgrade => {
            const count     = owned[upgrade.id] || 0
            const cost      = getUpgradeCost(upgrade, count)
            const canAfford = cookies >= cost
            return (
              <button
                key={upgrade.id}
                className={`upgrade-item ${canAfford ? 'affordable' : 'expensive'}`}
                onClick={() => buyUpgrade(upgrade)}
                disabled={!canAfford}
              >
                <span className="upgrade-icon">{upgrade.name.split(' ')[0]}</span>
                <div className="upgrade-info">
                  <span className="upgrade-name">{upgrade.name.slice(upgrade.name.indexOf(' ') + 1)}</span>
                  <span className="upgrade-desc">{upgrade.desc}</span>
                </div>
                <div className="upgrade-meta">
                  <span className="upgrade-cost">{fmt(cost)} 🍪</span>
                  {count > 0 && <span className="upgrade-count">×{count}</span>}
                </div>
              </button>
            )
          })}
          {tier < TIERS.length - 1 && (
            <button className="upgrade-item locked tier-teaser" disabled>
              <span className="upgrade-icon">🔒</span>
              <div className="upgrade-info">
                <span className="upgrade-name">+{_TIER_CLICKS[tier + 1].length} clics débloqués</span>
                <span className="upgrade-desc">{TIERS[tier + 1].icon} {TIERS[tier + 1].name} requis</span>
              </div>
              <div className="upgrade-meta"><span className="upgrade-lock">🔒</span></div>
            </button>
          )}

          <div className="upgrades-divider" />
          <h2 className="upgrades-title">Paris rapides</h2>
          {GAMBLES.map(gamble => {
            const canAfford = cookies >= gamble.cost
            const result    = gambleResults[gamble.id]
            return (
              <button
                key={gamble.id}
                className={`gamble-item ${
                  result === 'win' ? 'gamble-win'
                  : result === 'lose' ? 'gamble-lose'
                  : canAfford ? 'gamble-ready' : 'gamble-broke'
                }`}
                onClick={() => handleGamble(gamble)}
                disabled={!canAfford}
              >
                <span className="upgrade-icon">{gamble.icon}</span>
                <div className="upgrade-info">
                  <span className="upgrade-name">{gamble.name}</span>
                  <span className="upgrade-desc">{gamble.desc}</span>
                </div>
                <div className="upgrade-meta">
                  {result === 'win'
                    ? <span className="gamble-result-win">+{fmt(Math.floor(gamble.cost * (gamble.mult - 1)))} 🍪</span>
                    : result === 'lose'
                    ? <span className="gamble-result-lose">−{fmt(gamble.cost)} 🍪</span>
                    : <span className="upgrade-cost">{fmt(gamble.cost)} 🍪</span>
                  }
                </div>
              </button>
            )
          })}
        </aside>
      </main>
    </div>
  )
}
