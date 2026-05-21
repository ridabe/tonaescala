export type RoleCategory = {
  category: string;
  roles: string[];
};

export const ROLE_CATEGORIES: RoleCategory[] = [
  {
    category: 'Banda de Louvor',
    roles: [
      'Ministro de Louvor',
      'Diretor de Louvor',
      'Regente',
      'Vocal Principal',
      'Vocal de Apoio',
      'Backing Vocal',
      'Guitarrista',
      'Contraguitarrista',
      'Violonista',
      'Baixista',
      'Baterista',
      'Tecladista',
      'Pianista',
      'Organista',
      'Percussionista',
      'Trompetista',
      'Trombonista',
      'Saxofonista',
      'Violinista',
      'Flautista',
    ],
  },
  {
    category: 'Operação Técnica',
    roles: [
      'Sonoplasta',
      'Operador de Projeção',
      'Operador de Transmissão',
      'Fotógrafo',
      'Videomaker',
      'Operador de Iluminação',
      'Operador de Câmera',
    ],
  },
  {
    category: 'Ministério',
    roles: [
      'Pastor',
      'Pregador',
      'Diácono',
      'Presbítero',
      'Intercessor',
      'Liderança de Células',
    ],
  },
  {
    category: 'Apoio e Organização',
    roles: [
      'Coordenador',
      'Mestre de Cerimônia',
      'Recepção',
      'Segurança',
      'Voluntário',
      'Servente',
      'Motorista',
    ],
  },
];

export const ALL_ROLES: string[] = ROLE_CATEGORIES.flatMap((c) => c.roles);
