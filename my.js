/**
 * SpaceOut - my.js
 * 공강 시간 활용 도우미 메인 스크립트
 * HTML + CSS + 순수 JavaScript (ES6+)
 */

'use strict';

/* ═══════════════════════════════════════════
   1. 앱 상태 (State)
═══════════════════════════════════════════ */
const state = {
  classes: [],      // TimeSlot[]
  gapBlocks: {},    // { [dayOfWeek]: GapBlock[] }
  friends: [],      // { name, code, classes }
  myShareCode: null,
  activeTab: 'dashboard',
  countdownInterval: null,
};

const DAY_NAMES = ['', '월', '화', '수', '목', '금'];
const TODAY_DOW = (() => {
  const d = new Date().getDay(); // 0=일, 1=월 … 6=토
  return (d === 0 || d === 6) ? 1 : d; // 주말이면 월요일로 대체 (데모용)
})();

/* ═══════════════════════════════════════════
   2. 활동 데이터베이스 (Activity DB)
═══════════════════════════════════════════ */
const ACTIVITY_DB = {
  MICRO: [
    { icon: '🛋️', title: '라운지에서 잠깐 쉬기', desc: '단과대 라운지나 복도 소파에서 스트레칭!', tag: '휴식' },
    { icon: '☕', title: '자판기 음료 한 잔', desc: '달달한 음료로 다음 수업 에너지 충전', tag: '간식' },
    { icon: '📖', title: '다음 수업 교재 훑기', desc: '10~15분 예습으로 수업 이해도 UP', tag: '학습' },
    { icon: '📱', title: '에브리타임 확인', desc: '공지사항, 족보, 강의평 체크타임', tag: '정보' },
    { icon: '🧘', title: '눈 감고 잠깐 명상', desc: '5~10분의 짧은 마음챙김으로 집중력 회복', tag: '휴식' },
  ],
  SHORT: [
    { icon: '🍚', title: '학식 빠르게 먹기', desc: '학생식당에서 오늘의 메뉴 도전!', tag: '식사' },
    { icon: '☕', title: '테이크아웃 카페', desc: '캠퍼스 인근 카페에서 음료 픽업', tag: '카페' },
    { icon: '😴', title: '수면실 낮잠', desc: '20분 파워냅으로 오후 집중력 충전', tag: '수면' },
    { icon: '📝', title: '짧은 퀴즈 복습', desc: '오늘 배운 내용 셀프 퀴즈 풀기', tag: '학습' },
    { icon: '🚶', title: '캠퍼스 산책', desc: '햇빛 받으며 가볍게 20분 산책', tag: '운동' },
    { icon: '🖨️', title: '프린트실 과제 출력', desc: '제출 전 최종 확인 + 출력 완료', tag: '심부름' },
  ],
  DEEP: [
    { icon: '📚', title: '중앙도서관 과제', desc: '열람실 노트북존에서 집중 과제 타임', tag: '학습' },
    { icon: '🍜', title: '캠퍼스 인근 식당', desc: '교문 밖 맛집에서 든든하게 점심!', tag: '식사' },
    { icon: '🏋️', title: '체육시설 운동', desc: '헬스장 or 풋살장에서 스트레스 해소', tag: '운동' },
    { icon: '💻', title: '팀플 미팅', desc: '빈 강의실이나 스터디룸 예약 후 팀플', tag: '학습' },
    { icon: '🎨', title: '동아리 활동', desc: '동아리방 들러서 회원들과 교류', tag: '여가' },
    { icon: '🛒', title: '학교 근처 쇼핑', desc: '필요한 문구류·생필품 구매 타임', tag: '심부름' },
  ],
  MEGA: [
    { icon: '🧑‍💻', title: '스터디카페 집중 코딩', desc: '개인 프로젝트 or 과제 몰입 세션', tag: '학습' },
    { icon: '🎬', title: '영화 한 편 관람', desc: '근처 CGV·롯데시네마 낮 시간대 할인', tag: '여가' },
    { icon: '🏠', title: '귀가 후 충분한 휴식', desc: '집에서 재충전하고 저녁 수업 준비', tag: '휴식' },
    { icon: '📖', title: '전공 서적 독서', desc: '도서관에서 관심 분야 책 한 챕터', tag: '학습' },
    { icon: '🤝', title: '친구들과 카공', desc: '같은 공강 친구들과 카페 스터디', tag: '소셜' },
    { icon: '🏃', title: '야외 운동 & 산책', desc: '캠퍼스 둘레길 or 근처 공원 조깅', tag: '운동' },
  ],
};

/* ═══════════════════════════════════════════
   3. 유틸리티 함수
═══════════════════════════════════════════ */

/** "HH:MM" → 분 단위 정수 */
function timeToMin(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** 분 단위 정수 → "HH:MM" */
function minToTime(mins) {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/** 분 → "X시간 Y분" 형태 */
function formatDuration(mins) {
  if (mins < 60) return `${mins}분`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}

/** 분 → "HH:MM:SS" 형태 (카운트다운용) */
function formatCountdown(totalSec) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** 공강 길이 → Tier 레이블 */
function getTier(mins) {
  if (mins < 45)  return 'MICRO';
  if (mins < 90)  return 'SHORT';
  if (mins < 180) return 'DEEP';
  return 'MEGA';
}

/** Tier → 한국어 레이블 */
const TIER_KO = {
  MICRO: '⚡ 마이크로',
  SHORT: '🌿 숏',
  DEEP:  '📘 딥',
  MEGA:  '🚀 메가',
};

/** 랜덤 6자리 영숫자 코드 */
function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

/** LocalStorage 저장 */
function saveToStorage() {
  localStorage.setItem('spaceout_classes', JSON.stringify(state.classes));
  localStorage.setItem('spaceout_friends', JSON.stringify(state.friends));
  if (state.myShareCode) {
    localStorage.setItem('spaceout_mycode', state.myShareCode);
  }
}

/** LocalStorage 불러오기 */
function loadFromStorage() {
  try {
    const cls = localStorage.getItem('spaceout_classes');
    if (cls) state.classes = JSON.parse(cls);
    const fr = localStorage.getItem('spaceout_friends');
    if (fr) state.friends = JSON.parse(fr);
    const code = localStorage.getItem('spaceout_mycode');
    if (code) state.myShareCode = code;
  } catch (e) {
    console.warn('스토리지 불러오기 실패:', e);
  }
}

/** 토스트 메시지 표시 */
function showToast(msg, duration = 2500) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

/* ═══════════════════════════════════════════
   4. 공강 블록 계산 엔진
═══════════════════════════════════════════ */

/**
 * 특정 요일의 공강 블록을 계산합니다.
 * @param {number} day - 1(월) ~ 5(금)
 * @returns {Array} GapBlock 배열
 */
function computeGapsForDay(day) {
  const dayClasses = state.classes
    .filter(c => c.dayOfWeek === day)
    .sort((a, b) => timeToMin(a.startTime) - timeToMin(b.startTime));

  if (dayClasses.length < 2) return [];

  const gaps = [];
  for (let i = 0; i < dayClasses.length - 1; i++) {
    const endMin   = timeToMin(dayClasses[i].endTime);
    const nextStart = timeToMin(dayClasses[i + 1].startTime);
    const dur = nextStart - endMin;

    if (dur >= 15) { // 15분 이상만 유효 공강
      const tier = getTier(dur);
      gaps.push({
        id: `gap-${day}-${i}`,
        dayOfWeek: day,
        startTime: dayClasses[i].endTime,
        endTime:   dayClasses[i + 1].startTime,
        durationMinutes: dur,
        tier,
        previousLocation: dayClasses[i].location || '',
        nextLocation: dayClasses[i + 1].location || '',
      });
    }
  }
  return gaps;
}

/** 모든 요일 공강 재계산 */
function recomputeAllGaps() {
  for (let d = 1; d <= 5; d++) {
    state.gapBlocks[d] = computeGapsForDay(d);
  }
}

/* ═══════════════════════════════════════════
   5. 렌더링 함수
═══════════════════════════════════════════ */

/* ── 5-1. 날짜 표시 ── */
function renderTodayDate() {
  const el = document.getElementById('today-date');
  const now = new Date();
  el.textContent = now.toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });
  el.setAttribute('datetime', now.toISOString().slice(0, 10));
}

/* ── 5-2. 오늘 타임라인 ── */
function renderTimeline() {
  const bar  = document.getElementById('timeline-bar');
  const axis = document.getElementById('timeline-axis');

  const dayClasses = state.classes
    .filter(c => c.dayOfWeek === TODAY_DOW)
    .sort((a, b) => timeToMin(a.startTime) - timeToMin(b.startTime));

  const gaps = state.gapBlocks[TODAY_DOW] || [];

  if (dayClasses.length === 0) {
    bar.innerHTML  = '<p class="empty-msg">오늘 등록된 수업이 없습니다. 시간표 탭에서 추가해보세요!</p>';
    axis.innerHTML = '';
    return;
  }

  // 타임라인 범위: 첫 수업 시작 ~ 마지막 수업 종료
  const minStart = timeToMin(dayClasses[0].startTime);
  const maxEnd   = timeToMin(dayClasses[dayClasses.length - 1].endTime);
  const totalMin = maxEnd - minStart;

  // 축 레이블
  axis.innerHTML = '';
  const labels = [minStart, ...dayClasses.map(c => timeToMin(c.endTime))];
  const uniqueLabels = [...new Set(labels)];
  uniqueLabels.forEach(m => {
    const pct = ((m - minStart) / totalMin) * 100;
    const span = document.createElement('span');
    span.style.position = 'absolute';
    span.style.left = `${pct}%`;
    span.textContent = minToTime(m);
    axis.style.position = 'relative';
    axis.style.height = '16px';
    axis.appendChild(span);
  });

  // 블록 생성
  bar.innerHTML = '';
  const allBlocks = [
    ...dayClasses.map(c => ({ ...c, type: 'class' })),
    ...gaps.map(g => ({ ...g, type: 'gap' })),
  ];

  allBlocks.forEach(block => {
    const s   = timeToMin(block.startTime);
    const e   = timeToMin(block.endTime);
    const left = ((s - minStart) / totalMin) * 100;
    const width = ((e - s) / totalMin) * 100;

    const div = document.createElement('div');
    div.style.left  = `${left}%`;
    div.style.width = `${Math.max(width, 0.5)}%`;

    if (block.type === 'class') {
      div.className = 'timeline-block class-block';
      div.textContent = block.title;
      div.title = `${block.title}\n${block.startTime}~${block.endTime}${block.location ? '\n' + block.location : ''}`;
    } else {
      div.className = `timeline-block gap-${block.tier}`;
      div.textContent = formatDuration(block.durationMinutes);
      div.title = `공강 ${formatDuration(block.durationMinutes)}\n${block.startTime}~${block.endTime}`;
    }
    bar.appendChild(div);
  });
}

/* ── 5-3. 카운트다운 ── */
function startCountdown() {
  if (state.countdownInterval) clearInterval(state.countdownInterval);

  const display = document.getElementById('countdown-display');
  const label   = document.getElementById('countdown-label');
  const badge   = document.getElementById('tier-badge');
  const sub     = document.getElementById('countdown-sub');

  function tick() {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

    const todayGaps = state.gapBlocks[TODAY_DOW] || [];
    const todayClasses = state.classes
      .filter(c => c.dayOfWeek === TODAY_DOW)
      .sort((a, b) => timeToMin(a.startTime) - timeToMin(b.startTime));

    // 현재 진행 중인 공강 찾기
    const activeGap = todayGaps.find(g =>
      timeToMin(g.startTime) <= nowMin && nowMin < timeToMin(g.endTime)
    );

    // 다음 수업 찾기
    const nextClass = todayClasses.find(c => timeToMin(c.startTime) > nowMin);

    if (activeGap && nextClass) {
      const remainSec = Math.max(0, Math.round((timeToMin(nextClass.startTime) - nowMin) * 60));
      display.textContent = formatCountdown(remainSec);
      label.textContent = `⏳ ${nextClass.title} 시작까지 남은 공강 시간`;
      badge.textContent = TIER_KO[activeGap.tier];
      sub.textContent = `${activeGap.startTime} ~ ${activeGap.endTime} · ${formatDuration(activeGap.durationMinutes)} 공강`;

      if (remainSec === 0) {
        showToast(`⏰ ${nextClass.title} 수업이 시작되었어요!`);
      }
    } else if (todayClasses.length > 0) {
      const nextC2 = todayClasses.find(c => timeToMin(c.startTime) > nowMin);
      if (nextC2) {
        const waitSec = Math.max(0, Math.round((timeToMin(nextC2.startTime) - nowMin) * 60));
        display.textContent = formatCountdown(waitSec);
        label.textContent = `📚 다음 수업(${nextC2.title})까지`;
        badge.textContent = '대기 중';
        sub.textContent = `${nextC2.startTime} 시작 · ${nextC2.location || '강의실 미입력'}`;
      } else {
        display.textContent = '– : –';
        label.textContent = '🎉 오늘 남은 수업 없음!';
        badge.textContent = '완료';
        sub.textContent = '수고했어요! 충분한 휴식을 취하세요 😊';
      }
    } else {
      display.textContent = '– : –';
      label.textContent = '⏳ 공강 카운트다운';
      badge.textContent = '–';
      sub.textContent = '시간표를 입력하면 자동으로 계산돼요 📌';
    }
  }

  tick();
  state.countdownInterval = setInterval(tick, 1000);
}

/* ── 5-4. 추천 카드 렌더링 ── */
function renderRecommendations() {
  const carousel = document.getElementById('rec-carousel');
  const dots     = document.getElementById('carousel-dots');
  const tierLabel = document.getElementById('rec-tier-label');

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const todayGaps = state.gapBlocks[TODAY_DOW] || [];

  const activeGap = todayGaps.find(g =>
    timeToMin(g.startTime) <= nowMin && nowMin < timeToMin(g.endTime)
  );

  const tier = activeGap ? activeGap.tier
    : (todayGaps.length > 0 ? todayGaps[0].tier : null);

  if (!tier) {
    carousel.innerHTML = '<p class="empty-msg">공강 블록이 계산되면 맞춤 추천이 나타납니다.</p>';
    dots.innerHTML = '';
    tierLabel.textContent = '';
    return;
  }

  tierLabel.textContent = `${TIER_KO[tier]} 공강 맞춤 추천`;
  const activities = ACTIVITY_DB[tier];

  carousel.innerHTML = activities.map(a => `
    <li class="rec-card" role="listitem" tabindex="0"
        aria-label="${a.title}: ${a.desc}">
      <div class="rec-card-icon">${a.icon}</div>
      <div class="rec-card-title">${a.title}</div>
      <div class="rec-card-desc">${a.desc}</div>
      <span class="rec-card-tag">${a.tag}</span>
    </li>
  `).join('');

  // 캐러셀 닷
  dots.innerHTML = activities.map((_, i) =>
    `<div class="carousel-dot${i === 0 ? ' active' : ''}" aria-hidden="true"></div>`
  ).join('');

  // 스크롤 → 닷 업데이트
  carousel.addEventListener('scroll', () => {
    const cardWidth = carousel.querySelector('.rec-card')?.offsetWidth + 16 || 1;
    const idx = Math.round(carousel.scrollLeft / cardWidth);
    dots.querySelectorAll('.carousel-dot').forEach((d, i) => {
      d.classList.toggle('active', i === idx);
    });
  }, { passive: true });
}

/* ── 5-5. 수업 테이블 렌더링 ── */
function renderClassTable() {
  const tbody = document.getElementById('class-tbody');
  const gapArea = document.getElementById('gap-result-area');

  if (state.classes.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="5">등록된 수업이 없습니다. 위 폼으로 추가해보세요! 🙂</td>
      </tr>`;
    gapArea.hidden = true;
    return;
  }

  // 요일 → 시작시간 정렬
  const sorted = [...state.classes].sort((a, b) =>
    a.dayOfWeek !== b.dayOfWeek
      ? a.dayOfWeek - b.dayOfWeek
      : timeToMin(a.startTime) - timeToMin(b.startTime)
  );

  tbody.innerHTML = sorted.map(c => `
    <tr>
      <td><span class="day-badge">${DAY_NAMES[c.dayOfWeek]}요일</span></td>
      <td>${escapeHtml(c.title)}</td>
      <td>${c.startTime} ~ ${c.endTime}</td>
      <td>${escapeHtml(c.location || '–')}</td>
      <td>
        <button class="delete-btn" data-id="${c.id}"
                aria-label="${escapeHtml(c.title)} 삭제">🗑️</button>
      </td>
    </tr>
  `).join('');

  // 삭제 버튼 이벤트
  tbody.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      state.classes = state.classes.filter(c => c.id !== id);
      recomputeAllGaps();
      renderAll();
      saveToStorage();
      showToast('✅ 수업이 삭제되었습니다.');
    });
  });

  // 공강 결과 렌더링
  renderGapBlocks();
}

/* ── 5-6. 공강 블록 결과 ── */
function renderGapBlocks() {
  const area = document.getElementById('gap-result-area');
  const list = document.getElementById('gap-blocks-list');

  const allGaps = [];
  for (let d = 1; d <= 5; d++) {
    (state.gapBlocks[d] || []).forEach(g => allGaps.push(g));
  }

  if (allGaps.length === 0) {
    area.hidden = true;
    return;
  }

  area.hidden = false;
  list.innerHTML = allGaps.map(g => `
    <div class="gap-block-item gap-${g.tier}">
      <span class="gap-block-tier">${TIER_KO[g.tier]}</span>
      <div class="gap-block-info">
        <div class="gap-block-time">${DAY_NAMES[g.dayOfWeek]}요일 ${g.startTime} ~ ${g.endTime}</div>
        <div class="gap-block-dur">${formatDuration(g.durationMinutes)}</div>
      </div>
    </div>
  `).join('');
}

/* ── 5-7. 주간 그리드 렌더링 ── */
function renderWeeklyGrid() {
  const grid = document.getElementById('weekly-grid');

  // 전체 블록 수집
  const allClasses = state.classes;
  const allGaps = [];
  for (let d = 1; d <= 5; d++) {
    (state.gapBlocks[d] || []).forEach(g => allGaps.push(g));
  }

  if (allClasses.length === 0 && allGaps.length === 0) {
    grid.innerHTML = '<p class="empty-msg" style="grid-column:1/-1">시간표를 입력하면 주간 맵이 표시됩니다.</p>';
    return;
  }

  // 시간 범위 계산
  const allTimes = [
    ...allClasses.map(c => timeToMin(c.startTime)),
    ...allClasses.map(c => timeToMin(c.endTime)),
    ...allGaps.map(g => timeToMin(g.startTime)),
    ...allGaps.map(g => timeToMin(g.endTime)),
  ];
  const minTime = Math.min(...allTimes, 9 * 60); // 최소 09:00
  const maxTime = Math.max(...allTimes, 18 * 60); // 최대 18:00
  const totalMin = maxTime - minTime;

  // 헤더 행
  let html = '<div class="wg-header"></div>';
  for (let d = 1; d <= 5; d++) {
    const isToday = d === TODAY_DOW;
    html += `<div class="wg-header" style="${isToday ? 'color:var(--clr-primary-600);background:var(--clr-primary-50)' : ''}">${DAY_NAMES[d]}요일</div>`;
  }

  // 시간축 컬럼 + 5개 요일 컬럼
  html += '<div class="wg-time-col">';
  for (let m = minTime; m <= maxTime; m += 60) {
    html += `<div class="wg-time-label">${minToTime(m)}</div>`;
  }
  html += '</div>';

  for (let d = 1; d <= 5; d++) {
    const dayC = allClasses.filter(c => c.dayOfWeek === d);
    const dayG = allGaps.filter(g => g.dayOfWeek === d);
    const isToday = d === TODAY_DOW;

    html += `<div class="wg-day-col" style="${isToday ? 'background:var(--clr-primary-50)' : ''}">`;

    dayC.forEach(c => {
      const top = ((timeToMin(c.startTime) - minTime) / totalMin) * 100;
      const height = ((timeToMin(c.endTime) - timeToMin(c.startTime)) / totalMin) * 100;
      html += `
        <div class="wg-block class-block"
             style="top:${top}%;height:${Math.max(height, 2)}%"
             title="${escapeHtml(c.title)} ${c.startTime}~${c.endTime}">
          ${escapeHtml(c.title)}
        </div>`;
    });

    dayG.forEach(g => {
      const top = ((timeToMin(g.startTime) - minTime) / totalMin) * 100;
      const height = ((g.durationMinutes) / totalMin) * 100;
      html += `
        <div class="wg-block gap-${g.tier}"
             style="top:${top}%;height:${Math.max(height, 2)}%"
             title="공강 ${formatDuration(g.durationMinutes)} (${g.startTime}~${g.endTime})">
          ${formatDuration(g.durationMinutes)}
        </div>`;
    });

    html += '</div>';
  }

  grid.innerHTML = html;
}

/* ── 5-8. 친구 탭 렌더링 ── */
function renderFriends() {
  const area = document.getElementById('friend-list-area');

  if (state.friends.length === 0) {
    area.innerHTML = '<p class="empty-msg">아직 추가된 친구가 없어요. 친구 코드로 추가해보세요! 🤝</p>';
    renderOverlap();
    return;
  }

  area.innerHTML = state.friends.map((f, i) => `
    <div class="friend-card" role="listitem">
      <div class="friend-avatar" aria-hidden="true">
        ${f.name.slice(0, 1)}
      </div>
      <div class="friend-info">
        <div class="friend-name">${escapeHtml(f.name)}</div>
        <div class="friend-code-display">코드: ${f.code}</div>
      </div>
      <button class="friend-remove-btn" data-idx="${i}"
              aria-label="${escapeHtml(f.name)} 삭제">✕</button>
    </div>
  `).join('');

  area.querySelectorAll('.friend-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx, 10);
      const name = state.friends[idx].name;
      state.friends.splice(idx, 1);
      saveToStorage();
      renderFriends();
      showToast(`🗑️ ${name}님이 삭제되었습니다.`);
    });
  });

  renderOverlap();
}

/* ── 5-9. 공강 겹침 계산 ── */
function renderOverlap() {
  const resultArea = document.getElementById('overlap-result');
  const list       = document.getElementById('overlap-list');

  if (state.friends.length === 0 || state.classes.length === 0) {
    resultArea.hidden = true;
    return;
  }

  const myGaps = state.gapBlocks[TODAY_DOW] || [];
  const overlaps = [];

  state.friends.forEach(friend => {
    const friendClasses = friend.classes || [];
    const friendGapArr  = computeGapsForDayFromClasses(TODAY_DOW, friendClasses);

    myGaps.forEach(myGap => {
      friendGapArr.forEach(fGap => {
        const s = Math.max(timeToMin(myGap.startTime), timeToMin(fGap.startTime));
        const e = Math.min(timeToMin(myGap.endTime),   timeToMin(fGap.endTime));
        const dur = e - s;
        if (dur >= 30) {
          overlaps.push({
            friend: friend.name,
            startTime: minToTime(s),
            endTime:   minToTime(e),
            durationMinutes: dur,
          });
        }
      });
    });
  });

  if (overlaps.length === 0) {
    resultArea.hidden = false;
    list.innerHTML = '<p class="empty-msg" style="padding:var(--space-md) 0">오늘 30분 이상 겹치는 공강이 없어요 😢</p>';
    return;
  }

  resultArea.hidden = false;
  list.innerHTML = overlaps.map(o => {
    const msg = encodeURIComponent(
      `안녕! 우리 오늘 ${o.startTime}~${o.endTime}에 같이 공강이야!\n같이 밥 먹을래? 🍚 (SpaceOut 앱)`
    );
    return `
      <div class="overlap-item">
        <div class="overlap-time">⏰ ${o.startTime} ~ ${o.endTime} (${formatDuration(o.durationMinutes)})</div>
        <div class="overlap-friends">👤 ${escapeHtml(o.friend)}님과 겹치는 공강!</div>
        <button class="btn btn-sm btn-primary share-msg-btn"
                onclick="shareKakao('${o.startTime}', '${o.endTime}', '${escapeHtml(o.friend)}')">
          💬 카카오 메시지 생성
        </button>
      </div>
    `;
  }).join('');
}

/** 특정 수업 배열에서 공강 계산 (친구용) */
function computeGapsForDayFromClasses(day, classes) {
  const dayClasses = classes
    .filter(c => c.dayOfWeek === day)
    .sort((a, b) => timeToMin(a.startTime) - timeToMin(b.startTime));
  const gaps = [];
  for (let i = 0; i < dayClasses.length - 1; i++) {
    const endMin    = timeToMin(dayClasses[i].endTime);
    const nextStart = timeToMin(dayClasses[i + 1].startTime);
    const dur = nextStart - endMin;
    if (dur >= 15) {
      gaps.push({ startTime: minToTime(endMin), endTime: minToTime(nextStart), durationMinutes: dur });
    }
  }
  return gaps;
}

/* ── 5-10. 공유 코드 ── */
function renderShareCode() {
  const el = document.getElementById('my-share-code');
  el.textContent = state.myShareCode || '–';
}

/* ── 5-11. 전체 렌더링 ── */
function renderAll() {
  renderTodayDate();
  renderTimeline();
  renderRecommendations();
  renderClassTable();
  renderWeeklyGrid();
  renderFriends();
  renderShareCode();
  startCountdown();
}

/* ═══════════════════════════════════════════
   6. 이벤트 핸들러
═══════════════════════════════════════════ */

/* ── 6-1. 탭 전환 ── */
function initTabs() {
  const navBtns = document.querySelectorAll('.nav-btn');
  const panels  = document.querySelectorAll('.tab-panel');
  const nav     = document.querySelector('.main-nav');
  const hamburger = document.getElementById('hamburger');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;

      navBtns.forEach(b => {
        b.classList.remove('active');
        b.removeAttribute('aria-current');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-current', 'page');

      panels.forEach(p => {
        const isActive = p.id === `tab-${tab}`;
        p.classList.toggle('active', isActive);
        p.hidden = !isActive;
      });

      state.activeTab = tab;

      // 모바일 메뉴 닫기
      nav.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });

  // 햄버거 토글
  hamburger.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });
}

/* ── 6-2. 시간표 폼 ── */
function initTimetableForm() {
  const form = document.getElementById('timetable-form');

  form.addEventListener('submit', e => {
    e.preventDefault();

    const title    = form.elements.title.value.trim();
    const day      = parseInt(form.elements.day.value, 10);
    const start    = form.elements.startTime.value;
    const end      = form.elements.endTime.value;
    const location = form.elements.location.value.trim();

    // 유효성 검사
    let valid = true;
    if (!title) {
      markInvalid(form.elements.title, '과목명을 입력해주세요.');
      valid = false;
    } else { clearInvalid(form.elements.title); }

    if (!day) {
      markInvalid(form.elements.day, '요일을 선택해주세요.');
      valid = false;
    } else { clearInvalid(form.elements.day); }

    if (!start) {
      markInvalid(form.elements.startTime, '시작 시간을 입력해주세요.');
      valid = false;
    } else { clearInvalid(form.elements.startTime); }

    if (!end) {
      markInvalid(form.elements.endTime, '종료 시간을 입력해주세요.');
      valid = false;
    } else if (timeToMin(end) <= timeToMin(start)) {
      markInvalid(form.elements.endTime, '종료 시간은 시작 시간 이후여야 합니다.');
      valid = false;
    } else { clearInvalid(form.elements.endTime); }

    if (!valid) return;

    // 중복 체크
    const overlap = state.classes.find(c =>
      c.dayOfWeek === day &&
      timeToMin(c.startTime) < timeToMin(end) &&
      timeToMin(c.endTime) > timeToMin(start)
    );
    if (overlap) {
      showToast(`⚠️ "${overlap.title}"과 시간이 겹칩니다!`, 3000);
      return;
    }

    const newClass = {
      id: `cls-${Date.now()}`,
      dayOfWeek: day,
      startTime: start,
      endTime: end,
      title,
      location,
    };

    state.classes.push(newClass);
    recomputeAllGaps();
    renderAll();
    saveToStorage();
    form.reset();
    showToast(`✅ "${title}" 수업이 추가되었습니다!`);
  });

  // 전체 삭제
  document.getElementById('clear-all-btn').addEventListener('click', () => {
    if (state.classes.length === 0) { showToast('삭제할 수업이 없습니다.'); return; }
    if (!confirm('등록된 수업을 모두 삭제할까요?')) return;
    state.classes = [];
    recomputeAllGaps();
    renderAll();
    saveToStorage();
    showToast('🗑️ 전체 수업이 삭제되었습니다.');
  });

  // 샘플 시간표
  document.getElementById('load-sample-btn').addEventListener('click', loadSampleTimetable);
}

function markInvalid(el, msg) {
  el.classList.add('invalid');
  el.setAttribute('aria-describedby', el.id + '-err');
  let errEl = document.getElementById(el.id + '-err');
  if (!errEl) {
    errEl = document.createElement('span');
    errEl.id = el.id + '-err';
    errEl.style.cssText = 'color:#dc2626;font-size:0.75rem;margin-top:2px;display:block';
    errEl.setAttribute('role', 'alert');
    el.parentNode.appendChild(errEl);
  }
  errEl.textContent = msg;
}
function clearInvalid(el) {
  el.classList.remove('invalid');
  const errEl = document.getElementById(el.id + '-err');
  if (errEl) errEl.textContent = '';
}

/* ── 6-3. 샘플 시간표 (김새내 페르소나) ── */
function loadSampleTimetable() {
  if (state.classes.length > 0 && !confirm('기존 시간표를 지우고 샘플 시간표를 불러올까요?')) return;

  state.classes = [
    { id: 'cls-s1', dayOfWeek: 2, startTime: '09:00', endTime: '10:15', title: '컴퓨터학개론', location: '정보과학관 201호' },
    { id: 'cls-s2', dayOfWeek: 2, startTime: '14:00', endTime: '15:15', title: '미적분학', location: '자연과학관 101호' },
    { id: 'cls-s3', dayOfWeek: 2, startTime: '16:00', endTime: '17:15', title: '공학영어', location: '인문관 302호' },
    { id: 'cls-s4', dayOfWeek: 4, startTime: '10:00', endTime: '11:15', title: '선형대수학', location: '수리관 201호' },
    { id: 'cls-s5', dayOfWeek: 4, startTime: '13:00', endTime: '14:15', title: '프로그래밍기초', location: '정보과학관 301호' },
    { id: 'cls-s6', dayOfWeek: 4, startTime: '15:00', endTime: '16:15', title: '회로이론', location: '전자관 101호' },
    { id: 'cls-s7', dayOfWeek: 1, startTime: '11:00', endTime: '12:15', title: '글쓰기', location: '인문관 205호' },
    { id: 'cls-s8', dayOfWeek: 3, startTime: '13:00', endTime: '14:15', title: '물리학I', location: '자연과학관 202호' },
    { id: 'cls-s9', dayOfWeek: 5, startTime: '10:00', endTime: '12:15', title: '설계입문', location: '공학관 B101호' },
  ];

  recomputeAllGaps();
  renderAll();
  saveToStorage();
  showToast('📂 샘플 시간표(김새내)가 불러와졌습니다!', 3000);
}

/* ── 6-4. 친구 추가 폼 ── */
function initFriendForm() {
  const form = document.getElementById('friend-form');

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = form.elements.friendName.value.trim();
    const code = form.elements.friendCode.value.trim().toUpperCase();

    if (!name || !code) {
      showToast('⚠️ 이름과 코드를 모두 입력해주세요.', 2500);
      return;
    }
    if (state.friends.find(f => f.code === code)) {
      showToast('이미 추가된 친구 코드입니다.', 2500);
      return;
    }
    if (code === state.myShareCode) {
      showToast('본인 코드는 추가할 수 없어요 😅', 2500);
      return;
    }

    // 데모: 친구 시간표는 샘플 데이터로 시뮬레이션
    const friendClasses = generateFriendSampleClasses(code);

    state.friends.push({ name, code, classes: friendClasses });
    saveToStorage();
    renderFriends();
    form.reset();
    showToast(`🎉 ${name}님이 추가되었습니다!`);
  });

  // 코드 생성
  document.getElementById('gen-code-btn').addEventListener('click', () => {
    state.myShareCode = generateCode();
    saveToStorage();
    renderShareCode();
    showToast('🔑 새 공유 코드가 생성되었습니다!');
  });

  // 코드 복사
  document.getElementById('copy-code-btn').addEventListener('click', () => {
    const code = state.myShareCode;
    if (!code) { showToast('먼저 코드를 생성해주세요.'); return; }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code)
        .then(() => showToast('📋 코드가 복사되었습니다!'))
        .catch(() => fallbackCopy(code));
    } else {
      fallbackCopy(code);
    }
  });
}

/** 친구 데모 시간표 생성 (코드 기반 시드) */
function generateFriendSampleClasses(code) {
  const seed = code.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const offset = seed % 3;
  return [
    { dayOfWeek: TODAY_DOW, startTime: `09:${String(offset * 10).padStart(2,'0')}`, endTime: `10:${String(15 + offset * 5).padStart(2,'0')}`, title: '친구수업A' },
    { dayOfWeek: TODAY_DOW, startTime: `${12 + offset}:00`, endTime: `${13 + offset}:15`, title: '친구수업B' },
    { dayOfWeek: TODAY_DOW, startTime: '15:00', endTime: '16:30', title: '친구수업C' },
  ];
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); showToast('📋 코드가 복사되었습니다!'); }
  catch { showToast('복사에 실패했습니다. 직접 선택해 복사해주세요.'); }
  document.body.removeChild(ta);
}

/* ── 6-5. 카카오 공유 메시지 ── */
function shareKakao(start, end, friendName) {
  const msg = `안녕 ${friendName}! 우리 오늘 ${start}~${end}에 같이 공강이야!\n같이 밥 먹으러 갈래? 🍚\n(SpaceOut 앱으로 확인했어요)`;
  // 클립보드 복사 후 안내
  if (navigator.clipboard) {
    navigator.clipboard.writeText(msg)
      .then(() => showToast('💬 메시지가 복사됐어요! 카카오에 붙여넣기 하세요 😊', 4000))
      .catch(() => { alert(msg); });
  } else {
    alert(msg);
  }
}
// 전역 함수로 노출 (인라인 onclick에서 사용)
window.shareKakao = shareKakao;

/* ═══════════════════════════════════════════
   7. HTML 이스케이프 유틸
═══════════════════════════════════════════ */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ═══════════════════════════════════════════
   8. 앱 초기화
═══════════════════════════════════════════ */
function init() {
  loadFromStorage();
  recomputeAllGaps();

  initTabs();
  initTimetableForm();
  initFriendForm();

  renderAll();

  // 추천 카드 1분마다 갱신 (공강 상황 변화 반영)
  setInterval(renderRecommendations, 60 * 1000);

  console.log('%c🎓 SpaceOut 시작!', 'color:#2563eb;font-size:1.2rem;font-weight:bold');
  console.log('%c공강 시간을 더 알차게 활용해봐요 ✨', 'color:#6b7280');
}

// DOM 준비 후 실행
document.addEventListener('DOMContentLoaded', init);
