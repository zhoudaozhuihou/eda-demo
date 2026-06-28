-- Study-abroad tag demo journey seed data
-- Target: PostgreSQL 16+ after the FastAPI app schema has been initialized.
-- Usage:
--   psql "$DATABASE_URL" -f backend/sql/seed_study_abroad_demo_journey.sql
--
-- Storyline:
--   Studio chat receives a study-abroad finance request, discovers existing
--   tags, develops missing tags from knowledge and data evidence, publishes
--   them, then runs segment analysis for marketing-contactable prospects.

BEGIN;

SET client_encoding = 'UTF8';

DO $$
BEGIN
    IF to_regclass('public.tag_definitions') IS NULL
       OR to_regclass('public.tag_development_tasks') IS NULL
       OR to_regclass('public.uploaded_documents') IS NULL
       OR to_regclass('public.workbench_runs') IS NULL
       OR to_regclass('public.studio_sessions') IS NULL THEN
        RAISE EXCEPTION
            'Application schema is not initialized. Start the backend once, or run the schema creation step, before loading this demo seed.';
    END IF;
END $$;

CREATE TEMP TABLE IF NOT EXISTS demo_study_abroad_ids (
    kind TEXT NOT NULL,
    key TEXT NOT NULL,
    id VARCHAR(36) NOT NULL,
    PRIMARY KEY (kind, key)
) ON COMMIT DROP;

TRUNCATE demo_study_abroad_ids;

-- ============================================================
-- 1. Scenario data sources and discovered assets
-- ============================================================

INSERT INTO connections (
    id, name, db_type, host, port, database_name, username,
    password_encrypted, status, created_at, updated_at
) VALUES
    (
        'a1000000-0000-0000-0000-000000000001',
        '留学场景客户数据集',
        'postgresql',
        'demo.study-abroad.internal',
        5432,
        'STUDY_ABROAD_CUSTOMER360',
        'demo_reader',
        NULL,
        'connected',
        '2026-06-26 09:00:00',
        '2026-06-26 09:00:00'
    ),
    (
        'a1000000-0000-0000-0000-000000000002',
        '留学场景交易数据集',
        'postgresql',
        'demo.study-abroad.internal',
        5432,
        'STUDY_ABROAD_TXN',
        'demo_reader',
        NULL,
        'connected',
        '2026-06-26 09:00:00',
        '2026-06-26 09:00:00'
    ),
    (
        'a1000000-0000-0000-0000-000000000003',
        '留学场景合规与触达数据集',
        'mysql',
        'demo.study-abroad.internal',
        3306,
        'STUDY_ABROAD_COMPLIANCE',
        'demo_reader',
        NULL,
        'connected',
        '2026-06-26 09:00:00',
        '2026-06-26 09:00:00'
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    db_type = EXCLUDED.db_type,
    host = EXCLUDED.host,
    port = EXCLUDED.port,
    database_name = EXCLUDED.database_name,
    username = EXCLUDED.username,
    status = EXCLUDED.status,
    updated_at = EXCLUDED.updated_at;

INSERT INTO discovered_tables (
    id, connection_id, table_name, table_comment, row_count_estimate,
    column_count, scan_status, created_at
) VALUES
    (
        'f1100000-0000-0000-0000-000000000001',
        'a1000000-0000-0000-0000-000000000001',
        'customer_360_study_abroad',
        '客户全景视图：资产、地区、风险和留学金融相关画像',
        1280000,
        12,
        'completed',
        '2026-06-26 09:01:00'
    ),
    (
        'f1100000-0000-0000-0000-000000000002',
        'a1000000-0000-0000-0000-000000000001',
        'family_education_profile',
        '家庭教育关系表：子女年龄、教育阶段和境外院校信息',
        420000,
        9,
        'completed',
        '2026-06-26 09:01:00'
    ),
    (
        'f2200000-0000-0000-0000-000000000001',
        'a1000000-0000-0000-0000-000000000002',
        'cross_border_education_txn',
        '跨境教育交易表：留学汇款、境外教育缴费和换汇用途',
        680000,
        13,
        'completed',
        '2026-06-26 09:01:00'
    ),
    (
        'f2200000-0000-0000-0000-000000000002',
        'a1000000-0000-0000-0000-000000000002',
        'wire_transfer_detail',
        '电汇明细表：收款方、SWIFT、国家和汇款用途',
        380000,
        11,
        'completed',
        '2026-06-26 09:01:00'
    ),
    (
        'f3300000-0000-0000-0000-000000000001',
        'a1000000-0000-0000-0000-000000000001',
        'customer_interaction_event',
        '客户互动事件表：留学咨询、产品浏览和活动报名',
        980000,
        10,
        'completed',
        '2026-06-26 09:01:00'
    ),
    (
        'f4400000-0000-0000-0000-000000000001',
        'a1000000-0000-0000-0000-000000000003',
        'marketing_consent',
        '营销授权表：客户触达许可、渠道和授权有效期',
        1180000,
        8,
        'completed',
        '2026-06-26 09:01:00'
    ),
    (
        'f4400000-0000-0000-0000-000000000002',
        'a1000000-0000-0000-0000-000000000003',
        'cross_border_compliance_review',
        '跨境金融合规审查表：购汇用途、材料完整性和异常标记',
        126000,
        9,
        'completed',
        '2026-06-26 09:01:00'
    )
ON CONFLICT (id) DO UPDATE SET
    connection_id = EXCLUDED.connection_id,
    table_name = EXCLUDED.table_name,
    table_comment = EXCLUDED.table_comment,
    row_count_estimate = EXCLUDED.row_count_estimate,
    column_count = EXCLUDED.column_count,
    scan_status = EXCLUDED.scan_status;

INSERT INTO discovered_columns (
    id, table_id, column_name, data_type, is_nullable, is_primary_key,
    is_foreign_key, sample_values, null_ratio, distinct_count, created_at
) VALUES
    (
        'f1100000-0000-0000-0000-000000000011',
        'f1100000-0000-0000-0000-000000000001',
        'study_abroad_intent_score',
        'INTEGER',
        FALSE,
        FALSE,
        FALSE,
        '[92, 81, 74, 45, 28]',
        '0.02',
        101,
        '2026-06-26 09:02:00'
    ),
    (
        'f1100000-0000-0000-0000-000000000012',
        'f1100000-0000-0000-0000-000000000001',
        'aum_balance',
        'DECIMAL(20,2)',
        FALSE,
        FALSE,
        FALSE,
        '[8500000, 3200000, 1280000, 680000]',
        '0.01',
        740000,
        '2026-06-26 09:02:00'
    ),
    (
        'f1100000-0000-0000-0000-000000000013',
        'f1100000-0000-0000-0000-000000000001',
        'customer_tier',
        'VARCHAR(20)',
        FALSE,
        FALSE,
        FALSE,
        '["私行", "财富", "大众"]',
        '0.00',
        6,
        '2026-06-26 09:02:00'
    ),
    (
        'f1100000-0000-0000-0000-000000000021',
        'f1100000-0000-0000-0000-000000000002',
        'has_overseas_child',
        'BOOLEAN',
        FALSE,
        FALSE,
        FALSE,
        '[true, false]',
        '0.03',
        2,
        '2026-06-26 09:02:00'
    ),
    (
        'f1100000-0000-0000-0000-000000000022',
        'f1100000-0000-0000-0000-000000000002',
        'child_age',
        'INTEGER',
        TRUE,
        FALSE,
        FALSE,
        '[14, 16, 18, 21]',
        '0.12',
        25,
        '2026-06-26 09:02:00'
    ),
    (
        'f1100000-0000-0000-0000-000000000023',
        'f1100000-0000-0000-0000-000000000002',
        'overseas_school_country',
        'VARCHAR(50)',
        TRUE,
        FALSE,
        FALSE,
        '["美国", "英国", "中国香港", "澳大利亚"]',
        '0.18',
        42,
        '2026-06-26 09:02:00'
    ),
    (
        'f2200000-0000-0000-0000-000000000011',
        'f2200000-0000-0000-0000-000000000001',
        'education_payment_flag',
        'BOOLEAN',
        FALSE,
        FALSE,
        FALSE,
        '[true, false]',
        '0.00',
        2,
        '2026-06-26 09:02:00'
    ),
    (
        'f2200000-0000-0000-0000-000000000012',
        'f2200000-0000-0000-0000-000000000001',
        'remittance_purpose',
        'VARCHAR(100)',
        TRUE,
        FALSE,
        FALSE,
        '["留学学费", "住宿费", "生活费", "旅游消费"]',
        '0.04',
        35,
        '2026-06-26 09:02:00'
    ),
    (
        'f2200000-0000-0000-0000-000000000013',
        'f2200000-0000-0000-0000-000000000001',
        'target_country',
        'VARCHAR(50)',
        TRUE,
        FALSE,
        FALSE,
        '["美国", "英国", "中国香港", "加拿大"]',
        '0.01',
        52,
        '2026-06-26 09:02:00'
    ),
    (
        'f2200000-0000-0000-0000-000000000021',
        'f2200000-0000-0000-0000-000000000002',
        'swift_code',
        'VARCHAR(20)',
        TRUE,
        FALSE,
        FALSE,
        '["HSBCHKHHHKH", "BOFAUS3N", "MIDLGB22"]',
        '0.02',
        480,
        '2026-06-26 09:02:00'
    ),
    (
        'f3300000-0000-0000-0000-000000000011',
        'f3300000-0000-0000-0000-000000000001',
        'education_event_score',
        'INTEGER',
        FALSE,
        FALSE,
        FALSE,
        '[95, 82, 68, 34]',
        '0.05',
        101,
        '2026-06-26 09:02:00'
    ),
    (
        'f3300000-0000-0000-0000-000000000012',
        'f3300000-0000-0000-0000-000000000001',
        'event_keyword',
        'VARCHAR(100)',
        TRUE,
        FALSE,
        FALSE,
        '["留学汇款", "境外缴费", "香港账户", "雅思"]',
        '0.08',
        160,
        '2026-06-26 09:02:00'
    ),
    (
        'f4400000-0000-0000-0000-000000000011',
        'f4400000-0000-0000-0000-000000000001',
        'consent_status',
        'VARCHAR(20)',
        FALSE,
        FALSE,
        FALSE,
        '["granted", "revoked", "expired"]',
        '0.00',
        3,
        '2026-06-26 09:02:00'
    ),
    (
        'f4400000-0000-0000-0000-000000000012',
        'f4400000-0000-0000-0000-000000000001',
        'channel_allowed',
        'VARCHAR(50)',
        TRUE,
        FALSE,
        FALSE,
        '["app", "sms", "phone", "none"]',
        '0.02',
        8,
        '2026-06-26 09:02:00'
    ),
    (
        'f4400000-0000-0000-0000-000000000013',
        'f4400000-0000-0000-0000-000000000001',
        'valid_until',
        'DATE',
        TRUE,
        FALSE,
        FALSE,
        '["2026-12-31", "2027-06-30"]',
        '0.06',
        730,
        '2026-06-26 09:02:00'
    ),
    (
        'f4400000-0000-0000-0000-000000000021',
        'f4400000-0000-0000-0000-000000000002',
        'compliance_status',
        'VARCHAR(20)',
        FALSE,
        FALSE,
        FALSE,
        '["已审核", "待补件", "异常"]',
        '0.00',
        3,
        '2026-06-26 09:02:00'
    )
ON CONFLICT (id) DO UPDATE SET
    table_id = EXCLUDED.table_id,
    column_name = EXCLUDED.column_name,
    data_type = EXCLUDED.data_type,
    is_nullable = EXCLUDED.is_nullable,
    is_primary_key = EXCLUDED.is_primary_key,
    is_foreign_key = EXCLUDED.is_foreign_key,
    sample_values = EXCLUDED.sample_values,
    null_ratio = EXCLUDED.null_ratio,
    distinct_count = EXCLUDED.distinct_count;

INSERT INTO annotations (
    id, target_type, target_id, tag_category, tag_value, confidence,
    evidence, source, status, created_by, approved_by, created_at, reviewed_at
) VALUES
    (
        'ad100000-0000-0000-0000-000000000001',
        'table',
        'f1100000-0000-0000-0000-000000000001',
        'domain',
        '客户信息',
        '98%',
        '客户全景视图包含留学意向分、AUM和客户层级，是圈选主表。',
        'agent',
        'approved',
        'agent',
        'demo-reviewer',
        '2026-06-26 09:03:00',
        '2026-06-26 09:04:00'
    ),
    (
        'ad100000-0000-0000-0000-000000000002',
        'table',
        'f1100000-0000-0000-0000-000000000002',
        'business',
        '留学家庭证据',
        '96%',
        '家庭教育关系表可验证是否有境外就读子女。',
        'agent',
        'approved',
        'agent',
        'demo-reviewer',
        '2026-06-26 09:03:00',
        '2026-06-26 09:04:00'
    ),
    (
        'ad100000-0000-0000-0000-000000000003',
        'table',
        'f2200000-0000-0000-0000-000000000001',
        'business',
        '跨境教育交易',
        '97%',
        '跨境教育交易表记录留学缴费、生活费汇款和币种信息。',
        'agent',
        'approved',
        'agent',
        'demo-reviewer',
        '2026-06-26 09:03:00',
        '2026-06-26 09:04:00'
    ),
    (
        'ad100000-0000-0000-0000-000000000004',
        'table',
        'f4400000-0000-0000-0000-000000000001',
        'compliance',
        '营销授权',
        '99%',
        '营销触达必须检查授权状态、渠道和有效期。',
        'agent',
        'approved',
        'agent',
        'demo-reviewer',
        '2026-06-26 09:03:00',
        '2026-06-26 09:04:00'
    ),
    (
        'ad100000-0000-0000-0000-000000000005',
        'column',
        'f1100000-0000-0000-0000-000000000012',
        'sensitivity',
        'Financial',
        '95%',
        'AUM余额属于财务资产字段，展示前需按权限脱敏。',
        'agent',
        'approved',
        'agent',
        'demo-reviewer',
        '2026-06-26 09:03:00',
        '2026-06-26 09:04:00'
    );

-- ============================================================
-- 2. Knowledge documents used by the journey
-- ============================================================

INSERT INTO uploaded_documents (
    id, filename, file_type, file_size, category, storage_path, status,
    content_text, extracted_tags, extracted_entities, extracted_triples,
    summary, error_message, created_at, updated_at
) VALUES
    (
        'e5500000-0000-0000-0000-000000000001',
        '留学金融综合服务方案',
        'knowledge',
        0,
        '客群分析',
        NULL,
        'completed',
        $content$面向有子女海外就读或准备申请境外学校的零售客户，银行可提供留学汇款、境外教育缴费、外汇兑换、国际信用卡、留学保证金和家庭资产配置服务。核心目标客群为有留学需求、高净值或财富客户、具备营销授权且近期有教育咨询或跨境交易行为的客户。$content$,
        $json$[{"name":"有留学需求","category":"行为意向","confidence":96,"reason":"方案反复描述留学申请、教育缴费和跨境金融需求"},{"name":"留学金融潜客","category":"客群标签","confidence":94,"reason":"可由留学需求、高净值和触达授权组合生成"},{"name":"有外汇需求","category":"产品需求","confidence":89,"reason":"场景需要换汇和跨境汇款"}]$json$,
        $json$[{"name":"留学汇款","type":"product","mentions":2},{"name":"境外教育缴费","type":"product","mentions":1},{"name":"留学金融潜客","type":"concept","mentions":1}]$json$,
        $json$[{"subject":"留学金融潜客","predicate":"需要","object":"留学汇款服务"},{"subject":"留学金融潜客","predicate":"由标签组合生成","object":"有留学需求 AND 高净值客户 AND 营销可触达"}]$json$,
        '方案定义留学金融目标客群、可推荐产品以及从知识到标签再到圈选的业务闭环。',
        NULL,
        '2026-06-26 09:05:00',
        '2026-06-26 09:06:00'
    ),
    (
        'e5500000-0000-0000-0000-000000000002',
        '跨境留学汇款政策要点',
        'knowledge',
        0,
        '法规政策',
        NULL,
        'completed',
        $content$留学汇款应核验境外院校、缴费通知、收款账户和购汇用途。个人年度便利化额度内可按留学教育用途办理，超出额度或存在异常交易频率时需补充材料并进入合规复核。$content$,
        $json$[{"name":"留学汇款","category":"交易特征","confidence":95,"reason":"政策围绕留学教育用途的跨境汇款办理"},{"name":"跨境汇款活跃","category":"交易特征","confidence":88,"reason":"异常频率与跨境汇款活跃度相关"},{"name":"合规复核","category":"合规授权","confidence":86,"reason":"涉及补件和复核要求"}]$json$,
        $json$[{"name":"境外院校","type":"org","mentions":1},{"name":"购汇用途","type":"concept","mentions":1},{"name":"合规复核","type":"event","mentions":1}]$json$,
        $json$[{"subject":"留学汇款","predicate":"需要核验","object":"境外院校和缴费通知"},{"subject":"异常交易频率","predicate":"触发","object":"合规复核"}]$json$,
        '政策知识为留学汇款标签和跨境合规证据提供依据。',
        NULL,
        '2026-06-26 09:05:30',
        '2026-06-26 09:06:30'
    ),
    (
        'e5500000-0000-0000-0000-000000000003',
        '境外教育缴费产品说明',
        'knowledge',
        0,
        '产品说明',
        NULL,
        'completed',
        $content$境外教育缴费产品支持向海外学校、语言考试机构和住宿服务商付款。产品适用于已有录取通知、缴费账单或近期频繁浏览留学缴费内容的客户，可与外汇预约、手续费优惠和到账提醒组合营销。$content$,
        $json$[{"name":"海外院校缴费偏好","category":"产品需求","confidence":92,"reason":"文本描述对学校和考试机构付款偏好"},{"name":"有留学需求","category":"行为意向","confidence":90,"reason":"缴费账单和内容浏览是留学需求证据"},{"name":"有外汇需求","category":"产品需求","confidence":84,"reason":"产品可与外汇预约组合"}]$json$,
        $json$[{"name":"海外学校","type":"org","mentions":1},{"name":"语言考试机构","type":"org","mentions":1},{"name":"外汇预约","type":"product","mentions":1}]$json$,
        $json$[{"subject":"境外教育缴费","predicate":"适用于","object":"已有录取通知或缴费账单客户"},{"subject":"境外教育缴费","predicate":"可组合","object":"外汇预约和手续费优惠"}]$json$,
        '产品说明可生成海外院校缴费偏好、有留学需求和有外汇需求等候选标签。',
        NULL,
        '2026-06-26 09:05:40',
        '2026-06-26 09:06:40'
    ),
    (
        'e5500000-0000-0000-0000-000000000004',
        '留学信用卡与外汇服务说明',
        'knowledge',
        0,
        '产品说明',
        NULL,
        'completed',
        $content$留学家庭常关注附属卡、境外消费返现、外币账户、汇率提醒和临时额度。若客户存在境外教育缴费、子女海外就读和较高资产余额，可优先推荐国际信用卡和外汇服务包。$content$,
        $json$[{"name":"跨境消费","category":"行为意向","confidence":88,"reason":"描述境外消费返现和国际信用卡"},{"name":"有留学子女","category":"家庭关系","confidence":86,"reason":"文本出现子女海外就读"},{"name":"高净值客户","category":"资产状况","confidence":80,"reason":"较高资产余额是产品推荐条件"}]$json$,
        $json$[{"name":"国际信用卡","type":"product","mentions":1},{"name":"外币账户","type":"product","mentions":1},{"name":"留学家庭","type":"concept","mentions":1}]$json$,
        $json$[{"subject":"留学家庭","predicate":"关注","object":"附属卡和外币账户"},{"subject":"高资产留学客户","predicate":"可推荐","object":"国际信用卡和外汇服务包"}]$json$,
        '说明文档补充跨境消费、留学子女和高净值产品推荐证据。',
        NULL,
        '2026-06-26 09:05:50',
        '2026-06-26 09:06:50'
    ),
    (
        'e5500000-0000-0000-0000-000000000005',
        '营销授权与客户触达合规规则',
        'knowledge',
        0,
        '合规规则',
        NULL,
        'completed',
        $content$任何留学金融产品营销必须先验证客户营销授权状态。客户需处于 granted 状态，且 app、sms 或 phone 至少一个渠道允许触达，授权有效期不能早于活动结束日期。拒绝授权、授权过期或仅允许服务通知的客户不得进入营销名单。$content$,
        $json$[{"name":"营销可触达","category":"合规授权","confidence":99,"reason":"规则直接定义可营销触达条件"},{"name":"授权过期不可营销","category":"合规授权","confidence":91,"reason":"文本明确授权过期不得进入名单"}]$json$,
        $json$[{"name":"营销授权","type":"concept","mentions":2},{"name":"granted","type":"concept","mentions":1},{"name":"app/sms/phone","type":"concept","mentions":1}]$json$,
        $json$[{"subject":"营销可触达","predicate":"要求","object":"granted 授权状态"},{"subject":"营销可触达","predicate":"要求","object":"至少一个允许触达渠道"},{"subject":"授权过期客户","predicate":"不得进入","object":"营销名单"}]$json$,
        '合规规则明确营销可触达标签的业务定义、规则和排除条件。',
        NULL,
        '2026-06-26 09:05:55',
        '2026-06-26 09:06:55'
    )
ON CONFLICT (id) DO UPDATE SET
    filename = EXCLUDED.filename,
    file_type = EXCLUDED.file_type,
    file_size = EXCLUDED.file_size,
    category = EXCLUDED.category,
    status = EXCLUDED.status,
    content_text = EXCLUDED.content_text,
    extracted_tags = EXCLUDED.extracted_tags,
    extracted_entities = EXCLUDED.extracted_entities,
    extracted_triples = EXCLUDED.extracted_triples,
    summary = EXCLUDED.summary,
    error_message = EXCLUDED.error_message,
    updated_at = EXCLUDED.updated_at;

-- ============================================================
-- 3. Categories and tag definitions
--    Existing tags are reused by value when present; missing tags are created.
-- ============================================================

DO $$
DECLARE
    v_category_id VARCHAR(36);
    v_tag_id VARCHAR(36);
BEGIN
    INSERT INTO tag_categories (id, name, is_system, created_at) VALUES
        ('c1000000-0000-0000-0000-000000000001', '基础属性', TRUE, '2026-06-26 09:07:00'),
        ('c1000000-0000-0000-0000-000000000002', '家庭关系', TRUE, '2026-06-26 09:07:00'),
        ('c1000000-0000-0000-0000-000000000003', '行为意向', TRUE, '2026-06-26 09:07:00'),
        ('c1000000-0000-0000-0000-000000000004', '资产状况', TRUE, '2026-06-26 09:07:00'),
        ('c1000000-0000-0000-0000-000000000005', '产品需求', TRUE, '2026-06-26 09:07:00'),
        ('c1000000-0000-0000-0000-000000000006', '交易特征', TRUE, '2026-06-26 09:07:00'),
        ('c1000000-0000-0000-0000-000000000007', '合规授权', FALSE, '2026-06-26 09:07:00'),
        ('c1000000-0000-0000-0000-000000000008', '客群标签', FALSE, '2026-06-26 09:07:00')
    ON CONFLICT (name) DO UPDATE SET
        is_system = EXCLUDED.is_system;

    -- CHINA用户
    SELECT id INTO v_category_id FROM tag_categories WHERE name = '基础属性' LIMIT 1;
    SELECT id INTO v_tag_id FROM tag_definitions WHERE value = 'CHINA用户' LIMIT 1;
    IF v_tag_id IS NULL THEN
        v_tag_id := 'd1000000-0000-0000-0000-000000000001';
        INSERT INTO tag_definitions (id, category_id, value, description, color, is_active, created_at)
        VALUES (v_tag_id, v_category_id, 'CHINA用户', '中国大陆开户或常住客户识别标签。', '#1565c0', TRUE, '2026-06-26 09:08:00');
    ELSE
        UPDATE tag_definitions
        SET category_id = v_category_id, description = '中国大陆开户或常住客户识别标签。', color = '#1565c0', is_active = TRUE
        WHERE id = v_tag_id;
    END IF;
    INSERT INTO demo_study_abroad_ids VALUES ('tag', 'CHINA用户', v_tag_id) ON CONFLICT (kind, key) DO UPDATE SET id = EXCLUDED.id;

    -- 有香港账户
    SELECT id INTO v_category_id FROM tag_categories WHERE name = '基础属性' LIMIT 1;
    SELECT id INTO v_tag_id FROM tag_definitions WHERE value = '有香港账户' LIMIT 1;
    IF v_tag_id IS NULL THEN
        v_tag_id := 'd1000000-0000-0000-0000-000000000002';
        INSERT INTO tag_definitions (id, category_id, value, description, color, is_active, created_at)
        VALUES (v_tag_id, v_category_id, '有香港账户', '客户持有中国香港地区账户或港币结算账户。', '#2e7d32', TRUE, '2026-06-26 09:08:00');
    ELSE
        UPDATE tag_definitions
        SET category_id = v_category_id, description = '客户持有中国香港地区账户或港币结算账户。', color = '#2e7d32', is_active = TRUE
        WHERE id = v_tag_id;
    END IF;
    INSERT INTO demo_study_abroad_ids VALUES ('tag', '有香港账户', v_tag_id) ON CONFLICT (kind, key) DO UPDATE SET id = EXCLUDED.id;

    -- 有适龄儿童
    SELECT id INTO v_category_id FROM tag_categories WHERE name = '家庭关系' LIMIT 1;
    SELECT id INTO v_tag_id FROM tag_definitions WHERE value = '有适龄儿童' LIMIT 1;
    IF v_tag_id IS NULL THEN
        v_tag_id := 'd1000000-0000-0000-0000-000000000003';
        INSERT INTO tag_definitions (id, category_id, value, description, color, is_active, created_at)
        VALUES (v_tag_id, v_category_id, '有适龄儿童', '家庭资料显示有 12-21 岁子女，可作为留学规划前置信号。', '#7b1fa2', TRUE, '2026-06-26 09:08:00');
    ELSE
        UPDATE tag_definitions
        SET category_id = v_category_id, description = '家庭资料显示有 12-21 岁子女，可作为留学规划前置信号。', color = '#7b1fa2', is_active = TRUE
        WHERE id = v_tag_id;
    END IF;
    INSERT INTO demo_study_abroad_ids VALUES ('tag', '有适龄儿童', v_tag_id) ON CONFLICT (kind, key) DO UPDATE SET id = EXCLUDED.id;

    -- 有留学子女
    SELECT id INTO v_category_id FROM tag_categories WHERE name = '家庭关系' LIMIT 1;
    SELECT id INTO v_tag_id FROM tag_definitions WHERE value = '有留学子女' LIMIT 1;
    IF v_tag_id IS NULL THEN
        v_tag_id := 'd1000000-0000-0000-0000-000000000004';
        INSERT INTO tag_definitions (id, category_id, value, description, color, is_active, created_at)
        VALUES (v_tag_id, v_category_id, '有留学子女', '家庭教育关系显示客户子女正在境外院校就读。', '#6a1b9a', TRUE, '2026-06-26 09:08:00');
    ELSE
        UPDATE tag_definitions
        SET category_id = v_category_id, description = '家庭教育关系显示客户子女正在境外院校就读。', color = '#6a1b9a', is_active = TRUE
        WHERE id = v_tag_id;
    END IF;
    INSERT INTO demo_study_abroad_ids VALUES ('tag', '有留学子女', v_tag_id) ON CONFLICT (kind, key) DO UPDATE SET id = EXCLUDED.id;

    -- 有留学需求
    SELECT id INTO v_category_id FROM tag_categories WHERE name = '行为意向' LIMIT 1;
    SELECT id INTO v_tag_id FROM tag_definitions WHERE value = '有留学需求' LIMIT 1;
    IF v_tag_id IS NULL THEN
        v_tag_id := 'd1000000-0000-0000-0000-000000000005';
        INSERT INTO tag_definitions (id, category_id, value, description, color, is_active, created_at)
        VALUES (v_tag_id, v_category_id, '有留学需求', '客户近期存在留学咨询、境外教育缴费或相关内容浏览行为。', '#e65100', TRUE, '2026-06-26 09:08:00');
    ELSE
        UPDATE tag_definitions
        SET category_id = v_category_id, description = '客户近期存在留学咨询、境外教育缴费或相关内容浏览行为。', color = '#e65100', is_active = TRUE
        WHERE id = v_tag_id;
    END IF;
    INSERT INTO demo_study_abroad_ids VALUES ('tag', '有留学需求', v_tag_id) ON CONFLICT (kind, key) DO UPDATE SET id = EXCLUDED.id;

    -- 高净值客户
    SELECT id INTO v_category_id FROM tag_categories WHERE name = '资产状况' LIMIT 1;
    SELECT id INTO v_tag_id FROM tag_definitions WHERE value = '高净值客户' LIMIT 1;
    IF v_tag_id IS NULL THEN
        v_tag_id := 'd1000000-0000-0000-0000-000000000006';
        INSERT INTO tag_definitions (id, category_id, value, description, color, is_active, created_at)
        VALUES (v_tag_id, v_category_id, '高净值客户', 'AUM 余额大于 600 万或私行/财富层级客户。', '#c62828', TRUE, '2026-06-26 09:08:00');
    ELSE
        UPDATE tag_definitions
        SET category_id = v_category_id, description = 'AUM 余额大于 600 万或私行/财富层级客户。', color = '#c62828', is_active = TRUE
        WHERE id = v_tag_id;
    END IF;
    INSERT INTO demo_study_abroad_ids VALUES ('tag', '高净值客户', v_tag_id) ON CONFLICT (kind, key) DO UPDATE SET id = EXCLUDED.id;

    -- 有外汇需求
    SELECT id INTO v_category_id FROM tag_categories WHERE name = '产品需求' LIMIT 1;
    SELECT id INTO v_tag_id FROM tag_definitions WHERE value = '有外汇需求' LIMIT 1;
    IF v_tag_id IS NULL THEN
        v_tag_id := 'd1000000-0000-0000-0000-000000000007';
        INSERT INTO tag_definitions (id, category_id, value, description, color, is_active, created_at)
        VALUES (v_tag_id, v_category_id, '有外汇需求', '存在购汇、换汇预约、外币账户或跨境付款需求。', '#00838f', TRUE, '2026-06-26 09:08:00');
    ELSE
        UPDATE tag_definitions
        SET category_id = v_category_id, description = '存在购汇、换汇预约、外币账户或跨境付款需求。', color = '#00838f', is_active = TRUE
        WHERE id = v_tag_id;
    END IF;
    INSERT INTO demo_study_abroad_ids VALUES ('tag', '有外汇需求', v_tag_id) ON CONFLICT (kind, key) DO UPDATE SET id = EXCLUDED.id;

    -- 跨境消费
    SELECT id INTO v_category_id FROM tag_categories WHERE name = '行为意向' LIMIT 1;
    SELECT id INTO v_tag_id FROM tag_definitions WHERE value = '跨境消费' LIMIT 1;
    IF v_tag_id IS NULL THEN
        v_tag_id := 'd1000000-0000-0000-0000-000000000008';
        INSERT INTO tag_definitions (id, category_id, value, description, color, is_active, created_at)
        VALUES (v_tag_id, v_category_id, '跨境消费', '近 180 天存在境外消费、境外刷卡或外币支付行为。', '#5d4037', TRUE, '2026-06-26 09:08:00');
    ELSE
        UPDATE tag_definitions
        SET category_id = v_category_id, description = '近 180 天存在境外消费、境外刷卡或外币支付行为。', color = '#5d4037', is_active = TRUE
        WHERE id = v_tag_id;
    END IF;
    INSERT INTO demo_study_abroad_ids VALUES ('tag', '跨境消费', v_tag_id) ON CONFLICT (kind, key) DO UPDATE SET id = EXCLUDED.id;

    -- 留学汇款
    SELECT id INTO v_category_id FROM tag_categories WHERE name = '交易特征' LIMIT 1;
    SELECT id INTO v_tag_id FROM tag_definitions WHERE value = '留学汇款' LIMIT 1;
    IF v_tag_id IS NULL THEN
        v_tag_id := 'd1000000-0000-0000-0000-000000000009';
        INSERT INTO tag_definitions (id, category_id, value, description, color, is_active, created_at)
        VALUES (v_tag_id, v_category_id, '留学汇款', '有向境外院校、考试机构或住宿服务方汇款记录。', '#f57f17', TRUE, '2026-06-26 09:08:00');
    ELSE
        UPDATE tag_definitions
        SET category_id = v_category_id, description = '有向境外院校、考试机构或住宿服务方汇款记录。', color = '#f57f17', is_active = TRUE
        WHERE id = v_tag_id;
    END IF;
    INSERT INTO demo_study_abroad_ids VALUES ('tag', '留学汇款', v_tag_id) ON CONFLICT (kind, key) DO UPDATE SET id = EXCLUDED.id;

    -- 跨境汇款活跃
    SELECT id INTO v_category_id FROM tag_categories WHERE name = '交易特征' LIMIT 1;
    SELECT id INTO v_tag_id FROM tag_definitions WHERE value = '跨境汇款活跃' LIMIT 1;
    IF v_tag_id IS NULL THEN
        v_tag_id := 'd1000000-0000-0000-0000-000000000010';
        INSERT INTO tag_definitions (id, category_id, value, description, color, is_active, created_at)
        VALUES (v_tag_id, v_category_id, '跨境汇款活跃', '近 90 天跨境汇款频次或金额高于同类客户。', '#ef6c00', TRUE, '2026-06-26 09:08:00');
    ELSE
        UPDATE tag_definitions
        SET category_id = v_category_id, description = '近 90 天跨境汇款频次或金额高于同类客户。', color = '#ef6c00', is_active = TRUE
        WHERE id = v_tag_id;
    END IF;
    INSERT INTO demo_study_abroad_ids VALUES ('tag', '跨境汇款活跃', v_tag_id) ON CONFLICT (kind, key) DO UPDATE SET id = EXCLUDED.id;

    -- 营销可触达
    SELECT id INTO v_category_id FROM tag_categories WHERE name = '合规授权' LIMIT 1;
    SELECT id INTO v_tag_id FROM tag_definitions WHERE value = '营销可触达' LIMIT 1;
    IF v_tag_id IS NULL THEN
        v_tag_id := 'd1000000-0000-0000-0000-000000000011';
        INSERT INTO tag_definitions (id, category_id, value, description, color, is_active, created_at)
        VALUES (v_tag_id, v_category_id, '营销可触达', '客户授权状态为 granted，且至少有一个可用触达渠道，授权仍在有效期内。', '#00695c', TRUE, '2026-06-26 09:17:00');
    ELSE
        UPDATE tag_definitions
        SET category_id = v_category_id, description = '客户授权状态为 granted，且至少有一个可用触达渠道，授权仍在有效期内。', color = '#00695c', is_active = TRUE
        WHERE id = v_tag_id;
    END IF;
    INSERT INTO demo_study_abroad_ids VALUES ('tag', '营销可触达', v_tag_id) ON CONFLICT (kind, key) DO UPDATE SET id = EXCLUDED.id;

    -- 海外院校缴费偏好
    SELECT id INTO v_category_id FROM tag_categories WHERE name = '产品需求' LIMIT 1;
    SELECT id INTO v_tag_id FROM tag_definitions WHERE value = '海外院校缴费偏好' LIMIT 1;
    IF v_tag_id IS NULL THEN
        v_tag_id := 'd1000000-0000-0000-0000-000000000012';
        INSERT INTO tag_definitions (id, category_id, value, description, color, is_active, created_at)
        VALUES (v_tag_id, v_category_id, '海外院校缴费偏好', '客户近期浏览或咨询境外学校、考试机构、住宿缴费产品。', '#3949ab', TRUE, '2026-06-26 09:18:00');
    ELSE
        UPDATE tag_definitions
        SET category_id = v_category_id, description = '客户近期浏览或咨询境外学校、考试机构、住宿缴费产品。', color = '#3949ab', is_active = TRUE
        WHERE id = v_tag_id;
    END IF;
    INSERT INTO demo_study_abroad_ids VALUES ('tag', '海外院校缴费偏好', v_tag_id) ON CONFLICT (kind, key) DO UPDATE SET id = EXCLUDED.id;

    -- 留学金融潜客
    SELECT id INTO v_category_id FROM tag_categories WHERE name = '客群标签' LIMIT 1;
    SELECT id INTO v_tag_id FROM tag_definitions WHERE value = '留学金融潜客' LIMIT 1;
    IF v_tag_id IS NULL THEN
        v_tag_id := 'd1000000-0000-0000-0000-000000000013';
        INSERT INTO tag_definitions (id, category_id, value, description, color, is_active, created_at)
        VALUES (v_tag_id, v_category_id, '留学金融潜客', '由有留学需求、有留学子女、营销可触达及资产/外汇信号组合生成的目标客群标签。', '#283593', TRUE, '2026-06-26 09:20:00');
    ELSE
        UPDATE tag_definitions
        SET category_id = v_category_id, description = '由有留学需求、有留学子女、营销可触达及资产/外汇信号组合生成的目标客群标签。', color = '#283593', is_active = TRUE
        WHERE id = v_tag_id;
    END IF;
    INSERT INTO demo_study_abroad_ids VALUES ('tag', '留学金融潜客', v_tag_id) ON CONFLICT (kind, key) DO UPDATE SET id = EXCLUDED.id;
END $$;

-- ============================================================
-- 4. Published versions and data bindings
-- ============================================================

INSERT INTO tag_versions (id, tag_id, version_no, rules, status, created_by, created_at) VALUES
    (
        'v7100000-0000-0000-0000-000000000001',
        (SELECT id FROM demo_study_abroad_ids WHERE kind = 'tag' AND key = '有留学需求'),
        'v1',
        '[{"field":"study_abroad_intent_score","operator":">=","value":60,"join":"AND"},{"field":"education_event_score","operator":">=","value":60,"join":"OR"}]',
        'active',
        'demo-product',
        '2026-06-26 09:10:00'
    ),
    (
        'v7100000-0000-0000-0000-000000000002',
        (SELECT id FROM demo_study_abroad_ids WHERE kind = 'tag' AND key = '有留学子女'),
        'v1',
        '[{"field":"has_overseas_child","operator":"=","value":true,"join":"AND"}]',
        'active',
        'demo-product',
        '2026-06-26 09:10:00'
    ),
    (
        'v7100000-0000-0000-0000-000000000003',
        (SELECT id FROM demo_study_abroad_ids WHERE kind = 'tag' AND key = '留学汇款'),
        'v1',
        '[{"field":"education_payment_flag","operator":"=","value":true,"join":"AND"},{"field":"remittance_purpose","operator":"IN","value":["留学学费","住宿费","生活费"],"join":"AND"}]',
        'active',
        'demo-product',
        '2026-06-26 09:10:00'
    ),
    (
        'v7100000-0000-0000-0000-000000000004',
        (SELECT id FROM demo_study_abroad_ids WHERE kind = 'tag' AND key = '高净值客户'),
        'v1',
        '[{"field":"aum_balance","operator":">=","value":6000000,"join":"OR"},{"field":"customer_tier","operator":"IN","value":["私行","财富"],"join":"OR"}]',
        'active',
        'demo-product',
        '2026-06-26 09:10:00'
    ),
    (
        'v7100000-0000-0000-0000-000000000005',
        (SELECT id FROM demo_study_abroad_ids WHERE kind = 'tag' AND key = '有外汇需求'),
        'v1',
        '[{"field":"target_country","operator":"IS_NULL","value":false,"join":"AND"},{"field":"remittance_purpose","operator":"CONTAINS","value":"留学","join":"AND"}]',
        'active',
        'demo-product',
        '2026-06-26 09:10:00'
    ),
    (
        'v7100000-0000-0000-0000-000000000006',
        (SELECT id FROM demo_study_abroad_ids WHERE kind = 'tag' AND key = '营销可触达'),
        'v1',
        '[{"field":"consent_status","operator":"=","value":"granted","join":"AND"},{"field":"channel_allowed","operator":"IN","value":["app","sms","phone"],"join":"AND"},{"field":"valid_until","operator":">=","value":"2026-12-31","join":"AND"}]',
        'active',
        'demo-product',
        '2026-06-26 09:18:00'
    ),
    (
        'v7100000-0000-0000-0000-000000000007',
        (SELECT id FROM demo_study_abroad_ids WHERE kind = 'tag' AND key = '海外院校缴费偏好'),
        'v1',
        '[{"field":"event_keyword","operator":"IN","value":["境外缴费","留学缴费","海外学校"],"join":"AND"},{"field":"education_event_score","operator":">=","value":70,"join":"AND"}]',
        'active',
        'demo-product',
        '2026-06-26 09:18:30'
    ),
    (
        'v7100000-0000-0000-0000-000000000008',
        (SELECT id FROM demo_study_abroad_ids WHERE kind = 'tag' AND key = '留学金融潜客'),
        'v1',
        '[{"field":"study_abroad_intent_score","operator":">=","value":70,"join":"AND"},{"field":"has_overseas_child","operator":"=","value":true,"join":"AND"},{"field":"marketing_contactable","operator":"=","value":true,"join":"AND"},{"field":"aum_balance","operator":">=","value":500000,"join":"AND"}]',
        'active',
        'demo-product',
        '2026-06-26 09:21:00'
    )
ON CONFLICT (id) DO UPDATE SET
    tag_id = EXCLUDED.tag_id,
    version_no = EXCLUDED.version_no,
    rules = EXCLUDED.rules,
    status = EXCLUDED.status,
    created_by = EXCLUDED.created_by,
    created_at = EXCLUDED.created_at;

INSERT INTO tag_approvals (
    id, version_id, approver_role, status, comments, approved_by, approved_at, created_at
) VALUES
    (
        'ap710000-0000-0000-0000-000000000001',
        'v7100000-0000-0000-0000-000000000006',
        'compliance',
        'approved',
        '营销触达规则已按授权状态、渠道和有效期校验。',
        'demo-compliance',
        '2026-06-26 09:18:40',
        '2026-06-26 09:18:00'
    ),
    (
        'ap710000-0000-0000-0000-000000000002',
        'v7100000-0000-0000-0000-000000000008',
        'business_owner',
        'approved',
        '客群定义与留学汇款产品推荐场景一致。',
        'demo-business-owner',
        '2026-06-26 09:21:20',
        '2026-06-26 09:21:00'
    ),
    (
        'ap710000-0000-0000-0000-000000000003',
        'v7100000-0000-0000-0000-000000000008',
        'data_owner',
        'approved',
        '证据表质量分满足发布阈值，样本验证已通过。',
        'demo-data-owner',
        '2026-06-26 09:21:25',
        '2026-06-26 09:21:00'
    )
ON CONFLICT (id) DO UPDATE SET
    version_id = EXCLUDED.version_id,
    approver_role = EXCLUDED.approver_role,
    status = EXCLUDED.status,
    comments = EXCLUDED.comments,
    approved_by = EXCLUDED.approved_by,
    approved_at = EXCLUDED.approved_at;

INSERT INTO tag_releases (id, version_id, release_type, status, executed_by, created_at) VALUES
    ('rl710000-0000-0000-0000-000000000001', 'v7100000-0000-0000-0000-000000000006', 'full', 'success', 'demo-product', '2026-06-26 09:19:00'),
    ('rl710000-0000-0000-0000-000000000002', 'v7100000-0000-0000-0000-000000000007', 'full', 'success', 'demo-product', '2026-06-26 09:19:10'),
    ('rl710000-0000-0000-0000-000000000003', 'v7100000-0000-0000-0000-000000000008', 'full', 'success', 'demo-product', '2026-06-26 09:21:30')
ON CONFLICT (id) DO UPDATE SET
    version_id = EXCLUDED.version_id,
    release_type = EXCLUDED.release_type,
    status = EXCLUDED.status,
    executed_by = EXCLUDED.executed_by,
    created_at = EXCLUDED.created_at;

-- Bindings below reference development tasks through an FK, so ensure task
-- shells exist before tag_bindings are inserted. Section 5 upserts full details.
INSERT INTO tag_development_tasks (
    id, name, goal, status, creator_id, created_at, updated_at
) VALUES
    (
        't8100000-0000-0000-0000-000000000001',
        '营销可触达',
        '补齐留学金融营销名单的合规授权标签，确保客户授权状态、渠道和有效期满足触达要求。',
        'published',
        'demo-product-owner',
        '2026-06-26 09:13:00',
        '2026-06-26 09:19:00'
    ),
    (
        't8100000-0000-0000-0000-000000000002',
        '留学金融潜客',
        '组合有留学需求、有留学子女、营销可触达和资产/外汇信号，形成可直接用于产品推荐的客群标签。',
        'published',
        'demo-product-owner',
        '2026-06-26 09:14:00',
        '2026-06-26 09:21:30'
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    goal = EXCLUDED.goal,
    status = EXCLUDED.status,
    creator_id = EXCLUDED.creator_id,
    updated_at = EXCLUDED.updated_at;

INSERT INTO tag_bindings (
    id, tag_id, target_type, target_id, binding_type, task_id, created_at
) VALUES
    ('bd710000-0000-0000-0000-000000000001', (SELECT id FROM demo_study_abroad_ids WHERE kind = 'tag' AND key = '有留学需求'), 'column', 'f1100000-0000-0000-0000-000000000011', 'auto', NULL, '2026-06-26 09:11:00'),
    ('bd710000-0000-0000-0000-000000000002', (SELECT id FROM demo_study_abroad_ids WHERE kind = 'tag' AND key = '有留学需求'), 'column', 'f3300000-0000-0000-0000-000000000011', 'auto', NULL, '2026-06-26 09:11:00'),
    ('bd710000-0000-0000-0000-000000000003', (SELECT id FROM demo_study_abroad_ids WHERE kind = 'tag' AND key = '有留学子女'), 'column', 'f1100000-0000-0000-0000-000000000021', 'auto', NULL, '2026-06-26 09:11:00'),
    ('bd710000-0000-0000-0000-000000000004', (SELECT id FROM demo_study_abroad_ids WHERE kind = 'tag' AND key = '留学汇款'), 'column', 'f2200000-0000-0000-0000-000000000011', 'auto', NULL, '2026-06-26 09:11:00'),
    ('bd710000-0000-0000-0000-000000000005', (SELECT id FROM demo_study_abroad_ids WHERE kind = 'tag' AND key = '留学汇款'), 'column', 'f2200000-0000-0000-0000-000000000012', 'auto', NULL, '2026-06-26 09:11:00'),
    ('bd710000-0000-0000-0000-000000000006', (SELECT id FROM demo_study_abroad_ids WHERE kind = 'tag' AND key = '高净值客户'), 'column', 'f1100000-0000-0000-0000-000000000012', 'auto', NULL, '2026-06-26 09:11:00'),
    ('bd710000-0000-0000-0000-000000000007', (SELECT id FROM demo_study_abroad_ids WHERE kind = 'tag' AND key = '有外汇需求'), 'table', 'f2200000-0000-0000-0000-000000000001', 'auto', NULL, '2026-06-26 09:11:00'),
    ('bd710000-0000-0000-0000-000000000008', (SELECT id FROM demo_study_abroad_ids WHERE kind = 'tag' AND key = '营销可触达'), 'table', 'f4400000-0000-0000-0000-000000000001', 'auto', 't8100000-0000-0000-0000-000000000001', '2026-06-26 09:19:00'),
    ('bd710000-0000-0000-0000-000000000009', (SELECT id FROM demo_study_abroad_ids WHERE kind = 'tag' AND key = '营销可触达'), 'column', 'f4400000-0000-0000-0000-000000000011', 'auto', 't8100000-0000-0000-0000-000000000001', '2026-06-26 09:19:00'),
    ('bd710000-0000-0000-0000-000000000010', (SELECT id FROM demo_study_abroad_ids WHERE kind = 'tag' AND key = '营销可触达'), 'column', 'f4400000-0000-0000-0000-000000000012', 'auto', 't8100000-0000-0000-0000-000000000001', '2026-06-26 09:19:00'),
    ('bd710000-0000-0000-0000-000000000011', (SELECT id FROM demo_study_abroad_ids WHERE kind = 'tag' AND key = '海外院校缴费偏好'), 'table', 'f3300000-0000-0000-0000-000000000001', 'auto', NULL, '2026-06-26 09:19:10'),
    ('bd710000-0000-0000-0000-000000000012', (SELECT id FROM demo_study_abroad_ids WHERE kind = 'tag' AND key = '留学金融潜客'), 'table', 'f1100000-0000-0000-0000-000000000001', 'auto', 't8100000-0000-0000-0000-000000000002', '2026-06-26 09:21:30'),
    ('bd710000-0000-0000-0000-000000000013', (SELECT id FROM demo_study_abroad_ids WHERE kind = 'tag' AND key = '留学金融潜客'), 'table', 'f1100000-0000-0000-0000-000000000002', 'auto', 't8100000-0000-0000-0000-000000000002', '2026-06-26 09:21:30'),
    ('bd710000-0000-0000-0000-000000000014', (SELECT id FROM demo_study_abroad_ids WHERE kind = 'tag' AND key = '留学金融潜客'), 'table', 'f2200000-0000-0000-0000-000000000001', 'auto', 't8100000-0000-0000-0000-000000000002', '2026-06-26 09:21:30'),
    ('bd710000-0000-0000-0000-000000000015', (SELECT id FROM demo_study_abroad_ids WHERE kind = 'tag' AND key = '留学金融潜客'), 'table', 'f4400000-0000-0000-0000-000000000001', 'auto', 't8100000-0000-0000-0000-000000000002', '2026-06-26 09:21:30')
ON CONFLICT (id) DO UPDATE SET
    tag_id = EXCLUDED.tag_id,
    target_type = EXCLUDED.target_type,
    target_id = EXCLUDED.target_id,
    binding_type = EXCLUDED.binding_type,
    task_id = EXCLUDED.task_id,
    created_at = EXCLUDED.created_at;

-- ============================================================
-- 5. Tag package and development workflow for missing tags
-- ============================================================

INSERT INTO tag_packages (
    id, name, business_goal, owner_id, status, delivery_date, created_at, updated_at
) VALUES
    (
        'p9000000-0000-0000-0000-000000000001',
        '留学金融机会发现标签包',
        '找出有子女在国外留学、具备跨境金融需求且允许营销触达的客户，用于留学汇款和外汇服务推荐。',
        'demo-product-owner',
        'delivered',
        '2026-06-26',
        '2026-06-26 09:12:00',
        '2026-06-26 09:22:00'
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    business_goal = EXCLUDED.business_goal,
    owner_id = EXCLUDED.owner_id,
    status = EXCLUDED.status,
    delivery_date = EXCLUDED.delivery_date,
    updated_at = EXCLUDED.updated_at;

INSERT INTO tag_development_tasks (
    id, name, goal, status, creator_id, created_at, updated_at
) VALUES
    (
        't8100000-0000-0000-0000-000000000001',
        '营销可触达',
        '补齐留学金融营销名单的合规授权标签，确保客户授权状态、渠道和有效期满足触达要求。',
        'published',
        'demo-product-owner',
        '2026-06-26 09:13:00',
        '2026-06-26 09:19:00'
    ),
    (
        't8100000-0000-0000-0000-000000000002',
        '留学金融潜客',
        '组合有留学需求、有留学子女、营销可触达和资产/外汇信号，形成可直接用于产品推荐的客群标签。',
        'published',
        'demo-product-owner',
        '2026-06-26 09:14:00',
        '2026-06-26 09:21:30'
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    goal = EXCLUDED.goal,
    status = EXCLUDED.status,
    creator_id = EXCLUDED.creator_id,
    updated_at = EXCLUDED.updated_at;

INSERT INTO tag_draft_versions (
    id, task_id, name, code, category_id, business_definition,
    target_entity, value_type, update_frequency, business_use_case,
    validity_period, owner_id, rules, created_at
) VALUES
    (
        'dv810000-0000-0000-0000-000000000001',
        't8100000-0000-0000-0000-000000000001',
        '营销可触达',
        'MKT_CONTACTABLE',
        (SELECT id FROM tag_categories WHERE name = '合规授权' LIMIT 1),
        '客户授权状态为 granted，且 app、sms 或 phone 至少一个渠道允许触达，授权有效期不早于活动结束日期。',
        'customer',
        'boolean',
        'daily',
        '留学金融产品营销名单准入、触达合规校验、导出前审计。',
        '180d',
        'demo-compliance',
        '[{"field":"consent_status","operator":"=","value":"granted","join":"AND"},{"field":"channel_allowed","operator":"IN","value":["app","sms","phone"],"join":"AND"},{"field":"valid_until","operator":">=","value":"2026-12-31","join":"AND"}]',
        '2026-06-26 09:14:00'
    ),
    (
        'dv810000-0000-0000-0000-000000000002',
        't8100000-0000-0000-0000-000000000002',
        '留学金融潜客',
        'STUDY_ABROAD_PROSPECT',
        (SELECT id FROM tag_categories WHERE name = '客群标签' LIMIT 1),
        '未来半年存在留学金融需求，且具备合规触达条件的客户。',
        'customer',
        'boolean',
        'daily',
        '留学汇款、境外教育缴费、外汇预约和国际信用卡产品推荐。',
        '180d',
        'demo-product-owner',
        '[{"field":"study_abroad_intent_score","operator":">=","value":70,"join":"AND"},{"field":"has_overseas_child","operator":"=","value":true,"join":"AND"},{"field":"marketing_contactable","operator":"=","value":true,"join":"AND"},{"field":"aum_balance","operator":">=","value":500000,"join":"AND"}]',
        '2026-06-26 09:15:00'
    )
ON CONFLICT (id) DO UPDATE SET
    task_id = EXCLUDED.task_id,
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    category_id = EXCLUDED.category_id,
    business_definition = EXCLUDED.business_definition,
    target_entity = EXCLUDED.target_entity,
    value_type = EXCLUDED.value_type,
    update_frequency = EXCLUDED.update_frequency,
    business_use_case = EXCLUDED.business_use_case,
    validity_period = EXCLUDED.validity_period,
    owner_id = EXCLUDED.owner_id,
    rules = EXCLUDED.rules;

INSERT INTO tag_evidences (
    id, task_id, evidence_type, evidence_id, description, details, created_at
) VALUES
    (
        'ev810000-0000-0000-0000-000000000001',
        't8100000-0000-0000-0000-000000000001',
        'table',
        'f4400000-0000-0000-0000-000000000001',
        '营销授权表',
        '{"selected_fields":["consent_status","channel_allowed","valid_until"],"sample_reviewed":true,"warnings_acknowledged":["授权过期客户不得进入名单"]}',
        '2026-06-26 09:15:30'
    ),
    (
        'ev810000-0000-0000-0000-000000000002',
        't8100000-0000-0000-0000-000000000001',
        'column',
        'f4400000-0000-0000-0000-000000000011',
        'consent_status',
        '{"selected_fields":["consent_status"],"sample_reviewed":true,"warnings_acknowledged":[]}',
        '2026-06-26 09:15:30'
    ),
    (
        'ev810000-0000-0000-0000-000000000003',
        't8100000-0000-0000-0000-000000000001',
        'column',
        'f4400000-0000-0000-0000-000000000012',
        'channel_allowed',
        '{"selected_fields":["channel_allowed"],"sample_reviewed":true,"warnings_acknowledged":[]}',
        '2026-06-26 09:15:30'
    ),
    (
        'ev810000-0000-0000-0000-000000000004',
        't8100000-0000-0000-0000-000000000001',
        'column',
        'f4400000-0000-0000-0000-000000000013',
        'valid_until',
        '{"selected_fields":["valid_until"],"sample_reviewed":true,"warnings_acknowledged":[]}',
        '2026-06-26 09:15:30'
    ),
    (
        'ev810000-0000-0000-0000-000000000005',
        't8100000-0000-0000-0000-000000000001',
        'knowledge',
        'e5500000-0000-0000-0000-000000000005',
        '营销授权与客户触达合规规则',
        '{"selected_fields":["营销可触达规则"],"sample_reviewed":true,"warnings_acknowledged":[]}',
        '2026-06-26 09:15:30'
    ),
    (
        'ev810000-0000-0000-0000-000000000006',
        't8100000-0000-0000-0000-000000000002',
        'table',
        'f1100000-0000-0000-0000-000000000001',
        '客户全景视图',
        '{"selected_fields":["study_abroad_intent_score","aum_balance"],"sample_reviewed":true,"warnings_acknowledged":[]}',
        '2026-06-26 09:16:30'
    ),
    (
        'ev810000-0000-0000-0000-000000000007',
        't8100000-0000-0000-0000-000000000002',
        'table',
        'f2200000-0000-0000-0000-000000000001',
        '跨境教育交易表',
        '{"selected_fields":["education_payment_flag","remittance_purpose","target_country"],"sample_reviewed":true,"warnings_acknowledged":[]}',
        '2026-06-26 09:16:30'
    ),
    (
        'ev810000-0000-0000-0000-000000000008',
        't8100000-0000-0000-0000-000000000002',
        'table',
        'f3300000-0000-0000-0000-000000000001',
        '客户互动事件表',
        '{"selected_fields":["education_event_score","event_keyword"],"sample_reviewed":true,"warnings_acknowledged":[]}',
        '2026-06-26 09:16:30'
    ),
    (
        'ev810000-0000-0000-0000-000000000009',
        't8100000-0000-0000-0000-000000000002',
        'table',
        'f4400000-0000-0000-0000-000000000001',
        '营销授权表',
        '{"selected_fields":["marketing_contactable","consent_status"],"sample_reviewed":true,"warnings_acknowledged":["仅服务通知授权不可用于营销"]}',
        '2026-06-26 09:16:30'
    ),
    (
        'ev810000-0000-0000-0000-000000000010',
        't8100000-0000-0000-0000-000000000002',
        'table',
        'f1100000-0000-0000-0000-000000000002',
        '家庭教育关系表',
        '{"selected_fields":["has_overseas_child","child_age","overseas_school_country"],"sample_reviewed":true,"warnings_acknowledged":[]}',
        '2026-06-26 09:16:30'
    ),
    (
        'ev810000-0000-0000-0000-000000000011',
        't8100000-0000-0000-0000-000000000002',
        'column',
        'f1100000-0000-0000-0000-000000000011',
        'study_abroad_intent_score',
        '{"selected_fields":["study_abroad_intent_score"],"sample_reviewed":true,"warnings_acknowledged":[]}',
        '2026-06-26 09:16:30'
    ),
    (
        'ev810000-0000-0000-0000-000000000012',
        't8100000-0000-0000-0000-000000000002',
        'column',
        'f2200000-0000-0000-0000-000000000011',
        'education_payment_flag',
        '{"selected_fields":["education_payment_flag"],"sample_reviewed":true,"warnings_acknowledged":[]}',
        '2026-06-26 09:16:30'
    ),
    (
        'ev810000-0000-0000-0000-000000000013',
        't8100000-0000-0000-0000-000000000002',
        'column',
        'f3300000-0000-0000-0000-000000000011',
        'education_event_score',
        '{"selected_fields":["education_event_score"],"sample_reviewed":true,"warnings_acknowledged":[]}',
        '2026-06-26 09:16:30'
    ),
    (
        'ev810000-0000-0000-0000-000000000014',
        't8100000-0000-0000-0000-000000000002',
        'column',
        'f4400000-0000-0000-0000-000000000011',
        'consent_status',
        '{"selected_fields":["marketing_contactable","consent_status"],"sample_reviewed":true,"warnings_acknowledged":[]}',
        '2026-06-26 09:16:30'
    ),
    (
        'ev810000-0000-0000-0000-000000000015',
        't8100000-0000-0000-0000-000000000002',
        'knowledge',
        'e5500000-0000-0000-0000-000000000001',
        '留学金融综合服务方案',
        '{"selected_fields":["目标客群定义","推荐产品"],"sample_reviewed":true,"warnings_acknowledged":[]}',
        '2026-06-26 09:16:30'
    ),
    (
        'ev810000-0000-0000-0000-000000000016',
        't8100000-0000-0000-0000-000000000002',
        'knowledge',
        'e5500000-0000-0000-0000-000000000002',
        '跨境留学汇款政策要点',
        '{"selected_fields":["汇款用途","合规复核"],"sample_reviewed":true,"warnings_acknowledged":[]}',
        '2026-06-26 09:16:30'
    )
ON CONFLICT (id) DO UPDATE SET
    task_id = EXCLUDED.task_id,
    evidence_type = EXCLUDED.evidence_type,
    evidence_id = EXCLUDED.evidence_id,
    description = EXCLUDED.description,
    details = EXCLUDED.details,
    created_at = EXCLUDED.created_at;

INSERT INTO tag_validation_runs (
    id, task_id, status, hit_count, coverage, sample_data, error_message,
    input_signature, review_status, review_data, created_at
) VALUES
    (
        'vr810000-0000-0000-0000-000000000001',
        't8100000-0000-0000-0000-000000000001',
        'success',
        '842,600',
        '65.8%',
        $json${
            "hit_samples": [
                {"customer_id":"C3109","match_reason":"consent_status = granted AND channel_allowed IN app/sms/phone","score":96},
                {"customer_id":"C4488","match_reason":"授权有效期覆盖活动周期","score":91}
            ],
            "miss_samples": [
                {"customer_id":"C7710","match_reason":"授权状态 revoked，不可营销","score":0}
            ],
            "boundary_samples": [
                {"customer_id":"C5521","match_reason":"授权将在 2026-12-31 到期，需活动前复核","score":72}
            ]
        }$json$,
        NULL,
        'a5200d77f058bbc7c992753bca216632578977effa8de8432bcda296e8d07ac1',
        'approved',
        '{"comment":"样本命中、未命中和边界案例符合合规规则。","error_sample_ids":[]}',
        '2026-06-26 09:18:30'
    ),
    (
        'vr810000-0000-0000-0000-000000000002',
        't8100000-0000-0000-0000-000000000002',
        'success',
        '12,480',
        '3.2%',
        $json${
            "hit_samples": [
                {"customer_id":"C1001","match_reason":"高留学意向分 + 有海外子女 + 授权可触达 + AUM 850万","score":97},
                {"customer_id":"C1002","match_reason":"近期境外教育缴费 + 财富层级 + APP 触达授权","score":92},
                {"customer_id":"C1003","match_reason":"留学咨询事件 + 英国院校汇款 + 外汇需求","score":88}
            ],
            "miss_samples": [
                {"customer_id":"C2049","match_reason":"有留学需求但营销授权 revoked","score":0}
            ],
            "boundary_samples": [
                {"customer_id":"C3098","match_reason":"留学意向 70 分，刚好达到阈值，需继续观察","score":70}
            ]
        }$json$,
        NULL,
        'fa51e4a81b70f4e8da149e21d787f2681f7f43107adf7c9ca82870109fa287f9',
        'approved',
        '{"comment":"覆盖率与产品营销目标匹配，样本解释可被业务接受。","error_sample_ids":[]}',
        '2026-06-26 09:20:45'
    )
ON CONFLICT (id) DO UPDATE SET
    task_id = EXCLUDED.task_id,
    status = EXCLUDED.status,
    hit_count = EXCLUDED.hit_count,
    coverage = EXCLUDED.coverage,
    sample_data = EXCLUDED.sample_data,
    error_message = EXCLUDED.error_message,
    input_signature = EXCLUDED.input_signature,
    review_status = EXCLUDED.review_status,
    review_data = EXCLUDED.review_data,
    created_at = EXCLUDED.created_at;

INSERT INTO derived_tag_rules (id, tag_task_id, logic_expression, created_at) VALUES
    (
        'dr810000-0000-0000-0000-000000000001',
        't8100000-0000-0000-0000-000000000002',
        '有留学需求 AND 有留学子女 AND 营销可触达 AND (高净值客户 OR 有外汇需求 OR 留学汇款)',
        '2026-06-26 09:20:00'
    )
ON CONFLICT (id) DO UPDATE SET
    tag_task_id = EXCLUDED.tag_task_id,
    logic_expression = EXCLUDED.logic_expression,
    created_at = EXCLUDED.created_at;

INSERT INTO tag_package_items (
    id, package_id, tag_id, tag_type, status, created_at
) VALUES
    ('pi900000-0000-0000-0000-000000000001', 'p9000000-0000-0000-0000-000000000001', (SELECT id FROM demo_study_abroad_ids WHERE kind = 'tag' AND key = '有留学需求'), 'existing', 'ready', '2026-06-26 09:12:30'),
    ('pi900000-0000-0000-0000-000000000002', 'p9000000-0000-0000-0000-000000000001', (SELECT id FROM demo_study_abroad_ids WHERE kind = 'tag' AND key = '有留学子女'), 'existing', 'ready', '2026-06-26 09:12:30'),
    ('pi900000-0000-0000-0000-000000000003', 'p9000000-0000-0000-0000-000000000001', (SELECT id FROM demo_study_abroad_ids WHERE kind = 'tag' AND key = '留学汇款'), 'existing', 'ready', '2026-06-26 09:12:30'),
    ('pi900000-0000-0000-0000-000000000004', 'p9000000-0000-0000-0000-000000000001', (SELECT id FROM demo_study_abroad_ids WHERE kind = 'tag' AND key = '高净值客户'), 'existing', 'ready', '2026-06-26 09:12:30'),
    ('pi900000-0000-0000-0000-000000000005', 'p9000000-0000-0000-0000-000000000001', 't8100000-0000-0000-0000-000000000001', 'new', 'ready', '2026-06-26 09:19:00'),
    ('pi900000-0000-0000-0000-000000000006', 'p9000000-0000-0000-0000-000000000001', 't8100000-0000-0000-0000-000000000002', 'derived', 'ready', '2026-06-26 09:21:30')
ON CONFLICT (id) DO UPDATE SET
    package_id = EXCLUDED.package_id,
    tag_id = EXCLUDED.tag_id,
    tag_type = EXCLUDED.tag_type,
    status = EXCLUDED.status,
    created_at = EXCLUDED.created_at;

-- ============================================================
-- 6. Studio user journey: chat history and canvas runs
-- ============================================================

INSERT INTO studio_sessions (
    id, title, scenario_type, mode, latest_run_id, message_count,
    created_at, updated_at, archived_at
) VALUES
    (
        's6200000-0000-0000-0000-000000000001',
        '留学金融机会发现完整流程',
        'customer_segment',
        'demo',
        'r6200000-0000-0000-0000-000000000004',
        12,
        '2026-06-26 09:24:00',
        '2026-06-26 09:33:00',
        NULL
    )
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    scenario_type = EXCLUDED.scenario_type,
    mode = EXCLUDED.mode,
    latest_run_id = EXCLUDED.latest_run_id,
    message_count = EXCLUDED.message_count,
    updated_at = EXCLUDED.updated_at,
    archived_at = EXCLUDED.archived_at;

INSERT INTO chat_messages (
    id, session_id, role, content, suggestions, segment_result, active_view, created_at
) VALUES
    (
        'm6200000-0000-0000-0000-000000000001',
        's6200000-0000-0000-0000-000000000001',
        'user',
        '我们想找出有子女在国外留学的客户，向他们推荐留学汇款产品。请帮我看看现有标签够不够。',
        NULL,
        NULL,
        NULL,
        '2026-06-26 09:24:00'
    ),
    (
        'm6200000-0000-0000-0000-000000000002',
        's6200000-0000-0000-0000-000000000001',
        'agent',
        $msg$我已把需求拆成四类标签要素：家庭关系里的“有留学子女”、行为意向里的“有留学需求”、交易特征里的“留学汇款/跨境汇款活跃”，以及营销名单必须具备的“营销可触达”。前三类在标签市场中已有可复用标签，“营销可触达”和最终客群标签“留学金融潜客”需要开发并发布。$msg$,
        '["搜索留学标签","从知识生成缺失标签","开始标签开发"]',
        NULL,
        'market',
        '2026-06-26 09:24:10'
    ),
    (
        'm6200000-0000-0000-0000-000000000003',
        's6200000-0000-0000-0000-000000000001',
        'user',
        '先查一下留学标签有哪些',
        NULL,
        NULL,
        NULL,
        '2026-06-26 09:25:00'
    ),
    (
        'm6200000-0000-0000-0000-000000000004',
        's6200000-0000-0000-0000-000000000001',
        'agent',
        $msg$标签市场中已匹配到 7 个留学相关标签：有留学需求、有留学子女、留学汇款、跨境汇款活跃、有外汇需求、跨境消费、高净值客户。它们可以覆盖需求识别、家庭证据和交易行为，但缺少“营销可触达”这个合规准入标签，因此不能直接导出营销名单。$msg$,
        '["查看标签市场","开发营销可触达","组合圈选"]',
        NULL,
        'market',
        '2026-06-26 09:25:12'
    ),
    (
        'm6200000-0000-0000-0000-000000000005',
        's6200000-0000-0000-0000-000000000001',
        'user',
        '缺少的标签怎么开发？能不能结合知识库？',
        NULL,
        NULL,
        NULL,
        '2026-06-26 09:26:00'
    ),
    (
        'm6200000-0000-0000-0000-000000000006',
        's6200000-0000-0000-0000-000000000001',
        'agent',
        $msg$可以。知识库里已经有“营销授权与客户触达合规规则”，明确了营销可触达的三条规则：授权状态为 granted、至少一个渠道允许触达、授权有效期覆盖活动周期。我会把这条知识和 marketing_consent 表的 consent_status、channel_allowed、valid_until 字段作为证据，进入标签开发流程。$msg$,
        '["查看知识证据","生成规则草案","执行样本验证"]',
        NULL,
        'development',
        '2026-06-26 09:26:20'
    ),
    (
        'm6200000-0000-0000-0000-000000000007',
        's6200000-0000-0000-0000-000000000001',
        'user',
        '请开发营销可触达和留学金融潜客',
        NULL,
        NULL,
        NULL,
        '2026-06-26 09:27:00'
    ),
    (
        'm6200000-0000-0000-0000-000000000008',
        's6200000-0000-0000-0000-000000000001',
        'agent',
        $msg$已完成两个标签开发任务。“营销可触达”命中 842,600 人，覆盖率 65.8%，合规样本已审批；“留学金融潜客”由留学需求、海外子女、营销授权和资产/外汇信号组合生成，验证命中 12,480 人，覆盖率 3.2%，已发布到标签市场并绑定回相关数据表。$msg$,
        '["打开标签开发任务","查看发布版本","执行圈选分析"]',
        NULL,
        'development',
        '2026-06-26 09:27:30'
    ),
    (
        'm6200000-0000-0000-0000-000000000009',
        's6200000-0000-0000-0000-000000000001',
        'user',
        '发布后用这些标签圈选目标客户',
        NULL,
        NULL,
        NULL,
        '2026-06-26 09:29:00'
    ),
    (
        'm6200000-0000-0000-0000-000000000010',
        's6200000-0000-0000-0000-000000000001',
        'agent',
        $msg$已执行圈选：留学金融潜客 = 是，且营销可触达 = 是，命中 12,480 位客户，覆盖全部零售客户的 3.2%。样本中高匹配客户主要集中在 36-45 岁、财富/私行层级，近期有境外教育缴费、留学咨询或外汇预约行为。$msg$,
        '["保存为客群","导出样本名单","查看数据质量"]',
        $json${
            "total_customers":"12,480",
            "coverage":"3.2%",
            "sample":[
                {"name":"张伟","tags":6,"score":97},
                {"name":"李芳","tags":5,"score":92},
                {"name":"王强","tags":5,"score":88},
                {"name":"陈静","tags":4,"score":81},
                {"name":"刘洋","tags":4,"score":76}
            ],
            "age_distribution":[
                {"name":"18-25岁","value":4},
                {"name":"26-35岁","value":18},
                {"name":"36-45岁","value":42},
                {"name":"46-55岁","value":28},
                {"name":"55岁以上","value":8}
            ],
            "asset_distribution":[
                {"name":"0-50万","value":8},
                {"name":"50-100万","value":19},
                {"name":"100-300万","value":31},
                {"name":"300-600万","value":26},
                {"name":"600万以上","value":16}
            ],
            "risk_preference":[
                {"subject":"保守型","A":22,"fullMark":100},
                {"subject":"稳健型","A":58,"fullMark":100},
                {"subject":"平衡型","A":72,"fullMark":100},
                {"subject":"成长型","A":64,"fullMark":100},
                {"subject":"进取型","A":28,"fullMark":100}
            ]
        }$json$,
        'segment',
        '2026-06-26 09:29:20'
    ),
    (
        'm6200000-0000-0000-0000-000000000011',
        's6200000-0000-0000-0000-000000000001',
        'user',
        '数据质量和合规证据怎么样？',
        NULL,
        NULL,
        NULL,
        '2026-06-26 09:32:00'
    ),
    (
        'm6200000-0000-0000-0000-000000000012',
        's6200000-0000-0000-0000-000000000001',
        'agent',
        $msg$本次圈选使用 7 张核心表和 5 份知识证据，数据价值评分 86。关键字段空值率均低于 12%，唯一需要关注的是家庭教育表的境外院校国家字段空值率 18%，但它不作为硬性圈选条件。营销授权规则已通过合规审批，授权 revoked、expired 或仅服务通知客户已被排除。$msg$,
        '["查看数据治理","打开审计日志","导出评审脚本"]',
        NULL,
        'governance',
        '2026-06-26 09:32:30'
    )
ON CONFLICT (id) DO UPDATE SET
    session_id = EXCLUDED.session_id,
    role = EXCLUDED.role,
    content = EXCLUDED.content,
    suggestions = EXCLUDED.suggestions,
    segment_result = EXCLUDED.segment_result,
    active_view = EXCLUDED.active_view,
    created_at = EXCLUDED.created_at;

INSERT INTO workbench_runs (
    id, session_id, request_message_id, action_type, title, status, progress,
    current_step, steps, result_type, result_data, error, created_at, updated_at
) VALUES
    (
        'r6200000-0000-0000-0000-000000000001',
        's6200000-0000-0000-0000-000000000001',
        'm6200000-0000-0000-0000-000000000003',
        'tag_discovery',
        '标签发现：留学',
        'succeeded',
        100,
        '整理候选标签',
        $json$[
            {"name":"解析标签需求","status":"completed","output":"已提取关键词：留学、子女、汇款、跨境金融"},
            {"name":"检索标签市场","status":"completed","output":"匹配 7 个已发布标签，发现 2 个缺口"},
            {"name":"整理候选标签","status":"completed","output":"按复用优先级和缺口开发顺序输出"}
        ]$json$,
        'search_tags',
        $json${
            "keyword":"留学",
            "total":9,
            "tags":[
                {"id":"d1000000-0000-0000-0000-000000000005","name":"有留学需求","type":"行为意向","coverage":18640,"confidence":96,"status":"published"},
                {"id":"d1000000-0000-0000-0000-000000000004","name":"有留学子女","type":"家庭关系","coverage":15820,"confidence":94,"status":"published"},
                {"id":"d1000000-0000-0000-0000-000000000009","name":"留学汇款","type":"交易特征","coverage":4960,"confidence":95,"status":"published"},
                {"id":"d1000000-0000-0000-0000-000000000010","name":"跨境汇款活跃","type":"交易特征","coverage":22800,"confidence":88,"status":"published"},
                {"id":"d1000000-0000-0000-0000-000000000011","name":"营销可触达","type":"合规授权","coverage":842600,"confidence":99,"status":"draft"},
                {"id":"d1000000-0000-0000-0000-000000000013","name":"留学金融潜客","type":"客群标签","coverage":12480,"confidence":92,"status":"draft"}
            ]
        }$json$,
        NULL,
        '2026-06-26 09:25:01',
        '2026-06-26 09:25:12'
    ),
    (
        'r6200000-0000-0000-0000-000000000002',
        's6200000-0000-0000-0000-000000000001',
        'm6200000-0000-0000-0000-000000000007',
        'data_value_analysis',
        '标签开发：缺失标签补齐',
        'succeeded',
        100,
        '发布新标签',
        $json$[
            {"name":"读取知识证据","status":"completed","output":"找到营销授权规则和留学金融方案 2 份关键知识"},
            {"name":"选择数据证据","status":"completed","output":"绑定 marketing_consent、customer_360、family_education_profile 等证据"},
            {"name":"执行样本验证","status":"completed","output":"营销可触达覆盖 65.8%，留学金融潜客覆盖 3.2%"},
            {"name":"发布新标签","status":"completed","output":"已发布营销可触达与留学金融潜客 v1"}
        ]$json$,
        'create_rule',
        $json${
            "tagName":"留学金融潜客",
            "conditions":[
                {"field":"study_abroad_intent_score","operator":">=","value":"70"},
                {"field":"has_overseas_child","operator":"=","value":"true"},
                {"field":"marketing_contactable","operator":"=","value":"true"},
                {"field":"aum_balance","operator":">=","value":"500000"}
            ],
            "estimatedCoverage":12480,
            "status":"saved"
        }$json$,
        NULL,
        '2026-06-26 09:27:02',
        '2026-06-26 09:27:30'
    ),
    (
        'r6200000-0000-0000-0000-000000000003',
        's6200000-0000-0000-0000-000000000001',
        'm6200000-0000-0000-0000-000000000009',
        'customer_segment',
        '客户圈选：留学金融潜客',
        'succeeded',
        100,
        '汇总客群画像',
        $json$[
            {"name":"解析圈选条件","status":"completed","output":"留学金融潜客 = 是 AND 营销可触达 = 是"},
            {"name":"应用客户标签规则","status":"completed","output":"使用 v1 标签版本和已审批样本验证结果"},
            {"name":"汇总客群画像","status":"completed","output":"命中 12,480 位客户，覆盖率 3.2%"}
        ]$json$,
        'analyze_segment',
        $json${
            "segmentName":"留学金融潜客",
            "profiles":[
                {"name":"高资产留学家庭","tags":6,"score":97},
                {"name":"境外缴费活跃客户","tags":5,"score":92},
                {"name":"外汇服务潜在客户","tags":5,"score":88}
            ],
            "tags":[
                {"name":"有留学需求","score":96},
                {"name":"有留学子女","score":94},
                {"name":"营销可触达","score":99},
                {"name":"有外汇需求","score":89},
                {"name":"留学汇款","score":95}
            ]
        }$json$,
        NULL,
        '2026-06-26 09:29:02',
        '2026-06-26 09:29:20'
    ),
    (
        'r6200000-0000-0000-0000-000000000004',
        's6200000-0000-0000-0000-000000000001',
        'm6200000-0000-0000-0000-000000000011',
        'data_value_analysis',
        '数据价值与治理检查',
        'succeeded',
        100,
        '生成价值摘要',
        $json$[
            {"name":"识别数据源结构","status":"completed","output":"7 张核心表、16 个证据字段、5 份知识文档"},
            {"name":"评估分析数据维度","status":"completed","output":"关键字段空值率可控，营销授权字段质量高"},
            {"name":"生成数据挖掘方案","status":"completed","output":"数据价值评分 86，建议治理境外院校国家字段"}
        ]$json$,
        'system_overview',
        $json${
            "metrics":[
                {"label":"留学金融潜客","value":12480,"color":"primary.main"},
                {"label":"已发布相关标签","value":13,"color":"success.main"},
                {"label":"核心证据表","value":7,"color":"info.main"},
                {"label":"待治理字段","value":1,"color":"warning.main"}
            ],
            "totalScore":86
        }$json$,
        NULL,
        '2026-06-26 09:32:02',
        '2026-06-26 09:32:30'
    )
ON CONFLICT (id) DO UPDATE SET
    session_id = EXCLUDED.session_id,
    request_message_id = EXCLUDED.request_message_id,
    action_type = EXCLUDED.action_type,
    title = EXCLUDED.title,
    status = EXCLUDED.status,
    progress = EXCLUDED.progress,
    current_step = EXCLUDED.current_step,
    steps = EXCLUDED.steps,
    result_type = EXCLUDED.result_type,
    result_data = EXCLUDED.result_data,
    error = EXCLUDED.error,
    updated_at = EXCLUDED.updated_at;

-- ============================================================
-- 7. Supporting requirements, background task, memory, execution trace, audit
-- ============================================================

INSERT INTO requirement_tickets (
    id, title, description, status, phase, created_by, created_at, updated_at
) VALUES
    (
        'q6200000-0000-0000-0000-000000000001',
        '留学金融机会发现',
        '找出有子女在国外留学的客户，评估现有标签，补齐缺失标签，并执行营销可触达客群圈选。',
        'completed',
        'segment',
        'demo-user',
        '2026-06-26 09:24:00',
        '2026-06-26 09:32:30'
    )
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    phase = EXCLUDED.phase,
    created_by = EXCLUDED.created_by,
    updated_at = EXCLUDED.updated_at;

INSERT INTO background_tasks (
    id, name, status, progress, steps_json, result_json,
    error_message, created_at, completed_at
) VALUES
    (
        'bg620000-0000-0000-0000-000000000001',
        'AI 标签开发：留学金融机会发现',
        'completed',
        100,
        $json$[
            {"name":"需求解析","status":"completed","output":"识别家庭关系、留学意向、跨境交易和营销授权四类要素"},
            {"name":"知识抽取","status":"completed","output":"5 份知识文档提取 13 个候选标签"},
            {"name":"标签开发","status":"completed","output":"开发并发布营销可触达、留学金融潜客"},
            {"name":"圈选验证","status":"completed","output":"命中 12,480 位客户，覆盖率 3.2%"}
        ]$json$,
        '{"summary":"留学金融机会发现 demo journey 已完成，可用于产品评审演示。"}',
        NULL,
        '2026-06-26 09:24:00',
        '2026-06-26 09:32:30'
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    status = EXCLUDED.status,
    progress = EXCLUDED.progress,
    steps_json = EXCLUDED.steps_json,
    result_json = EXCLUDED.result_json,
    error_message = EXCLUDED.error_message,
    completed_at = EXCLUDED.completed_at;

INSERT INTO memory_entries (
    id, memory_type, key, content, embedding, source, confidence,
    hit_count, last_accessed, created_at, expires_at
) VALUES
    (
        'me620000-0000-0000-0000-000000000001',
        'knowledge',
        'demo_dataset_version',
        '{"dataset":"study_abroad_demo_journey_sql_v1","loaded_at":"2026-06-26","scenario":"留学金融机会发现"}',
        NULL,
        'demo_seed',
        '100',
        3,
        '2026-06-26 09:32:30',
        '2026-06-26 09:00:00',
        NULL
    ),
    (
        'me620000-0000-0000-0000-000000000002',
        'pattern',
        'study_abroad_requirement_to_tags',
        '留学金融需求通常拆为：有留学子女、有留学需求、留学汇款/有外汇需求、营销可触达，最终组合为留学金融潜客。',
        NULL,
        'agent_learned',
        '96',
        5,
        '2026-06-26 09:32:30',
        '2026-06-26 09:10:00',
        NULL
    ),
    (
        'me620000-0000-0000-0000-000000000003',
        'experience',
        'approved_segment_rule_study_abroad',
        '{"segment":"留学金融潜客","rules":["有留学需求 >= 70","有留学子女 = 是","营销可触达 = 是","AUM >= 500000"],"hit_count":"12,480","coverage":"3.2%"}',
        NULL,
        'agent_learned',
        '94',
        2,
        '2026-06-26 09:32:30',
        '2026-06-26 09:20:00',
        NULL
    )
ON CONFLICT (id) DO UPDATE SET
    memory_type = EXCLUDED.memory_type,
    key = EXCLUDED.key,
    content = EXCLUDED.content,
    source = EXCLUDED.source,
    confidence = EXCLUDED.confidence,
    hit_count = EXCLUDED.hit_count,
    last_accessed = EXCLUDED.last_accessed,
    created_at = EXCLUDED.created_at,
    expires_at = EXCLUDED.expires_at;

INSERT INTO execution_logs (
    id, connection_id, table_name, step_type, step_label, status,
    input_summary, output_summary, duration_ms, metadata_json, created_at
) VALUES
    (
        'xl620000-0000-0000-0000-000000000001',
        'a1000000-0000-0000-0000-000000000001',
        'customer_360_study_abroad',
        'schema_discovery',
        '发现留学意向字段',
        'completed',
        '扫描客户全景视图字段和样本值',
        '识别 study_abroad_intent_score、aum_balance、customer_tier 等核心字段',
        420,
        '{"scenario":"study_abroad","quality_score":92}',
        '2026-06-26 09:02:30'
    ),
    (
        'xl620000-0000-0000-0000-000000000002',
        'a1000000-0000-0000-0000-000000000003',
        'marketing_consent',
        'rule_tagging',
        '生成营销可触达规则',
        'completed',
        '读取授权状态、触达渠道和有效期',
        '生成 consent_status = granted AND channel_allowed IN app/sms/phone AND valid_until >= 2026-12-31',
        510,
        '{"scenario":"study_abroad","tag":"营销可触达"}',
        '2026-06-26 09:17:00'
    ),
    (
        'xl620000-0000-0000-0000-000000000003',
        'a1000000-0000-0000-0000-000000000002',
        'cross_border_education_txn',
        'llm_tagging',
        '匹配留学汇款证据',
        'completed',
        '分析 remittance_purpose 与 target_country',
        '确认留学学费、住宿费和生活费可支撑留学汇款标签',
        680,
        '{"scenario":"study_abroad","tag":"留学汇款"}',
        '2026-06-26 09:18:00'
    ),
    (
        'xl620000-0000-0000-0000-000000000004',
        'a1000000-0000-0000-0000-000000000001',
        'customer_360_study_abroad',
        'complete',
        '完成留学金融潜客圈选',
        'completed',
        '应用留学金融潜客 v1 标签规则',
        '命中 12,480 位客户，覆盖率 3.2%',
        960,
        '{"segment":"留学金融潜客","coverage":"3.2%"}',
        '2026-06-26 09:29:20'
    )
ON CONFLICT (id) DO UPDATE SET
    connection_id = EXCLUDED.connection_id,
    table_name = EXCLUDED.table_name,
    step_type = EXCLUDED.step_type,
    step_label = EXCLUDED.step_label,
    status = EXCLUDED.status,
    input_summary = EXCLUDED.input_summary,
    output_summary = EXCLUDED.output_summary,
    duration_ms = EXCLUDED.duration_ms,
    metadata_json = EXCLUDED.metadata_json,
    created_at = EXCLUDED.created_at;

INSERT INTO audit_logs (
    id, action, entity_type, entity_id, old_value, new_value, operator, created_at
) VALUES
    (
        'au620000-0000-0000-0000-000000000001',
        'create',
        'knowledge',
        'e5500000-0000-0000-0000-000000000001',
        NULL,
        '{"filename":"留学金融综合服务方案","tags":["有留学需求","留学金融潜客","有外汇需求"]}',
        'demo-user',
        '2026-06-26 09:06:00'
    ),
    (
        'au620000-0000-0000-0000-000000000002',
        'create',
        'tag_package',
        'p9000000-0000-0000-0000-000000000001',
        NULL,
        '{"name":"留学金融机会发现标签包","items":6}',
        'demo-product-owner',
        '2026-06-26 09:12:30'
    ),
    (
        'au620000-0000-0000-0000-000000000003',
        'approve',
        'tag_validation',
        'vr810000-0000-0000-0000-000000000001',
        '{"review_status":"pending"}',
        '{"review_status":"approved","tag":"营销可触达"}',
        'demo-compliance',
        '2026-06-26 09:18:40'
    ),
    (
        'au620000-0000-0000-0000-000000000004',
        'create',
        'tag_release',
        'rl710000-0000-0000-0000-000000000003',
        NULL,
        '{"tag":"留学金融潜客","version":"v1","status":"success"}',
        'demo-product-owner',
        '2026-06-26 09:21:30'
    ),
    (
        'au620000-0000-0000-0000-000000000005',
        'review',
        'segment',
        'r6200000-0000-0000-0000-000000000003',
        NULL,
        '{"segment":"留学金融潜客","hit_count":"12,480","coverage":"3.2%","export_allowed":true}',
        'demo-business-owner',
        '2026-06-26 09:29:30'
    ),
    (
        'au620000-0000-0000-0000-000000000006',
        'create',
        'data_value_report',
        'r6200000-0000-0000-0000-000000000004',
        NULL,
        '{"score":86,"quality_issue_count":1,"governance_status":"approved"}',
        'agent',
        '2026-06-26 09:32:30'
    )
ON CONFLICT (id) DO UPDATE SET
    action = EXCLUDED.action,
    entity_type = EXCLUDED.entity_type,
    entity_id = EXCLUDED.entity_id,
    old_value = EXCLUDED.old_value,
    new_value = EXCLUDED.new_value,
    operator = EXCLUDED.operator,
    created_at = EXCLUDED.created_at;

COMMIT;
