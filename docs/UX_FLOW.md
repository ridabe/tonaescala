# UX Flow - ToNaEscala

## 1. Objetivo

Descrever as jornadas essenciais do MVP para que o app seja simples o bastante para um organizador montar uma escala em poucos minutos e para um convidado responder sua convocacao sem friccao.

O fluxo oficial de convocacoes esta detalhado em `docs/FLUXO_CONVOCACOES.md`.

## 2. Principios de experiencia

- Primeiro uso guiado por acao, nao por explicacao longa.
- Menos campos obrigatorios no MVP.
- Calendario e agenda como linguagem central.
- Entrada de convidado com codigo/QR + email antes de qualquer cadastro completo.
- A escala nasce como convocacao criada pelo admin, nao como participante solto entrando pelo codigo.
- Estados vazios devem sempre oferecer uma proxima acao clara.
- Recusa de convocacao exige justificativa.

## 3. Jornada do organizador

### 3.1 Primeiro acesso

1. Abre o app.
2. Escolhe entrar com Google ou email/senha.
3. Cria a primeira organizacao.
4. Chega na aba `Agenda` ou `Eventos` com estado vazio.
5. Toca em `Criar evento`.

Criterio de sucesso:

- Organizador consegue criar conta e primeira organizacao sem precisar entender estrutura tecnica de equipes/escalas.

### 3.2 Criar evento

1. Informa nome do evento.
2. Escolhe categoria.
3. Define local.
4. Define data e horario.
5. Escolhe cor.
6. Salva.
7. Ve tela de detalhes do evento.

Campos minimos:

- Nome.
- Data.
- Horario inicial.
- Horario final.

Campos opcionais:

- Descricao.
- Local.
- Categoria.
- Cor.

### 3.3 Criar equipe

1. Dentro do evento, acessa `Equipes`.
2. Toca em adicionar.
3. Informa nome da equipe.
4. Escolhe tipo, se necessario.
5. Salva.

Exemplos:

- Vocal.
- Instrumentos.
- Recepcao.
- Midia.
- Infantil.

### 3.4 Montar escala convocada

1. Dentro do evento, acessa `Escala` ou `Convocados`.
2. Toca em adicionar convocado.
3. Informa nome.
4. Informa email obrigatorio.
5. Informa telefone, se necessario.
6. Escolhe equipe.
7. Define funcao.
8. Define horario de chegada e horario final, quando necessario.
9. Adiciona observacoes.
10. Salva a convocacao.
11. Sistema verifica conflitos.
12. Se houver conflito, exibe alerta antes ou apos salvar, conforme severidade.

### 3.5 Compartilhar convite

1. Na tela do evento, toca em compartilhar.
2. App mostra QR Code, codigo e link.
3. Organizador compartilha pelo WhatsApp ou copia codigo.
4. Convidado usa o codigo junto com o email cadastrado na convocacao.

Informacao visivel:

- Codigo: `TNE-XXXXXX`.
- Nome do evento.
- Data/hora.
- Botao compartilhar.

### 3.6 Acompanhar convocacoes

1. Abre evento.
2. Ve resumo: aceitos, recusados, visualizados sem resposta e nao visualizados.
3. Filtra por equipe ou status.
4. Toca em convocado para ver detalhes.
5. Ve justificativa quando houver recusa.
6. Recebe notificacao de aceite ou recusa.
7. Pode reenviar lembrete, fase futura.

Regra de produto:

- Convocacao e a unidade principal da escala.
- Aceitar convocacao significa aceitar atuar naquela equipe, funcao e horario.
- Recusar convocacao exige justificativa.
- Codigo do evento sem email valido nao libera acesso aos detalhes da escala.

## 4. Jornada do convidado

### 4.1 Entrar por codigo e email

1. Abre app.
2. Escolhe `Entrar em evento`.
3. Digita codigo ou escaneia QR Code.
4. Informa email.
5. Sistema procura convocacao daquele email no evento.
6. Se encontrar, marca como visualizada.
7. Convidado ve os dados da convocacao.
8. Se nao encontrar, app informa que o email nao esta convocado para aquele evento.

Criterios de sucesso:

- Convidado nao precisa criar senha nem entender organizacao.
- O email funciona como identificador unico para encontrar suas convocacoes.
- Ninguem acessa detalhes da escala apenas com o codigo.

### 4.2 Visualizar convocacao

1. Abre app.
2. Ve evento, equipe, funcao, horario e observacoes.
3. Ve outros convocados do evento ou equipe.
4. Nao consegue interagir por outros convocados.

### 4.3 Responder convocacao

1. Abre detalhe da convocacao.
2. Toca em `Aceito participar` ou `Nao poderei`.
3. Se aceitar, app registra aceite.
4. Se recusar, app exige justificativa.
5. App atualiza status e mostra confirmacao visual.
6. Admin recebe notificacao de aceite ou recusa.

### 4.4 Participar de multiplos eventos

1. Convidado entra em outro evento por codigo + email.
2. Agenda passa a agrupar convocacoes do mesmo email.
3. Se houver choque de horarios, app mostra conflito.

## 5. Fluxo de conflito

### Deteccao

O sistema compara escalas/convocacoes do mesmo email ou participante:

- `start_time < outro.end_time`
- `end_time > outro.start_time`

### Exibicao para organizador

Mensagem:

```text
Conflito de agenda detectado
Alexandre ja esta convocado em outro evento neste horario.
```

Acoes:

- Ver conflito.
- Manter convocacao.
- Alterar horario.
- Trocar convocado.

### Exibicao para convidado

Mensagem:

```text
Voce tem dois compromissos no mesmo horario.
```

Acoes:

- Ver detalhes.
- Avisar organizador, fase futura.

## 6. Estados vazios

### Sem organizacao

Acao principal:

- Criar organizacao.

### Sem eventos

Acao principal:

- Criar primeiro evento.

### Sem equipes

Acao principal:

- Criar equipe.

### Sem convocados

Acao principal:

- Adicionar convocado.

### Convidado sem convocacao encontrada

Mensagem:

```text
Este email nao esta convocado para este evento.
```

Acoes:

- Conferir email digitado.
- Voltar.
- Falar com o organizador.

## 7. Navegacao MVP

Bottom tabs:

- Agenda.
- Eventos.
- Notificacoes.
- Perfil.

Atalhos contextuais:

- Botao flutuante ou acao no header para criar evento.
- Acao de compartilhar dentro do detalhe do evento.
- Acao de adicionar convocado dentro do detalhe do evento.

## 8. Termos do produto

- `Evento`: encontro criado pelo admin.
- `Equipe`: grupo funcional dentro do evento ou organizacao.
- `Convocacao`: item da escala que liga evento, equipe, funcao, horario e email de um convidado.
- `Convidado`: pessoa chamada para atuar em uma convocacao.
- `Aceite`: resposta positiva do convidado.
- `Recusa`: resposta negativa do convidado, sempre com justificativa.
