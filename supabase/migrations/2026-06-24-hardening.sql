-- supabase/migrations/2026-06-24-hardening.sql
-- 非破坏性：索引、updated_at 触发器、SRS RPC 排序稳定化

-- P2: 分页与复习排序索引
create index if not exists idx_questions_category_created
  on questions(category_id, created_at, id);
create index if not exists idx_reviews_user_due
  on user_question_reviews(user_id, due_date);

-- P3: updated_at 自动更新
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_questions_updated_at on questions;
create trigger trg_questions_updated_at
  before update on questions
  for each row execute function set_updated_at();

-- P1: get_srs_questions 排序稳定化（追加 created_at, id 作 tiebreaker）
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
      when r.due_date <= now() then 1
      when r.due_date is null then 2
      when r.due_date > now() then 3
    end as sort_priority
  from questions q
  left join user_question_reviews r
    on q.id = r.question_id and r.user_id = p_user_id
  where q.category_id = p_category_id
  order by sort_priority asc, r.due_date asc nulls last, q.created_at asc, q.id asc
  limit p_limit offset p_offset;
end;
$$ language plpgsql stable;
