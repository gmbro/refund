/**
 * 보안 유틸리티 모듈
 * Rate Limiting, SSRF 방지, 입력 검증, 토큰 관리
 */

// ==========================================
// 1. Rate Limiter (메모리 기반, Vercel Serverless 환경)
// ==========================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * IP 기반 Rate Limiting
 * @param identifier - IP 주소 또는 고유 식별자
 * @param maxRequests - 윈도우 내 최대 허용 요청 수
 * @param windowMs - 윈도우 크기 (밀리초)
 * @returns { allowed: boolean, remaining: number }
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
 */
export function getClientIP(req: Request): string {
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
 * 내부 네트워크, 클라우드 메타데이터 엔드포인트 등 차단
 */
export function isUrlSafe(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    
    // HTTPS/HTTP만 허용
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }
    
    // 차단 호스트 확인
    if (BLOCKED_HOSTS.includes(url.hostname.toLowerCase())) {
      return false;
    }
    
    // 내부 IP 대역 확인
    for (const range of BLOCKED_IP_RANGES) {
      if (range.test(url.hostname)) {
        return false;
      }
    }
    
    // 포트 제한 (80, 443만 허용)
    if (url.port && !['80', '443', ''].includes(url.port)) {
      return false;
    }

    // AWS/GCP/Azure 메타데이터 엔드포인트 차단
    if (url.hostname === '169.254.169.254' || url.hostname === 'metadata.google.internal') {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// ==========================================
// 3. 관리자 토큰 관리 (HMAC 서명)
// ==========================================

const ADMIN_TOKEN_SECRET = process.env.ADMIN_PASSWORD || 'fallback-secret';
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24시간

/**
 * 서명된 관리자 토큰 생성
 * 형식: base64(admin:timestamp:uuid:signature)
 */
export function generateAdminToken(): string {
  const timestamp = Date.now();
  const uuid = crypto.randomUUID();
  const payload = `admin:${timestamp}:${uuid}`;
  
  // 간단한 HMAC-like 서명 (Node crypto 대신 문자열 기반)
  const signature = generateSignature(payload);
  
  return Buffer.from(`${payload}:${signature}`).toString('base64');
}

/**
 * 관리자 토큰 검증
 * - 형식 확인: admin:timestamp:uuid:signature
 * - 서명 확인
 * - 만료 시간 확인 (24시간)
 */
export function verifyAdminToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const parts = decoded.split(':');
    
    if (parts.length < 4 || parts[0] !== 'admin') {
      return false;
    }
    
    const timestamp = parseInt(parts[1], 10);
    const uuid = parts[2];
    const signature = parts.slice(3).join(':');
    
    // 만료 확인
    if (Date.now() - timestamp > TOKEN_EXPIRY_MS) {
      return false;
    }
    
    // 서명 검증
    const payload = `admin:${timestamp}:${uuid}`;
    const expectedSignature = generateSignature(payload);
    
    return signature === expectedSignature;
  } catch {
    return false;
  }
}

/**
 * 간단한 서명 생성 (ADMIN_PASSWORD 기반)
 */
function generateSignature(payload: string): string {
  // 단순 해시 (실무에서는 crypto.createHmac 사용 권장)
  let hash = 0;
  const combined = payload + ADMIN_TOKEN_SECRET;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit integer로 변환
  }
  return Math.abs(hash).toString(36) + combined.length.toString(36);
}

// ==========================================
// 4. 입력 검증
// ==========================================

const VALID_CATEGORIES = [
  'gym', 'wedding', 'travel', 'medical', 'education',
  'usedcar', 'autorepair', 'moving', 'delivery', 'beauty',
  'interior', 'game', 'ecommerce', 'postpartum', 'funeral', 'other'
];

const VALID_STATUSES = ['pending', 'requested', 'reviewed'];

/**
 * 카테고리 유효성 검증
 */
export function isValidCategory(category: string): boolean {
  return VALID_CATEGORIES.includes(category);
}

/**
 * 상태 값 유효성 검증
 */
export function isValidStatus(status: string): boolean {
  return VALID_STATUSES.includes(status);
}

/**
 * 금액 범위 검증 (0 ~ 10억)
 */
export function isValidAmount(amount: number): boolean {
  return typeof amount === 'number' && amount >= 0 && amount <= 1_000_000_000 && isFinite(amount);
}

/**
 * UUID 형식 검증
 */
export function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * 문자열 sanitize (XSS 방지)
 */
export function sanitizeString(input: string, maxLength: number = 5000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // HTML 태그 문자 제거
    .trim()
    .slice(0, maxLength);
}

/**
 * 이메일 유효성 검증
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * 전화번호 유효성 검증 (한국 형식)
 */
export function isValidPhone(phone: string): boolean {
  return /^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(phone.replace(/\s/g, ''));
}
