# Link-Do 部署：三个职责明确的环境文件

部署使用三个环境文件，均放在 deploy 目录：

| deploy 文件 | 复制来源 | 负责内容 |
| --- | --- | --- |
| .env.admin.production | apps/admin/.env.product | Admin 的公开 Vite 构建变量，以及 HTTP_PORT。 |
| .env.backend.production | services/backend/.env.product | Backend 运行变量、MySQL/Redis/RabbitMQ、OSS、OAuth。 |
| .env.image | 在 deploy 目录手动维护 | CCR 仓库地址、命名空间与本次发布的镜像 tag。 |

复制方向永远是“项目目录 → deploy 目录”。不要从 deploy 目录反向覆盖项目配置。

不会再使用 deploy/.env、deploy/.env.example、项目根 .env 或项目根 .env.production。

## 1. 两类环境的边界

Admin 的 VITE_ 变量是构建时配置。执行推送脚本时，它们会编译进 Admin 镜像的浏览器静态文件；服务器启动容器后无法修改它们。

Backend 文件是运行时配置。Docker Compose 会直接将 .env.backend.production 注入 Backend、MySQL、Redis、RabbitMQ 等服务，不再在 compose.yaml 中重新拼装 MYSQL_DSN、REDIS_ADDR、AMQP_URL 或密码。

因此，Backend 生产文件必须已经是 Docker 网络可用的值，例如：

~~~dotenv
APP_ENV=product
MYSQL_DSN=root:你的MySQL密码@tcp(mysql:3306)/linkdo?charset=utf8mb4&parseTime=True&loc=Local
REDIS_ADDR=redis:6379
REDIS_PASSWORD=你的Redis密码
AMQP_URL=amqp://linkdo:你的RabbitMQ密码@rabbitmq:5672/
RABBITMQ_DEFAULT_USER=linkdo
RABBITMQ_DEFAULT_PASS=你的RabbitMQ密码
GATEWAY_PORT=8080
BASE_PORT=8081
LINK_PORT=8082
FILE_PORT=8083
BASE_SERVICE_URL=http://base-service:8081
LINK_SERVICE_URL=http://link-service:8082
FILE_SERVICE_URL=http://file-service:8083
~~~

.env.image 只放镜像发布信息：

~~~dotenv
REGISTRY_HOST=ccr.ccs.tencentyun.com
CCR_NAMESPACE=ax-linkdo
IMAGE_TAG=v2026.09.09
~~~

Admin 生产文件至少应含：

~~~dotenv
VITE_CLERK_PUBLISHABLE_KEY=pk_...
VITE_PUBLIC_AGENT_URL=https://agent.example.com
HTTP_PORT=5173
~~~

VITE_ 变量一定是浏览器可见内容，不能放任何私钥。

## 2. 本机：构建并推送 CCR

准备好 deploy/.env.admin.production、deploy/.env.backend.production 和 deploy/.env.image 后，先登录 CCR：

~~~bash
docker login ccr.ccs.tencentyun.com
~~~

然后推送指定版本：

~~~bash
bash deploy/scripts/push-images.sh v2026.09.09
~~~

该脚本读取 Admin 文件和 .env.image：Admin 文件向镜像构建传递公开 Vite 变量；.env.image 提供 CCR 地址、命名空间与镜像 tag。它在本机构建 linux/amd64 的 Admin 与 Backend 镜像并推送到 CCR。

## 3. 服务器：只接收部署包和三个环境文件

服务器不需要 clone 项目源码。部署包只包含：

~~~text
compose.yaml
scripts/
README.md
.env.admin.production
.env.backend.production
.env.image
~~~

MySQL 容器只负责提供空数据库和持久化存储；不再挂载或执行任何 `init/*.sql`。Base Service 启动并成功连接 MySQL 后，会执行后端内置的 `AutoMigrate`，统一创建或补齐用户、Collection、Notion、ClickUp、Task 等表和字段。这是唯一的 schema 来源，避免 SQL 初始化文件与 Go Model 发生漂移。

服务器在 deploy 目录执行：

~~~bash
docker login ccr.ccs.tencentyun.com
bash scripts/deploy.sh
~~~

deploy.sh 会按顺序：

1. 检查三个 deploy 环境文件都存在。
2. 同时加载 Backend、Admin 和 image 文件给 Docker Compose。
3. 从 CCR 拉取 Backend 与 Admin 的 IMAGE_TAG。
4. 启动 MySQL、Redis、RabbitMQ，再启动全部 Backend 服务与 Admin；Base Service 在连接 MySQL 后自动迁移 schema。
5. 删除不属于当前 Compose 配置的旧容器。

服务器不会构建镜像。

## 4. Compose 如何加载文件

Compose 使用 .env.image 解析镜像仓库与 tag；Backend 文件提供服务和基础设施变量；Admin 文件提供 Admin 端口，并作为 Admin 容器环境文件。

Backend、MySQL、Redis、RabbitMQ 都直接使用同一份 .env.backend.production。变量名必须与目标服务的要求一致，例如 MySQL 使用 MYSQL_ROOT_PASSWORD，RabbitMQ 使用 RABBITMQ_DEFAULT_USER 与 RABBITMQ_DEFAULT_PASS。

Redis 会在容器中读取 REDIS_PASSWORD 作为启动密码和 healthcheck 密码，因此不会再出现“Redis 已启动但 unhealthy”的空密码问题。

## 5. 访问 Admin

Gateway 的 API 直接通过 Backend 文件中的 `GATEWAY_PORT` 发布；例如设为 `8080` 时，API 地址是：

~~~text
http://服务器公网IP:8080/
~~~

若 Admin 文件中设置 `HTTP_PORT=5173`，直接访问：

~~~text
http://服务器公网IP:5173/
~~~

如果服务器已有 Nginx/Caddy 占用 80/443，可以让它分别反向代理到 `127.0.0.1:5173`（Admin）与 `127.0.0.1:8080`（API）。外部用户访问最终域名即可。

Admin 自身会将 /api/ 请求转发给 Gateway；浏览器不需要单独配置 API 地址。

## 6. 日常操作

查看状态：

~~~bash
docker compose --env-file .env.backend.production --env-file .env.admin.production --env-file .env.image -f compose.yaml ps
~~~

查看 Gateway 日志：

~~~bash
docker compose --env-file .env.backend.production --env-file .env.admin.production --env-file .env.image -f compose.yaml logs -f gateway
~~~

发布新版本时，在 .env.image 中更新 IMAGE_TAG，再执行：

~~~bash
bash scripts/deploy.sh
~~~

回滚时改回旧 IMAGE_TAG 并运行相同命令。

备份 MySQL：

~~~bash
bash scripts/backup-mysql.sh
~~~

停止容器但保留数据库数据：

~~~bash
docker compose --env-file .env.backend.production --env-file .env.admin.production --env-file .env.image -f compose.yaml down
~~~

不要执行 docker compose down -v，除非明确要删除全部持久化数据。




<!-- db 通道 -->
```
ssh -N \
  -L 3307:127.0.0.1:3307 \
  ubuntu@xxx
```