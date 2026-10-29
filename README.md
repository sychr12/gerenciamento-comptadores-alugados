# Central de equipamentos

Aplicação web para controlar computadores, impressoras, componentes, suprimentos e contas de acesso. A arquitetura de execução usa Docker Compose: Apache com PHP e PostgreSQL sobem juntos, e os dados do banco ficam em um volume persistente.

## Iniciar no Windows

1. Instale e inicie o Docker Desktop.
2. Copie `.env.example` para `.env` e escolha uma senha para o PostgreSQL.
3. Execute `iniciar.bat` ou rode `docker compose up --build` no terminal, na pasta do projeto.
4. Abra <http://127.0.0.1:8000>.

O serviço `app` usa Apache e PHP 8.3 com `pdo_pgsql` e SNMP. O serviço `db` usa PostgreSQL 16 e só é acessível pela rede interna do Compose. A aplicação fica publicada apenas em `127.0.0.1:8000`.

Para encerrar os serviços, pressione `Ctrl+C` no terminal do iniciador ou execute `docker compose down`. O volume `postgres-data` preserva o inventário entre reinicializações. Os esquemas de computadores e usuários em `gerenciador3/bancotxt` são importados automaticamente quando o volume do banco é criado pela primeira vez. A tabela de impressoras e seus quatro registros de exemplo são criados pela API na primeira visita à tela de impressoras.

O primeiro acesso usa o usuário `Administrador` e a senha temporária `1234`. O sistema exige a troca dessa senha no primeiro login. Bancos que já existiam fora do Docker não são copiados automaticamente para o volume novo.

Para consultar tinta e toner, habilite SNMP v2c somente leitura nas impressoras. A aplicação usa `SNMP_COMMUNITY` do `.env` (padrão `public`); troque por uma comunidade somente leitura igual à configurada nos equipamentos e reconstrua o container com `docker compose up -d --build app`. A consulta fica disponível no botão “Consultar nível de tinta” de cada impressora. O servidor só consulta IPs IPv4 privados cadastrados; nem todos os modelos expõem níveis na Printer-MIB, e o percentual exibido é uma estimativa com base na capacidade informada pela impressora.

A API de computadores aplica automaticamente as colunas de substituição ausentes em bancos existentes, sem apagar os registros já cadastrados.

## Serviços e arquivos principais

- `compose.yaml`: declara aplicação, PostgreSQL, rede interna, verificações de disponibilidade e volume persistente.
- `Dockerfile`: cria o servidor Apache/PHP e instala as extensões PostgreSQL e SNMP.
- `.env.example`: modelo das variáveis do banco e da comunidade SNMP. O arquivo `.env` local é ignorado pelo Git.
- `iniciar.bat`: prepara o `.env` inicial quando necessário e inicia a aplicação com Docker Compose.
- `gerenciador3/html`: páginas de login, dashboard, inventários e administração de contas.
- `gerenciador3/css`: estilos compartilhados e estilos específicos por tela; `login.css` concentra o layout e as animações do login.
- `gerenciador3/js`: interações de interface, autenticação e chamadas às APIs.
- `gerenciador3/php`: APIs, autenticação e conexão PostgreSQL.
- `gerenciador3/bancotxt`: scripts SQL que inicializam computadores e usuários em um banco Docker novo.

## Telas e funções

- `html/index.html`: login animado, mostrar/ocultar senha e troca obrigatória no primeiro acesso.
- `html/inicio.html`: dashboard com indicadores e atalhos para computadores, impressoras e usuários.
- `html/info_computadores.html`: lista, pesquisa, filtros por vínculo (alugado ou próprio), seleção, edição, exclusão e exportação CSV de computadores.
- `html/novo_computador.html`: cadastro de computador alugado ou próprio (não alugado), ou preenchimento de uma edição iniciada pela lista.
- `html/impressoras.html`: pesquisa, filtros, cadastro, edição, exclusão, cópia de IP e exportação CSV.
- A tela de impressoras permite consultar manualmente os níveis de tinta/toner via SNMP v2c e Printer-MIB para o IP cadastrado. A impressora precisa ter SNMP habilitado e usar a comunidade de leitura configurada na aplicação.
- `html/componentes.html`: controle de periféricos, tintas e toners, com quantidade, estoque mínimo, compatibilidade, localização e exportação CSV.
- `html/relatorio.html`: visão consolidada de computadores próprios ou alugados e impressoras, com busca, filtro por tipo e exportação CSV.
- `html/configuração.html`: pesquisa, edição, exclusão e exportação de usuários.
- `html/cadastrar_ususario.html`: cadastro de contas com nível de acesso e troca de senha opcionalmente obrigatória.

## JavaScript: responsabilidades

- `js/auxiFunc.js`: `requestJSON` faz chamadas e interpreta erros de API; `checkReset` converte checkbox para `sim`/`nao`; `checkLevel` mapeia cargo para nível; `validateUser` autentica no servidor; `changePass` troca a senha; `downloadCSV` exporta dados com escape de aspas e proteção contra fórmulas CSV.
- `js/login.js`: valida login, alterna a exibição da senha, apresenta erros e conduz a redefinição obrigatória.
- `js/dashboard.js`: lê computadores e impressoras pelas APIs, calcula indicadores e mostra os registros mais recentes.
- `js/computadores.js`: carrega, filtra e seleciona a lista de computadores; abre o cadastro para edição, salva e exclui registros e exporta CSV.
- `js/impressoras.js`: pesquisa e filtra os cards; abre cadastro/edição; exclui, copia IP e exporta CSV.
- A consulta de suprimentos é feita pelo servidor, diretamente ao endereço IPv4 privado cadastrado. Ela é somente de leitura e mostra o percentual aproximado retornado pela impressora.
- `js/componentes.js`: pesquisa e filtra componentes e suprimentos; cadastra, edita e exclui materiais e exporta CSV.
- `js/buscar_usuarios.js`: carrega e pesquisa usuários; controla o formulário de edição, salva ou exclui contas e exporta CSV.
- `js/cadastrar_usuario.js`: valida e envia novos usuários e mapeia cargos aos níveis de acesso.
- `js/perfil_menu.js`: administra o menu do perfil, navegação, foto local e encerramento da sessão.

As animações do login estão isoladas em `css/login.css`. A entrada da arte e do formulário, os elementos decorativos, estados de foco e transição para redefinição respeitam a preferência de movimento reduzido do sistema operacional.

## APIs e segurança

As APIs PHP trocam JSON com o navegador e usam PDO com consultas preparadas. O login é validado no servidor; senhas novas ficam armazenadas com `password_hash`, e senhas legadas em texto são atualizadas para hash após um login válido. As rotas verificam a sessão e o nível de acesso no servidor. Uma conta com troca de senha pendente só pode acessar a própria operação de redefinição.

- `php/conexao.php`: configura a conexão usando `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER` e `PGPASSWORD`, além de sessão e respostas JSON.
- `php/login_api.php` e `php/logout_api.php`: iniciam e encerram a sessão.
- `php/api.php`: consulta e grava computadores; adiciona automaticamente a coluna de vínculo (alugado/próprio) em bancos existentes, classificando os registros anteriores como alugados.
- `php/impressoras_api.php`: consulta e administra impressoras, além de ler suprimentos via Printer-MIB/SNMP v2c.
- `php/componentes_api.php`: consulta e administra componentes e suprimentos; cria a tabela `componentes` quando necessário.
- `php/buscar_usuarios.php`, `php/cadastrar_usuario.php` e `php/editarExcluir.php`: lista e administra contas conforme as permissões.
- `php/processa.php`: rota antiga de login desativada.

## Manutenção

```sh
docker compose logs -f app db
docker compose down
docker compose up --build
```

`docker compose down` mantém os dados do PostgreSQL. Não remova o volume `postgres-data` se precisar preservar o inventário.
