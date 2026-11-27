# Publicar o site do Finny (grátis, na Vercel)

O site usa o mesmo código do app (Expo para web). No computador ele mostra um menu lateral;
no celular, a barra de abas no rodapé. Login, chat, planilha, metas e perfil funcionam igual ao app.
O que é só do celular (Face ID, widget, atalhos da Siri) fica escondido no site.

## 1. Criar o site na Vercel (uma vez só, uns 5 minutos)

1. Entre em https://vercel.com e clique em **Sign Up** → **Continue with GitHub** (plano **Hobby**, grátis).
2. Clique em **Add New… → Project** e escolha o repositório **finny-ia** (botão **Import**).
3. Não precisa mudar nada: o arquivo `vercel.json` já diz como montar o site.
   Clique em **Deploy** e espere uns 2 minutos.
4. No fim aparece o endereço do site, algo como `https://finny-ia.vercel.app`. Copie esse endereço.

Daqui para frente, todo código novo na branch `main` atualiza o site sozinho.

## 2. Liberar o site na API (Render)

O navegador só deixa o site conversar com a API se a API autorizar o endereço do site (CORS).

1. Abra https://dashboard.render.com → serviço **fini-api** → **Environment**.
2. Na variável `CORS_ALLOWED_ORIGINS`, coloque o endereço do site **sem barra no final**, por exemplo:
   `https://finny-ia.vercel.app`
   (para mais de um endereço, separe por vírgula).
3. Clique em **Save, rebuild, and deploy** e espere a API voltar.

Sem esse passo, o site abre mas o login falha com “sem conexão”.

## 3. Testar

Abra o endereço do site, crie uma conta ou entre. Na primeira vez do dia a API pode levar
cerca de 1 minuto para acordar (plano grátis do Render); o site mostra “Acordando o servidor…”.

## Bom saber

- **Sessão**: no site, o login fica guardado só na aba. Recarregar a página mantém o login;
  fechar a aba (ou abrir outra) pede para entrar de novo. É de propósito, para proteger dados financeiros.
- **Domínio próprio** (ex.: finny.com.br): dá para ligar depois em Vercel → Settings → Domains.
  Lembre de pôr o novo endereço também em `CORS_ALLOWED_ORIGINS`.
- **Testar o site no seu computador**: `npx expo start --web` (abre em http://localhost:8081).
- **Gerar os arquivos do site à mão**: `npx expo export -p web` (sai na pasta `dist`).
