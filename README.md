# Idle Poke Moon — automações por KimJongDudu

AutoCatch e AutoRefill para o navegador e para o aplicativo modificado, incluindo execução no modo **Card**.

## Baixar o aplicativo pronto

Abra [Releases](https://github.com/panicguy/idlepokemoon/releases/latest), baixe **IdleMoon-Automacoes-0.4.0-mod1-Windows-x64.zip**, extraia a pasta inteira e execute **Idle Poke Moon.exe**. É uma versão portátil para Windows x64; não precisa instalar Node.js.

Feche outras instâncias do Idlemoon antes de abrir. Este é um mod não oficial baseado no Idle Poke Moon 0.4.0. Os arquivos e licenças da base acompanham o pacote.

Em **Ajustes → Automações**, os dois scripts vêm disponíveis e desligados em uma instalação nova. Selecione as contas e ative. Depois ligue e configure cada automação no seu próprio painel. O AutoCatch fica em **Mochila → AutoCatch**; o AutoRefill tem um painel no jogo.

O pacote não inclui contas, senhas, sessões, preferências nem logs do criador. Cada pessoa entra com sua própria conta. O aplicativo usa a pasta de dados local `IdlePokeMoon` em `%APPDATA%`, compartilhada com o aplicativo oficial. Dados existentes são preservados; se já tinha scripts antigos instalados, reinstale-os pelos links abaixo para receber as adaptações.

## Scripts

- [Instalar AutoCatch 1.4.0](https://raw.githubusercontent.com/panicguy/idlepokemoon/main/PokeMoon-AutoCatch-KimJongDudu.user.js)
- [Instalar AutoRefill 1.1.0](https://raw.githubusercontent.com/panicguy/idlepokemoon/main/PokeMoon-AutoRefill-KimJongDudu.user.js)

No navegador, use um gerenciador de userscripts. No aplicativo modificado, cole o link em **Ajustes → Automações**. O suporte ao Card depende do aplicativo modificado: os scripts sozinhos não adicionam a ponte necessária ao aplicativo oficial.

### Comportamento

- **AutoCatch:** usa o intervalo configurado, a opção de incluir shinies e a bola selecionada no jogo. No Card, envia a ação de lançamento sem depender de botões visuais. O contador indica lançamentos aceitos, não capturas garantidas.
- **AutoRefill:** lê o estoque atual, compra abaixo do mínimo até o alvo e respeita o limite de gastos. Pode vender loot antes de comprar. Mantém ligado/desligado após recarregar; erros de operação o desligam.
- **Card:** os dois usam a sessão e as atualizações de inventário da própria conta. As ações são enviadas em sequência, e o cartão exibe o estado das automações.

Configure itens, shinies, intervalos e valores na tela completa antes de mudar para Card. Automações usam itens e moeda do jogo conforme essas escolhas.

## Compilação reproduzível

O código em [`desktop-mod`](desktop-mod) aplica somente as alterações necessárias à base oficial 0.4.0, verificando os hashes do pacote e do executável antes de modificar. Não lê `%APPDATA%` e não exporta perfis de usuário.

Com Node.js instalado, use uma cópia limpa da pasta do aplicativo oficial 0.4.0:

```powershell
node desktop-mod/build-portable.cjs "C:\caminho\Idle Poke Moon" "C:\saida\IdleMoon-Automacoes"
```

A saída deve ser uma pasta nova. Para distribuir, compacte **toda** a pasta gerada; o executável depende dos demais arquivos. A rotina do GitHub Actions baixa o instalador oficial, verifica seu SHA-512, extrai a base e publica o ZIP com um arquivo SHA-256 para conferência.

Atualizações oficiais podem substituir as alterações. Esta versão é específica da base 0.4.0; uma exigência de versão nova pelo servidor requer uma nova base compatível.
