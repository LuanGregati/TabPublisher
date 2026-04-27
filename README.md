# TabPublisher

Aplicação para automatizar a publicação de notícias no TabNews.

https://tab-publisher.vercel.app/

## Instalação

```bash
npm install
```

## Configuração

1. Copie o arquivo `.env.example` para `.env`:

   ```bash
   cp .env.example .env
   ```

2. Edite o arquivo `.env` com suas credenciais do TabNews e o intervalo desejado:
   ```
   TABNEWS_EMAIL=seu_email@exemplo.com
   TABNEWS_PASSWORD=sua_senha
   PUBLISH_INTERVAL_MINUTES=15
   ```

## Exemplo de Input

Crie um arquivo `input.txt` com o conteúdo das notícias no formato:

```
https://www.theregister.com/2026/04/22/frances_secure_id_agency_probes/
França investiga possível vazamento de até 19 milhões de registros de cidadãos, quase 33% da população: o incidente, ocorrido no portal ants[.]gouv[.]fr, potencialmente expôs dados como login, nomes completos, e-mails, datas de nascimento, identificadores únicos, endereços e telefones, embora não haja indícios de acesso às contas. O hacker responsável, identificado como "breach3d" e "ExtaseHunters", estaria tentando vender as informações em fóruns. As informações são do site The Register.
```

Para múltiplas notícias, separe cada bloco por uma linha em branco.

## Como Executar

```bash
cat input.txt | node app.js
```

Ou:

```bash
node app.js < input.txt
```

A aplicação irá autenticar, parsear as notícias, e publicá-las uma por vez com o intervalo configurado.

## Interface Web Next.js

O projeto também suporta uma interface web clássica com `pages/`, preparada para rodar localmente e para deploy no Vercel.

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`, informe seu email e senha do TabNews, cole as notícias e defina o intervalo. A interface mostra o progresso de cada publicação e permite interromper o processo.

Para iniciar o servidor Next.js em produção:

```bash
npm run build
npm run start:web
```

Atenção: no Vercel, o backend de publicação executa um item por vez via API, enquanto o intervalo e o controle de fluxo são gerenciados no navegador.
