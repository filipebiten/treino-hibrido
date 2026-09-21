#!/usr/bin/env bash
# E2E do Treino Híbrido (agent-browser, sem dependência no projeto). Rode com bash (não zsh).
#   npm run build && npx vite preview --port 4173 &   →   bash scripts/e2e.sh
#   BASE=https://filipebiten.github.io/treino-hibrido/ bash scripts/e2e.sh   (produção)
# Estado sempre zerado (sessão nova). Sai com código 1 se algum check falhar.
BASE="${BASE:-http://localhost:4173/treino-hibrido/}"
A="agent-browser --session th-e2e"
FAIL=0
ok()  { echo "  ok   $*"; }
bad() { echo "  FALHA $*"; FAIL=1; }
chk() { if [ "$2" = "true" ]; then ok "$1"; else bad "$1 (obtido: $2)"; fi; }
ev()  { $A eval "$1" | tr -d '"'; }
# clica no 1º botão visível cujo texto começa com $1
clk() { $A eval "(()=>{const t=$(python3 -c 'import json,sys;print(json.dumps(sys.argv[1]))' "$1");const e=[...document.querySelectorAll('button')].find(b=>b.offsetParent!==null&&(b.innerText||'').trim().replace(/\s+/g,' ').startsWith(t));if(!e)return 'NAO ACHOU '+t;e.click();return 'ok'})()" >/dev/null; sleep 0.6; }
axe() { local n; n=$($A a11y 2>&1 | sed -n 's/.*violations: \([0-9]*\).*/\1/p' | head -1); chk "axe sem violações em $1" "$([ "$n" = "0" ] && echo true || echo "$n violações")"; }

agent-browser close --all >/dev/null 2>&1
$A open "$BASE" >/dev/null; $A set viewport 390 844 >/dev/null; sleep 2

echo "== 1. onboarding"
axe "onboarding"
clk "3"; clk "Continuar"; clk "1-2 semanas"; clk "Continuar"
$A fill 'input[type=number]' 89 >/dev/null; clk "Começar"; sleep 1
chk "chega na Home (macrofase Base)" "$(ev "document.body.innerText.includes('Base') && document.body.innerText.includes('Próximo treino'.toUpperCase()) || document.body.innerText.includes('PRÓXIMO TREINO')")"

echo "== 2. Home"
clk "4"
axe "Home"
chk "botão de reabilitação legível (texto não é preto)" "$(ev "getComputedStyle([...document.querySelectorAll('button')].find(b=>b.innerText.includes('Rotina'))).color!=='rgb(0, 0, 0)'")"
chk "há <main> e exatamente 1 <h1>" "$(ev "!!document.querySelector('main') && document.querySelectorAll('h1').length===1")"
chk "zoom liberado (sem user-scalable=no)" "$(ev "!/user-scalable=no|maximum-scale/.test(document.querySelector('meta[name=viewport]').content)")"
chk "data no formato dd/mm" "$(ev "/Semana 1\/4 · \d\d\/\d\d/.test(document.body.innerText)")"

echo "== 3. treino + retomada após reload"
clk "INICIAR TREINO"; sleep 0.8
for i in 1 2 3 4 5; do clk "Pular passo"; done
chk "chegou na 1ª série de musculação" "$(ev "document.body.innerText.includes('Série 1/3')")"
chk "botão principal na zona do polegar (abaixo de 60% da tela)" "$(ev "[...document.querySelectorAll('button')].find(b=>b.innerText.includes('Série 1 concluída')).getBoundingClientRect().top > innerHeight*0.6")"
axe "tela de série"
clk "Série 1 concluída"; sleep 0.5; clk "Pular descanso"; sleep 0.5
chk "está na série 2/3" "$(ev "document.body.innerText.includes('Série 2/3')")"
$A reload >/dev/null; sleep 1.8
chk "Home mostra 'Treino em andamento' (passo 6/19)" "$(ev "document.body.innerText.includes('Treino em andamento') && document.body.innerText.includes('passo 6/19')")"
clk "Retomar"; sleep 0.8
chk "retomou em Supino, série 2/3" "$(ev "document.body.innerText.includes('Supino reto halteres') && document.body.innerText.includes('Série 2/3')")"
clk "Sair"; sleep 0.6
chk "Sair mantém o treino retomável" "$(ev "document.body.innerText.includes('Treino em andamento')")"
clk "Descartar"; sleep 0.5
chk "Descartar limpa a retomada" "$(ev "localStorage.getItem('th1-resume')===null && !document.body.innerText.includes('Treino em andamento')")"

echo "== 4. outras telas"
clk "Musculação B"; sleep 0.6; axe "preview"; clk "Voltar"; sleep 0.5
clk "Histórico"; sleep 0.6; axe "histórico"; clk "Voltar"; sleep 0.5

echo "== 5. PWA / rede"
chk "sem 404 nas requisições" "$($A network requests 2>&1 | grep -qE ' 404$' && echo 404 || echo true)"
chk "service worker controlando" "$(ev "!!navigator.serviceWorker.controller")"
$A set offline on >/dev/null; $A reload >/dev/null 2>&1; sleep 2
chk "abre offline" "$(ev "document.body.innerText.includes('Base')")"
$A set offline off >/dev/null

agent-browser close --all >/dev/null 2>&1
[ $FAIL = 0 ] && echo "TUDO OK" || { echo "HÁ FALHAS"; exit 1; }
