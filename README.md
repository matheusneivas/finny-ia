# Finny — app

App do Finny, assistente financeiro com IA. Expo SDK 58 + Expo Router + TypeScript. Roda em iOS, Android e web com o mesmo código.

## Rodar

```bash
npm install
cp .env.example .env          # ajuste EXPO_PUBLIC_API_URL
npx expo start                # abra no Expo Go (QR code) ou aperte w para a web
```

Sem backend? Use `EXPO_PUBLIC_API_MOCK=true` no `.env`: o app sobe com uma API de demonstração em memória (só em desenvolvimento; não entra no build de produção). Escreva “gastei 45 no almoço” ou “quero juntar 5000 para uma viagem” no chat para ver o cartão de confirmação.

Por padrão o app usa a API no ar em `https://fini-api-rosi.onrender.com` (plano grátis do Render: dorme sem uso e leva cerca de 1 minuto para acordar; o app mostra “Acordando o servidor…”). Para usar uma API local: `SPRING_PROFILES_ACTIVE=dev ./gradlew bootRun` e aponte `EXPO_PUBLIC_API_URL` para o IP do computador na rede (ex.: `http://192.168.0.10:8080`).

Antes de subir código: `npx tsc --noEmit && npx expo lint`.

## Estrutura

```
src/app/          rotas (Expo Router). Só rotas aqui.
  (auth)/         boas-vindas, entrar, criar-conta
  onboarding.tsx  5 passos curtos
  (tabs)/         Finny (chat), Planilha, Metas, Perfil
  transacao, meta, aporte   formulários em folha (formSheet)
src/screens/      corpo de cada tela
src/components/   design system: Text, Button, Card, TextField, MoneyField, Icon...
src/theme/        tokens: cores claro/escuro, espaçamento, tipografia, raios, sombras
src/lib/api/      cliente HTTP, endpoints, tipos (espelham a API), mock
src/lib/auth/     sessão e armazenamento seguro de tokens
src/hooks/        React Query (dados do servidor)
src/utils/        dinheiro (centavos), datas, validação (zod)
```

Regra do design system: telas não usam cor hex, `fontSize` ou espaçamento solto. Tudo vem de `@/theme` ou de um componente.

## Segurança

- **Nenhuma chave de IA no app.** A IA roda na API; o app só conversa com a API.
- **Tokens** no Keychain/Keystore (`expo-secure-store`, `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, fora do backup). Na web: access token só em memória e refresh token em `sessionStorage`.
- **Refresh rotativo** de uso único, com um único refresh em voo por vez (evita revogar a sessão por reuso).
- **Logout** revoga o refresh token no servidor e limpa todo o cache local.
- **HTTPS obrigatório** em produção (o app recusa iniciar com URL `http://`).
- **A IA só propõe.** Toda ação (lançamento, meta, aporte, edição, exclusão) aparece num cartão e só é salva quando a pessoa confirma. Respostas da IA são exibidas como texto puro.
- **Bloqueio com Face ID/digital** opcional e tela coberta quando o app vai para segundo plano (o seletor de apps não mostra saldo).
- **Modo discreto** esconde valores.
- **Sem logs**: `console.*` é proibido pelo lint; erros de rede não expõem URL nem corpo; erros 5xx não repassam mensagem do servidor.
- Android com `allowBackup: false`. Dados mínimos no onboarding (sem CPF).

## Próximos passos

1. Foto do cupom (OCR) com `expo-image-picker` → endpoint de OCR da API.
2. Mensagem por voz no chat.
3. Notificações push (`expo-notifications` + `POST /notifications/token`).
4. Editar perfil e metas; exportar planilha.
5. Builds de teste com EAS (`eas build --profile preview`) e publicação nas lojas.
