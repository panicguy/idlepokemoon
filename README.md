# Idle Poke Moon — automações por KimJongDudu

AutoCatch, AutoRefill, Rota do Bestiário Hunts rápidas e Voltar à Hunt para o navegador e para o aplicativo modificado. AutoCatch e AutoRefill também executam no modo **Card**; a Rota usa a tela completa.

## Baixar o aplicativo pronto

Abra [Releases](https://github.com/panicguy/idlepokemoon/releases/latest), baixe **IdleMoon-Automacoes-0.4.0-mod1-Windows-x64.zip**, extraia a pasta inteira e execute **Idle Poke Moon.exe**. É uma versão portátil para Windows x64; não precisa instalar Node.js.

Feche outras instâncias do Idlemoon antes de abrir. Este é um mod não oficial baseado no Idle Poke Moon 0.4.0. Os arquivos e licenças da base acompanham o pacote.

Em **Ajustes → Automações**, os dois scripts vêm disponíveis e desligados em uma instalação nova. Selecione as contas e ative. Depois ligue e configure cada automação no seu próprio painel. Nas versões atuais dos scripts, os três painéis ficam no dock lateral: Moon Ball para AutoCatch, item de reabastecimento para AutoRefill e Magmar para o Bestiário. Apenas um painel fica aberto por vez; fechar o painel não desliga a automação.

O pacote não inclui contas, senhas, sessões, preferências nem logs do criador. Cada pessoa entra com sua própria conta. O aplicativo usa a pasta de dados local `IdlePokeMoon` em `%APPDATA%`, compartilhada com o aplicativo oficial. Dados existentes são preservados; se já tinha scripts antigos instalados, reinstale-os pelos links abaixo para receber as adaptações.

## Scripts

- [Instalar Rota Evolutiva 1.0.0](https://raw.githubusercontent.com/panicguy/idlepokemoon/main/PokeMoon-Rota-Evolutiva-KimJongDudu.user.js)
- [Instalar AutoCatch 1.5.3](https://raw.githubusercontent.com/panicguy/idlepokemoon/main/PokeMoon-AutoCatch-KimJongDudu.user.js)
- [Instalar AutoRefill 1.3.0](https://raw.githubusercontent.com/panicguy/idlepokemoon/main/PokeMoon-AutoRefill-KimJongDudu.user.js)

- [Instalar Rota do Bestiário 1.1.0](https://raw.githubusercontent.com/panicguy/idlepokemoon/main/PokeMoon-Rota-Bestiario-KimJongDudu.user.js)

No navegador, use um gerenciador de userscripts. No aplicativo modificado, cole o link em **Ajustes → Automações**. O suporte ao Card depende do aplicativo modificado: os scripts sozinhos não adicionam a ponte necessária ao aplicativo oficial.

### Atualização e revisão de integração

Os scripts instalados no Hub são cópias locais. O código em `desktop-mod` agora inclui **Atualizar do GitHub** para cada script: preserva ID, ativação e seleção de contas; as automações mantêm suas chaves de configuração. Um script ligado e alterado recarrega as contas selecionadas. Falhas de download ou validação mantêm a versão anterior.

Esse botão exige uma nova montagem do Hub; a release desktop **mod1** já publicada continua sem ele. Nela, reinstale o script pela mesma URL para receber as novas versões. A próxima montagem do código usa **mod2**, com os seis scripts disponíveis inicialmente desligados. Nenhum executável já publicado foi substituído por esta revisão.

O dock é incorporado em cada script, sem arquivo remoto obrigatório. Os três ícones usam Canvas com pixels locais. Os testes no Electron 44.6.0 cobrem as seis ordens de carregamento, ícones, fechamento, duplicação, configuração e limites da janela. Veja [o relatório de validação](desktop-mod/VALIDACAO.md).

### Identidade visual

Os três painéis usam o padrão do AutoCatch: fundo azul escuro, borda dourada discreta, cabeçalho compacto com ícone local, indicadores de estado, campos azuis e botões verdes/vermelhos. O AutoRefill mantém a largura necessária à tabela e um botão de ativação sempre acessível no rodapé. A Rota inclui minimizar e fechar, sem alterar as ações da automação. O tema também é incorporado nos scripts, sem dependência externa.

### Comportamento

- **AutoCatch:** usa o intervalo configurado, a opção de incluir shinies e a bola selecionada no jogo. No Card, envia a ação de lançamento sem depender de botões visuais. O contador indica lançamentos aceitos, não capturas garantidas.
- **AutoRefill:** lê o estoque atual, compra abaixo do mínimo até o alvo e respeita o limite de gastos. Pode vender loot antes de comprar. Mantém ligado/desligado após recarregar; erros de operação o desligam.
- **Rota do Bestiário:** usa as hunts liberadas para espécies faltantes; inicia e pausa no próprio painel. Continua dependendo da tela completa do jogo, sem suporte novo ao Card.
- **Card:** os dois usam a sessão e as atualizações de inventário da própria conta. As ações são enviadas em sequência, e o cartão exibe o estado das automações.

Configure itens, shinies, intervalos e valores na tela completa antes de mudar para Card. Automações usam itens e moeda do jogo conforme essas escolhas.

## Compilação reproduzível

O código em [`desktop-mod`](desktop-mod) aplica somente as alterações necessárias à base oficial 0.4.0, verificando os hashes do pacote e do executável antes de modificar. Não lê `%APPDATA%` e não exporta perfis de usuário.

Com Node.js instalado, use uma cópia limpa da pasta do aplicativo oficial 0.4.0:

```powershell
node desktop-mod/build-portable.cjs "C:\caminho\Idle Poke Moon" "C:\saida\IdleMoon-Automacoes"
```

A saída deve ser uma pasta nova. Para distribuir, compacte **toda** a pasta gerada; o executável depende dos demais arquivos. O ZIP desta release foi gerado localmente a partir da base verificada, sem ler dados de usuário, e acompanha um arquivo SHA-256 para conferência.

O GitHub Actions executa os testes a cada alteração. Há também uma montagem manual (`workflow_dispatch`) que baixa e verifica o instalador oficial antes de gerar a release; ela depende de o site oficial permitir o download pelos servidores do GitHub. A proteção do site pode bloquear essa etapa. Nesse caso, use a montagem local descrita acima.

Atualizações oficiais podem substituir as alterações. Esta versão é específica da base 0.4.0; uma exigência de versão nova pelo servidor requer uma nova base compatível.


### Hunts rápidas 1.1.0 — Nintendo Switch

[Instalar Hunts rápidas](https://raw.githubusercontent.com/panicguy/idlepokemoon/main/PokeMoon-Hunts-Rapidas-KimJongDudu.user.js). Requer a nova ponte de consulta do Hub deste código; a release mod1 e o navegador sem a ponte não oferecem o recomendador. A consulta usa o próprio serviço Hunts do Hub, com nível e espécie ou pokémon atual, Furiosa e TM opcionais. Só considera áreas identificadas sem ambiguidade e liberadas para a conta.

No dock, abra o Switch e use **Consultar melhor XP** ou **Ir para melhor XP**. A viagem usa a ação `selectZone` da Rota do Bestiário, respeitando confirmações do jogo. O retorno fica no script separado **Voltar à Hunt**. Nenhuma viagem é automática. Funciona na tela completa, sem suporte ao Card.

Ícone Nintendo Switch da [wiki PokeXGames](https://wiki.pokexgames.com/images/4/42/Nintendo_Switch.png), incorporado como pixels locais. Os testes isolados no Electron cobrem as 24 ordens dos quatro scripts e o fluxo de consulta, ida, retorno e recusa, com viagens simuladas.

### Voltar à Hunt 1.0.1 — script independente

[Instalar Voltar à Hunt](https://raw.githubusercontent.com/panicguy/idlepokemoon/main/PokeMoon-Voltar-Hunt-KimJongDudu.user.js). Ícone: [bicicleta da wiki PokeXGames](https://wiki.pokexgames.com/images/9/95/Bicycle4.png), incorporado sem download durante o jogo. **Voltar à hunt anterior** acompanha a última troca confirmada; **Salvar hunt atual** fixa uma referência para testar várias hunts e **Voltar à salva** retorna a ela. Usa a viagem da Rota do Bestiário e funciona sozinho, sem o recomendador nem o script de XP. Histórico por conta, persistente e compatível com o Hunts rápidas 1.0.0. Instale também Hunts rápidas 1.1.0 para remover os controles antigos do Switch. Tela completa; nenhuma viagem automática.

### Rota Evolutiva 1.0.0 — Mega Stone

[Instalar Rota Evolutiva](https://raw.githubusercontent.com/panicguy/idlepokemoon/main/PokeMoon-Rota-Evolutiva-KimJongDudu.user.js). Consulte a missão de um Pokémon do time pelo painel; para iniciar, coloque esse mesmo Pokémon como ativo em **Time → Caçar com este**. A rota escolhe hunts normais liberadas dos tipos pendentes, priorizando o menor nível e respeitando um teto configurável (padrão 50). Ao completar um tipo, troca de área. Sem progresso por dois minutos, tenta outra área; pausa após três falhas, desmaio, troca do Pokémon ativo, vida abaixo de 20% ou erro do servidor. Nível baixo é uma heurística, não uma garantia de sobrevivência nem uma previsão de abates/h.

**Evoluir quando estiver pronto** envia a evolução escolhida somente quando o roteiro indica abates, itens, pedras e nível completos. A ação pode consumir os recursos exigidos pelo jogo. Caminhos alternativos devem ser escolhidos na interface original; a rota não troca nem zera um caminho. Sem essa opção, aguarda a evolução manual ou o Auto Evoluir do jogo.

**Melhor XP após evoluir** só consulta o recomendador do próprio Hub depois de confirmar a mesma identidade do Pokémon na forma escolhida, usando a opção Meu pokémon. Viaja uma vez e encerra a rota. Não continua automaticamente outras evoluções. A ponte de Hunts do Hub atualizado é necessária para essa etapa.

O script inicia pausado em uma instalação nova. Uma rota iniciada mantém o plano por conta após recarregar, validando novamente o Pokémon e a missão. Fechar o painel não pausa; use **Pausar rota**. Rode uma rota de viagem por vez. Funciona na tela completa; sem suporte ao Card. O símbolo Mega Stone é apenas o ícone do painel: esta versão trata evolução comum com roteiro de abates, não o sistema separado de Mega Evolução.

### Hunt Furiosa no treino (Rota Evolutiva 1.1.0)

Nova opção junto de Evoluir e Melhor XP. Desmarcada por padrão e salva por conta. Marque antes de iniciar para treinar em Hunt Furiosa. Para voltar ao modo normal, pause, desmarque e retome: o script troca o modo mesmo estando na mesma área. A escolha confirma a entrada Furiosa somente nas viagens de treino; a etapa de melhor XP após evoluir continua em hunt normal. As pausas por vida baixa e desmaio permanecem.

### Rota Shiny 1.0.0 — time Rebosteio

[Instalar Rota Shiny](https://raw.githubusercontent.com/panicguy/idlepokemoon/main/PokeMoon-Rota-Shiny-Rebosteio.user.js). Ícone [Red Gyarados Amulet](https://wiki.pokexgames.com/images/4/48/Red_Gyarados_Amulet.png) incorporado localmente. Carregue hunts e time, busque pelo nome da espécie/área e adicione até 30 etapas. A lista usa rolagem interna. Cada etapa tem minutos (1–1440) e Pokémon do time: fixo ou Automático. Você pode reordenar e remover etapas enquanto pausada.

Automático prioriza a maior vantagem ofensiva dos tipos do Pokémon contra os dois tipos da hunt, usando resistência como desempate. Usa a tabela retornada pelo jogo quando disponível, com tabela padrão como alternativa. É uma heurística por tipos, não uma simulação de DPS: não avalia moveset, IV, boosts ou habilidades. Para um resultado específico, fixe o Pokémon na etapa. Não pega Pokémon da box.

A rota troca o ativo com `setActive`, confirma a troca e só então viaja com `selectZone`. Caça em modo normal e repete a fila em ciclo. Próxima hunt agora antecipa a troca. Configurações e etapa ficam salvas por conta; rota nova começa pausada. Pausar preserva combate e captura, fechar só esconde o painel. Falhas temporárias tentam novamente até três vezes; desmaio, vida abaixo de 20%, alteração manual da área/ativo ou recusa do servidor pausam. Use uma única rota de viagem por vez.

Não muda configurações do AutoCatch/Auto-Helper e não garante aparecimento de shinies. Configure a captura separadamente. Executa somente na tela completa, sem Card.

### Recuperação automática no Centro (Rota Shiny 1.1.0)

Se o Pokémon utilizado desmaiar, a rota usa goCity, identifica a Nurse no mapa e usa npcTalk para curar a equipe. Confirma a cura, recoloca o Pokémon original como ativo e retorna à mesma hunt. A etapa e o tempo restante são preservados; o tempo no Centro não é descontado. Também detecta o desmaio do Pokémon registrado caso o jogo já tenha ativado outro. Uma recuperação interrompida por recarregamento mantém sua fase salva. Se não encontrar a Nurse ou a cura não for confirmada, pausa com explicação.

Atualização compatível com a lista da versão 1.0.0: mantém a mesma chave de armazenamento por conta e guarda uma cópia local anterior em kjd-rota-shiny-v1:before-healing-v110:<conta>. Atualize pelo botão Atualizar do GitHub do Hub; não remova o script.
