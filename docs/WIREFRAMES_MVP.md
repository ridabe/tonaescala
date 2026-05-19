# Wireframes MVP - ToNaEscala

Wireframes textuais para orientar as telas do MVP com o novo fluxo de convocacoes.

## 1. Login / Entrada

```text
+-----------------------------+
| ToNaEscala                  |
| Organize escalas rapido     |
|                             |
| [Entrar com Google]         |
| [Entrar com email]          |
|                             |
| Entrar em evento            |
| [ Codigo do evento        ] |
| [ Email convocado         ] |
| [Entrar] [Ler QR Code]      |
+-----------------------------+
```

Notas:

- Organizador tem login completo.
- Convidado entra com codigo + email.
- O app nao deve liberar detalhes da escala apenas com o codigo.

## 2. Criar organizacao

```text
+-----------------------------+
| Nova organizacao            |
|                             |
| Nome                        |
| [ Igreja Exemplo          ] |
|                             |
| Descricao                   |
| [ Opcional                ] |
|                             |
| [Criar organizacao]         |
+-----------------------------+
```

## 3. Agenda

```text
+-----------------------------+
| Agenda                  [+] |
| Hoje                        |
| +-------------------------+ |
| | 18:00 Culto Domingo     | |
| | Vocal / Soprano         | |
| | Aceito                  | |
| +-------------------------+ |
|                             |
| Proximos                    |
| +-------------------------+ |
| | 20/06 Ensaio            | |
| | Guitarra / Pendente     | |
| +-------------------------+ |
|                             |
| Agenda Eventos Notif Perfil|
+-----------------------------+
```

## 4. Eventos

```text
+-----------------------------+
| Eventos                 [+] |
| [Igreja Exemplo       v]    |
|                             |
| Junho                       |
| +-------------------------+ |
| | Culto Domingo           | |
| | 07/06 - 18:00           | |
| | 12 convocados           | |
| | 8 aceitaram / 2 recusas | |
| +-------------------------+ |
| +-------------------------+ |
| | Conferencia Jovens      | |
| | 14/06 - 19:30           | |
| | 8 convocados            | |
| +-------------------------+ |
+-----------------------------+
```

## 5. Criar evento

```text
+-----------------------------+
| Novo evento                 |
|                             |
| Nome                        |
| [ Culto de Domingo       ]  |
| Categoria                   |
| [ Culto                  ]  |
| Local                       |
| [ Templo principal       ]  |
| Data                        |
| [ 07/06/2026             ]  |
| Inicio       Fim            |
| [18:00]      [20:00]        |
| Cor                         |
| o o o o o                   |
|                             |
| [Salvar evento]             |
+-----------------------------+
```

## 6. Detalhe do evento

```text
+-----------------------------+
| Culto de Domingo        ... |
| 07/06 - 18:00               |
| Templo principal            |
|                             |
| [Compartilhar convite]      |
|                             |
| Aceitos Recusas Vistos N/V  |
| 8       1       2      1    |
|                             |
| [Escala] [Equipes] [Status] |
|                             |
| Vocal                       |
| +-------------------------+ |
| | Ana Silva               | |
| | Soprano - 17:00         | |
| | Aceitou                 | |
| +-------------------------+ |
| +-------------------------+ |
| | Joao Lima               | |
| | Violao - 17:00          | |
| | Recusou: trabalho       | |
| +-------------------------+ |
|                             |
| [Adicionar convocado]       |
+-----------------------------+
```

## 7. Adicionar convocado

```text
+-----------------------------+
| Adicionar convocado         |
|                             |
| Nome                        |
| [ Ana Silva              ]  |
| Email *                     |
| [ ana@email.com          ]  |
| Telefone                    |
| [ opcional               ]  |
| Equipe                      |
| [ Vocal                  ]  |
| Funcao                      |
| [ Soprano                ]  |
| Chegada      Fim            |
| [17:00]      [20:00]        |
| Observacoes                 |
| [ Chegar para passagem... ] |
|                             |
| [Salvar convocacao]         |
+-----------------------------+
```

## 8. Compartilhar convite

```text
+-----------------------------+
| Convite do evento           |
|                             |
|        [ QR CODE ]          |
|                             |
| Codigo                      |
| TNE-9X4KQ2                  |
|                             |
| Instrucao                   |
| Use o codigo e o email      |
| cadastrado na escala.       |
|                             |
| [Compartilhar] [Copiar]     |
+-----------------------------+
```

## 9. Entrar em evento

```text
+-----------------------------+
| Entrar em evento            |
|                             |
| Codigo do evento            |
| [ TNE-9X4KQ2              ] |
|                             |
| Email convocado             |
| [ ana@email.com           ] |
|                             |
| [Entrar] [Ler QR Code]      |
+-----------------------------+
```

Estado de erro:

```text
Este email nao esta convocado para este evento.
Confira o email ou fale com o organizador.
```

## 10. Convocacao do convidado

```text
+-----------------------------+
| Culto de Domingo            |
| Vocal / Soprano             |
|                             |
| 07/06/2026                  |
| Chegada: 17:00              |
| Local: Templo principal     |
|                             |
| Observacoes                 |
| Chegar para passagem de som |
|                             |
| Equipe convocada            |
| Ana - Soprano - Voce        |
| Joao - Violao - Pendente    |
| Carla - Contralto - Aceitou |
|                             |
| [Aceito participar]         |
| [Nao poderei]               |
+-----------------------------+
```

## 11. Recusa com justificativa

```text
+-----------------------------+
| Nao poderei participar      |
|                             |
| Motivo *                    |
| [ Estou trabalhando neste ] |
| [ horario...              ] |
|                             |
| [Cancelar] [Enviar recusa]  |
+-----------------------------+
```

## 12. Notificacoes do admin

```text
+-----------------------------+
| Notificacoes                |
|                             |
| +-------------------------+ |
| | Ana aceitou             | |
| | Culto Domingo - Soprano | |
| | Agora                   | |
| +-------------------------+ |
| +-------------------------+ |
| | Joao recusou            | |
| | Motivo: trabalho        | |
| | 5 min atras             | |
| +-------------------------+ |
+-----------------------------+
```
