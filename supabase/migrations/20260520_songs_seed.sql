-- ============================================================
-- Seed: 30 músicas evangélicas do sistema (org_id = NULL)
-- Visíveis para todos os líderes autenticados
-- ============================================================

INSERT INTO public.songs
  (org_id, title, artist, default_key, male_key, female_key, notes, is_active)
VALUES
  (NULL, 'Oceans (Onde os Pés Podem Falhar)',   'Hillsong United / Hillsong Brasil',              'D',  'D',  'E',  'Adoração contemporânea; muito usada em células e cultos jovens.',                               true),
  (NULL, 'Nenhum Outro Nome',                   'Diante do Trono',                                'G',  'F',  'G',  'Hino de proclamação; muito tocada na abertura de cultos.',                                      true),
  (NULL, 'Ousado Amor',                         'Fernandinho',                                    'G',  'G',  'A',  'Versão PT de "Reckless Love" (Cory Asbury); grande hit dos últimos anos.',                      true),
  (NULL, 'Lugar Secreto',                       'Fernandinho',                                    'E',  'E',  'F#', 'Música de intimidade; muito usada em momentos de ministração e oração.',                        true),
  (NULL, 'Grande É o Senhor',                   'Diante do Trono',                                'A',  'G',  'A',  'Hino de exaltação; frequente em cultos tradicionais de louvor.',                                true),
  (NULL, 'Quão Grande É o Meu Deus',            'Fernandinho / Chris Tomlin',                     'G',  'G',  'A',  'Versão PT de "How Great Is Our God"; uma das mais tocadas em cultos brasileiros.',               true),
  (NULL, 'Até o Fim',                           'Diante do Trono',                                'G',  'F',  'G',  'Música de compromisso e rendição; muito usada em apelos e momentos de decisão.',                true),
  (NULL, 'Bondade de Deus',                     'Fernandinho / Isadora Pompeo',                   'A',  'G',  'A',  'Versão PT de "Goodness of God" (Bethel); grande sucesso recente em cultos e eventos.',         true),
  (NULL, 'Maravilhosa Graça',                   'Diante do Trono',                                'D',  'C',  'D',  'Hino de adoração clássico do ministério; melodia simples e letra profunda.',                    true),
  (NULL, 'Hosana',                              'Diante do Trono',                                'E',  'D',  'E',  'Música de proclamação; muito usada em aberturas e momentos de louvor intenso.',                 true),
  (NULL, 'Agnus Dei',                           'Diante do Trono',                                'G',  'F',  'G',  'Hino litúrgico; forte presença em Santa Ceia e adoração reverente.',                            true),
  (NULL, 'Tua Graça Me Basta',                  'Fernandinho',                                    'C',  'C',  'D',  'Versão PT de "Your Grace Is Enough"; melodia acessível, muito tocada em células.',             true),
  (NULL, 'Rendido Estou',                       'Hillsong / versão PT',                           'D',  'D',  'E',  'Versão PT de "I Surrender"; usada em momentos de entrega e consagração.',                      true),
  (NULL, 'Sonda-me, Usa-me',                    'Diante do Trono',                                'G',  'F',  'G',  'Música de consagração; clássico muito executado em retiros e encontros.',                       true),
  (NULL, 'Santo Espírito',                      'Fernandinho',                                    'A',  'G',  'A',  'Cântico de invocação do Espírito Santo; atmosfera suave de abertura da presença.',             true),
  (NULL, 'Me Atraiu',                           'Ana Paula Valadão / Diante do Trono',            'D',  'C',  'D',  'Baseada em Jeremias 31:3; muito usada em casamentos e cultos de intimidade.',                 true),
  (NULL, 'Aleluia',                             'Ministério Vineyard / Diversos',                 'G',  'G',  'A',  'Clássico do movimento Vineyard; simples e poderosa, muito tocada em células e oração.',        true),
  (NULL, 'Deus Está Aqui',                      'Diante do Trono',                                'E',  'D',  'E',  'Música de entrada na presença de Deus; usada para abrir cultos e adoração.',                   true),
  (NULL, '10.000 Razões',                       'Fernandinho / Matt Redman',                      'G',  'G',  'A',  'Versão PT de "10,000 Reasons"; muito popular em todas as denominações evangélicas.',           true),
  (NULL, 'Creio no Senhor',                     'Diante do Trono',                                'G',  'F',  'G',  'Declaração de fé musicada; usada em cultos de ensino e proclamação coletiva.',                 true),
  (NULL, 'Majestade',                           'Fernandinho',                                    'B',  'A',  'B',  'Hino de exaltação com arranjo épico; muito executada em grandes eventos gospel.',              true),
  (NULL, 'Extraordinário Deus',                 'Hillsong / Ana Paula Valadão',                   'A',  'G',  'A',  'Versão PT de "Mighty to Save"; muito executada em cultos jovens.',                             true),
  (NULL, 'Fidelidade',                          'Diante do Trono',                                'D',  'C',  'D',  'Hino sobre a fidelidade de Deus; frequente em aniversários de igrejas.',                       true),
  (NULL, 'Faz Chover',                          'Ministério Koinonya / Versão Evangélica',        'G',  'F',  'G',  'Cântico de avivamento; muito utilizado em cultos de oração e intercessão.',                   true),
  (NULL, 'Espírito Santo',                      'Fernandinho',                                    'G',  'F',  'G',  'Cântico suave de invocação; atmosfera contemplativa, ideal para ministração.',                 true),
  (NULL, 'Perfeito É o Teu Amor',               'Diante do Trono',                                'E',  'D',  'E',  'Afirmação da perfeição de Deus; muito usada em Santa Ceia e adoração reverente.',             true),
  (NULL, 'Filho do Céu',                        'Fernandinho',                                    'C',  'C',  'D',  'Canção de identidade em Cristo; popular em ministério de jovens e conferências.',              true),
  (NULL, 'Ressuscitou',                         'Hillsong / Fernandinho',                         'A',  'G',  'A',  'Versão PT de "Glorious Day"; muito executada na Páscoa e cultos de proclamação.',             true),
  (NULL, 'Nada Além do Sangue',                 'Diante do Trono',                                'D',  'C',  'D',  'Hino sobre o sacrifício de Cristo; clássico de Santa Ceia.',                                   true),
  (NULL, 'Ele Vive',                            'Diante do Trono / Hino Tradicional',             'G',  'F',  'G',  'Hino tradicional sobre a ressurreição; muito tocado em igrejas históricas e batistas.',       true)
ON CONFLICT DO NOTHING;
