-- =============================================================
-- IDP scope seed for local summit-admin development
--
-- Run AFTER:
--   1. openstackid db:seed (creates openid/offline_access/profile scopes)
--   2. Creating your OAuth2 client in the openstackid admin UI
--
-- Usage (from host, adjust port if needed):
--   mysql -u idp_user -h 127.0.0.1 -P 30780 --password=1qaz2wsx! idp_local < seed_idp_scopes.sql
--
-- Verify your client DB id first:
--   SELECT id, client_id FROM oauth2_client;
-- Then set @client_id below accordingly.
-- =============================================================

SET @client_id = 1;

-- -------------------------------------------------------------
-- 1. Grant openstackid-native scopes (openid, offline_access, profile)
-- -------------------------------------------------------------
INSERT IGNORE INTO oauth2_client_api_scope (client_id, scope_id, created_at, updated_at)
SELECT @client_id, id, NOW(), NOW()
FROM oauth2_api_scope
WHERE name IN ('openid', 'offline_access', 'profile');

-- -------------------------------------------------------------
-- 2. Register summit-api as a resource server
-- -------------------------------------------------------------
INSERT INTO oauth2_resource_server (friendly_name, host, ips, active, created_at, updated_at)
VALUES ('summit-api', 'localhost', '127.0.0.1', 1, NOW(), NOW());

SET @rs_id = LAST_INSERT_ID();

INSERT INTO oauth2_api (name, description, active, resource_server_id, created_at, updated_at)
VALUES ('summit-api', 'Summit API', 1, @rs_id, NOW(), NOW());

SET @api_id = LAST_INSERT_ID();

-- -------------------------------------------------------------
-- 3. Insert summit-api scopes (matching APP_SCOPE_BASE_REALM=http://localhost:8002)
-- -------------------------------------------------------------
INSERT INTO oauth2_api_scope
    (name, short_description, description, active, is_default, is_system, assigned_by_groups, api_id, created_at, updated_at)
VALUES
    ('http://localhost:8002/summits/read',                              'Read Summit Data',                     'Read Summit Data',                     1, 0, 0, 0, @api_id, NOW(), NOW()),
    ('http://localhost:8002/summits/read/all',                          'Read All Summit Data',                 'Read All Summit Data',                 1, 0, 0, 0, @api_id, NOW(), NOW()),
    ('http://localhost:8002/summits/write',                             'Write Summit Data',                    'Write Summit Data',                    1, 0, 0, 0, @api_id, NOW(), NOW()),
    ('http://localhost:8002/summits/write-event',                       'Write Summit Event',                   'Write Summit Event',                   1, 0, 0, 0, @api_id, NOW(), NOW()),
    ('http://localhost:8002/summits/delete-event',                      'Delete Summit Event',                  'Delete Summit Event',                  1, 0, 0, 0, @api_id, NOW(), NOW()),
    ('http://localhost:8002/summits/publish-event',                     'Publish Summit Event',                 'Publish Summit Event',                 1, 0, 0, 0, @api_id, NOW(), NOW()),
    ('http://localhost:8002/summits/write-presentation-materials',      'Write Presentation Materials',         'Write Presentation Materials',         1, 0, 0, 0, @api_id, NOW(), NOW()),
    ('http://localhost:8002/summits/registration-orders/update',        'Update Registration Orders',           'Update Registration Orders',           1, 0, 0, 0, @api_id, NOW(), NOW()),
    ('http://localhost:8002/summits/registration-orders/delete',        'Delete Registration Orders',           'Delete Registration Orders',           1, 0, 0, 0, @api_id, NOW(), NOW()),
    ('http://localhost:8002/summits/registration-orders/create/offline','Create Offline Registration Orders',   'Create Offline Registration Orders',   1, 0, 0, 0, @api_id, NOW(), NOW()),
    ('http://localhost:8002/summits/badge-scans/read',                  'Read Badge Scans',                     'Read Badge Scans',                     1, 0, 0, 0, @api_id, NOW(), NOW()),
    ('http://localhost:8002/members/read',                              'Read Member Data',                     'Read Member Data',                     1, 0, 0, 0, @api_id, NOW(), NOW()),
    ('http://localhost:8002/members/read/me',                           'Read My Member Data',                  'Read My Member Data',                  1, 0, 0, 0, @api_id, NOW(), NOW()),
    ('http://localhost:8002/members/write',                             'Write Member Data',                    'Write Member Data',                    1, 0, 0, 0, @api_id, NOW(), NOW()),
    ('http://localhost:8002/speakers/write',                            'Write Speakers Data',                  'Write Speakers Data',                  1, 0, 0, 0, @api_id, NOW(), NOW()),
    ('http://localhost:8002/attendees/write',                           'Write Attendees Data',                 'Write Attendees Data',                 1, 0, 0, 0, @api_id, NOW(), NOW()),
    ('http://localhost:8002/companies/read',                            'Read Companies',                       'Read Companies',                       1, 0, 0, 0, @api_id, NOW(), NOW()),
    ('http://localhost:8002/companies/write',                           'Write Companies',                      'Write Companies',                      1, 0, 0, 0, @api_id, NOW(), NOW()),
    ('http://localhost:8002/organizations/read',                        'Read Organizations',                   'Read Organizations',                   1, 0, 0, 0, @api_id, NOW(), NOW()),
    ('http://localhost:8002/organizations/write',                       'Write Organizations',                  'Write Organizations',                  1, 0, 0, 0, @api_id, NOW(), NOW()),
    ('http://localhost:8002/summit-administrator-groups/read',          'Read Summit Admin Groups',             'Read Summit Admin Groups',             1, 0, 0, 0, @api_id, NOW(), NOW()),
    ('http://localhost:8002/summit-administrator-groups/write',         'Write Summit Admin Groups',            'Write Summit Admin Groups',            1, 0, 0, 0, @api_id, NOW(), NOW()),
    ('http://localhost:8002/summit-media-file-types/read',              'Read Summit Media File Types',         'Read Summit Media File Types',         1, 0, 0, 0, @api_id, NOW(), NOW()),
    ('http://localhost:8002/summit-media-file-types/write',             'Write Summit Media File Types',        'Write Summit Media File Types',        1, 0, 0, 0, @api_id, NOW(), NOW()),
    ('http://localhost:8002/audit-logs/read',                           'Read Audit Logs',                      'Read Audit Logs',                      1, 0, 0, 0, @api_id, NOW(), NOW());

-- -------------------------------------------------------------
-- 4. Grant all summit-api scopes to the client
-- -------------------------------------------------------------
INSERT IGNORE INTO oauth2_client_api_scope (client_id, scope_id, created_at, updated_at)
SELECT @client_id, id, NOW(), NOW()
FROM oauth2_api_scope
WHERE api_id = @api_id;

-- -------------------------------------------------------------
-- 5. Flush Redis cache for this client (run in openstackid container):
--   redis-cli -h redis -a 1qaz2wsx! KEYS "*oauth2*client*" | xargs redis-cli -h redis -a 1qaz2wsx! DEL
-- -------------------------------------------------------------
