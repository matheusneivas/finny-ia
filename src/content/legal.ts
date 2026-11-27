/**
 * Textos da Política de Privacidade e dos Termos de Uso.
 * Ao mudar algo importante, troque LEGAL_VERSION (a API guarda a versão aceita no cadastro).
 */
export const LEGAL_VERSION = '2026-11-27';
export const LEGAL_UPDATED_AT = '27 de novembro de 2026';

/** Quem responde pelos dados (controlador) e canal do encarregado (DPO). */
export const LEGAL_CONTACT = {
  controller: 'Matheus, criador e responsável pelo Finny',
  email: 'finnyia2025@gmail.com',
};

export interface LegalSection {
  title: string;
  paragraphs: string[];
}

export const privacyPolicy: LegalSection[] = [
  {
    title: 'Quem somos',
    paragraphs: [
      `O Finny é um assistente financeiro pessoal. Quem decide como seus dados são usados (o "controlador", na LGPD) é ${LEGAL_CONTACT.controller}. O encarregado pelo tratamento de dados (DPO) atende pelo e-mail ${LEGAL_CONTACT.email}.`,
      'Esta política explica, em linguagem simples, quais dados guardamos, para quê, com quem dividimos e como você exerce seus direitos pela Lei Geral de Proteção de Dados (Lei 13.709/2018).',
    ],
  },
  {
    title: 'Quais dados guardamos',
    paragraphs: [
      'Cadastro: nome completo, e-mail, celular e senha. A senha é guardada só como um código irreversível (hash BCrypt): nem nós conseguimos ver.',
      'CPF: usamos para garantir uma conta e um teste grátis por pessoa. Guardamos apenas um código irreversível (HMAC) do CPF, nunca o número em si.',
      'Dados financeiros que você informa: ganhos, gastos, categorias, metas e as respostas do questionário inicial (faixa de renda, dívidas, objetivos).',
      'Conversas com a IA do Finny e os cartões de ação que ela sugere.',
      'Foto de perfil, se você enviar uma (redimensionada e sem dados de localização).',
      'Pagamentos: são feitos no Mercado Pago. O Finny não recebe nem guarda número de cartão; guardamos só o status da assinatura.',
      'Registros técnicos: data, rota acessada e resultado de cada pedido ao servidor, sem nome nem e-mail (o endereço IP pode aparecer em alertas de segurança), mantidos por poucos dias para segurança e correção de erros.',
    ],
  },
  {
    title: 'Para que usamos',
    paragraphs: [
      'Para prestar o serviço que você contratou ao criar a conta (LGPD, art. 7º, V): mostrar sua planilha, metas, resumos e responder no chat.',
      'Para segurança e prevenção a fraudes (legítimo interesse, art. 7º, IX e art. 11, II, g): confirmar seu e-mail, limitar tentativas de login e impedir contas e testes grátis repetidos.',
      'Para cumprir obrigações legais (art. 7º, II), como registros de pagamento.',
      'Não vendemos seus dados, não usamos para publicidade e não fazemos perfil para terceiros.',
    ],
  },
  {
    title: 'Com quem compartilhamos',
    paragraphs: [
      'Só com empresas que operam o serviço para nós (operadores), cada uma com acesso apenas ao necessário:',
      'Render (servidor da API) e Supabase (banco de dados), nos Estados Unidos.',
      'Vercel (hospedagem do site), nos Estados Unidos.',
      'Anthropic (IA Claude), nos Estados Unidos: recebe sua mensagem e um resumo dos seus dados financeiros só quando você usa o chat. Pelos termos comerciais da Anthropic, esses dados não são usados para treinar modelos.',
      'Brevo (envio dos e-mails de código), na União Europeia.',
      'Mercado Pago (pagamentos), no Brasil, quando você assina o Premium.',
      'Como alguns desses serviços ficam fora do Brasil, há transferência internacional de dados (art. 33), feita com empresas que adotam proteções contratuais e técnicas compatíveis com a LGPD.',
    ],
  },
  {
    title: 'Por quanto tempo guardamos',
    paragraphs: [
      'Enquanto sua conta existir. Ao excluir a conta (Perfil > Excluir minha conta), apagamos na hora seus dados do banco: cadastro, lançamentos, metas, conversas e foto.',
      'Guardamos depois da exclusão apenas o código irreversível do CPF ligado ao uso do teste grátis, para evitar abuso. Os registros de pagamento ficam com o Mercado Pago pelo prazo que a lei exige. Cópias de segurança automáticas dos provedores são sobrescritas em poucos dias.',
    ],
  },
  {
    title: 'Seus direitos',
    paragraphs: [
      'Pela LGPD (art. 18) você pode: confirmar que tratamos seus dados, acessar e baixar uma cópia, corrigir, pedir a exclusão, saber com quem compartilhamos e revogar consentimentos.',
      'No próprio Finny: Perfil > Baixar meus dados (arquivo com tudo) e Perfil > Excluir minha conta.',
      `Para qualquer outro pedido, escreva para ${LEGAL_CONTACT.email}. Respondemos em até 15 dias. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (gov.br/anpd).`,
    ],
  },
  {
    title: 'Como protegemos',
    paragraphs: [
      'Conexão sempre criptografada (HTTPS), banco com acesso restrito e criptografia em disco, senha e CPF guardados só como códigos irreversíveis, sessões que expiram, limite de tentativas de login, verificação de e-mail e acesso de cada pessoa apenas aos próprios dados.',
      'A IA nunca grava nada sozinha: ela só sugere, e quem confirma é você.',
      'Se acontecer um incidente de segurança que possa trazer risco a você, avisaremos você e a ANPD, como manda a lei.',
    ],
  },
  {
    title: 'Cookies e armazenamento no navegador',
    paragraphs: [
      'O site não usa cookies de propaganda nem de rastreamento. Usamos o armazenamento da sessão do navegador só para manter você conectado enquanto a aba estiver aberta.',
    ],
  },
  {
    title: 'Idade mínima',
    paragraphs: ['O Finny é para maiores de 18 anos.'],
  },
  {
    title: 'Mudanças nesta política',
    paragraphs: [
      `Última atualização: ${LEGAL_UPDATED_AT}. Se mudarmos algo importante, avisaremos no app ou por e-mail antes de valer.`,
    ],
  },
];

export const termsOfUse: LegalSection[] = [
  {
    title: 'O que é o Finny',
    paragraphs: [
      'O Finny ajuda você a organizar ganhos, gastos e metas, com um assistente de IA que explica e sugere. Ao criar uma conta, você concorda com estes Termos e com a Política de Privacidade.',
    ],
  },
  {
    title: 'Não é consultoria financeira',
    paragraphs: [
      'As respostas da IA são orientações gerais e podem conter erros. Elas não são recomendação de investimento nem consultoria financeira, contábil ou jurídica. Confira antes de tomar decisões importantes.',
    ],
  },
  {
    title: 'Sua conta',
    paragraphs: [
      'A conta é pessoal: uma por pessoa (por CPF), para maiores de 18 anos. Informe dados verdadeiros e guarde sua senha em segredo. Se suspeitar de acesso indevido, troque a senha em "Esqueci a senha" e nos avise.',
      'Você é responsável pelo que registra no Finny. Não use o serviço para atividades ilegais, para tentar acessar dados de outras pessoas ou para sobrecarregar o sistema.',
    ],
  },
  {
    title: 'Plano grátis e Premium',
    paragraphs: [
      'O plano grátis tem limites mensais de lançamentos, metas e mensagens com a IA. O Premium custa R$ 9,90 por mês, pago pelo Mercado Pago (cartão com renovação automática ou Pix que libera 30 dias), e pode ter teste grátis de 7 dias, uma vez por pessoa.',
      'Você pode cancelar a renovação no cartão a qualquer momento no app; o Premium já pago continua até o fim do período.',
      'Pelo Código de Defesa do Consumidor (art. 49), você pode desistir da primeira compra em até 7 dias e receber o valor de volta: basta escrever para o nosso e-mail.',
    ],
  },
  {
    title: 'Disponibilidade',
    paragraphs: [
      'Trabalhamos para o Finny ficar no ar e seguro, mas ele pode ter pausas para manutenção ou falhas. Recomendamos baixar seus dados de vez em quando (Perfil > Baixar meus dados).',
    ],
  },
  {
    title: 'Encerramento',
    paragraphs: [
      'Você pode excluir sua conta quando quiser, em Perfil > Excluir minha conta. Podemos suspender contas que violem estes Termos, avisando o motivo.',
    ],
  },
  {
    title: 'Mudanças e contato',
    paragraphs: [
      `Última atualização: ${LEGAL_UPDATED_AT}. Mudanças importantes serão avisadas antes de valer. Dúvidas: ${LEGAL_CONTACT.email}.`,
      'Estes Termos seguem as leis do Brasil. Fica eleito o foro do domicílio do consumidor.',
    ],
  },
];
