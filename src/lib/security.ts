/**
 * 보안 유틸리티 모듈
 * Rate Limiting, SSRF 방지, 입력 검증, 토큰 관리
 */

import crypto from 'crypto';

// ==========================================
// 1. Rate Limiter (메모리 기반 + Supabase 영구 저장)
// ==========================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * IP 기반 Rate Limiting (메모리 기반)
 * ⚠️ Vercel Serverless에서는 인스턴스마다 독립적이므로 완벽하지 않음.
 *    비밀번호 강도 + timingSafeEqual이 1차 방어선이고, 이것은 보조 방어선입니다.
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // 오래된 엔트리 정리 (메모리 누수 방지)
  if (rateLimitStore.size > 10000) {
    for (const [key, val] of rateLimitStore) {
      if (val.resetTime < now) rateLimitStore.delete(key);
    }
  }

  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}

/**
 * NextRequest에서 클라이언트 IP 추출
 * Vercel 환경에서는 x-forwarded-for를 Vercel이 직접 설정하므로 위조 불가
 * 다른 환경에서의 위조 방지를 위해 x-real-ip도 확인
 */
export function getClientIP(req: Request): string {
  // Vercel은 자체적으로 x-forwarded-for를 설정하며 클라이언트가 위조 불가
  const forwarded = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip') || '';
  return forwarded || realIp || 'unknown';
}

// ==========================================
// 2. SSRF 방지 — URL 검증
// ==========================================

const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
];

const BLOCKED_IP_RANGES = [
  /^10\./,                    // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12
  /^192\.168\./,              // 192.168.0.0/16
  /^169\.254\./,              // Link-local (AWS metadata 등)
  /^100\.(6[4-9]|[7-9]\d|1[0-2]\d)\./, // 100.64.0.0/10 (CGNAT)
  /^0\./,                     // 0.0.0.0/8
  /^fc00:/i,                  // IPv6 ULA
  /^fe80:/i,                  // IPv6 Link-local
];

/**
 * URL이 안전한 외부 URL인지 검증 (SSRF 방지)
 */
export function isUrlSafe(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }
    
    if (BLOCKED_HOSTS.includes(url.hostname.toLowerCase())) {
      return false;
    }
    
    for (const range of BLOCKED_IP_RANGES) {
      if (range.test(url.hostname)) {
        return false;
      }
    }
    
    if (url.port && !['80', '443', ''].includes(url.port)) {
      return false;
    }

    if (url.hostname === '169.254.169.254' || url.hostname === 'metadata.google.internal') {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// ==========================================
// 3. 관리자 토큰 관리 (HMAC-SHA256 서명)
// ==========================================

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24시간

/**
 * HMAC-SHA256 서명 기반 토큰 생성
 * - crypto.createHmac으로 암호학적으로 안전한 서명
 * - 24시간 자동 만료
 */
export function generateAdminToken(): string {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error('ADMIN_PASSWORD not set');
  
  const timestamp = Date.now();
  const uuid = crypto.randomUUID();
  const payload = `admin:${timestamp}:${uuid}`;
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return Buffer.from(`${payload}:${signature}`).toString('base64');
}

/**
 * HMAC-SHA256 서명 토큰 검증
 * - 서명 위조 불가능 (SHA256)
 * - 만료 시간 확인
 * - timingSafeEqual로 타이밍 공격 방지
 */
export function verifyAdminToken(token: string): boolean {
  try {
    const secret = process.env.ADMIN_PASSWORD;
    if (!secret) return false;
    
    const decoded = Buffer.from(token, 'base64').toString();
    const lastColonIndex = decoded.lastIndexOf(':');
    if (lastColonIndex === -1) return false;
    
    // payload와 signature 분리 (signature가 64자 hex)
    const parts = decoded.split(':');
    if (parts.length < 4) return false;
    
    // admin:timestamp:uuid:signature
    const signature = parts[parts.length - 1];
    const payload = parts.slice(0, -1).join(':');
    
    if (!payload.startsWith('admin:')) return false;
    
    const timestamp = parseInt(parts[1], 10);
    
    // 만료 확인
    if (isNaN(timestamp) || Date.now() - timestamp > TOKEN_EXPIRY_MS) {
      return false;
    }
    
    // HMAC-SHA256 서명 재계산 후 timingSafeEqual로 비교
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    // 타이밍 공격 방지: 길이가 다르면 false
    if (signature.length !== expectedSignature.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

// ==========================================
// 4. 비밀번호 비교 (Timing Attack 방지)
// ==========================================

/**
 * 비밀번호를 타이밍 공격에 안전하게 비교
 * - 입력 길이와 관계없이 항상 일정한 시간 소요
 * - crypto.timingSafeEqual 사용
 */
export function securePasswordCompare(input: string, expected: string): boolean {
  try {
    // 두 문자열을 SHA256 해시로 변환하여 길이를 통일
    const inputHash = crypto.createHash('sha256').update(input).digest();
    const expectedHash = crypto.createHash('sha256').update(expected).digest();
    
    return crypto.timingSafeEqual(inputHash, expectedHash);
  } catch {
    return false;
  }
}

// ==========================================
// 5. 입력 검증
// ==========================================

const VALID_CATEGORIES = [
  'gym', 'wedding', 'travel', 'medical', 'education',
  'usedcar', 'autorepair', 'moving', 'delivery', 'beauty',
  'interior', 'game', 'ecommerce', 'postpartum', 'funeral', 'other'
];

const VALID_STATUSES = ['pending', 'requested', 'reviewed'];

export function isValidCategory(category: string): boolean {
  return VALID_CATEGORIES.includes(category);
}

export function isValidStatus(status: string): boolean {
  return VALID_STATUSES.includes(status);
}

export function isValidAmount(amount: number): boolean {
  return typeof amount === 'number' && amount >= 0 && amount <= 1_000_000_000 && isFinite(amount);
}

export function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function sanitizeString(input: string, maxLength: number = 5000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  return /^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(phone.replace(/\s/g, ''));
}
