# UX FLOW - ToNaEscala

## 1. Objetivo

Descrever as jornadas essenciais do MVP para que o app seja simples o bastante para um organizador montar uma escala em poucos minutos e para um participante entrar sem fricção.

## 2. Princípios de experiência

- Primeiro uso guiado por ação, não por explicação longa.
- Menos campos obrigatórios no MVP.
- Calendário e agenda como linguagem central.
- Entrada de participante com código/QR antes de qualquer cadastro.
- Estados vazios devem sempre oferecer uma próxima ação clara.

## 3. Jornada do organizador

### 3.1 Primeiro acesso

1. Abre o app.
2. Escolhe entrar com Google ou email/senha.
3. Cria a primeira organização.
4. Chega na aba `Agenda` ou `Eventos` com estado vazio.
5. Toca em `Criar evento`.

Critério de sucesso:

- Organizador consegue criar conta e primeira organização sem precisar entender estrutura técnica de equipes/escalas.

### 3.2 Criar evento

1. Informa nome do evento.
2. Escolhe categoria.
3. Define local.
4. Define data e horário.
5. Escolhe cor.
6. Salva.
7. Vê tela de detalhes do evento.

Campos mínimos:

- Nome.
- Data.
- Horário inicial.
- Horário final.

Campos opcionais:

- Descrição.
- Local.
- Categoria.
- Cor.

### 3.3 Criar equipe

1. Dentro do evento, acessa `Equipes`.
2. Toca em adicionar.
3. Informa nome da equipe.
4. Escolhe tipo, se necessário.
5. Salva.

Exemplos:

- Vocal.
- Instrumentos.
- Recepção.
- Mídia.
- Infantil.

### 3.4 Montar escala

1. Dentro do evento, acessa `Escala`.
2. Toca em adicionar pessoa/função.
3. Seleciona ou cria participante.
4. Escolhe equipe.
5. Define função.
6. Ajusta horário, se diferente do evento.
7. Salva.
8. Sistema verifica conflitos.
9. Se houver conflito, exibe alerta antes ou após salvar, conforme severidade.

### 3.5 Compartilhar convite

1. Na tela do evento, toca em compartilhar.
2. App mostra QR Code, código e link.
3. Organizador compartilha pelo WhatsApp ou copia código.

Informação visível:

- Código: `TNE-XXXXXX`.
- Nome do evento.
- Data/hora.
- Botão compartilhar.

### 3.6 Acompanhar confirmações

1. Abre evento.
2. Vê resumo: confirmados, pendentes, recusas, atrasos.
3. Filtra por equipe.
4. Toca em participante para ver resposta.
5. Pode reenviar lembrete.

### 3.7 Escalar pessoa confirmada

1. Abre evento.
2. Acessa `Presencas`.
3. Ve quem entrou pelo codigo e confirmou presenca.
4. Toca em `Escalar` no participante confirmado.
5. App abre a tela de escala com o participante ja selecionado.
6. Organizador define equipe, funcao, horario e observacoes.
7. Salva.
8. Participante passa a aparecer como `Na escala`.

Regra de produto:

- Confirmar presenca significa que a pessoa aceitou participar do evento.
- Estar na escala significa que o organizador atribuiu uma funcao/equipe para essa pessoa.
- O participante criado pelo codigo deve ser reaproveitado na escala; o app nao deve criar outro cadastro para a mesma pessoa nesse caminho.

## 4. Jornada do participante

### 4.1 Entrar por código

1. Abre app.
2. Escolhe `Entrar em evento`.
3. Digita código ou escaneia QR Code.
4. Confere dados básicos do evento.
5. Informa nome e telefone, se ainda não tiver perfil local.
6. Entra no evento.
7. Vê sua agenda.

Critério de sucesso:

- Participante não precisa criar senha nem entender organização.

### 4.2 Visualizar agenda

1. Abre app.
2. Vê próximos compromissos ordenados por data.
3. Cada item mostra evento, equipe, função, horário e status.
4. Toca para abrir detalhes.

### 4.3 Confirmar presença

1. Abre detalhe da escala.
2. Toca em `Confirmar`, `Não posso` ou `Vou atrasar`.
3. Opcionalmente informa mensagem.
4. App atualiza status e mostra confirmação visual.

### 4.4 Participar de múltiplos eventos

1. Participante entra em outro evento por código.
2. Agenda passa a agrupar todos os compromissos.
3. Se houver choque de horários, app mostra conflito.

## 5. Fluxo de conflito

### Detecção

O sistema compara escalas do mesmo participante:

- `start_time < outro.end_time`
- `end_time > outro.start_time`

### Exibição para organizador

Mensagem:

```text
Conflito de agenda detectado
Alexandre já está escalado em outro evento neste horário.
```

Ações:

- Ver conflito.
- Manter escala.
- Alterar horário.
- Trocar participante.

### Exibição para participante

Mensagem:

```text
Você tem dois compromissos no mesmo horário.
```

Ações:

- Ver detalhes.
- Avisar organizador, fase futura.

## 6. Estados vazios

### Sem organização

Ação principal:

- Criar organização.

### Sem eventos

Ação principal:

- Criar primeiro evento.

### Sem escalas

Ação principal:

- Adicionar participante à escala.

### Participante sem eventos

Ação principal:

- Entrar com código.

## 7. Navegação MVP

Bottom tabs:

- Agenda.
- Eventos.
- Notificações.
- Perfil.

Atalhos contextuais:

- Botão flutuante ou ação no header para criar evento.
- Ação de compartilhar dentro do detalhe do evento.
