# Idle Poke Moon — automações por KimJongDudu

AutoCatch, AutoRefill e Rota do Bestiário para o navegador e para o aplicativo modificado. AutoCatch e AutoRefill também executam no modo **Card**; a Rota usa a tela completa.

## Baixar o aplicativo pronto

Abra [Releases](https://github.com/panicguy/idlepokemoon/releases/latest), baixe **IdleMoon-Automacoes-0.4.0-mod1-Windows-x64.zip**, extraia a pasta inteira e execute **Idle Poke Moon.exe**. É uma versão portátil para Windows x64; não precisa instalar Node.js.

Feche outras instâncias do Idlemoon antes de abrir. Este é um mod não oficial baseado no Idle Poke Moon 0.4.0. Os arquivos e licenças da base acompanham o pacote.

Em **Ajustes → Automações**, os dois scripts vêm disponíveis e desligados em uma instalação nova. Selecione as contas e ative. Depois ligue e configure cada automação no seu próprio painel. Nas versões atuais dos scripts, os três painéis ficam no dock lateral: Moon Ball para AutoCatch, item de reabastecimento para AutoRefill e Magmar para o Bestiário. Apenas um painel fica aberto por vez; fechar o painel não desliga a automação.

O pacote não inclui contas, senhas, sessões, preferências nem logs do criador. Cada pessoa entra com sua própria conta. O aplicativo usa a pasta de dados local `IdlePokeMoon` em `%APPDATA%`, compartilhada com o aplicativo oficial. Dados existentes são preservados; se já tinha scripts antigos instalados, reinstale-os pelos links abaixo para receber as adaptações.

## Scripts

- [Instalar AutoCatch 1.5.2](https://raw.githubusercontent.com/panicguy/idlepokemoon/main/PokeMoon-AutoCatch-KimJongDudu.user.js)
- [Instalar AutoRefill 1.2.2](https://raw.githubusercontent.com/panicguy/idlepokemoon/main/PokeMoon-AutoRefill-KimJongDudu.user.js)

- [Instalar Rota do Bestiário 1.0.7](https://raw.githubusercontent.com/panicguy/idlepokemoon/main/PokeMoon-Rota-Bestiario-KimJongDudu.user.js)

No navegador, use um gerenciador de userscripts. No aplicativo modificado, cole o link em **Ajustes → Automações**. O suporte ao Card depende do aplicativo modificado: os scripts sozinhos não adicionam a ponte necessária ao aplicativo oficial.

### Atualização e revisão de integração

Os scripts instalados no Hub são cópias locais. O código em `desktop-mod` agora inclui **Atualizar do GitHub** para cada script: preserva ID, ativação e seleção de contas; as automações mantêm suas chaves de configuração. Um script ligado e alterado recarrega as contas selecionadas. Falhas de download ou validação mantêm a versão anterior.

Esse botão exige uma nova montagem do Hub; a release desktop **mod1** já publicada continua sem ele. Nela, reinstale o script pela mesma URL para receber as novas versões. A próxima montagem do código usa **mod2**, com os três scripts disponíveis inicialmente desligados. Nenhum executável já publicado foi substituído por esta revisão.

O dock é incorporado em cada script, sem arquivo remoto obrigatório. Os três ícones usam Canvas com pixels locais. Os testes no Electron 44.6.0 cobrem as seis ordens de carregamento, ícones, fechamento, duplicação, configuração e limites da janela. Veja [o relatório de validação](desktop-mod/VALIDACAO.md).

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

