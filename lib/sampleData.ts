/**
 * Dados de EXEMPLO para desenvolvimento/validação da interface.
 *
 * Não são as 41 músicas reais do PDF "Meu Canto, Minha Fé - Banda EAC
 * Porciúncula" — esse catálogo real entra pela importação de TXT (painel
 * admin, Fase 1/3 da especificação). O texto de "Somos Luz" abaixo é o
 * mesmo conteúdo fictício usado no esboço de aprovação, só para exercitar
 * o parser/motor de transposição/tela da música ponta a ponta.
 */
export type Collection = "EAC" | "MISSA";

export interface SampleSong {
  id: string;
  slug: string;
  number: number | null;
  title: string;
  collection: Collection;
  category: string;
  originalKey: string;
  version: string;
  updatedAt: string;
  txt: string;
}

const SOMOS_LUZ_TXT = `---
title: SOMOS LUZ
collection: EAC
key: A
number: 41
---

[Verso 1]
A                 E
Caminhando lado a lado
F#m           D
Sempre unidos na fé
A                E
Como irmãos numa jornada
D            A/C#
Caminhamos com Você

[Refrão]
D          A
Somos luz, somos sal
F#m            E
Somos povo de aliança

[Verso 2]
A                    E
Não caminhamos sozinhos
F#m              D
Deus nos chama pra viver
`;

export const EAC_SONGS: SampleSong[] = [
  {
    id: "eac-41",
    slug: "somos-luz",
    number: 41,
    title: "Somos Luz",
    collection: "EAC",
    category: "Louvor",
    originalKey: "A",
    version: "v3",
    updatedAt: "2026-08-12",
    txt: SOMOS_LUZ_TXT,
  },
  {
    id: "eac-07",
    slug: "cancao-nova-de-amor",
    number: 7,
    title: "Canção Nova de Amor",
    collection: "EAC",
    category: "Envio",
    originalKey: "G",
    version: "v1",
    updatedAt: "2026-07-03",
    txt: `---\ntitle: CANÇÃO NOVA DE AMOR\ncollection: EAC\nkey: G\nnumber: 7\n---\n\n[Verso 1]\nG          C\n(letra de exemplo a ser substituída pela importação do TXT oficial)\nD          G\n`,
  },
  {
    id: "eac-03",
    slug: "vaso-novo",
    number: 3,
    title: "Vaso Novo",
    collection: "EAC",
    category: "Louvor",
    originalKey: "E",
    version: "v1",
    updatedAt: "2026-01-15",
    txt: `---\ntitle: VASO NOVO\ncollection: EAC\nkey: E\nnumber: 3\n---\n\n[Verso 1]\nE          B\n(letra de exemplo a ser substituída pela importação do TXT oficial)\n`,
  },
  {
    id: "eac-15",
    slug: "aguas-purificadoras",
    number: 15,
    title: "Águas Purificadoras",
    collection: "EAC",
    category: "Comunhão",
    originalKey: "A",
    version: "v2",
    updatedAt: "2026-05-28",
    txt: `---\ntitle: ÁGUAS PURIFICADORAS\ncollection: EAC\nkey: A\nnumber: 15\n---\n\n[Verso 1]\nA          D\n(letra de exemplo a ser substituída pela importação do TXT oficial)\n`,
  },
  {
    id: "eac-29",
    slug: "deus-cuida-de-mim",
    number: 29,
    title: "Deus Cuida de Mim",
    collection: "EAC",
    category: "Louvor",
    originalKey: "D",
    version: "v1",
    updatedAt: "2026-03-02",
    txt: `---\ntitle: DEUS CUIDA DE MIM\ncollection: EAC\nkey: D\nnumber: 29\n---\n\n[Verso 1]\nD          A\n(letra de exemplo a ser substituída pela importação do TXT oficial)\n`,
  },
];

export const MISSA_CATEGORIES = [
  "Entrada",
  "Ato Penitencial",
  "Glória",
  "Salmo",
  "Aclamação",
  "Ofertório",
  "Santo",
  "Cordeiro",
  "Comunhão",
  "Pós-Comunhão",
  "Final",
  "Adoração",
  "Maria",
  "Espírito Santo",
];

export const MISSA_SONGS: SampleSong[] = [
  {
    id: "missa-1",
    slug: "eis-me-aqui-senhor",
    number: null,
    title: "Eis-me Aqui, Senhor",
    collection: "MISSA",
    category: "Entrada",
    originalKey: "D",
    version: "v1",
    updatedAt: "2026-04-19",
    txt: `---\ntitle: EIS-ME AQUI, SENHOR\ncollection: MISSA\nkey: D\n---\n\n[Verso 1]\nD          G\n(letra de exemplo a ser substituída pela importação do TXT oficial)\n`,
  },
  {
    id: "missa-2",
    slug: "santo-santo-santo",
    number: null,
    title: "Santo, Santo, Santo",
    collection: "MISSA",
    category: "Santo",
    originalKey: "D",
    version: "v1",
    updatedAt: "2026-04-19",
    txt: `---\ntitle: SANTO, SANTO, SANTO\ncollection: MISSA\nkey: D\n---\n\n[Verso 1]\nD          G          A\n(letra de exemplo a ser substituída pela importação do TXT oficial)\n`,
  },
];

export function findSongBySlug(slug: string): SampleSong | undefined {
  return [...EAC_SONGS, ...MISSA_SONGS].find((s) => s.slug === slug);
}
