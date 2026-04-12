import React, { useRef, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, Modal, TextInput, Image, Alert,
  FlatList, ScrollView, KeyboardAvoidingView, Platform, PanResponder,
  Animated, SectionList, StyleSheet, Share, Dimensions, LayoutAnimation, Linking
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { C, EMOJI_MAP, ICON_CATEGORIES, UI_EMOJI, LEVEL_NAMES } from './constants';
import { findNodePathById } from './data';
import { SpaceTree, MAX_SPACE, OBJECT_TYPES, hierarchyToSpaceTree, spaceTreeToHierarchy, typeToLevel, canBeParentType } from './spaceModel';
import S from './styles';
import { auth as firebaseAuthCore } from './firebase';
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';

// ── 수량 표시 포맷 ────────────────────────────────────────────────────────────
export function formatQty(n) {
  if (n < 100) return `${n}개`;
  if (n < 10000) {
    const baek = Math.floor(n / 100);
    const rem  = n % 100;
    return rem === 0 ? `${baek}백개` : `${baek}백${rem}개`;
  }
  const cheon = Math.floor(n / 1000);
  const rem   = n % 1000;
  if (rem === 0) return `${cheon}천개`;
  const baek = Math.floor(rem / 100);
  const r2   = rem % 100;
  return baek > 0
    ? (r2 > 0 ? `${cheon}천${baek}백${r2}개` : `${cheon}천${baek}백개`)
    : `${cheon}천${r2}개`;
}

// ── 수량 직접 입력 미니 모달 ──────────────────────────────────────────────────
export function QtyInputModal({ visible, currentQty, onConfirm, onCancel }) {
  const [input, setInput] = React.useState('');
  const inputRef = useRef(null);

  React.useEffect(() => {
    if (visible) {
      setInput(String(currentQty));
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [visible]);

  const handleConfirm = () => {
    const num = parseInt(input, 10);
    if (!isNaN(num) && num >= 1) onConfirm(num);
    else onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <KeyboardAvoidingView style={{ flex: 1 }}>
      <TouchableOpacity style={{ flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'center', alignItems:'center' }} activeOpacity={1} onPress={onCancel}>
        <TouchableOpacity activeOpacity={1} onPress={() => {}}
          style={{
            backgroundColor: '#fff', borderRadius: 16, padding: 24,
            width: 240, alignItems: 'center',
            shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.18, shadowRadius: 12, elevation: 10,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: C.onSurface, marginBottom: 16 }}>
            수량 직접 입력
          </Text>
          <TextInput
            ref={inputRef}
            value={input}
            onChangeText={(t) => setInput(t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            returnKeyType="done"
            onSubmitEditing={handleConfirm}
            style={{
              width: '100%', borderWidth: 1.5, borderColor: C.primary,
              borderRadius: 10, padding: 10, fontSize: 22, fontWeight: '700',
              textAlign: 'center', color: C.onSurface, marginBottom: 20,
            }}
          />
          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
            <TouchableOpacity onPress={onCancel}
              style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: C.surfaceHigh, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: C.onSurfaceVariant, fontWeight: '600' }}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm}
              style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: C.primary, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: '#fff', fontWeight: '700' }}>확인</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── 3초 장누름 + 버튼 ─────────────────────────────────────────────────────────
function LongPressPlus({ onPress, onLongPress, style, textStyle }) {
  const timerRef = useRef(null);
  const firedRef = useRef(false);

  const startTimer = () => {
    firedRef.current = false;
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      onLongPress?.();
    }, 2000);
  };

  const clearTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  const handlePressIn  = () => startTimer();
  const handlePressOut = () => { clearTimer(); };
  const handlePress    = () => {
    if (!firedRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onPress?.();
    }
    firedRef.current = false;
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={style}
      activeOpacity={0.6}
    >
      <Text style={[{ fontSize: 20, color: C.primary }, textStyle]}>＋</Text>
    </TouchableOpacity>
  );
}

// ── EmojiIcon ─────────────────────────────────────────────────────────────────
export function EmojiIcon({ name, size = 24 }) {
  if (name === 'desk' || name === 'table') {
    const asset = name === 'desk' 
      ? require('./assets/desk.png') 
      : require('./assets/table.png');
    return (
      <View style={{ 
        width: size * 1.4, height: size * 1.4, 
        alignItems: 'center', justifyContent: 'center', 
        overflow: 'visible'
      }}>
        <Image 
          source={asset} 
          style={{ width: size * 1.25, height: size * 1.25 }} 
          resizeMode="contain" 
        />
      </View>
    );
  }

  const isMapped = !!(EMOJI_MAP[name] || UI_EMOJI[name]);
  const rawText = name || '';
  const emoji = isMapped ? (EMOJI_MAP[name] || UI_EMOJI[name]) : rawText.slice(0, 2);
  const isCustomText = !isMapped && /[a-zA-Z가-힣0-9]/.test(name || '');
  // ∅ 등 기호 문자는 폰트 ascender로 인해 시각적으로 위로 치우침 → 보정
  const isSymbol = !isMapped && !isCustomText && rawText.length > 0;

  const fs = isCustomText ? size * 0.55 : size;
  return (
    <View style={{ width: size * 1.4, height: size * 1.4, alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
      <Text style={{
        fontSize: fs,
        lineHeight: fs * 1.4,
        textAlign: 'center',
        includeFontPadding: false,
        marginTop: isSymbol ? fs * 0.1 : 0,
      }}>
        {emoji}
      </Text>
    </View>
  );
}

// ── PhotoOrIcon: 카드에서 photoUri 우선, 없으면 emoji ───────────────────────
function PhotoOrIcon({ photoUri, icon, circleSize, iconSize, bgColor }) {
  if (photoUri) {
    return (
      <Image
        source={{ uri: photoUri }}
        style={{ width: circleSize, height: circleSize, borderRadius: circleSize / 2 }}
        resizeMode="cover"
      />
    );
  }
  return (
    <View style={{ width: circleSize, height: circleSize, borderRadius: circleSize / 2, backgroundColor: bgColor || C.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
      <EmojiIcon name={icon || '📦'} size={iconSize} />
    </View>
  );
}

// ── pickPhoto 헬퍼 ────────────────────────────────────────────────────────────
async function pickPhoto(onResult) {
  Alert.alert('사진 등록', '사진 선택 방법을 선택하세요', [
    {
      text: '카메라 촬영',
      onPress: async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { Alert.alert('카메라 권한이 필요합니다'); return; }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true, aspect: [1, 1], quality: 0.8,
        });
        if (!result.canceled) onResult(result.assets[0].uri);
      },
    },
    {
      text: '사진첩에서 선택',
      onPress: async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('사진첩 접근 권한이 필요합니다'); return; }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true, aspect: [1, 1], quality: 0.8,
        });
        if (!result.canceled) onResult(result.assets[0].uri);
      },
    },
    { text: '취소', style: 'cancel' },
  ]);
}

// ── IconPhotoHeader: 모달 상단 아이콘+사진버튼 ─────────────────────────────
function IconPhotoHeader({ icon, photoUri, onChangePhoto, onChangeIcon, onTextModeChange, level = 0 }) {
  const [textMode, setTextMode] = React.useState(false);
  const [textValue, setTextValue] = React.useState('');
  const textInputRef = useRef(null);

  // 아이콘이 커스텀 텍스트인지 판별
  const isMapped = !!(EMOJI_MAP[icon] || UI_EMOJI[icon]);
  const isCustomText = !isMapped && !!icon && icon !== '📦' && /[^\s]/.test(icon);

  const setMode = (val) => {
    setTextMode(val);
    onTextModeChange?.(val);
  };

  const handleTextMode = () => {
    setTextValue(isCustomText ? icon : '');
    setMode(true);
    setTimeout(() => textInputRef.current?.focus(), 50);
  };

  const handleConfirm = () => {
    // [...textValue]로 유니코드 코드포인트 기준 2글자 제한 (한글 조합 문제 방지)
    const trimmed = [...textValue.trim()].slice(0, 2).join('');
    if (trimmed) onChangeIcon(trimmed);
    setMode(false);
  };

  const handleCancel = () => {
    setMode(false);
  };

  return (
    <View style={{ alignSelf: 'center', marginBottom: 16 }}>
      {/* 중앙 아이콘 / 사진 미리보기 */}
      <View style={[S.modalIconPreview, { backgroundColor: LEVEL_ICON_BG[level] || C.primaryContainer }]}>
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={{ width: 80, height: 80, borderRadius: 40 }}
            resizeMode="cover"
          />
        ) : textMode ? (
          <TextInput
            ref={textInputRef}
            value={textValue}
            onChangeText={(t) => setTextValue([...t].slice(0, 2).join(''))}
            onSubmitEditing={handleConfirm}
            autoCorrect={false}
            spellCheck={false}
            returnKeyType="done"
            style={{
              width: 80, height: 80,
              fontSize: 17, fontWeight: '700',
              textAlign: 'center',
              color: C.onSurface,
            }}
          />
        ) : (
          <EmojiIcon name={icon || '📦'} size={40} />
        )}
      </View>

      {/* 텍스트 모드: 확인/취소 버튼 */}
      {textMode ? (
        <>
          <TouchableOpacity
            style={{
              position: 'absolute', bottom: -2, right: -2,
              width: 30, height: 30, borderRadius: 15,
              backgroundColor: C.primary,
              alignItems: 'center', justifyContent: 'center',
              shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.15, shadowRadius: 2, elevation: 2,
            }}
            onPress={handleConfirm}
          >
            <Text style={{ fontSize: 14, color: '#fff', fontWeight: '700' }}>✓</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              position: 'absolute', bottom: -2, left: -2,
              width: 30, height: 30, borderRadius: 15,
              backgroundColor: '#e0e0e0',
              alignItems: 'center', justifyContent: 'center',
              shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
            }}
            onPress={handleCancel}
          >
            <Text style={{ fontSize: 14, color: '#666' }}>✕</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          {/* 📷 소형 오버레이 버튼 (우측 하단) */}
          <TouchableOpacity
            style={{
              position: 'absolute', bottom: -2, right: -2,
              width: 30, height: 30, borderRadius: 15,
              backgroundColor: '#ffffff',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1.5, borderColor: '#d0d5d8',
              shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.12, shadowRadius: 2, elevation: 2,
            }}
            onPress={() => pickPhoto(onChangePhoto)}
          >
            <Text style={{ fontSize: 14, lineHeight: 18 }}>📷</Text>
          </TouchableOpacity>

          {/* 🔤 소형 오버레이 버튼 (좌측 하단) — 사진 없을 때만 */}
          {!photoUri && (
            <TouchableOpacity
              style={{
                position: 'absolute', bottom: -2, left: -2,
                width: 30, height: 30, borderRadius: 15,
                backgroundColor: '#ffffff',
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1.5, borderColor: '#d0d5d8',
                shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.12, shadowRadius: 2, elevation: 2,
              }}
              onPress={handleTextMode}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: C.onSurfaceVariant }}>Aa</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

// ── Shared: Categorized Icon Picker ───────────────────────────────────────────
function IconPicker({ icon, onChangeIcon, recentIcons = [] }) {
  // 커스텀 텍스트(EMOJI_MAP/UI_EMOJI에 없는 문자열)는 최근 사용에서 제외
  const displayRecents = recentIcons.filter(ic => !!(EMOJI_MAP[ic] || UI_EMOJI[ic]));

  return (
    <ScrollView style={S.iconPickerScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
      {displayRecents.length > 0 && (
        <View style={S.iconSection}>
          <Text style={S.iconSectionHeader}>⏱ 최근 사용</Text>
          <View style={S.iconGrid5}>
            {displayRecents.map((ic, idx) => (
              <TouchableOpacity
                key={`recent-${idx}-${ic}`}
                style={[S.iconCell, ic === icon && S.iconCellActive]}
                onPress={() => onChangeIcon(ic)}
              >
                <EmojiIcon name={ic} size={30} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      {ICON_CATEGORIES.map((cat, catIdx) => (
        <View key={`cat-${catIdx}`} style={S.iconSection}>
          <Text style={S.iconSectionHeader}>{cat.name}</Text>
          <View style={S.iconGrid5}>
            {cat.icons.map((ic, icIdx) => (
              <TouchableOpacity
                key={`cat-${catIdx}-${icIdx}-${ic}`}
                style={[S.iconCell, ic === icon && S.iconCellActive]}
                onPress={() => onChangeIcon(ic)}
              >
                <EmojiIcon name={ic} size={30} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
// ── CategoryCard ──────────────────────────────────────────────────────────────
const NONE_CIRCLE = '#d8d8d8';
const NONE_CARD   = '#f0f0f0';
const NONE_TEXT   = '#a0a0a0';

// 레벨별 카드 색상 (0=공간, 1=가구, 2=구획, 3=물건)
const LEVEL_CARD_BG     = ['#f0fefd', '#f5f0ff', '#eef6ff', '#fff8ee'];
const LEVEL_ICON_BG     = ['#abefee', '#e0ccf8', '#cce4f8', '#fde5c0'];

export function CategoryCard({ item, onMenuPress, level = 0 }) {
  const isNone = !!item.none;
  const cardBg = isNone ? NONE_CARD : (LEVEL_CARD_BG[level] || LEVEL_CARD_BG[0]);
  const iconBg = isNone ? NONE_CIRCLE : (LEVEL_ICON_BG[level] || LEVEL_ICON_BG[0]);

  return (
    <View style={[
      S.spaceCard,
      { backgroundColor: cardBg, width: '100%', height: '100%', aspectRatio: undefined },
    ]}>
      <View style={[S.spaceIconBg, { backgroundColor: iconBg }]}>
        <PhotoOrIcon photoUri={item.photoUri} icon={item.icon} circleSize={56} iconSize={30} bgColor={iconBg} />
      </View>
      <Text style={[S.spaceLabel, isNone && { color: NONE_TEXT }]} numberOfLines={2}>{item.label}</Text>
      
      {item.memo && (
        <View style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}>
          <Text style={{ fontSize: 12 }}>📝</Text>
        </View>
      )}
    </View>
  );
}

export function ItemCard({ item, onMenuPress, onUpdateQty, onManualQty, level = 3 }) {
  const qty = item.quantity ?? 1;
  const cardBg = LEVEL_CARD_BG[level] || LEVEL_CARD_BG[3];
  const iconBg = LEVEL_ICON_BG[level] || LEVEL_ICON_BG[3];

  return (
    <View style={[
      S.itemCard,
      { backgroundColor: cardBg, width: '100%', height: '100%', aspectRatio: undefined },
    ]}>
      <View style={[S.itemIconBg, { backgroundColor: iconBg }]}>
        <PhotoOrIcon photoUri={item.photoUri} icon={item.icon} circleSize={48} iconSize={26} bgColor={iconBg} />
      </View>
      <Text style={S.itemCardLabel} numberOfLines={2}>{item.label}</Text>
      
      {item.memo && (
        <View style={{ position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}>
          <Text style={{ fontSize: 11 }}>📝</Text>
        </View>
      )}
      
      {/* 수량 조절 인터페이스 */}
      <View style={{ 
        flexDirection: 'row', alignItems: 'center', 
        backgroundColor: iconBg + '99', borderRadius: 10, paddingHorizontal: 4 
      }}>
        <TouchableOpacity 
          onPress={() => onUpdateQty && onUpdateQty(item.id, -1)}
          style={{ paddingHorizontal: 6, paddingVertical: 4 }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>−</Text>
        </TouchableOpacity>
        
        <View style={{ minWidth: 30, alignItems: 'center' }}>
          <Text style={S.itemQtyText}>{formatQty(qty)}</Text>
        </View>

        <TouchableOpacity 
          onPress={() => onUpdateQty && onUpdateQty(item.id, 1)}
          onLongPress={() => onManualQty && onManualQty(item.id)}
          delayLongPress={500}
          style={{ paddingHorizontal: 6, paddingVertical: 4 }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── TaskItem ──────────────────────────────────────────────────────────────────
export function TaskItem({ icon, title, sub }) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={S.taskItem}>
      <View style={S.taskIconWrapper}>
        <View style={S.taskIconBg}>
          <EmojiIcon name={icon} size={22} />
        </View>
        <View style={S.alertBadge}><Text style={S.alertText}>!</Text></View>
      </View>
      <View style={S.taskInfo}>
        <Text style={S.taskTitle}>{title}</Text>
        <Text style={S.taskSub}>{sub}</Text>
      </View>
      <Text style={{ fontSize:18, color:C.outlineVariant }}>›</Text>
    </TouchableOpacity>
  );
}

// ── NavTab ────────────────────────────────────────────────────────────────────
export function NavTab({ icon, label, isActive, hasAlert, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.8} style={[S.navTab, isActive && S.navTabActive]} onPress={onPress}>
      <View style={{ paddingTop: 4 }}>
        <EmojiIcon name={icon} size={22} />
        {hasAlert && (
          <View style={{ position: 'absolute', top: -2, right: -4, width: 8, height: 8, borderRadius: 4, backgroundColor: C.error }} />
        )}
      </View>
      <Text style={[S.navLabel, isActive && S.navLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── ActionModal ───────────────────────────────────────────────────────────────
export function ActionModal({ visible, itemLabel, onEdit, onMove, onDuplicate, onMemo, onDelete, onCancel }) {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}
        activeOpacity={1}
        onPress={onCancel}
      >
        <TouchableOpacity activeOpacity={1} onPress={() => {}}
          style={{
            width: 280, backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
            shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2, shadowRadius: 20, elevation: 12,
          }}
        >
          {/* 제목 */}
          <View style={{ paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.outlineVariant + '40' }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: C.onSurfaceVariant, textAlign: 'center' }} numberOfLines={1}>{itemLabel}</Text>
          </View>

          {/* 수정 */}
          <TouchableOpacity
            onPress={onEdit}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 18 }}
          >
            <Text style={{ fontSize: 20, width: 26, textAlign: 'center' }}>✏️</Text>
            <Text style={{ fontSize: 17, fontWeight: '500', color: C.onSurface }}>수정</Text>
          </TouchableOpacity>

          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: C.outlineVariant + '40', marginHorizontal: 20 }} />

          {/* 이동 */}
          <TouchableOpacity
            onPress={onMove}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 18 }}
          >
            <Text style={{ fontSize: 20, width: 26, textAlign: 'center' }}>📂</Text>
            <Text style={{ fontSize: 17, fontWeight: '500', color: C.onSurface }}>카테고리 이동</Text>
          </TouchableOpacity>

          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: C.outlineVariant + '40', marginHorizontal: 20 }} />

          {/* 복제 */}
          <TouchableOpacity
            onPress={onDuplicate}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 18 }}
          >
            <Text style={{ fontSize: 20, width: 26, textAlign: 'center' }}>📋</Text>
            <Text style={{ fontSize: 17, fontWeight: '500', color: C.onSurface }}>복제</Text>
          </TouchableOpacity>

          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: C.outlineVariant + '40', marginHorizontal: 20 }} />

          {/* 메모 */}
          <TouchableOpacity
            onPress={onMemo}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 18 }}
          >
            <Text style={{ fontSize: 20, width: 26, textAlign: 'center' }}>📝</Text>
            <Text style={{ fontSize: 17, fontWeight: '500', color: C.onSurface }}>메모</Text>
          </TouchableOpacity>

          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: C.outlineVariant + '40', marginHorizontal: 20 }} />

          {/* 삭제 */}
          <TouchableOpacity
            onPress={onDelete}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 18 }}
          >
            <Text style={{ fontSize: 20, width: 26, textAlign: 'center' }}>🗑️</Text>
            <Text style={{ fontSize: 17, fontWeight: '500', color: C.error }}>삭제</Text>
          </TouchableOpacity>

          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: C.outlineVariant + '40' }} />

          {/* 취소 */}
          <TouchableOpacity
            onPress={onCancel}
            style={{ paddingVertical: 18, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 17, fontWeight: '600', color: C.onSurfaceVariant }}>취소</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ── MemoModal ────────────────────────────────────────────────────────────────
export function MemoModal({ visible, label, memo, onSave, onCancel }) {
  const [text, setText] = React.useState('');
  const [isConfirmingClear, setIsConfirmingClear] = React.useState(false);
  
  React.useEffect(() => {
    if (visible) {
      setText(memo || '');
      setIsConfirmingClear(false);
    }
  }, [visible, memo]);

  const handleClear = () => {
    setText('');
    setIsConfirmingClear(false);
    onSave('');
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableOpacity style={S.modalOverlay} activeOpacity={1} onPress={onCancel}>
          <TouchableOpacity activeOpacity={1} style={[S.modalSheet, { paddingBottom: 30 }]} onPress={() => {}}>
            <View style={{ alignItems: 'center', paddingBottom: 8 }}>
              <View style={S.actionHandle} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={S.modalTitle}>📝 메모: {label}</Text>
              {!isConfirmingClear ? (
                <TouchableOpacity onPress={() => setIsConfirmingClear(true)} style={{ padding: 4 }}>
                  <Text style={{ color: C.error, fontWeight: '600' }}>지우기</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => setIsConfirmingClear(false)} style={{ paddingVertical: 4, paddingHorizontal: 6, justifyContent: 'center' }}>
                    <Text style={{ color: C.onSurfaceVariant, fontWeight: '700', fontSize: 14, lineHeight: 20, includeFontPadding: false }}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleClear} style={{ paddingVertical: 4, paddingHorizontal: 6, justifyContent: 'center' }}>
                    <Text style={{ color: C.error, fontWeight: '700', fontSize: 14, lineHeight: 20, includeFontPadding: false }}>정말 지움</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TextInput
              style={{
                backgroundColor: '#fff9c4',
                borderRadius: 12,
                padding: 16,
                minHeight: 150,
                textAlignVertical: 'top',
                color: C.onSurface,
                fontSize: 16,
                borderWidth: 1,
                borderColor: '#fbc02d',
              }}
              multiline
              placeholder="여기에 메모를 작성하세요..."
              value={text}
              onChangeText={setText}
              autoFocus={true}
            />

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <TouchableOpacity
                onPress={onCancel}
                style={{ flex: 1, height: 50, borderRadius: 12, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontWeight: '600', color: C.onSurfaceVariant }}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onSave(text)}
                style={{ flex: 2, height: 50, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontWeight: '600', color: '#fff' }}>메모 저장</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── CategoryModal ─────────────────────────────────────────────────────────────
export function CategoryModal({ visible, mode, levelName, label, icon, photoUri, recentIcons,
  onChangeLabel, onChangeIcon, onChangePhoto, onSave, onCancel }) {
  const inputRef = useRef(null);
  const [iconTextMode, setIconTextMode] = React.useState(false);

  const dismissPan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, { dy, dx }) => dy > 8 && dy > Math.abs(dx),
    onPanResponderRelease: (_, { dy, vy }) => { if (dy > 80 || vy > 0.8) onCancel(); },
  })).current;

  const level = LEVEL_NAMES.indexOf(levelName) === -1 ? 0 : LEVEL_NAMES.indexOf(levelName);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <KeyboardAvoidingView style={{ flex: 1 }}>
        <TouchableOpacity style={S.modalOverlay} activeOpacity={1} onPress={onCancel}>
          <TouchableOpacity activeOpacity={1} style={S.modalSheet} onPress={() => {}}>
            <View {...dismissPan.panHandlers} style={{ alignItems: 'center', paddingBottom: 8 }}>
              <View style={S.actionHandle} />
            </View>
            <Text style={S.modalTitle}>{mode === 'add' ? `${levelName} 추가` : `${levelName} 수정`}</Text>

            <IconPhotoHeader
              icon={icon}
              photoUri={photoUri}
              onChangePhoto={onChangePhoto}
              onChangeIcon={onChangeIcon}
              onTextModeChange={setIconTextMode}
              level={level}
            />

            {!iconTextMode && (
              <>
                <TouchableOpacity onPress={() => inputRef.current?.focus()} activeOpacity={1}>
                  <View style={[S.modalInput, { justifyContent: 'center' }]} pointerEvents="none">
                    <TextInput
                      ref={inputRef}
                      value={label}
                      onChangeText={onChangeLabel}
                      placeholder="이름 입력"
                      placeholderTextColor={C.outlineVariant}
                      style={{ fontSize: 15, color: C.onSurface }}
                    />
                  </View>
                </TouchableOpacity>

                <Text style={[S.iconSectionHeader, { marginBottom: 8 }]}>
                  {photoUri ? '아이콘 선택 (사진 사용 중)' : '아이콘 선택'}
                </Text>
                <IconPicker icon={icon} onChangeIcon={onChangeIcon} recentIcons={recentIcons} />

                <View style={S.modalActions}>
                  <TouchableOpacity style={S.cancelBtn} onPress={onCancel}>
                    <Text style={S.cancelBtnText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={S.saveBtn} onPress={onSave}>
                    <Text style={S.saveBtnText}>저장</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── ItemModal ─────────────────────────────────────────────────────────────────
export function ItemModal({ visible, mode, label, qty, icon, photoUri, recentIcons,
  onChangeLabel, onChangeQty, onChangeIcon, onChangePhoto, onSave, onCancel }) {
  const inputRef = useRef(null);
  const [iconTextMode, setIconTextMode] = React.useState(false);
  const [qtyInputVisible, setQtyInputVisible] = React.useState(false);
  const dismissPan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, { dy, dx }) => dy > 8 && dy > Math.abs(dx),
    onPanResponderRelease: (_, { dy, vy }) => { if (dy > 80 || vy > 0.8) onCancel(); },
  })).current;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <KeyboardAvoidingView style={{ flex: 1 }}>
        <TouchableOpacity style={S.modalOverlay} activeOpacity={1} onPress={onCancel}>
          <TouchableOpacity activeOpacity={1} style={[S.modalSheet, { maxHeight: '90%' }]} onPress={() => {}}>
            <View {...dismissPan.panHandlers} style={{ alignItems: 'center', paddingBottom: 8 }}>
              <View style={S.actionHandle} />
            </View>
            <Text style={S.modalTitle}>{mode === 'add' ? '물건 등록' : '물건 수정'}</Text>

            <IconPhotoHeader
              icon={icon}
              photoUri={photoUri}
              onChangePhoto={onChangePhoto}
              onChangeIcon={onChangeIcon}
              onTextModeChange={setIconTextMode}
              level={3}
            />

            {!iconTextMode && (
              <>
                <TouchableOpacity onPress={() => inputRef.current?.focus()} activeOpacity={1}>
                  <View style={[S.modalInput, { justifyContent: 'center' }]} pointerEvents="none">
                    <TextInput
                      ref={inputRef}
                      value={label}
                      onChangeText={onChangeLabel}
                      placeholder="물건 이름"
                      placeholderTextColor={C.outlineVariant}
                      style={{ fontSize: 15, color: C.onSurface }}
                    />
                  </View>
                </TouchableOpacity>

                <QtyInputModal
                  visible={qtyInputVisible}
                  currentQty={qty}
                  onConfirm={(n) => { setQtyInputVisible(false); onChangeQty(n); }}
                  onCancel={() => setQtyInputVisible(false)}
                />
                <View style={S.qtyRow}>
                  <Text style={S.qtyLabel}>개수</Text>
                  <View style={S.qtyStepper}>
                    <TouchableOpacity onPress={() => onChangeQty(Math.max(1, qty - 1))}>
                      <Text style={{ fontSize:30, color:C.primary }}>−</Text>
                    </TouchableOpacity>
                    <Text style={S.qtyValue}>{formatQty(qty)}</Text>
                    <LongPressPlus
                      textStyle={{ fontSize: 30 }}
                      onPress={() => onChangeQty(qty + 1)}
                      onLongPress={() => setQtyInputVisible(true)}
                    />
                  </View>
                </View>

                <Text style={[S.iconSectionHeader, { marginBottom: 8 }]}>
                  {photoUri ? '아이콘 선택 (사진 사용 중)' : '아이콘 선택'}
                </Text>
                <IconPicker icon={icon} onChangeIcon={onChangeIcon} recentIcons={recentIcons} />

                <View style={S.modalActions}>
                  <TouchableOpacity style={S.cancelBtn} onPress={onCancel}>
                    <Text style={S.cancelBtnText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={S.saveBtn} onPress={onSave}>
                    <Text style={S.saveBtnText}>저장</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── SearchModal ───────────────────────────────────────────────────────────────
export function SearchModal({ visible, results, query, onChangeQuery, onCancel, onItemPress }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableOpacity style={S.searchOverlay} activeOpacity={1} onPress={onCancel}>
        <TouchableOpacity style={S.searchPopup} activeOpacity={1} onPress={() => {}}>
          <View style={S.searchHeader}>
            <Text style={{ fontSize:18 }}>🔍</Text>
            <TextInput
              style={S.searchInput2}
              value={query}
              onChangeText={onChangeQuery}
              placeholder="공간, 가구, 구획, 물건 검색"
              placeholderTextColor={C.outlineVariant}
              autoFocus
              returnKeyType="search"
            />
            <TouchableOpacity style={S.searchCancelBtn} onPress={onCancel}>
              <Text style={S.searchCancelText}>닫기</Text>
            </TouchableOpacity>
          </View>

          {query.trim() === '' ? (
            <View style={S.searchEmpty}>
              <Text style={S.searchEmptyText}>검색어를 입력하세요</Text>
            </View>
          ) : results.length === 0 ? (
            <View style={S.searchEmpty}>
              <Text style={{ fontSize:36 }}>🔍</Text>
              <Text style={S.searchEmptyText}>검색 결과가 없어요</Text>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(_, i) => String(i)}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={S.searchResultItem}
                  onPress={() => onItemPress && onItemPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={S.searchResultIcon}>
                    {item.photoUri ? (
                      <Image source={{ uri: item.photoUri }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                    ) : (
                      <EmojiIcon name={item.icon || 'category'} size={20} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={S.searchResultLabel}>{item.label}</Text>
                    {item.pathLabels?.length > 0 && (
                      <Text style={S.searchResultPath}>{['홈', ...item.pathLabels].join(' > ')}</Text>
                    )}
                  </View>
                  {item.quantity != null && (
                    <View style={S.itemQtyBadge}>
                      <Text style={S.itemQtyText}>{item.quantity}개</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ── NoticeView (알림) ─────────────────────────────────────────────────────────
const NOTICES = [
  {
    id: 1,
    title: '차곡차곡 앱이 출시되었습니다.',
    body: '안녕하세요. 차곡차곡의 개발자입니다. 반갑습니다.',
    date: '2026.04.09',
  },
];

export function NoticeView({ onRead }) {
  const [expandedId, setExpandedId] = React.useState(null);

  React.useEffect(() => {
    onRead?.();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
        {NOTICES.map(notice => {
          const isExpanded = expandedId === notice.id;
          return (
            <TouchableOpacity
              key={notice.id}
              activeOpacity={0.8}
              onPress={() => setExpandedId(isExpanded ? null : notice.id)}
              style={{
                backgroundColor: '#fff', borderRadius: 14, padding: 16,
                shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
                borderLeftWidth: 3, borderLeftColor: C.primary,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: C.onSurface }}>{notice.title}</Text>
                  <Text style={{ fontSize: 11, color: C.outlineVariant, marginTop: 2 }}>{notice.date}</Text>
                </View>
                <Text style={{ fontSize: 12, color: C.outlineVariant, fontWeight: '700', marginLeft: 8 }}>
                  {isExpanded ? '▲' : '▼'}
                </Text>
              </View>
              
              {isExpanded && (
                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.outlineVariant + '40' }}>
                  <Text style={{ fontSize: 14, color: C.onSurfaceVariant, lineHeight: 22 }}>{notice.body}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ── ViewerView (SpaceTree 기반 실험실식 뷰어) ───────────────────────────────
// 기존 드래그앤드롭 시스템을 완전히 제거하고, 선택 + 버튼 방식으로 교체.
// 내부적으로 hierarchy를 SpaceTree로 변환해 모든 이동/재정렬을 모델 검증을
// 거치게 한 뒤 다시 hierarchy로 역변환해 onSaveHierarchy로 저장한다.
export function ViewerView({ hierarchy, onSaveHierarchy, onNavigate }) {
  // hierarchy가 바뀌면 SpaceTree를 재생성(역직렬화)
  const tree = useMemo(() => hierarchyToSpaceTree(hierarchy || []), [hierarchy]);

  const [selectedIds, setSelectedIds] = React.useState(new Set());
  const [multiMode, setMultiMode] = React.useState(false);
  const [collapsedIds, setCollapsedIds] = React.useState({});
  const [moveMode, setMoveMode] = React.useState(false);
  const [message, setMessage] = React.useState({ kind: 'info', text: '' });



  const showOk = (text) => setMessage({ kind: 'ok', text });
  const showErr = (text) => setMessage({ kind: 'err', text });
  const showInfo = (text) => setMessage({ kind: 'info', text });

  // 수정 후 hierarchy 저장 (SpaceTree는 그대로 두고 hierarchy를 교체하면
  // useMemo가 새 tree를 만들어 다음 렌더에 반영됨)
  const commit = () => {
    const next = spaceTreeToHierarchy(tree);
    onSaveHierarchy && onSaveHierarchy(next);
  };

  // ── 액션 핸들러 (다중 선택 지원) ────────────────────────────────────────
  const handleReorder = (dir) => {
    if (selectedIds.size === 0) return;
    try {
      // 선택된 ID들을 현재 순서대로 정렬하여 일괄 이동
      const ids = Array.from(selectedIds);
      ids.sort((a, b) => (tree.get(a)?.sortOrder || 0) - (tree.get(b)?.sortOrder || 0));

      const first = tree.get(ids[0]);
      if (!first) return;

      const siblings = tree.childrenOf(first.parentId);
      const firstIdx = siblings.findIndex(s => s.id === ids[0]);
      const lastIdx = siblings.findIndex(s => s.id === ids[ids.length - 1]);

      if (dir === 'up' && firstIdx > 0) {
        ids.forEach((id, i) => tree.reorderObject(id, firstIdx - 1 + i));
      } else if (dir === 'down' && lastIdx < siblings.length - 1) {
        // 아래로 갈 때는 밑에서부터 이동해야 순서가 안 꼬임
        for (let i = ids.length - 1; i >= 0; i--) {
          tree.reorderObject(ids[i], lastIdx + 1 - (ids.length - 1 - i));
        }
      }
      Haptics.selectionAsync().catch(() => {});
      commit();
    } catch (e) {
      Alert.alert('오류', e.message);
    }
  };

  const handleStartMove = () => {
    if (selectedIds.size === 0) return;
    setMoveMode(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  const handleCancelMove = () => {
    setMoveMode(false);
  };

  // 선택된 항목들을 targetId(=null이면 루트)로 이동할 수 있는지 검증
  const canMoveSelectedTo = React.useCallback((targetId) => {
    if (!moveMode || selectedIds.size === 0) return false;

    let newParent = null;
    let newSpace = 0;
    if (targetId !== null) {
      newParent = tree.get(targetId);
      if (!newParent) return false;
      if (newParent.type === 'd') return false;
      if (newParent.space >= MAX_SPACE) return false;
      newSpace = newParent.space + 1;
    }

    for (const id of selectedIds) {
      if (id === targetId) return false;
      const node = tree.get(id);
      if (!node) return false;

      if (targetId !== null) {
        // 자기 자손 아래로 이동 금지 (순환)
        const descendants = tree.descendantsOf(id, { includeSelf: false });
        if (descendants.some(d => d.id === targetId)) return false;
        // 타입 서열
        if (!canBeParentType(newParent.type, node.type)) return false;
      }

      // 서브트리가 MAX_SPACE를 넘지 않는지
      const subtree = tree.descendantsOf(id, { includeSelf: true });
      const oldRootSpace = node.space;
      for (const sn of subtree) {
        const delta = sn.space - oldRootSpace;
        if (newSpace + delta > MAX_SPACE) return false;
      }
    }
    return true;
  }, [moveMode, selectedIds, tree]);

  const handlePickTarget = (targetId) => {
    if (!moveMode || selectedIds.size === 0) return;
    try {
      // 선택된 모든 항목 일괄 이동
      for (const id of selectedIds) {
        tree.moveObject(id, targetId);
      }
      setMoveMode(false);
      // 작업 완료 후 선택 해제 및 모드 종료
      setSelectedIds(new Set());
      setMultiMode(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      commit();
    } catch (e) {
      // 선택된 항목들 중 첫 번째 항목의 라벨을 가져와서 메시지 구성 (보통 한 세트가 함께 실패하므로)
      const firstId = Array.from(selectedIds)[0];
      const label = tree.get(firstId)?.data?.label || firstId;
      Alert.alert('이동 불가', `${label}은(는) 하위 레벨로 이동할 수 없습니다.`);
      setMoveMode(false);
    }
  };

  const handleDeleteNode = (nodeId, label) => {
    Alert.alert('항목 삭제', `'${label}'을(를) 삭제할까요?\n포함된 하위 항목들도 함께 삭제됩니다.`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => {
        try {
          tree.removeObject(nodeId);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          commit();
        } catch (e) {
          Alert.alert('오류', '삭제 중 문제가 발생했습니다.');
        }
      }}
    ]);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    Alert.alert('다중 삭제 확인', `선택한 ${selectedIds.size}개의 항목을 모두 삭제할까요?\n포함된 하위 항목들도 함께 삭제됩니다.`, [
      { text: '취소', style: 'cancel' },
      { text: '모두 삭제', style: 'destructive', onPress: () => {
        try {
          // 한꺼번에 삭제 시 ID가 유효한지 확인하며 삭제
          for (const id of selectedIds) {
            if (tree.get(id)) tree.removeObject(id);
          }
          setSelectedIds(new Set());
          setMultiMode(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          commit();
        } catch (e) {
          Alert.alert('오류', '일부 항목 삭제 중 문제가 발생했습니다.');
        }
      }}
    ]);
  };

  const toggleMultiMode = () => {
    setMultiMode(prev => {
      if (prev) setSelectedIds(new Set()); // 모드 끌 때 선택 초기화
      return !prev;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  // 접기/펼치기
  const toggleCollapse = (id) => {
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setCollapsedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // ── 렌더 ─────────────────────────────────────────────────────────────
  const roots = tree.roots();
  const messageColor = message.kind === 'ok' ? '#2e7d32' : (message.kind === 'err' ? '#c62828' : C.onSurfaceVariant);
  const messageBg = message.kind === 'ok' ? '#e8f5e9' : (message.kind === 'err' ? '#ffebee' : '#f5f5f5');

  const renderNode = (node, depth) => {
    const data = node.data || {};
    const children = tree.childrenOf(node.id);

    // '가구 없음' / '구획 없음' 같은 placeholder(none) 노드는 보이지 않게 하고
    // 자식들만 같은 depth로 평평하게 렌더한다.
    if (data.none) {
      return (
        <React.Fragment key={node.id}>
          {children.map(ch => renderNode(ch, depth))}
        </React.Fragment>
      );
    }

    const level = typeToLevel(node.type);
    const isSelected = selectedIds.has(node.id);
    const canMoveHere = moveMode && !isSelected && canMoveSelectedTo(node.id);
    const isMoveDisabled = moveMode && !isSelected && !canMoveHere;
    const hasChildren = children.length > 0;
    const isCollapsed = !!collapsedIds[node.id];
    const levelName = LEVEL_NAMES[level] || '';
    const levelColors = ['#E0F7FA', '#F3E5F5', '#E8F5E9', '#FFF3E0'];
    const rowBg = levelColors[level] || '#fff';

    return (
      <View key={node.id}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            if (moveMode) {
              if (!canMoveHere) return;
              handlePickTarget(node.id);
            } else if (multiMode) {
              setSelectedIds(prev => {
                const next = new Set(prev);
                if (next.has(node.id)) next.delete(node.id);
                else next.add(node.id);
                return next;
              });
            } else {
              setSelectedIds(prev => prev.has(node.id) ? new Set() : new Set([node.id]));
            }
          }}
          onLongPress={() => {
            // 홈 화면으로 이동 (해당 항목이 위치한 부모 뷰가 보이게)
            if (moveMode) return;
            const path = findNodePathById(hierarchy, node.id) || [];
            // 물건(level 3)은 부모 화면으로, 나머지는 본인 화면 또는 부모 화면 선택
            // 여기서는 '물건이 위치한 곳'을 부모 뷰로 정의하여 slice(0,-1) 처리
            const targetPath = path.slice(0, -1);
            const targetLevel = level - 1;
            onNavigate && onNavigate(targetPath, targetLevel);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          }}
          delayLongPress={400}
          style={{
            flexDirection: 'row', alignItems: 'center',
            paddingVertical: 10, paddingHorizontal: 12,
            marginLeft: depth * 18, marginBottom: 4,
            borderRadius: 10,
            backgroundColor: isSelected
              ? '#bbdefb'
              : canMoveHere
                ? '#fff8e1'
                : isMoveDisabled
                  ? '#ececec'
                  : rowBg,
            borderWidth: 1,
            borderColor: isSelected
              ? '#1976d2'
              : canMoveHere
                ? '#ffb300'
                : isMoveDisabled
                  ? '#cfcfcf'
                  : 'rgba(0,0,0,0.05)',
            opacity: isMoveDisabled ? 0.55 : 1,
          }}
        >
          {/* 접기/펼치기 버튼 */}
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.();
              if (hasChildren) toggleCollapse(node.id);
            }}
            activeOpacity={0.5}
            style={{ 
              width: 32, height: 40, 
              alignItems: 'center', justifyContent: 'center', 
              marginRight: 2,
              zIndex: 10,
            }}
          >
            {hasChildren ? (
              <Text style={{ fontSize: 13, color: C.onSurfaceVariant, fontWeight: '900' }}>
                {isCollapsed ? '▶' : '▼'}
              </Text>
            ) : (
              <View style={{ width: 14 }} />
            )}
          </TouchableOpacity>

          {/* 아이콘 */}
          <View style={{
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: 'rgba(255,255,255,0.5)',
            alignItems: 'center', justifyContent: 'center', marginRight: 10,
          }}>
            <EmojiIcon name={data.icon || 'category'} size={20} />
          </View>

          {/* 라벨 & 메타 */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: C.onSurface }} numberOfLines={1}>
              {data.label || node.id}
            </Text>
            <Text style={{ fontSize: 10, color: C.primary, fontWeight: '700', marginTop: 1 }}>
              {levelName}
            </Text>
          </View>

          {/* 수량 뱃지 (물건) */}
          {data.quantity !== undefined && (
            <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#fde5c0', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12, marginLeft: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#f57c00' }}>{data.quantity}개</Text>
            </View>
          )}

          {/* 삭제 버튼 */}
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              if (selectedIds.has(node.id) && selectedIds.size > 1) {
                handleDeleteSelected();
              } else {
                handleDeleteNode(node.id, data.label || node.id);
              }
            }}
            style={{
              width: 28, height: 28, borderRadius: 14,
              backgroundColor: isSelected ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.05)',
              alignItems: 'center', justifyContent: 'center',
              marginLeft: 10,
            }}
          >
            <Text style={{ fontSize: 14, color: isSelected ? '#fff' : C.onSurfaceVariant, fontWeight: '700' }}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* 자식 렌더 (접혀있지 않을 때) */}
        {hasChildren && !isCollapsed && children.map(ch => renderNode(ch, depth + 1))}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      {/* 헤더 */}
      <View style={{
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.outlineVariant + '40',
        backgroundColor: C.navBg,
      }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: C.onSurface }}>🗂️ 정리</Text>

      </View>



      {/* 컨트롤 패널 */}
      <View style={{
        marginHorizontal: 16, marginTop: 12, marginBottom: 8,
        padding: 8, backgroundColor: '#fff', borderRadius: 10,
        borderWidth: 1, borderColor: C.outlineVariant + '50',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
          <ViewerBtn label="▲ 위로" onPress={() => handleReorder('up')} disabled={selectedIds.size === 0 || moveMode} />
          <ViewerBtn label="▼ 아래로" onPress={() => handleReorder('down')} disabled={selectedIds.size === 0 || moveMode} />
          {moveMode ? (
            <ViewerBtn label="✕ 이동취소" onPress={handleCancelMove} variant="warn" />
          ) : (
            <ViewerBtn label="↪ 이동" onPress={handleStartMove} disabled={selectedIds.size === 0} />
          )}
          <ViewerBtn
            label={multiMode ? "✕ 해제" : "📑 다중선택"}
            onPress={toggleMultiMode}
            variant={multiMode ? "warn" : "ghost"}
            hidden={selectedIds.size === 0 || moveMode}
          />
        </View>
      </View>



      {/* 트리 렌더 */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 고정된 홈 항목 */}
        {(() => {
        const homeCanMove = moveMode && canMoveSelectedTo(null);
        const homeIsDisabled = moveMode && !homeCanMove;
        return (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            if (moveMode) {
              if (!homeCanMove) return;
              handlePickTarget(null); // 최상위(Home)로 이동
            } else {
              setSelectedIds(new Set());
            }
          }}
          onLongPress={() => {
            if (moveMode) return;
            onNavigate && onNavigate([], -1); // 홈으로 이동
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          }}
          delayLongPress={400}
          style={{
            flexDirection: 'row', alignItems: 'center',
            paddingVertical: 10, paddingHorizontal: 12,
            marginBottom: 4,
            borderRadius: 10,
            backgroundColor: homeCanMove ? '#fff8e1' : (homeIsDisabled ? '#ececec' : '#f8f9fa'),
            borderWidth: 1,
            borderColor: homeCanMove ? '#ffb300' : (homeIsDisabled ? '#cfcfcf' : C.outlineVariant + '30'),
            opacity: homeIsDisabled ? 0.55 : 1,
          }}
        >
          <View style={{
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: C.primaryContainer,
            alignItems: 'center', justifyContent: 'center', marginRight: 10,
          }}>
            <EmojiIcon name="home" size={20} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: C.primary }} numberOfLines={1}>
              차곡차곡 홈
            </Text>
            <Text style={{ fontSize: 10, color: C.primary, fontWeight: '700', marginTop: 1 }}>
              고정 항목
            </Text>
          </View>
        </TouchableOpacity>
        );
        })()}

        {roots.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Text style={{ fontSize: 40 }}>📦</Text>
            <Text style={{ fontSize: 14, color: C.onSurfaceVariant, marginTop: 12 }}>
              아직 항목이 없습니다.
            </Text>
          </View>
        ) : (
          roots.map(r => renderNode(r, 0))
        )}
      </ScrollView>
    </View>
  );
}

// 뷰어 전용 버튼
function ViewerBtn({ label, onPress, disabled, variant, hidden }) {
  const bg = variant === 'danger' ? '#ffebee'
    : variant === 'warn' ? '#fff8e1'
    : variant === 'ghost' ? '#f5f5f5'
    : '#e3f2fd';
  const fg = disabled ? '#bdbdbd'
    : variant === 'danger' ? '#c62828'
    : variant === 'warn' ? '#ef6c00'
    : variant === 'ghost' ? C.onSurfaceVariant
    : '#1565c0';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || hidden}
      activeOpacity={0.7}
      pointerEvents={hidden ? 'none' : 'auto'}
      // flex: 1 + minWidth: 0 으로 부모 가용 공간을 균등 분할.
      style={{
        flex: 1,
        minWidth: 0,
        height: 38,
        paddingHorizontal: 4,
        borderRadius: 8, marginHorizontal: 2, marginVertical: 4,
        backgroundColor: hidden ? 'transparent' : (disabled ? '#f5f5f5' : bg),
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* 항상 렌더링 — hidden 시 투명 색상만 변경하여 Yoga 레이아웃 계산을 고정 */}
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        style={{ fontSize: 13, fontWeight: '700', textAlign: 'center', color: hidden ? 'transparent' : fg }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── LoginModal ────────────────────────────────────────────────────────────────
export function LoginModal({ visible, onClose, firebaseAuth }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      onClose();
      setEmail(''); setPassword('');
    } catch (e) {
      const msg = e.code === 'auth/invalid-credential' ? '이메일 또는 비밀번호가 올바르지 않습니다.'
        : e.code === 'auth/too-many-requests' ? '잠시 후 다시 시도해주세요.'
        : '로그인에 실패했습니다.';
      Alert.alert('로그인 실패', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('알림', '이메일을 먼저 입력해주세요.');
      return;
    }
    try {
      await sendPasswordResetEmail(firebaseAuth, email.trim());
      Alert.alert('완료', `${email.trim()}으로 비밀번호 재설정 링크를 보냈습니다.`);
    } catch (e) {
      Alert.alert('오류', '이메일을 확인해주세요.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-start', paddingTop: '30%', padding: 20 }}
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 20 }}>로그인</Text>
            <TextInput
              style={{
                borderWidth: 1.5, borderColor: C.outlineVariant, borderRadius: 12,
                paddingHorizontal: 16, height: 48, marginBottom: 12,
                color: C.onSurface, fontSize: 16
              }}
              placeholder="이메일"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoFocus={true}
            />
            <TextInput
              style={{
                borderWidth: 1.5, borderColor: C.outlineVariant, borderRadius: 12,
                paddingHorizontal: 16, height: 48, marginBottom: 12,
                color: C.onSurface, fontSize: 16
              }}
              placeholder="비밀번호"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity onPress={handleLogin} style={{ backgroundColor: C.primary, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>{loading ? '로그인 중...' : '로그인'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleForgotPassword} style={{ alignItems: 'center', paddingVertical: 8 }}>
              <Text style={{ color: C.primary, fontWeight: '500' }}>비밀번호 찾기</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── SignupModal ───────────────────────────────────────────────────────────────
export function SignupModal({ visible, onClose, firebaseAuth }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [passwordConfirm, setPasswordConfirm] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSignup = async () => {
    if (!email.trim() || !password.trim()) return;
    if (password !== passwordConfirm) {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('오류', '비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
      onClose();
      setEmail(''); setPassword(''); setPasswordConfirm('');
    } catch (e) {
      const msg = e.code === 'auth/email-already-in-use' ? '이미 사용 중인 이메일입니다.'
        : e.code === 'auth/invalid-email' ? '이메일 형식이 올바르지 않습니다.'
        : '회원가입에 실패했습니다.';
      Alert.alert('회원가입 실패', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-start', paddingTop: '30%', padding: 20 }}
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 20 }}>회원가입</Text>
            <TextInput
              style={{
                borderWidth: 1.5, borderColor: C.outlineVariant, borderRadius: 12,
                paddingHorizontal: 16, height: 48, marginBottom: 12,
                color: C.onSurface, fontSize: 16
              }}
              placeholder="이메일"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoFocus={true}
            />
            <TextInput
              style={{
                borderWidth: 1.5, borderColor: C.outlineVariant, borderRadius: 12,
                paddingHorizontal: 16, height: 48, marginBottom: 12,
                color: C.onSurface, fontSize: 16
              }}
              placeholder="비밀번호"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TextInput
              style={{
                borderWidth: 1.5, borderColor: C.outlineVariant, borderRadius: 12,
                paddingHorizontal: 16, height: 48, marginBottom: 20,
                color: C.onSurface, fontSize: 16
              }}
              placeholder="비밀번호 확인"
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              secureTextEntry
            />
            <TouchableOpacity onPress={handleSignup} style={{ backgroundColor: C.primary, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>{loading ? '가입 중...' : '가입하기'}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── SettingsView (설정) ───────────────────────────────────────────────────────
export function SettingsView({ onReset, hierarchy, onBackupLocal, onRestoreLocal }) {
  const [loginModalVisible, setLoginModalVisible] = React.useState(false);
  const [signupModalVisible, setSignupModalVisible] = React.useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = React.useState(false);
  const [noticeModalVisible, setNoticeModalVisible] = React.useState(false);
  const [termsModalVisible, setTermsModalVisible] = React.useState(false);
  const [policyModalVisible, setPolicyModalVisible] = React.useState(false);
  const [licenseModalVisible, setLicenseModalVisible] = React.useState(false);
  const [user, setUser] = React.useState(null);
  const [firebaseAuth, setFirebaseAuth] = React.useState(null);

  React.useEffect(() => {
    let unsubscribe;
    if (firebaseAuthCore) {
      setFirebaseAuth(firebaseAuthCore);
      unsubscribe = onAuthStateChanged(firebaseAuthCore, (u) => setUser(u));
    }
    return () => unsubscribe && unsubscribe();
  }, []);

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: async () => {
        await signOut(firebaseAuth);
      }},
    ]);
  };

  const SettingRow = ({ icon, label, onPress, destructive }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 14,
        backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.outlineVariant + '30',
      }}
    >
      <Text style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{icon}</Text>
      <Text style={{ flex: 1, fontSize: 16, fontWeight: '500', color: destructive ? C.error : C.onSurface }}>{label}</Text>
      {!destructive && <Text style={{ fontSize: 18, color: C.outlineVariant }}>›</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <View style={{
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.outlineVariant + '40',
        backgroundColor: C.navBg,
      }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: C.onSurface }}>⚙️ 설정</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 계정 프로필 */}
        <View style={{
          backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 18,
          flexDirection: 'row', alignItems: 'center', gap: 14,
          shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
        }}>
          <View style={{
            width: 52, height: 52, borderRadius: 26,
            backgroundColor: C.primaryContainer, alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 26 }}>{user ? '👤' : '🔒'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: C.onSurface }}>
              {user ? user.email : '로그인이 필요합니다'}
            </Text>
            <Text style={{ fontSize: 13, color: C.onSurfaceVariant, marginTop: 2 }}>
              {user ? '계정이 연결되어 있습니다' : '로그인하면 데이터를 백업할 수 있어요'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={user ? handleLogout : () => setLoginModalVisible(true)}
            style={{
              paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
              backgroundColor: user ? C.surfaceHigh : C.primary,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: user ? C.onSurfaceVariant : '#fff' }}>
              {user ? '로그아웃' : '로그인'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 계정 섹션 */}
        <Text style={{ fontSize: 12, fontWeight: '700', color: C.onSurfaceVariant, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6, letterSpacing: 0.5 }}>
          계정
        </Text>
        <View style={{ borderRadius: 14, overflow: 'hidden', marginHorizontal: 16, marginBottom: 24 }}>
          {!user && <SettingRow icon="✉️" label="이메일로 회원가입" onPress={() => setSignupModalVisible(true)} />}
          <SettingRow icon="🔐" label="개인정보 관리" onPress={() => setPrivacyModalVisible(true)} />
        </View>

        {/* 공지사항 */}
        <Text style={{ fontSize: 12, fontWeight: '700', color: C.onSurfaceVariant, paddingHorizontal: 20, paddingBottom: 6, letterSpacing: 0.5 }}>
          공지사항
        </Text>
        <View style={{ borderRadius: 14, overflow: 'hidden', marginHorizontal: 16, marginBottom: 24 }}>
          <SettingRow icon="🔔" label="공지사항" onPress={() => setNoticeModalVisible(true)} />
        </View>

        {/* 앱 정보 */}
        <Text style={{ fontSize: 12, fontWeight: '700', color: C.onSurfaceVariant, paddingHorizontal: 20, paddingBottom: 6, letterSpacing: 0.5 }}>
          앱 정보
        </Text>
        <View style={{ borderRadius: 14, overflow: 'hidden', marginHorizontal: 16, marginBottom: 24 }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 14,
            backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 16,
            borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.outlineVariant + '30',
          }}>
            <Text style={{ fontSize: 20, width: 28, textAlign: 'center' }}>📦</Text>
            <Text style={{ flex: 1, fontSize: 16, fontWeight: '500', color: C.onSurface }}>버전</Text>
            <Text style={{ fontSize: 14, color: C.onSurfaceVariant }}>1.0.0</Text>
          </View>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 14,
            backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 16,
            borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.outlineVariant + '30',
          }}>
            <Text style={{ fontSize: 20, width: 28, textAlign: 'center' }}>📧</Text>
            <Text style={{ flex: 1, fontSize: 16, fontWeight: '500', color: C.onSurface }}>이메일 문의</Text>
            <Text style={{ fontSize: 14, color: C.onSurfaceVariant }}>qbeck104@gmail.com</Text>
          </View>
          <TouchableOpacity
            onPress={() => Alert.alert('안내', '앱 출시 후 스토어로 연결됩니다.')}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 14,
              backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 16,
              borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.outlineVariant + '30',
            }}
          >
            <Text style={{ fontSize: 20, width: 28, textAlign: 'center' }}>⭐</Text>
            <Text style={{ flex: 1, fontSize: 16, fontWeight: '500', color: C.onSurface }}>스토어 별점 남기기</Text>
            <Text style={{ fontSize: 18, color: C.outlineVariant }}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => {
              try {
                await Share.share({
                  message: '[차곡차곡] 함께 정리 정돈 시작해요! 깔끔한 정리의 시작, 차곡차곡 앱을 추천합니다. 앱 스토어에서 확인해보세요!',
                });
              } catch (e) {
                console.error(e);
              }
            }}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 14,
              backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 16,
            }}
          >
            <Text style={{ fontSize: 20, width: 28, textAlign: 'center' }}>🎁</Text>
            <Text style={{ flex: 1, fontSize: 16, fontWeight: '500', color: C.onSurface }}>친구에게 앱 추천하기</Text>
            <Text style={{ fontSize: 18, color: C.outlineVariant }}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 이용약관 및 정책 */}
        <Text style={{ fontSize: 12, fontWeight: '700', color: C.onSurfaceVariant, paddingHorizontal: 20, paddingBottom: 6, letterSpacing: 0.5 }}>
          이용약관 및 정책
        </Text>
        <View style={{ borderRadius: 14, overflow: 'hidden', marginHorizontal: 16, marginBottom: 24 }}>
          <SettingRow icon="📄" label="이용약관" onPress={() => setTermsModalVisible(true)} />
          <SettingRow icon="🔒" label="개인정보 처리방침" onPress={() => setPolicyModalVisible(true)} />
          <SettingRow icon="📜" label="오픈소스 라이선스" onPress={() => setLicenseModalVisible(true)} />
        </View>

        {/* 데이터 초기화 버튼 */}
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              '초기화',
              '등록된 모든 정보를 앱을 처음 설치했을 때로 초기화합니다. 샘플 데이터는 유지됩니다. 정말 초기화할까요?',
              [
                { text: '아니오', style: 'cancel' },
                { text: '예', style: 'destructive', onPress: () => onReset?.() },
              ]
            );
          }}
          style={{ marginHorizontal: 16, marginTop: 32, marginBottom: 32, paddingVertical: 16, borderRadius: 14, alignItems: 'center', borderWidth: 1.5, borderColor: C.error }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: C.error }}>초기화</Text>
        </TouchableOpacity>
      </ScrollView>

      <LoginModal visible={loginModalVisible} onClose={() => setLoginModalVisible(false)} firebaseAuth={firebaseAuth} />
      <SignupModal visible={signupModalVisible} onClose={() => setSignupModalVisible(false)} firebaseAuth={firebaseAuth} />

      {/* 공지사항 모달 */}

      {/* 개인정보 관리 모달 */}
      <Modal visible={privacyModalVisible} transparent animationType="slide" onRequestClose={() => setPrivacyModalVisible(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
          activeOpacity={1} onPress={() => setPrivacyModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}
            style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: C.onSurface, marginBottom: 16 }}>개인정보 관리</Text>

            {/* 백업 / 불러오기 */}
            {user ? (
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: C.onSurfaceVariant, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  데이터 관리
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={onBackupLocal}
                    style={{ flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', backgroundColor: C.primary }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>💾 백업하기</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={onRestoreLocal}
                    style={{ flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', borderWidth: 1.5, borderColor: C.primary }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: C.primary }}>🔄 불러오기</Text>
                  </TouchableOpacity>
                </View>
                <Text style={{ fontSize: 12, color: C.onSurfaceVariant, marginTop: 8, lineHeight: 17 }}>
                  백업 시 저장 경로를 선택하여 .json 파일로 저장할 수 있습니다.{'\n'}불러오기 시 직접 이전에 저장한 백업 파일을 선택하여 복구합니다.
                </Text>
              </View>
            ) : (
              <View style={{ marginBottom: 24, padding: 14, backgroundColor: C.outlineVariant + '30', borderRadius: 12 }}>
                <Text style={{ fontSize: 14, color: C.onSurfaceVariant, lineHeight: 20, textAlign: 'center' }}>
                  로그인하면 데이터를 스마트폰 내부 저장소에{'\n'}백업하고 불러올 수 있습니다.
                </Text>
              </View>
            )}

            <View style={{ height: 12 }} />

            {user && (
              <TouchableOpacity
                onPress={() => {
                  Alert.alert('계정 삭제', '계정을 삭제하면 모든 데이터가 사라집니다. 정말 삭제할까요?', [
                    { text: '취소', style: 'cancel' },
                    { text: '삭제', style: 'destructive', onPress: async () => {
                      try {
                        await user.delete();
                        setPrivacyModalVisible(false);
                      } catch (e) {
                        Alert.alert('오류', '계정 삭제에 실패했습니다. 다시 로그인 후 시도해주세요.');
                      }
                    }},
                  ]);
                }}
                style={{ paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1.5, borderColor: C.error, marginBottom: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: C.error }}>계정 삭제</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}
              style={{ paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: C.primary }}>
              <Text style={{ fontSize: 17, fontWeight: '600', color: '#fff' }}>확인</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 공지사항 모달 */}
      <Modal visible={noticeModalVisible} transparent animationType="slide" onRequestClose={() => setNoticeModalVisible(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
          activeOpacity={1} onPress={() => setNoticeModalVisible(false)}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, height: '80%' }}>
             <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: C.outlineVariant + '30', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
               <Text style={{ fontSize: 18, fontWeight: '700', color: C.onSurface }}>🔔 공지사항</Text>
               <TouchableOpacity onPress={() => setNoticeModalVisible(false)}>
                 <Text style={{ fontSize: 16, color: C.primary, fontWeight: '600' }}>닫기</Text>
               </TouchableOpacity>
             </View>
             <NoticeView />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 이용약관 모달 */}
      <Modal visible={termsModalVisible} transparent animationType="slide" onRequestClose={() => setTermsModalVisible(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
          activeOpacity={1} onPress={() => setTermsModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}
            style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '90%', flexDirection: 'column' }}>
            <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: C.outlineVariant + '30', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: C.onSurface }}>📄 이용약관</Text>
              <TouchableOpacity onPress={() => setTermsModalVisible(false)}>
                <Text style={{ fontSize: 16, color: C.primary, fontWeight: '600' }}>닫기</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: C.primary, marginBottom: 4 }}>차곡차곡 서비스 이용약관</Text>
              <Text style={{ fontSize: 14, color: C.onSurface, lineHeight: 23 }}>
                {'\n■ 제 1 조 (목적)\n'}
                {'이 약관은 「뽀뽀필름(백승화)」(이하 "회사")와 이용 고객(이하 "회원") 간에 웹사이트 및 앱, 어플리케이션을 통해 회사가 제공하는 「차곡차곡」(이하 "서비스")의 가입조건 및 이용에 관한 제반 사항과 기타 필요한 사항을 규정함을 목적으로 합니다.\n'}
                {'\n■ 제 2 조 (약관의 효력 및 변경)\n'}
                {'① 본 약관의 내용은 서비스 화면에 게시하거나 기타의 방법으로 공지하고, 본 약관에 동의한 여러분 모두에게 그 효력이 발생합니다.\n'}
                {'② 회사는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 본 약관을 변경할 수 있습니다. 변경 시 시행일자 15일 전부터 공지사항을 통해 고지합니다.\n'}
                {'③ 회원은 개정약관에 동의하지 않을 경우 이용계약을 해지할 수 있으며, 서비스 내 \'계정 탈퇴\' 메뉴를 통해 처리할 수 있습니다.\n'}
                {'\n■ 제 3 조 (용어의 정의)\n'}
                {'① "회원"이란 본 약관에 동의하고 서비스에 이메일 계정을 등록하여 서비스를 이용하는 자를 말합니다.\n'}
                {'② "콘텐츠"란 회원이 서비스 내에 생성하고 저장하는 공간(Space), 가구, 구획, 물건(Object) 등의 모든 계층형 데이터 및 명칭을 말합니다.\n'}
                {'\n■ 제 4 조 (이용계약 체결)\n'}
                {'① 이용계약은 가입신청자가 약관에 동의하고 이메일 주소를 제공하여 회원가입 신청을 하고, 회사가 이를 승낙함으로써 체결됩니다.\n'}
                {'② 비정상적인 방법으로 가입을 시도하거나 이메일 도용 등이 확인된 경우 승낙을 유보하거나 거절할 수 있습니다.\n'}
                {'\n■ 제 5 조 (회원의 계정 및 비밀번호 관리 의무)\n'}
                {'① 회원의 계정과 비밀번호에 관한 관리책임은 회원 본인에게 있으며, 이를 제3자가 이용하도록 하여서는 안 됩니다.\n'}
                {'② 계정이 도용되거나 제3자가 사용하고 있음을 인지한 경우 즉시 회사에 통지하고 안내에 따라야 합니다.\n'}
                {'\n■ 제 6 조 (서비스의 제공 및 변경)\n'}
                {'① 회사는 집안의 공간과 물건을 계층적으로 분류·정리할 수 있는 관리 기능 및 데이터 동기화 서비스를 제공합니다.\n'}
                {'② 더 나은 서비스를 위해 소프트웨어 업데이트 버전을 제공할 수 있으며, 이에 따라 기능이 추가·변경·제거될 수 있습니다.\n'}
                {'③ 회사는 서비스 변경·종료로 인한 손해에 대해 회사의 고의 또는 중과실이 없는 한 배상하지 않습니다.\n'}
                {'\n■ 제 7 조 (콘텐츠의 관리 및 백업)\n'}
                {'① 회원이 입력한 콘텐츠의 권리와 책임은 회원 본인에게 있습니다.\n'}
                {'② 회사는 데이터 보호를 위해 최선의 조치를 다하나, 천재지변·시스템 오류 등으로 인한 데이터 유실에 대해서는 회사의 고의 또는 중과실이 없는 한 책임을 지지 않습니다. 회원은 중요한 데이터를 스스로 백업할 의무가 있습니다.\n'}
                {'\n■ 제 8 조 (서비스의 제한 및 중지)\n'}
                {'① 보수점검, 교체 및 고장, 통신두절 등 운영상 타당한 이유가 있는 경우 서비스를 일시적으로 중지할 수 있습니다.\n'}
                {'② 회원이 본 약관의 의무를 위반하거나 서비스 운영을 방해한 경우 서비스 이용을 제한하거나 계약을 해지할 수 있습니다.\n'}
                {'\n■ 제 9 조 (개인정보 보호)\n'}
                {'회사는 "개인정보보호법" 등 관계 법령에 따라 회원의 개인정보를 보호하기 위해 노력합니다.\n'}
                {'\n■ 제 10 조 (책임제한)\n'}
                {'① 회사는 천재지변 또는 이에 준하는 불가항력으로 인해 서비스를 제공할 수 없는 경우 책임이 면제됩니다.\n'}
                {'② 회원의 귀책사유로 인한 서비스 이용 장애에 대해서는 책임을 지지 않습니다.\n'}
                {'\n부칙\n'}
                {'본 약관은 2026년 4월 12일부터 적용됩니다.\n'}
              </Text>
            </ScrollView>
            {/* 외부 링크 버튼 */}
            <TouchableOpacity
              onPress={() => Linking.openURL('https://gotgam100.github.io/chagogx2/terms.html')}
              style={{ marginHorizontal: 20, marginTop: 12, marginBottom: 36, paddingVertical: 13, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: C.primary }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: C.primary }}>🔗 웹에서 전문 보기</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 개인정보 처리방침 모달 */}
      <Modal visible={policyModalVisible} transparent animationType="slide" onRequestClose={() => setPolicyModalVisible(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
          activeOpacity={1} onPress={() => setPolicyModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}
            style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '90%', flexDirection: 'column' }}>
            <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: C.outlineVariant + '30', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: C.onSurface }}>🔒 개인정보 처리방침</Text>
              <TouchableOpacity onPress={() => setPolicyModalVisible(false)}>
                <Text style={{ fontSize: 16, color: C.primary, fontWeight: '600' }}>닫기</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: C.primary, marginBottom: 4 }}>차곡차곡 개인정보 처리방침</Text>
              <Text style={{ fontSize: 14, color: C.onSurface, lineHeight: 23 }}>
                {'뽀뽀필름(백승화)은 이용자의 개인정보를 중요시하며, "개인정보보호법" 등 관련 법령을 준수하고 있습니다.\n'}
                {'\n■ 1. 수집하는 개인정보의 항목 및 수집 방법\n'}
                {'· 필수 수집 항목 (회원가입 시): 이메일 주소, 비밀번호(암호화 처리)\n'}
                {'· 자동 수집 항목: 서비스 이용 기록(공간·가구·구획·물건 구조 데이터), 기기 식별 정보(디바이스 ID), OS 버전, 앱 접속 로그\n'}
                {'\n■ 2. 개인정보의 수집 및 이용 목적\n'}
                {'· 회원 관리: 이메일 로그인 본인 확인, 부정이용 방지, 계정 탈퇴 처리\n'}
                {'· 서비스 제공: 기기 간 계층형 데이터 동기화, 백업 지원\n'}
                {'· 신규 서비스 개발 및 통계: 기능 개선을 위한 사용 통계 분석 및 오류 진단\n'}
                {'\n■ 3. 개인정보의 보유 및 이용 기간\n'}
                {'회원 탈퇴 후 30일 간 보관 후 영구 삭제합니다. 단, 관계 법령에 의해 보존이 필요한 경우 해당 기간 동안 보관합니다.\n'}
                {'\n■ 4. 개인정보의 파기 절차 및 방법\n'}
                {'앱 내 [설정 > 개인정보 관리 > 계정 삭제] 메뉴를 통해 탈퇴 요청 시, 계정 정보 및 서버에 동기화된 모든 데이터를 복구 불가능한 상태로 즉시 파기합니다.\n'}
                {'\n■ 5. 개인정보의 제3자 제공\n'}
                {'회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 단, 이용자 사전 동의 또는 법령에 의한 수사기관 요구 시 예외적으로 제공할 수 있습니다.\n'}
                {'\n■ 6. 개인정보 처리 위탁\n'}
                {'· 수탁업체: Google LLC (Firebase)\n'}
                {'· 위탁 업무: 앱 데이터 DB 보관 및 서버 클라우드 연동\n'}
                {'· 서버가 해외에 위치한 경우 데이터는 암호화되어 전송 및 보관됩니다.\n'}
                {'\n■ 7. 이용자의 권리와 그 행사 방법\n'}
                {'이용자는 언제든지 개인정보를 조회·수정하거나 탈퇴(동의 철회)를 요청할 수 있습니다. 앱 내 설정 메뉴 또는 이메일(qbeck104@gmail.com)로 요청하실 수 있습니다.\n'}
                {'\n■ 8. 개인정보의 안전성 확보 조치\n'}
                {'· 비밀번호 암호화: 비밀번호는 암호화되어 저장·관리됩니다.\n'}
                {'· 해킹 등에 대비한 기술적 대책: 서버 보안 수준을 최신 상태로 유지합니다.\n'}
                {'\n■ 9. 개인정보 보호책임자\n'}
                {'· 담당자: 정보보호 담당자\n'}
                {'· 연락처: qbeck104@gmail.com\n'}
                {'\n■ 10. 방침 변경 고지\n'}
                {'본 방침 변경 시 개정 최소 7일 전에 앱 내 공지사항을 통해 사전 고지합니다.\n'}
                {'\n부칙\n'}
                {'본 개인정보 처리방침은 2026년 4월 12일부터 적용됩니다.\n'}
              </Text>
            </ScrollView>
            {/* 외부 링크 버튼 */}
            <TouchableOpacity
              onPress={() => Linking.openURL('https://gotgam100.github.io/chagogx2/privacy.html')}
              style={{ marginHorizontal: 20, marginTop: 12, marginBottom: 36, paddingVertical: 13, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: C.primary }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: C.primary }}>🔗 웹에서 전문 보기</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 오픈소스 라이선스 모달 */}
      <Modal visible={licenseModalVisible} transparent animationType="slide" onRequestClose={() => setLicenseModalVisible(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
          activeOpacity={1} onPress={() => setLicenseModalVisible(false)}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, height: '85%' }}>
             <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: C.outlineVariant + '30', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
               <Text style={{ fontSize: 18, fontWeight: '700', color: C.onSurface }}>📜 오픈소스 라이선스</Text>
               <TouchableOpacity onPress={() => setLicenseModalVisible(false)}>
                 <Text style={{ fontSize: 16, color: C.primary, fontWeight: '600' }}>닫기</Text>
               </TouchableOpacity>
             </View>
             <ScrollView contentContainerStyle={{ padding: 20 }}>
               <Text style={{ fontSize: 14, color: C.onSurface, lineHeight: 24 }}>
                 {'이 앱은 다음과 같은 오픈소스 소프트웨어를 사용합니다.\n\n'}

                 {'■ React\n'}
                 {'Copyright (c) Meta Platforms, Inc.\n'}
                 {'MIT License\n\n'}

                 {'■ React Native\n'}
                 {'Copyright (c) Meta Platforms, Inc.\n'}
                 {'MIT License\n\n'}

                 {'■ Expo SDK\n'}
                 {'Copyright (c) 650 Industries, Inc. (aka Expo)\n'}
                 {'MIT License\n\n'}

                 {'■ Expo Vector Icons (@expo/vector-icons)\n'}
                 {'Copyright (c) 650 Industries, Inc.\n'}
                 {'MIT License\n\n'}

                 {'■ Expo Document Picker (expo-document-picker)\n'}
                 {'Copyright (c) 650 Industries, Inc.\n'}
                 {'MIT License\n\n'}

                 {'■ Expo File System (expo-file-system)\n'}
                 {'Copyright (c) 650 Industries, Inc.\n'}
                 {'MIT License\n\n'}

                 {'■ Expo Font (expo-font)\n'}
                 {'Copyright (c) 650 Industries, Inc.\n'}
                 {'MIT License\n\n'}

                 {'■ Expo Haptics (expo-haptics)\n'}
                 {'Copyright (c) 650 Industries, Inc.\n'}
                 {'MIT License\n\n'}

                 {'■ Expo Image Picker (expo-image-picker)\n'}
                 {'Copyright (c) 650 Industries, Inc.\n'}
                 {'MIT License\n\n'}

                 {'■ Expo Sharing (expo-sharing)\n'}
                 {'Copyright (c) 650 Industries, Inc.\n'}
                 {'MIT License\n\n'}

                 {'■ Expo Status Bar (expo-status-bar)\n'}
                 {'Copyright (c) 650 Industries, Inc.\n'}
                 {'MIT License\n\n'}

                 {'■ Expo Updates (expo-updates)\n'}
                 {'Copyright (c) 650 Industries, Inc.\n'}
                 {'MIT License\n\n'}

                 {'■ Firebase JavaScript SDK\n'}
                 {'Copyright (c) Google LLC\n'}
                 {'Apache License 2.0\n\n'}

                 {'■ React Native Async Storage\n'}
                 {'(@react-native-async-storage/async-storage)\n'}
                 {'Copyright (c) React Native Community\n'}
                 {'MIT License\n\n'}

                 {'■ React Native Gesture Handler\n'}
                 {'(react-native-gesture-handler)\n'}
                 {'Copyright (c) Software Mansion\n'}
                 {'MIT License\n\n'}

                 {'■ React Native Safe Area Context\n'}
                 {'(react-native-safe-area-context)\n'}
                 {'Copyright (c) Th3rdwave\n'}
                 {'MIT License\n'}
               </Text>
             </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ── MoveModal ────────────────────────────────────────────────────────────────
export function MoveModal({ visible, targets, onSelect, onCancel }) {
  const DEPTH_LABEL = ['공간', '가구', '구획'];
  const DEPTH_COLOR = [C.primary, '#2e7d6e', '#3a9080'];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
        activeOpacity={1} onPress={onCancel}
      >
        <TouchableOpacity activeOpacity={1} onPress={() => {}}
          style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 16, paddingBottom: 40, maxHeight: '70%' }}
        >
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: C.outlineVariant, alignSelf: 'center', marginBottom: 14 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: C.onSurface, paddingHorizontal: 20, marginBottom: 12 }}>이동할 위치 선택</Text>

          {targets.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <Text style={{ fontSize: 15, color: C.onSurfaceVariant }}>이동 가능한 위치가 없습니다</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {targets.map((t) => {
                const isRoot = t.depth === -1;
                const labelColor = isRoot ? C.primary : (DEPTH_COLOR[t.depth] || C.primary);
                const labelBg = labelColor + '20';
                const labelText = isRoot ? '홈' : (DEPTH_LABEL[t.depth] || '');

                return (
                  <TouchableOpacity
                    key={t.pathIds.join('/') || 'root'}
                    onPress={() => !t.isCurrent && onSelect(t.pathIds)}
                    activeOpacity={t.isCurrent ? 1 : 0.7}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 12,
                      paddingHorizontal: 20, paddingVertical: 14,
                      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.outlineVariant + '30',
                      backgroundColor: t.isCurrent ? C.surfaceHigh + '60' : 'transparent',
                    }}
                  >
                    {/* 깊이 인덴트 */}
                    {!isRoot && t.depth > 0 && <View style={{ width: t.depth * 16 }} />}
                    
                    <View style={{
                      paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
                      backgroundColor: labelBg,
                    }}>
                      <Text style={{ fontSize: 11, color: labelColor }}>
                        {labelText}
                      </Text>
                    </View>

                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 16, color: t.isCurrent ? C.onSurfaceVariant : C.onSurface }}>
                        {t.label}
                      </Text>
                      {t.isCurrent && (
                        <View style={{ backgroundColor: C.outlineVariant + '40', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                          <Text style={{ fontSize: 10, fontWeight: '600', color: C.onSurfaceVariant }}>현재 위치</Text>
                        </View>
                      )}
                    </View>
                    
                    {t.isCurrent && (
                      <Text style={{ fontSize: 16 }}>📍</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <TouchableOpacity
            onPress={onCancel}
            style={{ marginHorizontal: 20, marginTop: 16, paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1.5, borderColor: C.outlineVariant }}
          >
            <Text style={{ fontSize: 17, fontWeight: '600', color: C.onSurfaceVariant }}>취소</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}



function GridItem({ item, width, height, onPress, onLongPress, onUpdateQty, onManualQty, renderItem }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    // 카드를 누를 때 햅틱 효과 추가
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => onPress && onPress(item)}
      onLongPress={() => onLongPress && onLongPress(item)}
      delayLongPress={300}
      style={{
        width: width,
        height: height,
        padding: 6,
      }}
    >
      <Animated.View style={{ flex: 1, transform: [{ scale }] }}>
        {renderItem(item, false, onUpdateQty, onManualQty)}
      </Animated.View>
    </TouchableOpacity>
  );
}

export function HierarchySortableGrid({
  data, numColumns = 3, itemHeight, onItemPress, onItemLongPress, onUpdateQty, onManualQty, renderItem
}) {
  const SCREEN_WIDTH = Dimensions.get('window').width;
  // 외부 컨테이너(ScrollView)에 paddingHorizontal:16이 이미 적용됨 → 내부 패딩 없이 계산
  const OUTER_PADDING = 16;
  const ITEM_WIDTH = (SCREEN_WIDTH - OUTER_PADDING * 2) / numColumns;

  return (
    <View style={{ flex: 1 }}>
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        position: 'relative'
      }}>
        {data.map((item) => (
          <GridItem
            key={`grid-item-${item.id}`}
            item={item}
            width={ITEM_WIDTH}
            height={itemHeight}
            onPress={onItemPress}
            onLongPress={onItemLongPress}
            onUpdateQty={onUpdateQty}
            onManualQty={onManualQty}
            renderItem={renderItem}
          />
        ))}
      </View>
    </View>
  );
}

// ── InventoryView ────────────────────────────────────────────────────────────
export function InventoryView({ items, onItemPress, onUpdateQty, onManualQty }) {
  const groups = items.reduce((acc, it) => {
    const p = ['홈', ...it.pathLabels].join(' > ');
    if (!acc[p]) acc[p] = [];
    acc[p].push(it);
    return acc;
  }, {});
  const sections = Object.keys(groups).map(k => ({ title: k, data: groups[k] }));

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.outlineVariant+'30' }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: C.onSurface }}>🗃 물건들 목록 ({items.length}종류)</Text>
      </View>

      {items.length === 0 ? (
        <View style={S.searchEmpty}>
          <Text style={{ fontSize:36 }}>🗃</Text>
          <Text style={S.searchEmptyText}>아직 등록된 물건이 없어요</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section: { title } }) => (
            <View style={{ backgroundColor: C.surfaceHigh, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginTop: 12, marginBottom: 8 }}>
              <Text style={{ fontSize:13, fontWeight:'600', color:C.onSurfaceVariant }}>{title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[S.searchResultItem, { paddingHorizontal: 4, paddingVertical: 10 }]}
              onPress={() => onItemPress && onItemPress(item)}
              activeOpacity={0.7}
            >
              <View style={S.searchResultIcon}>
                <PhotoOrIcon photoUri={item.photoUri} icon={item.icon} circleSize={40} iconSize={24} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[S.searchResultLabel, { fontSize: 15 }]}>{item.label}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TouchableOpacity 
                   onPress={(e) => { e.stopPropagation(); onUpdateQty && onUpdateQty(item.id, -1); }}
                   style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 16, color: C.onSurfaceVariant }}>-</Text>
                </TouchableOpacity>
                
                <View style={S.countBadge}>
                  <Text style={[S.countText, { fontSize: 13 }]}>{item.quantity ?? 1}개</Text>
                </View>

                <TouchableOpacity 
                   onPress={(e) => { e.stopPropagation(); onUpdateQty && onUpdateQty(item.id, 1); }}
                   onLongPress={(e) => { e.stopPropagation(); onManualQty && onManualQty(item.id); }}
                   delayLongPress={400}
                   style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 16, color: C.onSurfaceVariant }}>+</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

// ── SpaceModelPlayground ─────────────────────────────────────────────────────
export function SpaceModelPlayground() {
  return (
    <View style={{ flex: 1, backgroundColor: C.background, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: C.primary, fontFamily: 'Galmuri7' }}>
        실험중입니다만...
      </Text>
    </View>
  );
}
