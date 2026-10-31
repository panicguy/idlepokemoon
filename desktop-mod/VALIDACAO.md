# Revisão de integração — 30/10/2026

Versões: AutoCatch **1.5.2**, AutoRefill **1.2.2**, Rota do Bestiário **1.0.7**.

## Alterações

- Dock compartilhado e idempotente: um contêiner, uma folha de estilo, um botão por script, ordem consistente e no máximo um painel aberto. Fechar um painel sincroniza o destaque e `aria-expanded` sem alterar a ativação da automação.
- Fonte comum em `moon-dock.js`, incorporada em cada userscript por `node desktop-mod/embed-dock.cjs`. Não existe dependência externa em tempo de execução: qualquer script pode ser instalado sozinho.
- Os três ícones são pixels incorporados desenhados com `putImageData`. O Magmar mantém o sprite original, sem `Image`, Blob ou decodificação de PNG no cliente.
- Arraste com Pointer Events, cancelamento e captura do ponteiro; ajustes ao abrir/redimensionar mantêm o painel dentro da janela. Chaves existentes de posição do Refill e do Bestiário foram preservadas; o Catch ganhou uma chave separada para posição.
- Atualização individual no Hub por `Atualizar do GitHub`: valida o código e dependências antes de salvar, mantém ID, ativação e seleção de contas, e recarrega somente as contas afetadas quando há alteração em um script ligado. Sem mudança de código, não recarrega. Falhas preservam a versão instalada.
- A montagem do próximo desktop inclui os três scripts; apenas Catch e Refill declaram suporte ao Card. A navegação do Bestiário continua na tela completa.

## Validação

Executado no runtime oficial **Electron 44.6.0**, em um perfil de teste separado, com sandbox e isolamento de contexto ligados. A fixture bloqueia recursos externos e não contém dados de conta.

- Seis permutações da ordem de carregamento e repetição dos scripts: um dock, três botões, três painéis.
- Pixels não transparentes nos três Canvas; nenhuma solicitação de recurso externo.
- Painéis inicialmente ocultos; abertura exclusiva, fechamento e destaque sincronizados.
- Conteúdo mantido dentro da janela ao abrir posições antigas fora da tela e ao reduzir a janela para 420 × 340.
- Configurações de Catch e Refill iguais antes/depois das ações de interface; nenhuma ação ou consulta ao jogo.
- Testes de Card existentes passam: filtro de shinies, intervalo, bola selecionada, prevenção de sobreposição, cooldown do Refill, persistência e reutilização de sessão.
- Testes de atualização passam: identidade/contas preservadas e rollback em falha de rede, sintaxe ou permissões GM não suportadas.

Os testes não iniciam a Rota nem compram, vendem ou lançam bolas em contas reais. A lógica dessas ações não foi reescrita. Evidência visual é produzida localmente em `desktop-mod/ui-evidence/`.

## Executar

```powershell
node desktop-mod/test-automacoes.cjs
node desktop-mod/test-refill-card.cjs
node desktop-mod/test-autocatch-card.cjs
node desktop-mod/test-script-update.cjs
# Use o runtime oficial do Electron 44.6.0:
electron desktop-mod/test-ui-electron.cjs
```

O botão de atualização faz parte do código do próximo Hub: não é inserido em executáveis antigos apenas por atualizar os userscripts. Na versão desktop mod1 já distribuída, ainda é necessário reinstalar o script pela mesma URL para receber o código mais recente. Os scripts usam as mesmas chaves de configuração.

## Padronização visual dos painéis

Versões: AutoCatch **1.5.3**, AutoRefill **1.3.0**, Rota do Bestiário **1.1.0**.

Os três usam o tema do AutoCatch: mesmo fundo azul escuro, borda dourada, fonte, cabeçalho compacto, ícone Canvas, estado e botões verdes/vermelhos. O Refill mantém a tabela com largura legível e o controle de ativação em um rodapé fora da área de rolagem. O Bestiário passou a usar o mesmo cabeçalho, cartões e campos, e recebeu minimizar. Seus seletores de controle e ações foram preservados.

Os testes Electron cobrem igualdade das propriedades computadas de fundo, borda, raio e família de fonte nos três painéis, além dos testes anteriores de carregamento, configuração, ícones e limites. Os testes de Card continuam passando. A padronização não modifica os trechos de lançamento, compra/venda ou navegação das hunts.

## Hunts rápidas 1.0.0

Ponte limitada a consultas XP do recomendador original. Testes de filtro por nível/desbloqueio, correspondência ambígua, histórico persistente por conta, marcador fixo e validação da consulta passaram. Electron 44.6.0: 24 ordens dos quatro scripts, ícones locais e fluxo completo de consultar/ir/voltar/salvar/recusa com fetch simulado. Nenhuma viagem real foi usada nesses testes.

## Separação do retorno

Hunts rápidas 1.1.0 contém apenas melhor XP. Voltar à Hunt 1.0.0 é independente, com seta provisória e reaproveitamento da chave de histórico anterior. Dock com cinco scripts e 120 permutações de carregamento.

## Rota Evolutiva 1.0.0

Testes de requisitos, caminhos, hunts de menor nível, bloqueios e identidade da evolução. Fluxo Electron isolado: consulta sem ação, treino por dois tipos, espera por item, evolução simulada e viagem de XP somente após confirmar nova forma; pausa, desmaio e recusa do servidor. Ícone local Mega Stone, sem requisições de imagem.

Consulta real no Hub: Magmar → Magmortar, Planta 5000/5000, Inseto 4951/5000 e Gelo 5000/5000; prévia sugeriu Área de Burmy nível 1. Somente consulta: sem viagem, troca de Pokémon ou evolução real. Dock validado em 120 ordens com seis scripts.

## Rota Shiny 1.0.0

Teste de vantagem dupla e seleção fixa do time. Electron isolado: prévia sem ações, rotação por tempo, ciclo, troca de ativo antes da viagem, avanço manual, pausa, timeout com nova tentativa e recusa. Todos os pedidos de jogo simulados.

## Recuperação Shiny 1.1.0

Simulação de desmaio com troca automática do ativo pelo jogo: goCity → npcTalk → setActive → selectZone. Conferidos mesma fila, etapa e 48 segundos restantes após a recuperação, além de cópia de configuração anterior à atualização. Nenhuma cura real foi executada no teste.

## Rota de Quests 1.0.0

Validação de IDs de diária por tipo, mínimo da hunt, quests bloqueadas/desconhecidas e seleção de áreas liberadas. Electron: consulta sem ações, seleção, ativação do Pokémon, caça válida, resgate somente pronto e confirmado, XP do último Pokémon, conflito com outra rota e recusa de resgate. Todas as ações simuladas.

Consulta real somente leitura: diária Caça Elétrico reconhecida com 0/250 e hunt mínima 200. Painel instalado pausado, sem viajar, trocar Pokémon ou resgatar. Dock passou em 120 ordens com oito scripts.
