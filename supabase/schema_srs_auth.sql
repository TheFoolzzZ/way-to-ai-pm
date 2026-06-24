-- schema_srs_auth.sql
-- 附加功能：Token验证与艾宾浩斯复习记录

-- 1. 创建基于 Token 的系统用户表
create table if not exists system_users (
  id uuid default uuid_generate_v4() primary key,
  access_token text not null unique, -- 例如 'AI-PM-888'
  username text,                     -- 用户首次登录时填写的昵称
  is_active boolean default true,
  last_login_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- (可选) 预先内置一个测试 Token 供本地开发
insert into system_users (access_token)
select 'VIP_TEST_001'
where not exists (select 1 from system_users where access_token = 'VIP_TEST_001');

-- 2. 创建用户题目复习状态表 (User Question Reviews)
create table if not exists user_question_reviews (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references system_users(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  
  -- FSRS / 艾宾浩斯 记忆算法核数字段
  due_date timestamp with time zone not null, -- 下次复习时间（核心排序字段）
  stability numeric default 0,                -- 记忆稳定性 S
  difficulty numeric default 0,               -- 题目对该用户的难度 D
  reps integer default 0,                     -- 复习次数
  lapses integer default 0,                   -- 忘记次数
  state text default 'New',                   -- 当前卡片状态 (New/新题, Learning/学习中, Review/复习中, Relearning/重新学习)
  last_review timestamp with time zone,       -- 上次复习时间
  
  unique(user_id, question_id)
);

-- 3. （可选安全配置）开启 RLS 和策略
alter table system_users enable row level security;
alter table user_question_reviews enable row level security;

-- 由于我们在目前的极简架构下可能通过后端 Server Action 使用 Service Role 调用，
-- 为了不在前端直连时发生权限错误，这里预设全部放行，后续可再依业务复杂度收紧。
create policy "Allow all access for system_users"
  on system_users for all using (true);

create policy "Allow all access for user_question_reviews"
  on user_question_reviews for all using (true);

-- 4. 性能优化：为由于_date排序创建索引
create index if not exists idx_user_reviews_due_date on user_question_reviews(due_date);

-- 5. RPC 函数：列表分页与复习权重排序 (解决前端查出后排序的 N+1/全表扫描 问题)
create or replace function get_srs_questions(p_category_id uuid, p_user_id uuid, p_limit int, p_offset int)
returns table (
  id uuid,
  question text,
  answer text,
  category_id uuid,
  created_at timestamp with time zone,
  due_date timestamp with time zone,
  state text,
  sort_priority int
) as $$
begin
  return query
  select
    q.id, q.question, q.answer, q.category_id, q.created_at,
    r.due_date, r.state,
    case
      when r.due_date <= now() then 1       -- 待复习
      when r.due_date is null then 2        -- 新题
      when r.due_date > now() then 3        -- 已掌握
    end as sort_priority
  from questions q
  left join user_question_reviews r
    on q.id = r.question_id and r.user_id = p_user_id
  where q.category_id = p_category_id
  order by sort_priority asc, r.due_date asc nulls last
  limit p_limit offset p_offset;
end;
$$ language plpgsql stable;
