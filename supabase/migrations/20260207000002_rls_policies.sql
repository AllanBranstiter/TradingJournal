-- Trading Journal - Row Level Security Policies
-- Created: 2026-02-07
-- Description: RLS policies to ensure users can only access their own data

-- =====================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =====================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_trade_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_trade_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychology_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USER PROFILES POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile"
  ON user_profiles FOR DELETE
  USING (auth.uid() = id);

-- =====================================================
-- STRATEGIES POLICIES
-- =====================================================

-- Users can view their own strategies
CREATE POLICY "Users can view own strategies"
  ON strategies FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own strategies
CREATE POLICY "Users can create own strategies"
  ON strategies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own strategies
CREATE POLICY "Users can update own strategies"
  ON strategies FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own strategies
CREATE POLICY "Users can delete own strategies"
  ON strategies FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TRADES POLICIES
-- =====================================================

-- Users can view their own trades
CREATE POLICY "Users can view own trades"
  ON trades FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own trades
CREATE POLICY "Users can create own trades"
  ON trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own trades
CREATE POLICY "Users can update own trades"
  ON trades FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own trades
CREATE POLICY "Users can delete own trades"
  ON trades FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- PRE-TRADE JOURNALS POLICIES
-- =====================================================

-- Users can view their own pre-trade journals
CREATE POLICY "Users can view own pre-trade journals"
  ON pre_trade_journals FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own pre-trade journals
CREATE POLICY "Users can create own pre-trade journals"
  ON pre_trade_journals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pre-trade journals
CREATE POLICY "Users can update own pre-trade journals"
  ON pre_trade_journals FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own pre-trade journals
CREATE POLICY "Users can delete own pre-trade journals"
  ON pre_trade_journals FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- POST-TRADE JOURNALS POLICIES
-- =====================================================

-- Users can view their own post-trade journals
CREATE POLICY "Users can view own post-trade journals"
  ON post_trade_journals FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own post-trade journals
CREATE POLICY "Users can create own post-trade journals"
  ON post_trade_journals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own post-trade journals
CREATE POLICY "Users can update own post-trade journals"
  ON post_trade_journals FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own post-trade journals
CREATE POLICY "Users can delete own post-trade journals"
  ON post_trade_journals FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- PSYCHOLOGY METRICS POLICIES
-- =====================================================

-- Users can view their own psychology metrics
CREATE POLICY "Users can view own psychology metrics"
  ON psychology_metrics FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own psychology metrics
CREATE POLICY "Users can create own psychology metrics"
  ON psychology_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own psychology metrics
CREATE POLICY "Users can update own psychology metrics"
  ON psychology_metrics FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own psychology metrics
CREATE POLICY "Users can delete own psychology metrics"
  ON psychology_metrics FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TRADING PLANS POLICIES
-- =====================================================

-- Users can view their own trading plans
CREATE POLICY "Users can view own trading plans"
  ON trading_plans FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own trading plans
CREATE POLICY "Users can create own trading plans"
  ON trading_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own trading plans
CREATE POLICY "Users can update own trading plans"
  ON trading_plans FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own trading plans
CREATE POLICY "Users can delete own trading plans"
  ON trading_plans FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- GAMIFICATION POLICIES
-- =====================================================

-- Users can view their own gamification data
CREATE POLICY "Users can view own gamification"
  ON gamification FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own gamification record
CREATE POLICY "Users can create own gamification"
  ON gamification FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own gamification data
CREATE POLICY "Users can update own gamification"
  ON gamification FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own gamification data
CREATE POLICY "Users can delete own gamification"
  ON gamification FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- SECURITY NOTES
-- =====================================================

-- All policies use auth.uid() to ensure authenticated users can only
-- access their own data. This is enforced at the database level.
--
-- The pattern for all tables:
-- 1. SELECT: USING (auth.uid() = user_id) - can read own data
-- 2. INSERT: WITH CHECK (auth.uid() = user_id) - can only create for self
-- 3. UPDATE: USING (auth.uid() = user_id) - can only update own data
-- 4. DELETE: USING (auth.uid() = user_id) - can only delete own data
--
-- Foreign key constraints with ON DELETE CASCADE ensure that deleting
-- a user removes all their associated data automatically.
