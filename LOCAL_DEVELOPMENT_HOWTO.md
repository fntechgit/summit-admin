# Local Development Setup

This guide covers setting up **summit-admin** (React/webpack dev server) connected to local **summit-api** and **openstackid** instances.

## Prerequisites

- Docker and docker-compose
- Node.js / npm
- A MySQL client (mariadb or mysql CLI)
- Repos checked out locally:
  - `openstackid` → runs on `http://localhost:8001`
  - `summit-api` → runs on `http://localhost:8002`
  - `summit-admin` → runs on `http://localhost:8080`

---

## 1. Start openstackid

Create the .env file and generate an app key:

```bash
cd /path/to/openstackid
cp .env.testing .env
php artisan key:generate
./start_local_server.sh
```

`start_local_server.sh` handles everything: composer install, Doctrine migrations (`doctrine:migrations:migrate`), database seeding, and super admin creation. No manual migration or seed commands are needed.

> The default super admin credentials created by the script are `test@test.com` / `1Qaz2wsx!`.

---

## 2. Create the Frontend JS Client in openstackid

Go to `http://localhost:8001`. You may get a permissions error writing to the logs directory. If so fix it like so:

```bash
docker exec idp-app chmod -R 777 /var/www/storage/logs
```

Create an OAuth2 client (OAUTH2 Console -> OAUTH2 Applications -> Register Application):

- **Application Type**: Client Side (JS)
- **Application Name**: `summit-admin-local` (or any name)
- **Token Endpoint Auth Method**: None
- **Active**: checked

After saving, edit the client and under Security Settings:

- **Use PKCE**: checked (only visible for JS Client type)

Note the generated **client_id**. Then set the redirect URI and allowed origin via SQL (the UI only accepts HTTPS URLs):

```bash
# Replace <client_db_id> with the integer ID from oauth2_client table. For a new setup this should be 1.
mysql -u idp_user -h 127.0.0.1 -P 30780 --password=1qaz2wsx! idp_local -e "
  UPDATE oauth2_client
  SET redirect_uris = 'http://localhost:8080/auth/callback',
      allowed_origins = 'http://localhost:8080',
      post_logout_redirect_uris = 'http://localhost:8080/auth/logout'
  WHERE id = <client_db_id>;
"
```

Flush the Doctrine result cache:

```bash
docker exec openstackid-redis-1 redis-cli -a 1qaz2wsx! -n 5 FLUSHDB
```

---

## 3. Create the summit-api Resource Server Client

In the openstackid admin UI, create a second client:

- **Application Type**: Web Application
- **Application Name**: `summit-api-resource-server` (or any name)
- **Active**: checked

Note the generated **client_id** and **client_secret** — you will need them in step 5.

> After you run the SQL in step 5 to set `resource_server_id` on this client, it will disappear from the admin UI client list. This is expected — openstackid treats resource server clients as internal server-to-server credentials and hides them from the application list. The client is still present in the database and functioning correctly.

---

## 4. Seed openstackid Scopes

From the summit-admin repo root, edit `seed_idp_scopes.sql` and set `@client_id` to the integer DB id of the frontend JS client created in step 2. Then run:

```bash
mysql -u idp_user -h 127.0.0.1 -P 30780 --password=1qaz2wsx! idp_local < seed_idp_scopes.sql
```

This inserts the summit-api resource server, registers all API scopes, and grants them to the frontend client.

Now link the resource server client from step 3 to the summit-api resource server:

```bash
# Confirm the resource server id (should be 2 for summit-api)
mysql -u idp_user -h 127.0.0.1 -P 30780 --password=1qaz2wsx! idp_local -e "
  SELECT id, friendly_name FROM oauth2_resource_server;
"

# Link the client to the resource server
mysql -u idp_user -h 127.0.0.1 -P 30780 --password=1qaz2wsx! idp_local -e "
  UPDATE oauth2_client SET resource_server_id = <rs_id> WHERE app_name = 'summit-api-resource-server';
"
```

Flush the Doctrine result cache:

```bash
docker exec openstackid-redis-1 redis-cli -a 1qaz2wsx! -n 5 FLUSHDB
```

---

## 5. Configure and Start summit-api

Create the .env file and generate an app key:

```bash
cd /path/to/summit-api
cp .env.testing .env
php artisan key:generate
```

By default some of the ports used by summit-api will conflict with openstackid, so create a docker-compose.override.yml to move the ports:

```bash
cd /path/to/summit-api
cp docker-compose.override.testing.yml docker-compose.override.yml
```

Edit `/path/to/summit-api/.env` and set:

```dotenv
APP_OAUTH_2_0_AUTH_SERVER_BASE_URL=http://host.docker.internal:8001
APP_OAUTH_2_0_CLIENT_ID=<resource-server-client-id-from-step-4>
APP_OAUTH_2_0_CLIENT_SECRET=<resource-server-client-secret-from-step-4>
```

Then start the server:

```bash
./start_local_server.sh
```

Fix storage permissions (required on first run):

```bash
docker exec summit-api chmod -R 777 /var/www/storage
```

---

## 6. Create a Test Member in summit-api

The login flow requires a matching member record in the summit-api model DB with an admin group assigned. Connect to the model DB (port 32781):

```bash
mysql -u root -h 127.0.0.1 -P 32781 --password=1qaz2wsx! homestead << 'EOF'
INSERT INTO Member (ClassName, Created, LastEdited, FirstName, Surname, Email, Active, EmailVerified, ExternalUserIdentifier)
VALUES ('Member', NOW(), NOW(), 'Test', 'Admin', 'test@test.com', 1, 1, 'test@test.com');

SET @member_id = LAST_INSERT_ID();

INSERT INTO `Group` (Title, Code) VALUES ('super-admins', 'super-admins');
SET @group_id = LAST_INSERT_ID();

INSERT INTO Group_Members (GroupID, MemberID) VALUES (@group_id, @member_id);
EOF
```

Use the same email address as your openstackid user account.

---

## 7. Configure summit-admin

Copy or update `.env` with:

```dotenv
OAUTH2_CLIENT_ID=<frontend-client-id-from-step-2>
IDP_BASE_URL=http://localhost:8001
API_BASE_URL=http://localhost:8002
SCOPES_BASE_REALM=http://localhost:8002
SCOPES="profile openid offline_access ${SCOPES_BASE_REALM}/summits/read ${SCOPES_BASE_REALM}/summits/read/all ${SCOPES_BASE_REALM}/summits/write ${SCOPES_BASE_REALM}/summits/write-event ${SCOPES_BASE_REALM}/summits/delete-event ${SCOPES_BASE_REALM}/summits/publish-event ${SCOPES_BASE_REALM}/summits/write-presentation-materials ${SCOPES_BASE_REALM}/summits/registration-orders/update ${SCOPES_BASE_REALM}/summits/registration-orders/delete ${SCOPES_BASE_REALM}/summits/registration-orders/create/offline ${SCOPES_BASE_REALM}/summits/badge-scans/read ${SCOPES_BASE_REALM}/members/read ${SCOPES_BASE_REALM}/members/read/me ${SCOPES_BASE_REALM}/members/write ${SCOPES_BASE_REALM}/speakers/write ${SCOPES_BASE_REALM}/attendees/write ${SCOPES_BASE_REALM}/companies/read ${SCOPES_BASE_REALM}/companies/write ${SCOPES_BASE_REALM}/organizations/read ${SCOPES_BASE_REALM}/organizations/write ${SCOPES_BASE_REALM}/summit-administrator-groups/read ${SCOPES_BASE_REALM}/summit-administrator-groups/write ${SCOPES_BASE_REALM}/summit-media-file-types/read ${SCOPES_BASE_REALM}/summit-media-file-types/write ${SCOPES_BASE_REALM}/audit-logs/read"
```

> The SCOPES list is intentionally trimmed to only the scopes served by summit-api locally. External microservice scopes (email, purchases, sponsor, etc.) are excluded to avoid requiring those services running.

---

## 8. Start summit-admin

```bash
yarn install
yarn serve
```

Open `http://localhost:8080` and click **Login**.

---

## Troubleshooting

### IP banned by openstackid (404 "page is invalid" on login)

Repeated failed introspection attempts trigger openstackid's blacklist. Clear all bans:

```bash
docker exec openstackid-redis-1 redis-cli -a 1qaz2wsx! FLUSHDB 2>/dev/null
docker exec idp-db-local mysql -u idp_user --password='1qaz2wsx!' idp_local -e "DELETE FROM banned_ips;"
```

> Note: `FLUSHDB` clears all keys in Redis DB 0, which in this setup contains only the IP blacklist. If you have added other data to that DB, use `DEL "<your-ip>"` instead.

### Permission denied on summit-api storage

```bash
docker exec summit-api chmod -R 777 /var/www/storage
```

### Doctrine proxy directory not writable

```bash
docker exec summit-api chmod -R 777 /var/www/storage/proxies
```

### Stale Doctrine result cache after openstackid DB changes

```bash
docker exec openstackid-redis-1 redis-cli -a 1qaz2wsx! -n 5 FLUSHDB
```

### Config changes not taking effect in summit-api

```bash
docker exec summit-api php artisan config:clear
docker restart summit-api
```
