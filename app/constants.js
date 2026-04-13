// ── Emoji Icon Map (pixel-art style) ─────────────────────────────────────────
export const EMOJI_MAP = {
  // Spaces & Furniture
  'home':'🏠','bed':'🛏','chair':'🪑','weekend':'🛋','bathtub':'🛁',
  'kitchen':'🍳','checkroom':'👗','local-laundry-service':'🧺',
  'restaurant':'🍽','shower':'🚿','bathroom':'🚿',
  // Storage & Category
  'inbox':'📥','inventory-2':'📦','folder':'📁','category':'🗂',
  'label':'🏷','shopping-bag':'🛍','backpack':'🎒',
  // Tools & Build
  'build':'🔧','hardware':'🔨','cleaning-services':'🧹',
  // Media & Tech
  'auto-stories':'📖','tv':'📺','speaker':'🔊','router':'📡',
  'cable':'🔌','smartphone':'📱','sports-esports':'🎮','album':'💿',
  'settings-remote':'📻','camera':'📷',
  // Time & Basics
  'alarm':'⏰','lightbulb':'💡','watch':'⌚','payments':'💴',
  // Nature & Food
  'eco':'🌱','local-florist':'🌸','spa':'🌿',
  'fastfood':'🍔','local-drink':'🥤','local-cafe':'☕',
  'dinner-dining':'🍽','local-dining':'🍴','cookie':'🍪',
  'rice-bowl':'🍚','ramen-dining':'🍜','water':'💧',
  'ac-unit':'❄️','thermostat':'🌡','air':'💨',
  // Health & Beauty
  'medication':'💊','soap':'🧴','clean-hands':'🧽','opacity':'🧴',
  // Misc
  'favorite':'❤️','star':'⭐','diamond':'💎','layers':'📚',
  'hotel':'🛏','menu-book':'📋','edit-note':'✏️',
  'photo-album':'📷','hiking':'👟','business-center':'💼',
  'table-bar':'🪑','view-agenda':'📋','vertical-align-top':'⬆',
  'vertical-align-bottom':'⬇','vertical-align-center':'↕',
  'arrow-forward':'➡','arrow-back':'⬅','looks-one':'①',
  'looks-two':'②','looks-3':'③','device-thermostat':'🌡',
  'door-front':'🚪',
  // UI / Nav
  'notifications':'🔔','settings':'⚙️','search':'🔍',
};

// ── UI Icon Map (navigation / system) ────────────────────────────────────────
export const UI_EMOJI = {
  'search':'🔍','grid-view':'⊞','arrow-back':'←','add':'＋',
  'chevron-right':'›','notifications':'🔔','settings':'⚙️',
  'edit':'✏️','delete-outline':'🗑','search-off':'🔍',
  'remove-circle-outline':'−','add-circle-outline':'＋',
  'visibility': '👀',
};


export const C = {
  primary:          '#216969',
  primaryContainer: '#abefee',
  surfaceLowest:    '#ffffff',
  surfaceHigh:      '#e5e9eb',
  onSurface:        '#2d3335',
  onSurfaceVariant: '#5a6062',
  background:       '#f8f9fa',
  error:            '#a83836',
  onError:          '#fff7f6',
  outline:          '#767c7e',
  outlineVariant:   '#adb3b5',
  navBg:            '#ffffff',
};

export const LEVEL_NAMES = ['공간', '가구', '구획', '물건'];

// 레벨별 색상 팔레트 (0=공간, 1=가구, 2=구획, 3=물건)
export const LEVEL_COLORS = [
  { bg: '#f0fefd', iconBg: '#abefee', accent: '#216969', pill: '#abefee', screenBg: '#f4fffe' }, // 공간 - 민트
  { bg: '#f5f0ff', iconBg: '#e0ccf8', accent: '#6d28d9', pill: '#e0ccf8', screenBg: '#f8f4ff' }, // 가구 - 보라
  { bg: '#eef6ff', iconBg: '#cce4f8', accent: '#0369a1', pill: '#cce4f8', screenBg: '#f0f8ff' }, // 구획 - 파랑
  { bg: '#fff8ee', iconBg: '#fde5c0', accent: '#c97000', pill: '#fde5c0', screenBg: '#fffaf3' }, // 물건 - 주황/살구
];

export const ICON_OPTIONS = [
  'home','bed','chair','weekend','bathtub','kitchen',
  'checkroom','local-laundry-service','restaurant','shower','inbox','inventory-2',
  'folder','category','label','shopping-bag','backpack','build',
  'auto-stories','tv','speaker','router','cable','smartphone',
  'alarm','lightbulb','favorite','star','medication','spa',
  'eco','local-florist','diamond','watch','camera','payments',
  'layers','hotel','menu-book','edit-note','photo-album','cookie',
  'fastfood','local-drink','local-cafe','dinner-dining','soap','hardware',
];

// ── Categorized Emoji Icons ───────────────────────────────────────────────────
export const ICON_CATEGORIES = [
  {
    name: '🛋 가구 & 공간',
    icons: [
      'desk','table',
      '🛋','🪑','🛏','🚪','🪟','🪞','🗄','🗃️','📚','📦','🗳️','📥','📤','🖥️','💻',
      '🚿','🛁','🚽','🧺','🧹','🪣','🧻','🛒','🧯','🪤','🪜','🛗','🧸',
    ],
  },
  {
    name: '👗 의류 & 패션',
    icons: [
      '👔','👗','👚','👕','👖','🧥','🥻','👘','🩲','🩳',
      '🧤','🧣','🧦','👒','🧢','🎩','👝','👜','👛','💍','⌚',
      '💄','🌂','👟','👠','👞','🥾','🥿','🎀',
    ],
  },
  {
    name: '📚 도서 & 문구',
    icons: [
      // 책 4가지 색상
      '📗','📘','📕','📙',
      // 노트 4가지
      '📓','📔','📒','📃',
      // 펜 3가지
      '✏️','🖊️','🖋️',
      // 기타 문구
      '📌','📍','📎','🖇','📐','📏','🗂','📋','📄','🗒',
      '🔖','📰','🗞','🗃','📊','📈','📉',
    ],
  },
  {
    name: '🍳 주방 & 식품',
    icons: [
      '🍳','🥘','🫕','🥣','🍽','🥄','🍴','🔪','🫙','🫖',
      '☕','🧋','🥤','🍵','🧃','🍶','🧊','🧂','🥫','🫗',
      '🍕','🍱','🧁','🍰','🍪','🥐','🥗','🍜','🍣','🫔',
    ],
  },
  {
    name: '📱 전자 & 기기',
    icons: [
      '📺','📻','🖥','💻','📱','⌚','⌨️','🖱','🖨',
      '📷','📸','🎮','🎧','🔊','📡','🔌','🔋','💡','🔦','🕹',
    ],
  },
  {
    name: '⚽ 취미 & 스포츠',
    icons: [
      '⚽','🏀','🏈','🎾','🏓','🏸','🎯','🎱',
      '🎨','🖼','🎸','🎹','🎻','🥁','🎺','🎷',
      '🏋','🧘','🏊','⛷','🚴','🧗','🎣','🏹','🎿',
    ],
  },
  {
    name: '💊 건강 & 뷰티',
    icons: [
      '💊','🩺','🧴','🪥','🧼','🩹','🌡','🧪',
      '💅','🪮','🫧','🧖','🪷','🩻','🩼','💉','🧬',
    ],
  },
  {
    name: '🌿 자연 & 식물',
    icons: [
      '🌿','🌱','🪴','🌸','🌺','🌻','🌼','🌹','🪻','🌵',
      '🎋','🎍','🍀','🍁','🌲','🌳','🍄','🌾','🪨','🐾',
    ],
  },
  {
    name: '🔧 도구 & 기타',
    icons: [
      '🔧','🔨','🪛','🧰','⚙️','🔭','🔬','🧲','🪝','🪚',
      '📦','📁','🔑','🔒','🕯','🪔','💰','🎁',
      '✈️','🚗','🏠','🏡','🏪','🏬','⛽','🧳',
    ],
  },
  {
    name: '🔢 숫자 & 방향',
    icons: [
      '0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟',
      '⬆️','⬇️','⬅️','➡️','↗️','↖️','↘️','↙️','↔️','↕️','🔄','🔙','🔝','🔜',
      '➕','➖','✖️','➗','✔️','❌','❓','❗️','⭕️','🛑','⚠️'
    ],
  },
  {
    name: '◼ 도형',
    icons: [
      // 채운 사각형
      '⬛','⬜','🟥','🟧','🟨','🟩','🟦','🟪','🟫',
      // 작은 사각형
      '◾','◽','▪','▫',
      // 채운 세모
      '▲','▶','▼','◀','◢','◣','◥','◤',
      // 빈 세모
      '△','▷','▽','◁',
      // 채운 원
      '⚫','⚪','🔴','🟠','🟡','🟢','🔵','🟣',
      // 작은 원
      '•','◦','●','○','◉','◎',
      // 마름모 & 기타
      '◆','◇','◈','▣','▤','▥','▦','▧','▨','▩',
      '★','☆','♠','♥','♦','♣','♤','♡','♢','♧',
    ],
  },
];

// ── 아이콘 한글 이름 매핑 (검색용) ──────────────────────────────────────────
export const ICON_NAMES = {
  // EMOJI_MAP keys
  'desk':'책상', 'table':'테이블',
  'home':'집', 'bed':'침대', 'chair':'의자', 'weekend':'소파', 'bathtub':'욕조',
  'kitchen':'주방', 'checkroom':'옷방', 'local-laundry-service':'세탁',
  'restaurant':'식당', 'shower':'샤워', 'bathroom':'화장실',
  'inbox':'받은함', 'inventory-2':'재고', 'folder':'폴더', 'category':'카테고리',
  'label':'라벨', 'shopping-bag':'쇼핑백', 'backpack':'백팩',
  'build':'렌치', 'hardware':'망치', 'cleaning-services':'청소',
  'auto-stories':'책', 'tv':'텔레비전', 'speaker':'스피커', 'router':'공유기',
  'cable':'케이블', 'smartphone':'스마트폰', 'sports-esports':'게임', 'album':'앨범',
  'settings-remote':'리모컨', 'camera':'카메라',
  'alarm':'알람', 'lightbulb':'전구', 'watch':'시계', 'payments':'돈',
  'eco':'새싹', 'local-florist':'꽃', 'spa':'스파',
  'fastfood':'패스트푸드', 'local-drink':'음료', 'local-cafe':'카페',
  'cookie':'쿠키', 'rice-bowl':'밥', 'ramen-dining':'라면', 'water':'물',
  'medication':'약', 'soap':'비누', 'favorite':'하트', 'star':'별', 'diamond':'다이아',
  'door-front':'문',
  // 이모지 직접
  '🛋':'소파', '🪑':'의자', '🛏':'침대', '🚪':'문', '🪟':'창문', '🪞':'거울',
  '🗄':'서랍장', '🗃️':'파일함', '📚':'책', '📦':'상자', '🗳️':'투표함',
  '📥':'받은함', '📤':'보낸함', '🖥️':'컴퓨터', '💻':'노트북',
  '🚿':'샤워기', '🛁':'욕조', '🚽':'변기', '🧺':'바구니', '🧹':'빗자루',
  '🪣':'양동이', '🧻':'휴지', '🛒':'카트', '🧯':'소화기', '🪤':'쥐덫',
  '🪜':'사다리', '🛗':'엘리베이터', '🧸':'인형',
  '👔':'넥타이', '👗':'드레스', '👚':'블라우스', '👕':'티셔츠', '👖':'바지',
  '🧥':'코트', '🥻':'사리', '👘':'기모노', '🩲':'속옷', '🩳':'반바지',
  '🧤':'장갑', '🧣':'목도리', '🧦':'양말', '👒':'모자', '🧢':'캡', '🎩':'탑햇',
  '👝':'파우치', '👜':'핸드백', '👛':'지갑', '💍':'반지', '⌚':'시계',
  '💄':'립스틱', '🌂':'우산', '👟':'운동화', '👠':'하이힐', '👞':'구두',
  '🥾':'부츠', '🥿':'플랫슈즈', '🎀':'리본',
  '📗':'녹색책', '📘':'파란책', '📕':'빨간책', '📙':'주황책',
  '📓':'노트', '📔':'다이어리', '📒':'장부', '📃':'문서',
  '✏️':'연필', '🖊️':'펜', '🖋️':'만년필',
  '📌':'핀', '📍':'압정', '📎':'클립', '🖇':'클립', '📐':'삼각자', '📏':'자',
  '🗂':'파일', '📋':'클립보드', '📄':'종이', '🗒':'메모장',
  '🔖':'북마크', '📰':'신문', '🗞':'신문지', '🗃':'서류함',
  '📊':'차트', '📈':'상승', '📉':'하락',
  '🍳':'프라이팬', '🥘':'냄비', '🫕':'퐁듀', '🥣':'시리얼', '🍽':'접시',
  '🥄':'숟가락', '🍴':'포크', '🔪':'칼', '🫙':'유리병', '🫖':'주전자',
  '☕':'커피', '🧋':'버블티', '🥤':'음료', '🍵':'차', '🧃':'주스',
  '🍶':'사케', '🧊':'얼음', '🧂':'소금', '🥫':'캔', '🫗':'붓기',
  '🍕':'피자', '🍱':'도시락', '🧁':'컵케이크', '🍰':'케이크', '🍪':'쿠키',
  '🥐':'크루아상', '🥗':'샐러드', '🍜':'면', '🍣':'초밥', '🫔':'타말레',
  '📺':'TV', '📻':'라디오', '🖥':'모니터', '📱':'핸드폰',
  '⌨️':'키보드', '🖱':'마우스', '🖨':'프린터',
  '📷':'카메라', '📸':'사진', '🎮':'게임패드', '🎧':'헤드폰',
  '🔊':'스피커', '📡':'안테나', '🔌':'플러그', '🔋':'배터리', '💡':'전구', '🔦':'손전등', '🕹':'조이스틱',
  '⚽':'축구공', '🏀':'농구공', '🏈':'미식축구', '🎾':'테니스', '🏓':'탁구',
  '🏸':'배드민턴', '🎯':'다트', '🎱':'당구',
  '🎨':'팔레트', '🖼':'그림', '🎸':'기타', '🎹':'피아노', '🎻':'바이올린',
  '🥁':'드럼', '🎺':'트럼펫', '🎷':'색소폰',
  '🏋':'역도', '🧘':'요가', '🏊':'수영', '⛷':'스키', '🚴':'자전거',
  '🧗':'클라이밍', '🎣':'낚시', '🏹':'활', '🎿':'스키',
  '💊':'약', '🩺':'청진기', '🧴':'로션', '🪥':'칫솔', '🧼':'비누',
  '🩹':'반창고', '🌡':'온도계', '🧪':'시험관',
  '💅':'매니큐어', '🪮':'빗', '🫧':'비눗방울', '🧖':'사우나', '🪷':'연꽃',
  '🩻':'엑스레이', '🩼':'목발', '💉':'주사기', '🧬':'DNA',
  '🌿':'허브', '🌱':'새싹', '🪴':'화분', '🌸':'벚꽃', '🌺':'히비스커스',
  '🌻':'해바라기', '🌼':'꽃', '🌹':'장미', '🪻':'라벤더', '🌵':'선인장',
  '🎋':'칠석', '🎍':'소나무', '🍀':'클로버', '🍁':'단풍', '🌲':'나무',
  '🌳':'활엽수', '🍄':'버섯', '🌾':'벼', '🪨':'돌', '🐾':'발자국',
  '🔧':'렌치', '🔨':'망치', '🪛':'드라이버', '🧰':'공구함', '⚙️':'톱니바퀴',
  '🔭':'망원경', '🔬':'현미경', '🧲':'자석', '🪝':'갈고리', '🪚':'톱',
  '📁':'폴더', '🔑':'열쇠', '🔒':'자물쇠', '🕯':'촛불', '🪔':'램프', '💰':'돈',
  '🎁':'선물', '✈️':'비행기', '🚗':'자동차', '🏠':'집', '🏡':'정원집',
  '🏪':'편의점', '🏬':'백화점', '⛽':'주유소', '🧳':'여행가방',
};

export const TABS = [
  { icon: 'home',          label: '홈',    active: true  },
  { icon: 'inventory-2',   label: '보관함', active: false },
  { icon: 'notifications', label: '알림',  active: false },
  { icon: 'settings',      label: '설정',  active: false },
];

export const TASKS = [
  { icon: 'checkroom',   title: '겨울 코트 정리',      sub: '드레스룸 • 2주째 방치됨' },
  { icon: 'kitchen',     title: '냉장고 유통기한 확인', sub: '주방 • 신선식품 정리 필요' },
  { icon: 'inventory-2', title: '베란다 수납 박스',    sub: '다용도실 • 라벨링 미완료' },
];
