"use client";

import React, { useState, useMemo } from 'react';
import { Copy, Check, X, Sparkles, Grid3X3, Layers, ExternalLink, Search } from 'lucide-react';

// ===== 150개+ 디자인 템플릿 =====
const TEMPLATES = [
  // ========== 심플 (8) ==========
  { id: 'minimal', name: '미니멀 젠', category: '심플', style: { bg: '#FFFFFF', text: '#000000', accent: '#9ca3af', font: 'Helvetica Neue' },
    mood: 'Apple 키노트, 무인양품(MUJI)', characteristics: ['여백 60% 이상', '요소 3개 이하', '무채색 기반', '얇은 산세리프'], texture: '없음 (순수 평면)', layoutGuide: '제목 정중앙, 위아래 얇은 구분선' },
  { id: 'monochrome', name: '블랙 & 화이트', category: '심플', style: { bg: '#000000', text: '#ffffff', accent: '#ffffff', font: 'DM Sans' },
    mood: 'Karl Lagerfeld, 갤러리 도록', characteristics: ['순수 흑백', '강한 명암 대비', '대담한 타이포', '네거티브 스페이스'], texture: '미세 노이즈 5%', layoutGuide: '검정 배경 + 흰색 대문자, Bold 처리' },
  { id: 'nordic', name: '노르딕', category: '심플', style: { bg: '#F0F4F8', text: '#2d3748', accent: '#718096', font: 'Inter' },
    mood: 'IKEA, 코펜하겐 인테리어', characteristics: ['파스텔 뮤트 톤', '둥근 모서리 8px', '자연광 느낌', '따뜻한 기능미'], texture: '린넨 텍스처 3%', layoutGuide: '좌측 정렬, 우상단 원형 장식' },
  { id: 'wireframe', name: '와이어프레임', category: '심플', style: { bg: '#1a202c', text: '#e2e8f0', accent: '#4299e1', font: 'Roboto Mono' },
    mood: 'Figma 목업, UI 설계서', characteristics: ['점선 테두리', '플레이스홀더 박스', '모노스페이스', '청사진 그리드'], texture: '도트 그리드 20px', layoutGuide: '점선 프레임, [TITLE] 스타일' },
  { id: 'paper', name: '화이트 페이퍼', category: '심플', style: { bg: '#FAFAFA', text: '#374151', accent: '#6B7280', font: 'Georgia' },
    mood: '학술 백서, 공식 문서', characteristics: ['깔끔한 여백', '세리프 본문', '미니멀 장식', '인쇄물 느낌'], texture: '종이 질감 2%', layoutGuide: '상단 제목, 하단 페이지 번호 스타일' },
  { id: 'muji', name: '무인양품', category: '심플', style: { bg: '#F5F5F0', text: '#4A4A4A', accent: '#8B7355', font: 'Noto Sans KR' },
    mood: 'MUJI 카탈로그, 생활용품', characteristics: ['자연스러운 베이지', '군더더기 없음', '기능 중심', '차분한 톤'], texture: '크래프트 종이 hint', layoutGuide: '중앙 정렬, 최소한의 요소' },
  { id: 'zen', name: '젠 가든', category: '심플', style: { bg: '#F7F6F3', text: '#2C2C2C', accent: '#7C8B6F', font: 'Cormorant' },
    mood: '일본 정원, 다도 문화', characteristics: ['비대칭 균형', '자연 모티프', '고요한 분위기', '세리프 우아함'], texture: '와시 종이 느낌', layoutGuide: '좌측 여백 크게, 우측에 제목' },
  { id: 'clean', name: '클린 모던', category: '심플', style: { bg: '#FFFFFF', text: '#1F2937', accent: '#3B82F6', font: 'SF Pro Display' },
    mood: 'iOS 인터페이스, 테크 기업', characteristics: ['시스템 폰트', '파란 포인트', '카드 UI', '그림자 활용'], texture: '없음', layoutGuide: '카드 형태 중앙 배치' },

  // ========== 모던 (10) ==========
  { id: 'cyberpunk', name: '네온 퓨처', category: '모던', style: { bg: '#050505', text: '#00ff9d', accent: '#ff00ff', font: 'Roboto Mono' },
    mood: 'Blade Runner, CD Projekt', characteristics: ['네온 글로우', '어둠+형광', '글리치 효과', 'HUD 스타일'], texture: '스캔라인 2px', layoutGuide: '네온 글로우 blur 20px, 사이버 프레임' },
  { id: 'swiss', name: '스위스 스타일', category: '모던', style: { bg: '#ffffff', text: '#1a1a1a', accent: '#e11d48', font: 'Helvetica' },
    mood: 'Helvetica 다큐, 국제 양식', characteristics: ['엄격한 그리드', '산세리프', '빨간 포인트', '비대칭 레이아웃'], texture: '없음', layoutGuide: '그리드 4단, 좌측 정렬, 빨간 포인트' },
  { id: 'glassmorphism', name: '글래스모피즘', category: '모던', style: { bg: '#667eea', text: '#ffffff', accent: '#764ba2', font: 'Inter' },
    mood: 'iOS 16, 최신 UI 트렌드', characteristics: ['유리 질감', 'backdrop blur', '반투명 흰색', '그라데이션 배경'], texture: 'blur 20px + 흰색 10%', layoutGuide: '반투명 카드, 배경 그라데이션' },
  { id: 'brutalist', name: '브루탈리즘', category: '모던', style: { bg: '#F5F5DC', text: '#000000', accent: '#FF4500', font: 'Courier New' },
    mood: 'Bloomberg, 실험적 웹', characteristics: ['굵은 테두리', '모노스페이스', '비정형 레이아웃', '원색 사용'], texture: '없음', layoutGuide: '5px 검정 테두리, 요소 겹침 허용' },
  { id: 'gradient', name: '그라데이션', category: '모던', style: { bg: '#6366f1', text: '#ffffff', accent: '#a855f7', font: 'Poppins' },
    mood: 'Spotify Wrapped, 인스타 스토리', characteristics: ['선명한 그라데이션', '둥근 UI', '카드 오버레이', '생동감'], texture: '없음', layoutGuide: '전면 그라데이션, 흰색 텍스트' },
  { id: 'neomorphism', name: '뉴모피즘', category: '모던', style: { bg: '#e0e5ec', text: '#44476a', accent: '#6c63ff', font: 'Nunito' },
    mood: '소프트 UI, 미래적 인터페이스', characteristics: ['볼록/오목 효과', '부드러운 그림자', '밝은 배경', '미묘한 입체감'], texture: 'inner/outer shadow', layoutGuide: '요소마다 볼록/오목 그림자' },
  { id: 'dark_luxury', name: '다크 럭셔리', category: '모던', style: { bg: '#1a1a2e', text: '#eee', accent: '#e94560', font: 'Playfair Display' },
    mood: 'Tesla, 럭셔리 브랜드', characteristics: ['다크 배경', '세리프 제목', '붉은 포인트', '시네마틱'], texture: '미세 노이즈 3%', layoutGuide: '어두운 배경, 대형 세리프 제목' },
  { id: 'memphis', name: '멤피스', category: '모던', style: { bg: '#FFDEE9', text: '#333', accent: '#FF6B6B', font: 'Futura' },
    mood: '80년대 멤피스, 포스트모던', characteristics: ['기하학 도형', '원색 조합', '패턴 반복', '장난스러운'], texture: '도형 패턴', layoutGuide: '삼각형, 원, 지그재그 장식' },
  { id: 'aurora', name: '오로라', category: '모던', style: { bg: '#0c0c1d', text: '#ffffff', accent: '#7c3aed', font: 'Space Grotesk' },
    mood: '오로라, 우주', characteristics: ['어둠+보라 그라데이션', '빛 효과', '우주적 스케일', '몽환적'], texture: 'radial gradient glow', layoutGuide: '오로라 빛 배경, 중앙 타이포' },
  { id: 'split_tone', name: '스플릿 톤', category: '모던', style: { bg: '#000000', text: '#ffffff', accent: '#FFD700', font: 'Oswald' },
    mood: '나이키 광고, 스포츠 브랜드', characteristics: ['2분할 레이아웃', '강렬한 대비', '대담한 타이포', '액션 느낌'], texture: '없음', layoutGuide: '좌우 분할, 한쪽 색상/한쪽 이미지' },

  // ========== 비즈니스 (10) ==========
  { id: 'corporate', name: '기업 보고서', category: '비즈니스', style: { bg: '#ffffff', text: '#1e293b', accent: '#2563eb', font: 'Pretendard' },
    mood: '삼성 IR, 기업 보고서', characteristics: ['파란색 기조', '데이터 시각화', '깔끔한 표', '전문적'], texture: '없음', layoutGuide: '상단 로고, 차트/표 중심' },
  { id: 'startup', name: '스타트업 피치', category: '비즈니스', style: { bg: '#18181b', text: '#fafafa', accent: '#22c55e', font: 'Inter' },
    mood: 'YC Demo Day, 피치덱', characteristics: ['다크 배경', '그린 포인트', '대형 숫자', '성장 그래프'], texture: '없음', layoutGuide: '한 문장 + 큰 숫자/차트' },
  { id: 'consulting', name: '컨설팅', category: '비즈니스', style: { bg: '#F8FAFC', text: '#0F172A', accent: '#1E40AF', font: 'Noto Sans KR' },
    mood: 'McKinsey, BCG 보고서', characteristics: ['프레임워크 다이어그램', '번호 매기기', '구조화된 목록', '전문적 톤'], texture: '없음', layoutGuide: '2x2 매트릭스, 번호 목록' },
  { id: 'finance', name: '금융', category: '비즈니스', style: { bg: '#0D1B2A', text: '#E0E1DD', accent: '#00B4D8', font: 'Roboto' },
    mood: 'Bloomberg Terminal, 트레이딩', characteristics: ['다크 대시보드', '실시간 데이터', '숫자 중심', '차트 그리드'], texture: '없음', layoutGuide: '그리드 대시보드, 숫자 패널' },
  { id: 'marketing', name: '마케팅', category: '비즈니스', style: { bg: '#FEF3C7', text: '#92400E', accent: '#F59E0B', font: 'Montserrat' },
    mood: '마케팅 캠페인, 광고 대행사', characteristics: ['따뜻한 톤', 'CTA 강조', '퍼널 시각화', '밝은 에너지'], texture: '없음', layoutGuide: '헤드라인 강조, CTA 버튼' },
  { id: 'legal', name: '법률', category: '비즈니스', style: { bg: '#FFFFFF', text: '#1F2937', accent: '#7C3AED', font: 'Times New Roman' },
    mood: '법률 문서, 계약서', characteristics: ['세리프 본문', '번호 체계', '엄격한 형식', '신뢰감'], texture: '없음', layoutGuide: '제목+조항 구조, 서명란' },
  { id: 'real_estate', name: '부동산', category: '비즈니스', style: { bg: '#1B4332', text: '#FFFFFF', accent: '#95D5B2', font: 'Playfair Display' },
    mood: '프리미엄 부동산, 분양 광고', characteristics: ['다크 그린', '고급스러움', '사진 중심', '가격 강조'], texture: '없음', layoutGuide: '이미지 배경, 오버레이 텍스트' },
  { id: 'hr', name: '인사/HR', category: '비즈니스', style: { bg: '#FFF7ED', text: '#431407', accent: '#EA580C', font: 'Noto Sans KR' },
    mood: '채용 공고, 인사 보고서', characteristics: ['따뜻한 오렌지', '사람 중심', '조직도', '비전 강조'], texture: '없음', layoutGuide: '조직 구조도, 직무 설명' },
  { id: 'ecommerce', name: '이커머스', category: '비즈니스', style: { bg: '#FFFFFF', text: '#111827', accent: '#EC4899', font: 'Inter' },
    mood: '쇼핑몰, 쿠팡 스타일', characteristics: ['상품 카드', '가격 태그', '할인 배지', '구매 버튼'], texture: '없음', layoutGuide: '상품 그리드, 가격 강조' },
  { id: 'logistics', name: '물류', category: '비즈니스', style: { bg: '#0C4A6E', text: '#FFFFFF', accent: '#38BDF8', font: 'Roboto' },
    mood: '물류 대시보드, 배송 추적', characteristics: ['지도 시각화', '추적 현황', '상태 표시', '진행 바'], texture: '없음', layoutGuide: '지도 + 상태 패널' },

  // ========== 교육/학문 (8) ==========
  { id: 'academic', name: '학술 논문', category: '교육/학문', style: { bg: '#FFFFFF', text: '#1F2937', accent: '#1E40AF', font: 'Noto Serif KR' },
    mood: '학술 논문, 학회 발표', characteristics: ['세리프 본문', '각주/참고문헌', '번호 체계', '전문적'], texture: '없음', layoutGuide: 'Abstract 구조, 섹션 번호' },
  { id: 'history', name: '역사', category: '교육/학문', style: { bg: '#F5F0E8', text: '#3C2415', accent: '#8B6914', font: 'Gowun Batang' },
    mood: '역사 다큐, 박물관 전시', characteristics: ['빈티지 톤', '타임라인', '고문서 느낌', '세피아'], texture: '양피지 질감', layoutGuide: '시대별 타임라인, 인물 카드' },
  { id: 'science', name: '과학', category: '교육/학문', style: { bg: '#0F172A', text: '#E2E8F0', accent: '#22D3EE', font: 'JetBrains Mono' },
    mood: 'NASA, 과학 저널', characteristics: ['데이터 시각화', '실험 결과', '수식', '다이어그램'], texture: '없음', layoutGuide: '그래프 + 수식 + 결론' },
  { id: 'math', name: '수학', category: '교육/학문', style: { bg: '#FFFBEB', text: '#1C1917', accent: '#B45309', font: 'CMU Serif' },
    mood: '수학 교과서, 칠판', characteristics: ['수식 중심', '증명 구조', '정리/보조정리', '깔끔한 논리'], texture: '없음', layoutGuide: '정리-증명 구조' },
  { id: 'thesis', name: '학위논문', category: '교육/학문', style: { bg: '#FFFFFF', text: '#000000', accent: '#4338CA', font: 'Times New Roman' },
    mood: '석박사 논문, 학위 청구', characteristics: ['이중 여백', '챕터 구분', '표/그림 번호', '참고문헌'], texture: '없음', layoutGuide: '챕터 헤더, 목차 구조' },
  { id: 'encyclopedia', name: '백과사전', category: '교육/학문', style: { bg: '#F5F5F5', text: '#1A1A1A', accent: '#0369A1', font: 'Georgia' },
    mood: '위키피디아, 브리태니커', characteristics: ['2단 편집', '사이드바 정보', '상호 참조', '중립적 톤'], texture: '없음', layoutGuide: '2단 레이아웃, 인포박스' },
  { id: 'sunday_comics', name: '교육 만화', category: '교육/학문', style: { bg: '#FFFDE7', text: '#212121', accent: '#FF5722', font: 'Jua' },
    mood: '학습 만화, 교육 자료', characteristics: ['말풍선', '캐릭터', '4컷 구성', '재미있는 학습'], texture: '없음', layoutGuide: '만화 프레임, 캐릭터 대화' },
  { id: 'language', name: '언어 학습', category: '교육/학문', style: { bg: '#EFF6FF', text: '#1E3A5F', accent: '#2563EB', font: 'Noto Sans KR' },
    mood: 'Duolingo, 언어 교재', characteristics: ['단어 카드', '예문 박스', '발음 표기', '레벨 표시'], texture: '없음', layoutGuide: '단어 카드 + 예문' },

  // ========== 크리에이티브 (10) ==========
  { id: 'watercolor', name: '수채화', category: '크리에이티브', style: { bg: '#FFFEF5', text: '#2D3436', accent: '#6C5CE7', font: 'Nanum Myeongjo' },
    mood: '수채화 엽서, 아트 갤러리', characteristics: ['번지는 색감', '부드러운 가장자리', '투명한 레이어', '자연 색상'], texture: '수채 텍스처', layoutGuide: '수채 워시 배경, 중앙 텍스트' },
  { id: 'neon_sign', name: '네온사인', category: '크리에이티브', style: { bg: '#0a0a0a', text: '#ff6b9d', accent: '#c44dff', font: 'Pacifico' },
    mood: '네온사인, 밤거리', characteristics: ['글로우 효과', '어둠+빛', '레트로 느낌', '바/카페'], texture: '벽돌 배경 hint', layoutGuide: '네온 텍스트, 글로우 효과' },
  { id: 'risograph', name: '리소그래프', category: '크리에이티브', style: { bg: '#FFFBE6', text: '#E74C3C', accent: '#3498DB', font: 'Space Mono' },
    mood: '리소 인쇄, 인디 포스터', characteristics: ['겹치는 잉크', 'multiply 블렌딩', '제한 색상', '판화 질감'], texture: '그레인 텍스처', layoutGuide: '겹치는 색 레이어, 오프셋' },
  { id: 'abstract', name: '추상', category: '크리에이티브', style: { bg: '#F0EBE3', text: '#3D3229', accent: '#C2956B', font: 'Sora' },
    mood: '추상 미술, 모던 갤러리', characteristics: ['기하학적 형태', '유기적 곡선', '텍스처 믹스', '무정형'], texture: '캔버스 질감', layoutGuide: '자유로운 형태, 비정형 배치' },
  { id: 'comic', name: '코믹북', category: '크리에이티브', style: { bg: '#FFE66D', text: '#2D3436', accent: '#FF6B6B', font: 'Bangers' },
    mood: '마블 코믹스, 팝 아트', characteristics: ['말풍선', '효과선', '원색', '도트 패턴'], texture: '벤데이 도트', layoutGuide: '코믹 프레임, 효과음 텍스트' },
  { id: 'sticker', name: '스티커', category: '크리에이티브', style: { bg: '#F8F9FA', text: '#495057', accent: '#FF6B6B', font: 'Jua' },
    mood: '카카오톡 이모티콘, 스티커팩', characteristics: ['둥근 캐릭터', '귀여운 표정', '밝은 색상', '심플 일러스트'], texture: '없음', layoutGuide: '이모지/캐릭터 중심' },
  { id: 'hologram', name: '홀로그램', category: '크리에이티브', style: { bg: '#0F0F0F', text: '#FFFFFF', accent: '#E879F9', font: 'Space Grotesk' },
    mood: '홀로그램, 미래 디스플레이', characteristics: ['무지개빛', '투명', '3D 효과', '미래적'], texture: '홀로그램 패턴', layoutGuide: '홀로그램 이미지, 스펙' },
  { id: '3d_render', name: '3D 렌더링', category: '크리에이티브', style: { bg: '#1A1A2E', text: '#FFFFFF', accent: '#6366F1', font: 'Sora' },
    mood: '3D 아트, 렌더링', characteristics: ['3D 오브젝트', '조명', '질감', '시네마틱'], texture: '없음', layoutGuide: '렌더 이미지 중심, 정보 최소화' },
  { id: 'motion', name: '모션 그래픽', category: '크리에이티브', style: { bg: '#18181B', text: '#FFFFFF', accent: '#F97316', font: 'Inter' },
    mood: '모션그래픽, 애니메이션', characteristics: ['프레임', '타임라인', '이징', '다이내믹'], texture: '없음', layoutGuide: '키프레임 시퀀스, 프로젝트 정보' },
  { id: 'ar_vr', name: 'AR/VR', category: '크리에이티브', style: { bg: '#0F172A', text: '#FFFFFF', accent: '#06B6D4', font: 'Orbitron' },
    mood: 'Meta Quest, VR 경험', characteristics: ['3D 공간감', '그리드 패턴', '미래적', '몰입형'], texture: '와이어프레임 그리드', layoutGuide: 'XR 인터페이스, 스펙 정보' },

  // ========== 소셜미디어 (8) ==========
  { id: 'youtube_thumb', name: '유튜브 썸네일', category: '소셜미디어', style: { bg: '#FF0000', text: '#FFFFFF', accent: '#FFFF00', font: 'Black Han Sans' },
    mood: '유튜브 썸네일, 영상 표지', characteristics: ['강렬한 대비', '큰 텍스트', '얼굴 영역', '클릭 유도'], texture: '없음', layoutGuide: '3분할 구성, 핵심 키워드 강조' },
  { id: 'tiktok', name: '틱톡 스타일', category: '소셜미디어', style: { bg: '#000000', text: '#FFFFFF', accent: '#69C9D0', font: 'Montserrat' },
    mood: '틱톡, 숏폼 콘텐츠', characteristics: ['세로형 최적화', '네온 포인트', '빠른 전환', '트렌디'], texture: '글리치 효과', layoutGuide: '세로 중앙, 짧은 문구' },
  { id: 'linkedin', name: '링크드인', category: '소셜미디어', style: { bg: '#F3F2EF', text: '#000000', accent: '#0A66C2', font: 'SF Pro Display' },
    mood: '링크드인 게시물, 비즈니스 SNS', characteristics: ['전문적 톤', '깔끔한 레이아웃', '데이터 강조', '신뢰감'], texture: '없음', layoutGuide: '헤드라인 상단, 핵심 수치 강조' },
  { id: 'twitter', name: '트위터/X', category: '소셜미디어', style: { bg: '#15202B', text: '#FFFFFF', accent: '#1DA1F2', font: 'Chirp' },
    mood: '트위터 스레드, X 게시물', characteristics: ['다크모드', '짧은 문장', '해시태그', '인용 스타일'], texture: '없음', layoutGuide: '트윗 형식, 280자 제한 느낌' },
  { id: 'pinterest', name: '핀터레스트', category: '소셜미디어', style: { bg: '#FFFFFF', text: '#211922', accent: '#E60023', font: 'Noto Sans KR' },
    mood: '핀터레스트 핀, 무드보드', characteristics: ['세로형 이미지', '영감 중심', '컬렉션 느낌', '미니멀'], texture: '없음', layoutGuide: '이미지 중심, 하단 설명' },
  { id: 'brunch', name: '브런치 매거진', category: '소셜미디어', style: { bg: '#FFFFFF', text: '#333333', accent: '#00C3BD', font: 'Nanum Myeongjo' },
    mood: '브런치 글, 에세이 스타일', characteristics: ['긴 호흡', '여백 미학', '세리프 본문', '문학적'], texture: '종이 질감', layoutGuide: '좌측 정렬, 넉넉한 행간' },
  { id: 'newsletter', name: '뉴스레터', category: '소셜미디어', style: { bg: '#F9FAFB', text: '#111827', accent: '#6366F1', font: 'Inter' },
    mood: '이메일 뉴스레터, 서브스택', characteristics: ['읽기 쉬운 구조', '섹션 구분', '하이라이트', 'CTA 버튼'], texture: '없음', layoutGuide: '헤더-본문-푸터 구조' },
  { id: 'instagram', name: '인스타그램', category: '소셜미디어', style: { bg: '#FFFFFF', text: '#262626', accent: '#E1306C', font: 'Helvetica' },
    mood: '인스타그램 피드, 카드 뉴스', characteristics: ['정사각형', '필터', '해시태그', '캐러셀'], texture: '없음', layoutGuide: '1:1 비율, 비주얼 중심' },

  // ========== 이벤트 (8) ==========
  { id: 'wedding', name: '웨딩', category: '이벤트', style: { bg: '#FDF8F5', text: '#5C4033', accent: '#D4AF37', font: 'Cormorant Garamond' },
    mood: '청첩장, 웨딩 안내', characteristics: ['로맨틱 세리프', '골드 포인트', '플로럴 장식', '우아함'], texture: '린넨 질감', layoutGuide: '중앙 정렬, 날짜 강조, 장식 프레임' },
  { id: 'birthday', name: '생일 파티', category: '이벤트', style: { bg: '#FFE5EC', text: '#4A4A4A', accent: '#FF69B4', font: 'Jua' },
    mood: '생일 초대장, 파티 안내', characteristics: ['축하 분위기', '풍선/케이크', '밝은 색상', '재미있는 폰트'], texture: '컨페티 효과', layoutGuide: '이름 크게, 날짜/장소 명확' },
  { id: 'graduation', name: '졸업식', category: '이벤트', style: { bg: '#1A237E', text: '#FFFFFF', accent: '#FFD700', font: 'Playfair Display' },
    mood: '졸업 축하, 학위 수여', characteristics: ['격식 있는 톤', '금색 포인트', '학사모 모티프', '성취감'], texture: '없음', layoutGuide: '중앙 축하 메시지, 연도 강조' },
  { id: 'doljanchi', name: '돌잔치', category: '이벤트', style: { bg: '#FFF5E6', text: '#8B4513', accent: '#FF6B6B', font: 'Gowun Batang' },
    mood: '돌잔치 초대장, 아기 행사', characteristics: ['전통+현대 믹스', '파스텔톤', '귀여운 요소', '전통 문양'], texture: '한지 느낌', layoutGuide: '아기 사진 중앙, 전통 테두리' },
  { id: 'conference', name: '컨퍼런스', category: '이벤트', style: { bg: '#111827', text: '#F9FAFB', accent: '#6366F1', font: 'Inter' },
    mood: 'WWDC, Google I/O', characteristics: ['다크 배경', '기술 세련미', '스피커 카드', '시간표'], texture: '없음', layoutGuide: '키노트 스타일, 스피커 그리드' },
  { id: 'exhibition', name: '전시회', category: '이벤트', style: { bg: '#FFFFFF', text: '#1A1A1A', accent: '#000000', font: 'Helvetica Neue' },
    mood: '갤러리 전시, 미술관', characteristics: ['순수 흑백', '미니멀', '작품 중심', '여백'], texture: '없음', layoutGuide: '작품 이미지, 작가/제목 정보' },
  { id: 'festival_event', name: '페스티벌', category: '이벤트', style: { bg: '#7C3AED', text: '#FFFFFF', accent: '#FBBF24', font: 'Oswald' },
    mood: '음악 축제, 페스티벌', characteristics: ['에너지', '네온', '라인업', '타임테이블'], texture: '없음', layoutGuide: '아티스트 라인업, 스테이지 맵' },
  { id: 'seminar', name: '세미나', category: '이벤트', style: { bg: '#F8FAFC', text: '#0F172A', accent: '#0EA5E9', font: 'Pretendard' },
    mood: '세미나, 워크샵', characteristics: ['전문적', '발표자 정보', '시간 안내', '등록 폼'], texture: '없음', layoutGuide: '발표 주제, 발표자 프로필' },

  // ========== 한국 전통 (6) ==========
  { id: 'dancheong', name: '단청', category: '한국 전통', style: { bg: '#1B4332', text: '#FFD700', accent: '#DC2626', font: 'Noto Serif KR' },
    mood: '궁궐 단청, 전통 문양', characteristics: ['오방색', '전통 패턴', '대칭 구조', '단청 테두리'], texture: '단청 패턴', layoutGuide: '전통 프레임, 중앙 텍스트' },
  { id: 'hanji', name: '한지', category: '한국 전통', style: { bg: '#F5F0E8', text: '#3E2723', accent: '#8D6E63', font: 'Nanum Myeongjo' },
    mood: '한지 공예, 전통 서적', characteristics: ['한지 질감', '먹색 텍스트', '여백', '전통 미학'], texture: '한지 텍스처', layoutGuide: '넉넉한 여백, 세로쓰기 가능' },
  { id: 'bojagi', name: '보자기', category: '한국 전통', style: { bg: '#FEFCE8', text: '#1C1917', accent: '#B91C1C', font: 'Gowun Batang' },
    mood: '조각보, 보자기 패턴', characteristics: ['조각 패치워크', '다색 조합', '기하학', '전통+현대'], texture: '천 질감', layoutGuide: '조각보 패턴 배경, 프레임' },
  { id: 'calligraphy', name: '서예', category: '한국 전통', style: { bg: '#FFFEF5', text: '#1A1A1A', accent: '#B91C1C', font: 'Noto Serif KR' },
    mood: '서예, 붓글씨', characteristics: ['묵직한 필획', '여백 미학', '인장', '자연 철학'], texture: '화선지', layoutGuide: '큰 글씨 중앙, 인장 위치' },
  { id: 'celadon', name: '청자', category: '한국 전통', style: { bg: '#D4E6D4', text: '#2D4A2D', accent: '#6B8F6B', font: 'Nanum Myeongjo' },
    mood: '고려 청자, 도자기', characteristics: ['비취색', '상감 문양', '곡선미', '은은한 광택'], texture: '도자기 유약 느낌', layoutGuide: '청자색 배경, 문양 장식' },
  { id: 'hanbok', name: '한복', category: '한국 전통', style: { bg: '#FFF5F5', text: '#9B2C2C', accent: '#F6E05E', font: 'Gowun Batang' },
    mood: '한복, 전통 의상', characteristics: ['저고리 색감', '치마 곡선', '전통 색상', '우아함'], texture: '비단 질감', layoutGuide: '전통 색상 조합, 곡선 장식' },

  // ========== 산업/제조 (8) ==========
  { id: 'factory', name: '제조업', category: '산업/제조', style: { bg: '#374151', text: '#F9FAFB', accent: '#F59E0B', font: 'Roboto' },
    mood: '공장, 제조 현장', characteristics: ['안전 경고색', '설비 도면', '생산량 차트', '실용적'], texture: '없음', layoutGuide: '생산 대시보드, 설비 배치도' },
  { id: 'construction', name: '건설', category: '산업/제조', style: { bg: '#F97316', text: '#FFFFFF', accent: '#000000', font: 'Oswald' },
    mood: '건설 현장, 안전 관리', characteristics: ['주황 안전색', '도면', '공정표', '굵은 텍스트'], texture: '없음', layoutGuide: '공정 일정, 안전 지표' },
  { id: 'semiconductor', name: '반도체', category: '산업/제조', style: { bg: '#0F172A', text: '#E2E8F0', accent: '#818CF8', font: 'JetBrains Mono' },
    mood: 'TSMC, 삼성 반도체', characteristics: ['회로 패턴', '나노 스케일', '클린룸', '기술 데이터'], texture: '회로 패턴 hint', layoutGuide: '칩 다이어그램, 공정 데이터' },
  { id: 'automotive', name: '자동차', category: '산업/제조', style: { bg: '#18181B', text: '#FAFAFA', accent: '#EF4444', font: 'Montserrat' },
    mood: 'BMW, 현대차 브로셔', characteristics: ['다크 배경', '차량 렌더링', '스펙 표', '프리미엄'], texture: '카본 파이버 hint', layoutGuide: '차량 이미지, 스펙 비교' },
  { id: 'shipbuilding', name: '조선', category: '산업/제조', style: { bg: '#0E4DA4', text: '#FFFFFF', accent: '#60A5FA', font: 'Roboto' },
    mood: '조선소, 선박 제조', characteristics: ['해양 블루', '선박 도면', '스케일 강조', '산업 느낌'], texture: '없음', layoutGuide: '선박 설계도, 사양 표' },
  { id: 'aerospace', name: '항공우주', category: '산업/제조', style: { bg: '#020617', text: '#FFFFFF', accent: '#38BDF8', font: 'Orbitron' },
    mood: 'NASA, SpaceX 스타일', characteristics: ['우주 배경', '기술 데이터', '미래적', '정밀 수치'], texture: '별 필드', layoutGuide: '로켓/위성 이미지, 미션 타임라인' },
  { id: 'energy_plant', name: '에너지 플랜트', category: '산업/제조', style: { bg: '#1F2937', text: '#F3F4F6', accent: '#10B981', font: 'Inter' },
    mood: '발전소, 에너지 설비', characteristics: ['전력 그래프', '설비 현황', '안전 지표', '효율 수치'], texture: '없음', layoutGuide: '발전량 대시보드, 설비 배치도' },
  { id: 'smart_factory', name: '스마트 팩토리', category: '산업/제조', style: { bg: '#111827', text: '#FFFFFF', accent: '#8B5CF6', font: 'JetBrains Mono' },
    mood: 'Industry 4.0, IoT 공장', characteristics: ['디지털 트윈', '센서 데이터', '자동화', 'AI 분석'], texture: '디지털 그리드', layoutGuide: '실시간 모니터링 UI' },

  // ========== 부동산/건축 (8) ==========
  { id: 'apartment', name: '아파트 분양', category: '부동산/건축', style: { bg: '#FFFFFF', text: '#1F2937', accent: '#0EA5E9', font: 'Pretendard' },
    mood: '아파트 분양, 모델하우스', characteristics: ['평면도', '조감도', '세대 정보', '분양가'], texture: '없음', layoutGuide: '단지 조감도, 평형별 정보' },
  { id: 'interior', name: '인테리어', category: '부동산/건축', style: { bg: '#FAF5F0', text: '#44403C', accent: '#A16207', font: 'Cormorant' },
    mood: '인테리어 디자인, 홈스타일링', characteristics: ['무드보드', '자재 팔레트', '시공 사례', '비포애프터'], texture: '우드 질감', layoutGuide: '공간 사진 중심, 컨셉 설명' },
  { id: 'architecture', name: '건축 설계', category: '부동산/건축', style: { bg: '#F8FAFC', text: '#0F172A', accent: '#64748B', font: 'Helvetica Neue' },
    mood: '건축사무소, 설계 포트폴리오', characteristics: ['도면', '렌더링', '스케일바', '기술 스펙'], texture: '청사진 hint', layoutGuide: '입면도/단면도, 프로젝트 개요' },
  { id: 'landscape', name: '조경', category: '부동산/건축', style: { bg: '#ECFDF5', text: '#064E3B', accent: '#22C55E', font: 'Noto Sans KR' },
    mood: '조경 설계, 공원 디자인', characteristics: ['식재 계획', '조감도', '그린 톤', '자연 요소'], texture: '없음', layoutGuide: '배치도, 식물 리스트' },
  { id: 'commercial', name: '상업 시설', category: '부동산/건축', style: { bg: '#18181B', text: '#FFFFFF', accent: '#EAB308', font: 'Montserrat' },
    mood: '쇼핑몰, 상업용 건물', characteristics: ['임대 정보', '층별 안내', '유동인구', '수익률'], texture: '없음', layoutGuide: '층별 도면, 임대 조건표' },
  { id: 'office_building', name: '오피스 빌딩', category: '부동산/건축', style: { bg: '#F1F5F9', text: '#1E293B', accent: '#3B82F6', font: 'Inter' },
    mood: '오피스, 업무 시설', characteristics: ['전용면적', '공용시설', '교통 접근성', '빌딩 스펙'], texture: '없음', layoutGuide: '빌딩 외관, 층별 평면' },
  { id: 'remodeling', name: '리모델링', category: '부동산/건축', style: { bg: '#FFFBEB', text: '#78350F', accent: '#F59E0B', font: 'Noto Sans KR' },
    mood: '리모델링, 리노베이션', characteristics: ['비포애프터', '시공 과정', '예산표', '공사 일정'], texture: '없음', layoutGuide: '전후 비교, 공정표' },
  { id: 'model_house', name: '모델하우스', category: '부동산/건축', style: { bg: '#1E293B', text: '#FFFFFF', accent: '#D4AF37', font: 'Playfair Display' },
    mood: '모델하우스 VIP, 프리미엄', characteristics: ['고급 마감재', '인테리어 렌더링', '프리미엄 톤', 'VIP'], texture: '대리석 hint', layoutGuide: '인테리어 렌더링, 마감 정보' },

  // ========== 음식 (8) ==========
  { id: 'cafe', name: '카페', category: '음식', style: { bg: '#FDF6EC', text: '#5D4037', accent: '#8D6E63', font: 'Caveat' },
    mood: '카페 메뉴판, 커피숍', characteristics: ['커피 브라운', '손글씨 느낌', '메뉴 구조', '따뜻한 톤'], texture: '크래프트 종이', layoutGuide: '메뉴 리스트, 가격 정렬' },
  { id: 'restaurant', name: '레스토랑', category: '음식', style: { bg: '#1A1A1A', text: '#FFFFFF', accent: '#D4AF37', font: 'Cormorant' },
    mood: '파인다이닝, 미슐랭', characteristics: ['다크 배경', '골드 포인트', '코스 메뉴', '우아한 세리프'], texture: '없음', layoutGuide: '코스 메뉴 구조, 가격' },
  { id: 'korean_food', name: '한식', category: '음식', style: { bg: '#FFF8F0', text: '#78350F', accent: '#C2410C', font: 'Noto Serif KR' },
    mood: '한정식, 전통 한식당', characteristics: ['전통 색감', '반찬 이미지', '정갈함', '전통적'], texture: '한지 hint', layoutGuide: '상차림 이미지, 메뉴 설명' },
  { id: 'bakery', name: '베이커리', category: '음식', style: { bg: '#FEF3E2', text: '#78350F', accent: '#F59E0B', font: 'Pacifico' },
    mood: '빵집, 베이커리 카페', characteristics: ['따뜻한 톤', '빵 이미지', '귀여운', '수제 느낌'], texture: '밀가루 느낌', layoutGuide: '상품 그리드, 가격' },
  { id: 'bar', name: '바/칵테일', category: '음식', style: { bg: '#1C1917', text: '#FAFAF9', accent: '#A855F7', font: 'Playfair Display' },
    mood: '칵테일 바, 와인 바', characteristics: ['다크 무드', '네온 포인트', '칵테일 리스트', '성인 분위기'], texture: '없음', layoutGuide: '메뉴 리스트, 재료 정보' },
  { id: 'vegan', name: '비건', category: '음식', style: { bg: '#ECFDF5', text: '#065F46', accent: '#10B981', font: 'Nunito' },
    mood: '비건 레스토랑, 건강 식단', characteristics: ['그린 톤', '자연 이미지', '건강', '깔끔'], texture: '없음', layoutGuide: '메뉴 + 영양 정보' },
  { id: 'mealkit', name: '밀키트', category: '음식', style: { bg: '#FFFFFF', text: '#1F2937', accent: '#EF4444', font: 'Inter' },
    mood: '밀키트, 간편 조리', characteristics: ['재료 목록', '조리 순서', '시간 표시', '실용적'], texture: '없음', layoutGuide: '스텝 바이 스텝, 재료 리스트' },
  { id: 'street_food', name: '길거리 음식', category: '음식', style: { bg: '#FEF08A', text: '#1C1917', accent: '#DC2626', font: 'Black Han Sans' },
    mood: '포장마차, 분식', characteristics: ['강렬한 색상', '큰 글씨', '재미있는', '서민적'], texture: '없음', layoutGuide: '메뉴판 스타일, 가격 강조' },

  // ========== 여행 (8) ==========
  { id: 'travel', name: '여행 가이드', category: '여행', style: { bg: '#0EA5E9', text: '#FFFFFF', accent: '#FCD34D', font: 'Montserrat' },
    mood: '여행 가이드북, 론리플래닛', characteristics: ['지도', '사진 중심', '루트', '팁 박스'], texture: '없음', layoutGuide: '지도 + 명소 사진 + 팁' },
  { id: 'resort', name: '리조트', category: '여행', style: { bg: '#164E63', text: '#FFFFFF', accent: '#67E8F9', font: 'Playfair Display' },
    mood: '리조트, 호캉스', characteristics: ['바다 색감', '프리미엄', '사진 중심', '휴식'], texture: '없음', layoutGuide: '풀 블리드 이미지, 오버레이' },
  { id: 'cruise', name: '크루즈', category: '여행', style: { bg: '#1E3A5F', text: '#FFFFFF', accent: '#D4AF37', font: 'Cormorant' },
    mood: '크루즈 여행, 해양', characteristics: ['해양 블루', '럭셔리', '항해 루트', '프리미엄'], texture: '없음', layoutGuide: '항로 지도, 기항지 정보' },
  { id: 'backpacking', name: '배낭여행', category: '여행', style: { bg: '#FEF3C7', text: '#78350F', accent: '#D97706', font: 'Caveat' },
    mood: '배낭여행, 자유 여행', characteristics: ['손글씨', '지도 마커', '예산 표', '자유로운'], texture: '빈티지 지도', layoutGuide: '루트 지도, 비용 정보' },
  { id: 'glamping', name: '글램핑', category: '여행', style: { bg: '#1B4332', text: '#FFFFFF', accent: '#86EFAC', font: 'Nunito' },
    mood: '글램핑, 자연 속 캠핑', characteristics: ['자연 색감', '텐트 이미지', '편안함', '아웃도어'], texture: '없음', layoutGuide: '자연 사진, 시설 정보' },
  { id: 'themepark', name: '테마파크', category: '여행', style: { bg: '#7C3AED', text: '#FFFFFF', accent: '#FBBF24', font: 'Jua' },
    mood: '놀이공원, 테마파크', characteristics: ['밝은 색상', '재미있는', '지도', '어트랙션'], texture: '없음', layoutGuide: '파크 맵, 어트랙션 리스트' },
  { id: 'temple_stay', name: '템플스테이', category: '여행', style: { bg: '#F5F0E8', text: '#3E2723', accent: '#795548', font: 'Nanum Myeongjo' },
    mood: '사찰, 명상 여행', characteristics: ['고요함', '자연', '전통', '명상'], texture: '한지 질감', layoutGuide: '사찰 이미지, 프로그램 일정' },
  { id: 'city_guide', name: '도시 가이드', category: '여행', style: { bg: '#18181B', text: '#FAFAFA', accent: '#F43F5E', font: 'Inter' },
    mood: '시티 가이드, 도시 탐방', characteristics: ['도시 사진', '맛집', '명소', '교통 정보'], texture: '없음', layoutGuide: '지역별 추천, 지도 마커' },

  // ========== 건강/웰빙 (8) ==========
  { id: 'hospital', name: '병원', category: '건강/웰빙', style: { bg: '#F0FDF4', text: '#166534', accent: '#22C55E', font: 'Noto Sans KR' },
    mood: '병원 안내, 의료 브로셔', characteristics: ['청결한 느낌', '의료 아이콘', '안내 구조', '신뢰감'], texture: '없음', layoutGuide: '진료 안내, 의료진 소개' },
  { id: 'yoga', name: '요가/명상', category: '건강/웰빙', style: { bg: '#FAF5FF', text: '#581C87', accent: '#A855F7', font: 'Cormorant' },
    mood: '요가 스튜디오, 명상 앱', characteristics: ['보라 톤', '평화로운', '자세 일러스트', '호흡'], texture: '없음', layoutGuide: '자세 가이드, 프로그램 일정' },
  { id: 'diet', name: '다이어트', category: '건강/웰빙', style: { bg: '#FEF2F2', text: '#991B1B', accent: '#EF4444', font: 'Inter' },
    mood: '다이어트 앱, 칼로리 관리', characteristics: ['칼로리 수치', '비포애프터', '식단 표', '목표 그래프'], texture: '없음', layoutGuide: '칼로리 대시보드, 식단 일정' },
  { id: 'mental_care', name: '마음 건강', category: '건강/웰빙', style: { bg: '#EFF6FF', text: '#1E40AF', accent: '#60A5FA', font: 'Nunito' },
    mood: '심리 상담, 마음 챙김', characteristics: ['부드러운 파랑', '따뜻한 톤', '위로', '안정감'], texture: '없음', layoutGuide: '따뜻한 메시지, 프로그램 안내' },
  { id: 'nutrition', name: '영양', category: '건강/웰빙', style: { bg: '#F0FDF4', text: '#14532D', accent: '#16A34A', font: 'Inter' },
    mood: '영양제, 건강 보조', characteristics: ['그린 톤', '영양소 차트', '성분 표', '건강'], texture: '없음', layoutGuide: '영양 성분표, 효능 설명' },
  { id: 'spa', name: '스파', category: '건강/웰빙', style: { bg: '#FFF1F2', text: '#881337', accent: '#F43F5E', font: 'Cormorant' },
    mood: '스파, 뷰티 케어', characteristics: ['핑크/로즈', '우아함', '편안함', '프리미엄'], texture: '없음', layoutGuide: '서비스 메뉴, 가격 안내' },
  { id: 'pilates', name: '필라테스', category: '건강/웰빙', style: { bg: '#FAFAFA', text: '#27272A', accent: '#A78BFA', font: 'Montserrat' },
    mood: '필라테스, 피트니스', characteristics: ['세련된', '동작 가이드', '클래스 일정', '모던'], texture: '없음', layoutGuide: '클래스 시간표, 강사 소개' },
  { id: 'dental', name: '치과', category: '건강/웰빙', style: { bg: '#F0F9FF', text: '#0C4A6E', accent: '#0EA5E9', font: 'Inter' },
    mood: '치과 의원, 구강 건강', characteristics: ['청결한 블루', '의료 아이콘', '치료 안내', '전문적'], texture: '없음', layoutGuide: '치료 항목, 의료진 소개' },

  // ========== 스포츠 (8) ==========
  { id: 'soccer', name: '축구', category: '스포츠', style: { bg: '#166534', text: '#FFFFFF', accent: '#22C55E', font: 'Oswald' },
    mood: '축구 경기, FIFA', characteristics: ['필드 그린', '전술 보드', '스코어', '선수 카드'], texture: '잔디', layoutGuide: '전술 다이어그램, 선수 라인업' },
  { id: 'basketball', name: '농구', category: '스포츠', style: { bg: '#1E293B', text: '#FFFFFF', accent: '#F97316', font: 'Anton' },
    mood: 'NBA, 농구 경기', characteristics: ['오렌지 포인트', '코트 다이어그램', '선수 스탯', '역동적'], texture: '없음', layoutGuide: '코트 다이어그램, 스탯 카드' },
  { id: 'fitness', name: '피트니스', category: '스포츠', style: { bg: '#18181B', text: '#FAFAFA', accent: '#EF4444', font: 'Montserrat' },
    mood: '헬스장, 운동 앱', characteristics: ['다크 모드', '빨간 포인트', '운동 루틴', '근육 차트'], texture: '없음', layoutGuide: '운동 루틴표, 세트/반복' },
  { id: 'golf', name: '골프', category: '스포츠', style: { bg: '#F0FDF4', text: '#14532D', accent: '#16A34A', font: 'Playfair Display' },
    mood: '골프장, 프리미엄 스포츠', characteristics: ['그린', '클래식', '스코어카드', '프리미엄'], texture: '잔디 hint', layoutGuide: '코스 맵, 스코어카드' },
  { id: 'swimming', name: '수영', category: '스포츠', style: { bg: '#0891B2', text: '#FFFFFF', accent: '#FFFFFF', font: 'Montserrat' },
    mood: '수영, 수영장', characteristics: ['레인', '기록', '자세', '물결'], texture: '물결 패턴', layoutGuide: '수영 동작, 기록표' },
  { id: 'tennis', name: '테니스', category: '스포츠', style: { bg: '#166534', text: '#FFFFFF', accent: '#FBBF24', font: 'Roboto' },
    mood: '테니스, 라켓 스포츠', characteristics: ['코트', '스코어', '장비', '경기'], texture: '잔디', layoutGuide: '코트 다이어그램, 경기 일정' },
  { id: 'skiing', name: '스키', category: '스포츠', style: { bg: '#1E3A8A', text: '#FFFFFF', accent: '#38BDF8', font: 'Oswald' },
    mood: '스키, 겨울 스포츠', characteristics: ['슬로프', '장비', '리조트', '눈'], texture: '눈 텍스처', layoutGuide: '슬로프 지도, 난이도' },
  { id: 'martial_arts', name: '격투기', category: '스포츠', style: { bg: '#0F0F0F', text: '#FFFFFF', accent: '#EF4444', font: 'Anton' },
    mood: '격투기, 무술', characteristics: ['파이터', '대진표', '체급', '강렬함'], texture: '없음', layoutGuide: '대진표, 선수 프로필' },

  // ========== 뮤직/공연 (8) ==========
  { id: 'concert_poster', name: '콘서트 포스터', category: '뮤직/공연', style: { bg: '#1F1F1F', text: '#FFFFFF', accent: '#FF4081', font: 'Anton' },
    mood: '콘서트 포스터, 라이브 공연', characteristics: ['대형 타이포', '네온', '날짜 강조', '에너지'], texture: '그런지', layoutGuide: '아티스트명 크게, 공연 정보' },
  { id: 'album_art', name: '앨범 아트', category: '뮤직/공연', style: { bg: '#1A1A2E', text: '#EEEEFF', accent: '#E94560', font: 'Space Grotesk' },
    mood: '앨범 커버, 음반', characteristics: ['정사각형', '아티스트 비주얼', '앨범명', '무드'], texture: '비닐 질감', layoutGuide: '정사각형, 아티스트 비주얼' },
  { id: 'musical', name: '뮤지컬', category: '뮤직/공연', style: { bg: '#4A1942', text: '#FFD700', accent: '#FF6B6B', font: 'Playfair Display' },
    mood: '뮤지컬, 브로드웨이', characteristics: ['극장 무드', '골드', '커튼 느낌', '드라마틱'], texture: '벨벳', layoutGuide: '포스터 스타일, 캐스트 정보' },
  { id: 'orchestra', name: '오케스트라', category: '뮤직/공연', style: { bg: '#1C1917', text: '#FAFAF9', accent: '#D4AF37', font: 'Cormorant' },
    mood: '클래식 음악, 교향악', characteristics: ['악기', '지휘자', '프로그램', '격식'], texture: '벨벳', layoutGuide: '곡목, 연주자 프로필' },
  { id: 'hiphop', name: '힙합', category: '뮤직/공연', style: { bg: '#0F0F0F', text: '#FFFFFF', accent: '#FBBF24', font: 'Anton' },
    mood: '힙합, 래퍼', characteristics: ['그래피티', '골드 체인', '비트', '스트릿'], texture: '그런지', layoutGuide: '아티스트 중심, 앨범 정보' },
  { id: 'indie', name: '인디 밴드', category: '뮤직/공연', style: { bg: '#FDF6E3', text: '#44403C', accent: '#EA580C', font: 'Caveat' },
    mood: '인디밴드, 언더그라운드', characteristics: ['손글씨', '아날로그', '공연 포스터', '감성적'], texture: '빈티지 종이', layoutGuide: '공연 정보, 밴드 사진' },
  { id: 'classical', name: '클래식', category: '뮤직/공연', style: { bg: '#1C1917', text: '#FAFAF9', accent: '#D4AF37', font: 'Cormorant' },
    mood: '클래식 음악, 교향악', characteristics: ['악기', '지휘자', '프로그램', '격식'], texture: '벨벳', layoutGuide: '곡목, 연주자 프로필' },
  { id: 'gugak', name: '국악', category: '뮤직/공연', style: { bg: '#FEF3C7', text: '#78350F', accent: '#B91C1C', font: 'Noto Serif KR' },
    mood: '국악, 전통음악', characteristics: ['전통 악기', '한복', '궁중', '민속'], texture: '한지', layoutGuide: '공연 정보, 전통 문양' },

  // ========== 키즈 (6) ==========
  { id: 'fairytale', name: '동화', category: '키즈', style: { bg: '#FDF2F8', text: '#831843', accent: '#EC4899', font: 'Jua' },
    mood: '동화책, 어린이 그림책', characteristics: ['파스텔톤', '귀여운 일러스트', '큰 글씨', '상상력'], texture: '없음', layoutGuide: '그림 + 짧은 텍스트' },
  { id: 'early_education', name: '유아 교육', category: '키즈', style: { bg: '#FEF9C3', text: '#713F12', accent: '#F97316', font: 'Jua' },
    mood: '유치원, 유아 학습', characteristics: ['밝은 색상', '큰 아이콘', '놀이 학습', '안전한'], texture: '없음', layoutGuide: '큰 이미지, 간단한 설명' },
  { id: 'alphabet', name: '알파벳', category: '키즈', style: { bg: '#DBEAFE', text: '#1E40AF', accent: '#3B82F6', font: 'Nunito' },
    mood: '영어 학습, ABC', characteristics: ['큰 글자', '밝은 색상', '연상 이미지', '반복 학습'], texture: '없음', layoutGuide: '큰 글자 중앙, 연상 이미지' },
  { id: 'numbers', name: '숫자', category: '키즈', style: { bg: '#DCFCE7', text: '#166534', accent: '#22C55E', font: 'Nunito' },
    mood: '수학 학습, 숫자 놀이', characteristics: ['큰 숫자', '카운팅', '밝은 색상', '게임적'], texture: '없음', layoutGuide: '큰 숫자, 카운팅 이미지' },
  { id: 'coloring', name: '컬러링', category: '키즈', style: { bg: '#FFFFFF', text: '#374151', accent: '#8B5CF6', font: 'Caveat' },
    mood: '컬러링북, 색칠 놀이', characteristics: ['아웃라인', '크레용 느낌', '자유로운', '창의적'], texture: '종이 질감', layoutGuide: '아웃라인 이미지, 색상 팔레트' },
  { id: 'kids_science', name: '키즈 과학', category: '키즈', style: { bg: '#F0F9FF', text: '#0C4A6E', accent: '#06B6D4', font: 'Jua' },
    mood: '어린이 과학, 실험', characteristics: ['실험 일러스트', '궁금증', '단계별', '재미있는'], texture: '없음', layoutGuide: '실험 순서, 결과 설명' },

  // ========== 포토 (6) ==========
  { id: 'wedding_album', name: '웨딩 앨범', category: '포토', style: { bg: '#FFFBEB', text: '#78350F', accent: '#D4AF37', font: 'Cormorant' },
    mood: '웨딩 사진, 앨범', characteristics: ['골드 포인트', '우아한', '사진 프레임', '로맨틱'], texture: '린넨', layoutGuide: '사진 프레임, 날짜 장식' },
  { id: 'family_photo', name: '가족 앨범', category: '포토', style: { bg: '#FEF3C7', text: '#92400E', accent: '#F59E0B', font: 'Nunito' },
    mood: '가족 사진, 추억 앨범', characteristics: ['따뜻한 톤', '스크랩북', '데코 스티커', '추억'], texture: '스크랩북 질감', layoutGuide: '사진 콜라주, 캡션' },
  { id: 'portfolio_photo', name: '포트폴리오', category: '포토', style: { bg: '#18181B', text: '#FAFAFA', accent: '#FFFFFF', font: 'Inter' },
    mood: '사진작가 포트폴리오', characteristics: ['풀 블리드', '미니멀', '작품 중심', '다크'], texture: '없음', layoutGuide: '풀 사이즈 이미지, 캡션' },
  { id: 'bw_gallery', name: '흑백 갤러리', category: '포토', style: { bg: '#F5F5F5', text: '#1A1A1A', accent: '#525252', font: 'Playfair Display' },
    mood: '흑백 사진, 아트 갤러리', characteristics: ['흑백', '고대비', '예술적', '미니멀'], texture: '없음', layoutGuide: '단독 이미지, 작품 정보' },
  { id: 'film_camera', name: '필름 카메라', category: '포토', style: { bg: '#292524', text: '#FEF3C7', accent: '#F59E0B', font: 'Space Mono' },
    mood: '필름 사진, 아날로그', characteristics: ['필름 그레인', '빈티지 톤', '프레임 번호', '향수'], texture: '필름 그레인', layoutGuide: '필름 스트립, 셔터 정보' },
  { id: 'polaroid_book', name: '폴라로이드', category: '포토', style: { bg: '#FFFFFF', text: '#374151', accent: '#EC4899', font: 'Caveat' },
    mood: '폴라로이드, 인스턴트 사진', characteristics: ['흰 테두리', '손글씨 캡션', '캐주얼', '추억'], texture: '없음', layoutGuide: '폴라로이드 프레임 그리드' },

  // ========== 테크니컬 (6) ==========
  { id: 'api_docs', name: 'API 문서', category: '테크니컬', style: { bg: '#0F172A', text: '#E2E8F0', accent: '#38BDF8', font: 'JetBrains Mono' },
    mood: 'Stripe API, 개발 문서', characteristics: ['코드 블록', 'endpoint 목록', '파라미터 표', '다크 모드'], texture: '없음', layoutGuide: '코드 예시, 파라미터 테이블' },
  { id: 'dashboard', name: '대시보드', category: '테크니컬', style: { bg: '#111827', text: '#F9FAFB', accent: '#6366F1', font: 'Inter' },
    mood: 'Grafana, 관제 대시보드', characteristics: ['차트 그리드', '실시간 데이터', '상태 표시', '다크'], texture: '없음', layoutGuide: '차트 패널 그리드' },
  { id: 'terminal', name: '터미널', category: '테크니컬', style: { bg: '#1E1E1E', text: '#4EC9B0', accent: '#DCDCAA', font: 'Fira Code' },
    mood: 'VS Code, 터미널', characteristics: ['코드 하이라이팅', '프롬프트', '모노스페이스', '해커'], texture: '없음', layoutGuide: '코드 편집기 스타일' },
  { id: 'datacenter', name: '데이터센터', category: '테크니컬', style: { bg: '#0F172A', text: '#CBD5E1', accent: '#22D3EE', font: 'Roboto Mono' },
    mood: 'AWS, 인프라 모니터링', characteristics: ['서버 랙', '네트워크 토폴로지', '모니터링', '블루'], texture: '없음', layoutGuide: '토폴로지 다이어그램, 메트릭' },
  { id: 'ai_ml', name: 'AI/ML', category: '테크니컬', style: { bg: '#0D0D0D', text: '#FFFFFF', accent: '#A855F7', font: 'Space Grotesk' },
    mood: 'OpenAI, AI 연구', characteristics: ['뉴럴넷 시각화', '매트릭스', '모델 아키텍처', '미래적'], texture: '없음', layoutGuide: '모델 다이어그램, 성능 차트' },
  { id: 'blockchain', name: '블록체인', category: '테크니컬', style: { bg: '#0C0C1D', text: '#FFFFFF', accent: '#F7931A', font: 'Orbitron' },
    mood: '비트코인, Web3', characteristics: ['체인 시각화', '해시', '노드', '탈중앙'], texture: '없음', layoutGuide: '블록 다이어그램, 트랜잭션' },
];

// 카테고리 목록
const CATEGORIES = ['전체', ...Array.from(new Set(TEMPLATES.map(t => t.category)))];

// 미니 프리뷰 렌더러
function MiniPreview({ id, style }: { id: string; style: { bg: string; text: string; accent: string; font: string } }) {
  switch (id) {
    // 심플
    case 'minimal': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] tracking-widest" style={{color: style.text, fontFamily: style.font}}>MINIMAL</div><div className="absolute top-1/3 left-4 right-4 h-px" style={{backgroundColor: style.accent}}/><div className="absolute bottom-1/3 left-4 right-4 h-px" style={{backgroundColor: style.accent}}/></>;
    case 'monochrome': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[12px] font-bold tracking-wider" style={{color: style.text}}>B&W</div></>;
    case 'nordic': return <><div className="absolute top-3 right-3 w-6 h-6 rounded-full" style={{backgroundColor: style.accent+'30'}}/><div className="absolute bottom-3 left-3 text-[7px]" style={{color: style.text, fontFamily: style.font}}>nordic</div></>;
    case 'wireframe': return <><div className="absolute inset-3 border border-dashed" style={{borderColor: style.accent}}><div className="absolute top-1 left-1 text-[5px]" style={{color: style.accent}}>[ ]</div></div></>;
    case 'paper': return <><div className="absolute top-3 left-4 right-4 text-[6px] font-serif" style={{color: style.text}}>White Paper</div><div className="absolute bottom-3 left-4 right-4 text-[5px] text-center" style={{color: style.accent}}>— 1 —</div></>;
    case 'muji': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[7px]" style={{color: style.text}}>無印</div></>;
    case 'zen': return <><div className="absolute top-1/2 right-4 text-[7px]" style={{color: style.text, fontFamily: 'serif'}}>禅</div><div className="absolute bottom-3 left-3 w-8 h-px" style={{backgroundColor: style.accent}}/></>;
    case 'clean': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-8 rounded-lg shadow-md" style={{backgroundColor: '#fff', border: `1px solid ${style.accent}20`}}><div className="w-full h-1 rounded-t-lg" style={{backgroundColor: style.accent}}/></div></>;

    // 모던
    case 'cyberpunk': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] font-mono" style={{color: style.text, textShadow: `0 0 10px ${style.text}`}}>CYBER</div><div className="absolute bottom-2 left-2 right-2 h-px" style={{backgroundColor: style.accent}}/></>;
    case 'swiss': return <><div className="absolute top-3 left-3 w-3 h-3 rounded-full" style={{backgroundColor: style.accent}}/><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold" style={{color: style.text}}>Aa</div></>;
    case 'glassmorphism': return <><div className="absolute inset-3 rounded-lg" style={{backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)'}}/></>;
    case 'brutalist': return <><div className="absolute inset-3 border-2" style={{borderColor: style.text}}><div className="absolute top-1 left-1 text-[6px] font-mono" style={{color: style.accent}}>RAW</div></div></>;
    case 'gradient': return <><div className="absolute inset-0 rounded" style={{background: `linear-gradient(135deg, ${style.bg}, ${style.accent})`}}/><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[7px]" style={{color: style.text}}>gradient</div></>;
    case 'neomorphism': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-lg" style={{backgroundColor: style.bg, boxShadow: '3px 3px 6px #b8b9be, -3px -3px 6px #ffffff'}}/></>;
    case 'dark_luxury': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] font-serif italic" style={{color: style.accent}}>Luxury</div></>;
    case 'memphis': return <><div className="absolute top-3 left-3 w-4 h-4 rotate-45" style={{backgroundColor: style.accent}}/><div className="absolute bottom-3 right-3 w-5 h-5 rounded-full border-2" style={{borderColor: style.text}}/><div className="absolute top-5 right-5 w-0 h-0 border-l-[4px] border-r-[4px] border-b-[7px] border-transparent" style={{borderBottomColor: '#FFD93D'}}/></>;
    case 'aurora': return <><div className="absolute inset-0 rounded" style={{background: `radial-gradient(ellipse at top, ${style.accent}40, transparent 70%)`}}/><div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[6px]" style={{color: style.text}}>aurora</div></>;
    case 'split_tone': return <><div className="absolute inset-0 rounded" style={{background: `linear-gradient(90deg, ${style.bg} 50%, ${style.accent} 50%)`}}/><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[7px] font-bold" style={{color: style.text}}>SPLIT</div></>;

    // 비즈니스
    case 'corporate': return <><div className="absolute top-2 left-2 w-4 h-1 rounded" style={{backgroundColor: style.accent}}/><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[6px]" style={{color: style.text}}>REPORT</div></>;
    case 'startup': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[14px] font-bold" style={{color: style.accent}}>$1M</div></>;
    case 'consulting': return <><div className="absolute top-3 left-3 right-3 bottom-3 grid grid-cols-2 gap-1">{[1,2,3,4].map(i=><div key={i} className="border rounded" style={{borderColor: style.accent+'40'}}/>)}</div></>;
    case 'finance': return <><div className="absolute bottom-3 left-3 right-3 flex items-end gap-1" style={{height:'16px'}}>{[40,70,55,85,65].map((h,i)=><div key={i} className="flex-1 rounded-t" style={{height:`${h}%`, backgroundColor: style.accent}}/>)}</div></>;
    case 'marketing': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded text-[6px] font-bold" style={{backgroundColor: style.accent, color: '#fff'}}>CTA</div></>;
    case 'legal': return <><div className="absolute top-3 left-3 text-[6px]" style={{color: style.text}}>§1</div><div className="absolute top-6 left-3 right-3 space-y-1">{[1,2].map(i=><div key={i} className="h-px" style={{backgroundColor: style.accent+'40'}}/>)}</div></>;
    case 'real_estate': return <><div className="absolute inset-0 rounded" style={{backgroundColor: style.bg}}/><div className="absolute bottom-3 left-3 text-[6px] font-serif" style={{color: style.accent}}>Premium</div></>;
    case 'hr': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">👥</div></>;
    case 'ecommerce': return <><div className="absolute top-3 left-3 right-3 h-8 rounded border" style={{borderColor: style.accent+'40'}}><div className="absolute bottom-0 left-0 right-0 text-[5px] text-center" style={{color: style.accent}}>₩9,900</div></div></>;
    case 'logistics': return <><div className="absolute top-2 left-2 text-[6px]" style={{color: style.accent}}>📦 →</div></>;

    // 교육/학문
    case 'academic': return <><div className="absolute top-4 left-4 right-4"><div className="text-[8px] font-serif" style={{color: style.text}}>Abstract</div><div className="w-full h-px mt-1" style={{backgroundColor: style.accent}}/></div></>;
    case 'history': return <><div className="absolute inset-3 border" style={{borderColor: style.accent+'40'}}/><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] font-serif" style={{color: style.text}}>歷史</div></>;
    case 'science': return <><div className="absolute top-2 left-2 text-[6px] font-mono" style={{color: style.accent}}>{'>'} LAB</div><div className="absolute bottom-3 right-3 w-8 h-5 border rounded" style={{borderColor: style.accent}}><div className="absolute bottom-0 left-0 right-0 h-1/2" style={{backgroundColor: style.accent+'40'}}/></div></>;
    case 'math': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-mono" style={{color: style.text}}>∑∞</div></>;
    case 'thesis': return <><div className="absolute top-3 left-1/2 -translate-x-1/2 w-8 h-1" style={{backgroundColor: style.accent}}/><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[7px] font-serif text-center" style={{color: style.text}}>THESIS</div></>;
    case 'encyclopedia': return <><div className="absolute top-3 left-3 w-1 h-10" style={{backgroundColor: style.accent}}/><div className="absolute top-3 left-5 w-1 h-10" style={{backgroundColor: style.accent+'60'}}/><div className="absolute bottom-3 right-3 text-[6px]" style={{color: style.text}}>Vol.1</div></>;
    case 'sunday_comics': return <><div className="absolute top-2 left-2 right-2 bottom-2 grid grid-cols-2 gap-0.5">{[1,2,3,4].map(i=><div key={i} className="border" style={{borderColor: style.text+'40'}}/>)}</div></>;
    case 'language': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] font-bold" style={{color: style.accent}}>ABC</div></>;

    // 크리에이티브
    case 'watercolor': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-10 rounded-full opacity-30" style={{backgroundColor: style.accent, filter: 'blur(8px)'}}/><div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[8px]" style={{color: style.text, fontFamily: 'cursive'}}>water</div></>;
    case 'neon_sign': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px]" style={{color: style.text, textShadow: `0 0 10px ${style.text}, 0 0 20px ${style.text}`, fontFamily: 'cursive'}}>Open</div></>;
    case 'risograph': return <><div className="absolute top-3 left-3 w-10 h-10 rounded-full" style={{backgroundColor: style.accent, mixBlendMode: 'multiply'}}/><div className="absolute top-5 left-5 w-10 h-10 rounded-full" style={{backgroundColor: style.text, mixBlendMode: 'multiply', opacity: 0.5}}/></>;
    case 'abstract': return <><div className="absolute top-4 right-4 w-8 h-8 rounded-full" style={{backgroundColor: style.accent+'40'}}/><div className="absolute bottom-6 left-6 w-12 h-4" style={{backgroundColor: style.accent+'60'}}/></>;
    case 'comic': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-1 bg-white border-2 rounded" style={{borderColor: style.text}}><span className="text-[8px] font-bold" style={{color: style.text}}>BOOM!</span></div></>;
    case 'sticker': return <>{['😀','⭐','❤️'].map((e,i)=><div key={i} className="absolute text-sm" style={{top: 10+i*12, left: 10+i*15}}>{e}</div>)}</>;
    case 'hologram': return <><div className="absolute inset-2 rounded" style={{background: 'linear-gradient(135deg, #ff00ff40, #00ffff40, #ffff0040)'}}/></>;
    case '3d_render': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px]" style={{color: style.accent}}>3D</div></>;
    case 'motion': return <><div className="absolute top-2 left-2 text-[6px]" style={{color: style.accent}}>▶</div><div className="absolute bottom-2 right-2 text-[5px]" style={{color: style.text}}>MOTION</div></>;
    case 'ar_vr': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px]" style={{color: style.accent}}>XR</div></>;

    // 소셜미디어
    case 'youtube_thumb': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] font-bold" style={{color: style.accent}}>▶ PLAY</div></>;
    case 'tiktok': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px]" style={{color: style.accent}}>♪</div></>;
    case 'linkedin': return <><div className="absolute top-2 left-2 text-[6px] font-bold" style={{color: style.accent}}>in</div></>;
    case 'twitter': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px]" style={{color: style.accent}}>𝕏</div></>;
    case 'pinterest': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold" style={{color: style.accent}}>P</div></>;
    case 'brunch': return <><div className="absolute top-3 left-3 right-3 space-y-1">{[1,2,3].map(i=><div key={i} className="h-px" style={{backgroundColor: style.accent+'40'}}/>)}</div><div className="absolute bottom-3 left-3 text-[6px]" style={{color: style.accent}}>b.</div></>;
    case 'newsletter': return <><div className="absolute top-2 left-3 right-3 h-px" style={{backgroundColor: style.accent}}/><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[6px]" style={{color: style.text}}>📧 NEWS</div></>;
    case 'instagram': return <><div className="absolute inset-3 border rounded" style={{borderColor: style.accent+'60'}}/><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px]" style={{color: style.accent}}>📷</div></>;

    // 이벤트
    case 'wedding': return <><div className="absolute inset-3 border" style={{borderColor: style.accent}}/><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[7px] font-serif" style={{color: style.accent}}>♥</div></>;
    case 'birthday': return <><div className="absolute top-2 left-1/2 -translate-x-1/2 text-sm">🎂</div><div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[6px]" style={{color: style.accent}}>HBD!</div></>;
    case 'graduation': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🎓</div></>;
    case 'doljanchi': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">👶</div></>;
    case 'conference': return <><div className="absolute top-2 left-2 text-[5px]" style={{color: style.accent}}>CONF</div><div className="absolute bottom-3 left-3 right-3 flex gap-1">{[1,2,3].map(i=><div key={i} className="flex-1 h-2 rounded" style={{backgroundColor: style.accent+'40'}}/>)}</div></>;
    case 'exhibition': return <><div className="absolute inset-4 border" style={{borderColor: style.text}}/></>;
    case 'festival_event': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[7px] font-bold" style={{color: style.accent}}>FEST</div></>;
    case 'seminar': return <><div className="absolute top-3 left-3 text-[6px]" style={{color: style.accent}}>🎤</div><div className="absolute bottom-3 left-3 right-3 h-px" style={{backgroundColor: style.accent}}/></>;

    // 한국 전통
    case 'dancheong': return <><div className="absolute inset-2 border-2" style={{borderColor: style.accent}}/><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px]" style={{color: style.text}}>丹靑</div></>;
    case 'hanji': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px]" style={{color: style.text, fontFamily: 'serif'}}>韓紙</div></>;
    case 'bojagi': return <><div className="absolute top-2 left-2 right-2 bottom-2 grid grid-cols-3 gap-0.5">{['#E74C3C','#3498DB','#F1C40F','#2ECC71','#9B59B6','#E67E22','#1ABC9C','#E91E63','#3F51B5'].map((c,i)=><div key={i} style={{backgroundColor: c, opacity: 0.6}}/>)}</div></>;
    case 'calligraphy': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[14px] font-bold" style={{color: style.text}}>書</div></>;
    case 'celadon': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-10 rounded-full border" style={{borderColor: style.accent}}/></>;
    case 'hanbok': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">👘</div></>;

    // 산업/제조
    case 'factory': return <><div className="absolute top-2 right-2 text-[6px]" style={{color: style.accent}}>⚙️</div><div className="absolute bottom-3 left-3 right-3 h-2 rounded" style={{backgroundColor: style.accent+'40'}}><div className="h-full w-3/4 rounded" style={{backgroundColor: style.accent}}/></div></>;
    case 'construction': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🏗️</div></>;
    case 'semiconductor': return <><div className="absolute inset-3 border" style={{borderColor: style.accent+'40'}}><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border" style={{borderColor: style.accent}}/></div></>;
    case 'automotive': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🚗</div></>;
    case 'shipbuilding': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🛳</div></>;
    case 'aerospace': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🚀</div></>;
    case 'energy_plant': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">⚡</div></>;
    case 'smart_factory': return <><div className="absolute top-2 left-2 text-[6px] font-mono" style={{color: style.accent}}>IoT</div><div className="absolute bottom-2 right-2 w-3 h-3 rounded-full border" style={{borderColor: style.accent}}/></>;

    // 부동산/건축
    case 'apartment': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🏢</div></>;
    case 'interior': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🛋️</div></>;
    case 'architecture': return <><div className="absolute inset-3 border" style={{borderColor: style.accent}}><div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-px" style={{backgroundColor: style.accent}}/></div></>;
    case 'landscape': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🌳</div></>;
    case 'commercial': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🏬</div></>;
    case 'office_building': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🏢</div></>;
    case 'remodeling': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[7px]" style={{color: style.accent}}>Before→After</div></>;
    case 'model_house': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[7px] font-serif" style={{color: style.accent}}>VIP</div></>;

    // 음식
    case 'cafe': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">☕</div></>;
    case 'restaurant': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🍽️</div></>;
    case 'korean_food': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🍚</div></>;
    case 'bakery': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🥐</div></>;
    case 'bar': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🍸</div></>;
    case 'vegan': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🥗</div></>;
    case 'mealkit': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🍱</div></>;
    case 'street_food': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🍢</div></>;

    // 여행
    case 'travel': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">✈️</div></>;
    case 'resort': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🏖️</div></>;
    case 'cruise': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🛳</div></>;
    case 'backpacking': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🎒</div></>;
    case 'glamping': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">⛺</div></>;
    case 'themepark': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🎢</div></>;
    case 'temple_stay': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🏯</div></>;
    case 'city_guide': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🗺️</div></>;

    // 건강/웰빙
    case 'hospital': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px]" style={{color: style.accent}}>+</div></>;
    case 'yoga': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🧘</div></>;
    case 'diet': return <><div className="absolute top-2 left-2 text-sm">🥗</div><div className="absolute bottom-2 right-2 text-[6px]" style={{color: style.accent}}>kcal</div></>;
    case 'mental_care': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">💙</div></>;
    case 'nutrition': return <><div className="absolute top-2 left-2 text-[6px]" style={{color: style.accent}}>영양</div><div className="absolute bottom-2 right-2 text-sm">💊</div></>;
    case 'spa': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🌸</div></>;
    case 'pilates': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px]" style={{color: style.accent}}>PILATES</div></>;
    case 'dental': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🦷</div></>;

    // 스포츠
    case 'soccer': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">⚽</div></>;
    case 'basketball': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🏀</div></>;
    case 'fitness': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">💪</div></>;
    case 'golf': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">⛳</div></>;
    case 'swimming': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🏊</div></>;
    case 'tennis': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🎾</div></>;
    case 'skiing': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">⛷</div></>;
    case 'martial_arts': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🥊</div></>;

    // 뮤직/공연
    case 'concert_poster': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] font-bold" style={{color: style.accent}}>LIVE</div></>;
    case 'album_art': return <><div className="absolute inset-2 rounded" style={{backgroundColor: style.accent, opacity: 0.3}}/></>;
    case 'musical': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🎭</div></>;
    case 'orchestra': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🎻</div></>;
    case 'hiphop': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] font-bold" style={{color: style.accent}}>HIP HOP</div></>;
    case 'indie': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px]" style={{color: style.accent}}>INDIE</div></>;
    case 'classical': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🎻</div></>;
    case 'gugak': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px]" style={{color: style.accent}}>國</div></>;

    // 키즈
    case 'fairytale': return <><div className="absolute top-2 right-2 text-sm">📖</div><div className="absolute bottom-2 left-2 text-sm">🏰</div></>;
    case 'early_education': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🎨</div></>;
    case 'alphabet': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-bold" style={{color: style.accent}}>A</div></>;
    case 'numbers': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-bold" style={{color: style.accent}}>123</div></>;
    case 'coloring': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🖍</div></>;
    case 'kids_science': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🔬</div></>;

    // 포토
    case 'wedding_album': return <><div className="absolute inset-3 border" style={{borderColor: style.accent}}/><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px]" style={{color: style.accent}}>PHOTO</div></>;
    case 'family_photo': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">👨‍👩‍👧</div></>;
    case 'portfolio_photo': return <><div className="absolute inset-2 bg-zinc-800 rounded"/></>;
    case 'bw_gallery': return <><div className="absolute inset-3 border" style={{borderColor: style.text}}/></>;
    case 'film_camera': return <><div className="absolute top-2 left-2 text-[5px]" style={{color: style.accent}}>35mm</div><div className="absolute bottom-2 right-2 text-[5px]" style={{color: style.text}}>FILM</div></>;
    case 'polaroid_book': return <><div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-6 bg-white border border-zinc-300 rounded-sm"/></>;

    // 테크니컬
    case 'api_docs': return <><div className="absolute top-2 left-2 text-[5px] font-mono" style={{color: style.accent}}>GET /api</div><div className="absolute bottom-2 left-2 right-2 h-3 rounded" style={{backgroundColor: style.accent+'20'}}/></>;
    case 'dashboard': return <><div className="absolute top-2 left-2 right-2 bottom-2 grid grid-cols-2 gap-1">{[1,2,3,4].map(i=><div key={i} className="rounded" style={{backgroundColor: style.accent+'20'}}/>)}</div></>;
    case 'terminal': return <><div className="absolute top-2 left-2 text-[5px] font-mono" style={{color: style.text}}>$ _</div></>;
    case 'datacenter': return <><div className="absolute top-2 left-2 w-2 h-6 rounded" style={{backgroundColor: style.accent, opacity: 0.5}}/><div className="absolute top-2 left-5 w-2 h-6 rounded" style={{backgroundColor: style.accent, opacity: 0.5}}/></>;
    case 'ai_ml': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px]" style={{color: style.accent}}>AI</div></>;
    case 'blockchain': return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[7px] font-mono" style={{color: style.accent}}>₿</div></>;

    // 기본 fallback
    default: return <><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[7px]" style={{color: style.accent}}>{id.slice(0,4)}</div></>;
  }
}

// 상세 패널
function DetailPanel({ template, onClose, onCopyStyle }: {
  template: typeof TEMPLATES[0];
  onClose: () => void;
  onCopyStyle: (style: typeof TEMPLATES[0]['style']) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopyStyle(template.style);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* 프리뷰 헤더 */}
        <div className="relative h-48 rounded-t-2xl overflow-hidden" style={{backgroundColor: template.style.bg}}>
          <MiniPreview id={template.id} style={template.style} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <h2 className="text-xl font-bold" style={{color: template.style.text}}>{template.name}</h2>
            <p className="text-xs mt-1" style={{color: template.style.accent}}>{template.mood}</p>
          </div>
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-white hover:bg-black/40 transition">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* 컬러 팔레트 */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-700 mb-2">컬러 팔레트</h3>
            <div className="flex gap-3">
              {[
                { label: '배경', color: template.style.bg },
                { label: '텍스트', color: template.style.text },
                { label: '포인트', color: template.style.accent },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg border border-zinc-200" style={{ backgroundColor: color }} />
                  <div>
                    <div className="text-[10px] text-zinc-400">{label}</div>
                    <div className="text-xs font-mono text-zinc-600">{color}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 폰트 */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-700 mb-1">폰트</h3>
            <p className="text-sm text-zinc-500">{template.style.font}</p>
          </div>

          {/* 특성 */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-700 mb-2">특성</h3>
            <div className="flex flex-wrap gap-1.5">
              {template.characteristics.map(c => (
                <span key={c} className="px-2 py-0.5 text-xs rounded-full bg-zinc-100 text-zinc-600">{c}</span>
              ))}
            </div>
          </div>

          {/* 텍스처 */}
          {template.texture !== '없음' && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-700 mb-1">텍스처</h3>
              <p className="text-sm text-zinc-500">{template.texture}</p>
            </div>
          )}

          {/* 레이아웃 가이드 */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-700 mb-1">레이아웃 가이드</h3>
            <p className="text-sm text-zinc-500">{template.layoutGuide}</p>
          </div>

          {/* 액션 버튼 */}
          <button
            onClick={handleCopy}
            className="w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all"
            style={{
              backgroundColor: copied ? '#22C55E' : template.style.accent,
              color: '#FFFFFF',
            }}
          >
            {copied ? <><Check size={16} /> 복사됨!</> : <><Copy size={16} /> 스타일 복사</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES[0] | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter(t => {
      const matchCategory = selectedCategory === '전체' || t.category === selectedCategory;
      const matchSearch = searchQuery === '' ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.mood.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.characteristics.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleCopyStyle = (style: typeof TEMPLATES[0]['style']) => {
    navigator.clipboard.writeText(JSON.stringify(style, null, 2));
  };

  const handleQuickCopy = (e: React.MouseEvent, template: typeof TEMPLATES[0]) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(template.style, null, 2));
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={20} className="text-purple-500" />
          <h1 className="text-2xl font-bold">디자인 템플릿</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {TEMPLATES.length}개의 디자인 스타일 중 선택하세요
        </p>
      </div>

      {/* 검색 + 필터 */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="스타일 검색 (이름, 분위기, 특성...)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs rounded-full transition-all ${
                selectedCategory === cat
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 결과 카운트 */}
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Grid3X3 size={14} />
        <span>{filteredTemplates.length}개 템플릿</span>
        {selectedCategory !== '전체' && (
          <span className="flex items-center gap-1">
            <Layers size={14} />
            {selectedCategory}
          </span>
        )}
      </div>

      {/* 템플릿 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filteredTemplates.map(template => (
          <div
            key={template.id}
            onClick={() => setSelectedTemplate(template)}
            className="group cursor-pointer rounded-xl border border-zinc-200 overflow-hidden hover:shadow-lg hover:border-zinc-300 transition-all hover:-translate-y-0.5"
          >
            {/* 미니 프리뷰 */}
            <div className="relative h-20 overflow-hidden" style={{ backgroundColor: template.style.bg }}>
              <MiniPreview id={template.id} style={template.style} />
              {/* 빠른 복사 버튼 */}
              <button
                onClick={(e) => handleQuickCopy(e, template)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/40"
              >
                {copiedId === template.id ? <Check size={10} /> : <Copy size={10} />}
              </button>
            </div>
            {/* 정보 */}
            <div className="p-2">
              <div className="text-xs font-medium text-zinc-800 truncate">{template.name}</div>
              <div className="text-[10px] text-zinc-400 truncate">{template.category}</div>
              {/* 색상 팔레트 미니 */}
              <div className="flex gap-1 mt-1.5">
                {[template.style.bg, template.style.text, template.style.accent].map((color, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full border border-zinc-200"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-zinc-400">
          <Search size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">검색 결과가 없습니다</p>
        </div>
      )}

      {/* 상세 모달 */}
      {selectedTemplate && (
        <DetailPanel
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onCopyStyle={handleCopyStyle}
        />
      )}
    </div>
  );
}
