/**
 * MOCK DATA REALI PER M.P.A. DI MAURIZIO CAVALLARO
 * Dati estratti direttamente dai disegni tecnici CAD SEMA e dall'audio di produzione
 */

const INITIAL_DATA = {
  // Operatori aziendali (Admin: Michele)
  operators: [
    { id: 1, name: 'Francesca', role: 'Troncatrice / Taglio', avatar: 'F' },
    { id: 2, name: 'Daniel', role: 'Banco Assemblaggio', avatar: 'D' },
    { id: 3, name: 'Michele', role: 'Amministratore / Titolare', avatar: 'M' },
    { id: 4, name: 'Maurizio', role: 'Direzione Tecnica', avatar: 'MC' }
  ],

  // Progetti / Commesse
  projects: [
    {
      id: 'proj-1',
      code: 'ETR-2026-01',
      title: 'Cabine Etruria Nuova',
      client: 'Marina di Grosseto (GR)',
      category: 'Stabilimenti Balneari',
      status: 'in_progress',
      isConfidential: false,
      deadline: '2026-10-15',
      coverNotes: 'Finitura bianca a vista, ferramenta inox nautica, n. 12 porte cabina con serratura Yale.',
      cadSoftware: 'SEMA Software 4.0',
      totalComponents: 8,
      components: [
        {
          id: 'comp-1',
          code: 'PM 01 - PM 02',
          title: 'NR 02 TELAIO ANTERIORE / 01 DX - 01 SX',
          pageNumber: 23,
          image: 'assets/drawings/photo_23_2026-10-01_15-40-04.jpg',
          cutStatus: 'completed',
          assemblyStatus: 'wip',
          cutOperator: 'Francesca',
          assemblyOperator: 'Daniel',
          cutStartTime: '08:30',
          cutEndTime: '10:45',
          assemblyStartTime: '11:00',
          assemblyEndTime: null,
          morali: [
            { id: 'm1-1', qty: 4, length: '3034.00', desc: 'Montanti principali', checked: true },
            { id: 'm1-2', qty: 4, length: '1937.00', desc: 'Traversini superiori', checked: true },
            { id: 'm1-3', qty: 2, length: '1141.50', desc: 'Fascione vano porta', checked: true },
            { id: 'm1-4', qty: 4, length: '1055.50', desc: 'Spallette porta', checked: true },
            { id: 'm1-5', qty: 2, length: '170.00', desc: 'Zoccolo base', checked: true },
            { id: 'm1-6', qty: 2, length: '121.50', desc: 'Battuta porta', checked: true },
            { id: 'm1-7', qty: 4, length: '84.00', desc: 'Spessori architrave', checked: true },
            { id: 'm1-8', qty: 4, length: '35.50', desc: 'Listelli di fermo', checked: true }
          ]
        },
        {
          id: 'comp-2',
          code: 'PM 09',
          title: 'NR 01 TELAIO POSTERIORE',
          pageNumber: 12,
          image: 'assets/drawings/photo_12_2026-10-01_15-40-04.jpg',
          cutStatus: 'completed',
          assemblyStatus: 'todo',
          cutOperator: 'Francesca',
          assemblyOperator: null,
          cutStartTime: '10:15',
          cutEndTime: '11:50',
          assemblyStartTime: null,
          assemblyEndTime: null,
          morali: [
            { id: 'm2-1', qty: 2, length: '3034.00', desc: 'Correnti longitudinali', checked: true },
            { id: 'm2-2', qty: 2, length: '1200.00', desc: 'Montanti testata', checked: true },
            { id: 'm2-3', qty: 4, length: '1114.00', desc: 'Montanti verticali intermedi', checked: true },
            { id: 'm2-4', qty: 3, length: '1014.90', desc: 'Traverse campata sinistra', checked: true },
            { id: 'm2-5', qty: 3, length: '836.10', desc: 'Traverse campata centrale', checked: true },
            { id: 'm2-6', qty: 6, length: '505.50', desc: 'Distanziali perlinatura', checked: true }
          ]
        },
        {
          id: 'comp-3',
          code: 'PM 12 - PM 22 - PM 25',
          title: 'NR 03 TELAIO SOPRA PORTA',
          pageNumber: 10,
          image: 'assets/drawings/photo_10_2026-10-01_15-40-04.jpg',
          cutStatus: 'wip',
          assemblyStatus: 'todo',
          cutOperator: 'Francesca',
          assemblyOperator: null,
          cutStartTime: '13:30',
          cutEndTime: null,
          assemblyStartTime: null,
          assemblyEndTime: null,
          note: "LA PARTE SOTTO E' A VISTA",
          morali: [
            { id: 'm3-1', qty: 6, length: '850.00', desc: 'Morali orizzontali telaio', checked: true },
            { id: 'm3-2', qty: 6, length: '1054.00', desc: 'Morali verticali telaio', checked: true },
            { id: 'm3-3', qty: 3, length: '764.00', desc: 'Traversini centrali a vista', checked: false }
          ]
        },
        {
          id: 'comp-4',
          code: 'PM 13',
          title: 'NR 02 LATERALE',
          pageNumber: 15,
          image: 'assets/drawings/photo_15_2026-10-01_15-40-04.jpg',
          cutStatus: 'todo',
          assemblyStatus: 'todo',
          cutOperator: null,
          assemblyOperator: null,
          cutStartTime: null,
          cutEndTime: null,
          assemblyStartTime: null,
          assemblyEndTime: null,
          morali: [
            { id: 'm4-1', qty: 2, length: '3034.00', desc: 'Morali di base e colmo', checked: false },
            { id: 'm4-2', qty: 2, length: '825.00', desc: 'Montanti estremi', checked: false },
            { id: 'm4-3', qty: 4, length: '739.00', desc: 'Montanti intermedi', checked: false },
            { id: 'm4-4', qty: 2, length: '1014.90', desc: 'Traverse campata A', checked: false },
            { id: 'm4-5', qty: 2, length: '836.10', desc: 'Traverse campata B', checked: false },
            { id: 'm4-6', qty: 4, length: '505.50', desc: 'Listelli di rinforzo', checked: false }
          ]
        },
        {
          id: 'comp-5',
          code: 'PM 20',
          title: 'NR 01 TELAIO DIVISORIO SERVIZI',
          pageNumber: 4,
          image: 'assets/drawings/photo_4_2026-10-01_15-40-04.jpg',
          cutStatus: 'todo',
          assemblyStatus: 'todo',
          cutOperator: null,
          assemblyOperator: null,
          cutStartTime: null,
          cutEndTime: null,
          assemblyStartTime: null,
          assemblyEndTime: null,
          morali: [
            { id: 'm5-1', qty: 2, length: '3034.00', desc: 'Correnti longitudinali', checked: false },
            { id: 'm5-2', qty: 2, length: '991.50', desc: 'Montanti perimetrali', checked: false },
            { id: 'm5-3', qty: 4, length: '906.25', desc: 'Ritti divisori interni', checked: false }
          ]
        },
        {
          id: 'comp-6',
          code: 'PM 21',
          title: 'NR 01 TELAIO DIVISORIO SERVIZI',
          pageNumber: 3,
          image: 'assets/drawings/photo_3_2026-10-01_15-40-04.jpg',
          cutStatus: 'todo',
          assemblyStatus: 'todo',
          cutOperator: null,
          assemblyOperator: null,
          cutStartTime: null,
          cutEndTime: null,
          assemblyStartTime: null,
          assemblyEndTime: null,
          morali: [
            { id: 'm6-1', qty: 2, length: '3034.00', desc: 'Morali orizzontali', checked: false },
            { id: 'm6-2', qty: 2, length: '789.50', desc: 'Montanti verticali', checked: false },
            { id: 'm6-3', qty: 4, length: '703.50', desc: 'Traversini di ripartizione', checked: false }
          ]
        },
        {
          id: 'comp-7',
          code: 'PM 23 - PM 24',
          title: 'NR 02 TELAIO DIVISORIO SERVIZI',
          pageNumber: 2,
          image: 'assets/drawings/photo_2_2026-10-01_15-40-04.jpg',
          cutStatus: 'todo',
          assemblyStatus: 'todo',
          cutOperator: null,
          assemblyOperator: null,
          cutStartTime: null,
          cutEndTime: null,
          assemblyStartTime: null,
          assemblyEndTime: null,
          morali: [
            { id: 'm7-1', qty: 4, length: '3034.00', desc: 'Morali per 2 telai', checked: false },
            { id: 'm7-2', qty: 4, length: '250.00', desc: 'Distanziali perimetrali', checked: false },
            { id: 'm7-3', qty: 8, length: '164.00', desc: 'Spezzoni di giunzione', checked: false }
          ]
        },
        {
          id: 'comp-8',
          code: 'PM 26',
          title: '01 TELAIO DIVISORIO SERVIZI',
          pageNumber: 1,
          image: 'assets/drawings/photo_1_2026-10-01_15-40-04.jpg',
          cutStatus: 'todo',
          assemblyStatus: 'todo',
          cutOperator: null,
          assemblyOperator: null,
          cutStartTime: null,
          cutEndTime: null,
          assemblyStartTime: null,
          assemblyEndTime: null,
          morali: [
            { id: 'm8-1', qty: 2, length: '3034.00', desc: 'Correnti longitudinali', checked: false },
            { id: 'm8-2', qty: 2, length: '356.00', desc: 'Montanti testata', checked: false },
            { id: 'm8-3', qty: 4, length: '270.00', desc: 'Traversini intermedi', checked: false }
          ]
        }
      ]
    },
    {
      id: 'proj-2',
      code: 'RIM-2026-02',
      title: 'Cabine Fiera Rimini',
      client: 'Fiera di Rimini / MondoBalneare',
      category: 'Esposizione Fiere',
      status: 'planned',
      isConfidential: false,
      deadline: '2026-11-04',
      coverNotes: 'Struttura dimostrativa ad aggancio rapido per fiera. Telai pre-verniciati grigio tortora.',
      cadSoftware: 'SEMA Software 4.0',
      totalComponents: 4,
      components: [
        {
          id: 'comp-rim-1',
          code: 'PM 01 - EXPO',
          title: 'NR 02 PARETE MODULARE FRONTALE',
          pageNumber: 1,
          image: 'assets/drawings/photo_11_2026-10-01_15-40-04.jpg',
          cutStatus: 'todo',
          assemblyStatus: 'todo',
          cutOperator: null,
          assemblyOperator: null,
          morali: [
            { id: 'm-rim-1', qty: 4, length: '2400.00', desc: 'Montanti verticali expo', checked: false },
            { id: 'm-rim-2', qty: 2, length: '1800.00', desc: 'Traverse superiori', checked: false },
            { id: 'm-rim-3', qty: 2, length: '900.00', desc: 'Traversini di base', checked: false }
          ]
        },
        {
          id: 'comp-rim-2',
          code: 'PM 02 - EXPO',
          title: 'NR 01 COPERTURA A FALDA',
          pageNumber: 2,
          image: 'assets/drawings/photo_14_2026-10-01_15-40-04.jpg',
          cutStatus: 'todo',
          assemblyStatus: 'todo',
          cutOperator: null,
          assemblyOperator: null,
          morali: [
            { id: 'm-rim-4', qty: 6, length: '2150.00', desc: 'Arcarecci inclinati', checked: false },
            { id: 'm-rim-5', qty: 2, length: '3200.00', desc: 'Banchina e colmo', checked: false }
          ]
        }
      ]
    },
    {
      id: 'proj-3',
      code: 'EST-2026-03',
      title: 'Pergola Lamellare Lido Estensi',
      client: 'Bagno Onda Blu',
      category: 'Arredo Giardino & Strutture',
      status: 'completed',
      isConfidential: false,
      deadline: '2026-09-18',
      coverNotes: 'Struttura in legno lamellare GL24h, collaudo superato con successo.',
      cadSoftware: 'SEMA Software 4.0',
      totalComponents: 3,
      components: [
        {
          id: 'comp-est-1',
          code: 'PL 01',
          title: 'PILASTRI LAMELLARI 16x16',
          pageNumber: 1,
          image: 'assets/drawings/photo_16_2026-10-01_15-40-04.jpg',
          cutStatus: 'completed',
          assemblyStatus: 'completed',
          cutOperator: 'Francesca',
          assemblyOperator: 'Daniel',
          morali: [
            { id: 'm-est-1', qty: 4, length: '2800.00', desc: 'Pilastri piallati 4 lati', checked: true },
            { id: 'm-est-2', qty: 4, length: '400.00', desc: 'Staffe a scomparsa inox', checked: true }
          ]
        },
        {
          id: 'comp-est-2',
          code: 'PL 02',
          title: 'TRAVI PORTANTI 16x24',
          pageNumber: 2,
          image: 'assets/drawings/photo_18_2026-10-01_15-40-04.jpg',
          cutStatus: 'completed',
          assemblyStatus: 'completed',
          cutOperator: 'Francesca',
          assemblyOperator: 'Daniel',
          morali: [
            { id: 'm-est-3', qty: 2, length: '6000.00', desc: 'Travi banchina', checked: true },
            { id: 'm-est-4', qty: 12, length: '4200.00', desc: 'Arcarecci sagomati', checked: true }
          ]
        }
      ]
    }
  ]
};
