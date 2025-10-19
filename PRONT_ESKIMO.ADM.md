
# 🧩 PRONT ADMIN — CONTEXTO PADRÃO DO PAINEL ADMINISTRATIVO

Documento de referência para acelerar qualquer mudança no **admin-panel** sem quebrar nada.

---

## 🔹 1) Projeto

- Repositório: `e-commerce/`
- Frontend admin: `admin-panel/`
- API: `.NET 8` (`CSharpAssistant.API/`)
- Banco: PostgreSQL (Render) ou Docker local
- Build local admin: `npm run dev` (Vite)
- URL API (env): `VITE_API_URL=https://backend-eskimo.onrender.com/api`

---

## 🔹 2) Estrutura de Pastas (admin)

admin-panel/
├── .env # VITE_API_URL=...
├── index.html
├── package.json
├── vite.config.js
├── src/
│ ├── main.jsx # Rotas e bootstrap
│ ├── Login.jsx # Login + sessão
│ ├── PrivateRoute.jsx # Proteção de rotas
│ ├── Dashboard.jsx # Início pós-login (botões por permissão)
│ ├── App.jsx # Cadastro de produto + estoque inicial (admin)
│ ├── ProductList.jsx # Lista, DnD, preço rápido, edição
│ ├── pages/
│ │ ├── CategoryManager.jsx # Categorias/subcategorias (admin)
│ │ ├── EstoquePorLoja.jsx # Estoques por loja + arquivar
│ │ └── UserManager.jsx # Usuários, papéis e permissões
│ ├── PaymentSettings.jsx # Pagamentos + WhatsApp (admin)
│ ├── SettingsManager.jsx # Config. de entrega
│ ├── Pedidos.jsx # Pedidos + relatórios
│ ├── HomePublic.jsx # Página pública (/efapi)
│ ├── services/
│ │ └── api.js # Axios base (interceptores JWT)
│ └── index.css

---

## 🔹 3) Sessão e Autenticação (chaves canônicas)

**LocalStorage**:
- `token`: JWT.
- `role`: `"admin"` ou `"operator"` (sempre em minúsculo).
- `permissions`: **string JSON** com o modelo de permissões (ver seção 5).
- `username`: nome a exibir. Origem:
  1) `res.data.username` do `/auth/login`;
  2) fallback via **decodificação JWT** (claims `name`, `username`, `unique_name` ou `email`);
  3) se vazio, usar `"Usuário"`.

**Regra de redirecionamento:**
- Se `role === "admin"` → `/cadastro`.
- Senão → `/inicio` (Dashboard).

**Boas práticas:**
- Sempre **limpar** todas as chaves no logout.
- No login, **normalizar** `role` para minúsculo. Ex: `"Admin"` → `"admin"`.
- Armazenar `permissions` como string. Ao usar, `JSON.parse`.

---

## 🔹 4) Rotas e Gates

- `/` → `Login.jsx`
- `/inicio` → `Dashboard.jsx`
- `/cadastro` → `App.jsx` (admin)
- `/produtos` → `ProductList.jsx` (admin **ou** `can_manage_products`)
- `/categorias` → `CategoryManager.jsx` (admin)
- `/configuracoes` → `SettingsManager.jsx` (admin)
- `/pagamentos` → `PaymentSettings.jsx` (admin)
- `/estoque` → `EstoquePorLoja.jsx` (admin **ou** `stores.<slug>.edit_stock`)
- `/pedidos` → `Pedidos.jsx` (admin **ou** `stores.<slug>.orders`)
- `/users` → `UserManager.jsx` (admin)
- `/efapi` → `HomePublic.jsx` (pública)

**Proteção global:** `PrivateRoute.jsx` bloqueia se não houver `token` **ou** se usuário estiver `isEnabled=false` retornado pelo backend.

---

## 🔹 5) Modelo de Permissões (frontend)

```json
{
  "can_manage_products": true,
  "can_delete_products": false,
  "stores": {
    "efapi":    { "orders": true,  "edit_stock": true  },
    "palmital": { "orders": false, "edit_stock": false },
    "passo":    { "orders": true,  "edit_stock": true  }
  }
}
Slugs oficiais: efapi, palmital, passo.
Gates finos por componente:
Produtos: isAdmin || can_manage_products
Estoque: isAdmin || stores.any(edit_stock)
Pedidos: isAdmin || stores.any(orders)
Renderização humana das permissões:
Em UserManager.jsx, mostrar:
“Gerencia produtos” se can_manage_products.
Por loja: “Pedidos”/“Estoque” conforme booleans.
🔹 6) Endpoints mais usados (contratos estáveis)
Auth:
POST /auth/login → { token, role, permissions, isEnabled, username }
GET /auth/me → { email, username, role, permissions, isEnabled }
Users (admin):
GET /user → lista de usuários (array ou { items: [] })
POST /user → { username, email, password, role, isEnabled, permissionsJson }
PUT /user/{id} → { username?, email?, newPassword?, role?, isEnabled?, permissionsJson? }
DELETE /user/{id}
Products:
GET /products/list?page=&pageSize=&includeArchived= → { items: [] } ou []
POST /products
PUT /products/{id}
PATCH /products/{id}/archive { isArchived: true|false }
Categories/Subcategories (admin):
GET/POST/PUT/DELETE /categories
GET/POST/PUT/DELETE /subcategories
Stock:
GET /stock → array de { productId, efapi, palmital, passo } (camelCase)
POST /stock/{productId} → body { efapi, palmital, passo } (numbers)
Orders:
GET /orders
PATCH /orders/{id}/confirm
PATCH /orders/{id}/deliver
PATCH /orders/{id}/cancel
DELETE /orders/{id}
DELETE /orders/clear
Reports:
GET /reports/{loja}?from=YYYY-MM-DD&to=YYYY-MM-DD → application/pdf (blob)
🔹 7) Exibir nome do usuário logado em qualquer página
Fonte: localStorage.username.
Fallback: decodificar JWT e extrair claims name|username|unique_name|email.
Cache: após descobrir, salvar em localStorage.username para uso imediato.
Snippet utilitário:
function decodeJwt(token) {
  try {
    const b = token.split(".")[1] || "";
    const s = atob(b.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(s.split("").map(c => "%" + ("00"+c.charCodeAt(0).toString(16)).slice(-2)).join("")));
  } catch { return {}; }
}
export function getDisplayName() {
  const cached = localStorage.getItem("username");
  if (cached?.trim()) return cached.trim();
  const payload = decodeJwt(localStorage.getItem("token")||"");
  const name = payload.name || payload.username || payload.unique_name || payload.email || "Usuário";
  localStorage.setItem("username", name);
  return name;
}
Uso:
const displayName = useMemo(() => getDisplayName(), []);
<p>Bem-vindo, <strong>{displayName}</strong></p>
🔹 8) Convenções que evitam 90% dos erros
camelCase no JSON do backend. Program.cs deve ter:
PropertyNamingPolicy = JsonNamingPolicy.CamelCase
DictionaryKeyPolicy = JsonNamingPolicy.CamelCase
permissions é string JSON no localStorage. Sempre JSON.parse em leitura.
role minúsculo sempre. Padronize logo após login.
Admin raiz admin@eskimo.com não pode ser removido/desativado.
Gates apenas leem role + permissions. Não duplique lógica de permissão em muitos lugares.
Salvar estoque espera números. Converta input para Number antes de enviar.
Lista de usuários: aceite {}, { items: [] } ou []. Sempre normalize a resposta.
CORS: mantenha os domínios do admin e do site no Program.cs.
Interceptores Axios: anexe Authorization: Bearer <token> em todas as rotas protegidas.
🔹 9) Diagnóstico rápido (front)
Checar sessão:
localStorage.token existe?
localStorage.role minúsculo?
localStorage.permissions é string JSON válida?
localStorage.username presente?
Checar APIs:
Abra DevTools > Network e confira:
/auth/login retorna { token, role, permissions, username }.
/auth/me responde 200 logado.
/user retorna lista (se admin).
/stock retorna com chaves efapi/palmital/passo em camelCase.
Logs úteis no front:
Em UserManager.jsx → logar res.status e res.data do GET /user.
Em EstoquePorLoja.jsx → logar err.response.status e body ao salvar.
🔹 10) Fluxo seguro de mudança
Planeje: quais arquivos serão tocados? Liste-os antes (ex.: UserManager.jsx, ProductsController.cs).
Ambiente: confirme .env do admin: VITE_API_URL.
API OK: rode backend (local ou Render) e teste /swagger.
Patch pequeno: modifique o mínimo por vez.
Teste local: npm run dev. Verifique os gates e rotas afetadas.
Commit: mensagem clara (feat:, fix:, refactor:).
Deploy: primeiro backend → depois admin. Evita “coluna inexistente”.
Verificação: teste /inicio, /produtos, /users, /estoque, /pedidos.
🔹 11) Receitas rápidas
A) Exibir nome e e-mail no topo de qualquer tela
const name = getDisplayName();
const email = JSON.parse(atob(localStorage.getItem("token").split(".")[1] || "")||"{}").email || "";
<div>Logado: <strong>{name}</strong> <span className="text-gray-500">({email})</span></div>
B) Novo papel “auditor” só leitura de pedidos
Modelo:
{
  "can_manage_products": false,
  "stores": {
    "efapi": { "orders": true, "edit_stock": false },
    "palmital": { "orders": true, "edit_stock": false },
    "passo": { "orders": true, "edit_stock": false }
  }
}
Gate: mesma checagem dos pedidos. Não precisa tocar rotas.
C) Adicionar loja nova (ex.: “centro”)
Back: /stock deve incluir centro.
Front:
EstoquePorLoja.jsx: const lojas = ["efapi","palmital","passo","centro"];
App.jsx (cadastro): incluir centro em estoques inicial e no form.
Permissões: stores.centro = { orders: bool, edit_stock: bool }.
🔹 12) Interoperabilidade com a Loja
Loja consome o mesmo backend.
Layout de vitrine (se existir): PUT /storefront/layout com mapa { id: { sortRank, pinnedTop } }.
Arquivamento via admin afeta a Loja imediatamente (isArchived).
🔹 13) Padrões visuais e UX
Tailwind utilitário direto no JSX. Sem CSS extra quando possível.
Botões críticos com cor consistente:
Primário: verde #059669
Perigo: vermelho #dc2626
Secundário/outline: borda #065f46
Tabelas com:
Cabeçalho claro (background levemente colorido).
white-space: pre-wrap para JSON de permissões.
🔹 14) Checklists antes de aprovar mudança
Sessão
Login OK, logout limpa tudo.
username exibido no Dashboard e nas telas principais.
Permissões
Admin enxerga tudo.
Operador enxerga só o permitido.
Usuários listados em /users. ID aparece na tabela e no formulário de edição.
Produtos
Cadastro funciona e salva estoque inicial.
Lista permite editar preço rápido e salvar.
Estoque
/stock carrega quantidades para cada loja.
Salvar um item e “Salvar todos” funcionam sem erro.
Pedidos
Atualizações de status (confirmar/cancelar/entregar) OK.
Relatórios por data e por loja geram PDF.
🔹 15) Erros comuns e correções
Sintoma	Causa	Correção
Tela branca ao abrir /users	JSON inválido em permissionsJson	Validar JSON antes de salvar. Usar presets prontos.
“Nenhum usuário encontrado”	API retorna { items: [] } e front espera []	Normalizar resposta: `Array.isArray(d) ? d : d.items
Estoque vazio	Backend enviando PascalCase	Forçar camelCase no Program.cs.
Salvar estoque falha	Body não numérico	Converter input para Number antes de POST.
Operador acessa rota admin	Gate só no router	Adicionar gate dentro do componente também.
Admin raiz desativado	Falta proteção	Bloquear no front e no backend.
🔹 16) Padrão de patches linha-a-linha
Sempre indique arquivo alvo, linha(s) e substituição exata.
Preferir patches pequenos e atômicos.
Ex.: “src/pages/EstoquePorLoja.jsx: em const lojas = [...], adicione "centro".”
🔹 17) Segurança e consistência
Nunca exibir tokens no console em produção.
JWT expira → tratar 401 no interceptor e redirecionar ao login.
Não permitir editar/remover o admin raiz (admin@eskimo.com).
Sempre validar JSON antes de enviar permissionsJson.
🔹 18) Referência rápida de variáveis
Nome do usuário exibido: localStorage.username (ou getDisplayName()).
Papel corrente: localStorage.role.
Permissões: JSON.parse(localStorage.permissions || "{}").
Cabeçalho de auth: Authorization: Bearer ${localStorage.token}.
🔹 19) Sequência padrão para “adicionar algo e já exibir o que o usuário pode”
Criar usuário em /users com um dos presets (ou JSON manual).
Ver no Dashboard apenas os blocos permitidos.
Abrir /users e conferir a coluna “O que pode fazer”:
Mostra texto humano com o resumo das permissões.
Confirmar /auth/me no Network:
username e role coerentes.
Re-login se trocar permissões do próprio usuário.
🔹 20) Conclusão
Use este PRONT para:
Padronizar sessão e permissões.
Diagnosticar em minutos.
Especificar patches exatos.
Evitar regressões entre admin ↔ backend ↔ loja.
Se uma nova mudança exigir back, primeiro ajuste o backend (camelCase, contratos), depois o admin, sempre seguindo este guia.
