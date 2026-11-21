# Time Boss 0.2.1 — componente nativo do Hub

A CSP de `/play` impede scripts inline/eval no iframe srcdoc. A versão 0.2.0 aguardava cinco minutos sem iniciar o motor. Esta integração executa o simulador em um processo offline do próprio Hub; não modifica a CSP nem desativa a segurança do jogo.

Integração no código do Hub 0.4.2:

1. Copie `team-boss-simulator.js` e `team-boss-runner.js` para `src/main/`, e `game-boss.js` para `src/preload/`.
2. Nas preferências das WebContentsView das contas, adicione `preload: path.join(PASTA_PRELOAD, 'game-boss.js')`. Preserve `contextIsolation`, `sandbox` e `webSecurity` ativos e Node desativado.
3. Depois de criar o array `contas`, inicialize `const bossSimulator = require('./team-boss-simulator').createBossSimulator({views: () => contas, origin: origemJogo});` e faça `win.on('closed', () => bossSimulator.dispose());`.
4. Compile o aplicativo pelo fluxo normal, mantendo a validação de integridade do ASAR, e use `PokeMoon-Time-Boss.user.js` 0.2.1.

O processo não recebe token ou cookies, tem sessão temporária própria, bloqueia requisições externas e encerra ao cancelar ou recarregar a conta. O controle de falta de progresso substitui o prazo absoluto de cinco minutos. A aplicação do time continua manual no userscript.

Validação: 50 batalhas sob CSP restritiva em Chromium; cancelamento, troca de conta e confirmação manual com API simulada. No jogo, KimJongDudu concluiu as 50 simulações de Mewtwo sem timeout; nenhuma luta real ou aplicação de time foi realizada. Resultado local não garante vitória no servidor.
