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
